import {digest,fail} from './auth.mjs';

// Account-owner limits in shared D1, not isolate memory or client-provided IDs.
// Authentication and CSRF must succeed before calling this function. Outcome
// recovery and withdrawal remain separate from expensive preview/publish work.
export async function publicationLimit(env,actor,path,action,now=Date.now()){
 const scope=path.endsWith('/preview')?'preview':path.endsWith('/export')?'export':path.endsWith('/mutate')?
  (['unpublish','trash','restore','purge'].includes(action)?'manage':'write'):null;
 if(!scope)return;
 const maximum={preview:20,write:30,manage:60,export:6}[scope];
 const epoch=Math.floor(now/600000),expires=(epoch+1)*600;
 const key='publishing:'+await digest(env,`${actor}|${scope}|${epoch}`);
 await env.DB.prepare('DELETE FROM limits WHERE key IN (SELECT key FROM limits WHERE expires<=? AND key LIKE ? LIMIT 100)').bind(Math.floor(now/1000),'publishing:%').run();
 const row=await env.DB.prepare('INSERT INTO limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=MIN(count+1,?) RETURNING count').bind(key,expires,maximum+1).first();
 if(!row||!Number.isSafeInteger(row.count))fail(503,'Publication rate protection is unavailable.');
 if(row.count>maximum)fail(429,'Publication request limit reached. Wait up to ten minutes. Your saved content is unchanged; check the existing operation outcome before retrying a write.');
}
