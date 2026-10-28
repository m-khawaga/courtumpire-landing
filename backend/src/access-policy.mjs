// Independent Access MFA is enforced before an application token is issued;
// unlike IdP MFA, it does not populate the token's AMR claim. Keep that trust
// tied to the live, pinned application policy rather than an unchecked flag.
const seconds=value=>{const m=/^(\d+)(m|h)$/.exec(value||'');return m?Number(m[1])*(m[2]==='h'?3600:60):NaN;};
const single=(items,predicate)=>Array.isArray(items)&&items.length===1&&predicate(items[0]);
const totp=m=>m?.mfa_disabled===false&&single(m.allowed_authenticators,x=>x==='totp')&&Number.isFinite(seconds(m.session_duration))&&seconds(m.session_duration)<=3600;
const attemptMs=5000,totalMs=10500;
const transient=e=>e?.name==='TimeoutError'||e?.name==='TypeError'||e?.retryable===true;
// Read-only GET only. No cached grants, background retries or shared request state.
async function readApplication(env,fetcher,deadline){
 for(let attempt=0;attempt<2;attempt++){
  const started=Date.now(),remaining=deadline-started;
  if(remaining<=0)throw new DOMException('Policy read deadline','TimeoutError');
  const signal=AbortSignal.timeout(Math.min(attemptMs,remaining));
  try{
   const response=await fetcher(`https://api.cloudflare.com/client/v4/accounts/${env.ACCESS_ACCOUNT_ID}/access/apps/${env.ACCESS_APP_ID}`,{headers:{authorization:`Bearer ${env.ACCESS_POLICY_READ_TOKEN}`},redirect:'manual',cache:'no-store',signal});
   if(!response.ok){
    // A stream cleanup error must not turn an explicit denial into a retry.
    try{await response.body?.cancel();}catch{}
    throw Object.assign(Error('Policy read failed'),{policyReason:'policy-api-'+response.status,retryable:[502,503,504].includes(response.status)&&!response.headers.has('retry-after')});
   }
   const data=await response.json();
   // Reject late completion even if an underlying reader fails to honor abort.
   if(signal.aborted||Date.now()-started>=attemptMs)throw new DOMException('Policy read deadline','TimeoutError');
   return data;
  }catch(e){
   if(attempt!==0||!transient(e)||Date.now()>=deadline)throw e;
   // Small bounded jitter avoids synchronized retries; not security randomness.
   await new Promise(resolve=>setTimeout(resolve,250+crypto.getRandomValues(new Uint8Array(1))[0]%251));
  }
 }
}
export async function verifyIndependentMfa(payload,env,fetcher=fetch,report=()=>{}){
 const deny=code=>{report(code);return false;};
 const started=Date.now();
 if(!/^[a-f0-9]{32}$/.test(env.ACCESS_ACCOUNT_ID||'')||!/^[a-f0-9-]{36}$/.test(env.ACCESS_APP_ID||'')||!env.ACCESS_POLICY_ID||!env.ACCESS_GOOGLE_IDP_ID||!env.ACCESS_POLICY_READ_TOKEN)return false;
 if(payload.type!=='app'||!Number.isInteger(payload.iat)||!Number.isInteger(payload.exp)||payload.exp<=started/1000||payload.exp-payload.iat>3600||payload.iat>started/1000+30)return deny('application-session');
 try{
  const data=await readApplication(env,fetcher,Math.min(started+totalMs,payload.exp*1000)),app=data.result;
  if(Date.now()-started>=totalMs||payload.exp<=Date.now()/1000||(payload.nbf!==undefined&&payload.nbf>Date.now()/1000))return deny('application-session');
  if(!data.success||app?.id!==env.ACCESS_APP_ID||app.type!=='self_hosted'||app.aud!==env.ACCESS_AUD||app.domain!==new URL(env.ADMIN_ORIGIN).hostname||!totp(app.mfa_config)||seconds(app.session_duration)>3600||!Number.isFinite(seconds(app.session_duration)))return deny('application-policy');
  if(!single(app.allowed_idps,id=>id===env.ACCESS_GOOGLE_IDP_ID)||!single(app.policies,p=>p.id===env.ACCESS_POLICY_ID))return deny('policy-binding');
  const policy=app.policies[0];
  if(policy.decision!=='allow'||!Array.isArray(policy.exclude)||policy.exclude.length||!single(policy.include,r=>Object.keys(r).length===1&&r.email?.email===env.OWNER_EMAILS)||!single(policy.require,r=>Object.keys(r).length===1&&r.login_method?.id===env.ACCESS_GOOGLE_IDP_ID))return deny('owner-policy');
  if(policy.mfa_config&&!totp(policy.mfa_config))return deny('policy-mfa');
  const changed=Math.max(Date.parse(app.updated_at),Date.parse(policy.updated_at));
  return Number.isFinite(changed)&&payload.iat>=Math.floor(changed/1000)||deny('session-predates-policy');
 }catch(e){return deny(e.policyReason||'policy-unavailable-'+(['TypeError','SyntaxError','TimeoutError','AbortError'].includes(e.name)?e.name:'other'));}
}
