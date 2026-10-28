import {createRemoteJWKSet,jwtVerify,SignJWT} from 'jose';
import {verifyIndependentMfa} from './access-policy.mjs';
export const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const bytes=s=>new TextEncoder().encode(s);
export async function owner(request,env,verify=jwtVerify,independentMfa=verifyIndependentMfa){
  if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_ISSUER||'')||!env.ACCESS_AUD||!env.OWNER_EMAILS||new URL(request.url).origin!==env.ADMIN_ORIGIN)fail(403,'Admin authentication is unavailable.');
  const deny=code=>{throw Object.assign(new Error('Authentication required.'),{status:403,authCode:code});};
  const token=request.headers.get('cf-access-jwt-assertion');if(!token)deny('assertion-missing');
  let payload;
  try{({payload}=await verify(token,createRemoteJWKSet(new URL(env.ACCESS_ISSUER+'/cdn-cgi/access/certs')),{issuer:env.ACCESS_ISSUER,audience:env.ACCESS_AUD,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email']}));}
  catch(e){deny(({ERR_JWT_EXPIRED:'expired',ERR_JWS_SIGNATURE_VERIFICATION_FAILED:'signature-invalid',ERR_JWT_CLAIM_VALIDATION_FAILED:'claims-invalid',ERR_JWKS_TIMEOUT:'keys-unavailable'})[e.code]||'verification-failed');}
  if(!env.OWNER_EMAILS.split(',').map(s=>s.trim().toLowerCase()).includes(String(payload.email).toLowerCase()))deny('owner-denied');
  if(env.REQUIRE_ACCESS_MFA==='true'){
   if(env.ACCESS_MFA_MODE==='access-independent'){
    let reason='independent-mfa-policy-unverified';
    if(!await independentMfa(payload,env,fetch,code=>{reason=code;}))deny(reason);
   }else if(!Array.isArray(payload.amr)||!payload.amr.includes('mfa'))deny(Array.isArray(payload.amr)?'mfa-marker-absent':'amr-absent');
  }
  return payload.sub;
}
export function secret(env){if(!env.SIGNING_SECRET||env.SIGNING_SECRET.length<32)fail(503,'Engagement is not configured.');return bytes(env.SIGNING_SECRET);}
export async function signed(env,payload,subject,ttl){return new SignJWT(payload).setProtectedHeader({alg:'HS256'}).setSubject(subject).setIssuer('courtumpire-weekly').setAudience('weekly').setIssuedAt().setExpirationTime(Math.floor(Date.now()/1000)+ttl).sign(secret(env));}
export async function verifySigned(env,token){try{return (await jwtVerify(token,secret(env),{issuer:'courtumpire-weekly',audience:'weekly',algorithms:['HS256'],requiredClaims:['exp','iat','sub']})).payload;}catch{fail(403,'Token expired or invalid.');}}
export async function browser(request,env,articleId){const token=request.headers.get('authorization')?.replace(/^Bearer /,'');if(!token)fail(403,'Enable a browser reaction token first.');const p=await verifySigned(env,token);if(p.purpose!=='browser'||p.articleId!==articleId)fail(403,'Invalid article token.');return p.sub;}
export async function csrf(request,env,actor){if(request.headers.get('origin')!==env.ADMIN_ORIGIN)fail(403,'Origin rejected.');const p=await verifySigned(env,request.headers.get('x-csrf-token'));if(p.purpose!=='csrf'||p.sub!==actor)fail(403,'CSRF check failed.');}
export async function digest(env,value){const key=await crypto.subtle.importKey('raw',secret(env),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,bytes(value))),b=>b.toString(16).padStart(2,'0')).join('');}
export async function turnstile(env,token,action,fetcher=fetch){
  if(!env.TURNSTILE_SECRET||!env.TURNSTILE_HOSTNAME||typeof token!=='string'||!token||token.length>2048)fail(403,'Complete the anti-abuse check.');
  let result;try{const r=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();result=await r.json();}catch{fail(503,'Anti-abuse verification unavailable. Please retry.');}
  const age=Date.now()-Date.parse(result.challenge_ts);if(result.success!==true||result.hostname!==env.TURNSTILE_HOSTNAME||result.action!==action||!Number.isFinite(age)||age< -30000||age>300000)fail(403,'Anti-abuse check expired, was used, or failed. Please retry.');
}
