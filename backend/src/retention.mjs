// No article/draft deletion. No content or identity in cleanup telemetry.
export async function cleanup(env,{full=false,at=Date.now()}={}){
 const kind=full?'daily':'hourly',iso=new Date(at).toISOString(),seconds=Math.floor(at/1000),day=86400000;
 const q=(s,...a)=>env.DB.prepare(s).bind(...a);
 await q('INSERT INTO retention_health(kind,last_attempt,failed) VALUES(?,?,0) ON CONFLICT(kind) DO UPDATE SET last_attempt=excluded.last_attempt',kind,iso).run();
 try{
 const statements=[
 q('DELETE FROM limits WHERE expires<=?',seconds),
 q('DELETE FROM reaction_ops WHERE expires<=?',seconds),
 q('DELETE FROM comment_reaction_ops WHERE expires<=?',seconds),
 q('UPDATE reports SET reporter=lower(hex(randomblob(16))) WHERE length(reporter)=64 AND created_at<=?',new Date(at-23*3600000).toISOString())
 ];
 if(full)statements.push(
 q("DELETE FROM reports WHERE comment_id IN (SELECT id FROM comments WHERE status IN ('pending','rejected','spam') AND created_at<=?)",new Date(at-30*day).toISOString()),
 q("DELETE FROM comments WHERE status IN ('pending','rejected','spam') AND created_at<=?",new Date(at-30*day).toISOString()),
 q('UPDATE comments SET email=NULL WHERE email IS NOT NULL AND created_at<=?',new Date(at-30*day).toISOString()),
 q('DELETE FROM audit WHERE at<=?',new Date(at-90*day).toISOString())
 );
 statements.push(q('UPDATE retention_health SET last_success=?,failed=0 WHERE kind=?',iso,kind));
 await env.DB.batch(statements);
 return {ok:true,kind,at:iso};
 }catch{
  try{await q('UPDATE retention_health SET failed=1 WHERE kind=?',kind).run();}catch{}
  throw Error('Retention cleanup failed; inspect scheduled-event status. No private content logged.');
 }
}
export async function scheduled(controller,env){
 // Hourly short-lived cleanup; daily content cleanup at 03:00 UTC.
 await cleanup(env,{full:controller.cron==='0 3 * * *',at:controller.scheduledTime});
}

