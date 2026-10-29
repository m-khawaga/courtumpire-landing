import {validate} from '../../weekly-core/contract.mjs';
import {article,editionPath} from '../../weekly-core/render.mjs';
import {createHash} from 'node:crypto';
// Offline disaster-recovery tool. Never bundled in a Worker or served publicly.
// The SQL is generated only from validated values, with SQL string escaping.
const literal=v=>v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replaceAll("'","''")+"'";
const sha=s=>createHash('sha256').update(s).digest('hex');
export function restoreSQL(b){
 if(!b||b.format!=='courtumpire-published-backup/v1'||!Array.isArray(b.revisions)||!b.revisions.length||b.revisions.length>35||!Array.isArray(b.slugs))throw Error('Invalid or oversized recovery bundle.');
 const latest=b.edition,a=latest?.article;if(!a||validate(a).length||!['published','unpublished','trash'].includes(latest.status))throw Error('Invalid latest edition.');
 const revisions=b.revisions.map((r,i)=>{const x=JSON.parse(r.content);if(validate(x).length||x.id!==a.id||x.publishedAt!==a.publishedAt||x.editionNumber!==a.editionNumber||r.revision!==i+1||sha(r.content)!==r.hash||!['published','unpublished','trash'].includes(r.status))throw Error('Revision integrity failure.');JSON.parse(r.snapshot);JSON.parse(r.comparison);if(typeof r.cover!=='string'||!r.cover.startsWith('data:image/png;base64,')||r.cover.length>240000)throw Error('Invalid cover.');return {...r,rendered:article(x,{comparison:JSON.parse(r.comparison)})};});
 const last=revisions.at(-1);if(last.revision!==latest.revision||last.hash!==latest.hash||JSON.stringify(a)!==last.content)throw Error('Latest revision mismatch.');
 if(!b.slugs.includes(a.slug)||b.slugs.some(s=>!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(s)))throw Error('Invalid slug history.');
 const insert=(table,values)=>({sql:`INSERT INTO ${table} VALUES(${values.map(()=>'?').join(',')});`,params:values});
 // No UPSERT: an existing ID, number, URL or registry record aborts restoration.
 const lines=[`INSERT INTO publishing_state(id) SELECT 1 WHERE EXISTS(SELECT 1 FROM editions WHERE id=${literal(a.id)}) OR EXISTS(SELECT 1 FROM articles WHERE id=${literal(a.id)});`];
 for(const r of revisions)lines.push(insert('edition_revisions',[a.id,r.revision,r.hash,r.content,r.rendered,r.cover,r.snapshot,r.comparison,r.status,r.changed_at]));
 const at=new Date().toISOString();lines.push(insert('editions',[a.id,a.slug,a.editionNumber,'unpublished',last.revision+1,last.hash,last.content,last.rendered,last.cover,last.snapshot,last.comparison,a.publishedAt,at]));
 for(const slug of b.slugs)lines.push(insert('edition_slugs',[slug,a.id]));
 lines.push(`INSERT INTO articles(id,path,comments_enabled,reactions_enabled,active,title) VALUES(${[a.id,editionPath(a),+a.commentsEnabled,+a.reactionsEnabled,0,a.title].map(literal).join(',')});`);
 lines.push(`UPDATE publishing_state SET version=version+1,next_edition=MAX(next_edition,${a.editionNumber+1}) WHERE id=1;`);
 if(lines.length>48)throw Error('Recovery exceeds bounded transaction. Use full D1 disaster recovery.');return lines.map(s=>typeof s==='string'?{sql:s,params:[]}:s);
}
