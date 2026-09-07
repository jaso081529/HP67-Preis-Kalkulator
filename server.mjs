import http from 'node:http';
import { readFile, writeFile, mkdir, rename, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { initialState, validateState, publicCatalog, productsFromTextilePriceList } from './local/core.mjs';
import { stickerPriceList } from './local/sticker-prices.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.HP67_DATA_DIR || path.join(root, 'data');
await mkdir(path.join(dataDir, 'backups'), { recursive: true });
const dataFile = path.join(dataDir, 'hoodplaka67.json');
const textileSeed = JSON.parse(await readFile(path.join(root,'local','textile-prices.json'),'utf8'));
let state;
try { state = validateState(JSON.parse(await readFile(dataFile, 'utf8'))); }
catch (error) { if (error.code !== 'ENOENT') throw new Error(`Datendatei kann nicht gelesen werden. Sie wurde nicht verändert: ${error.message}`); state = initialState(); state.products=productsFromTextilePriceList(textileSeed);state.textilePriceList=textileSeed;state.stickerPriceList=structuredClone(stickerPriceList);validateState(state);await writeFile(dataFile, JSON.stringify(state, null, 2)); }
const token = randomBytes(24).toString('hex');
const port = Number(process.env.PORT || 6767);
const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
let busy = false;
const server = http.createServer(async (req, res) => {
  const send = (status, body, type = 'application/json; charset=utf-8') => { res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" }); res.end(typeof body === 'string' ? body : JSON.stringify(body)); };
  if (!allowedHosts.has(req.headers.host)) return send(403, { error: 'Zugriff nur über localhost möglich.' });
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/state') return send(200, { state, token });
    if (req.method === 'GET' && url.pathname === '/api/backup') { if(req.headers['x-hp67-token']!==token)return send(403,{error:'Bitte das Programm neu laden.'});res.setHeader('Content-Disposition', `attachment; filename="HP67-PRIVATE-Sicherung-${new Date().toISOString().slice(0, 10)}.json"`); return send(200, state); }
    if (req.method === 'GET' && url.pathname === '/api/public-prices') { res.setHeader('Content-Disposition', `attachment; filename="HP67-OEFFENTLICHE-VK-PREISE-${new Date().toISOString().slice(0, 10)}.json"`); return send(200, publicCatalog(state)); }
    if (req.method === 'PUT' && url.pathname === '/api/state') {
      if (req.headers['x-hp67-token'] !== token || req.headers.origin !== `http://${req.headers.host}`) return send(403, { error: 'Bitte das Programm neu laden.' });
      if (busy) return send(409, { error: 'Eine Speicherung läuft. Bitte erneut versuchen.' });
      busy = true;
      try {
        let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 8e6) return send(413, { error: 'Die Sicherung ist zu groß (max. 8 MB).' }); }
        const next = validateState(JSON.parse(body));
        if (next.revision !== state.revision) return send(409, { error: 'Die Daten wurden in einem anderen Fenster geändert. Bitte neu laden.' });
        next.revision++;
        await copyFile(dataFile, path.join(dataDir, 'backups', `hp67-${new Date().toISOString().replaceAll(':', '-')}-${state.revision}.json`));
        await writeFile(`${dataFile}.tmp`, JSON.stringify(next, null, 2), 'utf8');
        await rename(`${dataFile}.tmp`, dataFile);
        state = next; return send(200, { state });
      } finally { busy = false; }
    }
    if (req.method !== 'GET') return send(405, { error: 'Methode nicht unterstützt.' });
    const files = { '/': ['public/index.html', 'text/html; charset=utf-8'], '/app.js': ['public/app.js', 'text/javascript; charset=utf-8'], '/style.css': ['public/style.css', 'text/css; charset=utf-8'], '/core.mjs': ['local/core.mjs', 'text/javascript; charset=utf-8'], '/browser-storage.mjs': ['local/browser-storage.mjs', 'text/javascript; charset=utf-8'], '/price-list-image.mjs': ['local/price-list-image.mjs', 'text/javascript; charset=utf-8'] };
    if (!files[url.pathname]) return send(404, { error: 'Nicht gefunden.' });
    const [file, type] = files[url.pathname]; return send(200, await readFile(path.join(root, file), 'utf8'), type);
  } catch (error) { send(400, { error: error.message || 'Speichern fehlgeschlagen.' }); }
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} ist belegt. Läuft das Programm bereits? http://127.0.0.1:${port}` : error.message); process.exit(1); });
server.listen(port, '127.0.0.1', () => console.log(`HooDPlaka67 Preisstudio: http://127.0.0.1:${port}`));
