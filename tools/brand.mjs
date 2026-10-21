export const brand=Object.freeze({logo:'/assets/report-logo.webp',ball:'/assets/server-tennis-ball.png',qr:'/assets/website-qr.svg',url:'https://courtumpire.com/',dark:'#020817',green:'#74b024'});
// Fixed Material trophy silhouette matching the app's EmojiEvents icon. No font/emoji dependence.
export const trophyPath='M19 4h-3V2H8v2H5a2 2 0 0 0-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5 5 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5 5 0 0 0 3.61-3.96C19.08 11.63 21 9.55 21 7V6a2 2 0 0 0-2-2ZM5 7V6h3v3.82A3 3 0 0 1 5 7Zm14 0a3 3 0 0 1-3 2.82V6h3Z';
export const trophy=()=>`<svg class="trophy-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${trophyPath}"/></svg>`;
let assets;
export function brandAssets(){return assets??=Promise.all([brand.logo,'/assets/website-qr-rounded-dark.svg'].map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{assets=null;reject(new Error('A local brand image could not load. Reload this page before exporting.'));};img.src=src;})));}
