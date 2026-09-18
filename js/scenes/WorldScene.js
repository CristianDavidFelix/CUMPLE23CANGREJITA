/* =====================================================================
   WorldScene
   La escena de exploracion. Una sola escena sirve para los seis lugares:
   se reconstruye con los datos del mapa que le pases.

     this.scene.start('World', { mapId: 'grill', marker: 'from_town' })

   Asi no hay seis archivos casi identicos que mantener.
   ===================================================================== */

import { CONFIG } from '../config.js';
import { MAPS } from '../data/maps.js';
import { MapBuilder, DEPTH } from '../systems/MapBuilder.js';
import { Viewport } from '../systems/Viewport.js';
import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { Interactable } from '../entities/Interactable.js';
import { Input } from '../systems/InputManager.js';
import { MobileControls } from '../systems/MobileControls.js';
import { State } from '../systems/GameState.js';
import { HUD } from '../systems/HUD.js';
import { AudioManager } from '../systems/AudioManager.js';
import { bus } from '../systems/EventBus.js';

const T = CONFIG.TILE;

export class WorldScene extends Phaser.Scene {
  constructor() { super('World'); }

  init(data) {
    this.mapId = data.mapId || State.data.map || 'town';
    this.markerName = data.marker || 'start';
    this.spawnPos = data.pos || null;     // para "continuar partida"
    this.transitioning = false;
    this.moveTarget = null;
  }

  create() {
    const map = MAPS[this.mapId];
    this.map = map;
    map.w = map.grid[0].length;
    map.h = map.grid.length;

    /* ---------- terreno y colisiones ---------- */
    MapBuilder.ground(this, map);
    const grid = MapBuilder.solidGrid(map);
    this.solid = grid;
    const rects = MapBuilder.collisionRects(grid, map.w, map.h);
    const walls = MapBuilder.collisionGroup(this, rects);

    /* ---------- decorado ---------- */
    const { glows } = MapBuilder.props(this, map);

    /* ---------- jugadora ---------- */
    const marker = map.markers[this.markerName] || map.markers.start || [2, 2];
    const px = this.spawnPos ? this.spawnPos.x : marker[0] * T + T / 2;
    const py = this.spawnPos ? this.spawnPos.y : marker[1] * T + T / 2;

    this.physics.world.setBounds(0, 0, map.w * T, map.h * T);
    this.player = new Player(this, px, py);
    this.physics.add.collider(this.player, walls);

    /* ---------- personajes ---------- */
    this.npcs = [];
    for (const n of map.npcs || []) {
      if (n.showIf && !State.questActive(n.showIf) && !State.flag('finale_done')) continue;
      if (n.hideIf && (State.questActive(n.hideIf) || State.flag('finale_done'))) continue;
      const npc = new NPC(this, n);
      this.physics.add.collider(this.player, npc);
      this.npcs.push(npc);
    }

    /* ---------- objetos ---------- */
    this.objects = (map.objects || []).map(o => new Interactable(this, o));

    /* ---------- puertas ---------- */
    this.portals = [];
    for (const p of map.portals || []) {
      const zone = this.add.zone(
        p.x * T + (p.w * T) / 2,
        p.y * T + (p.h * T) / 2,
        p.w * T, p.h * T
      );
      this.physics.add.existing(zone, true);
      zone.portalData = p;
      this.portals.push(zone);
      this.physics.add.overlap(this.player, zone, () => this.usePortal(p));
    }

    /* ---------- camara y atmosfera ---------- */
    Viewport.apply(this, map.w, map.h, this.player);
    this.atmo = MapBuilder.atmosphere(this, map, glows);

    /* ---------- entrada tactil en el mundo ---------- */
    this.input.on('pointerdown', p => {
      if (State.blocked || this.transitioning) return;
      // andar hacia donde se toca (comodo en movil, opcional siempre)
      const w = this.cameras.main.getWorldPoint(p.x, p.y);
      this.moveTarget = { x: w.x, y: w.y, t: this.time.now };
    });

    /* ---------- interfaz ---------- */
    HUD.show();
    HUD.setLocation(map.name);
    MobileControls.show();
    const first = State.visit(this.mapId);
    HUD.showBanner(map.name, map.subtitle);
    AudioManager.play(map.music);
    if (first) AudioManager.sfx('chime');

    State.data.marker = this.markerName;
    State.markDirty();

    /* ---------- girar el telefono ---------- */
    this.scale.on('resize', this.handleResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.handleResize, this);
      this.objects.forEach(o => o.destroy());
    });

    this.cameras.main.fadeIn(420, 0, 0, 0);
  }

  handleResize() {
    Viewport.onResize(this, this.map.w, this.map.h);
    MapBuilder.resizeAtmosphere(this, this.atmo);
  }

  /* ---------------- bucle ---------------- */
  update(time, dt) {
    if (this.transitioning) return;

    /* pausa: dialogo, diario o menu abiertos */
    if (State.blocked) {
      this.player.setVelocity(0, 0);
      this.player.update({ x: 0, y: 0 }, dt);
      this.moveTarget = null;
      MobileControls.setAction(null);
      return;
    }

    /* movimiento */
    let vec = Input.getVector();
    if (vec.x || vec.y) this.moveTarget = null;        // el joystick manda
    else if (this.moveTarget) vec = this._followTarget();

    this.player.update(vec, dt);

    /* npcs miran a la jugadora */
    for (const n of this.npcs) n.lookAt(this.player);

    /* que es lo mas cercano con lo que interactuar */
    const near = this.findNearest();
    this.current = near;
    MobileControls.setAction(near ? near.label : null);

    if (Input.consumeAction() && near) {
      this.moveTarget = null;
      near.interact();
    }

    MapBuilder.updateAtmosphere(this.atmo, dt, this.cameras.main);
    State.tickSave(time);
  }

  /* Camina hacia el punto tocado; se rinde si se choca o ya llego */
  _followTarget() {
    const t = this.moveTarget;
    const dx = t.x - this.player.x;
    const dy = t.y - this.player.y;
    const d = Math.hypot(dx, dy);

    if (d < 6 || this.time.now - t.t > 6000) { this.moveTarget = null; return { x: 0, y: 0 }; }

    // si lleva un momento sin avanzar, es que hay una pared: deja de intentarlo
    if (this._lastDist !== undefined && Math.abs(this._lastDist - d) < 0.12) {
      this._stuck = (this._stuck || 0) + 1;
      if (this._stuck > 12) { this._stuck = 0; this.moveTarget = null; return { x: 0, y: 0 }; }
    } else this._stuck = 0;
    this._lastDist = d;

    return { x: dx / d, y: dy / d };
  }

  /* NPC u objeto mas cercano dentro del radio de interaccion */
  findNearest() {
    let best = null, bestD = CONFIG.INTERACT_RADIUS;
    const px = this.player.x, py = this.player.y;

    for (const n of this.npcs) {
      const d = Math.hypot(n.x - px, n.y - py);
      if (d < bestD + 8) { bestD = d; best = n; }
    }
    for (const o of this.objects) {
      if (!o.label) continue;
      const d = o.distanceTo(px, py);
      if (d < bestD) { bestD = d; best = o; }
    }
    return best;
  }

  /* Toque directo sobre un objeto de la pantalla */
  tryTouchInteract(obj) {
    if (State.blocked || this.transitioning) return;
    const d = obj.distanceTo(this.player.x, this.player.y);
    if (d <= CONFIG.INTERACT_RADIUS + 10) {
      this.moveTarget = null;
      obj.interact();
    } else {
      // si esta lejos, camina hasta el
      this.moveTarget = { x: obj.x, y: obj.y + 10, t: this.time.now };
    }
  }

  /* ---------------- cambio de mapa ---------------- */
  usePortal(p) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.setVelocity(0, 0);
    AudioManager.sfx('door');
    MobileControls.setAction(null);
    Input.clear();

    State.data.map = p.to;
    State.data.pos = null;
    State.saveNow();

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('World', { mapId: p.to, marker: p.marker });
    });
  }

  /* Usado por el modo debug */
  teleport(mapId, marker = 'from_town') {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('World', { mapId, marker });
    });
  }

  /* Guarda la posicion exacta al salir (para "Continuar") */
  snapshot() {
    if (!this.player) return;
    State.data.map = this.mapId;
    State.data.marker = this.markerName;
    State.data.pos = { x: Math.round(this.player.x), y: Math.round(this.player.y) };
    State.saveNow();
  }
}
