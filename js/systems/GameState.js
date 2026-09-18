/* =====================================================================
   GameState  --  la unica fuente de verdad del progreso.
   Guarda banderas, lugares visitados, recuerdos, razones, misiones.
   Emite eventos por el bus para que la interfaz reaccione sola.
   ===================================================================== */

import { bus } from './EventBus.js';
import { SaveManager } from './SaveManager.js';
import { CONFIG } from '../config.js';
import { QUESTS, FIRST_QUEST } from '../data/quests.js';
import { MEMORIES } from '../data/memories.js';
import { REASONS, REASON_MILESTONES } from '../data/reasons.js';
import { fillTokens } from '../data/playerConfig.js';

function blank() {
  return {
    version: 1,
    map: null,          // ultimo mapa
    marker: null,       // ultima entrada usada
    pos: null,          // {x,y} en pixeles, para continuar donde estaba
    flags: {},
    visited: {},
    memories: {},
    reasons: {},
    quests: {},         // { id: { status:'active'|'done', obj:{id:true}, count:{id:n} } }
    stats: { started: null, rushScore: 0 }
  };
}

class GameStateClass {
  constructor() {
    this.data = blank();
    this._dirty = false;
    this._lastSave = 0;
    this.blocked = false;      // true mientras hay dialogo / menu abierto
  }

  /* ---------------- ciclo de vida ---------------- */

  newGame() {
    this.data = blank();
    this.data.stats.started = Date.now();
    this.startQuest(FIRST_QUEST);
    this.saveNow();
    bus.emit('state:reset');
  }

  loadSaved() {
    const d = SaveManager.load();
    if (!d) return false;
    this.data = { ...blank(), ...d };
    // asegura sub-objetos por si la partida viene de una version anterior
    for (const k of ['flags', 'visited', 'memories', 'reasons', 'quests']) {
      if (!this.data[k] || typeof this.data[k] !== 'object') this.data[k] = {};
    }
    if (!this.data.stats) this.data.stats = { started: Date.now(), rushScore: 0 };
    return true;
  }

  markDirty() { this._dirty = true; }

  /* Guardado automatico con freno: como mucho una escritura cada X ms */
  tickSave(now) {
    if (!this._dirty) return;
    if (now - this._lastSave < CONFIG.AUTOSAVE_MS) return;
    this.saveNow();
  }

  saveNow() {
    this._dirty = false;
    this._lastSave = performance.now();
    SaveManager.save(this.data);
  }

  wipe() {
    SaveManager.wipe();
    this.data = blank();
  }

  /* ---------------- banderas ---------------- */

  flag(key) { return !!this.data.flags[key]; }

  setFlag(key, value = true) {
    if (this.data.flags[key] === value) return;
    this.data.flags[key] = value;
    this.markDirty();
    bus.emit('flag', key);
  }

  /* ---------------- lugares ---------------- */

  visited(mapId) { return !!this.data.visited[mapId]; }

  visit(mapId) {
    const first = !this.data.visited[mapId];
    this.data.visited[mapId] = true;
    this.data.map = mapId;
    this.markDirty();
    this._checkObjectives({ visit: mapId });
    if (first) bus.emit('place:first', mapId);
    return first;
  }

  countVisited() { return Object.keys(this.data.visited).length; }

  /* ---------------- recuerdos ---------------- */

  hasMemory(id) { return !!this.data.memories[id]; }

  unlockMemory(id) {
    if (!MEMORIES[id]) { console.warn('[state] recuerdo desconocido:', id); return false; }
    if (this.data.memories[id]) return false;
    this.data.memories[id] = true;
    this.markDirty();
    bus.emit('memory:unlock', id);
    bus.emit('toast', {
      title: 'Recuerdo desbloqueado',
      sub: MEMORIES[id].title
    });
    this._checkObjectives({ memory: id });
    return true;
  }

  countMemories() { return Object.keys(this.data.memories).length; }
  totalMemories() { return Object.keys(MEMORIES).length; }

  /* ---------------- las 23 razones ---------------- */

  hasReason(i) { return !!this.data.reasons[i]; }

  unlockReason(i) {
    if (i < 0 || i >= REASONS.length) return false;
    if (this.data.reasons[i]) return false;
    this.data.reasons[i] = true;
    this.markDirty();
    const n = this.countReasons();
    bus.emit('reason:unlock', { index: i, text: REASONS[i], count: n });
    this.incCounter('q2_whispers', 'candles');
    if (REASON_MILESTONES[n]) {
      bus.emit('toast', { title: REASON_MILESTONES[n], sub: `${n} de ${REASONS.length}` });
    }
    return true;
  }

  countReasons() { return Object.keys(this.data.reasons).length; }

  /* ---------------- misiones ---------------- */

  quest(id) { return this.data.quests[id]; }

  questActive(id) { return this.data.quests[id]?.status === 'active'; }

  questDone(id) { return this.data.quests[id]?.status === 'done'; }

  activeQuestId() {
    for (const id of Object.keys(QUESTS)) {
      if (this.data.quests[id]?.status === 'active') return id;
    }
    return null;
  }

  startQuest(id) {
    if (!QUESTS[id] || this.data.quests[id]) return;
    this.data.quests[id] = { status: 'active', obj: {}, count: {} };
    this.markDirty();
    bus.emit('quest:start', id);
    bus.emit('quest:update', id);
    return true;
  }

  objectiveDone(questId, objId) {
    return !!this.data.quests[questId]?.obj[objId];
  }

  completeObjective(questId, objId) {
    const q = this.data.quests[questId];
    if (!q || q.status !== 'active') return false;
    if (q.obj[objId]) return false;
    const def = QUESTS[questId].objectives.find(o => o.id === objId);
    if (!def) return false;

    q.obj[objId] = true;
    this.markDirty();
    bus.emit('quest:objective', { quest: questId, objective: objId });
    bus.emit('quest:update', questId);
    this._maybeCompleteQuest(questId);
    return true;
  }

  /* Contadores (velas, pistas del bosque) */
  counter(questId, objId) {
    return this.data.quests[questId]?.count[objId] || 0;
  }

  incCounter(questId, objId, amount = 1) {
    const q = this.data.quests[questId];
    if (!q || q.status !== 'active') return;
    const def = QUESTS[questId].objectives.find(o => o.id === objId);
    if (!def || !def.count) return;
    if (q.obj[objId]) return;

    q.count[objId] = Math.min(def.count, (q.count[objId] || 0) + amount);
    this.markDirty();
    if (q.count[objId] >= def.count) this.completeObjective(questId, objId);
    else bus.emit('quest:update', questId);
  }

  _maybeCompleteQuest(id) {
    const def = QUESTS[id];
    const q = this.data.quests[id];
    if (!def || !q || q.status !== 'active') return;
    const all = def.objectives.every(o => q.obj[o.id]);
    if (!all) return;

    q.status = 'done';
    this.markDirty();
    bus.emit('quest:complete', id);
    if (def.next) {
      this.startQuest(def.next);
      if (def.completeToast) {
        bus.emit('toast', { title: def.completeToast, sub: QUESTS[def.next].title });
      }
    }
  }

  /* Revisa los objetivos automaticos (visitar sitio / recuerdo cualquiera) */
  _checkObjectives({ visit, memory }) {
    const id = this.activeQuestId();
    if (!id) return;
    for (const o of QUESTS[id].objectives) {
      if (this.objectiveDone(id, o.id)) continue;
      if (visit && o.onVisit === visit) this.completeObjective(id, o.id);
      else if (memory && o.onMemoryAny) this.completeObjective(id, o.id);
    }
  }

  /* ---------------- efectos de dialogo ---------------- */

  applyEffects(effects = []) {
    for (const e of effects) {
      if (!e) continue;
      if (e.flag) this.setFlag(e.flag);
      if (e.memory) this.unlockMemory(e.memory);
      if (typeof e.reason === 'number') this.unlockReason(e.reason);
      if (e.objective) this.completeObjective(e.objective[0], e.objective[1]);
      if (e.counter) this.incCounter(e.counter[0], e.counter[1]);
      if (e.toast) bus.emit('toast', { title: fillTokens(e.toast.title), sub: fillTokens(e.toast.sub) });
      if (e.photo) bus.emit('photo:show', e.photo);
      if (e.minigame) bus.emit('minigame:start');
      if (e.finale) { this.setFlag('finale_done'); this.saveNow(); bus.emit('finale:start'); }
      if (e.music) bus.emit('music:play', e.music);
    }
  }

  /* API reducida que usan los dialogos (NPC_ENTRY) */
  get api() {
    return {
      flag: k => this.flag(k),
      questActive: id => this.questActive(id),
      questDone: id => this.questDone(id),
      hasMemory: id => this.hasMemory(id),
      visited: id => this.visited(id),
      reasons: () => this.countReasons()
    };
  }
}

export const State = new GameStateClass();
