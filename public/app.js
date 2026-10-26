// Rolax — interfaz (login, lobby, personajes, tienda, batalla)
(function () {
  const app = document.getElementById('app');
  const S = { user: null, events: [], ev: null, tab: 'cajas', game: null };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const br = id => D.brawlers.find(b => b.id === id);
  const skinLabel = k => { const s = D.skinStyles.find(x => x.key === k); return s ? s.name : 'Normal'; };

  async function api(path, body) {
    const t = localStorage.getItem('rolax_token');
    const r = await fetch('/api/' + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error || 'Error'); e.status = r.status; throw e; }
    return j;
  }
  function toast(msg) {
    const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; document.body.appendChild(d);
    setTimeout(() => d.remove(), 2400);
  }
  function preview(bid, skinKey, size) {
    const c = document.createElement('canvas'); c.width = c.height = size * 2; c.style.width = c.style.height = size + 'px';
    const x = c.getContext('2d'); const draw = () => { x.clearRect(0, 0, c.width, c.height); Game.drawBrawler(x, br(bid), skinKey || null, c.width / 2, c.height * .6, c.width * .2, 0, performance.now() / 1000); };
    draw(); setTimeout(draw, 300); setTimeout(draw, 900); // por si carga sprite
    return c;
  }
  const curSkin = bid => { const k = (S.user.skinSel[bid] || ''); return k ? k.split(':')[1] : null; };

  // ---------- login ----------
  function viewAuth(msg) {
    app.innerHTML = `<div class="screen"><div class="center">
      <div class="logo">ROLAX</div>
      <input id="u" placeholder="Usuario" maxlength="16" autocomplete="username">
      <input id="p" type="password" placeholder="Contraseña" autocomplete="current-password">
      <div class="err" id="err">${esc(msg || '')}</div>
      <button id="login">ENTRAR</button>
      <button id="reg" class="alt">CREAR CUENTA</button>
    </div></div>`;
    const go = async kind => {
      const err = document.getElementById('err'); err.textContent = '';
      try {
        const r = await api(kind, { username: document.getElementById('u').value, password: document.getElementById('p').value });
        localStorage.setItem('rolax_token', r.token); S.user = r.user; await loadEvents(); viewLobby();
      } catch (e) { err.textContent = e.message; }
    };
    document.getElementById('login').onclick = () => go('login');
    document.getElementById('reg').onclick = () => go('register');
    document.getElementById('p').onkeydown = e => { if (e.key === 'Enter') go('login'); };
  }
  async function loadEvents() {
    S.events = (await api('events')).events;
    if (!S.ev || !S.events.find(e => e.id === S.ev)) S.ev = (S.events.find(e => e.reward) || S.events[0]).id;
  }

  // ---------- barra superior ----------
  function topbar(back) {
    const u = S.user;
    return `<div class="top">${back ? '<button class="alt" id="back">◀</button>' : ''}
      <div class="pill tr">🏆 ${u.trophies}</div><div class="pill em">💎 ${u.emeralds}</div><div class="pill" style="color:#fbbf24">🪙 ${u.coins | 0}</div>
      <div class="spacer"></div><div class="pill">👤 ${esc(u.username)}</div>
      ${back ? '' : `<button class="alt" id="bra">PERSONAJES</button><button class="alt" id="shop">TIENDA</button><button class="green" id="dropb">CUADRODROP${u.drops ? ' ×' + u.drops : ''}</button><button class="alt" id="news">NOTICIAS</button><button class="alt" id="msgs">MENSAJES${u.unread ? ' (' + u.unread + ')' : ''}</button><button class="alt" id="maps">MAPAS</button><button class="alt" id="out">SALIR</button>`}
    </div>`;
  }
  function wireTop(back) {
    const $ = id => document.getElementById(id);
    if (back && $('back')) $('back').onclick = viewLobby;
    if ($('bra')) $('bra').onclick = viewBrawlers;
    if ($('shop')) $('shop').onclick = viewShop;
    if ($('dropb')) $('dropb').onclick = viewDrop;
    if ($('news')) $('news').onclick = viewNews;
    if ($('msgs')) $('msgs').onclick = viewMessages;
    if ($('maps')) $('maps').onclick = viewEditor;
    if ($('out')) $('out').onclick = () => { localStorage.removeItem('rolax_token'); S.user = null; viewAuth(); };
  }

  // ---------- lobby ----------
  function viewLobby() {
    const u = S.user, b = br(u.selected), sk = curSkin(b.id);
    app.innerHTML = `<div class="screen">${topbar()}
      <div class="lobby">
        <div class="panel"><h3>EVENTOS</h3><div id="evs"></div></div>
        <div class="panel hero"><div id="pv"></div><h2>${esc(b.name)}</h2>
          <div><span class="tag" style="background:${D.rarity[b.rarity].color}">${D.rarity[b.rarity].name}</span> <span class="tag" style="background:#334">${esc(skinLabel(sk))}</span></div>
          <div class="pill">Nivel ${(u.levels || {})[b.id] || 1}</div>
          <button class="play" id="play">JUGAR</button>
          <button class="alt" id="train" style="width:100%">ENTRENAR / PROBAR</button></div>
        <div class="panel"><h3>ATAQUES</h3>
          <div>🗡️ <b>${esc(b.atk.name)}</b><br><small>Daño ${b.atk.dmg} · ${b.atk.kind}</small></div>
          <div>⚡ <b>${esc(b.sup.name)}</b><br><small>Súper · carga golpeando</small></div>
          ${b.gadget ? `<div>🟢 <b>${esc(b.gadget.name)}</b><br><small>Gadget (tecla E)</small></div>` : ''}
          <small>WASD mover · clic disparar · Espacio/clic derecho súper</small>
          <h3>SKIN</h3><div class="tabs" id="skinbar"></div>
          <h3>COMPAÑEROS</h3><div class="tabs" id="mates"></div>
        </div></div></div>`;
    wireTop();
    document.getElementById('pv').appendChild(preview(b.id, sk, 180));
    const evs = document.getElementById('evs');
    S.events.forEach(e => {
      const d = document.createElement('div'); d.className = 'ev' + (e.id === S.ev ? ' sel' : '');
      d.innerHTML = `<div class="big" style="font-size:28px">${e.mode === 'emeralds' ? '💎' : e.mode === 'cross' ? '🏁' : '⚔️'}</div><div><b>${esc(e.name)}</b>${e.reward ? ` <span class="tag" style="background:#d97706">+${e.reward}💎</span>` : ''}<small>${esc(D.maps[e.map].name)} · ${esc(e.desc)}</small></div>`;
      d.onclick = () => { S.ev = e.id; viewLobby(); }; evs.appendChild(d);
    });
    const bar = document.getElementById('skinbar');
    const opts = [['', 'Normal'], ...D.skinStyles.filter(s => u.skins.includes(b.id + ':' + s.key)).map(s => [b.id + ':' + s.key, s.name])];
    opts.forEach(([val, name]) => {
      const x = document.createElement('button'); x.className = ((u.skinSel[b.id] || '') === val) ? '' : 'alt'; x.textContent = name;
      x.onclick = async () => { S.user = (await api('select', { brawler: b.id, skin: val || 'default' })).user; viewLobby(); };
      bar.appendChild(x);
    });
    const mates = document.getElementById('mates');
    [0, 1].forEach(i => {
      const sel = document.createElement('select'); sel.style.cssText = 'font:inherit;padding:8px;border-radius:8px;background:#0c1030;color:#fff;border:2px solid #262d5e';
      sel.innerHTML = '<option value="">Aleatorio</option>' + u.owned.map(id => `<option value="${id}" ${u.mates[i] === id ? 'selected' : ''}>${esc(br(id).name)}</option>`).join('');
      sel.onchange = async () => {
        const cur = [...mates.querySelectorAll('select')].map(s => s.value).filter(Boolean);
        S.user = (await api('select', { brawler: u.selected, mates: cur })).user;
      };
      mates.appendChild(sel);
    });
    document.getElementById('play').onclick = () => viewPick(false);
    document.getElementById('train').onclick = () => viewPick(true);
  }

  // ---------- elegir luchador antes del combate (o para entrenar/probar) ----------
  function viewPick(train) {
    const u = S.user; let sel = u.selected;
    const list = train ? D.brawlers : D.brawlers.filter(b => u.owned.includes(b.id));
    app.innerHTML = `<div class="screen">${topbar(true)}<h2>${train ? 'ENTRENAMIENTO · elige a quién probar' : 'ELIGE TU LUCHADOR'}</h2>
      <small>${train ? 'Puedes probar cualquier personaje, también los que aún no tienes. Súper y munición infinitos.' : 'Toca un luchador y pulsa ¡A LUCHAR!'}</small>
      <div class="grid" id="g"></div><button class="play" id="go">${train ? 'ENTRENAR' : '¡A LUCHAR!'}</button></div>`;
    wireTop(true);
    const g = document.getElementById('g');
    const draw = () => {
      g.innerHTML = '';
      list.forEach(b => {
        const own = u.owned.includes(b.id), c = document.createElement('div');
        c.className = 'card' + (sel === b.id ? ' sel' : '');
        c.appendChild(preview(b.id, own ? curSkin(b.id) : null, 96));
        c.insertAdjacentHTML('beforeend', `<b>${esc(b.name)}</b><span class="tag" style="background:${D.rarity[b.rarity].color}">${D.rarity[b.rarity].name}</span><small>🗡️ ${esc(b.atk.name)} · ⚡ ${esc(b.sup.name)}${b.gadget ? ' · 🟢 ' + esc(b.gadget.name) : ''}</small><small>${own ? 'Nivel ' + ((u.levels || {})[b.id] || 1) : '🔒 Prueba'}</small>`);
        c.onclick = () => { sel = b.id; draw(); };
        g.appendChild(c);
      });
    };
    draw();
    document.getElementById('go').onclick = async () => {
      if (train) return viewBattle(null, { train: true, brawler: sel });
      try { S.user = (await api('select', { brawler: sel })).user; } catch (e) { return toast(e.message); }
      viewBattle();
    };
  }

  // ---------- Cuadrodrop ----------
  function viewDrop() {
    const u = S.user;
    app.innerHTML = `<div class="screen">${topbar(true)}<h2>CUADRODROP</h2>
      <div class="center" style="align-items:center;text-align:center">
        <div class="cube" id="cube">${Array.from({ length: 9 }, (_, i) => `<i style="--c:${['#60a5fa', '#a855f7', '#facc15'][i % 3]};--dx:${(i % 3 - 1) * 90 + Math.random() * 40 - 20}px;--dy:${(Math.floor(i / 3) - 1) * 90 + Math.random() * 40 - 20}px;--r:${Math.random() * 180 - 90}deg"></i>`).join('')}</div>
        <div id="res" style="min-height:120px"></div>
        <button class="green play" id="open">${u.drops ? 'ABRIR (' + u.drops + ' disponibles)' : 'COMPRAR Y ABRIR · ' + D.drop.price + ' 💎'}</button>
        <small>Gana partidas para conseguir Cuadrodrops gratis. Pueden salir personajes, monedas y esmeraldas.</small>
      </div></div>`;
    wireTop(true);
    document.getElementById('open').onclick = async function () {
      this.disabled = true;
      try {
        const r = await api('drop/open', { buy: !u.drops });
        const cube = document.getElementById('cube'); cube.classList.add('shake');
        await new Promise(res => setTimeout(res, 900));
        cube.classList.remove('shake'); cube.classList.add('burst');
        S.user = r.user;
        const t = D.drop.tiers.find(x => x.key === r.reward.tier), res = document.getElementById('res');
        res.innerHTML = `<h2 style="color:${t.color}">${esc(t.name)}</h2><div class="big" style="font-size:28px">+${r.reward.coins} 🪙 · +${r.reward.emeralds} 💎</div>`;
        if (r.reward.brawler) { const b = br(r.reward.brawler); res.insertAdjacentHTML('beforeend', '<h3>¡Nuevo personaje!</h3>'); res.appendChild(preview(b.id, null, 110)); res.insertAdjacentHTML('beforeend', `<h2>${esc(b.name)}</h2>`); }
        const nb = document.getElementById('open'); nb.disabled = false; nb.textContent = 'OTRA VEZ'; nb.onclick = viewDrop;
      } catch (e) { toast(e.message); this.disabled = false; }
    };
  }

  // ---------- personajes ----------
  function viewBrawlers() {
    app.innerHTML = `<div class="screen">${topbar(true)}<h2>PERSONAJES</h2><div class="grid" id="g"></div></div>`;
    wireTop(true);
    const g = document.getElementById('g');
    D.brawlers.forEach(b => {
      const own = S.user.owned.includes(b.id), c = document.createElement('div');
      c.className = 'card' + (own ? '' : ' lock') + (S.user.selected === b.id ? ' sel' : '');
      c.appendChild(preview(b.id, curSkin(b.id), 96));
      c.insertAdjacentHTML('beforeend', `<b>${esc(b.name)}</b><span class="tag" style="background:${D.rarity[b.rarity].color}">${D.rarity[b.rarity].name}</span><small>❤ ${b.hp} · ${esc(b.atk.name)}</small><small>${own ? 'Toca para elegir' : '🔒 Sal de una caja'}</small>`);
      if (own) {
        const lv = (S.user.levels || {})[b.id] || 1, cost = D.upgrade.cost[lv - 1];
        c.insertAdjacentHTML('beforeend', `<div class="pill">Nivel ${lv}${lv >= D.upgrade.max ? ' (MAX)' : ''}</div>`);
        if (lv < D.upgrade.max) {
          const up = document.createElement('button'); up.className = 'green'; up.style.padding = '8px 12px'; up.textContent = 'MEJORAR · ' + cost + ' 🪙';
          up.disabled = (S.user.coins | 0) < cost;
          up.onclick = async ev => { ev.stopPropagation(); try { S.user = (await api('upgrade', { brawler: b.id })).user; toast(b.name + ' → nivel ' + (lv + 1)); viewBrawlers(); } catch (e) { toast(e.message); } };
          c.appendChild(up);
        }
        c.onclick = async () => { S.user = (await api('select', { brawler: b.id })).user; viewLobby(); };
      }
      g.appendChild(c);
    });
  }

  // ---------- tienda ----------
  function viewShop() {
    app.innerHTML = `<div class="screen">${topbar(true)}
      <div class="tabs"><button id="t1" class="${S.tab === 'cajas' ? '' : 'alt'}">CAJAS</button><button id="t2" class="${S.tab === 'skins' ? '' : 'alt'}">SKINS</button><button id="t3" class="${S.tab === 'pago' ? '' : 'alt'}">COMPRAR 💎</button></div>
      <div class="grid" id="g"></div></div>`;
    wireTop(true);
    const go = t => () => { S.tab = t; viewShop(); };
    t1.onclick = go('cajas'); t2.onclick = go('skins'); t3.onclick = go('pago');
    const g = document.getElementById('g');
    if (S.tab === 'cajas') {
      const icons = { normal: '🧰', medio: '💼', mega: '🎒', pro: '🎃' };
      Object.entries(D.boxes).forEach(([k, bx]) => {
        const c = document.createElement('div'); c.className = 'card';
        c.innerHTML = `<div class="box">${icons[k]}</div><b>${esc(bx.name)}</b><small>${bx.em[0]}-${bx.em[1]}💎 · ${Math.round(bx.brawler * 100)}% personaje</small><button>${bx.price} 💎</button>`;
        c.querySelector('button').onclick = async () => {
          try { const r = await api('box', { type: k }); S.user = r.user; boxModal(r.reward); } catch (e) { toast(e.message); }
        };
        g.appendChild(c);
      });
    } else if (S.tab === 'skins') {
      S.user.owned.forEach(id => D.skinStyles.forEach(st => {
        const key = id + ':' + st.key, has = S.user.skins.includes(key), c = document.createElement('div'); c.className = 'card';
        c.appendChild(preview(id, st.key, 96));
        c.insertAdjacentHTML('beforeend', `<b>${esc(br(id).name)}</b><small>${esc(st.name)} · ${esc(st.theme)}</small>`);
        const btn = document.createElement('button'); btn.textContent = has ? (S.user.skinSel[id] === key ? 'PUESTA ✓' : 'PONER') : st.price + ' 💎';
        btn.className = has ? 'alt' : 'green';
        btn.onclick = async () => {
          try { S.user = (has ? await api('select', { brawler: id, skin: key }) : await api('skin', { skin: key })).user; viewShop(); } catch (e) { toast(e.message); }
        };
        c.appendChild(btn); g.appendChild(c);
      }));
    } else {
      g.innerHTML = `<div class="panel" style="grid-column:1/-1"><h3>Pagos</h3><p>Las compras con dinero real llegarán pronto. 💎<br><small>Por ahora las esmeraldas se ganan jugando y con las cajas.</small></p><button disabled>Próximamente</button></div>`;
    }
  }
  function boxModal(r) {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="panel"><h2>¡CAJA ABIERTA!</h2><div class="big" style="color:var(--em)">+${r.emeralds} 💎</div><div class="big" style="font-size:30px;color:#fbbf24">+${r.coins | 0} 🪙</div><div id="nb"></div><button>OK</button></div>`;
    if (r.brawler) { const b = br(r.brawler); m.querySelector('#nb').innerHTML = `<h3>¡Nuevo personaje!</h3>`; m.querySelector('#nb').appendChild(preview(b.id, null, 120)); m.querySelector('#nb').insertAdjacentHTML('beforeend', `<h2>${esc(b.name)}</h2>`); }
    m.querySelector('button').onclick = () => { m.remove(); viewShop(); };
    document.body.appendChild(m);
  }

  // ---------- batalla ----------
  function viewBattle(custom, opts) {
    S.custom = custom || null; S.opts = opts || null;
    const train = !!(opts && opts.train);
    const ev = train ? { id: 'train', mode: 'training', map: 'entrena' } : custom ? { id: 'custom', mode: custom.mode, map: null } : S.events.find(e => e.id === S.ev), u = S.user;
    const bid = train ? opts.brawler : u.selected, sk = u.owned.includes(bid) ? curSkin(bid) : null;
    app.innerHTML = `<div id="battle"><canvas id="cv"></canvas>
      <button id="exit" class="alt" style="position:absolute;left:10px;top:48px;padding:8px 12px;z-index:3">✕ SALIR</button>
      <div class="mbtns"><button id="bf" class="red">🔥<br>DISPARO</button><button id="bs">⚡<br>SÚPER</button><button id="bg" class="green" style="display:none">🟢<br>GADGET</button></div></div>`;
    const g = Game.startMatch(document.getElementById('cv'), {
      brawlerId: bid, skinKey: sk, mapId: ev.map, mode: ev.mode, customMap: custom || undefined, mates: u.mates,
      level: u.owned.includes(bid) ? ((u.levels || {})[bid] || 1) : 1,
      onEnd: res => endBattle(ev, res),
    });
    S.game = g;
    document.getElementById('exit').onclick = () => { g.stop(); S.game = null; if (train) viewLobby(); else if (custom) viewEditor(); else viewLobby(); };
    const hold = (el, fn) => { let iv; el.onpointerdown = e => { e.preventDefault(); fn(); iv = setInterval(fn, 250); }; const stop = () => clearInterval(iv); el.onpointerup = el.onpointerleave = el.onpointercancel = stop; };
    hold(document.getElementById('bf'), () => g.fire());
    document.getElementById('bs').onpointerdown = e => { e.preventDefault(); g.super(); };
    if (g.hasGadget) { const bg = document.getElementById('bg'); bg.style.display = ''; bg.onpointerdown = e => { e.preventDefault(); g.gadget(); }; }
  }
  async function endBattle(ev, res) {
    S.game && S.game.stop(); S.game = null;
    let r = null;
    if (ev.id !== 'custom') { try { r = await api('result', { win: res.win, draw: res.draw, collected: res.collected, eventId: ev.id }); S.user = r.user; } catch (e) { toast(e.message); } }
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="panel"><div class="big">${res.win ? '🏆 ¡VICTORIA!' : res.draw ? 'EMPATE' : '💀 DERROTA'}</div>
      ${r ? `<div class="pill tr">🏆 ${r.trophies >= 0 ? '+' : ''}${r.trophies}</div><div class="pill em">💎 +${r.emeralds}</div><div class="pill" style="color:#fbbf24">🪙 +${r.coins}</div>${r.drop ? '<div class="pill" style="background:#7c3aed">🎁 ¡Ganaste un Cuadrodrop!</div>' : ''}` : ev.id === 'custom' ? '<small>Mapa de prueba: sin recompensas</small>' : '<small>Sin recompensa (partidas muy seguidas)</small>'}
      <button id="again">OTRA VEZ</button><button class="alt" id="menu">MENÚ</button></div>`;
    document.body.appendChild(m);
    m.querySelector('#menu').onclick = () => { m.remove(); ev.id === 'custom' ? viewEditor() : viewLobby(); };
    m.querySelector('#again').onclick = () => { m.remove(); viewBattle(S.custom, S.opts); };
  }

  // ---------- noticias ----------
  async function viewNews() {
    app.innerHTML = `<div class="screen">${topbar(true)}<h2>NOTICIAS</h2><div id="g" style="display:flex;flex-direction:column;gap:10px"></div></div>`;
    wireTop(true);
    const g = document.getElementById('g');
    try {
      const { news } = await api('news');
      [...news].reverse().forEach(n => { const d = document.createElement('div'); d.className = 'panel'; d.innerHTML = `<small>${esc(n.date)}</small><h3>${esc(n.title)}</h3><div>${esc(n.body)}</div>`; g.appendChild(d); });
      if (!news.length) g.textContent = 'Todavía no hay noticias.';
    } catch (e) { g.textContent = e.message; }
  }

  // ---------- mensajes ----------
  async function viewMessages(prefill) {
    app.innerHTML = `<div class="screen">${topbar(true)}<h2>MENSAJES</h2>
      <div class="panel"><b>Nuevo mensaje</b>
        <input id="to" placeholder="Usuario destino" maxlength="16" value="${esc(prefill || '')}">
        <input id="tx" placeholder="Mensaje (máx. 300)" maxlength="300">
        <select id="mp" style="font:inherit;padding:10px;border-radius:10px;background:#0c1030;color:#fff;border:2px solid #262d5e"><option value="">Sin mapa adjunto</option></select>
        <button id="send">ENVIAR</button></div>
      <div id="g" style="display:flex;flex-direction:column;gap:10px"></div></div>`;
    wireTop(true);
    let maps = [], inbox = [];
    try { maps = (await api('maps')).maps; inbox = (await api('msg/inbox')).inbox; S.user = (await api('msg/read', {})).user; } catch (e) { toast(e.message); }
    const mp = document.getElementById('mp');
    maps.forEach(m => mp.insertAdjacentHTML('beforeend', `<option value="${m.id}">🗺️ ${esc(m.name)}</option>`));
    document.getElementById('send').onclick = async () => {
      try { await api('msg/send', { to: document.getElementById('to').value, text: document.getElementById('tx').value, mapId: mp.value || undefined }); toast('Enviado ✓'); document.getElementById('tx').value = ''; }
      catch (e) { toast(e.message); }
    };
    const g = document.getElementById('g');
    if (!inbox.length) g.innerHTML = '<div class="panel">No tienes mensajes.</div>';
    inbox.forEach(m => {
      const d = document.createElement('div'); d.className = 'panel';
      d.innerHTML = `<small>${new Date(m.ts).toLocaleString()}</small><b>De: ${esc(m.from)}</b><div>${esc(m.text)}</div>`;
      if (m.map) {
        const row = document.createElement('div'); row.className = 'tabs';
        row.innerHTML = `<span class="pill">🗺️ ${esc(m.map.name)}</span>`;
        const play = document.createElement('button'); play.className = 'alt'; play.textContent = 'PROBAR';
        play.onclick = () => viewBattle(m.map);
        const save = document.createElement('button'); save.className = 'green'; save.textContent = 'GUARDAR MAPA';
        save.onclick = async () => { try { await api('msg/savemap', { id: m.id }); toast('Mapa guardado en MAPAS ✓'); } catch (e) { toast(e.message); } };
        row.append(play, save); d.appendChild(row);
      }
      const rep = document.createElement('button'); rep.className = 'alt'; rep.textContent = 'RESPONDER'; rep.onclick = () => viewMessages(m.from); d.appendChild(rep);
      g.appendChild(d);
    });
  }

  // ---------- editor de mapas ----------
  const EW = 26, CELL = 28;
  const FLOOR_NAMES = ['Verde', 'Morado', 'Desierto', 'Lago', 'Piedra'];
  const FLOORS = [['#4f9a5b', '#4a9355'], ['#5b4a7a', '#554573'], ['#d6a84f', '#cf9f45'], ['#5fb3a1', '#58aa98'], ['#7a8794', '#737f8b']];
  const TOOLS = [['#', 'Muro', '#6b4f3a'], ['.', 'Suelo', '#4f9a5b'], ['b', 'Arbusto', '#267834'], ['~', 'Agua', '#2f7fd1'], ['G', 'Mina 💎', '#2ee6a0'], ['A', 'Salida azul', '#60a5fa'], ['B', 'Salida roja', '#f87171']];
  function blankMap(h) {
    const rows = [];
    for (let y = 0; y < h; y++) rows.push(Array.from({ length: EW }, (_, x) => (y === 0 || y === h - 1 || x === 0 || x === EW - 1) ? '#' : '.'));
    const my = Math.floor(h / 2);
    [-1, 0, 1].forEach(d => { rows[my + d][1] = 'A'; rows[my + d][EW - 2] = 'B'; });
    return rows;
  }
  function codeOf(m) { return btoa(unescape(encodeURIComponent(JSON.stringify({ name: m.name, mode: m.mode, rows: m.rows, floorIdx: m.floorIdx })))); }
  function decodeMap(txt) {
    txt = txt.trim();
    try { return JSON.parse(txt); } catch { }
    return JSON.parse(decodeURIComponent(escape(atob(txt))));
  }
  async function viewEditor() {
    const ed = S.ed || (S.ed = { id: null, name: 'Mi mapa', mode: 'knockout', floorIdx: 0, grid: blankMap(14), tool: '#', mirror: true });
    app.innerHTML = `<div class="screen">${topbar(true)}<h2>EDITOR DE MAPAS</h2>
      <div class="tabs" id="tools"></div>
      <div class="tabs">
        <input id="nm" maxlength="24" placeholder="Nombre" style="width:170px" value="${esc(ed.name)}">
        <select id="md" style="font:inherit;padding:10px;border-radius:10px;background:#0c1030;color:#fff;border:2px solid #262d5e">${Object.entries(D.modes).filter(([, v]) => !v.hidden).map(([k, v]) => `<option value="${k}" ${ed.mode === k ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select>
        <select id="fl" style="font:inherit;padding:10px;border-radius:10px;background:#0c1030;color:#fff;border:2px solid #262d5e">${FLOOR_NAMES.map((n, i) => `<option value="${i}" ${ed.floorIdx === i ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <label class="pill"><input type="checkbox" id="mir" ${ed.mirror ? 'checked' : ''}> Simétrico</label>
        <label class="pill">Filas <input id="hh" type="number" min="10" max="16" value="${ed.grid.length}" style="width:60px;padding:4px"></label>
      </div>
      <div style="overflow:auto"><canvas id="ec" style="touch-action:none;border-radius:10px"></canvas></div>
      <div class="tabs"><button id="test">PROBAR</button><button id="save" class="green">GUARDAR</button><button id="exp" class="alt">EXPORTAR</button><button id="imp" class="alt">IMPORTAR</button><button id="new" class="alt">NUEVO</button></div>
      <small>Azul = salida/tu equipo, rojo = rival. En «Cruce 1 vs 1» gana quien llegue a la salida contraria. Mapas de 26 columnas.</small>
      <h3>MIS MAPAS</h3><div class="grid" id="mine"></div></div>`;
    wireTop(true);
    const $ = id => document.getElementById(id);
    const cv = $('ec'), cx = cv.getContext('2d');
    const draw = () => {
      cv.width = EW * CELL; cv.height = ed.grid.length * CELL;
      const fl = FLOORS[ed.floorIdx];
      ed.grid.forEach((row, y) => row.forEach((c, x) => {
        cx.fillStyle = fl[(x + y) % 2]; cx.fillRect(x * CELL, y * CELL, CELL, CELL);
        const t = TOOLS.find(t => t[0] === c);
        if (c !== '.') { cx.fillStyle = t[2]; cx.fillRect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4); cx.fillStyle = '#000a'; cx.font = 'bold 14px sans-serif'; if ('GAB'.includes(c)) cx.fillText(c, x * CELL + 9, y * CELL + 19); }
      }));
    };
    const tools = $('tools');
    const paintTools = () => { tools.innerHTML = ''; TOOLS.forEach(t => { const b = document.createElement('button'); b.className = ed.tool === t[0] ? '' : 'alt'; b.textContent = t[1]; b.style.borderBottom = '4px solid ' + t[2]; b.onclick = () => { ed.tool = t[0]; paintTools(); }; tools.appendChild(b); }); };
    paintTools(); draw();
    const put = (x, y, c) => { if (x < 0 || y < 0 || x >= EW || y >= ed.grid.length) return; if ((x === 0 || y === 0 || x === EW - 1 || y === ed.grid.length - 1) && c !== '#') return; ed.grid[y][x] = c; };
    const paint = e => {
      const r = cv.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) * cv.width / r.width / CELL), y = Math.floor((e.clientY - r.top) * cv.height / r.height / CELL);
      put(x, y, ed.tool);
      if (ed.mirror) put(EW - 1 - x, y, ed.tool === 'A' ? 'B' : ed.tool === 'B' ? 'A' : ed.tool);
      draw();
    };
    let down = false;
    cv.onpointerdown = e => { down = true; cv.setPointerCapture(e.pointerId); paint(e); };
    cv.onpointermove = e => { if (down) paint(e); };
    cv.onpointerup = () => { down = false; };
    const sync = () => ({ id: ed.id || undefined, name: $('nm').value, mode: $('md').value, floorIdx: +$('fl').value, rows: ed.grid.map(r => r.join('')) });
    const keep = () => { const s = sync(); ed.name = s.name; ed.mode = s.mode; ed.floorIdx = s.floorIdx; ed.mirror = $('mir').checked; };
    $('fl').onchange = () => { keep(); draw(); }; $('mir').onchange = keep; $('nm').onchange = keep; $('md').onchange = keep;
    $('hh').onchange = () => {
      keep(); const h = Math.max(10, Math.min(16, +$('hh').value || 14)), old = ed.grid;
      ed.grid = blankMap(h).map((r, y) => r.map((c, x) => (old[y] && y < h - 1 && y > 0 && x > 0 && x < EW - 1) ? old[y][x] : c));
      viewEditor();
    };
    $('test').onclick = () => { keep(); const m = sync(); m.floor = FLOORS[m.floorIdx]; if (!m.rows.join('').includes('A') || !m.rows.join('').includes('B')) return toast('Pon salidas azul (A) y roja (B)'); viewBattle(m); };
    $('save').onclick = async () => { keep(); try { const r = await api('maps/save', sync()); const mine = r.maps.find(m => m.name === ed.name) ; if (!ed.id && mine) ed.id = mine.id; toast('Guardado ✓'); viewEditor(); } catch (e) { toast(e.message); } };
    $('new').onclick = () => { S.ed = null; viewEditor(); };
    $('exp').onclick = () => {
      keep(); const m = sync(), code = codeOf(m);
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ name: m.name, mode: m.mode, floorIdx: m.floorIdx, rows: m.rows }, null, 1)], { type: 'application/json' }));
      a.download = (m.name || 'mapa').replace(/\W+/g, '_') + '.rolaxmap.json'; a.click();
      (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => toast('Archivo descargado y código copiado ✓'), () => { prompt('Copia este código y mándalo:', code); });
    };
    $('imp').onclick = () => {
      const t = prompt('Pega aquí el código o el contenido del archivo .rolaxmap.json:'); if (!t) return;
      try { const m = decodeMap(t); if (!Array.isArray(m.rows)) throw 0; S.ed = { id: null, name: String(m.name || 'Importado').slice(0, 24), mode: D.modes[m.mode] ? m.mode : 'knockout', floorIdx: m.floorIdx | 0, grid: m.rows.map(r => String(r).padEnd(EW, '.').slice(0, EW).split('')), tool: '#', mirror: false }; viewEditor(); toast('Importado: revisa y guarda'); }
      catch { toast('Código no válido'); }
    };
    // mis mapas
    const mine = $('mine');
    try {
      (await api('maps')).maps.forEach(m => {
        const c = document.createElement('div'); c.className = 'card';
        c.innerHTML = `<div class="box">🗺️</div><b>${esc(m.name)}</b><small>${esc(D.modes[m.mode].name)}</small>`;
        const row = document.createElement('div'); row.className = 'tabs'; row.style.justifyContent = 'center';
        const mk = (txt, cls, fn) => { const b = document.createElement('button'); b.textContent = txt; b.className = cls; b.style.padding = '8px 10px'; b.onclick = fn; row.appendChild(b); };
        mk('EDITAR', 'alt', () => { S.ed = { id: m.id, name: m.name, mode: m.mode, floorIdx: m.floorIdx, grid: m.rows.map(r => r.split('')), tool: '#', mirror: false }; viewEditor(); });
        mk('▶', '', () => viewBattle({ ...m, floor: FLOORS[m.floorIdx] }));
        mk('✉', 'alt', () => { const to = prompt('¿A qué usuario envías este mapa?'); if (to) api('msg/send', { to, text: 'Mira mi mapa', mapId: m.id }).then(() => toast('Enviado ✓'), e => toast(e.message)); });
        mk('🗑', 'red', async () => { if (confirm('¿Borrar ' + m.name + '?')) { await api('maps/delete', { id: m.id }); if (ed.id === m.id) S.ed = null; viewEditor(); } });
        c.appendChild(row); mine.appendChild(c);
      });
    } catch (e) { toast(e.message); }
  }

  // ---------- inicio ----------
  (async function init() {
    if (localStorage.getItem('rolax_token')) {
      try { S.user = (await api('me')).user; await loadEvents(); return viewLobby(); } catch { localStorage.removeItem('rolax_token'); }
    }
    viewAuth();
  })();
  window.__rolax = S;
})();
