/* =====================================================================
   DialogueSystem
   La caja de dialogo vive en el DOM (no en el canvas): asi el texto se ve
   nitido en cualquier pantalla, se adapta al ancho del telefono y respeta
   las safe areas.

   Uso:  Dialogue.start('damon_first')
   ===================================================================== */

import { DIALOGUES } from '../data/dialogues.js';
import { PLAYER, fillTokens } from '../data/playerConfig.js';
import { CHAR_PALETTES, drawPortrait } from './TextureFactory.js';
import { State } from './GameState.js';
import { bus } from './EventBus.js';
import { AudioManager } from './AudioManager.js';

const TYPE_MS = 22;          // velocidad del typewriter (ms por letra)
/* En movil, al tocar un boton el navegador manda despues un 'click' que
   caeria sobre la caja recien abierta y se saltaria la primera linea.
   Ignoramos los toques de los primeros milisegundos. */
const GHOST_MS = 350;

class DialogueSystemClass {
  constructor() {
    this.el       = document.getElementById('dialogue');
    this.speakerEl = document.getElementById('dialogue-speaker');
    this.textEl   = document.getElementById('dialogue-text');
    this.choicesEl = document.getElementById('dialogue-choices');
    this.nextBtn  = document.getElementById('dialogue-next');
    this.skipBtn  = document.getElementById('dialogue-skip');
    this.portraitEl = document.getElementById('dialogue-portrait');
    this.portraitCanvas = document.getElementById('portrait-canvas');
    this.portraitImg = document.getElementById('portrait-img');

    this.active = false;
    this.node = null;
    this.lineIndex = 0;
    this.typing = false;
    this._timer = null;
    this._pendingPhoto = null;
    this.openedAt = 0;

    this.nextBtn.addEventListener('click', e => { e.stopPropagation(); this.advance(); });
    this.skipBtn.addEventListener('click', e => { e.stopPropagation(); this.skip(); });
    this.el.addEventListener('click', () => this.advance());
  }

  /* ---------------- API ---------------- */

  start(nodeId) {
    const node = DIALOGUES[nodeId];
    if (!node) { console.warn('[dialogo] nodo inexistente:', nodeId); return; }
    this.active = true;
    this.openedAt = performance.now();
    State.blocked = true;
    this.el.classList.remove('hidden');
    bus.emit('dialogue:start', nodeId);
    this._openNode(node);
  }

  /* Dialogo suelto sin pasar por data/dialogues.js (objetos del mundo) */
  say(speaker, portrait, lines, effects = []) {
    this.active = true;
    this.openedAt = performance.now();
    State.blocked = true;
    this.el.classList.remove('hidden');
    bus.emit('dialogue:start', null);
    this._openNode({ speaker, portrait, lines, effects, next: null });
  }

  close() {
    clearTimeout(this._timer);
    this.active = false;
    this.node = null;
    this.el.classList.add('hidden');
    this.choicesEl.innerHTML = '';
    State.blocked = false;
    bus.emit('dialogue:end');

    if (this._pendingPhoto) {
      const id = this._pendingPhoto;
      this._pendingPhoto = null;
      setTimeout(() => bus.emit('photo:show', id), 120);
    }
  }

  /* ---------------- interno ---------------- */

  _openNode(node) {
    this.node = node;
    this.lineIndex = 0;
    this.choicesEl.innerHTML = '';
    this._showLine();
  }

  _lineData(i) {
    const raw = this.node.lines[i];
    if (typeof raw === 'string') {
      return { speaker: this.node.speaker, portrait: this.node.portrait, text: raw };
    }
    return { speaker: raw.s ?? this.node.speaker, portrait: raw.p ?? this.node.portrait, t: raw.t, text: raw.t };
  }

  _showLine() {
    const d = this._lineData(this.lineIndex);
    this.speakerEl.textContent = fillTokens(d.speaker || '');
    this.speakerEl.style.display = d.speaker ? '' : 'none';
    this._setPortrait(d.portrait);
    this._type(fillTokens(d.text));
  }

  _type(text) {
    clearTimeout(this._timer);
    this.typing = true;
    this.textEl.textContent = '';
    this.nextBtn.classList.add('hidden');
    this.skipBtn.classList.remove('hidden');

    let i = 0;
    const tick = () => {
      if (!this.typing) return;
      // escribe de 1 en 1, pero no hace "bip" en cada letra
      this.textEl.textContent = text.slice(0, ++i);
      if (i % 3 === 0) AudioManager.sfx('talk');
      if (i < text.length) this._timer = setTimeout(tick, TYPE_MS);
      else this._finishLine();
    };
    tick();
  }

  _finishLine() {
    this.typing = false;
    clearTimeout(this._timer);
    const last = this.lineIndex >= this.node.lines.length - 1;
    this.skipBtn.classList.add('hidden');

    if (last && this.node.choices?.length) {
      this._renderChoices();
      this.nextBtn.classList.add('hidden');
    } else {
      this.nextBtn.classList.remove('hidden');
    }
  }

  _renderChoices() {
    this.choicesEl.innerHTML = '';
    this.node.choices.forEach(ch => {
      const b = document.createElement('button');
      b.className = 'choice-btn';
      b.textContent = fillTokens(ch.text);
      b.addEventListener('click', e => {
        e.stopPropagation();
        AudioManager.sfx('select');
        this._applyEffects(this.node.effects);     // efectos del nodo
        this._applyEffects(ch.effects);            // efectos de la eleccion
        this.choicesEl.innerHTML = '';
        if (ch.next && DIALOGUES[ch.next]) this._openNode(DIALOGUES[ch.next]);
        else this.close();
      });
      this.choicesEl.appendChild(b);
    });
  }

  /* Boton "Saltar": termina de escribir la linea de golpe */
  skip() {
    if (!this.typing) { this.advance(); return; }
    clearTimeout(this._timer);
    this.typing = false;
    this.textEl.textContent = fillTokens(this._lineData(this.lineIndex).text);
    this._finishLine();
  }

  /* Toque en cualquier sitio / boton Continuar */
  advance() {
    if (!this.active) return;
    if (performance.now() - this.openedAt < GHOST_MS) return;
    if (this.typing) { this.skip(); return; }
    if (this.node.choices?.length && this.lineIndex >= this.node.lines.length - 1) return;

    if (this.lineIndex < this.node.lines.length - 1) {
      this.lineIndex++;
      this._showLine();
      return;
    }

    // ultima linea: aplicar efectos y saltar al nodo siguiente (o cerrar)
    AudioManager.sfx('select');
    this._applyEffects(this.node.effects);
    const nx = this.node.next;
    if (nx && DIALOGUES[nx]) this._openNode(DIALOGUES[nx]);
    else this.close();
  }

  _applyEffects(effects) {
    if (!effects || !effects.length) return;
    // la foto se muestra al cerrar el dialogo, no encima de el
    const photo = effects.find(e => e && e.photo);
    if (photo) this._pendingPhoto = photo.photo;
    State.applyEffects(effects.filter(e => !(e && e.photo)));
  }

  /* ---------------- retratos ---------------- */

  _setPortrait(id) {
    if (!id) { this.portraitEl.style.visibility = 'hidden'; return; }
    this.portraitEl.style.visibility = 'visible';

    if (id === 'player' && PLAYER.PLAYER_PORTRAIT) {
      this.portraitEl.classList.add('photo');
      this.portraitImg.src = PLAYER.PLAYER_PORTRAIT;
      this.portraitImg.onerror = () => {
        this.portraitEl.classList.remove('photo');
        drawPortrait(this.portraitCanvas, PLAYER.PLAYER_AVATAR, 'player');
      };
      return;
    }

    this.portraitEl.classList.remove('photo');
    const pal = id === 'player' ? PLAYER.PLAYER_AVATAR : CHAR_PALETTES[id];
    if (pal) drawPortrait(this.portraitCanvas, pal, id);
    else this.portraitEl.style.visibility = 'hidden';
  }
}

export const Dialogue = new DialogueSystemClass();
