// Node-only local fixture management. Never imported by the production Worker.
import fs from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
const root='.weekly-private/rehearsal';
const fixedId=key=>{const h=createHash('sha256').update('weekly-rehearsal-v1:'+key).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
export async function manageRehearsal(DB,mode){
  const a=JSON.parse(fs.readFileSync(root+'/article.json','utf8'));if(a.status!=='draft'||a.publishedAt||a.editionNumber)throw Error('Only the private unpublished fixture is allowed.');
  const id=a.id,sql=(q,...v)=>DB.prepare(q).bind(...v);
  await DB.exec('CREATE TABLE IF NOT EXISTS local_rehearsals (article_id TEXT PRIMARY KEY, initialized INTEGER NOT NULL, generation TEXT NOT NULL)');
  const existing=await sql('SELECT initialized,generation FROM local_rehearsals WHERE article_id=?',id).first();
  if(mode==='status')return {articleId:id,generation:existing?.generation,comments:(await sql('SELECT status,COUNT(*) AS count FROM comments WHERE article_id=? GROUP BY status',id).all()).results,reactions:await sql('SELECT COALESCE(SUM(value=1),0) useful,COALESCE(SUM(value=-1),0) notForMe FROM reactions WHERE article_id=?',id).first()};
  if(mode==='seed'&&existing)return manageRehearsal(DB,'status');
  if(!['seed','reset','remove'].includes(mode))throw Error('Unknown local fixture command.');
  if(!existing){const backup={article:await sql('SELECT * FROM articles WHERE id=?',id).first(),comments:(await sql('SELECT * FROM comments WHERE article_id=?',id).all()).results,reactions:(await sql('SELECT * FROM reactions WHERE article_id=?',id).all()).results,reports:(await sql('SELECT * FROM reports WHERE comment_id IN (SELECT id FROM comments WHERE article_id=?)',id).all()).results};if(!fs.existsSync(root+'/previous-local-demo.json'))fs.writeFileSync(root+'/previous-local-demo.json',JSON.stringify(backup,null,2),{flag:'wx'});}
  const generation=randomUUID(),queries=[sql('DELETE FROM reports WHERE comment_id IN (SELECT id FROM comments WHERE article_id=?)',id),sql('DELETE FROM audit WHERE target IN (SELECT id FROM comments WHERE article_id=?)',id),sql('DELETE FROM comments WHERE article_id=?',id),sql('DELETE FROM reaction_ops WHERE article_id=?',id),sql('DELETE FROM reactions WHERE article_id=?',id),sql('DELETE FROM overrides WHERE article_id=?',id),sql('INSERT INTO local_rehearsals VALUES(?,1,?) ON CONFLICT(article_id) DO UPDATE SET initialized=1,generation=excluded.generation',id,generation)];
  if(mode==='remove')queries.push(sql('UPDATE articles SET active=0 WHERE id=?',id));
  else{
    queries.push(sql('INSERT INTO articles(id,path,comments_enabled,reactions_enabled,active) VALUES(?,?,1,1,1) ON CONFLICT(id) DO UPDATE SET path=excluded.path,comments_enabled=1,reactions_enabled=1,active=1',id,'/rehearsal/article/'));
    const comments=[['Sample Rally Robin','approved','Sample comment: The fifth-break-chance explanation helped me follow the Wuhan turning point.','robin@example.com'],['Sample Baseline Bea','approved','Sample comment: Thanks for separating completed finals from the coming weekend. No real visitor wrote this.',null],['Sample Volley Val','approved','Sample discussion example: I would like a clearer reminder that the ranking sources are incomplete. This is the reported sample.','val@example.com'],['Sample Court Casey','pending','Sample comment awaiting review: I found the Shanghai and Wuhan comparison interesting.',null],['Sample Match Morgan','pending','Sample comment awaiting review: Please keep the source limitations visible in the ranking tables.','morgan@example.com'],['Sample Net Nico','rejected','Sample rejected comment: This unrelated message belongs in a different discussion.',null],['Sample Promo Pat','spam','Sample harmless spam demonstration: imaginary tennis gadget promotion, no real link or offer.','pat@example.com'],['Sample Sideline Sam','hidden','Sample hidden comment: This intentionally off-topic example demonstrates Hide and Restore.',null]];
    comments.forEach(([name,status,body,email],i)=>queries.push(sql('INSERT INTO comments(id,article_id,name,body,email,created_at,status,suspected_spam,submission_key) VALUES(?,?,?,?,?,?,?,?,?)',fixedId('comment-'+i),id,name,body,email,new Date(Date.now()-(8-i)*60000).toISOString(),status,+(status==='spam'),fixedId('submission-'+i))));
    queries.push(sql('INSERT INTO reports(comment_id,reporter,created_at) VALUES(?,?,?)',fixedId('comment-2'),'local-rehearsal-sample-report',new Date().toISOString()));
    for(let i=0;i<14;i++)queries.push(sql('INSERT INTO reactions(article_id,browser_id,value,version,updated_at) VALUES(?,?,?,1,?)',id,fixedId('sample-browser-'+i),i<12?1:-1,new Date().toISOString()));
  }
  await DB.batch(queries);fs.writeFileSync(root+'/generation.txt',generation);return manageRehearsal(DB,'status');
}
