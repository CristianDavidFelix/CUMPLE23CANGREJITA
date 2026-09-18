/* =====================================================================
   SaveManager  --  guardado en localStorage
   Tolerante a fallos: si el navegador bloquea el almacenamiento (modo
   privado de iOS, por ejemplo) el juego sigue funcionando en memoria.
   ===================================================================== */

import { CONFIG } from '../config.js';

export const SaveManager = {
  available: true,

  /* Comprueba una sola vez si localStorage funciona de verdad */
  check() {
    try {
      const k = '__mf_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      this.available = true;
    } catch (e) {
      this.available = false;
      console.warn('[save] localStorage no disponible; el progreso no se guardara');
    }
    return this.available;
  },

  has() {
    if (!this.available) return false;
    try { return !!localStorage.getItem(CONFIG.SAVE_KEY); }
    catch { return false; }
  },

  load() {
    if (!this.available) return null;
    try {
      const raw = localStorage.getItem(CONFIG.SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return null;
      return data;
    } catch (e) {
      console.warn('[save] partida corrupta, se ignora', e);
      return null;
    }
  },

  save(data) {
    if (!this.available) return false;
    try {
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('[save] no se pudo guardar', e);
      return false;
    }
  },

  wipe() {
    try { localStorage.removeItem(CONFIG.SAVE_KEY); } catch {}
  }
};
