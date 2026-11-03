
const text = node => {
  const copy = node.cloneNode(true);
  copy.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
  copy.querySelectorAll('.paper-check').forEach(mark => mark.remove());
  return copy.textContent.split('\n').map(line => line.replace(/[\t \u00a0]+/g, ' ').trim()).filter(Boolean).join('\n');
};

async function imageData(element) {
  let image = element;
  let url;
  try {
    if (element.tagName.toLowerCase() === 'svg') {
      const svg = element.cloneNode(true);
      if ([...svg.querySelectorAll('[href],[xlink\\:href]')].some(n => !(n.getAttribute('href') || n.getAttribute('xlink:href') || '').startsWith('#'))) {
        throw new Error('The diagram has an external reference.');
      }
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const style = document.createElementNS(svg.namespaceURI, 'style');
      style.textContent = [
        '.court-background,.court-surface{fill:white}.court-surface,g[fill="none"],path[stroke="#e5f2ef"]{stroke:#333}',
        '[stroke="#dfff00"]{stroke:#42641d}[fill="#dfff00"]{fill:#42641d}',
        '[stroke="#91cfff"]{stroke:#285681}[fill="#91cfff"]{fill:#285681}',
        '.player-label,.target-label,.side-label{fill:#111;font:bold 17px sans-serif;text-anchor:middle}'
      ].join('');
      svg.prepend(style);
      url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], {type:'image/svg+xml'}));
      image = new Image();
      image.src = url;
    }
    await image.decode();
    const scale = Math.min(1, 680 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png').split(',')[1];
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
}

async function snapshot(report) {
  const blocks = [];
  async function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim()) blocks.push({kind:'text', text:node.textContent.trim()});
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.hidden || node.matches('button,script,style,.report-header')) return;
    const tag = node.tagName.toLowerCase();
    if (tag === 'table') {
      const rows = [...node.rows].map(row => [...row.cells].map(cell => ({text:text(cell),span:cell.colSpan})));
      if (node.caption) blocks.push({kind:'heading',text:text(node.caption)});
      blocks.push({kind:'table',rows,headers:node.tHead?.rows.length || 0,writing:node.matches('.writing-table,.blank-worksheet')});
    } else if (tag === 'img' || tag === 'svg') {
      blocks.push({kind:'image',data:await imageData(node)});
    } else if (node.matches('.diagram-legend')) {
      blocks.push({kind:'text',text:'Letter = player · Solid arrow = ball · Dashed arrow = movement · T = target'});
    } else if (/^h[1-6]$/.test(tag) || ['p','li','summary','dt','dd'].includes(tag)) {
      const value = text(node);
      const mark = tag === 'li' && node.querySelector('.paper-check');
      if (value) blocks.push(mark ? {kind:'check',text:value,checked:mark.getAttribute('aria-label')==='Completed'} :
        {kind:tag.startsWith('h')?'heading':'text',text:tag==='li'?'• '+value:value});
    } else {
      for (const child of node.childNodes) await walk(child);
    }
  }
  for (const child of report.children) await walk(child);
  const images = await Promise.all([...report.querySelectorAll('.report-header img')].map(imageData));
  return {landscape:report.classList.contains('report-landscape'),images,blocks};
}

const VERSION = 1;
const MAX_BASE64 = Math.ceil(8 * 1024 * 1024 / 3) * 4;
let pdfEngine;
let preparing = false;
let pending;

function loadScript(name) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/tools/vendor/pdfmake-0.3.13/' + name;
    script.onload = resolve;
    script.onerror = () => { script.remove(); reject(new Error('The local PDF engine could not load.')); };
    document.head.append(script);
  });
}

function engine() {
  return pdfEngine ??= loadScript('pdfmake.min.js')
    .then(() => loadScript('vfs_fonts.js')).then(() => window.pdfMake)
    .catch(error => { pdfEngine = undefined; throw error; });
}

function tableDefinition(block, headings) {
  const columns = Math.max(...block.rows.map(row => row.reduce((n, cell) => n + cell.span, 0)));
  const body = block.rows.map((row, index) => {
    const cells = row.flatMap(cell => [
      {text:cell.text, colSpan:cell.span, bold:index < block.headers,
        fillColor:index < block.headers ? '#e9eff6' : '#ffffff'},
      ...Array.from({length:cell.span - 1}, () => ({}))
    ]);
    while (cells.length < columns) cells.push({text:''});
    return cells;
  });
  // Put section headings in the repeating header block so pdfmake moves them
  // with the column labels and first data row, while later rows can still flow.
  const hasHeading = headings.length > 0;
  if (hasHeading) {
    body.unshift([
      {stack:headings, colSpan:columns, border:[false,false,false,false]},
      ...Array.from({length:columns - 1}, () => ({}))
    ]);
  }
  const headingRow = row => hasHeading && row === 0;
  return {
    table:{widths:Array(columns).fill('*'), body, headerRows:block.headers + Number(hasHeading),
      keepWithHeaderRows:1, heights:block.writing ? row => headingRow(row) ? 'auto' : 28 : undefined,
      dontBreakRows:block.rows.every(row => row.every(cell => cell.text.length < 850))},
    layout:{hLineColor:()=>'#a4b1c0',vLineColor:()=>'#a4b1c0',hLineWidth:row=>headingRow(row)?0:0.5,vLineWidth:()=>0.5,
      paddingTop:row=>headingRow(row)?0:4,paddingBottom:row=>headingRow(row)?0:4,
      paddingLeft:()=>5,paddingRight:()=>5},
    fontSize:9, margin:[0,2,0,12]
  };
}

function reportDefinition(title, model) {
  const content = [];
  let headings = [];
  function renderBlock(block) {
    if (block.kind === 'image') return {image:'data:image/png;base64,'+block.data,fit:[285,165],margin:[0,2,0,8]};
    if (block.kind === 'check') {
      const outline = {type:'rect',x:0,y:1,w:9,h:9,lineColor:'#526175'};
      const mark = {type:'polyline',points:[{x:2,y:5},{x:4,y:7},{x:7,y:3}],lineColor:'#182330'};
      return {columns:[{width:14,canvas:block.checked?[outline,mark]:[outline]},{text:block.text}],margin:[0,0,0,7]};
    }
    return {text:block.text,margin:[0,0,0,6]};
  }
  for (const [index, block] of model.blocks.entries()) {
    if (block.kind === 'heading') {
      headings.push({text:block.text,style:index===0?'title':'section'});
      continue;
    }
    if (block.kind === 'table') content.push(tableDefinition(block, headings));
    else content.push(...headings.map(heading => ({...heading,headlineLevel:heading.style==='section'?2:1})), renderBlock(block));
    headings = [];
  }
  content.push(...headings);
  const images = model.images.map((data,i) => ({
    image:'data:image/png;base64,'+data,fit:i===1&&model.images.length===3?[100,32]:[35,35],
    width:'auto'
  }));
  if (images.length) {
    const logo = images.shift();
    const qr = images.pop();
    content.unshift({columns:[logo,{text:'CourtUmpire',bold:true,fontSize:16,margin:[5,8,0,0]},...images,
      {text:'',width:'*'},...(qr?[qr]:[])],columnGap:5,margin:[0,0,0,11]});
  } else content.unshift({text:'CourtUmpire',bold:true,fontSize:16,margin:[0,0,0,10]});
  return {
    info:{title,author:'CourtUmpire'},
    pageSize:'A4',pageOrientation:model.landscape?'landscape':'portrait',pageMargins:[38,42,38,43],
    defaultStyle:{font:'Roboto',fontSize:10,color:'#182330',lineHeight:1.12},
    styles:{title:{fontSize:19,bold:true,margin:[0,0,0,8]},section:{fontSize:13,bold:true,margin:[0,7,0,4]}},
    header:page=>page>1?{text:'CourtUmpire',color:'#475569',fontSize:8,margin:[38,18,38,0]}:null,
    footer:(page,count)=>({columns:[{text:'courtumpire.com'},{text:'Page '+page+' of '+count,alignment:'right'}],
      fontSize:8,color:'#475569',margin:[38,12,38,0]}),
    pageBreakBefore:(node,following)=>node.headlineLevel===2&&
      (node.startPosition?.verticalRatio>.88||following.getFollowingNodesOnPage().length===0),
    content
  };
}

export function supportsEmbeddedPdf(version = VERSION) {
  const root = document.documentElement;
  return root.dataset.cuNativePdf === String(version) && version === VERSION;
}

export async function saveEmbeddedPdf(report, {version = VERSION, filename} = {}) {
  if (!supportsEmbeddedPdf(version)) return false;
  if (preparing || pending) return true;
  if (!report) throw new Error('Generate the report before saving it.');
  const title = text(report.querySelector('h1') || report.querySelector('h2') || report).slice(0, 140);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,56);
  filename ??= 'courtumpire-'+(slug||'resource')+'.pdf';
  if (!/^[a-z0-9][a-z0-9_-]{0,78}\.pdf$/i.test(filename)) throw new Error('Invalid PDF filename.');
  preparing = true;
  try {
    const [pdfMake, model] = await Promise.all([engine(), snapshot(report)]);
    if (!model.blocks.length) throw new Error('There is no report content to save.');
    const base64 = await pdfMake.createPdf(reportDefinition(title, model)).getBase64();
    if (base64.length > MAX_BASE64) throw new Error('The PDF exceeds the save limit.');
    pending = {version,filename,base64};
  } finally {
    preparing = false;
  }
  const queued = pending;
  setTimeout(() => { if (pending === queued) pending = undefined; }, 15000);
  window.courtUmpireTakeResourcePdf = () => {
    const value = pending;
    pending = undefined;
    return value;
  };
  const signal = new URL(location.pathname, location.origin);
  signal.searchParams.set('cu-action','save-resource-pdf');
  location.assign(signal.href);
  return true;
}
