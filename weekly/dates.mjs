export function commentDate(value,now=Date.now()){
  const date=new Date(value),valid=value&&Number.isFinite(date.getTime());if(!valid)return {label:'Date unavailable',precise:'Date unavailable',iso:null};
  const precise=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZoneName:'long'}).format(date);
  const elapsed=now-date.getTime();let label;if(elapsed>=0&&elapsed<60000)label='Just now';else if(elapsed>=60000&&elapsed<86400000){const n=Math.floor(elapsed/(elapsed<3600000?60000:3600000)),unit=elapsed<3600000?'minute':'hour';label=`${n} ${unit}${n===1?'':'s'} ago`;}else label=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(date);
  return {label,precise,iso:date.toISOString()};
}
