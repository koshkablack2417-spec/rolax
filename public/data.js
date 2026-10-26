// Rolax — datos compartidos (cliente + servidor).
// Aquí se añaden personajes, mapas y skins. Todo sale de los dibujos del autor.
(function (root) {
  const D = {
    rarity: {
      normal: { name: 'Normal', color: '#9aa5b1', w: 60 },
      epico: { name: 'Épico', color: '#a855f7', w: 30 },
      mitico: { name: 'Mítico', color: '#ef4444', w: 10 },
    },

    // atk.kind: shot | spread | laser | melee   sup.kind: blast | buff | dash | gravity
    brawlers: [
      { id: 'superboy', name: 'Super Chico', rarity: 'normal', color: '#3b82f6', accent: '#facc15', hp: 3200, speed: 2.9,
        atk: { name: 'Super Handas', kind: 'shot', dmg: 900, speed: 9, range: 340, reload: 0.8, size: 9, color: '#fde047' },
        sup: { name: 'Híper Explosión', kind: 'blast', dmg: 1800, radius: 130, dist: 200 },
        gadget: { name: 'Slime Épico', kind: 'slime', radius: 80, dur: 4, slow: 0.45, dist: 180 } },

      { id: 'fuerte', name: 'Fuerte', rarity: 'normal', color: '#dc2626', accent: '#1d4ed8', hp: 4200, speed: 2.5,
        atk: { name: 'Láser Tiro', kind: 'laser', dmg: 700, speed: 16, range: 460, reload: 0.9, size: 5, color: '#f87171' },
        sup: { name: 'Fuerza', kind: 'buff', dur: 10, speed: 1.2, dmg: 1.7, heal: 0.4 },
        gadget: { name: 'Esquivar', kind: 'dodge', dist: 170 } },

      { id: 'cookid', name: 'Cookid', rarity: 'epico', color: '#b91c1c', accent: '#fecaca', hp: 3600, speed: 2.7,
        atk: { name: 'Lluvia de Cubos', kind: 'spread', dmg: 520, speed: 8, range: 260, reload: 1.0, size: 7, color: '#fca5a5', count: 3, arc: 0.45 },
        sup: { name: 'Embestida', kind: 'dash', dmg: 1500, dist: 260, radius: 50 } },

      { id: 'galleo', name: 'Galleo', rarity: 'epico', color: '#16a34a', accent: '#2563eb', hp: 3000, speed: 3.0,
        atk: { name: 'Galleta Básica', kind: 'shot', dmg: 800, speed: 8.5, range: 320, reload: 0.7, size: 8, color: '#d97706' },
        sup: { name: 'Patinadora Voladora', kind: 'buff', dur: 8, speed: 1.8, dmg: 1.0, heal: 0 },
        gadget: { name: 'Visión', kind: 'vision', dur: 9 } },

      { id: 'dragot', name: 'Dragot', rarity: 'epico', color: '#65a30d', accent: '#facc15', hp: 4800, speed: 2.4,
        atk: { name: 'Zarpazo', kind: 'melee', dmg: 1100, range: 95, reload: 0.7, arc: 1.2 },
        sup: { name: 'Aliento de Fuego', kind: 'blast', dmg: 2300, radius: 170, dist: 150 },
        gadget: { name: 'Arañazo Feroz', kind: 'fury', dmg: 800, radius: 95 } },

      { id: 'ninjagravity', name: 'Ninja Gravity', rarity: 'mitico', color: '#475569', accent: '#22d3ee', hp: 2800, speed: 3.2,
        atk: { name: 'Shurikens', kind: 'spread', dmg: 620, speed: 11, range: 360, reload: 0.8, size: 6, color: '#67e8f9', count: 2, arc: 0.18 },
        sup: { name: 'Gravedad', kind: 'gravity', dmg: 1000, radius: 230, pull: 130 },
        gadget: { name: 'Reacción', kind: 'dodge', dist: 190 } },

      // Lobita — dibujada en la hoja "Mítico": 1. Arañazo, 2. Salto, 3. Súper Ojos
      { id: 'lobita', name: 'Lobita', rarity: 'mitico', color: '#9ca3af', accent: '#f472b6', hp: 3300, speed: 3.1,
        atk: { name: 'Arañazo', kind: 'melee', dmg: 1000, range: 85, reload: 0.6, arc: 1.4 },
        sup: { name: 'Salto', kind: 'dash', dmg: 1700, dist: 290, radius: 55 },
        gadget: { name: 'Súper Ojos', kind: 'vision', dur: 6 } },
      // Héroes originales con estilo propio (no son personajes de otras marcas)
      { id: 'bloquin', name: 'Bloquín', style: 'roblox', rarity: 'epico', color: '#f97316', accent: '#fde68a', hp: 3800, speed: 2.7,
        atk: { name: 'Ladrillazo', kind: 'shot', dmg: 950, speed: 8, range: 300, reload: 0.85, size: 10, color: '#fdba74' },
        sup: { name: 'Torre de Bloques', kind: 'blast', dmg: 1900, radius: 120, dist: 190 } },

      { id: 'pixelo', name: 'Pixelo', style: 'minecraft', rarity: 'epico', color: '#0ea5e9', accent: '#a3e635', hp: 4000, speed: 2.7,
        atk: { name: 'Pico Pixelado', kind: 'melee', dmg: 1200, range: 100, reload: 0.7, arc: 1.3 },
        sup: { name: 'Mina Explosiva', kind: 'blast', dmg: 2100, radius: 150, dist: 120 } },

      { id: 'aurion', name: 'Aurion', style: 'dragon', rarity: 'mitico', color: '#f59e0b', accent: '#fde047', hp: 3400, speed: 3.0,
        atk: { name: 'Ráfaga de Aura', kind: 'spread', dmg: 600, speed: 11, range: 340, reload: 0.75, size: 7, color: '#fde047', count: 3, arc: 0.3 },
        sup: { name: 'Aura Máxima', kind: 'buff', dur: 9, speed: 1.4, dmg: 1.6, heal: 0.3 } },
    ],

    // Skins: estilos "inspirados" (look genérico). Para usar arte oficial hace falta licencia (ver README).
    skinStyles: [
      { key: 'roblox', name: 'Roblox', price: 80, theme: 'Estilo bloques' },
      { key: 'minecraft', name: 'Minecraft', price: 120, theme: 'Estilo píxel' },
      { key: 'dragon', name: 'Dragon Ball', price: 150, theme: 'Estilo aura guerrera' },
      { key: 'gold', name: 'Dorado', price: 200, theme: 'Original · brillo de oro' },
      { key: 'neon', name: 'Neón', price: 120, theme: 'Original · luz cian' },
      { key: 'ghost', name: 'Fantasma', price: 100, theme: 'Original · translúcido' },
    ],

    // Cajas (dibujadas en el papel): normal, medio, super mega caja, pro
    boxes: {
      normal: { name: 'Caja Normal', price: 20, em: [5, 15], co: [10, 40], brawler: 0.10 },
      medio: { name: 'Caja Media', price: 60, em: [15, 40], co: [40, 120], brawler: 0.25 },
      mega: { name: 'Super Mega Caja', price: 150, em: [40, 90], co: [120, 300], brawler: 0.45 },
      pro: { name: 'Caja Pro', price: 300, em: [90, 200], co: [300, 700], brawler: 0.70 },
    },

    // Prokachka con monedas: nivel 1 → 11. cost[i] = precio de pasar de nivel i+1 a i+2. +6 % vida y daño por nivel.
    upgrade: { max: 11, cost: [20, 35, 75, 140, 290, 480, 800, 1250, 1875, 2800], bonus: 0.06 },

    // Cuadrodrop: caja cuadrada que se abre en cuadraditos. Se gana ganando partidas o se compra con esmeraldas.
    drop: {
      price: 120, winChance: 0.25,
      tiers: [
        { key: 'raro', name: 'Raro', color: '#60a5fa', w: 55, brawler: 0.25, co: [60, 150], em: [5, 15] },
        { key: 'epico', name: 'Épico', color: '#a855f7', w: 30, brawler: 0.5, co: [150, 350], em: [15, 35] },
        { key: 'mitico', name: 'Mítico', color: '#ef4444', w: 12, brawler: 0.75, co: [350, 700], em: [35, 80] },
        { key: 'legendario', name: 'Legendario', color: '#facc15', w: 3, brawler: 1, co: [700, 1500], em: [80, 200] },
      ],
    },

    modes: {
      training: { name: 'Entrenamiento', desc: 'Practica sin límite contra muñecos.', hidden: true },
      emeralds: { name: 'Atrapa Esmeraldas', desc: 'Junta 10 esmeraldas y aguanta 12 s.' },
      knockout: { name: 'Noqueo', desc: '3 vs 3. Elimina al otro equipo.' },
      cross: { name: 'Cruce 1 vs 1', desc: 'Llega al otro lado antes que tu rival.' },
    },

    // Mapas: mitad izquierda (13 columnas); se refleja. # muro, b arbusto, ~ agua, G mina, A/B spawns
    maps: {
      // Basado en tu dibujo del mapa con canales de agua ondulados
      ondas: { name: 'Canales Ondulados', floor: ['#6aa84f', '#64a049'], half: [
        '#############',
        '#...~..~.#...',
        '#A..~..~.#.b.',
        '#A.......#.b.',
        '#A..~..~....G',
        '#...~..~..bbG',
        '#...~..~....G',
        '#..........b.',
        '#...~..~.#...',
        '#...~..~.#.bb',
        '#.........#..',
        '#...~..~....b',
        '#...~..~.....',
        '#############' ] },
      entrena: { name: 'Campo de Entrenamiento', floor: ['#8aa0b8', '#8399b1'], half: [
        '#############',
        '#...........b',
        '#A.....b.....',
        '#A.....bb....',
        '#A...........',
        '#.......~~...',
        '#.bb....~~...',
        '#.bb.........',
        '#.....##.....',
        '#..b..##..b..',
        '#............',
        '#...~~.......',
        '#...~~...b...',
        '#############' ] },
      jardin: { name: 'Jardín Rolax', floor: ['#3f8f4f', '#3a8749'], half: [
        '#############',
        '#...b...~...#',
        '#A..bbb.~...G',
        '#A...b...##.G',
        '#A.......#..G',
        '#..##..b.....',
        '#..#..bbb..~.',
        '#.....b...~~.',
        '#.bb.....~~..',
        '#.bb..##.....',
        '#........#...',
        '#...~....#.bb',
        '#...~..bbb...',
        '#############' ] },
      rio: { name: 'Río Ondulado', floor: ['#4a9b6a', '#459463'], half: [
        '#############',
        '#...~~......#',
        '#A..~~..b...G',
        '#A..~...bb..G',
        '#A.....b....G',
        '#....~~~..#..',
        '#...~~~~..#..',
        '#...~~......b',
        '#.bb....~~...',
        '#.bb...~~~...',
        '#......~~..##',
        '#..##......#.',
        '#..#...b.....',
        '#############' ] },
      calabaza: { name: 'Cementerio de Calabazas', floor: ['#5b4a7a', '#554573'], half: [
        '#############',
        '#.....#.....#',
        '#A.bb.#..b..G',
        '#A.bb....bb.G',
        '#A......bb..G',
        '#..##.....#..',
        '#..#..~~..#..',
        '#.....~~.....',
        '#..b........b',
        '#.bbb.##..bbb',
        '#..b..#......',
        '#.....#..~~..',
        '#.....#..~~..',
        '#############' ] },
      laguna: { name: 'Laguna Azul', floor: ['#5fb3a1', '#58aa98'], half: [
        '#############',
        '#..bb~~~~~~..',
        '#A..b~~~~~...',
        '#A...~~bb....',
        '#A....~bb...G',
        '#~~........~~',
        '#~~~..~~....~',
        '#.....~~~.~~~',
        '#..bb..~~....',
        '#..bb...~~...',
        '#.....~~~..~~',
        '#..~~.......b',
        '#..~~...bb..b',
        '#############' ] },
      cuadrado: { name: 'El Cuadrado', floor: ['#c9b27c', '#c2aa74'], half: [
        '#############',
        '#............',
        '#..b.....b...',
        '#............',
        '#.A......####',
        '#.A..bb..####',
        '#.A......####',
        '#........####',
        '#........####',
        '#............',
        '#..b.....b...',
        '#............',
        '#............',
        '#############' ] },
      templo: { name: 'Templo del Sol', floor: ['#d6a84f', '#cf9f45'], half: [
        '#############',
        '#..b....b....',
        '#A..##.##...G',
        '#A..#...#...G',
        '#A..#.b.#....',
        '#...##.##..b.',
        '#.bb.......bb',
        '#.bb..~~.....',
        '#.....~~..##.',
        '#..##.....#..',
        '#..#...bb...~',
        '#.....bb..~~~',
        '#...b........',
        '#############' ] },
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.D = D;
})(typeof window !== 'undefined' ? window : globalThis);
