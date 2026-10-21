import {kitItems} from './kit.mjs';
import {printDocument} from './print.mjs';
import {escape as e} from '../practice/html.mjs';
export function initKit(){const panel=document.getElementById('kit-configuration');
 document.addEventListener('click',async event=>{const select=event.target.closest('[data-kit-select]'),print=event.target.closest('[data-print-kit]');
  if(select){const item=kitItems.find(i=>i.id===select.dataset.kitSelect);if(!item)return;for(const button of document.querySelectorAll('[data-kit-select]')){const active=button===select;button.setAttribute('aria-expanded',String(active));button.closest('[data-kit-card]').dataset.selected=String(active);}
   panel.innerHTML=`<h2>${e(item.title)}</h2><p>${e(item.description)}</p><div class="kit-example">${item.body}</div><div class="card-actions">${item.configure?`<a class="button" href="${item.configure}">Configure this document</a>`:''}${item.printable===false?'':`<button class="secondary" type="button" data-print-kit="${item.id}">Quick print / Save PDF</button>`}</div>`;panel.hidden=false;panel.focus({preventScroll:true});panel.scrollIntoView({block:'start',behavior:'instant'});
  }else if(print){const item=kitItems.find(i=>i.id===print.dataset.printKit);if(item)try{await printDocument(item.title,'Printable tennis club kit · fill in locally',item.body,{landscape:item.id==='rotation-template'});}catch{document.getElementById('tool-status').textContent='The printable document could not prepare its local images. Please try again.';}}
 });
}
