// Rolax server — sin dependencias (solo Node). Cuentas, esmeraldas, cajas, skins, eventos.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const D = require('./public/data.js');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SECRET_FILE = path.join(DATA_DIR, 'secret.key');
const PUBLIC = path.join(__dirname, 'public');

fs.mkdirSync(DATA_DIR, { recursive: true });
let SECRET;
if (fs.existsSync(SECRET_FILE)) SECRET = fs.readFileSync(SECRET_FILE, 'utf8');
else { SECRET = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(SECRET_FILE, SECRET); }

let db = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : { users: {} };
let saveTimer = null;
function saveDb() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(db));
    fs.renameSync(DB_FILE + '.tmp', DB_FILE);
  }, 100);
}

// ---- auth ----
function hashPw(pw, salt) { return crypto.scryptSync(pw, salt, 64).toString('hex'); }
function makeToken(u) {
  const body = Buffer.from(JSON.stringify({ u, exp: Date.now() + 30 * 864e5 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return body + '.' + sig;
}
function readToken(t) {
  if (!t) return null;
  const [body, sig] = t.split('.');
  if (!body || !sig) return null;
  const good = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() ? p.u : null;
  } catch { return null; }
}
const fails = {}; // username -> {n, until}

function publicUser(u) {
  return { username: u.username, emeralds: u.emeralds, trophies: u.trophies, owned: u.owned, skins: u.skins, selected: u.selected, skinSel: u.skinSel,
    mates: (u.mates || []).filter(m => u.owned.includes(m)), unread: (u.inbox || []).filter(m => !m.read).length,
    coins: u.coins | 0, levels: u.levels || {}, drops: u.drops | 0 };
}

// ---- mapas de jugadores ----
const FLOORS = [['#4f9a5b', '#4a9355'], ['#5b4a7a', '#554573'], ['#d6a84f', '#cf9f45'], ['#5fb3a1', '#58aa98'], ['#7a8794', '#737f8b']];
const MAP_W = 26;
function cleanMap(m) {
  if (!m || typeof m !== 'object') throw err(400, 'Mapa inválido');
  const name = String(m.name || '').trim().slice(0, 24);
  if (!name) throw err(400, 'Ponle nombre al mapa');
  if (!D.modes[m.mode] || D.modes[m.mode].hidden) throw err(400, 'Modo inválido');
  if (!Array.isArray(m.rows) || m.rows.length < 10 || m.rows.length > 16) throw err(400, 'El mapa debe tener entre 10 y 16 filas');
  const rows = m.rows.map(r => {
    r = String(r);
    if (r.length !== MAP_W || /[^#.b~GAB]/.test(r)) throw err(400, 'El mapa debe medir ' + MAP_W + ' columnas y usar solo # . b ~ G A B');
    return r;
  });
  const all = rows.join('');
  const count = c => all.split(c).length - 1;
  if (!count('A') || !count('B')) throw err(400, 'Falta el punto de salida azul (A) o rojo (B)');
  if (m.mode === 'emeralds' && !count('G')) throw err(400, 'Para Atrapa Esmeraldas necesitas una mina (G)');
  const fi = Number.isInteger(m.floorIdx) && FLOORS[m.floorIdx] ? m.floorIdx : 0;
  return { name, mode: m.mode, rows, floorIdx: fi, floor: FLOORS[fi] };
}
const newId = () => crypto.randomBytes(6).toString('hex');
const rint = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));
// da un personaje nuevo (según rareza) o null si ya los tiene todos
function giveBrawler(u) {
  const locked = D.brawlers.filter(x => !u.owned.includes(x.id));
  if (!locked.length) return null;
  const tot = locked.reduce((s, x) => s + D.rarity[x.rarity].w, 0);
  let r = Math.random() * tot, pick = locked[0];
  for (const x of locked) { r -= D.rarity[x.rarity].w; if (r <= 0) { pick = x; break; } }
  u.owned.push(pick.id); return pick.id;
}
const lastSend = {};

// ---- noticias ----
function readNews() {
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'news.json'), 'utf8')).news; } catch { return []; }
}

// ---- events ----
function currentEvents() {
  const ev = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'events.json'), 'utf8')).events;
  const d = new Date();
  const month = d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
  return ev.filter(e => e.month === '*' || e.month === month);
}

// ---- api ----
const routes = {
  'POST /api/register'(b) {
    const name = String(b.username || '').trim();
    if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) throw err(400, 'Usuario: 3-16 letras, números o _');
    if (String(b.password || '').length < 6) throw err(400, 'La contraseña necesita al menos 6 caracteres');
    const key = name.toLowerCase();
    if (db.users[key]) throw err(409, 'Ese usuario ya existe');
    const salt = crypto.randomBytes(16).toString('hex');
    db.users[key] = { username: name, salt, hash: hashPw(b.password, salt), emeralds: 50, trophies: 0,
      owned: ['superboy', 'fuerte'], skins: [], selected: 'superboy', skinSel: {}, coins: 100, levels: {}, drops: 1, lastMatch: 0, created: Date.now() };
    saveDb();
    return { token: makeToken(key), user: publicUser(db.users[key]) };
  },
  'POST /api/login'(b) {
    const key = String(b.username || '').trim().toLowerCase();
    const f = fails[key] || { n: 0, until: 0 };
    if (f.until > Date.now()) throw err(429, 'Demasiados intentos, espera unos minutos');
    const u = db.users[key];
    if (!u || hashPw(String(b.password || ''), u.salt) !== u.hash) {
      f.n++; if (f.n >= 5) { f.until = Date.now() + 5 * 60e3; f.n = 0; }
      fails[key] = f;
      throw err(401, 'Usuario o contraseña incorrectos');
    }
    delete fails[key];
    return { token: makeToken(key), user: publicUser(u) };
  },
  'GET /api/me'(_b, u) { return { user: publicUser(u) }; },
  'GET /api/events'() { return { events: currentEvents() }; },
  'POST /api/select'(b, u) {
    if (!u.owned.includes(b.brawler)) throw err(400, 'No tienes ese personaje');
    u.selected = b.brawler;
    if (Array.isArray(b.mates)) u.mates = b.mates.filter(m => u.owned.includes(m)).slice(0, 2);
    if (b.skin !== undefined) {
      if (b.skin === 'default') delete u.skinSel[b.brawler];
      else if (u.skins.includes(b.skin)) u.skinSel[b.brawler] = b.skin;
    }
    saveDb(); return { user: publicUser(u) };
  },
  'POST /api/box'(b, u) {
    const box = D.boxes[b.type];
    if (!box) throw err(400, 'Caja inválida');
    if (u.emeralds < box.price) throw err(402, 'No tienes suficientes esmeraldas');
    u.emeralds -= box.price;
    const reward = { emeralds: rint(box.em), coins: rint(box.co) };
    u.emeralds += reward.emeralds; u.coins = (u.coins | 0) + reward.coins;
    if (Math.random() < box.brawler) { const id = giveBrawler(u); if (id) reward.brawler = id; }
    saveDb(); return { reward, user: publicUser(u) };
  },
  'POST /api/skin'(b, u) {
    const [bid, key] = String(b.skin || '').split(':');
    const style = D.skinStyles.find(s => s.key === key);
    if (!style || !D.brawlers.find(x => x.id === bid)) throw err(400, 'Skin inválida');
    if (!u.owned.includes(bid)) throw err(400, 'Primero consigue ese personaje');
    if (u.skins.includes(b.skin)) throw err(400, 'Ya la tienes');
    if (u.emeralds < style.price) throw err(402, 'No tienes suficientes esmeraldas');
    u.emeralds -= style.price; u.skins.push(b.skin); u.skinSel[bid] = b.skin;
    saveDb(); return { user: publicUser(u) };
  },
  'POST /api/result'(b, u) {
    const now = Date.now();
    if (now - u.lastMatch < 20e3) throw err(429, 'Partida demasiado rápida');
    u.lastMatch = now;
    const ev = currentEvents().find(e => e.id === b.eventId);
    const collected = Math.max(0, Math.min(30, b.collected | 0));
    let em = 2, tr, co = b.draw ? 10 : 8, drop = false;
    if (b.win) {
      tr = 8; em += 10 + Math.floor(collected / 2) + (ev ? ev.reward | 0 : 0); co = 25 + collected;
      if (Math.random() < D.drop.winChance) { u.drops = (u.drops | 0) + 1; drop = true; }
    } else tr = b.draw ? 0 : -(Math.min(u.trophies, 4));
    u.trophies += tr; u.emeralds += em; u.coins = (u.coins | 0) + co;
    saveDb(); return { trophies: tr, emeralds: em, coins: co, drop, user: publicUser(u) };
  },
};
function err(status, message) { const e = new Error(message); e.status = status; return e; }

Object.assign(routes, {
  'GET /api/news'() { return { news: readNews() }; },
  'POST /api/upgrade'(b, u) {
    if (!u.owned.includes(b.brawler)) throw err(400, 'No tienes ese personaje');
    u.levels = u.levels || {};
    const lv = u.levels[b.brawler] || 1;
    if (lv >= D.upgrade.max) throw err(400, 'Nivel máximo');
    const cost = D.upgrade.cost[lv - 1];
    if ((u.coins | 0) < cost) throw err(402, 'Te faltan monedas (' + cost + ' 🪙)');
    u.coins -= cost; u.levels[b.brawler] = lv + 1;
    saveDb(); return { user: publicUser(u) };
  },
  // Cuadrodrop: se gana al vencer o se compra con esmeraldas
  'POST /api/drop/open'(b, u) {
    if ((u.drops | 0) > 0) u.drops--;
    else {
      if (!b.buy) throw err(400, 'No tienes Cuadrodrops');
      if (u.emeralds < D.drop.price) throw err(402, 'No tienes suficientes esmeraldas');
      u.emeralds -= D.drop.price;
    }
    const tiers = D.drop.tiers;
    let r = Math.random() * tiers.reduce((s, t) => s + t.w, 0), tier = tiers[0];
    for (const t of tiers) { r -= t.w; if (r <= 0) { tier = t; break; } }
    const reward = { tier: tier.key, emeralds: rint(tier.em), coins: rint(tier.co) };
    u.emeralds += reward.emeralds; u.coins = (u.coins | 0) + reward.coins;
    if (Math.random() < tier.brawler) { const id = giveBrawler(u); if (id) reward.brawler = id; }
    saveDb(); return { reward, user: publicUser(u) };
  },
  'GET /api/maps'(_b, u) { return { maps: u.maps || [] }; },
  'POST /api/maps/save'(b, u) {
    u.maps = u.maps || [];
    const m = cleanMap(b);
    const old = b.id && u.maps.find(x => x.id === b.id);
    if (old) Object.assign(old, m);
    else {
      if (u.maps.length >= 20) throw err(400, 'Máximo 20 mapas. Borra alguno.');
      u.maps.push({ id: newId(), ...m, created: Date.now() });
    }
    saveDb(); return { maps: u.maps };
  },
  'POST /api/maps/delete'(b, u) { u.maps = (u.maps || []).filter(x => x.id !== b.id); saveDb(); return { maps: u.maps }; },
  'GET /api/msg/inbox'(_b, u) { return { inbox: (u.inbox || []).slice().reverse() }; },
  'POST /api/msg/read'(_b, u) { (u.inbox || []).forEach(m => { m.read = true; }); saveDb(); return { user: publicUser(u) }; },
  'POST /api/msg/send'(b, u) {
    const text = String(b.text || '').trim().slice(0, 300);
    if (!text && !b.mapId) throw err(400, 'Escribe un mensaje');
    const to = db.users[String(b.to || '').trim().toLowerCase()];
    if (!to) throw err(404, 'Ese usuario no existe');
    if (Date.now() - (lastSend[u.username] || 0) < 2000) throw err(429, 'Más despacio');
    lastSend[u.username] = Date.now();
    const msg = { id: newId(), from: u.username, text, ts: Date.now(), read: false };
    if (b.mapId) {
      const mp = (u.maps || []).find(x => x.id === b.mapId);
      if (!mp) throw err(404, 'Mapa no encontrado');
      msg.map = { name: mp.name, mode: mp.mode, rows: mp.rows, floorIdx: mp.floorIdx, floor: mp.floor };
    }
    to.inbox = (to.inbox || []).concat(msg).slice(-50);
    saveDb(); return { ok: true };
  },
  'POST /api/msg/savemap'(b, u) {
    const msg = (u.inbox || []).find(m => m.id === b.id && m.map);
    if (!msg) throw err(404, 'No hay mapa en ese mensaje');
    u.maps = u.maps || [];
    if (u.maps.length >= 20) throw err(400, 'Máximo 20 mapas. Borra alguno.');
    u.maps.push({ id: newId(), ...cleanMap(msg.map), name: (msg.map.name + ' (de ' + msg.from + ')').slice(0, 24), created: Date.now() });
    saveDb(); return { maps: u.maps };
  },
});

// ---- http ----
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')) {
    const handler = routes[req.method + ' ' + url.pathname];
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 1e5) req.destroy(); });
    req.on('end', () => {
      const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
      try {
        if (!handler) throw err(404, 'No existe');
        const body = raw ? JSON.parse(raw) : {};
        let user = null;
        if (!/^\/api\/(register|login|events|news)$/.test(url.pathname)) {
          const key = readToken((req.headers.authorization || '').replace('Bearer ', ''));
          user = key && db.users[key];
          if (!user) throw err(401, 'Sesión caducada');
        }
        send(200, handler(body, user));
      } catch (e) { send(e.status || 500, { error: e.status ? e.message : 'Error del servidor' }); if (!e.status) console.error(e); }
    });
    return;
  }
  let p = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (p === '/' || p === '\\') p = '/index.html';
  const file = path.join(PUBLIC, p);
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (e, data) => {
    if (e) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});
server.listen(PORT, () => console.log('Rolax en http://localhost:' + PORT));
