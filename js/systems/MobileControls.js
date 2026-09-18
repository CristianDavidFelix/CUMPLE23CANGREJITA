/* =====================================================================
   MobileControls
   Joystick virtual (abajo a la izquierda) y boton de accion (abajo a la
   derecha). Usa Pointer Events, asi que funciona igual con dedo, raton y
   lapiz, y soporta varios dedos a la vez (caminar y pulsar accion).

   Detalles que importan en movil:
   - touch-action:none en el CSS -> el navegador no hace scroll ni zoom
   - preventDefault en los gestos -> Safari no rebota
   - el pulgar se queda pegado al dedo aunque salgas del circulo
   ===================================================================== */

import { bus } from './EventBus.js';
import { AudioManager } from './AudioManager.js';

class MobileControlsClass {
  constructor() {
    this.stick   = document.getElementById('joystick');
    this.thumb   = document.getElementById('joystick-thumb');
    this.wrap    = document.getElementById('touch-controls');
    this.actionBtn = document.getElementById('btn-action');
    this.actionLabel = document.getElementById('action-label');

    this.vector = { x: 0, y: 0 };    // -1..1
    this.pointerId = null;
    this.radius = 48;
    this.actionDown = false;
  }

  init() {
    /* ---- joystick ---- */
    this.stick.addEventListener('pointerdown', e => this._start(e));
    this.stick.addEventListener('pointermove', e => this._move(e));
    this.stick.addEventListener('pointerup', e => this._end(e));
    this.stick.addEventListener('pointercancel', e => this._end(e));
    this.stick.addEventListener('lostpointercapture', e => this._end(e));

    /* ---- boton de accion ---- */
    const press = e => {
      e.preventDefault();
      e.stopPropagation();
      if (this.actionDown) return;
      this.actionDown = true;
      bus.emit('input:action');
    };
    this.actionBtn.addEventListener('pointerdown', press);
    this.actionBtn.addEventListener('pointerup', e => { e.preventDefault(); this.actionDown = false; });
    this.actionBtn.addEventListener('pointercancel', () => { this.actionDown = false; });
    // sin menu contextual al mantener pulsado
    this.actionBtn.addEventListener('contextmenu', e => e.preventDefault());
    this.stick.addEventListener('contextmenu', e => e.preventDefault());
  }

  show() { this.wrap.classList.remove('hidden'); }
  hide() { this.wrap.classList.add('hidden'); this.reset(); }

  _start(e) {
    if (this.pointerId !== null) return;
    e.preventDefault();
    this.pointerId = e.pointerId;
    // la captura mantiene el dedo "enganchado" aunque salga del circulo;
    // si el navegador no la permite, el joystick sigue funcionando igual
    try { this.stick.setPointerCapture(e.pointerId); } catch {}
    this.stick.classList.add('active');

    const r = this.stick.getBoundingClientRect();
    this.cx = r.left + r.width / 2;
    this.cy = r.top + r.height / 2;
    this.radius = r.width * 0.36;
    this._move(e);
  }

  _move(e) {
    if (e.pointerId !== this.pointerId) return;
    e.preventDefault();

    let dx = e.clientX - this.cx;
    let dy = e.clientY - this.cy;
    const dist = Math.hypot(dx, dy) || 1;

    // zona muerta pequena: evita que camine sola si el dedo tiembla
    const dead = this.radius * 0.18;
    if (dist < dead) { this.vector.x = 0; this.vector.y = 0; this._thumb(0, 0); return; }

    const clamped = Math.min(dist, this.radius);
    const nx = (dx / dist), ny = (dy / dist);
    // fuerza proporcional, pero a partir del 85% ya es velocidad maxima
    const power = Math.min(1, (clamped - dead) / (this.radius * 0.85 - dead));

    this.vector.x = nx * power;
    this.vector.y = ny * power;
    this._thumb(nx * clamped, ny * clamped);
  }

  _end(e) {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.stick.classList.remove('active');
    this.reset();
  }

  reset() {
    this.vector.x = 0;
    this.vector.y = 0;
    this._thumb(0, 0);
  }

  _thumb(x, y) {
    this.thumb.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }

  /* El boton se enciende cuando hay algo con lo que interactuar */
  setAction(label) {
    if (label) {
      this.actionBtn.classList.add('available');
      this.actionLabel.textContent = label;
    } else {
      this.actionBtn.classList.remove('available');
      this.actionLabel.textContent = '';
    }
  }
}

export const MobileControls = new MobileControlsClass();
