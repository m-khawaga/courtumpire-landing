const article=document.querySelector('[data-article-id]');
if(article){
  // Filters use rendered values only; no article fetches or changes to source data.
  const clean=node=>{const copy=node.cloneNode(true);copy.querySelectorAll('.weekly-refs').forEach(n=>n.remove());return copy.textContent.trim();};
  function filters(panel,records,columns,onChange){
    const controls=document.createElement('div');controls.className='weekly-table-filters';
    const searchLabel=document.createElement('label'),search=document.createElement('input');search.type='search';search.placeholder='Player, tournament or other text';searchLabel.append('Search this table',search);controls.append(searchLabel);
    const selects=[];
    for(const [index,title]of columns.entries()){
      if(!/^(tour|tour\s*\/\s*category|category|tournament|coverage|status)$/i.test(title))continue;
      const values=[...new Set(records.map(r=>r.cells[index]).filter(Boolean))].sort();if(values.length<2||values.length>50)continue;
      const label=document.createElement('label'),select=document.createElement('select');select.setAttribute('aria-label',title);label.append(title,select);const plural={tour:'tours',category:'categories',tournament:'tournaments',coverage:'coverage states',status:'statuses'};select.append(new Option('All '+(plural[title.toLowerCase()]||title.toLowerCase()),''));values.forEach(v=>select.append(new Option(v,v)));controls.append(label);selects.push({select,index});select.addEventListener('change',onChange);
    }
    const reset=document.createElement('button');reset.type='button';reset.textContent='Clear filters';controls.append(reset);
    const status=document.createElement('p');status.className='weekly-note';status.setAttribute('role','status');controls.append(status);
    panel.prepend(controls);search.addEventListener('input',onChange);reset.onclick=()=>{search.value='';selects.forEach(({select})=>select.value='');onChange();};
    return {matches:r=>{const q=search.value.trim().toLocaleLowerCase();return (!q||r.cells.join(' ').toLocaleLowerCase().includes(q))&&selects.every(({select,index})=>!select.value||r.cells[index]===select.value);},status};
  }
  for(const panel of article.querySelectorAll('[data-table-filter]')){
    if(panel.matches('.weekly-ranking-panel')||panel.querySelector('.status-cards'))continue;
    const tableRows=[...panel.querySelectorAll('tr[data-table-row]')],cardRows=[...panel.querySelectorAll('.weekly-data-cards > article[data-table-row]')],primary=tableRows.length?tableRows:cardRows;
    const columns=tableRows.length?[...panel.querySelectorAll('thead th')].map(clean):[...cardRows[0]?.querySelectorAll('dt')||[]].map(clean);
    const records=primary.map(n=>({id:n.dataset.tableRow,cells:[...n.querySelectorAll(tableRows.length?'th,td':'dd')].map(clean)}));
    if(records.length<=3)continue;const controls=filters(panel,records,columns,update);
    function update(){const visible=new Set(records.filter(controls.matches).map(r=>r.id));[...tableRows,...cardRows].forEach(n=>n.hidden=!visible.has(n.dataset.tableRow));controls.status.textContent=`Showing ${visible.size} of ${records.length} rows.`;}update();
  }
  for(const panel of article.querySelectorAll('[data-results]')){
    const rows=[...panel.querySelectorAll('tr[data-result-index]')],representations=[...panel.querySelectorAll('[data-result-index]')],tour=panel.querySelector('[data-results-tour]'),tournament=panel.querySelector('[data-results-tournament]'),toggle=panel.querySelector('[data-results-toggle]'),count=panel.querySelector('[data-results-count]');let expanded=false;
    if(rows.length<=3)continue;
    panel.querySelector('.weekly-results-controls').hidden=false;
    function update(){const matching=rows.filter(r=>(!tour.value||r.dataset.resultTour===tour.value)&&(!tournament.value||r.dataset.resultTournament===tournament.value)),visible=new Set((expanded?matching:matching.slice(0,5)).map(r=>r.dataset.resultIndex));representations.forEach(r=>r.hidden=!visible.has(r.dataset.resultIndex));panel.querySelectorAll('[data-results-group]').forEach(g=>g.hidden=![...g.querySelectorAll('[data-result-index]')].some(r=>!r.hidden));count.textContent=`Showing ${visible.size} of ${matching.length} matches${tour.value?' · '+tour.value:''}${tournament.value?' · '+tournament.value:''}.`;toggle.hidden=matching.length<=5;toggle.textContent=expanded?'Show fewer':'Show all '+matching.length+' matches';toggle.setAttribute('aria-expanded',String(expanded));}
    tour.onchange=tournament.onchange=()=>{expanded=false;update();};toggle.onclick=()=>{expanded=!expanded;update();};update();
  }
  const disclosure=article.querySelector('.weekly-sources-disclosure');
  if(disclosure){disclosure.open=location.hash.startsWith('#source-');
    const openSource=()=>{if(location.hash.startsWith('#source-'))disclosure.open=true;};addEventListener('hashchange',openSource);
    article.addEventListener('click',event=>{const link=event.target.closest('[data-citation]');if(!link)return;const target=document.getElementById(link.hash.slice(1));if(!target)return;disclosure.open=true;const back=target.querySelector('.weekly-source-back');if(back)back.href='#'+link.id;target.focus({preventScroll:true});});
  }

  const share=article.querySelector('[data-weekly-share]'),copy=article.querySelector('[data-weekly-copy]'),status=article.querySelector('[data-share-status]');
  const link=()=>document.querySelector('link[rel=canonical]')?.href||location.origin+location.pathname;
  async function copyLink(){try{await navigator.clipboard.writeText(link());status.textContent='Link copied.';}catch{status.textContent='Copy this link: '+link();}}
  share.hidden=false;copy.hidden=false;copy.onclick=copyLink;share.onclick=async()=>{if(navigator.share){try{await navigator.share({title:document.title,url:link()});return;}catch(e){if(e.name==='AbortError')return;}}await copyLink();};
  for(const button of article.querySelectorAll('[data-video-id]')){button.hidden=false;button.onclick=()=>{const frame=document.createElement('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+button.dataset.videoId+'?autoplay=0';frame.title=button.closest('aside').querySelector('h3').textContent;frame.allow='encrypted-media; picture-in-picture';frame.referrerPolicy='strict-origin-when-cross-origin';frame.allowFullscreen=true;button.replaceWith(frame);frame.focus();};}
  if(article.dataset.preview!=='true'){
    const load=article.querySelector('[data-engagement-load]');load.hidden=false;load.onclick=async()=>{load.disabled=true;try{const {init}=await import('./engagement.mjs');await init(article);}catch{article.querySelector('[data-engagement] [role=status]').textContent='Engagement unavailable. Retry when your connection returns.';load.disabled=false;}};
    window.CourtUmpireAnalytics?.track('article_read',{},{once:true});
  }
}
