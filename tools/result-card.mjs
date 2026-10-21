import {formatLabel} from './match-formats.mjs';
import {validateResult,formats} from './scoring.mjs';
import {matchExportModel} from './match-export.mjs';
import {getClubLogo} from './club-logo.mjs';
import {brand,brandAssets,trophyPath} from './brand.mjs';
export const cardPalettes={night:{bg:'#07172b',panel:'#102b49',ink:'#f7f9fc',accent:'#dfff00',muted:'#bdcbd9'},clay:{bg:'#faf3e6',panel:'#eee0ca',ink:'#162820',accent:'#396e43',muted:'#506052'}};
function fitLines(c,text,width,maxLines=2){
 for(let size=54;size>=14;size-=2){c.font=`700 ${size}px Arial`;const words=text.trim().split(/\s+/),lines=[''];let valid=true;for(const word of words){if(c.measureText(word).width>width&&size>14){valid=false;break;}let last=lines.length-1;const candidate=lines[last]?lines[last]+' '+word:word;if(c.measureText(candidate).width<=width)lines[last]=candidate;else if(c.measureText(word).width<=width)lines.push(word);else for(const ch of word){last=lines.length-1;if(c.measureText(lines[last]+ch).width>width)lines.push(ch);else lines[last]+=ch;}}if(valid&&lines.length<=maxLines&&(lines.length===1||size<=46))return {size,lines};}
 return {size:14,lines:[text]};
}
function baseline(c,text,center){const m=c.measureText(text);return center+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2;}
function score(c,set,index,x,center,p){const value=String(index===0?set.a:set.b),size=64;c.fillStyle=p.ink;c.font=`700 ${size}px Arial`;const main=c.measureText(value).width,y=baseline(c,value,center);c.fillText(value,x-main/2,y);if(set.kind!=='match'&&set.tiebreak){c.font='700 34px Arial';c.fillStyle=p.muted;c.fillText(`(${set.tiebreak[index]})`,x+main/2+2,y-size*.34);}}
export async function drawResult(canvas,input,options={}){return drawCard(canvas,validateResult(input),options);}
export async function drawMatch(canvas,record,options={}){return drawCard(canvas,matchExportModel(record),options);}
async function drawCard(canvas,data,{design='night',layout='square'}={}){
 const p=cardPalettes[design];if(!p||!['square','portrait'].includes(layout))throw new Error('Choose one of the available card designs and sizes.');
 await document.fonts.ready;const [logo,qr]=await brandAssets();
 const w=1080,h=layout==='portrait'?1350:1080;canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');
 c.fillStyle=p.bg;c.fillRect(0,0,w,h);c.drawImage(logo,62,62,78,78);c.font='700 42px Arial';c.fillStyle=p.ink;c.fillText('Court',158,108);const offset=c.measureText('Court').width;c.fillStyle=brand.green;c.fillText('Umpire',158+offset,108);c.font='20px Arial';c.fillStyle=p.muted;c.fillText('EVERY POINT COUNTED',158,140);
 c.font='700 72px Arial';c.fillStyle=p.ink;c.fillText(data.status==='in-progress'?'In progress':'Match result',64,260);c.font='24px Arial';c.fillStyle=p.muted;c.fillText(formatLabel(data.format,data.gamesPerSet),64,309,950);
 const columns=[...data.sets];if(data.current){const v=data.current;columns.push({kind:v.kind==='game'?'set':'match',a:v.kind==='game'?v.games[0]:v.points[0],b:v.kind==='game'?v.games[1]:v.points[1],current:true});}
 const rowHeight=164,rowGap=18,top=Math.round((380+h-205-(rowHeight*2+rowGap))/2),centres=columns.length===1?[820]:columns.length===2?[720,900]:[622,761,900];
 c.font='21px Arial';c.textAlign='center';columns.forEach((s,i)=>{c.fillText(s.current&&data.current.kind!=='game'?'Tiebreak':s.kind==='match'?'Match TB':`Set ${i+1}`,centres[i],top-35);c.font='16px Arial';c.fillText(s.kind==='match'?'Points':'Games',centres[i],top-13);c.font='21px Arial';});c.textAlign='left';
 data.names.forEach((name,i)=>{const y=top+i*(rowHeight+rowGap),center=y+rowHeight/2;c.fillStyle=p.panel;c.fillRect(54,y,972,rowHeight);if(data.winner===i){c.fillStyle=p.accent;c.fillRect(54,y,4,rowHeight);}const nameWidth=columns.length===3?440:510,fitted=fitLines(c,name,nameWidth);c.font=`700 ${fitted.size}px Arial`;c.fillStyle=p.ink;fitted.lines.forEach((line,j)=>c.fillText(line,80,baseline(c,line,center+(j-(fitted.lines.length-1)/2)*fitted.size*1.08),nameWidth));columns.forEach((s,j)=>{score(c,s,i,centres[j],center,p);if(s.current){c.font='17px Arial';c.fillStyle=p.muted;c.textAlign='center';c.fillText(data.current.kind==='game'?`Points: ${data.current.points[i]}`:data.current.kind==='match'?'Deciding match TB':`Set ${data.sets.length+1}: ${data.current.games[i]} games`,centres[j],y+rowHeight-15);c.textAlign='left';}});if(data.winner===i){const badgeTop=Math.min(y+rowHeight-31,center+fitted.lines.length*fitted.size*.54+12);c.fillStyle=p.accent;c.save();c.translate(80,badgeTop);c.scale(.75,.75);c.fill(new Path2D(trophyPath));c.restore();c.font='700 17px Arial';c.fillText('Winner',105,badgeTop+15);}});
 const club=getClubLogo();if(club){const img=new Image();img.src=club.src;await img.decode();const scale=Math.min(190/img.naturalWidth,72/img.naturalHeight);c.drawImage(img,1010-img.naturalWidth*scale,70+(72-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);}

 c.fillStyle=p.accent;c.fillRect(64,h-181,952,2);c.font='700 29px Arial';c.fillStyle=p.ink;c.fillText('courtumpire.com',64,h-111);c.font='21px Arial';c.fillStyle=p.muted;c.fillText('Every point counted.',64,h-72);if(design==='night'){c.fillStyle='#f7f5ee';c.beginPath();c.roundRect(894,h-159,124,124,8);c.fill();}c.drawImage(qr,896,h-157,120,120);
 canvas.setAttribute('aria-label',data.status==='in-progress'?`In progress: ${data.names[0]} versus ${data.names[1]}. No winner declared.`:`Completed match: ${data.names[0]} versus ${data.names[1]}; ${data.names[data.winner]} wins.`);return data;
}
