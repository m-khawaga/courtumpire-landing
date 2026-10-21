import {escape as e} from '../practice/html.mjs';
let pending=false;
export async function confirmAction({title='Confirm action',message,confirmLabel='Confirm'}){
 if(pending)return false;pending=true;const opener=document.activeElement;
 if(typeof HTMLDialogElement==='undefined'){try{return window.confirm(`${title}\n\n${message}`);}finally{pending=false;}}
 const dialog=document.createElement('dialog');dialog.className='confirmation';dialog.setAttribute('aria-labelledby','confirmation-title');dialog.setAttribute('aria-describedby','confirmation-description');dialog.innerHTML=`<h2 id="confirmation-title">${e(title)}</h2><p id="confirmation-description">${e(message)}</p><form method="dialog"><button class="secondary" value="cancel" autofocus>Cancel</button><button class="secondary danger-action" value="confirm">${e(confirmLabel)}</button></form>`;document.body.append(dialog);
 // Dialog forms never submit to a server; avoid inheriting a private query in
 // their automatic form metadata.
 dialog.querySelector('form').action=location.pathname;
 return new Promise(resolve=>{dialog.addEventListener('close',()=>{const accepted=dialog.returnValue==='confirm';dialog.remove();pending=false;if(opener?.isConnected)opener.focus({preventScroll:true});resolve(accepted);},{once:true});dialog.showModal();});
}
