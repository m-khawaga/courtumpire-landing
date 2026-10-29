export function archiveGroups(editions){
  if(editions.length<16)return [];
  const months=[...new Set(editions.map(a=>a.issueDate.slice(0,7)))].sort().reverse();
  return months.length>1?months.map(month=>({month,path:`/weekly/month/${month}/`,editions:editions.filter(a=>a.issueDate.startsWith(month))})):[];
}
export function archiveRoutes(editions){const routes=[];for(const group of archiveGroups(editions))for(let page=1;page<=Math.ceil(group.editions.length/8);page++)routes.push({path:group.path+(page===1?'':`page/${page}/`),title:`CourtUmpire Weekly — ${group.month}${page>1?' — Page '+page:''}`,label:`${group.month}${page>1?' page '+page:''}`,section:'weekly',parent:'/weekly/'});return routes;}
export function monthLinks(editions){const groups=archiveGroups(editions);return groups.length?`<nav class="weekly-contents" aria-label="Filter editions by year and month"><a href="/weekly/">All editions</a>${groups.map(g=>`<a href="${g.path}">${g.month}</a>`).join('')}</nav>`:'';}
