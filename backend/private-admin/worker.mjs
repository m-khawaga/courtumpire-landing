import {owner,csrf,signed,fail} from '../src/auth.mjs';
import {validate,validateWorkingDraft} from '../../weekly-core/contract.mjs';
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'content-type':'application/json; charset=utf-8'}});
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(v);
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
async function body(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))fail(415,'JSON required.');
 const reader=request.body?.getReader();if(!reader)fail(400,'JSON required.');
 let size=0,parts=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>550000){await reader.cancel();fail(413,'Draft exceeds 500 KB.');}parts.push(value);}
 const bytes=new Uint8Array(size);let p=0;for(const part of parts){bytes.set(part,p);p+=part.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{fail(400,'Invalid JSON.');}
}
const rowJSON=row=>({...row,article:JSON.parse(row.content),content:undefined,actor:undefined});
export function createPrivateHandler(deps={}){
 return async(request,env)=>{
  let response;const url=new URL(request.url);
  const nonce=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18))));
  try{
   // Origin binding and signature validation apply to every route, including assets and service forwarding.
   const actor=await (deps.owner||owner)(request,env);
   if(url.origin!==env.ADMIN_ORIGIN)fail(403,'Admin origin rejected.');
   if(url.pathname==='/admin'||url.pathname.startsWith('/admin/')){
    if(!env.WEEKLY)fail(503,'Moderation is not activated. Private drafts remain available.');
    response=await env.WEEKLY.fetch(request);
   }else if(url.pathname==='/private/api/session'&&request.method==='GET'){
    response=json({csrf:await signed(env,{purpose:'csrf'},actor,900),identity:env.OWNER_EMAILS});
   }else if(url.pathname.startsWith('/private/api/')){
    if(!env.DRAFTS)fail(503,'Private storage unavailable.');
    const q=(s,...args)=>env.DRAFTS.prepare(s).bind(...args);
    const path=url.pathname,parts=path.split('/'),id=parts[4];
    const offset=Number(url.searchParams.get('offset')||0);
    if(!Number.isSafeInteger(offset)||offset<0||offset>100000)fail(400,'Invalid page.');
    if(request.method==='GET'&&path==='/private/api/drafts'){
     const result=await q('SELECT id,edition_id,title,revision,hash,saved_at FROM drafts ORDER BY saved_at DESC,id LIMIT 21 OFFSET ?',offset).all();
     response=json({drafts:result.results.slice(0,20),next:result.results.length>20?offset+20:null});
    }else if(request.method==='GET'&&parts[3]==='drafts'&&uuid(id)&&parts.length===5){
     const row=await q('SELECT * FROM drafts WHERE id=?',id).first();if(!row)fail(404,'Draft not found.');response=json(rowJSON(row));
    }else if(request.method==='GET'&&parts[3]==='drafts'&&uuid(id)&&parts[5]==='revisions'){
     if(parts.length===6){const r=await q('SELECT revision,hash,saved_at FROM draft_revisions WHERE draft_id=? ORDER BY revision DESC LIMIT 21 OFFSET ?',id,offset).all();response=json({revisions:r.results.slice(0,20),next:r.results.length>20?offset+20:null});}
     else if(parts.length===7&&/^[1-9][0-9]*$/.test(parts[6])){const r=await q('SELECT content,revision,hash,saved_at FROM draft_revisions WHERE draft_id=? AND revision=?',id,Number(parts[6])).first();if(!r)fail(404,'Revision not found.');response=json(rowJSON(r));}
     else fail(404,'Not found.');
    }else if(request.method==='POST'&&path==='/private/api/drafts'){
     await csrf(request,env,actor);const b=await body(request);
     if(!b||Object.keys(b).some(k=>!['id','expectedRevision','expectedHash','article'].includes(k)))fail(400,'Unknown save field.');
     const errors=validateWorkingDraft(b.article);if(errors.length){response=json({error:'Draft structure is invalid.',errors},422);}
     else{
      const content=JSON.stringify(b.article);if(new TextEncoder().encode(content).length>500000)fail(413,'Draft exceeds 500 KB.');
      const digest=await hash(content),at=new Date().toISOString(),edition=b.article.id||null,title=b.article.title||'Untitled edition';
      let savedId=b.id;
      if(savedId===null){
       if(b.expectedRevision!==null||b.expectedHash!==null)fail(400,'New drafts have no saved version.');
       savedId=crypto.randomUUID();
       try{await q('INSERT INTO drafts VALUES(?,?,?,?,1,?,?,?,?)',savedId,edition,title,content,digest,at,at,actor).run();}
       catch(e){if(String(e).includes('UNIQUE'))fail(409,'A draft with this edition ID already exists. Open it rather than creating a duplicate.');throw e;}
      }else{
       if(!uuid(savedId)||!Number.isSafeInteger(b.expectedRevision)||typeof b.expectedHash!=='string')fail(400,'Expected saved version required.');
       const old=await q('SELECT * FROM drafts WHERE id=?',savedId).first();if(!old)fail(404,'Draft not found.');
       if(old.revision!==b.expectedRevision||old.hash!==b.expectedHash)fail(409,'A newer revision exists. Export your changes, then reopen the saved draft.');
       const oldArticle=JSON.parse(old.content);
       if(oldArticle.id&&oldArticle.id!==b.article.id)fail(409,'Stable edition ID cannot change. Create a separate edition.');
       if(oldArticle.publishedAt)for(const k of ['id','editionNumber','publishedAt','issueDate'])if(oldArticle[k]!==b.article[k])fail(409,'Original publication metadata cannot change.');
       if(old.hash!==digest){
        let r;try{r=await q('UPDATE drafts SET edition_id=?,title=?,content=?,revision=revision+1,hash=?,saved_at=?,actor=? WHERE id=? AND revision=? AND hash=?',edition,title,content,digest,at,actor,savedId,b.expectedRevision,b.expectedHash).run();}
        catch(e){if(String(e).includes('UNIQUE'))fail(409,'Edition ID already exists.');throw e;}
        // D1 changes includes the history trigger insert; zero means the CAS lost.
        if(!r.meta.changes)fail(409,'Concurrent edit detected. Export and reopen.');
       }
      }
      const row=await q('SELECT * FROM drafts WHERE id=?',savedId).first();
      response=json({...rowJSON(row),validation:validate(b.article),publication:'Private working copy only. Export and GitHub review are required.'},b.id===null?201:200);
     }
    }else fail(404,'Not found.');
   }else if(['GET','HEAD'].includes(request.method)){
    const key=url.pathname==='/'?'/authoring/index.html':url.pathname==='/authoring/'?'/authoring/index.html':url.pathname;
    const asset=env.PRIVATE_ASSETS?.[key];if(!asset)fail(404,'Not found.');
    const text=asset.encoding==='base64'?Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0)):key.endsWith('.html')?asset.body.replaceAll('__CSP_NONCE__',nonce):asset.body;
    response=new Response(request.method==='HEAD'?null:text,{headers:{'content-type':asset.type}});
   }else fail(405,'Method not allowed.');
  }catch(e){response=json({error:e.status?e.message:'Private service unavailable. Your unsaved work remains in the editor.'},e.status||503);}
  response=new Response(response.body,response);
  response.headers.set('cache-control','private, no-store');
  response.headers.set('x-robots-tag','noindex, nofollow, noarchive');
  response.headers.set('x-content-type-options','nosniff');
  response.headers.set('referrer-policy','no-referrer');
  response.headers.set('content-security-policy',`default-src 'none'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self' about:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`);
  return response;
 };
}
export default {fetch:createPrivateHandler()};

