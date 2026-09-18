/* =====================================================================
   TextureFactory  --  todo el pixel art se dibuja por codigo.

   Por que: cero descargas, cero archivos que se pierdan, carga instantanea
   en el celular y podemos recolorear cualquier cosa desde un objeto JS.

   Si algun dia quieres sustituir un sprite por un PNG dibujado a mano,
   solo tienes que cargarlo en BootScene con la misma clave de textura.
   ===================================================================== */

import { PROPS, propDef } from '../data/props.js';

const T = 16;   // tamano de tile

/* ---------------------------------------------------------------------
   Utilidades de dibujo
   --------------------------------------------------------------------- */
function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return [c, x];
}
const R = (x, a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a | 0, b | 0, w | 0, h | 0); };

/* Random determinista: el mismo tile se ve siempre igual */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

/* Contorno oscuro de 1 px alrededor de todo lo que no sea transparente.
   Es EL truco clasico del pixel art para que los personajes y objetos se
   lean bien sobre cualquier fondo. Se hace una sola vez al crear la
   textura, asi que no cuesta nada durante el juego.
   cellW/cellH: si es una hoja de sprites, no deja que el contorno de un
   fotograma se cuele en el de al lado. */
function outline(canvas, color = [11, 10, 16], cellW = 0, cellH = 0) {
  const w = canvas.width, h = canvas.height;
  const x = canvas.getContext('2d');
  const img = x.getImageData(0, 0, w, h);
  const src = img.data;
  const out = new Uint8ClampedArray(src);
  const A = (px, py) => src[(py * w + px) * 4 + 3];

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      if (A(px, py) > 20) continue;
      const cx0 = cellW ? px - (px % cellW) : 0, cx1 = cellW ? cx0 + cellW - 1 : w - 1;
      const cy0 = cellH ? py - (py % cellH) : 0, cy1 = cellH ? cy0 + cellH - 1 : h - 1;
      const hit =
        (px > cx0 && A(px - 1, py) > 20) || (px < cx1 && A(px + 1, py) > 20) ||
        (py > cy0 && A(px, py - 1) > 20) || (py < cy1 && A(px, py + 1) > 20);
      if (hit) {
        const i = (py * w + px) * 4;
        out[i] = color[0]; out[i + 1] = color[1]; out[i + 2] = color[2]; out[i + 3] = 235;
      }
    }
  }
  x.putImageData(new ImageData(out, w, h), 0, 0);
}

/* Props que NO llevan contorno (van pegados al suelo o son rectangulos) */
const NO_OUTLINE = new Set(['building', 'rugprop', 'flowers', 'light', 'window', 'painting',
  'bar', 'stairs', 'fireplace', 'bookshelf', 'lockers', 'trophy', 'crypt', 'waterfall']);

/* Circulo relleno pixel a pixel (sin antialias: bordes nitidos) */
function disc(x, cx, cy, r, col) {
  x.fillStyle = col;
  const r2 = r * r;
  for (let py = Math.floor(cy - r); py <= cy + r; py++) {
    for (let px = Math.floor(cx - r); px <= cx + r; px++) {
      const dx = px + 0.5 - cx, dy = py + 0.5 - cy;
      if (dx * dx + dy * dy <= r2) x.fillRect(px, py, 1, 1);
    }
  }
}

/* Copa de arbol: manchas redondas en tres tonos (sombra, medio, luz) */
function canopy(x, r, blobs, cx0, cy0, w, h, dark, mid, light) {
  const pts = [];
  for (let i = 0; i < blobs; i++) {
    pts.push([cx0 + r() * w, cy0 + r() * h, 5 + r() * 6]);
  }
  for (const [a, b, s] of pts) disc(x, a, b + 2, s, dark);
  for (const [a, b, s] of pts) disc(x, a - 1, b, s - 1.5, mid);
  for (const [a, b, s] of pts) if (s > 7) disc(x, a - 2, b - 2, s * 0.45, light);
}

/* Salpica pixeles de ruido sobre un area */
function speckle(x, w, h, colors, count, seed) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const px = (r() * w) | 0, py = (r() * h) | 0;
    R(x, px, py, 1, 1, colors[(r() * colors.length) | 0]);
  }
}

/* ---------------------------------------------------------------------
   PALETA DE TILES
   Colores pensados para verse bien DEBAJO del filtro nocturno.
   --------------------------------------------------------------------- */
const TILES = {
  '.': { name: 'grass',    solid: false },
  ',': { name: 'flowers',  solid: false },
  ':': { name: 'cobble',   solid: false },
  ';': { name: 'cobble2',  solid: false },
  '=': { name: 'sidewalk', solid: false },
  '_': { name: 'road',     solid: false },
  'd': { name: 'dirt',     solid: false },
  'g': { name: 'gravel',   solid: false },
  'T': { name: 'forest',   solid: true  },
  'H': { name: 'hedge',    solid: true  },
  '~': { name: 'water',    solid: true  },
  '#': { name: 'wallext',  solid: true  },
  '|': { name: 'wallint',  solid: true  },
  'W': { name: 'wood',     solid: false },
  'w': { name: 'woodark',  solid: false },
  'S': { name: 'stone',    solid: false },
  'X': { name: 'void',     solid: true  }
};

export function isSolidTile(ch) { return !!(TILES[ch] && TILES[ch].solid); }

/* Dibuja un tile concreto. tx,ty sirven de semilla para el ruido. */
function drawTile(x, ch, tx, ty) {
  const seed = (tx * 73856093) ^ (ty * 19349663);
  switch (ch) {
    case '.':
      R(x, 0, 0, T, T, '#3a5638');
      speckle(x, T, T, ['#32502f', '#43633f', '#2e4a2c'], 26, seed);
      break;

    case ',':
      R(x, 0, 0, T, T, '#3a5638');
      speckle(x, T, T, ['#32502f', '#43633f'], 20, seed);
      speckle(x, T, T, ['#c9a227', '#d9d0b8', '#b05a7a'], 7, seed + 7);
      break;

    case ':':
      R(x, 0, 0, T, T, '#4b4a52');
      speckle(x, T, T, ['#44434b', '#535259'], 22, seed);
      R(x, 0, 7, T, 1, '#3c3b43'); R(x, 7, 0, 1, 7, '#3c3b43'); R(x, 3, 8, 1, 8, '#3c3b43');
      R(x, 0, 0, T, 1, '#565560');
      break;

    case ';':
      R(x, 0, 0, T, T, '#46454d');
      speckle(x, T, T, ['#3e3d45', '#4f4e56'], 30, seed);
      R(x, 0, 5, T, 1, '#38373f'); R(x, 10, 6, 1, 10, '#38373f');
      break;

    case '=':
      R(x, 0, 0, T, T, '#5a5a61');
      speckle(x, T, T, ['#545458', '#62626a'], 16, seed);
      R(x, 0, 0, 1, T, '#4c4c53'); R(x, 0, 0, T, 1, '#4c4c53');
      break;

    case '_':
      R(x, 0, 0, T, T, '#34343c');
      speckle(x, T, T, ['#2e2e36', '#3b3b44'], 22, seed);
      break;

    case 'd':
      R(x, 0, 0, T, T, '#4d4034');
      speckle(x, T, T, ['#463a2f', '#57493b', '#3d322a'], 30, seed);
      break;

    case 'g':
      R(x, 0, 0, T, T, '#4a4744');
      speckle(x, T, T, ['#44413e', '#54514d', '#3d3a38'], 40, seed);
      break;

    case 'T': {  // bosque denso visto desde arriba
      R(x, 0, 0, T, T, '#16261b');
      const r = rng(seed);
      for (let i = 0; i < 5; i++) {
        const cx = (r() * 12) | 0, cy = (r() * 12) | 0, s = 4 + ((r() * 3) | 0);
        R(x, cx, cy, s, s, '#1e3524');
        R(x, cx, cy, s - 1, 1, '#27422c');
        R(x, cx, cy + s - 1, s, 1, '#122018');
      }
      speckle(x, T, T, ['#2c4a32', '#101d15'], 14, seed + 3);
      break;
    }

    case 'H':
      R(x, 0, 0, T, T, '#23412a');
      speckle(x, T, T, ['#1d3623', '#2b4d32'], 34, seed);
      R(x, 0, 0, T, 1, '#2f5537');
      break;

    case '~':
      R(x, 0, 0, T, T, '#24405e');
      R(x, 0, 3, T, 1, '#2d4d70'); R(x, 4, 9, 8, 1, '#2d4d70');
      speckle(x, T, T, ['#1f3854', '#33597f'], 12, seed);
      break;

    case '#': {  // muro exterior de ladrillo
      R(x, 0, 0, T, T, '#4a4038');
      for (let ry = 0; ry < T; ry += 4) {
        R(x, 0, ry, T, 1, '#3c332d');
        const off = (ry / 4) % 2 ? 4 : 0;
        for (let rx = off; rx < T; rx += 8) R(x, rx, ry, 1, 4, '#3c332d');
      }
      speckle(x, T, T, ['#52473e', '#443a33'], 16, seed);
      break;
    }

    case '|': {  // muro interior con zocalo
      R(x, 0, 0, T, T, '#382d26');
      speckle(x, T, T, ['#33291f', '#3f332b'], 18, seed);
      R(x, 0, 0, T, 2, '#2a211b');
      R(x, 0, T - 3, T, 3, '#241d18');
      R(x, 0, T - 4, T, 1, '#4a3b30');
      break;
    }

    case 'W':    // tarima clara (Grill)
    case 'w': {  // tarima oscura (mansion)
      /* tablas horizontales largas, con juntas escalonadas segun la fila
         del mapa: asi se lee como suelo de madera y no como ladrillo */
      const light = ch === 'W';
      const base = light ? '#6b4a2f' : '#4a3220';
      const alt  = light ? '#724f32' : '#503624';
      const gap  = light ? '#4e3522' : '#33231a';
      R(x, 0, 0, T, T, base);
      for (let b = 0; b < 4; b++) {
        const yy = b * 4;
        if ((b + ty) % 2) R(x, 0, yy, T, 3, alt);
        R(x, 0, yy + 3, T, 1, gap);
        const joint = ((tx * 7 + ty * 3 + b * 5) % 16);
        if ((tx + b) % 3 === 0) R(x, joint, yy, 1, 3, gap);
      }
      speckle(x, T, T, [light ? '#63442b' : '#432d1d'], 10, seed);
      break;
    }

    case 'S': {  // baldosa de instituto
      R(x, 0, 0, T, T, '#545661');
      speckle(x, T, T, ['#4e5059', '#5c5e69'], 14, seed);
      R(x, 0, 0, T, 1, '#484a53'); R(x, 0, 0, 1, T, '#484a53');
      R(x, 8, 8, 4, 4, '#5b5d68');
      break;
    }

    default:
      R(x, 0, 0, T, T, '#0a0a0e');
  }
}

/* =====================================================================
   SUELO HORNEADO
   Dibuja el mapa entero en un solo canvas -> una sola textura, un solo
   draw call. Es lo que hace que vaya fino en telefonos.
   ===================================================================== */
export function buildGroundTexture(scene, map) {
  const key = 'ground_' + map.id;
  if (scene.textures.exists(key)) return key;

  const [c, x] = mk(map.grid[0].length * T, map.grid.length * T);
  const [tc, tx] = mk(T, T);

  for (let ty = 0; ty < map.grid.length; ty++) {
    const row = map.grid[ty];
    for (let tix = 0; tix < row.length; tix++) {
      tx.clearRect(0, 0, T, T);
      drawTile(tx, row[tix], tix, ty);
      x.drawImage(tc, tix * T, ty * T);
    }
  }
  scene.textures.addCanvas(key, c);
  return key;
}

/* =====================================================================
   PROPS
   ===================================================================== */
function drawProp(x, type, w, h, opt) {
  const W = w * T, H = h * T;
  const seed = (type.length * 2654435761) ^ (W * 40503) ^ (H * 12345);

  switch (type) {
    /* ---------- vegetacion ---------- */
    case 'tree': {
      R(x, 21, 38, 6, 26, '#3a2a1c');                 // tronco
      R(x, 21, 38, 2, 26, '#47341f');
      R(x, 18, 60, 12, 4, '#2e2116');                 // raices
      canopy(x, rng(seed), 11, 12, 12, 24, 18, '#17301d', '#23452a', '#34633c');
      break;
    }

    case 'tree_pine': {
      R(x, 13, 46, 6, 18, '#3a2a1c');
      for (let i = 0; i < 5; i++) {                  // capas triangulares
        const yy = 6 + i * 9, half = 5 + i * 3;
        R(x, 16 - half, yy, half * 2, 10, i % 2 ? '#1e3a26' : '#24462c');
        R(x, 16 - half, yy, half * 2, 2, '#2d5434');
      }
      R(x, 14, 2, 4, 6, '#24462c');
      break;
    }

    case 'tree_dead': {
      R(x, 13, 30, 6, 34, '#2b2119');
      R(x, 13, 30, 2, 34, '#3a2d22');
      R(x, 6, 24, 8, 3, '#2b2119');  R(x, 4, 18, 4, 7, '#2b2119');
      R(x, 18, 18, 9, 3, '#2b2119'); R(x, 24, 10, 3, 9, '#2b2119');
      R(x, 11, 12, 4, 20, '#2b2119');
      R(x, 16, 4, 3, 12, '#2b2119');
      break;
    }

    case 'oak_big': {
      R(x, 27, 50, 10, 30, '#3f2d1d');
      R(x, 27, 50, 3, 30, '#4d3823');
      R(x, 22, 74, 20, 6, '#33251a');                 // raices
      R(x, 20, 56, 8, 3, '#3f2d1d'); R(x, 36, 54, 9, 3, '#3f2d1d');   // ramas
      canopy(x, rng(seed), 18, 14, 12, 36, 30, '#152b1a', '#20402a', '#2f5e39');
      canopy(x, rng(seed + 5), 6, 18, 11, 28, 16, '#1b3822', '#264c30', '#3a7045');
      break;
    }

    case 'bush':
      disc(x, 5, 10, 5, '#1b3521'); disc(x, 11, 10, 5, '#1b3521'); disc(x, 8, 7, 6, '#1b3521');
      disc(x, 5, 9, 4, '#26472c'); disc(x, 11, 9, 4, '#26472c'); disc(x, 8, 6, 5, '#26472c');
      disc(x, 7, 4.5, 2.2, '#376a40'); disc(x, 12, 7, 1.6, '#376a40');
      break;

    case 'flowers':
      R(x, 2, 9, 2, 5, '#2d5434'); R(x, 8, 8, 2, 6, '#2d5434'); R(x, 12, 10, 2, 4, '#2d5434');
      R(x, 1, 6, 4, 4, '#c9a227'); R(x, 7, 5, 4, 4, '#d9d0b8'); R(x, 11, 7, 4, 4, '#a8456a');
      break;

    case 'rock':
      R(x, 2, 6, 12, 8, '#4c4a50'); R(x, 3, 4, 9, 4, '#585660');
      R(x, 5, 3, 5, 2, '#63616b'); R(x, 2, 13, 12, 2, '#3a383e');
      break;

    case 'log':
      R(x, 0, 5, 32, 8, '#463322'); R(x, 0, 5, 32, 2, '#57402b');
      R(x, 0, 5, 5, 8, '#6b5136'); R(x, 1, 7, 3, 4, '#3a2a1c');
      speckle(x, 32, T, ['#3d2c1d'], 14, seed);
      break;

    case 'fence':
      R(x, 1, 4, 3, 12, '#4a3a2a'); R(x, 12, 4, 3, 12, '#4a3a2a');
      R(x, 0, 6, T, 2, '#57452f'); R(x, 0, 11, T, 2, '#57452f');
      break;

    case 'bench':
      R(x, 2, 8, 28, 4, '#57402b'); R(x, 2, 8, 28, 1, '#6b5136');
      R(x, 3, 3, 26, 4, '#4a3624');
      R(x, 4, 12, 3, 4, '#38291a'); R(x, 25, 12, 3, 4, '#38291a');
      break;

    /* ---------- mobiliario urbano ---------- */
    case 'lamp':
      R(x, 6, 14, 4, 32, '#2a2a30');
      R(x, 4, 44, 8, 4, '#232329');
      R(x, 4, 6, 8, 9, '#3a3a42');
      R(x, 5, 7, 6, 7, '#ffe0a0');
      R(x, 6, 8, 4, 5, '#fff3cf');
      R(x, 3, 3, 10, 3, '#2a2a30');
      break;

    case 'sign':
      R(x, 7, 12, 2, 20, '#3a2d22');
      R(x, 1, 4, 14, 11, '#57402b'); R(x, 2, 5, 12, 9, '#6b5136');
      R(x, 3, 7, 10, 1, '#3a2a1c'); R(x, 3, 10, 7, 1, '#3a2a1c');
      break;

    case 'fountain': {
      R(x, 2, 18, 44, 26, '#4e4c54');           // pilon
      R(x, 4, 20, 40, 22, '#2c4460');           // agua
      R(x, 6, 22, 36, 4, '#37557a');
      R(x, 10, 30, 12, 2, '#37557a'); R(x, 26, 34, 10, 2, '#37557a');
      R(x, 2, 18, 44, 3, '#63616b');
      R(x, 2, 41, 44, 3, '#3a383e');
      R(x, 20, 6, 8, 16, '#5a5860');            // columna
      R(x, 18, 2, 12, 6, '#63616b');
      R(x, 22, 0, 4, 4, '#8fb8dd');
      break;
    }

    case 'clocktower': {
      R(x, 4, 24, 40, 72, '#4a4038');           // torre
      R(x, 4, 24, 4, 72, '#544940');
      for (let ry = 28; ry < 96; ry += 6) R(x, 4, ry, 40, 1, '#3c332d');
      R(x, 0, 12, 48, 14, '#3a3038');           // cornisa
      R(x, 2, 0, 44, 14, '#2e2630');            // tejado
      R(x, 20, 0, 8, 4, '#4a4050');
      R(x, 14, 30, 20, 20, '#d9cfae');          // esfera del reloj
      R(x, 16, 32, 16, 16, '#f2e8c8');
      R(x, 23, 35, 2, 7, '#2a241c'); R(x, 24, 39, 6, 2, '#2a241c');
      R(x, 18, 60, 5, 12, '#2c3a52'); R(x, 26, 60, 5, 12, '#2c3a52');
      R(x, 18, 60, 5, 4, '#5a7ba8'); R(x, 26, 60, 5, 4, '#5a7ba8');
      break;
    }

    /* ---------- cementerio ---------- */
    case 'gravestone':
      R(x, 3, 4, 10, 26, '#5c5a60');
      R(x, 4, 3, 8, 3, '#6a6870');
      R(x, 3, 4, 2, 26, '#6a6870');
      R(x, 5, 9, 6, 1, '#45434a'); R(x, 5, 12, 6, 1, '#45434a'); R(x, 6, 15, 4, 1, '#45434a');
      R(x, 1, 28, 14, 4, '#3f3d43');
      break;

    case 'cross':
      R(x, 6, 2, 4, 28, '#5c5a60'); R(x, 2, 8, 12, 4, '#5c5a60');
      R(x, 6, 2, 2, 28, '#6a6870'); R(x, 2, 8, 12, 1, '#6a6870');
      R(x, 1, 28, 14, 4, '#3f3d43');
      break;

    case 'crypt': {
      R(x, 0, 16, 64, 48, '#4c4a50');           // cuerpo
      R(x, 0, 16, 64, 4, '#5e5c64');
      R(x, 0, 60, 64, 4, '#38363c');
      R(x, 4, 4, 56, 14, '#3f3d43');            // fronton
      R(x, 26, 0, 12, 6, '#4c4a50');
      R(x, 24, 26, 16, 38, '#17161c');          // puerta
      R(x, 24, 26, 16, 3, '#2a2830');
      R(x, 27, 32, 10, 24, '#0e0d12');
      R(x, 8, 24, 6, 32, '#5e5c64'); R(x, 50, 24, 6, 32, '#5e5c64');
      speckle(x, 64, 64, ['#46444a', '#54525a'], 50, seed);
      break;
    }

    case 'candle':
      R(x, 6, 7, 4, 8, '#e8e0cc');              // cera
      R(x, 6, 7, 1, 8, '#fff6e2');
      R(x, 7, 5, 2, 2, '#4a4438');              // mecha apagada
      R(x, 4, 14, 8, 2, '#3a3830');
      break;

    case 'candle_lit':
      R(x, 6, 7, 4, 8, '#e8e0cc');
      R(x, 6, 7, 1, 8, '#fff6e2');
      R(x, 7, 2, 2, 5, '#ffb74a');
      R(x, 7, 1, 2, 2, '#fff0b8');
      R(x, 6, 4, 1, 2, '#ff8c42'); R(x, 9, 4, 1, 2, '#ff8c42');
      R(x, 4, 14, 8, 2, '#3a3830');
      break;

    /* ---------- bosque ---------- */
    case 'waterfall': {
      R(x, 0, 0, 64, 52, '#2b2d34');            // roca
      speckle(x, 64, 52, ['#25272e', '#33353d'], 60, seed);
      R(x, 16, 0, 32, 46, '#3f6d94');           // caida
      R(x, 20, 0, 8, 46, '#5e93bd');
      R(x, 34, 0, 6, 46, '#5e93bd');
      R(x, 26, 0, 4, 46, '#8fc0e2');
      R(x, 8, 44, 48, 20, '#2c4a68');           // pozo
      R(x, 12, 46, 40, 6, '#3d6c92');
      R(x, 16, 56, 16, 2, '#4a7fa8'); R(x, 36, 60, 12, 2, '#4a7fa8');
      break;
    }

    case 'lantern':
      R(x, 6, 16, 4, 14, '#2a2a30');
      R(x, 3, 4, 10, 13, '#3a3a42');
      R(x, 4, 6, 8, 9, '#ffc46b');
      R(x, 5, 7, 6, 6, '#fff0c0');
      R(x, 5, 1, 6, 3, '#2a2a30');
      break;

    case 'campfire':
      R(x, 1, 10, 14, 4, '#3a2a1c');
      R(x, 2, 8, 12, 3, '#4a3624');
      R(x, 5, 4, 6, 7, '#ff8c42');
      R(x, 6, 2, 4, 5, '#ffc46b');
      R(x, 7, 1, 2, 3, '#fff0c0');
      break;

    /* ---------- interior: bar ---------- */
    case 'bar':
      R(x, 0, 6, 128, 26, '#4a3220');
      R(x, 0, 6, 128, 4, '#6b4a2f');
      R(x, 0, 10, 128, 2, '#7d5836');
      R(x, 0, 0, 128, 7, '#3a2719');            // estanteria trasera
      for (let i = 4; i < 124; i += 7) R(x, i, 1, 3, 5, i % 14 ? '#6a4a2a' : '#3f5a6a');
      for (let i = 2; i < 126; i += 16) R(x, i, 14, 1, 16, '#3a2719');
      break;

    case 'stool':
      R(x, 3, 3, 10, 5, '#5a2a30'); R(x, 3, 3, 10, 2, '#7a3a42');
      R(x, 6, 8, 4, 7, '#3a3a42'); R(x, 3, 14, 10, 2, '#2e2e36');
      break;

    case 'table':
      R(x, 2, 4, 28, 22, '#5a3f28'); R(x, 2, 4, 28, 3, '#6f4f33');
      R(x, 4, 26, 4, 5, '#3a2719'); R(x, 24, 26, 4, 5, '#3a2719');
      R(x, 10, 10, 12, 10, '#4e3622');
      break;

    case 'booth':
      R(x, 0, 0, 48, 10, '#4a2028');            // respaldo
      R(x, 0, 0, 48, 3, '#5f2b34');
      for (let i = 4; i < 46; i += 8) R(x, i, 3, 1, 7, '#3a181e');
      R(x, 2, 12, 44, 14, '#5a3f28');
      R(x, 2, 12, 44, 3, '#6f4f33');
      R(x, 4, 26, 4, 5, '#3a2719'); R(x, 40, 26, 4, 5, '#3a2719');
      break;

    case 'pool':
      R(x, 0, 2, 64, 44, '#3a2719');
      R(x, 4, 6, 56, 36, '#1e5540');
      R(x, 4, 6, 56, 2, '#27694f');
      R(x, 0, 2, 64, 3, '#57402b');
      [[18, 20], [22, 18], [22, 22], [26, 16], [26, 20], [26, 24], [44, 22]].forEach(([a, b], i) =>
        R(x, a, b, 4, 4, ['#d9cfae', '#a8302c', '#c9a227', '#2c4a68', '#1a1a20'][i % 5]));
      break;

    case 'jukebox':
      R(x, 1, 6, 14, 26, '#3a2030');
      R(x, 2, 2, 12, 8, '#a8456a');
      R(x, 3, 3, 10, 6, '#d96a90');
      R(x, 3, 12, 10, 8, '#1a1a22');
      R(x, 4, 13, 8, 6, '#5a3a6a');
      R(x, 3, 22, 10, 3, '#c9a227');
      R(x, 1, 30, 14, 2, '#241520');
      break;

    /* ---------- interior: instituto ---------- */
    case 'lockers': {
      R(x, 0, 0, 48, 32, '#2f4a56');
      for (let i = 0; i < 3; i++) {
        const a = i * 16;
        R(x, a + 1, 1, 14, 30, '#37576a');
        R(x, a + 1, 1, 14, 2, '#40657b');
        R(x, a + 3, 6, 10, 1, '#2a4250'); R(x, a + 3, 8, 10, 1, '#2a4250');
        R(x, a + 12, 16, 2, 4, '#c9c0a8');
        R(x, a + 1, 29, 14, 2, '#26404c');
      }
      break;
    }

    case 'trophy':
      R(x, 0, 2, 32, 30, '#3a2719');
      R(x, 2, 4, 28, 24, '#1d2830');
      R(x, 2, 4, 28, 2, '#2a3a46');
      [[6, 10], [14, 8], [23, 11]].forEach(([a, b]) => {
        R(x, a, b, 6, 7, '#c9a227'); R(x, a + 1, b, 4, 5, '#e6c976');
        R(x, a + 2, b + 7, 2, 3, '#a8841f'); R(x, a, b + 10, 6, 2, '#6b5136');
      });
      R(x, 2, 17, 28, 1, '#2a3a46');
      break;

    case 'desk':
      R(x, 1, 4, 30, 14, '#5a3f28'); R(x, 1, 4, 30, 3, '#6f4f33');
      R(x, 3, 18, 3, 6, '#3a2719'); R(x, 26, 18, 3, 6, '#3a2719');
      R(x, 8, 8, 10, 6, '#d9cfae');
      break;

    /* ---------- interior: mansion ---------- */
    case 'fireplace': {
      R(x, 0, 0, 48, 48, '#403a36');
      speckle(x, 48, 48, ['#38332f', '#4a443f'], 60, seed);
      R(x, 0, 0, 48, 5, '#544c45');
      R(x, 10, 14, 28, 34, '#14110f');          // hogar
      R(x, 13, 30, 22, 18, '#ff6a26');          // fuego
      R(x, 16, 34, 16, 14, '#ff9a4a');
      R(x, 19, 38, 10, 10, '#ffd08a');
      R(x, 22, 42, 5, 6, '#fff0c0');
      R(x, 12, 44, 24, 4, '#2a1a12');
      R(x, 6, 10, 36, 4, '#5a4a3a');            // repisa
      break;
    }

    case 'sofa':
      R(x, 0, 0, 48, 12, '#4a2028'); R(x, 0, 0, 48, 3, '#5f2b34');
      R(x, 0, 8, 6, 22, '#5f2b34'); R(x, 42, 8, 6, 22, '#5f2b34');
      R(x, 6, 12, 36, 16, '#5a2630');
      R(x, 8, 14, 14, 10, '#6a2f3a'); R(x, 26, 14, 14, 10, '#6a2f3a');
      R(x, 4, 28, 40, 3, '#3a181e');
      break;

    case 'armchair':
      R(x, 0, 2, 16, 10, '#4a2028'); R(x, 0, 2, 16, 2, '#5f2b34');
      R(x, 0, 10, 4, 18, '#5f2b34'); R(x, 12, 10, 4, 18, '#5f2b34');
      R(x, 4, 12, 8, 14, '#5a2630');
      R(x, 2, 27, 12, 3, '#3a181e');
      break;

    case 'bookshelf': {
      R(x, 0, 0, 32, 48, '#3a2719');
      R(x, 2, 2, 28, 44, '#2c1d13');
      const r = rng(seed);
      for (let shelf = 0; shelf < 4; shelf++) {
        const yy = 4 + shelf * 11;
        for (let bx = 4; bx < 28;) {
          const bw = 2 + ((r() * 3) | 0), bh = 7 + ((r() * 2) | 0);
          R(x, bx, yy + (9 - bh), bw, bh,
            ['#6a2f3a', '#3f5a6a', '#6b5136', '#4a3a5a', '#5a4a2a'][(r() * 5) | 0]);
          bx += bw + 1;
        }
        R(x, 2, yy + 9, 28, 2, '#3a2719');
      }
      break;
    }

    case 'record':
      R(x, 1, 14, 14, 18, '#3a2719'); R(x, 1, 14, 14, 3, '#57402b');
      R(x, 2, 2, 12, 12, '#2a2119');
      R(x, 3, 3, 10, 10, '#15130f');
      R(x, 7, 7, 2, 2, '#c9a227');
      R(x, 3, 20, 10, 2, '#4a3a2a'); R(x, 3, 24, 7, 2, '#4a3a2a');
      break;

    case 'cart':
      R(x, 1, 6, 30, 8, '#4a3a2a'); R(x, 1, 6, 30, 2, '#5f4a36');
      R(x, 4, 1, 5, 6, '#8a6a2a'); R(x, 4, 1, 2, 6, '#b08a3a');
      R(x, 12, 2, 4, 5, '#d9cfae'); R(x, 18, 2, 4, 5, '#d9cfae');
      R(x, 3, 14, 2, 3, '#2e2e36'); R(x, 27, 14, 2, 3, '#2e2e36');
      break;

    case 'stairs': {
      R(x, 0, 0, 48, 48, '#3a2719');
      for (let i = 0; i < 6; i++) {
        const yy = i * 8;
        R(x, 0, yy, 48, 6, i % 2 ? '#4a3220' : '#543a26');
        R(x, 0, yy + 6, 48, 2, '#2c1d13');
      }
      R(x, 0, 0, 4, 48, '#2c1d13'); R(x, 44, 0, 4, 48, '#2c1d13');
      break;
    }

    case 'window':
      R(x, 0, 0, 32, 32, '#3a2d22');
      R(x, 3, 3, 26, 26, '#1b2a44');
      R(x, 4, 4, 11, 11, '#24405e'); R(x, 17, 4, 11, 11, '#24405e');
      R(x, 4, 17, 11, 11, '#24405e'); R(x, 17, 17, 11, 11, '#24405e');
      R(x, 5, 5, 4, 4, '#3f5f85');
      R(x, 0, 29, 32, 3, '#4a3a2a');
      break;

    case 'painting':
      R(x, 0, 0, 16, 32, '#6b5136');
      R(x, 2, 2, 12, 28, '#2a2436');
      R(x, 3, 3, 10, 14, '#3a3050');
      R(x, 5, 18, 6, 10, '#4a3a2a');
      R(x, 6, 8, 4, 6, '#d9cfae');
      break;

    case 'chandelier':
      R(x, 14, 0, 4, 6, '#3a3a42');
      R(x, 4, 6, 24, 4, '#5a4a2a');
      R(x, 2, 8, 4, 4, '#c9a227'); R(x, 14, 8, 4, 4, '#c9a227'); R(x, 26, 8, 4, 4, '#c9a227');
      R(x, 2, 5, 4, 4, '#ffd08a'); R(x, 14, 5, 4, 4, '#ffd08a'); R(x, 26, 5, 4, 4, '#ffd08a');
      break;

    case 'rugprop': {   // alfombra persa azul y oro (contrasta con el sofa granate)
      R(x, 0, 0, 64, 48, '#1c2640');
      R(x, 2, 2, 60, 44, '#8a6a2a');
      R(x, 4, 4, 56, 40, '#22304e');
      R(x, 8, 8, 48, 32, '#2a3a5c');
      for (let i = 10; i < 54; i += 6) { R(x, i, 6, 3, 1, '#b08a3a'); R(x, i, 41, 3, 1, '#b08a3a'); }
      R(x, 22, 16, 20, 16, '#6a2f3a');
      R(x, 26, 20, 12, 8, '#b08a3a');
      R(x, 30, 22, 4, 4, '#2a3a5c');
      speckle(x, 64, 48, ['#1e2944'], 50, seed);
      break;
    }

    case 'plant':
      R(x, 4, 18, 8, 12, '#6b4a2f'); R(x, 4, 18, 8, 2, '#7d5836');
      R(x, 3, 22, 10, 1, '#553a24');
      R(x, 6, 8, 4, 12, '#2d5434');
      R(x, 2, 6, 5, 8, '#24462c'); R(x, 9, 4, 5, 9, '#24462c');
      R(x, 5, 2, 6, 6, '#376a40');
      break;

    case 'crate':
      R(x, 1, 3, 14, 12, '#5a3f28'); R(x, 1, 3, 14, 2, '#6f4f33');
      R(x, 1, 8, 14, 1, '#3a2719'); R(x, 7, 3, 1, 12, '#3a2719');
      break;

    /* ---------- edificios ---------- */
    case 'building': {
      const v = opt.v || 'house';
      const skin = {
        grill:  { wall: '#5a3a2c', trim: '#3f2a20', roof: '#2e2228', win: '#ffca6a' },
        school: { wall: '#6a5a4a', trim: '#4a4038', roof: '#3a3038', win: '#8fb8dd' },
        house:  { wall: '#4a4038', trim: '#3a3038', roof: '#2a2630', win: '#ffd08a' }
      }[v] || { wall: '#4a4038', trim: '#3a3038', roof: '#2a2630', win: '#ffd08a' };

      const roofH = Math.max(12, Math.round(H * 0.3));
      R(x, 0, roofH, W, H - roofH, skin.wall);
      speckle(x, W, H, [skin.trim], W, seed);
      R(x, 0, roofH, W, 3, skin.trim);

      R(x, 0, 0, W, roofH, skin.roof);                       // tejado
      for (let ry = 2; ry < roofH; ry += 4) R(x, 0, ry, W, 1, '#1e1a22');
      R(x, 0, 0, W, 2, '#3e3646');
      R(x, 0, roofH - 3, W, 3, '#1e1a22');

      const doorW = 16, doorX = (opt.door != null ? opt.door * T : (W - doorW) / 2) | 0;
      const doorY = H - 26;
      R(x, doorX - 2, doorY - 2, doorW + 4, 28, skin.trim);  // puerta
      R(x, doorX, doorY, doorW, 26, '#2a1d16');
      R(x, doorX + 2, doorY + 2, doorW - 4, 22, '#3a2719');
      R(x, doorX + doorW - 5, doorY + 13, 2, 2, '#c9a227');
      R(x, doorX - 4, doorY - 6, doorW + 8, 4, skin.trim);

      const rows = Math.max(1, Math.floor((H - roofH - 34) / 20));   // ventanas
      for (let ry = 0; ry < rows; ry++) {
        for (let cx = 6; cx < W - 16; cx += 22) {
          if (Math.abs(cx - doorX) < 20 && ry === rows - 1) continue;
          const wy = roofH + 8 + ry * 20;
          R(x, cx - 1, wy - 1, 16, 16, skin.trim);
          R(x, cx, wy, 14, 14, skin.win);
          R(x, cx + 1, wy + 1, 5, 5, '#fff0c0');
          R(x, cx + 6, wy, 1, 14, skin.trim);
          R(x, cx, wy + 6, 14, 1, skin.trim);
        }
      }

      if (opt.sign) {                                        // cartel
        const sw = Math.min(W - 8, opt.sign.length * 5 + 10);
        const sx = ((W - sw) / 2) | 0, sy = roofH + 2;
        R(x, sx, sy, sw, 11, '#1c1820');
        R(x, sx, sy, sw, 1, '#3e3646');
        x.fillStyle = '#e6c976';
        x.font = '7px monospace';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillText(opt.sign, (W / 2) | 0, sy + 6);
        x.textAlign = 'left';
      }
      break;
    }

    case 'light':
      break;                         // solo aporta luz (glow), no se dibuja

    default:
      R(x, 0, 0, W, H, '#ff00ff');   // prop desconocido: rosa chillon a proposito
  }
}

/* Crea (o reutiliza) la textura de un prop */
export function propTexture(scene, type, opt = {}) {
  const def = propDef(type);
  const w = opt.w || def.w, h = opt.h || def.h;
  const key = `prop_${type}_${w}x${h}_${opt.v || ''}_${opt.sign ? opt.sign.length : 0}_${opt.door ?? ''}`;
  if (scene.textures.exists(key)) return { key, w, h };

  const [c, x] = mk(w * T, h * T);
  drawProp(x, type, w, h, opt);
  if (!NO_OUTLINE.has(type)) outline(c);
  scene.textures.addCanvas(key, c);
  return { key, w, h };
}

/* =====================================================================
   PERSONAJES
   Hoja de 4 direcciones x 4 fotogramas, cada uno de 16x24.
   ===================================================================== */
export const CHAR_PALETTES = {
  damon:  { skin: '#dcae8c', hair: '#1a1820', hairStyle: 'short', top: '#16171d',
            bottom: '#1c1e26', shoes: '#0f1014', accent: '#2f6fa8' },
  stefan: { skin: '#e0b48f', hair: '#4a3524', hairStyle: 'short', top: '#4e3b2c',
            bottom: '#2a2c36', shoes: '#22242c', accent: '#8a6a3a' },
  bonnie: { skin: '#8a5a3c', hair: '#1c120e', hairStyle: 'wavy',  top: '#5a2a44',
            bottom: '#2a2434', shoes: '#1a1620', accent: '#c9a227' }
};

const DIRS = ['down', 'left', 'right', 'up'];

function drawChar(x, ox, oy, dir, step, p) {
  const bob = (step === 1 || step === 3) ? 1 : 0;   // pequeno rebote al caminar
  const o = (a, b, w, h, c) => R(x, ox + a, oy + b + bob, w, h, c);

  /* piernas */
  const swing = step === 1 ? 1 : (step === 3 ? -1 : 0);
  o(5, 17 - bob, 3, 5, p.bottom);
  o(8, 17 - bob, 3, 5, p.bottom);
  if (dir === 'left' || dir === 'right') {
    o(5 + swing, 17 - bob, 3, 5, p.bottom);
    o(8 - swing, 17 - bob, 3, 5, p.bottom);
  } else {
    o(5, 17 - bob + Math.max(0, swing), 3, 5 - Math.abs(swing), p.bottom);
    o(8, 17 - bob + Math.max(0, -swing), 3, 5 - Math.abs(swing), p.bottom);
  }
  o(5, 22 - bob, 3, 2, p.shoes);
  o(8, 22 - bob, 3, 2, p.shoes);

  /* torso */
  o(4, 10, 8, 8, p.top);
  o(4, 10, 8, 1, '#ffffff22');
  o(4, 16, 8, 1, '#00000033');

  /* brazos */
  if (dir === 'left')       o(11, 11, 2, 6, p.top);
  else if (dir === 'right') o(3, 11, 2, 6, p.top);
  else { o(3, 11, 2, 6, p.top); o(11, 11, 2, 6, p.top); }
  if (dir !== 'up') {
    if (dir === 'left')      o(11, 16, 2, 2, p.skin);
    else if (dir === 'right') o(3, 16, 2, 2, p.skin);
    else { o(3, 16, 2, 2, p.skin); o(11, 16, 2, 2, p.skin); }
  }

  /* detalle de color (collar / cuello) */
  o(6, 10, 4, 1, p.accent);

  /* cabeza */
  o(4, 3, 8, 8, p.skin);
  o(4, 3, 8, 1, '#ffffff18');

  /* pelo */
  const hs = p.hairStyle || 'short';
  if (dir === 'up') {
    o(3, 2, 10, 9, p.hair);
  } else {
    o(3, 2, 10, 4, p.hair);
    o(3, 2, 2, 6, p.hair);
    o(11, 2, 2, 6, p.hair);
    if (hs === 'long' || hs === 'wavy') {
      o(2, 4, 2, 10, p.hair);
      o(12, 4, 2, 10, p.hair);
      if (hs === 'wavy') { o(1, 7, 1, 5, p.hair); o(14, 7, 1, 5, p.hair); }
    }
    if (hs === 'bun') { o(6, 0, 4, 3, p.hair); }
  }

  /* cara */
  if (dir === 'down') {
    o(6, 7, 1, 2, '#1a1a1f');
    o(9, 7, 1, 2, '#1a1a1f');
    o(7, 9, 2, 1, '#00000044');
  } else if (dir === 'left') {
    o(5, 7, 1, 2, '#1a1a1f');
    o(4, 9, 2, 1, '#00000033');
  } else if (dir === 'right') {
    o(10, 7, 1, 2, '#1a1a1f');
    o(10, 9, 2, 1, '#00000033');
  }
}

export function buildCharacterSheet(scene, key, palette) {
  if (scene.textures.exists(key)) return key;
  const [c, x] = mk(16 * 4, 24 * 4);
  DIRS.forEach((dir, row) => {
    for (let step = 0; step < 4; step++) drawChar(x, step * 16, row * 24, dir, step, palette);
  });
  outline(c, [8, 7, 12], 16, 24);
  const tex = scene.textures.addCanvas(key, c);
  DIRS.forEach((dir, row) => {
    for (let step = 0; step < 4; step++) {
      tex.add(`${dir}${step}`, 0, step * 16, row * 24, 16, 24);
    }
  });
  return key;
}

/* ---------------------------------------------------------------------
   RETRATO de dialogo: un busto de 24x24 dibujado a proposito (no un
   recorte del sprite), con cara mas detallada. Se amplia x2 al canvas.
   Cada personaje tiene un gesto: Damon sonrie de lado, Stefan frunce
   un poco el ceno, Sammy se sonroja.
   --------------------------------------------------------------------- */
const PORTRAIT_MOOD = { damon: 'smirk', stefan: 'brood', bonnie: 'soft', player: 'blush' };

function drawBust(x, p, mood) {
  const hs = p.hairStyle || 'short';

  // pelo de fondo (melena larga cae por detras de los hombros)
  if (hs === 'long' || hs === 'wavy') {
    R(x, 4, 5, 16, 16, p.hair);
    if (hs === 'wavy') { R(x, 3, 10, 1, 8, p.hair); R(x, 20, 10, 1, 8, p.hair); }
  }

  // hombros y torso
  R(x, 3, 19, 18, 5, p.top);
  R(x, 5, 18, 14, 2, p.top);
  R(x, 3, 19, 18, 1, '#ffffff1a');
  R(x, 10, 18, 4, 3, p.skin);                 // cuello
  R(x, 10, 20, 4, 1, p.accent);               // collar / cuello de la ropa
  if (mood === 'smirk') {                     // chaqueta de cuero de Damon
    R(x, 7, 19, 2, 5, '#0b0b10'); R(x, 15, 19, 2, 5, '#0b0b10');
  }

  // cabeza
  R(x, 6, 6, 12, 12, p.skin);
  R(x, 6, 6, 12, 1, '#ffffff22');
  R(x, 6, 16, 12, 2, '#00000022');            // sombra de la mandibula
  R(x, 5, 10, 1, 4, p.skin); R(x, 18, 10, 1, 4, p.skin);   // orejas

  // pelo de delante
  R(x, 5, 3, 14, 5, p.hair);
  R(x, 5, 3, 2, 8, p.hair); R(x, 17, 3, 2, 8, p.hair);
  if (hs === 'short') { R(x, 8, 7, 5, 2, p.hair); R(x, 13, 7, 2, 1, p.hair); }
  else { R(x, 7, 7, 4, 2, p.hair); R(x, 14, 7, 3, 1, p.hair); }
  if (hs === 'long' || hs === 'wavy') { R(x, 4, 7, 2, 11, p.hair); R(x, 18, 7, 2, 11, p.hair); }
  if (hs === 'bun') R(x, 9, 0, 6, 4, p.hair);
  R(x, 7, 3, 8, 1, '#ffffff1c');              // brillo del pelo

  // cejas
  if (mood === 'brood') { R(x, 8, 9, 3, 1, p.hair); R(x, 13, 9, 3, 1, p.hair); R(x, 10, 10, 1, 1, p.hair); R(x, 13, 10, 1, 1, p.hair); }
  else if (mood === 'smirk') { R(x, 8, 9, 3, 1, p.hair); R(x, 13, 8, 3, 1, p.hair); }
  else { R(x, 8, 9, 3, 1, p.hair); R(x, 13, 9, 3, 1, p.hair); }

  // ojos (con brillo)
  const eye = mood === 'smirk' ? '#2f6fa8' : '#1a1a1f';   // los ojos azules de Damon
  R(x, 8, 11, 3, 2, '#f4efe6'); R(x, 13, 11, 3, 2, '#f4efe6');
  R(x, 9, 11, 2, 2, eye); R(x, 14, 11, 2, 2, eye);
  R(x, 9, 11, 1, 1, '#ffffff'); R(x, 14, 11, 1, 1, '#ffffff');

  // nariz
  R(x, 12, 13, 1, 2, '#00000026');

  // boca
  if (mood === 'smirk') { R(x, 10, 15, 4, 1, '#6a3030'); R(x, 14, 14, 1, 1, '#6a3030'); }
  else if (mood === 'brood') { R(x, 10, 15, 4, 1, '#7a4040'); }
  else { R(x, 10, 15, 4, 1, '#8a4a4a'); R(x, 9, 14, 1, 1, '#8a4a4a'); R(x, 14, 14, 1, 1, '#8a4a4a'); }

  // mejillas sonrojadas
  if (mood === 'blush' || mood === 'soft') {
    R(x, 7, 13, 2, 1, '#e0707055'); R(x, 15, 13, 2, 1, '#e0707055');
  }
}

export function drawPortrait(canvas, palette, id) {
  const x = canvas.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.clearRect(0, 0, canvas.width, canvas.height);

  const [tmp, tx] = mk(24, 24);
  drawBust(tx, palette, PORTRAIT_MOOD[id] || 'soft');
  outline(tmp, [8, 7, 12]);
  x.drawImage(tmp, 0, 0, 24, 24, 0, 0, canvas.width, canvas.height);
}

/* =====================================================================
   EFECTOS
   ===================================================================== */
export function buildFxTextures(scene) {
  if (!scene.textures.exists('fx_glow')) {
    const [c, x] = mk(128, 128);
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0,   'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    g.addColorStop(1,   'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    scene.textures.addCanvas('fx_glow', c);
  }

  if (!scene.textures.exists('fx_fog')) {
    /* Niebla que se repite sin costuras: cada mancha se dibuja tambien
       "del otro lado" del borde, asi la textura encaja consigo misma. */
    const FW = 256, FH = 256;
    const [c, x] = mk(FW, FH);
    const r = rng(9137);
    for (let i = 0; i < 22; i++) {
      const cx = r() * FW, cy = r() * FH, rad = 30 + r() * 52;
      for (const ox of [-FW, 0, FW]) {
        for (const oy of [-FH, 0, FH]) {
          const px = cx + ox, py = cy + oy;
          if (px + rad < 0 || px - rad > FW || py + rad < 0 || py - rad > FH) continue;
          const g = x.createRadialGradient(px, py, 0, px, py, rad);
          g.addColorStop(0, 'rgba(190,204,228,0.13)');
          g.addColorStop(1, 'rgba(190,204,228,0)');
          x.fillStyle = g;
          x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
        }
      }
    }
    scene.textures.addCanvas('fx_fog', c);
  }

  if (!scene.textures.exists('fx_dot')) {
    const [c, x] = mk(4, 4);
    R(x, 1, 0, 2, 4, '#ffffff'); R(x, 0, 1, 4, 2, '#ffffff');
    scene.textures.addCanvas('fx_dot', c);
  }

  if (!scene.textures.exists('fx_spark')) {
    const [c, x] = mk(12, 12);
    R(x, 5, 0, 2, 12, '#ffe9b0'); R(x, 0, 5, 12, 2, '#ffe9b0');
    R(x, 4, 4, 4, 4, '#fffbe8');
    R(x, 3, 3, 1, 1, '#ffe9b0'); R(x, 8, 3, 1, 1, '#ffe9b0');
    R(x, 3, 8, 1, 1, '#ffe9b0'); R(x, 8, 8, 1, 1, '#ffe9b0');
    scene.textures.addCanvas('fx_spark', c);
  }

  if (!scene.textures.exists('fx_shadow')) {
    const [c, x] = mk(16, 8);
    const g = x.createRadialGradient(8, 4, 0, 8, 4, 8);
    g.addColorStop(0, 'rgba(0,0,0,0.45)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 16, 8);
    scene.textures.addCanvas('fx_shadow', c);
  }

  if (!scene.textures.exists('fx_heart')) {
    const [c, x] = mk(16, 16);
    R(x, 2, 4, 5, 3, '#c0392f'); R(x, 9, 4, 5, 3, '#c0392f');
    R(x, 1, 6, 14, 3, '#c0392f'); R(x, 2, 9, 12, 2, '#c0392f');
    R(x, 4, 11, 8, 2, '#c0392f'); R(x, 6, 13, 4, 2, '#c0392f');
    R(x, 3, 5, 2, 2, '#e8635a');
    scene.textures.addCanvas('fx_heart', c);
  }

  if (!scene.textures.exists('fx_star')) {
    const [c, x] = mk(16, 16);
    R(x, 7, 1, 2, 14, '#e6c976'); R(x, 1, 7, 14, 2, '#e6c976');
    R(x, 5, 5, 6, 6, '#fff0c0'); R(x, 4, 4, 8, 8, '#f5dd9a');
    R(x, 5, 5, 6, 6, '#fff0c0');
    scene.textures.addCanvas('fx_star', c);
  }
}

/* Textura de tile suelta (la usa el minijuego para el fondo) */
export function singleTileTexture(scene, ch) {
  const key = 'tile_' + ch;
  if (scene.textures.exists(key)) return key;
  const [c, x] = mk(T, T);
  drawTile(x, ch, 3, 5);
  scene.textures.addCanvas(key, c);
  return key;
}

export { PROPS };
