/* =====================================================================
   EventBus  --  mini sistema de eventos
   Lo usan a la vez el canvas (Phaser) y la interfaz (DOM), por eso es
   independiente de Phaser.
   ===================================================================== */

class EventBus {
  constructor() { this.map = new Map(); }

  on(event, fn) {
    if (!this.map.has(event)) this.map.set(event, new Set());
    this.map.get(event).add(fn);
    return () => this.off(event, fn);   // devuelve la funcion para desuscribirse
  }

  once(event, fn) {
    const off = this.on(event, (...a) => { off(); fn(...a); });
    return off;
  }

  off(event, fn) {
    this.map.get(event)?.delete(fn);
  }

  emit(event, payload) {
    const set = this.map.get(event);
    if (!set) return;
    // copia: un handler puede desuscribirse mientras iteramos
    for (const fn of [...set]) {
      try { fn(payload); }
      catch (e) { console.error('[bus] error en', event, e); }
    }
  }

  clear() { this.map.clear(); }
}

export const bus = new EventBus();
