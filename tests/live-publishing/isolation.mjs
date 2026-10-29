export async function isolation(request,env){
 if(new URL(request.url).origin!=='https://admin.courtumpire.com'||!new URL(request.url).pathname.startsWith('/publishing-test/')||
 !/^[0-9a-f-]{36}$/.test(env.TEST_DATABASE_ID||'')||
 ['c55230e5-f748-4c57-ba32-21e7de4a2f01','ae856293-8b0e-4a42-89dd-5d148bebd329'].includes(env.TEST_DATABASE_ID)||env.DRAFTS||env.WEEKLY||
 !request.headers.get('x-cu-test-policy')||!request.headers.get('x-cu-test-signing'))throw Error('Isolation guard');
 const marker=await env.DB.prepare('SELECT database_id FROM publishing_test_guard WHERE id=1').first();
 if(marker?.database_id!==env.TEST_DATABASE_ID)throw Error('Isolation marker');
 return {...env,ACCESS_POLICY_READ_TOKEN:request.headers.get('x-cu-test-policy'),SIGNING_SECRET:request.headers.get('x-cu-test-signing')};
}
