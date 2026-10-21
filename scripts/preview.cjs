const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.svg':'image/svg+xml', '.xml':'application/xml', '.json':'application/json', '.jpg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.vtt':'text/vtt', '.mp4':'video/mp4', '.webm':'video/webm' };
const server = http.createServer((req,res) => {
  let url; try { url = new URL(req.url,'http://localhost'); } catch { res.writeHead(400); return res.end(); }
  let pathname; try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); }
  let file = path.resolve(root,'.'+pathname);
  if (!file.startsWith(root+path.sep) && file !== root || pathname.split('/').some(p=>p.startsWith('.'))) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!pathname.endsWith('/')) { res.writeHead(301,{ Location:pathname+'/'+url.search }); return res.end(); }
    file = path.join(file,'index.html');
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});const missing=path.join(root,'404.html');return res.end(fs.existsSync(missing)?fs.readFileSync(missing):'Page not found'); }
  res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control','no-store');
  res.end(fs.readFileSync(file));
});
if (require.main === module) server.listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log(`CourtUmpire local preview: http://127.0.0.1:${server.address().port}`));
module.exports = server;
