/* =====================================================================
   DEFINICION DE PROPS (objetos del decorado)

   w, h    : tamano en TILES (1 tile = 16 px)
   solid   : caja de colision en tiles relativa a la esquina superior
             izquierda del prop -> [dx, dy, dw, dh].  null = se puede pisar.
   flat    : true  -> se dibuja pegado al suelo (debajo de los personajes)
             false -> se ordena por profundidad (puedes pasar por detras)
   glow    : [dx, dy, radio, color, alpha] luz calida opcional
   ===================================================================== */

export const PROPS = {
  /* ---------- Exterior ---------- */
  tree:       { w: 3, h: 4, solid: [1, 3, 1, 1] },
  tree_pine:  { w: 2, h: 4, solid: [0, 3, 2, 1] },
  tree_dead:  { w: 2, h: 4, solid: [0, 3, 1, 1] },
  oak_big:    { w: 4, h: 5, solid: [1, 4, 2, 1] },
  bush:       { w: 1, h: 1, solid: [0, 0, 1, 1] },
  flowers:    { w: 1, h: 1, solid: null, flat: true },
  rock:       { w: 1, h: 1, solid: [0, 0, 1, 1] },
  log:        { w: 2, h: 1, solid: [0, 0, 2, 1] },
  fence:      { w: 1, h: 1, solid: [0, 0, 1, 1] },
  bench:      { w: 2, h: 1, solid: [0, 0, 2, 1] },
  lamp:       { w: 1, h: 3, solid: [0, 2, 1, 1], glow: [0.5, 0.6, 58, 0xffc46b, 0.36] },
  sign:       { w: 1, h: 2, solid: [0, 1, 1, 1] },
  fountain:   { w: 3, h: 3, solid: [0, 1, 3, 2] },
  clocktower: { w: 3, h: 6, solid: [0, 5, 3, 1], glow: [1.5, 1.4, 70, 0xffe0a0, 0.32] },
  gravestone: { w: 1, h: 2, solid: [0, 1, 1, 1] },
  cross:      { w: 1, h: 2, solid: [0, 1, 1, 1] },
  crypt:      { w: 4, h: 4, solid: [0, 2, 4, 2] },
  candle:     { w: 1, h: 1, solid: null, flat: true },
  waterfall:  { w: 4, h: 5, solid: [0, 3, 4, 2] },
  lantern:    { w: 1, h: 2, solid: [0, 1, 1, 1], glow: [0.5, 0.7, 54, 0xffc46b, 0.55] },
  campfire:   { w: 1, h: 1, solid: [0, 0, 1, 1], glow: [0.5, 0.5, 66, 0xff9a4a, 0.5] },

  /* ---------- Edificios (el tamano lo pone cada mapa) ---------- */
  building:   { w: 6, h: 5, solid: 'full', sized: true },

  /* ---------- Interior ---------- */
  bar:        { w: 8, h: 2, solid: [0, 0, 8, 2] },
  stool:      { w: 1, h: 1, solid: [0, 0, 1, 1] },
  table:      { w: 2, h: 2, solid: [0, 0, 2, 2] },
  booth:      { w: 3, h: 2, solid: [0, 0, 3, 2] },
  pool:       { w: 4, h: 3, solid: [0, 0, 4, 3] },
  jukebox:    { w: 1, h: 2, solid: [0, 1, 1, 1], glow: [0.5, 0.8, 50, 0xff7a9c, 0.4] },
  lockers:    { w: 3, h: 2, solid: [0, 0, 3, 2] },
  trophy:     { w: 2, h: 2, solid: [0, 0, 2, 2], glow: [1, 1, 44, 0xffd98a, 0.28] },
  desk:       { w: 2, h: 1, solid: [0, 0, 2, 1] },
  fireplace:  { w: 3, h: 3, solid: [0, 1, 3, 2], glow: [1.5, 1.8, 96, 0xff8c42, 0.6] },
  sofa:       { w: 3, h: 2, solid: [0, 0, 3, 2] },
  armchair:   { w: 1, h: 2, solid: [0, 0, 1, 2] },
  bookshelf:  { w: 2, h: 3, solid: [0, 1, 2, 2] },
  record:     { w: 1, h: 2, solid: [0, 1, 1, 1] },
  cart:       { w: 2, h: 1, solid: [0, 0, 2, 1] },
  stairs:     { w: 3, h: 3, solid: [0, 0, 3, 3] },
  window:     { w: 2, h: 2, solid: null, glow: [1, 1, 60, 0x9fc4ff, 0.22] },
  painting:   { w: 1, h: 2, solid: null },
  mantel:     { w: 1, h: 1, solid: null },
  chandelier: { w: 2, h: 1, solid: null, glow: [1, 0.5, 92, 0xffd08a, 0.4] },
  light:      { w: 1, h: 1, solid: null, flat: true, glow: [0.5, 0.5, 110, 0xffd08a, 0.3] }, // luz invisible
  rugprop:    { w: 4, h: 3, solid: null, flat: true },
  plant:      { w: 1, h: 2, solid: [0, 1, 1, 1] },
  crate:      { w: 1, h: 1, solid: [0, 0, 1, 1] }
};

/* Valores por defecto para cualquier prop que no los declare */
export function propDef(type) {
  const d = PROPS[type];
  if (!d) {
    console.warn('[props] tipo desconocido:', type);
    return { w: 1, h: 1, solid: [0, 0, 1, 1], flat: false };
  }
  return { flat: false, solid: null, ...d };
}
