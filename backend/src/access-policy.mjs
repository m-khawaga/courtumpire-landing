// Independent Access MFA is enforced before an application token is issued;
// unlike IdP MFA, it does not populate the token's AMR claim. Keep that trust
// tied to the live, pinned application policy rather than an unchecked flag.
const seconds=value=>{const m=/^(\d+)(m|h)$/.exec(value||'');return m?Number(m[1])*(m[2]==='h'?3600:60):NaN;};
const single=(items,predicate)=>Array.isArray(items)&&items.length===1&&predicate(items[0]);
const totp=m=>m?.mfa_disabled===false&&single(m.allowed_authenticators,x=>x==='totp')&&Number.isFinite(seconds(m.session_duration))&&seconds(m.session_duration)<=3600;
export async function verifyIndependentMfa(payload,env,fetcher=fetch,report=()=>{}){
 const deny=code=>{report(code);return false;};
 if(!/^[a-f0-9]{32}$/.test(env.ACCESS_ACCOUNT_ID||'')||!/^[a-f0-9-]{36}$/.test(env.ACCESS_APP_ID||'')||!env.ACCESS_POLICY_ID||!env.ACCESS_GOOGLE_IDP_ID||!env.ACCESS_POLICY_READ_TOKEN)return false;
 if(payload.type!=='app'||!Number.isInteger(payload.iat)||!Number.isInteger(payload.exp)||payload.exp-payload.iat>3600||payload.iat>Date.now()/1000+30)return deny('application-session');
 try{
  const response=await fetcher(`https://api.cloudflare.com/client/v4/accounts/${env.ACCESS_ACCOUNT_ID}/access/apps/${env.ACCESS_APP_ID}`,{headers:{authorization:`Bearer ${env.ACCESS_POLICY_READ_TOKEN}`},redirect:'manual',signal:AbortSignal.timeout(5000)});
  if(!response.ok)return deny('policy-api-'+response.status);
  const data=await response.json(),app=data.result;
  if(!data.success||app?.id!==env.ACCESS_APP_ID||app.type!=='self_hosted'||app.aud!==env.ACCESS_AUD||app.domain!==new URL(env.ADMIN_ORIGIN).hostname||!totp(app.mfa_config)||seconds(app.session_duration)>3600||!Number.isFinite(seconds(app.session_duration)))return deny('application-policy');
  if(!single(app.allowed_idps,id=>id===env.ACCESS_GOOGLE_IDP_ID)||!single(app.policies,p=>p.id===env.ACCESS_POLICY_ID))return deny('policy-binding');
  const policy=app.policies[0];
  if(policy.decision!=='allow'||!Array.isArray(policy.exclude)||policy.exclude.length||!single(policy.include,r=>Object.keys(r).length===1&&r.email?.email===env.OWNER_EMAILS)||!single(policy.require,r=>Object.keys(r).length===1&&r.login_method?.id===env.ACCESS_GOOGLE_IDP_ID))return deny('owner-policy');
  if(policy.mfa_config&&!totp(policy.mfa_config))return deny('policy-mfa');
  const changed=Math.max(Date.parse(app.updated_at),Date.parse(policy.updated_at));
  return Number.isFinite(changed)&&payload.iat>=Math.floor(changed/1000)||deny('session-predates-policy');
 }catch(e){return deny('policy-unavailable-'+(['TypeError','SyntaxError','TimeoutError','AbortError'].includes(e.name)?e.name:'other'));}
}
