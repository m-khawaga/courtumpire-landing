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
if(document.querySelector('[data-product-gallery]')) await import('../assets/gallery/gallery.mjs');
const kind=document.body.dataset.page;
if(['planner','library','activity','players'].includes(kind)){await import('./app.mjs');document.body.dataset.practiceReady='true';}
if(['scoreboard','helper','result','quiz','rotation','checklist','kit','rules','score-sheet'].includes(kind))await import('../tools/app.mjs');

if(kind==='contact')(await import('../tools/contact.mjs')).initContact();
