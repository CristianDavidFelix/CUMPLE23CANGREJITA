/* =====================================================================
   InputManager
   Junta teclado y controles tactiles en un unico vector de movimiento,
   para que las escenas no tengan que saber de donde viene la orden.

   Teclado:  WASD / flechas para andar, E / Espacio / Enter para actuar,
             J diario, Esc menu, 0 modo debug.
   El teclado NUNCA es obligatorio: todo se puede jugar con el dedo.
   ===================================================================== */

import { bus } from './EventBus.js';
import { MobileControls } from './MobileControls.js';

class InputManagerClass {
  constructor() {
    this.keys = new Set();
    this.vector = { x: 0, y: 0 };
    this._actionQueued = false;
  }

  init() {
    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      this.keys.add(k);

      if (k === 'e' || k === ' ' || k === 'enter') { e.preventDefault(); bus.emit('input:action'); }
      if (k === 'j') { e.preventDefault(); bus.emit('input:journal'); }
      if (k === 'escape') { e.preventDefault(); bus.emit('input:menu'); }
      if (k === '0') { e.preventDefault(); bus.emit('input:debug'); }
      // evita que la pagina haga scroll con las flechas o el espacio
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    });

    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());

    bus.on('input:action', () => { this._actionQueued = true; });
  }

  /* Vector normalizado de -1..1 en las dos direcciones (8 direcciones) */
  getVector() {
    const k = this.keys;
    let x = 0, y = 0;
    if (k.has('a') || k.has('arrowleft'))  x -= 1;
    if (k.has('d') || k.has('arrowright')) x += 1;
    if (k.has('w') || k.has('arrowup'))    y -= 1;
    if (k.has('s') || k.has('arrowdown'))  y += 1;

    if (x || y) {
      const len = Math.hypot(x, y);
      this.vector.x = x / len;
      this.vector.y = y / len;
    } else {
      // si el teclado no dice nada, manda el joystick
      this.vector.x = MobileControls.vector.x;
      this.vector.y = MobileControls.vector.y;
    }
    return this.vector;
  }

  /* Devuelve true UNA vez por pulsacion */
  consumeAction() {
    if (!this._actionQueued) return false;
    this._actionQueued = false;
    return true;
  }

  clear() {
    this.keys.clear();
    this._actionQueued = false;
    MobileControls.reset();
  }
}

export const Input = new InputManagerClass();
