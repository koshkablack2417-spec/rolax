// Rolax — motor de batalla (canvas 2D). Modos: Atrapa Esmeraldas y Noqueo.
(function () {
  const T = 40, R = 14;
  const brById = id => D.brawlers.find(b => b.id === id);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- dibujo de personajes (y skins) ----------
  // Si existe public/sprites/<id>.png se usa ese dibujo en vez de la figura generada.
  const sprites = {};
  function sprite(id) {
    if (sprites[id] === undefined) {
      sprites[id] = null;
      const im = new Image();
      im.onload = () => { sprites[id] = im; };
      im.src = 'sprites/' + id + '.png';
    }
    return sprites[id];
  }

  function drawBrawler(ctx, b, skin, x, y, r, dir, t) {
    const im = skin ? null : sprite(b.id);
    skin = skin || b.style || null;
    ctx.save(); ctx.translate(x, y);
    const glow = { gold: '255,200,40', neon: '34,211,238', dragon: '255,230,80' }[skin];
    if (skin === 'gold') b = Object.assign({}, b, { color: '#f5b301', accent: '#fff3b0' });
    if (skin === 'neon') b = Object.assign({}, b, { color: '#06b6d4', accent: '#a5f3fc' });
    if (skin === 'ghost') { b = Object.assign({}, b, { color: '#e5e7eb', accent: '#fff' }); ctx.globalAlpha *= .65; }
    const face = Math.cos(dir || 0) >= 0 ? 1 : -1;
    if (im) { ctx.drawImage(im, -r * 1.3, -r * 1.6, r * 2.6, r * 2.6); ctx.restore(); return; }
    if (glow) {
      const g = ctx.createRadialGradient(0, 0, r * .3, 0, 0, r * (2 + Math.sin(t * 8) * .2));
      g.addColorStop(0, 'rgba(' + glow + ',.75)'); g.addColorStop(1, 'rgba(' + glow + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, 7); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0, r * .95, r * .9, r * .35, 0, 0, 7); ctx.fill();
    const skinCol = '#ffd9b3';
    if (skin === 'roblox') {
      ctx.fillStyle = '#334155'; ctx.fillRect(-r * .6, r * .3, r * .5, r * .7); ctx.fillRect(r * .1, r * .3, r * .5, r * .7);
      ctx.fillStyle = b.color; ctx.fillRect(-r * .8, -r * .5, r * 1.6, r * .9);
      ctx.fillStyle = '#facc15'; ctx.fillRect(-r * 1.15, -r * .5, r * .35, r * .8); ctx.fillRect(r * .8, -r * .5, r * .35, r * .8);
      ctx.fillRect(-r * .55, -r * 1.35, r * 1.1, r * .85);
      ctx.fillStyle = '#111'; ctx.fillRect(-r * .3 + face * 3, -r * 1.1, 3, 4); ctx.fillRect(r * .1 + face * 3, -r * 1.1, 3, 4);
      ctx.fillRect(-r * .25 + face * 3, -r * .8, r * .5, 2);
    } else if (skin === 'minecraft') {
      const px = r * .27;
      ctx.fillStyle = '#1e3a8a'; ctx.fillRect(-r * .55, r * .35, r * .5, r * .65); ctx.fillRect(r * .05, r * .35, r * .5, r * .65);
      ctx.fillStyle = b.color; ctx.fillRect(-r * .6, -r * .4, r * 1.2, r * .8);
      ctx.fillStyle = skinCol; ctx.fillRect(-r * 1, -r * .4, r * .4, r * .75); ctx.fillRect(r * .6, -r * .4, r * .4, r * .75);
      const hx = -r * .6, hy = -r * 1.4;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        ctx.fillStyle = j === 0 ? '#4b2e1a' : ((i + j) % 2 ? '#e8b98c' : '#f0c8a0');
        ctx.fillRect(hx + i * px * 1.1, hy + j * px * 1.1, px * 1.12, px * 1.12);
      }
      ctx.fillStyle = '#fff'; ctx.fillRect(hx + px * 0.6, hy + px * 1.9, px, px * .7); ctx.fillRect(hx + px * 2.6, hy + px * 1.9, px, px * .7);
      ctx.fillStyle = '#4338ca'; ctx.fillRect(hx + px * 1.1, hy + px * 1.9, px * .5, px * .7); ctx.fillRect(hx + px * 3.1, hy + px * 1.9, px * .5, px * .7);
    } else {
      // figura base
      ctx.fillStyle = b.color;
      if (b.id === 'cookid') ctx.fillRect(-r * .85, -r * .5, r * 1.7, r * 1.3);
      else { ctx.beginPath(); ctx.ellipse(0, r * .2, r * .85, r * .85, 0, 0, 7); ctx.fill(); }
      if (b.id === 'fuerte') { ctx.fillStyle = skinCol; ctx.beginPath(); ctx.arc(-r * 1, 0, r * .45, 0, 7); ctx.arc(r * 1, 0, r * .45, 0, 7); ctx.fill(); }
      if (b.id === 'superboy') { ctx.fillStyle = b.accent; star(ctx, 0, r * .25, r * .45); }
      ctx.fillStyle = b.id === 'cookid' ? '#fca5a5' : (b.id === 'dragot' ? '#84cc16' : skinCol);
      if (b.id === 'cookid') ctx.fillRect(-r * .6, -r * 1.4, r * 1.2, r * 1);
      else { ctx.beginPath(); ctx.arc(0, -r * .8, r * .72, 0, 7); ctx.fill(); }
      if (b.id === 'galleo') { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(0, -r * 1, r * .75, Math.PI, 0); ctx.fill(); ctx.fillRect(face > 0 ? 0 : -r * 1.1, -r * 1, r * 1.1, r * .22); }
      if (b.id === 'dragot') { ctx.fillStyle = b.accent; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * r * .35 - 4, -r * 1.4); ctx.lineTo(i * r * .35, -r * 1.9); ctx.lineTo(i * r * .35 + 4, -r * 1.4); ctx.fill(); } ctx.fillStyle = '#a3e635'; ctx.beginPath(); ctx.ellipse(face * r * .45, -r * .6, r * .4, r * .25, 0, 0, 7); ctx.fill(); }
      if (b.id === 'ninjagravity') { ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(0, -r * .8, r * .74, 0, 7); ctx.fill(); ctx.fillStyle = b.accent; ctx.fillRect(-r * .75, -r * 1.1, r * 1.5, r * .22); ctx.fillStyle = '#fff'; ctx.fillRect(-r * .4, -r * .82, r * .8, r * .2); }
      if (b.id === 'lobita') { ctx.fillStyle = b.color; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * r * .25, -r * 1.35); ctx.lineTo(s * r * .75, -r * 2); ctx.lineTo(s * r * .85, -r * 1.2); ctx.fill(); } ctx.fillStyle = b.accent; ctx.beginPath(); ctx.arc(0, -r * .55, 3, 0, 7); ctx.fill(); }
      if (b.id === 'superboy') { ctx.fillStyle = '#111'; ctx.fillRect(-r * .6, -r * 1, r * 1.2, r * .3); }
      ctx.fillStyle = '#111';
      if (b.id !== 'ninjagravity' && b.id !== 'superboy') { ctx.beginPath(); ctx.arc(face * r * .25 - r * .22, -r * .85, 2, 0, 7); ctx.arc(face * r * .25 + r * .22, -r * .85, 2, 0, 7); ctx.fill(); }
    }
    if (skin === 'dragon') {
      ctx.fillStyle = '#fde047';
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * r * .28 - 5, -r * 1.35); ctx.lineTo(i * r * .34, -r * (2.1 - Math.abs(i) * .2)); ctx.lineTo(i * r * .28 + 5, -r * 1.35); ctx.fill(); }
    }
    ctx.restore();
  }
  function star(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }

  // ---------- mapas ----------
  function parseMap(def) {
    const rows = def.rows ? def.rows.map(r => r.padEnd(26, '.').slice(0, 26)) : def.half.map(r => {
      const l = r.padEnd(13, '.').slice(0, 13);
      const rr = l.split('').reverse().map(c => c === 'A' ? 'B' : c === 'B' ? 'A' : c).join('');
      return l + rr;
    });
    const spawns = { 0: [], 1: [] }, mine = [];
    rows.forEach((row, ty) => [...row].forEach((c, tx) => {
      const p = { x: tx * T + T / 2, y: ty * T + T / 2 };
      if (c === 'A') spawns[0].push(p); else if (c === 'B') spawns[1].push(p); else if (c === 'G') mine.push(p);
    }));
    const mc = mine.length ? { x: mine.reduce((s, p) => s + p.x, 0) / mine.length, y: mine.reduce((s, p) => s + p.y, 0) / mine.length } : { x: rows[0].length * T / 2, y: rows.length * T / 2 };
    return { rows, w: rows[0].length, h: rows.length, spawns, mine: mc, def };
  }

  // ---------- partida ----------
  function startMatch(canvas, o) {
    const map = parseMap(o.customMap || D.maps[o.mapId]);
    const W = map.w * T, H = map.h * T;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const mode = o.mode;
    const ents = [], bullets = [], gems = [], fx = [], zones = [];
    let time = 0, over = false, raf = 0, last = performance.now(), clock = mode === 'emeralds' ? 150 : mode === 'cross' ? 60 : mode === 'training' ? 1e9 : 90, gemT = 1;
    const hold = [0, 0];
    const keys = {}, mouse = { x: W / 2, y: H / 2, down: false, used: false };
    const joy = { on: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };

    const tile = (x, y) => { const tx = Math.floor(x / T), ty = Math.floor(y / T); return (map.rows[ty] || '')[tx] || '#'; };
    const solid = (x, y) => { const c = tile(x, y); return c === '#' || c === '~'; };
    const blocked = (x, y, r = R) => solid(x - r, y - r) || solid(x + r, y - r) || solid(x - r, y + r) || solid(x + r, y + r);
    const inBush = e => tile(e.x, e.y) === 'b';

    function mk(bid, skin, team, idx, isPlayer) {
      const lvl = isPlayer ? Math.max(1, o.level | 0 || 1) : (o.botLevel || 4), lm = 1 + D.upgrade.bonus * (lvl - 1);
      const b = brById(bid), sp = map.spawns[team][idx % Math.max(1, map.spawns[team].length)] || { x: W / 2, y: H / 2 };
      return { b, skin, team, isPlayer, x: sp.x, y: sp.y, sx: sp.x, sy: sp.y, hp: b.hp * lm, max: b.hp * lm, lm, lvl, inv: 0, visionT: 0, ammo: 3, ammoT: 0, cd: 0, charge: 0,
        carry: 0, dir: team ? Math.PI : 0, dead: false, respawn: 0, buff: null, dash: null, gadgetUsed: false, slow: 1,
        ai: { wander: 0, wx: 0, wy: 0, react: rnd(.1, .4), lastX: 0, lastY: 0 }, collected: 0 };
    }
    const pool = D.brawlers.map(b => b.id);
    const pick = () => pool[Math.floor(Math.random() * pool.length)];
    const skinPick = () => Math.random() < .35 ? D.skinStyles[Math.floor(Math.random() * D.skinStyles.length)].key : null;
    ents.push(mk(o.brawlerId, o.skinKey || null, 0, 0, true));
    if (mode === 'cross') ents.push(mk(pick(), skinPick(), 1, 0));
    else if (mode === 'training') {
      for (let i = 0; i < 3; i++) { const d = mk('cookid', 'ghost', 1, i); d.hp = d.max = 40000; d.dummy = true; ents.push(d); }
    } else {
      for (let i = 1; i < 3; i++) ents.push(mk((o.mates && brById(o.mates[i - 1]) ? o.mates[i - 1] : pick()), skinPick(), 0, i));
      for (let i = 0; i < 3; i++) ents.push(mk(pick(), skinPick(), 1, i));
    }
    // campo de distancias (BFS) hacia la meta de cada equipo, para que los bots rodeen muros
    const goals = t => map.spawns[1 - t].length ? map.spawns[1 - t] : [{ x: W / 2, y: H / 2 }];
    function field(t) {
      const d = map.rows.map(r => Array(r.length).fill(1e9)), q = [];
      for (const g of goals(t)) { const tx = Math.floor(g.x / T), ty = Math.floor(g.y / T); d[ty][tx] = 0; q.push([tx, ty]); }
      while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, c = (map.rows[ny] || '')[nx]; if (c && c !== '#' && c !== '~' && d[ny][nx] > d[y][x] + 1) { d[ny][nx] = d[y][x] + 1; q.push([nx, ny]); } } }
      return d;
    }
    const fields = mode === 'cross' ? [field(0), field(1)] : null;
    const me = ents[0];

    function dmg(t, amt, src) {
      if (t.dead || over || t.inv > 0) return;
      t.hp -= amt;
      fx.push({ k: 'txt', x: t.x, y: t.y - 30, s: Math.round(amt), t: 0, max: .7, c: t.team === me.team ? '#ff9aa8' : '#fff' });
      if (src) src.charge = Math.min(1, src.charge + .13);
      if (t.hp <= 0) {
        t.dead = true; t.hp = 0; t.buff = null; t.dash = null;
        if (mode === 'emeralds') {
          for (let i = 0; i < t.carry; i++) gems.push({ x: t.x, y: t.y, vx: rnd(-2, 2), vy: rnd(-2, 2), age: 0 });
          t.carry = 0; t.respawn = 3.5;
        } else if (mode === 'training') t.respawn = 1.5;
        fx.push({ k: 'ring', x: t.x, y: t.y, r: 8, t: 0, max: .4, to: 40, c: '#fff' });
      }
    }

    function fire(e, ang) {
      if (e.dead || e.cd > 0 || e.ammo < 1 || over) return false;
      const a = e.b.atk, mult = (e.buff ? e.buff.dmg : 1) * e.lm;
      e.ammo--; e.cd = .28; e.dir = ang;
      if (a.kind === 'melee') {
        fx.push({ k: 'slash', x: e.x, y: e.y, a: ang, r: a.range, w: a.arc, t: 0, max: .2 });
        for (const f of ents) if (!f.dead && f.team !== e.team) {
          const d = Math.hypot(f.x - e.x, f.y - e.y); if (d > a.range + R) continue;
          let da = Math.abs(Math.atan2(f.y - e.y, f.x - e.x) - ang); da = Math.min(da, Math.PI * 2 - da);
          if (da < a.arc / 2 + .25) dmg(f, a.dmg * mult, e);
        }
        return true;
      }
      const n = a.kind === 'spread' ? a.count : 1, arc = a.kind === 'spread' ? a.arc : 0;
      for (let i = 0; i < n; i++) {
        const an = ang + (n > 1 ? (i / (n - 1) - .5) * arc : 0);
        bullets.push({ x: e.x, y: e.y, vx: Math.cos(an) * a.speed, vy: Math.sin(an) * a.speed, d: 0, range: a.range, dmg: a.dmg * mult / (a.kind === 'spread' ? 1 : 1), team: e.team, size: a.size, color: a.color, owner: e, laser: a.kind === 'laser' });
      }
      return true;
    }
    function useSuper(e, ang) {
      if (e.dead || e.charge < 1 || over) return false;
      const s = e.b.sup; e.charge = 0; e.dir = ang;
      if (s.kind === 'blast') {
        const cx = e.x + Math.cos(ang) * s.dist, cy = e.y + Math.sin(ang) * s.dist;
        fx.push({ k: 'ring', x: cx, y: cy, r: 10, to: s.radius, t: 0, max: .45, c: '#ffb020', fill: true });
        for (const f of ents) if (!f.dead && f.team !== e.team && Math.hypot(f.x - cx, f.y - cy) < s.radius + R) dmg(f, s.dmg * e.lm, e);
      } else if (s.kind === 'buff') {
        e.buff = { t: s.dur, speed: s.speed, dmg: s.dmg };
        e.hp = Math.min(e.max, e.hp + e.max * s.heal);
        fx.push({ k: 'ring', x: e.x, y: e.y, r: 10, to: 70, t: 0, max: .5, c: '#facc15' });
      } else if (s.kind === 'dash') {
        e.dash = { t: .28, vx: Math.cos(ang) * s.dist / .28, vy: Math.sin(ang) * s.dist / .28, hit: new Set(), s };
      } else if (s.kind === 'gravity') {
        fx.push({ k: 'ring', x: e.x, y: e.y, r: s.radius, to: 10, t: 0, max: .5, c: '#22d3ee' });
        for (const f of ents) if (!f.dead && f.team !== e.team) {
          const dx = e.x - f.x, dy = e.y - f.y, d = Math.hypot(dx, dy);
          if (d < s.radius) {
            dmg(f, s.dmg * e.lm, e);
            const m = Math.min(s.pull, Math.max(0, d - 30)) / (d || 1);
            if (!blocked(f.x + dx * m, f.y + dy * m)) { f.x += dx * m; f.y += dy * m; }
          }
        }
      }
      return true;
    }
    function useGadget(e, ang) {
      const g = e.b.gadget; if (!g || e.gadgetUsed || e.dead || over) return false;
      if (mode !== 'training') e.gadgetUsed = true;
      if (g.kind === 'slime') zones.push({ x: e.x + Math.cos(ang) * g.dist, y: e.y + Math.sin(ang) * g.dist, r: g.radius, t: g.dur, team: e.team, slow: g.slow });
      else if (g.kind === 'dodge') { e.dash = { t: .22, vx: Math.cos(ang + Math.PI) * g.dist / .22, vy: Math.sin(ang + Math.PI) * g.dist / .22, hit: new Set(), s: { dmg: 0, radius: 0 } }; e.inv = .5; fx.push({ k: 'ring', x: e.x, y: e.y, r: 10, to: 45, t: 0, max: .3, c: '#a5f3fc' }); }
      else if (g.kind === 'vision') { e.visionT = g.dur; fx.push({ k: 'ring', x: e.x, y: e.y, r: 10, to: 60, t: 0, max: .4, c: '#fde047' }); }
      else if (g.kind === 'fury') {
        fx.push({ k: 'ring', x: e.x, y: e.y, r: 10, to: g.radius, t: 0, max: .3, c: '#fb923c', fill: true });
        for (const f of ents) if (!f.dead && f.team !== e.team && Math.hypot(f.x - e.x, f.y - e.y) < g.radius + R) dmg(f, g.dmg * e.lm, e);
      }
      return true;
    }

    function step(e, dx, dy) {
      if (!blocked(e.x + dx, e.y)) e.x += dx;
      if (!blocked(e.x, e.y + dy)) e.y += dy;
    }
    const nearestFoe = (e, maxd = 1e9) => {
      let best = null, bd = maxd;
      for (const f of ents) if (!f.dead && f.team !== e.team) { const d = Math.hypot(f.x - e.x, f.y - e.y); if (d < bd) { bd = d; best = f; } }
      return best && { f: best, d: bd };
    };

    function aiUpdate(e, dt) {
      const ai = e.ai, nf = nearestFoe(e);
      let tx = null, ty = null, mvx = 0, mvy = 0;
      const rangeA = e.b.atk.range;
      const seen = nf && nf.d < 420 && !(inBush(nf.f) && nf.d > 130);
      if (seen) {
        const a = Math.atan2(nf.f.y - e.y, nf.f.x - e.x);
        const want = rangeA * .7;
        if (nf.d > want + 30) { tx = nf.f.x; ty = nf.f.y; }
        else if (nf.d < want - 50) { mvx = -Math.cos(a); mvy = -Math.sin(a); }
        else { const s = (Math.floor(time / 1.3 + e.sx) % 2 ? 1 : -1); mvx = -Math.sin(a) * s; mvy = Math.cos(a) * s; }
        ai.react -= dt;
        if (ai.react <= 0 && nf.d < rangeA * .95) { fire(e, a + rnd(-.16, .16)); ai.react = rnd(.15, .5); }
        if (e.charge >= 1 && nf.d < 230) useSuper(e, a);
        e.dir = a;
        if (mode === 'cross') { mvx = 0; mvy = 0; }
      }
      if (mode === 'cross') {
        const d = fields[e.team], tx0 = Math.floor(e.x / T), ty0 = Math.floor(e.y / T);
        let best = null, bv = d[ty0][tx0];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const v = (d[ty0 + dy] || [])[tx0 + dx]; if (v !== undefined && v < bv && (dx === 0 || dy === 0 || (d[ty0][tx0 + dx] < 1e9 && d[ty0 + dy][tx0] < 1e9))) { bv = v; best = [dx, dy]; } }
        if (best) { const cx = (tx0 + best[0]) * T + T / 2, cy = (ty0 + best[1]) * T + T / 2, dd = Math.hypot(cx - e.x, cy - e.y) || 1; mvx = (cx - e.x) / dd; mvy = (cy - e.y) / dd; }
        else { const g = goals(e.team)[0], dd = Math.hypot(g.x - e.x, g.y - e.y) || 1; mvx = (g.x - e.x) / dd; mvy = (g.y - e.y) / dd; }
        tx = null;
      } else if (!seen && mode === 'emeralds') {
        let g = null, gd = 1e9;
        for (const q of gems) { const d = Math.hypot(q.x - e.x, q.y - e.y); if (d < gd) { gd = d; g = q; } }
        const tgt = g || map.mine;
        tx = tgt.x + (g ? 0 : rnd(-30, 30)); ty = tgt.y;
        if (Math.hypot(map.mine.x - e.x, map.mine.y - e.y) < 70 && !g) { tx = null; }
      } else if (!seen && nf) { tx = nf.f.x; ty = nf.f.y; }
      if (tx !== null) { const d = Math.hypot(tx - e.x, ty - e.y) || 1; mvx = (tx - e.x) / d; mvy = (ty - e.y) / d; }
      // atascado -> desvío
      if (ai.wander > 0) { ai.wander -= dt; mvx = ai.wx; mvy = ai.wy; }
      else if ((mvx || mvy) && Math.hypot(e.x - ai.lastX, e.y - ai.lastY) < .4 * 60 * dt) {
        ai.wander = rnd(.3, .7); const a = rnd(0, 6.28); ai.wx = Math.cos(a); ai.wy = Math.sin(a);
      }
      ai.lastX = e.x; ai.lastY = e.y;
      return [mvx, mvy];
    }

    function playerInput() {
      let mx = 0, my = 0;
      if (keys.KeyW || keys.ArrowUp) my -= 1; if (keys.KeyS || keys.ArrowDown) my += 1;
      if (keys.KeyA || keys.ArrowLeft) mx -= 1; if (keys.KeyD || keys.ArrowRight) mx += 1;
      if (joy.on) { mx = joy.x; my = joy.y; }
      const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
      return [mx, my];
    }
    const mouseAim = () => Math.atan2(mouse.y - me.y, mouse.x - me.x);
    function autoAim() { const nf = nearestFoe(me, 520); return nf ? Math.atan2(nf.f.y - me.y, nf.f.x - me.x) : me.dir; }
    const aimNow = () => mouse.used ? mouseAim() : autoAim();

    function update(dt) {
      time += dt; clock -= dt;
      for (const e of ents) {
        e.cd = Math.max(0, e.cd - dt); e.inv = Math.max(0, e.inv - dt); e.visionT = Math.max(0, e.visionT - dt);
        if (mode === 'training' && e.isPlayer && !e.dead) { e.ammo = 3; e.charge = 1; }
        if (e.dead) {
          if ((mode === 'emeralds' || mode === 'training') && !over) { e.respawn -= dt; if (e.respawn <= 0) { e.dead = false; e.hp = e.max; e.x = e.sx; e.y = e.sy; e.ammo = 3; } }
          continue;
        }
        if (e.ammo < 3) { e.ammoT += dt; if (e.ammoT >= e.b.atk.reload) { e.ammo++; e.ammoT = 0; } }
        if (e.buff && (e.buff.t -= dt) <= 0) e.buff = null;
        e.slow = 1;
        for (const z of zones) if (z.team !== e.team && Math.hypot(z.x - e.x, z.y - e.y) < z.r) e.slow = Math.min(e.slow, z.slow);
        if (e.dash) {
          const d = e.dash; d.t -= dt;
          step(e, d.vx * dt, d.vy * dt);
          for (const f of ents) if (!f.dead && f.team !== e.team && !d.hit.has(f) && Math.hypot(f.x - e.x, f.y - e.y) < d.s.radius) { d.hit.add(f); dmg(f, d.s.dmg * e.lm, e); }
          if (d.t <= 0) e.dash = null;
          continue;
        }
        let mv;
        if (e.isPlayer) {
          mv = playerInput();
          if (mouse.used && mouse.down) fire(e, mouseAim());
          if (mv[0] || mv[1]) e.dir = Math.atan2(my0(mv), mv[0]);
        } else mv = e.dummy ? [0, 0] : aiUpdate(e, dt);
        const sp = e.b.speed * (e.buff ? e.buff.speed : 1) * e.slow * 60 * dt;
        const l = Math.hypot(mv[0], mv[1]);
        if (l > .01) step(e, mv[0] / Math.max(1, l) * sp, mv[1] / Math.max(1, l) * sp);
        if (mode === 'emeralds') for (let i = gems.length - 1; i >= 0; i--) {
          const q = gems[i]; if (q.age > .4 && Math.hypot(q.x - e.x, q.y - e.y) < 24) { gems.splice(i, 1); e.carry++; fx.push({ k: 'ring', x: e.x, y: e.y, r: 6, to: 24, t: 0, max: .25, c: '#2ee6a0' }); }
        }
      }
      for (const z of zones) z.t -= dt;
      for (let i = zones.length - 1; i >= 0; i--) if (zones[i].t <= 0) zones.splice(i, 1);
      // balas
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * 60 * dt; b.y += b.vy * 60 * dt; b.d += Math.hypot(b.vx, b.vy) * 60 * dt;
        let dead = b.d > b.range || tile(b.x, b.y) === '#';
        if (!dead) for (const f of ents) if (!f.dead && f.team !== b.team && Math.hypot(f.x - b.x, f.y - b.y) < R + b.size) { dmg(f, b.dmg, b.owner); dead = true; break; }
        if (dead) bullets.splice(i, 1);
      }
      // esmeraldas
      if (mode === 'emeralds' && !over) {
        gemT -= dt;
        if (gemT <= 0 && gems.length < 28) { gemT = 2.2; const a = rnd(0, 6.28); gems.push({ x: map.mine.x, y: map.mine.y, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, age: 0 }); }
        for (const q of gems) { q.age += dt; const nx = q.x + q.vx * 60 * dt, ny = q.y + q.vy * 60 * dt; if (!solid(nx, ny)) { q.x = nx; q.y = ny; } q.vx *= .94; q.vy *= .94; }
      }
      for (const f of fx) f.t += dt;
      for (let i = fx.length - 1; i >= 0; i--) if (fx[i].t > fx[i].max) fx.splice(i, 1);
      checkEnd(dt);
    }
    const my0 = mv => mv[1];

    const teamGems = t => ents.filter(e => e.team === t).reduce((s, e) => s + e.carry, 0);
    function finish(win, draw) {
      if (over) return; over = true;
      const res = { win, draw: !!draw, collected: teamGems(me.team), time: 0 };
      setTimeout(() => { cancelAnimationFrame(raf); o.onEnd && o.onEnd(res); }, 900);
    }
    function checkEnd(dt) {
      if (over || mode === 'training') return;
      if (mode === 'emeralds') {
        for (const t of [0, 1]) { if (teamGems(t) >= 10) hold[t] += dt; else hold[t] = 0; }
        if (hold[0] >= 12 || hold[1] >= 12) return finish(hold[0] >= 12);
        if (clock <= 0) { const a = teamGems(0), b = teamGems(1); return finish(a > b, a === b); }
      } else if (mode === 'cross') {
        for (const e of ents) if (!e.dead && goals(e.team).some(g => Math.hypot(g.x - e.x, g.y - e.y) < 30)) return finish(e.team === me.team);
        const alive = t => ents.some(e => e.team === t && !e.dead);
        if (!alive(0) || !alive(1)) return finish(alive(0), !alive(0) && !alive(1));
        if (clock <= 0) return finish(false, true);
      } else {
        const alive = t => ents.some(e => e.team === t && !e.dead);
        if (!alive(0) || !alive(1)) return finish(alive(0), !alive(0) && !alive(1));
        if (clock <= 0) { const hp = t => ents.filter(e => e.team === t).reduce((s, e) => s + e.hp, 0); return finish(hp(0) > hp(1), hp(0) === hp(1)); }
      }
    }

    // ---------- render ----------
    function render() {
      ctx.clearRect(0, 0, W, H);
      const f = map.def.floor;
      for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
        const c = map.rows[y][x], px = x * T, py = y * T;
        ctx.fillStyle = f[(x + y) % 2]; ctx.fillRect(px, py, T, T);
        if (c === '#') { ctx.fillStyle = '#6b4f3a'; ctx.fillRect(px + 1, py + 1, T - 2, T - 2); ctx.fillStyle = '#8a6a50'; ctx.fillRect(px + 3, py + 3, T - 6, 8); ctx.fillStyle = '#4a3626'; ctx.fillRect(px + 1, py + T - 8, T - 2, 7); }
        else if (c === '~') { ctx.fillStyle = '#2f7fd1'; ctx.fillRect(px, py, T, T); ctx.strokeStyle = '#7cc0ff'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k < 2; k++) { const yy = py + 12 + k * 14; ctx.moveTo(px + 4, yy); ctx.quadraticCurveTo(px + 12, yy - 6 + Math.sin(time * 3 + x) * 2, px + 20, yy); ctx.quadraticCurveTo(px + 28, yy + 6, px + 36, yy); } ctx.stroke(); }
        else if (c === 'G') { ctx.fillStyle = 'rgba(46,230,160,.18)'; ctx.fillRect(px, py, T, T); }
      }
      // mina
      if (mode === 'emeralds') { ctx.fillStyle = '#2ee6a0'; for (let i = 0; i < 5; i++) { const a = i * 1.26 + time * .4; diamond(map.mine.x + Math.cos(a) * 16, map.mine.y + Math.sin(a) * 16, 9); } }
      if (mode === 'cross') for (const g of goals(me.team)) { ctx.strokeStyle = '#ffc83d'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.arc(g.x, g.y, 28 + Math.sin(time * 4) * 3, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#ffc83d'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('META', g.x, g.y + 5); ctx.textAlign = 'left'; }
      for (const z of zones) { ctx.fillStyle = 'rgba(120,255,120,.35)'; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 7); ctx.fill(); ctx.strokeStyle = '#7dff7d'; ctx.lineWidth = 3; ctx.stroke(); }
      for (const q of gems) { ctx.fillStyle = '#2ee6a0'; diamond(q.x, q.y, 9); }
      // personajes (ordenados por y)
      const ally = ents.filter(e => e.team === me.team && !e.dead);
      for (const e of [...ents].sort((a, b) => a.y - b.y)) {
        if (e.dead) continue;
        const hidden = e.team !== me.team && inBush(e) && !(me.visionT > 0) && !ally.some(a => Math.hypot(a.x - e.x, a.y - e.y) < 150);
        if (hidden) continue;
        const inb = inBush(e);
        ctx.globalAlpha = inb ? .6 : 1;
        drawBrawler(ctx, e.b, e.skin, e.x, e.y, R, e.dir, time);
        ctx.globalAlpha = 1;
        const w = 40, hx = e.x - w / 2, hy = e.y - 36;
        ctx.fillStyle = '#000a'; ctx.fillRect(hx - 1, hy - 1, w + 2, 8);
        ctx.fillStyle = e.team === me.team ? '#4ade80' : '#f87171'; ctx.fillRect(hx, hy, w * e.hp / e.max, 6);
        if (e.carry) { ctx.fillStyle = '#2ee6a0'; diamond(e.x - 14, hy - 8, 6); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(e.carry, e.x - 6, hy - 3); }
        if (e.isPlayer) { ctx.strokeStyle = '#ffc83d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y + 14, 16, 6, 0, 0, 7); ctx.stroke(); }
        if (e.buff) { ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, 22, 0, 7); ctx.stroke(); }
      }
      // arbustos encima
      for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (map.rows[y][x] === 'b') {
        ctx.fillStyle = 'rgba(38,120,52,.92)'; const px = x * T, py = y * T;
        ctx.beginPath(); ctx.arc(px + 12, py + 22, 13, 0, 7); ctx.arc(px + 28, py + 22, 13, 0, 7); ctx.arc(px + 20, py + 12, 13, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(80,170,80,.7)'; ctx.beginPath(); ctx.arc(px + 16, py + 10, 6, 0, 7); ctx.fill();
      }
      for (const b of bullets) {
        ctx.fillStyle = b.color;
        if (b.laser) { ctx.strokeStyle = b.color; ctx.lineWidth = b.size; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 3, b.y - b.vy * 3); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, 7); ctx.fill(); }
      }
      for (const f of fx) {
        const p = f.t / f.max;
        if (f.k === 'ring') { const r = f.r + (f.to - f.r) * p; ctx.globalAlpha = 1 - p; ctx.strokeStyle = f.c; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, 7); if (f.fill) { ctx.fillStyle = f.c; ctx.globalAlpha = (1 - p) * .35; ctx.fill(); ctx.globalAlpha = 1 - p; } ctx.stroke(); ctx.globalAlpha = 1; }
        else if (f.k === 'slash') { ctx.globalAlpha = 1 - p; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, f.r, f.a - f.w / 2, f.a + f.w / 2); ctx.fill(); ctx.globalAlpha = 1; }
        else if (f.k === 'txt') { ctx.globalAlpha = 1 - p; ctx.fillStyle = f.c; ctx.font = 'bold 16px sans-serif'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(f.s, f.x - 10, f.y - p * 24); ctx.fillText(f.s, f.x - 10, f.y - p * 24); ctx.globalAlpha = 1; }
      }
      // HUD
      ctx.fillStyle = '#000a'; ctx.fillRect(W / 2 - 150, 6, 300, 34); ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#fff'; const mm = Math.max(0, Math.ceil(clock)); ctx.fillText(mode === 'training' ? '∞' : Math.floor(mm / 60) + ':' + String(mm % 60).padStart(2, '0'), W / 2, 31);
      if (mode === 'training') { ctx.fillStyle = '#7dd3fc'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('ENTRENAMIENTO · súper y munición infinitos', W / 2, 58); ctx.font = 'bold 20px sans-serif'; }
      if (mode === 'emeralds') {
        ctx.fillStyle = '#60a5fa'; ctx.fillText('💎 ' + teamGems(0) + (hold[0] ? ' · ' + Math.ceil(12 - hold[0]) + 's' : ''), W / 2 - 95, 31);
        ctx.fillStyle = '#f87171'; ctx.fillText((hold[1] ? Math.ceil(12 - hold[1]) + 's · ' : '') + teamGems(1) + ' 💎', W / 2 + 95, 31);
      }
      if (mode === 'cross') { ctx.fillStyle = '#ffc83d'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('¡LLEGA AL OTRO LADO!', W / 2, 62); }
      ctx.textAlign = 'left';
      // barra de super + munición del jugador
      const bx = 14, by = H - 34;
      ctx.fillStyle = '#000a'; ctx.fillRect(bx - 2, by - 2, 154, 26);
      ctx.fillStyle = me.charge >= 1 ? '#ffc83d' : '#a78bfa'; ctx.fillRect(bx, by, 150 * me.charge, 10);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = i < me.ammo ? '#ff9f43' : '#444'; ctx.fillRect(bx + i * 52, by + 13, 46, 7); }
      if (me.dead && mode === 'emeralds' && !over) { ctx.fillStyle = '#000a'; ctx.fillRect(0, H / 2 - 30, W, 60); ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Reapareciendo en ' + Math.ceil(me.respawn) + '…', W / 2, H / 2 + 10); ctx.textAlign = 'left'; }
      if (over) { ctx.fillStyle = '#000a'; ctx.fillRect(0, 0, W, H); }
      if (joy.on) { ctx.strokeStyle = '#fff6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 50, 0, 7); ctx.stroke(); ctx.fillStyle = '#fff5'; ctx.beginPath(); ctx.arc(joy.ox + joy.x * 50, joy.oy + joy.y * 50, 22, 0, 7); ctx.fill(); }
    }
    function diamond(x, y, r) { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * .8, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * .8, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#d5fff0'; ctx.lineWidth = 1.5; ctx.stroke(); }

    function loop(now) {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      update(dt); render();
      if (!stopped) raf = requestAnimationFrame(loop);
    }
    let stopped = false;

    // ---------- entrada ----------
    const toGame = ev => { const r = canvas.getBoundingClientRect(); return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height }; };
    const kd = e => { keys[e.code] = true; if (e.code === 'Space') { useSuper(me, aimNow()); e.preventDefault(); } if (e.code === 'KeyE') useGadget(me, aimNow()); };
    const ku = e => { keys[e.code] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    canvas.addEventListener('contextmenu', e => { e.preventDefault(); useSuper(me, aimNow()); });
    canvas.addEventListener('pointermove', e => {
      const p = toGame(e);
      if (e.pointerType === 'mouse') { mouse.x = p.x; mouse.y = p.y; mouse.used = true; }
      else if (joy.on && e.pointerId === joy.id) { let dx = (p.x - joy.ox) / 50, dy = (p.y - joy.oy) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } joy.x = dx; joy.y = dy; }
    });
    canvas.addEventListener('pointerdown', e => {
      const p = toGame(e);
      if (e.pointerType === 'mouse') { if (e.button === 0) mouse.down = true; mouse.x = p.x; mouse.y = p.y; mouse.used = true; }
      else if (!joy.on && p.x < W * .5) { joy.on = true; joy.id = e.pointerId; joy.ox = p.x; joy.oy = p.y; joy.x = joy.y = 0; canvas.setPointerCapture(e.pointerId); }
    });
    const up = e => { if (e.pointerType === 'mouse') mouse.down = false; else if (e.pointerId === joy.id) { joy.on = false; joy.x = joy.y = 0; } };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

    raf = requestAnimationFrame(loop);
    return {
      fire: () => fire(me, aimNow()),
      super: () => useSuper(me, aimNow()),
      gadget: () => useGadget(me, aimNow()),
      hasGadget: !!me.b.gadget,
      stop() { stopped = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); },
      _debug: { ents, me, bullets, gems, update, render },
    };
  }

  window.Game = { startMatch, drawBrawler, brById };
})();
