const groups=[...document.querySelectorAll('.nav-group')];
function placeMenu(group){const panel=group.querySelector('.nav-submenu');panel.style.transform='none';if(!group.open)return;const r=panel.getBoundingClientRect(),shift=r.left<12?12-r.left:r.right>innerWidth-12?innerWidth-12-r.right:0;panel.style.transform=`translateX(${shift}px)`;}
function syncMenus(){for(const group of groups){group.querySelector('summary').setAttribute('aria-expanded',String(group.open));placeMenu(group);}}
window.addEventListener('resize',syncMenus);
for(const group of groups){
  group.querySelector('summary').addEventListener('click',()=>{if(!group.open)for(const other of groups)if(other!==group){other.open=false;other.querySelector('summary').setAttribute('aria-expanded','false');}group.querySelector('summary').setAttribute('aria-expanded',String(!group.open));});
  group.addEventListener('toggle',()=>{if(group.open)for(const other of groups)if(other!==group)other.open=false;syncMenus();});
}
document.addEventListener('click',event=>{if(!event.target.closest('.nav-group')||event.target.closest('.nav-group a')){groups.forEach(n=>n.open=false);syncMenus();}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const open=groups.find(g=>g.open);if(open){open.open=false;syncMenus();open.querySelector('summary').focus();}}});syncMenus();
for(const gallery of document.querySelectorAll('[data-gallery]')){
 const cards=[...gallery.querySelectorAll('.screenshot-card')],viewport=gallery.querySelector('.screenshot-grid'),prev=gallery.querySelector('[data-gallery-prev]'),next=gallery.querySelector('[data-gallery-next]'),status=gallery.querySelector('[data-gallery-status]');
 if(!cards.length)continue;
 gallery.querySelector('.gallery-controls').hidden=false;
 const step=()=>cards[0].getBoundingClientRect().width+22;
 function update(){const first=Math.round(viewport.scrollLeft/step()),visible=Math.max(1,Math.round(viewport.clientWidth/step()));status.textContent=`${first+1}–${Math.min(cards.length,first+visible)} of ${cards.length}`;prev.disabled=viewport.scrollLeft<2;next.disabled=viewport.scrollLeft>=viewport.scrollWidth-viewport.clientWidth-2;}
 function move(delta){viewport.scrollBy({left:delta*step(),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));viewport.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);
 viewport.addEventListener('keydown',event=>{if(event.target!==viewport)return;if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();if(event.key==='Home')viewport.scrollTo({left:0});else if(event.key==='End')viewport.scrollTo({left:viewport.scrollWidth});else move(event.key==='ArrowRight'?1:-1);}});update();
}
const kind=document.body.dataset.page;
if(['planner','library','activity','players'].includes(kind)){await import('./app.mjs');document.body.dataset.practiceReady='true';}
if(['scoreboard','helper','result','quiz','rotation','checklist','kit','rules','score-sheet'].includes(kind))await import('../tools/app.mjs');

if(kind==='contact')(await import('../tools/contact.mjs')).initContact();
