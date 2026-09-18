/* =====================================================================
   VALIDADOR DE DATOS  (opcional, solo para desarrollo)

   Comprueba que los mapas, dialogos, recuerdos y misiones encajan entre si
   ANTES de abrir el navegador. Sirve sobre todo si editas los mapas a mano.

   Uso (necesitas Node instalado):
       node tools/validate.mjs

   No forma parte del juego: puedes borrar esta carpeta y todo sigue igual.
   ===================================================================== */

import { MAPS } from '../js/data/maps.js';
import { PROPS, propDef } from '../js/data/props.js';
import { MEMORIES } from '../js/data/memories.js';
import { REASONS } from '../js/data/reasons.js';
import { PHOTOS } from '../js/data/photos.js';
import { QUESTS } from '../js/data/quests.js';
import { DIALOGUES, NPC_ENTRY } from '../js/data/dialogues.js';

const SOLID_TILES = new Set(['T', 'H', '~', '#', '|', 'X']);
let errors = 0, warns = 0;
const err  = m => { console.error('  ERROR  ' + m); errors++; };
const warn = m => { console.warn ('  aviso  ' + m); warns++; };

/* Construye la rejilla de solidos igual que lo hace el juego */
function solidGrid(map) {
  const h = map.grid.length, w = map.grid[0].length;
  const g = map.grid.map(row => [...row].map(ch => (SOLID_TILES.has(ch) ? 1 : 0)));

  for (const p of map.props) {
    const def = propDef(p.t);
    const pw = p.w || def.w, ph = p.h || def.h;
    let box = def.solid;
    if (box === 'full') box = [0, 0, pw, ph];
    if (!box) continue;
    const [dx, dy, dw, dh] = box;
    for (let y = p.y + dy; y < p.y + dy + dh; y++)
      for (let x = p.x + dx; x < p.x + dx + dw; x++)
        if (y >= 0 && y < h && x >= 0 && x < w) g[y][x] = 1;
  }
  for (const po of map.portals || [])
    for (let y = po.y; y < po.y + po.h; y++)
      for (let x = po.x; x < po.x + po.w; x++)
        if (y >= 0 && y < h && x >= 0 && x < w) g[y][x] = 0;

  return { g, w, h };
}

const free = (g, w, h, x, y) => (x >= 0 && y >= 0 && x < w && y < h && !g[y][x]);

console.log('\n=== MAPAS ===');
for (const [id, map] of Object.entries(MAPS)) {
  console.log('\n' + id);
  const rowW = map.grid[0].length;
  map.grid.forEach((r, i) => {
    if (r.length !== rowW) err(`${id}: fila ${i} mide ${r.length}, deberia medir ${rowW}`);
  });

  const { g, w, h } = solidGrid(map);

  /* props conocidos y dentro del mapa */
  for (const p of map.props) {
    if (!PROPS[p.t]) err(`${id}: prop desconocido "${p.t}"`);
    const def = propDef(p.t);
    const pw = p.w || def.w, ph = p.h || def.h;
    if (p.x < 0 || p.y < 0 || p.x + pw > w || p.y + ph > h)
      warn(`${id}: prop "${p.t}" en (${p.x},${p.y}) se sale del mapa`);
  }

  /* marcadores: la jugadora no puede aparecer dentro de una pared */
  for (const [name, [mx, my]] of Object.entries(map.markers)) {
    if (!free(g, w, h, mx, my)) err(`${id}: marcador "${name}" (${mx},${my}) esta en una casilla solida`);
  }

  /* puertas: destino y marcador de llegada */
  for (const po of map.portals || []) {
    const target = MAPS[po.to];
    if (!target) { err(`${id}: puerta hacia "${po.to}" que no existe`); continue; }
    if (!target.markers?.[po.marker])
      err(`${id}: la puerta a "${po.to}" pide el marcador "${po.marker}" y ese mapa no lo tiene`);
  }

  /* hay camino de vuelta desde cada mapa? */
  if (id !== 'town' && !(map.portals || []).some(p => p.to === 'town'))
    warn(`${id}: no tiene ninguna salida hacia la plaza`);

  /* npcs alcanzables */
  for (const n of map.npcs || []) {
    const around = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => free(g, w, h, n.x + dx, n.y + dy));
    if (!around) err(`${id}: al NPC "${n.id}" (${n.x},${n.y}) no se puede llegar`);
    if (n.showIf && !QUESTS[n.showIf]) err(`${id}: NPC "${n.id}" usa showIf "${n.showIf}" que no es una mision`);
    if (n.hideIf && !QUESTS[n.hideIf]) err(`${id}: NPC "${n.id}" usa hideIf "${n.hideIf}" que no es una mision`);
  }

  /* objetos: referencias y accesibilidad */
  const ids = new Set();
  let candles = 0;
  for (const o of map.objects || []) {
    if (ids.has(o.id)) err(`${id}: dos objetos con el mismo id "${o.id}"`);
    ids.add(o.id);

    if (o.memory && !MEMORIES[o.memory]) err(`${id}: objeto "${o.id}" apunta al recuerdo inexistente "${o.memory}"`);
    if (o.photo && !PHOTOS[o.photo]) err(`${id}: objeto "${o.id}" apunta a la foto inexistente "${o.photo}"`);
    if (o.t === 'candle') {
      candles++;
      if (typeof o.reason !== 'number' || o.reason < 0 || o.reason >= REASONS.length)
        err(`${id}: vela "${o.id}" con razon fuera de rango (${o.reason})`);
    }

    const reachable = free(g, w, h, o.x, o.y) ||
      [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]
        .some(([dx, dy]) => free(g, w, h, o.x + dx, o.y + dy));
    if (!reachable) err(`${id}: al objeto "${o.id}" (${o.x},${o.y}) no se puede llegar`);
  }
  if (id === 'cemetery' && candles !== REASONS.length)
    err(`cementerio: hay ${candles} velas y ${REASONS.length} razones; tienen que coincidir`);

  console.log(`  ${w}x${h} tiles · ${map.props.length} props · ` +
              `${(map.npcs || []).length} npcs · ${(map.objects || []).length} objetos`);
}

console.log('\n=== DIALOGOS ===');
for (const [id, node] of Object.entries(DIALOGUES)) {
  if (!node.lines?.length) err(`nodo "${id}" sin lineas`);
  if (node.next && !DIALOGUES[node.next]) err(`nodo "${id}": next -> "${node.next}" no existe`);
  for (const c of node.choices || []) {
    if (c.next && !DIALOGUES[c.next]) err(`nodo "${id}": opcion -> "${c.next}" no existe`);
  }
  const all = [...(node.effects || []), ...(node.choices || []).flatMap(c => c.effects || [])];
  for (const e of all) {
    if (e.memory && !MEMORIES[e.memory]) err(`nodo "${id}": recuerdo "${e.memory}" no existe`);
    if (e.photo && !PHOTOS[e.photo]) err(`nodo "${id}": foto "${e.photo}" no existe`);
    if (e.objective) {
      const [q, o] = e.objective;
      if (!QUESTS[q]) err(`nodo "${id}": mision "${q}" no existe`);
      else if (!QUESTS[q].objectives.some(x => x.id === o))
        err(`nodo "${id}": objetivo "${o}" no existe en "${q}"`);
    }
  }
}

/* Los NPC deben tener dialogo en cualquier momento de la partida */
console.log('\n=== ENTRADAS DE NPC ===');
const states = [
  { name: 'recien empezado', flags: {}, quest: 'q1_explore' },
  { name: 'conoce a todos',  flags: { met_damon: 1, met_stefan: 1, met_bonnie: 1 }, quest: 'q1_explore' },
  { name: 'mision 2',        flags: { met_damon: 1, met_stefan: 1, met_bonnie: 1 }, quest: 'q2_whispers' },
  { name: 'mision final',    flags: { met_damon: 1, met_stefan: 1, met_bonnie: 1 }, quest: 'q3_final' },
  { name: 'terminado',       flags: { met_damon: 1, met_stefan: 1, met_bonnie: 1, finale_done: 1 }, quest: null }
];
for (const st of states) {
  const api = {
    flag: k => !!st.flags[k],
    questActive: q => st.quest === q,
    questDone: () => false,
    hasMemory: () => false,
    visited: () => true,
    reasons: () => 0
  };
  for (const [npc, fn] of Object.entries(NPC_ENTRY)) {
    const node = fn(api);
    if (!DIALOGUES[node]) err(`NPC "${npc}" en estado "${st.name}" devuelve "${node}", que no existe`);
  }
}
console.log('  probados ' + states.length + ' estados x ' + Object.keys(NPC_ENTRY).length + ' npcs');

console.log('\n=== MISIONES ===');
for (const [id, q] of Object.entries(QUESTS)) {
  if (q.next && !QUESTS[q.next]) err(`mision "${id}": next -> "${q.next}" no existe`);
  if (!q.objectives?.length) err(`mision "${id}" sin objetivos`);
  for (const o of q.objectives) {
    if (o.onVisit && !MAPS[o.onVisit]) err(`mision "${id}": objetivo "${o.id}" visita "${o.onVisit}" que no existe`);
  }
}

console.log('\n=== CONTENIDO ===');
console.log(`  recuerdos: ${Object.keys(MEMORIES).length}`);
console.log(`  razones:   ${REASONS.length}  ${REASONS.length === 23 ? '(correcto)' : '(!! deberian ser 23)'}`);
console.log(`  fotos:     ${Object.keys(PHOTOS).length}`);
console.log(`  nodos de dialogo: ${Object.keys(DIALOGUES).length}`);
if (REASONS.length !== 23) err('la lista de razones tiene que tener exactamente 23 elementos');

/* recuerdos que nunca se pueden conseguir */
const reachableMem = new Set();
for (const map of Object.values(MAPS))
  for (const o of map.objects || []) if (o.memory) reachableMem.add(o.memory);
for (const node of Object.values(DIALOGUES))
  for (const e of [...(node.effects || []), ...(node.choices || []).flatMap(c => c.effects || [])])
    if (e.memory) reachableMem.add(e.memory);
for (const id of Object.keys(MEMORIES))
  if (!reachableMem.has(id)) warn(`el recuerdo "${id}" no se puede conseguir en ningun sitio`);

console.log(`\n${errors === 0 ? 'TODO CORRECTO' : 'HAY ERRORES'} — ${errors} errores, ${warns} avisos\n`);
process.exit(errors ? 1 : 0);
