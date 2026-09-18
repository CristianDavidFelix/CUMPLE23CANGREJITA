/* =====================================================================
   Interactable
   Cualquier cosa del mundo que se pueda mirar, tocar o encender.

   Tipos:
     inspect   texto y/o recuerdo
     photo     abre una fotografia real
     clue      pista del bosque (suma al contador de la mision)
     candle    enciende una vela y revela uno de los 23 deseos
     minigame  arranca el Birthday Rush

   Cada uno lleva una chispita flotando encima cuando esta sin usar, para
   que se vea desde lejos que hay algo ahi.
   ===================================================================== */

import { CONFIG } from '../config.js';
import { MEMORIES } from '../data/memories.js';
import { REASONS } from '../data/reasons.js';
import { Dialogue } from '../systems/DialogueSystem.js';
import { State } from '../systems/GameState.js';
import { bus } from '../systems/EventBus.js';
import { AudioManager } from '../systems/AudioManager.js';
import { propTexture } from '../systems/TextureFactory.js';
import { DEPTH } from '../systems/MapBuilder.js';

const T = CONFIG.TILE;

export class Interactable {
  constructor(scene, data) {
    this.scene = scene;
    this.data = data;
    this.id = data.id;
    this.type = data.t;
    this.x = data.x * T + T / 2;
    this.y = data.y * T + T / 2;
    this.used = this._alreadyUsed();

    /* Las velas tienen sprite propio; el resto son puntos invisibles
       colocados junto al prop que ya dibujo el mapa. */
    if (this.type === 'candle') {
      const lit = State.hasReason(data.reason);
      const { key } = propTexture(scene, lit ? 'candle_lit' : 'candle');
      this.sprite = scene.add.image(data.x * T, data.y * T, key)
        .setOrigin(0, 0).setDepth((data.y + 1) * T);
      if (lit) this._addFlame();
    }

    /* chispa indicadora */
    this.spark = scene.add.image(this.x, this.y - 14, 'fx_spark')
      .setDepth(DEPTH.GLOW)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.7)
      .setAlpha(this.used ? 0 : 0.9);

    if (!this.used) {
      scene.tweens.add({
        targets: this.spark,
        y: this.spark.y - 4,
        alpha: { from: 0.45, to: 0.95 },
        duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }

    /* Tocar directamente el objeto en la pantalla tambien funciona */
    this.hit = scene.add.zone(this.x, this.y, T * 2, T * 2)
      .setInteractive({ useHandCursor: true });
    this.hit.on('pointerdown', () => scene.tryTouchInteract(this));
  }

  _alreadyUsed() {
    const d = this.data;
    if (d.t === 'candle') return State.hasReason(d.reason);
    if (d.memory) return State.hasMemory(d.memory);
    if (d.t === 'minigame') return State.objectiveDone('q2_whispers', 'birthday_rush');
    return State.flag('seen_' + d.id);
  }

  get label() {
    if (this.type === 'candle') return this.used ? null : 'Encender la vela';
    if (this.type === 'minigame') return this.used ? 'Jugar otra vez' : 'Birthday Rush';
    return this.data.label || 'Mirar';
  }

  /* ---------------- interaccion ---------------- */
  interact() {
    const d = this.data;

    switch (this.type) {
      case 'candle':  return this._candle();
      case 'minigame': AudioManager.sfx('select'); bus.emit('minigame:start'); return;
      case 'clue':    return this._clue();
      case 'photo':   return this._inspect(true);
      default:        return this._inspect(false);
    }
  }

  _inspect(isPhoto) {
    const d = this.data;
    AudioManager.sfx('select');
    State.setFlag('seen_' + d.id);

    const lines = [];
    if (d.text) lines.push(d.text);
    if (d.memory && MEMORIES[d.memory]) lines.push(MEMORIES[d.memory].text);
    if (!lines.length) lines.push('No hay nada más que ver aquí.');

    const effects = [];
    if (d.memory) effects.push({ memory: d.memory });
    if (isPhoto && d.photo) effects.push({ photo: d.photo });

    this._consume();
    Dialogue.say(d.label || '', null, lines, effects);
  }

  _clue() {
    const d = this.data;
    AudioManager.sfx('unlock');
    this._consume();
    const lines = [];
    if (MEMORIES[d.memory]) lines.push(MEMORIES[d.memory].text);
    Dialogue.say(d.label || '', null, lines, [
      { memory: d.memory },
      { counter: ['q2_whispers', 'woods_clues'] }
    ]);
  }

  _candle() {
    const d = this.data;
    if (State.hasReason(d.reason)) return;

    AudioManager.sfx('candle');
    State.unlockReason(d.reason);
    this._consume();

    // cambia el sprite a "vela encendida" y le pone su llamita
    const { key } = propTexture(this.scene, 'candle_lit');
    this.sprite.setTexture(key);
    this._addFlame();

    Dialogue.say(
      `Deseo ${d.reason + 1} de ${REASONS.length}`,
      null,
      [REASONS[d.reason]],
      []
    );
  }

  _consume() {
    this.used = true;
    this.scene.tweens.killTweensOf(this.spark);
    this.scene.tweens.add({ targets: this.spark, alpha: 0, scale: 1.6, duration: 320 });
  }

  _addFlame() {
    const g = this.scene.add.image(this.x, this.y - 3, 'fx_glow')
      .setDepth(DEPTH.GLOW)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0xffb347)
      .setAlpha(0.5)
      .setDisplaySize(52, 52);
    this.scene.tweens.add({
      targets: g,
      alpha: { from: 0.32, to: 0.58 },
      duration: 700 + Math.random() * 600,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
    this.flame = g;
  }

  distanceTo(px, py) { return Math.hypot(px - this.x, py - this.y); }

  destroy() {
    this.sprite?.destroy();
    this.spark?.destroy();
    this.flame?.destroy();
    this.hit?.destroy();
  }
}
