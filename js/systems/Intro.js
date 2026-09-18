/* =====================================================================
   Intro
   La cinematica de apertura. Usa el mismo lienzo negro que el final.
   Se puede saltar tocando la pantalla: nunca hay que esperar por obligacion.
   ===================================================================== */

import { PLAYER, fillTokens } from '../data/playerConfig.js';
import { AudioManager } from './AudioManager.js';
import { State } from './GameState.js';

const LINES = [
  'Mystic Falls, Virginia.',
  'Un pueblo pequeño, con demasiada historia y muy pocos habitantes ' +
  'dispuestos a contarla.',
  'Aqui la gente desaparece, vuelve, y nadie hace preguntas.',
  'Esta noche, algo es distinto.',
  'Alguien ha dejado cosas escondidas por todo el pueblo.',
  'Fotografías. Recados. Veintitrés velas sin encender.',
  'Todo con el mismo nombre escrito: {name}.'
];

class IntroClass {
  constructor() {
    this.cine    = document.getElementById('cinematic');
    this.content = document.getElementById('cine-content');
    this.nextBtn = document.getElementById('cine-next');
    this.timers  = [];
  }

  run(onDone) {
    State.blocked = true;
    this.cine.classList.remove('hidden');
    this.content.innerHTML = '';
    this.nextBtn.classList.add('hidden');
    this.onDone = onDone;

    const step = 2400;
    LINES.forEach((line, i) => {
      this.timers.push(setTimeout(() => {
        // solo dos lineas a la vez: se lee mucho mejor en un telefono
        if (this.content.children.length >= 2) this.content.firstChild.remove();
        const p = document.createElement('p');
        p.className = 'cine-line' + (i === 0 ? ' strong' : '');
        p.textContent = fillTokens(line);
        this.content.appendChild(p);
        AudioManager.sfx('talk');
      }, 700 + i * step));
    });

    this.timers.push(setTimeout(() => {
      this.nextBtn.textContent = 'Entrar a Mystic Falls';
      this.nextBtn.classList.remove('hidden');
      this.nextBtn.onclick = () => this.finish();
    }, 700 + LINES.length * step));

    /* saltar tocando fuera del boton */
    this._skip = () => {
      this.timers.forEach(clearTimeout);
      this.timers = [];
      this.content.innerHTML = '';
      const p = document.createElement('p');
      p.className = 'cine-line strong';
      p.textContent = fillTokens('Todo con el mismo nombre escrito: {name}.');
      this.content.appendChild(p);
      this.nextBtn.textContent = 'Entrar a Mystic Falls';
      this.nextBtn.classList.remove('hidden');
      this.nextBtn.onclick = () => this.finish();
      this.cine.removeEventListener('click', this._skip);
    };
    this.cine.addEventListener('click', this._skip);
  }

  finish() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.cine.removeEventListener('click', this._skip);
    this.cine.classList.add('hidden');
    this.nextBtn.classList.add('hidden');
    State.blocked = false;
    this.onDone?.();
  }
}

export const Intro = new IntroClass();
