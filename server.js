// Café Fish Tank — tiny local server, no dependencies.
// Serves the drawing page and tank page, and saves every fish to ./data
// so nothing is lost if a page (or the server) restarts.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const IMAGE_DIR = path.join(DATA_DIR, 'fish');
const DB_FILE = path.join(DATA_DIR, 'fish.json');

const MAX_BODY_BYTES = 3 * 1024 * 1024; // a fish PNG is usually well under 200 KB
const MAX_NAME = 20;
const MAX_MESSAGE = 60;

fs.mkdirSync(IMAGE_DIR, { recursive: true });

function loadFish() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveFish(list) {
  // Write to a temp file then rename, so a crash mid-write can't corrupt the list.
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

let fishList = loadFish();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
};

const STICKER_DIR = path.join(PUBLIC_DIR, 'stickers');
const STICKER_TYPES = new Set(['.png', '.webp', '.jpg', '.jpeg', '.gif']);

// Every image dropped into public/stickers/ becomes an accessory.
// "pearl-necklace.png" shows up labelled "pearl necklace".
function listStickers() {
  let files = [];
  try {
    files = fs.readdirSync(STICKER_DIR);
  } catch {
    return [];
  }
  return files
    .filter((f) => STICKER_TYPES.has(path.extname(f).toLowerCase()) && !f.startsWith('.'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => ({
      id: f,
      label: path.basename(f, path.extname(f)).replace(/^\d+[-_ ]*/, '').replace(/[-_]+/g, ' '),
      url: `/stickers/${encodeURIComponent(f)}`,
    }));
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, { error: 'Not found' });
    send(res, 200, data, MIME[path.extname(filePath)] || 'application/octet-stream');
  });
}

// Resolve a URL path inside a base directory, refusing anything that escapes it.
function safeJoin(base, urlPath) {
  const resolved = path.normalize(path.join(base, decodeURIComponent(urlPath)));
  return resolved.startsWith(base + path.sep) || resolved === base ? resolved : null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function cleanText(value, max) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, max);
}

async function createFish(req, res) {
  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    return send(res, 400, { error: 'Could not read that fish. Please try again.' });
  }

  const name = cleanText(payload.name, MAX_NAME);
  const message = cleanText(payload.message, MAX_MESSAGE);
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(payload.image || '');

  if (!name) return send(res, 400, { error: 'Your fish needs a name!' });
  if (!match) return send(res, 400, { error: 'Your fish drawing is missing.' });

  const png = Buffer.from(match[1], 'base64');
  // PNG files always start with these 8 bytes.
  if (png.length < 8 || png.readUInt32BE(0) !== 0x89504e47) {
    return send(res, 400, { error: 'Your fish drawing is missing.' });
  }

  const id = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
  fs.writeFileSync(path.join(IMAGE_DIR, `${id}.png`), png);

  const fish = {
    id,
    name,
    message,
    image: `/fish-images/${id}.png`,
    createdAt: new Date().toISOString(),
  };
  fishList.push(fish);
  saveFish(fishList);

  console.log(`🐟  New fish: ${name}${message ? ` — "${message}"` : ''}`);
  send(res, 201, fish);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;

  try {
    if (p === '/api/fish' && req.method === 'GET') return send(res, 200, fishList);
    if (p === '/api/stickers' && req.method === 'GET') return send(res, 200, listStickers());
    if (p === '/api/fish' && req.method === 'POST') return await createFish(req, res);

    if (p.startsWith('/fish-images/') && req.method === 'GET') {
      const file = safeJoin(IMAGE_DIR, p.slice('/fish-images/'.length));
      return file ? serveFile(res, file) : send(res, 404, { error: 'Not found' });
    }

    if (req.method === 'GET') {
      const file = safeJoin(PUBLIC_DIR, p === '/' ? 'index.html' : p);
      return file ? serveFile(res, file) : send(res, 404, { error: 'Not found' });
    }

    send(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    send(res, err.message === 'too large' ? 413 : 500, { error: 'Something went wrong.' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const lan = Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);

  console.log('\n🐠  Café Fish Tank is running!\n');
  console.log(`   Drawing page (this laptop):  http://localhost:${PORT}/`);
  console.log(`   Tank page (this laptop):     http://localhost:${PORT}/tank.html`);
  for (const ip of lan) {
    console.log(`   Tank page (other devices):   http://${ip}:${PORT}/tank.html`);
  }
  console.log(`\n   ${fishList.length} fish saved so far. Press Ctrl+C to stop.\n`);
});
