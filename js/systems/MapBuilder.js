/* =====================================================================
   MapBuilder
   Convierte los datos de un mapa (js/data/maps.js) en cosas de Phaser.

   Claves de rendimiento:
   - El suelo entero se hornea en UNA textura -> 1 draw call para todo el
     terreno, en vez de cientos de tiles.
   - Las colisiones se fusionan en rectangulos horizontales -> pocos
     cuerpos fisicos en vez de uno por casilla.
   - Los brillos y la niebla son sprites sueltos, no shaders.
   ===================================================================== */

import { CONFIG } from '../config.js';
import { buildGroundTexture, propTexture, isSolidTile } from './TextureFactory.js';
import { propDef } from '../data/props.js';

const T = CONFIG.TILE;

/* Profundidades: todo lo del mundo se ordena por su borde inferior */
export const DEPTH = {
  GROUND: 0,
  FLAT: 5,
  TINT: 9000,
  GLOW: 9100,
  FOG: 9200,
  WEATHER: 9300
};

export const MapBuilder = {

  /* ---------------- suelo ---------------- */
  ground(scene, map) {
    const key = buildGroundTexture(scene, map);
    const img = scene.add.image(0, 0, key).setOrigin(0, 0).setDepth(DEPTH.GROUND);
    return img;
  },

  /* ---------------- rejilla de solidos ---------------- */
  solidGrid(map) {
    const grid = [];
    for (let y = 0; y < map.h; y++) {
      const row = new Uint8Array(map.w);
      for (let x = 0; x < map.w; x++) row[x] = isSolidTile(map.grid[y][x]) ? 1 : 0;
      grid.push(row);
    }

    // anade las cajas de los props
    for (const p of map.props) {
      const def = propDef(p.t);
      const w = p.w || def.w, h = p.h || def.h;
      let box = def.solid;
      if (box === 'full') box = [0, 0, w, h];
      if (!box) continue;
      const [dx, dy, dw, dh] = box;
      for (let y = p.y + dy; y < p.y + dy + dh; y++) {
        for (let x = p.x + dx; x < p.x + dx + dw; x++) {
          if (y >= 0 && y < map.h && x >= 0 && x < map.w) grid[y][x] = 1;
        }
      }
    }

    // las puertas nunca se bloquean, pase lo que pase
    for (const po of map.portals || []) {
      for (let y = po.y; y < po.y + po.h; y++) {
        for (let x = po.x; x < po.x + po.w; x++) {
          if (y >= 0 && y < map.h && x >= 0 && x < map.w) grid[y][x] = 0;
        }
      }
    }
    return grid;
  },

  /* Fusiona casillas solidas contiguas en rectangulos largos */
  collisionRects(grid, w, h) {
    const rects = [];
    for (let y = 0; y < h; y++) {
      let run = -1;
      for (let x = 0; x <= w; x++) {
        const solid = x < w && grid[y][x];
        if (solid && run === -1) run = x;
        else if (!solid && run !== -1) {
          rects.push({ x: run * T, y: y * T, w: (x - run) * T, h: T });
          run = -1;
        }
      }
    }
    return rects;
  },

  /* Crea los cuerpos estaticos invisibles para el motor de fisicas */
  collisionGroup(scene, rects) {
    const group = scene.physics.add.staticGroup();
    for (const r of rects) {
      const body = scene.add.zone(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h);
      scene.physics.add.existing(body, true);
      group.add(body);
    }
    return group;
  },

  /* ---------------- props ---------------- */
  props(scene, map) {
    const sprites = [];
    const glows = [];

    for (const p of map.props) {
      const def = propDef(p.t);
      const opt = { w: p.w, h: p.h, v: p.v, sign: p.sign, door: p.door };
      const { key, w, h } = propTexture(scene, p.t, opt);

      const s = scene.add.image(p.x * T, p.y * T, key).setOrigin(0, 0);
      s.setDepth(def.flat ? DEPTH.FLAT : (p.y + h) * T);
      sprites.push(s);

      if (def.glow && CONFIG.FX.glows) {
        const [gx, gy, rad, color, alpha] = def.glow;
        glows.push({ x: (p.x + gx) * T, y: (p.y + gy) * T, rad, color, alpha });
      }
    }
    return { sprites, glows };
  },

  /* ---------------- atmosfera ---------------- */
  atmosphere(scene, map, glows) {
    const a = map.atmosphere || {};
    const W = scene.scale.gameSize.width;
    const H = scene.scale.gameSize.height;
    const out = { tint: null, fogs: [], glows: [], emitter: null };

    /* 1. Filtro de color nocturno (multiply sobre toda la pantalla) */
    if (a.tint) {
      out.tint = scene.add.rectangle(0, 0, W * 2, H * 2, a.tint, a.alpha ?? 0.4)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH.TINT)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);
    }

    /* 2. Luces calidas: van ENCIMA del filtro, por eso parecen luz */
    for (const g of glows) {
      const img = scene.add.image(g.x, g.y, 'fx_glow')
        .setDepth(DEPTH.GLOW)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(g.color)
        .setAlpha(g.alpha)
        .setDisplaySize(g.rad * 2, g.rad * 2);
      out.glows.push(img);

      // parpadeo suave de vela, muy barato
      scene.tweens.add({
        targets: img,
        alpha: { from: g.alpha * 0.82, to: g.alpha },
        duration: 1400 + Math.random() * 1200,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }

    /* 3. Niebla: capas grandes que se desplazan despacio */
    const layers = Math.min(a.fog || 0, CONFIG.FX.fogLayers);
    for (let i = 0; i < layers; i++) {
      const fog = scene.add.tileSprite(0, 0, W, H, 'fx_fog')
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH.FOG)
        .setAlpha(i === 0 ? 0.3 : 0.18)
        .setScale(1);
      fog._speed = i === 0 ? 0.006 : -0.0035;
      out.fogs.push(fog);
    }

    /* 4. Luciernagas */
    const n = Math.min(a.fireflies || 0, CONFIG.FX.fireflies);
    if (n > 0) {
      out.emitter = scene.add.particles(0, 0, 'fx_dot', {
        x: { min: 0, max: map.w * T },
        y: { min: T * 2, max: (map.h - 2) * T },
        lifespan: { min: 2600, max: 5200 },
        speedX: { min: -9, max: 9 },
        speedY: { min: -12, max: 4 },
        scale: { start: 0.5, end: 1.1 },
        // aparecen y se apagan solas, como una luciernaga de verdad
        alpha: { start: 0.9, end: 0, ease: 'Sine.easeInOut' },
        tint: [0xffe9a8, 0xd8ffb0],
        blendMode: 'ADD',
        frequency: 2400 / n,
        quantity: 1,
        maxAliveParticles: n
      });
      out.emitter.setDepth(DEPTH.GLOW);
    }

    /* 5. Motas de polvo en interiores */
    if (a.dust && CONFIG.FX.dust) {
      out.dust = scene.add.particles(0, 0, 'fx_dot', {
        x: { min: 0, max: map.w * T },
        y: { min: 0, max: map.h * T },
        lifespan: 6000,
        speedX: { min: -4, max: 4 },
        speedY: { min: -6, max: -1 },
        scale: { start: 0.45, end: 0 },
        alpha: { start: 0.22, end: 0 },
        tint: 0xffe9c8,
        blendMode: 'ADD',
        frequency: 420,
        maxAliveParticles: 14
      });
      out.dust.setDepth(DEPTH.GLOW);
    }

    return out;
  },

  /* Mueve la niebla. Se llama desde update(). */
  updateAtmosphere(atmo, dt, cam) {
    for (const f of atmo.fogs) {
      f.tilePositionX += f._speed * dt;
      f.tilePositionY += f._speed * dt * 0.3;
      // acompana a la camara para que la niebla parezca del mundo
      f.tilePositionX += cam.scrollX * 0.0006;
    }
  },

  /* Reajusta lo que esta pegado a la pantalla al girar el telefono */
  resizeAtmosphere(scene, atmo) {
    const W = scene.scale.gameSize.width;
    const H = scene.scale.gameSize.height;
    if (atmo.tint) atmo.tint.setSize(W * 2, H * 2);
    for (const f of atmo.fogs) f.setSize(W, H);
  }
};
