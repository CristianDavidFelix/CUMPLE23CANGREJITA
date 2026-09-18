/* =====================================================================
   DebugMode
   Panel de pruebas. Se abre de dos maneras:
     - anadiendo  ?debug=1  al final de la URL
     - pulsando la tecla 0  (tambien funciona en el telefono si conectas
       un teclado, y siempre con ?debug=1)

   Sirve para no tener que jugarte el juego entero cada vez que cambies
   una linea de dialogo.
   ===================================================================== */

import { CONFIG } from '../config.js';
import { State } from './GameState.js';
import { MAPS, PLACE_LIST } from '../data/maps.js';
import { MEMORIES } from '../data/memories.js';
import { REASONS } from '../data/reasons.js';
import { QUESTS, QUEST_ORDER } from '../data/quests.js';
import { bus } from './EventBus.js';
import { HUD } from './HUD.js';
import { Journal } from './JournalUI.js';

class DebugModeClass {
  constructor() {
    this.el = document.getElementById('debug-panel');
    this.open = false;
    this.game = null;
  }

  init(game) {
    this.game = game;
    bus.on('input:debug', () => this.toggle());
    if (CONFIG.DEBUG) this.toggle();
  }

  toggle() {
    this.open = !this.open;
    this.el.classList.toggle('hidden', !this.open);
    if (this.open) this.render();
  }

  _world() {
    const s = this.game?.scene.getScene('World');
    return (s && s.scene.isActive()) ? s : null;
  }

  _btn(row, label, fn) {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = () => { fn(); this.render(); };
    row.appendChild(b);
  }

  _section(title) {
    const h = document.createElement('h5');
    h.textContent = title;
    this.el.appendChild(h);
    const row = document.createElement('div');
    row.className = 'row';
    this.el.appendChild(row);
    return row;
  }

  render() {
    this.el.innerHTML = '';

    /* --- estado --- */
    const info = document.createElement('div');
    info.className = 'info';
    const q = State.activeQuestId();
    info.textContent =
      `mapa: ${State.data.map || '-'}  |  mision: ${q || '-'}  |  ` +
      `recuerdos: ${State.countMemories()}/${Object.keys(MEMORIES).length}  |  ` +
      `velas: ${State.countReasons()}/${REASONS.length}  |  ` +
      `lugares: ${State.countVisited()}/${PLACE_LIST.length}`;
    this.el.appendChild(info);

    /* --- teleport --- */
    const tp = this._section('Teleport');
    for (const id of Object.keys(MAPS)) {
      this._btn(tp, id, () => {
        const w = this._world();
        if (w) w.teleport(id, 'from_town');
        else this.game.scene.start('World', { mapId: id, marker: 'from_town' });
      });
    }

    /* --- progreso --- */
    const pr = this._section('Progreso');
    this._btn(pr, 'todos los recuerdos', () => {
      Object.keys(MEMORIES).forEach(id => State.unlockMemory(id));
    });
    this._btn(pr, 'encender 23 velas', () => {
      REASONS.forEach((_, i) => State.unlockReason(i));
      const w = this._world();
      if (w && w.mapId === 'cemetery') w.teleport('cemetery', 'from_town');
    });
    this._btn(pr, '3 pistas del bosque', () => {
      State.incCounter('q2_whispers', 'woods_clues', 3);
    });
    this._btn(pr, 'ganar Birthday Rush', () => {
      State.completeObjective('q2_whispers', 'birthday_rush');
    });

    /* --- misiones --- */
    const qs = this._section('Misiones');
    for (const id of QUEST_ORDER) {
      this._btn(qs, 'completar ' + id, () => {
        State.startQuest(id);
        for (const o of QUESTS[id].objectives) {
          if (o.count) State.incCounter(id, o.id, o.count);
          State.completeObjective(id, o.id);
        }
        HUD.renderTracker();
      });
    }

    /* --- escenas --- */
    const sc = this._section('Escenas');
    this._btn(sc, 'menu', () => this.game.scene.start('Menu'));
    this._btn(sc, 'minijuego', () => bus.emit('minigame:start'));
    this._btn(sc, 'final', () => { State.setFlag('finale_done'); bus.emit('finale:start'); });
    this._btn(sc, 'diario', () => Journal.open());

    /* --- peligro --- */
    const dz = this._section('Zona peligrosa');
    this._btn(dz, 'borrar progreso y recargar', () => {
      if (confirm('Se borra todo el progreso guardado. Seguro?')) {
        State.wipe();
        location.reload();
      }
    });
    this._btn(dz, 'cerrar panel', () => this.toggle());
  }
}

export const Debug = new DebugModeClass();
