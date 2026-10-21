import {track} from './usage.mjs';
import {contactTopics} from './contact-model.mjs';
const address='info@courtumpire.com';
export function initContact(){
 const root=document.querySelector('[data-contact]');if(!root||root.dataset.initialized)return;root.dataset.initialized='true';
 const radios=[...root.querySelectorAll('[name="contact-topic"]')],email=root.querySelector('[data-contact-email]'),copy=root.querySelector('[data-contact-copy]'),general=root.querySelector('[data-contact-general]'),feedback=root.querySelector('[data-copy-feedback]');let copying=false;
 const category=()=>radios.find(input=>input.checked)?.value||'general';
 function intent(action,extra={},selected=category()){track('contact_intent',{contact_category:selected,contact_action:action,...extra});}
 function update(){const selected=category();email.href=`mailto:${address}?subject=${encodeURIComponent('CourtUmpire — '+(contactTopics[selected]||'General enquiry'))}`;general.disabled=selected==='general';for(const guide of root.querySelectorAll('[data-contact-guide]')){const visible=(guide.dataset.contactGuide==='problem')===(selected==='problem');guide.style.visibility=visible?'visible':'hidden';guide.setAttribute('aria-hidden',String(!visible));}}
 for(const radio of radios)radio.addEventListener('change',()=>{update();intent('select');});
 general.addEventListener('click',()=>{radios.forEach(input=>input.checked=false);update();intent('select');radios[0].focus({preventScroll:true});});
 email.addEventListener('click',()=>intent('email'));
 root.querySelector('[data-contact-privacy]').addEventListener('click',()=>intent('email',{},'privacy'));
 copy.addEventListener('click',async()=>{if(copying)return;copying=true;copy.disabled=true;feedback.textContent='';try{await navigator.clipboard.writeText(address);feedback.textContent='Email address copied.';intent('copy',{copy_result:'success'});}catch{feedback.textContent='Copying was unavailable. Select info@courtumpire.com above and copy it manually.';intent('copy',{copy_result:'failure'});}finally{copying=false;copy.disabled=false;}});
 copy.disabled=false;update();document.body.dataset.contactReady='true';
}
