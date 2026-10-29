// Temporary test deployment only. Never imported by the production entrypoint.
import real from '../../backend/private-admin/entry.mjs';
import {owner,digest} from '../../backend/src/auth.mjs';
export default {async fetch(request,env){
 if(!new URL(request.url).pathname.startsWith('/publishing-test/'))return real.fetch(request,env);
 try{
  await owner(request,env);
  if(!env.PUBLISHING_TEST||!env.TEST_DATABASE_ID)throw Error();
  const headers=new Headers(request.headers);
  // Internal service-binding transport only; never returned to the browser/logged.
  headers.set('x-cu-test-policy',env.ACCESS_POLICY_READ_TOKEN);
  headers.set('x-cu-test-signing',await digest(env,'isolated-publishing:'+env.TEST_DATABASE_ID));
  return await env.PUBLISHING_TEST.fetch(new Request(request,{headers}));
 }catch{return new Response('Private test unavailable.',{status:403,headers:{'cache-control':'private, no-store'}});}
}};
