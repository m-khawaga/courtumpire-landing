import {editorRead,editorOpen,editorSaved,editorHasChanges} from './editor.mjs';
const $=s=>document.querySelector(s);
let saved=null,listingOffset=null,historyOffset=null,busy=false,generation=0;
const notice=s=>$('#draft-status').textContent=s;
async function api(path,body){
 const headers={};
 if(body){const session=await api('/private/api/session');headers['content-type']='application/json';headers['x-csrf-token']=session.csrf;}
 const r=await fetch(path,{method:body?'POST':'GET',headers,...(body?{body:JSON.stringify(body)}:{}),credentials:'same-origin',cache:'no-store'});
 let data;try{data=await r.json();}catch{throw Error('Login expired or service unavailable. Export unsaved work before signing in again.');}
 if(!r.ok)throw Error(data.error||'Private request failed.');return data;
}
function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>Promise.resolve().then(fn).catch(e=>notice(e.message));return b;}
function safeReplace(){return !editorHasChanges()||confirm('Replace unsaved changes? Export or save first to keep them.');}
async function history(append=false){
 if(!saved)return;const r=await api('/private/api/drafts/'+saved.id+'/revisions?offset='+(append?historyOffset:0));
 if(!append)$('#draft-history').replaceChildren();
 for(const version of r.revisions){const row=document.createElement('p');row.textContent='Revision '+version.revision+' · '+version.saved_at+' ';
 row.append(button('Load revision '+version.revision+' for recovery',async()=>{if(!safeReplace())return;const g=generation;const old=await api('/private/api/drafts/'+saved.id+'/revisions/'+version.revision);if(g!==generation)return;generation++;editorOpen(old.article,'Recovered revision '+version.revision,{recovered:true});notice('Historical revision loaded. Save creates a new revision; it never rewrites history.');}));$('#draft-history').append(row);}
 historyOffset=r.next;$('#history-more').hidden=r.next===null;
}
async function refresh(append=false){
 const r=await api('/private/api/drafts?offset='+(append?listingOffset:0));
 if(!append)$('#draft-list').replaceChildren();
 for(const draft of r.drafts){const row=document.createElement('p');row.textContent=draft.title+' · revision '+draft.revision+' · '+draft.saved_at+' ';
 row.append(button('Open '+draft.title,async()=>{if(!safeReplace())return;const g=++generation;const d=await api('/private/api/drafts/'+draft.id);if(g!==generation)return;saved=d;editorOpen(d.article,d.title+' (private revision '+d.revision+')');notice('Reopened saved draft. Changes require Save private draft.');await history();}));$('#draft-list').append(row);}
 if(!append&&!r.drafts.length)$('#draft-list').textContent='No saved drafts yet.';
 listingOffset=r.next;$('#draft-more').hidden=r.next===null;
}
$('#draft-save').onclick=async()=>{
 if(busy)return;busy=true;$('#draft-save').disabled=true;
 try{const g=generation,article=editorRead();const d=await api('/private/api/drafts',{id:saved?.id||null,expectedRevision:saved?.revision??null,expectedHash:saved?.hash??null,article});if(g!==generation){notice('The earlier working copy was saved. Your newly opened/imported copy remains unchanged.');await refresh();return;}saved=d;editorSaved(article);notice('Saved privately · revision '+d.revision+'. '+(d.validation.length?'Incomplete fields remain; validate before export.':'Structure validated; factual review still required.')+' Nothing published.');await refresh();await history();}
 catch(e){notice(e.message+' Your working copy has not been replaced.');}
 finally{busy=false;$('#draft-save').disabled=false;}
};
$('#draft-refresh').onclick=()=>refresh().catch(e=>notice(e.message));
$('#draft-more').onclick=()=>refresh(true).catch(e=>notice(e.message));
$('#history-more').onclick=()=>history(true).catch(e=>notice(e.message));
document.addEventListener('weekly-editor-replaced',()=>{generation++;saved=null;$('#draft-history').replaceChildren();$('#history-more').hidden=true;notice('New/imported working copy. Save creates a new private draft. Open an existing saved draft to update it.');});
document.addEventListener('weekly-editor-change',()=>notice('Unsaved edits. Save private draft or export a local copy.'));
try{const session=await api('/private/api/session');$('#private-identity').textContent='Authenticated owner: '+session.identity;await refresh();}
catch(e){notice(e.message);}


document.addEventListener('weekly-save-working-revision',()=>$('#draft-save').click());
