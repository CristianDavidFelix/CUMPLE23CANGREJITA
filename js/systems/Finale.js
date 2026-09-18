/* =====================================================================
   Finale
   La secuencia final, toda en DOM para que el texto se vea perfecto:

     fundido a negro  ->  unas lineas  ->  "23"  ->
     "Feliz cumpleanos, Sammy"  ->  la carta

   El texto de la carta vive en js/data/letter.js, para que puedas
   reescribirlo sin tocar nada de codigo.
   ===================================================================== */

import { LETTER } from '../data/letter.js';
import { PLAYER, fillTokens } from '../data/playerConfig.js';
import { REASONS } from '../data/reasons.js';
import { State } from './GameState.js';
import { AudioManager } from './AudioManager.js';
import { bus } from './EventBus.js';

/* Lineas de transicion antes del numero grande */
const LEAD_IN = [
  'Damon apaga la luz del salón.',
  'Stefan abre las cortinas y entra la luna entera.',
  'En la mesa hay un pastel que nadie había visto llegar.',
  'Y velas. Otras veintitrés.'
];

class FinaleClass {
  constructor() {
    this.cine     = document.getElementById('cinematic');
    this.content  = document.getElementById('cine-content');
    this.nextBtn  = document.getElementById('cine-next');
    this.letterEl = document.getElementById('letter');
    this.paper    = document.getElementById('letter-paper');
    this.titleEl  = document.getElementById('letter-title');
    this.bodyEl   = document.getElementById('letter-body');
    this.signEl   = document.getElementById('letter-sign');
    this.timers   = [];
  }

  init() {
    document.getElementById('letter-close').addEventListener('click', () => this.closeLetter());
  }

  _wait(ms, fn) { this.timers.push(setTimeout(fn, ms)); }
  _clearTimers() { this.timers.forEach(clearTimeout); this.timers = []; }

  /* ---------------- secuencia ---------------- */

  run() {
    State.blocked = true;
    this._clearTimers();
    this.cine.classList.remove('hidden');
    this.content.innerHTML = '';
    this.nextBtn.classList.add('hidden');

    AudioManager.play('finale');
    bus.emit('finale:running');

    /* 1. lineas de entrada, una cada 2.6 s */
    LEAD_IN.forEach((line, i) => {
      this._wait(900 + i * 2600, () => {
        const p = document.createElement('p');
        p.className = 'cine-line';
        p.textContent = fillTokens(line);
        this.content.appendChild(p);
      });
    });

    /* 2. el numero */
    const afterLines = 900 + LEAD_IN.length * 2600 + 900;
    this._wait(afterLines, () => {
      this.content.innerHTML = '';
      const n = document.createElement('div');
      n.className = 'cine-number';
      n.textContent = String(PLAYER.PLAYER_AGE);
      this.content.appendChild(n);
      AudioManager.sfx('heart');
    });

    /* 3. la felicitacion */
    this._wait(afterLines + 4200, () => {
      this.content.innerHTML = '';
      const h = document.createElement('div');
      h.className = 'cine-happy';
      h.innerHTML = 'Feliz cumpleaños,<b></b>';
      h.querySelector('b').textContent = PLAYER.PLAYER_NAME;
      this.content.appendChild(h);
      AudioManager.sfx('chime');
    });

    /* 4. boton para abrir la carta */
    this._wait(afterLines + 8000, () => {
      this.nextBtn.textContent = 'Leer la carta';
      this.nextBtn.classList.remove('hidden');
      this.nextBtn.onclick = () => this.showLetter();
    });
  }

  /* ---------------- carta ---------------- */

  showLetter() {
    this._clearTimers();
    this.cine.classList.add('hidden');

    const name = PLAYER.PLAYER_FULL_NAME || PLAYER.PLAYER_NAME;
    this.titleEl.textContent = fillTokens(LETTER.title.replaceAll('{name}', name));

    this.bodyEl.innerHTML = '';
    LETTER.paragraphs.forEach(par => {
      const p = document.createElement('p');
      p.textContent = fillTokens(par);
      this.bodyEl.appendChild(p);
    });

    /* pequeno recuento, escrito a mano, como una posdata */
    const stats = document.createElement('p');
    stats.style.opacity = '.72';
    stats.style.fontSize = '.85em';
    stats.textContent =
      `P.D. Encendiste ${State.countReasons()} de ${REASONS.length} velas, ` +
      `encontraste ${State.countMemories()} recuerdos y recorriste ` +
      `${State.countVisited()} lugares de este pueblo.`;
    this.bodyEl.appendChild(stats);

    this.signEl.textContent = '';
    LETTER.signature.split('\n').forEach((line, i) => {
      if (i) this.signEl.appendChild(document.createElement('br'));
      this.signEl.appendChild(document.createTextNode(line));
    });

    if (LETTER.afterword) {
      const aw = document.createElement('p');
      aw.style.marginTop = '1.6em';
      aw.style.textAlign = 'center';
      aw.style.opacity = '.66';
      aw.style.fontSize = '.85em';
      aw.textContent = fillTokens(LETTER.afterword);
      this.bodyEl.appendChild(aw);
    }

    this.letterEl.classList.remove('hidden');
    this.letterEl.scrollTop = 0;
    State.setFlag('letter_read');
    State.saveNow();
  }

  closeLetter() {
    AudioManager.sfx('select');
    this.letterEl.classList.add('hidden');
    this.cine.classList.add('hidden');
    State.blocked = false;
    bus.emit('finale:done');
  }

  /* Para volver a leer la carta desde el menu, una vez terminado el juego */
  openLetterDirect() {
    State.blocked = true;
    this.showLetter();
  }
}

export const Finale = new FinaleClass();
