/**
 * Tiny local API for the dashboard (development only — never deployed).
 * Zero dependencies. Listens on 127.0.0.1:3001; Angular's dev server proxies /api to it.
 *
 *   POST /api/login   { password }        -> { token }
 *   POST /api/logout
 *   PUT  /api/cv      (whole cv.json)     -> writes public/data/cv.json (+ backup copy)
 *   POST /api/upload?name=photo.jpg       -> writes public/assets/img/uploads/<ts>-photo.jpg
 *   GET  /data/cv.json, /assets/img/uploads/*  -> served from disk (so saving doesn't reload the page)
 */
import { createServer } from 'node:http';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = join(ROOT, 'public/data/cv.json');
const UPLOAD_DIR = join(ROOT, 'public/assets/img/uploads');
const BACKUP_DIR = join(ROOT, 'data-backups');
const ENV_FILE = join(ROOT, '.env.local');
const PORT = Number(process.env.CV_API_PORT || 3001);
const SESSION_MS = 8 * 60 * 60 * 1000;
const MAX_JSON = 2 * 1024 * 1024;
const MAX_IMAGE = 5 * 1024 * 1024;

/* ---------- password (.env.local, created on first run) ---------- */
function loadPassword() {
  if (!existsSync(ENV_FILE)) {
    const generated = randomBytes(9).toString('base64url');
    writeFileSync(ENV_FILE, `# Local dashboard password (this file is git-ignored)\nADMIN_PASSWORD=${generated}\n`);
    console.log(`\n  Created .env.local with a new admin password: ${generated}\n  (change it any time by editing .env.local)\n`);
  }
  const line = readFileSync(ENV_FILE, 'utf8').split('\n').find((l) => l.startsWith('ADMIN_PASSWORD='));
  const pw = (line || '').slice('ADMIN_PASSWORD='.length).trim();
  if (pw.length < 6) {
    console.error('  ADMIN_PASSWORD in .env.local must be at least 6 characters.');
    process.exit(1);
  }
  return pw;
}
const sha = (s) => createHash('sha256').update(String(s)).digest();
const PASSWORD_HASH = sha(loadPassword());

/* ---------- sessions & brute-force protection ---------- */
const sessions = new Map(); // token -> expiry
const attempts = [];        // timestamps of failed logins

function authed(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const exp = sessions.get(token);
  if (!exp || exp < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

/* ---------- helpers ---------- */
function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function validate(d) {
  if (!d || typeof d !== 'object') return 'Data is not an object.';
  for (const k of ['settings', 'profile']) if (!d[k] || typeof d[k] !== 'object') return `Missing "${k}".`;
  for (const k of ['sections', 'social', 'skills', 'education', 'experience', 'projects'])
    if (!Array.isArray(d[k])) return `"${k}" must be a list.`;
  return null;
}

function backupCurrent() {
  if (!existsSync(DATA_FILE)) return;
  mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(join(BACKUP_DIR, `cv-${stamp}.json`), readFileSync(DATA_FILE));
  const files = readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.json')).sort();
  files.slice(0, Math.max(0, files.length - 30)).forEach((f) => unlinkSync(join(BACKUP_DIR, f)));
}

const IMAGE_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

/* ---------- routes ---------- */
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'POST' && url.pathname === '/api/login') {
      const now = Date.now();
      while (attempts.length && attempts[0] < now - 60_000) attempts.shift();
      if (attempts.length >= 5) return send(res, 429, { error: 'Too many attempts. Wait a minute.' });
      const { password } = JSON.parse((await readBody(req, 10_000)).toString() || '{}');
      if (!timingSafeEqual(sha(password), PASSWORD_HASH)) {
        attempts.push(now);
        return send(res, 401, { error: 'Wrong password.' });
      }
      const token = randomBytes(32).toString('hex');
      sessions.set(token, now + SESSION_MS);
      return send(res, 200, { token });
    }

    if (req.method === 'POST' && url.pathname === '/api/logout') {
      sessions.delete((req.headers.authorization || '').replace(/^Bearer /, ''));
      return send(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/data/cv.json') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(readFileSync(DATA_FILE));
    }

    if (req.method === 'GET' && url.pathname.startsWith('/assets/img/uploads/')) {
      const name = decodeURIComponent(url.pathname.slice('/assets/img/uploads/'.length));
      const ext = (name.split('.').pop() || '').toLowerCase();
      const file = join(UPLOAD_DIR, name);
      if (name.includes('/') || name.includes('..') || !IMAGE_TYPES[ext] || !existsSync(file)) return send(res, 404, { error: 'Not found' });
      res.writeHead(200, { 'Content-Type': IMAGE_TYPES[ext], 'Cache-Control': 'no-store' });
      return res.end(readFileSync(file));
    }

    if (!url.pathname.startsWith('/api/')) return send(res, 404, { error: 'Not found' });
    if (!authed(req)) return send(res, 401, { error: 'Session expired. Please log in again.' });

    if (req.method === 'PUT' && url.pathname === '/api/cv') {
      const data = JSON.parse((await readBody(req, MAX_JSON)).toString());
      const problem = validate(data);
      if (problem) return send(res, 400, { error: problem });
      backupCurrent();
      const tmp = DATA_FILE + '.tmp';
      writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
      renameSync(tmp, DATA_FILE); // atomic replace
      console.log(`  ✓ Saved cv.json (${new Date().toLocaleTimeString()})`);
      return send(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/upload') {
      const original = String(url.searchParams.get('name') || 'image');
      const ext = (original.split('.').pop() || '').toLowerCase();
      if (!IMAGE_TYPES[ext]) return send(res, 400, { error: 'Only JPG, PNG, WEBP or GIF images are allowed.' });
      const buf = await readBody(req, MAX_IMAGE);
      if (!buf.length) return send(res, 400, { error: 'Empty file.' });
      const base = original.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/g, '-').slice(0, 60) || 'image';
      const name = `${Date.now()}-${base}.${ext}`;
      mkdirSync(UPLOAD_DIR, { recursive: true });
      writeFileSync(join(UPLOAD_DIR, name), buf);
      console.log(`  ✓ Uploaded ${name}`);
      return send(res, 200, { path: `assets/img/uploads/${name}` });
    }

    return send(res, 404, { error: 'Not found' });
  } catch (e) {
    return send(res, e.status || 400, { error: e instanceof SyntaxError ? 'Invalid JSON.' : e.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`  Dashboard API ready on http://127.0.0.1:${PORT} (dashboard: http://localhost:4200/admin)`);
});
