/* =====================================================================
   MinigameScene  --  "Birthday Rush"
   Aparecen corazones, estrellas y velas durante 23 segundos. Hay que
   tocarlos antes de que se apaguen.

   Decisiones de diseno:
   - Solo hay cosas buenas: no se puede perder, solo sacar mejor o peor
     puntuacion. Esto es un regalo, no un examen.
   - Los objetivos son grandes (56 px) porque se juega con el dedo.
   - La camara va a zoom 1, asi que aqui el texto de Phaser si se ve
     nitido y podemos usarlo para el marcador.
   ===================================================================== */

import { State } from '../systems/GameState.js';
import { Dialogue } from '../systems/DialogueSystem.js';
import { AudioManager } from '../systems/AudioManager.js';
import { MobileControls } from '../systems/MobileControls.js';
import { HUD } from '../systems/HUD.js';
import { bus } from '../systems/EventBus.js';

const DURATION = 23000;      // 23 segundos, evidentemente
const TARGET_SCORE = 23;

export class MinigameScene extends Phaser.Scene {
  constructor() { super('Minigame'); }

  init(data) {
    this.back = data.back || { mapId: 'grill', marker: 'from_town' };
    this.score = 0;
    this.timeLeft = DURATION;
    this.done = false;
  }

  create() {
    const W = this.scale.gameSize.width;
    const H = this.scale.gameSize.height;
    const cam = this.cameras.main;
    cam.setZoom(1);
    cam.setScroll(0, 0);
    cam.setBounds(0, 0, W, H);

    HUD.hide();
    MobileControls.hide();
    State.blocked = false;

    /* fondo: el Grill de noche, desenfocado a base de manchas */
    const g = this.add.graphics();
    g.fillGradientStyle(0x2a1a22, 0x241a2e, 0x140f18, 0x1a1420, 1);
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) {
      this.add.image(Math.random() * W, Math.random() * H, 'fx_glow')
        .setDisplaySize(120 + Math.random() * 180, 120 + Math.random() * 180)
        .setTint([0xff7a4a, 0xffca6a, 0xa8456a][i % 3])
        .setAlpha(0.06 + Math.random() * 0.06)
        .setBlendMode(Phaser.BlendModes.ADD);
    }

    /* cabecera */
    this.add.text(W / 2, this._top() + 6, 'BIRTHDAY RUSH', {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: Math.round(Math.min(W, H) * 0.055) + 'px',
      color: '#e6c976'
    }).setOrigin(0.5, 0).setShadow(0, 2, '#000', 6);

    this.scoreText = this.add.text(W / 2, this._top() + 6 + Math.min(W, H) * 0.075,
      '0 / ' + TARGET_SCORE, {
        fontFamily: 'Cinzel, Georgia, serif', fontSize: Math.round(Math.min(W, H) * 0.048) + 'px',
        color: '#e9e2d6'
      }).setOrigin(0.5, 0).setShadow(0, 2, '#000', 6);

    /* barra de tiempo */
    const barW = Math.min(W * 0.72, 420);
    this.barBg = this.add.rectangle(W / 2, H - this._bottom() - 22, barW, 6, 0xffffff, 0.14);
    this.bar = this.add.rectangle(W / 2 - barW / 2, H - this._bottom() - 22, barW, 6, 0xc9a227)
      .setOrigin(0, 0.5);
    this.barW = barW;

    this.hint = this.add.text(W / 2, H - this._bottom() - 44,
      'Toca todo lo que aparezca', {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: Math.round(Math.min(W, H) * 0.04) + 'px',
        color: '#a99f90', fontStyle: 'italic'
      }).setOrigin(0.5, 1);

    /* zona de juego: respeta cabecera, barra y muescas de pantalla */
    this.field = {
      x: 40, y: this._top() + Math.min(W, H) * 0.19,
      w: W - 80, h: H - this._bottom() - 70 - (this._top() + Math.min(W, H) * 0.19)
    };

    this.targets = [];
    this.spawnTimer = 0;
    this.spawnEvery = 520;

    this.time.delayedCall(400, () => { this.spawnEvery = 520; });
    AudioManager.play('grill');
  }

  _top()    { return 18 + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0); }
  _bottom() { return 18 + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab')) || 0); }

  update(time, dt) {
    if (this.done) return;

    this.timeLeft -= dt;
    this.bar.width = Math.max(0, this.barW * (this.timeLeft / DURATION));

    if (this.timeLeft <= 0) { this.finish(); return; }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn();
      // se va acelerando poco a poco
      this.spawnEvery = Math.max(260, this.spawnEvery - 9);
      this.spawnTimer = this.spawnEvery;
    }
  }

  spawn() {
    const f = this.field;
    const kinds = [
      { tex: 'fx_heart', tint: 0xffffff, points: 1, size: 58 },
      { tex: 'fx_star',  tint: 0xffffff, points: 2, size: 52 },
      { tex: 'fx_spark', tint: 0xffd08a, points: 1, size: 48 }
    ];
    const k = kinds[Math.random() < 0.28 ? 1 : (Math.random() < 0.5 ? 0 : 2)];

    const x = f.x + 30 + Math.random() * Math.max(10, f.w - 60);
    const y = f.y + 30 + Math.random() * Math.max(10, f.h - 60);

    const s = this.add.image(x, y, k.tex)
      .setDisplaySize(k.size, k.size)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });
    s.setTint(k.tint);
    s.points = k.points;

    const halo = this.add.image(x, y, 'fx_glow')
      .setDisplaySize(k.size * 2.2, k.size * 2.2)
      .setTint(k.points === 2 ? 0xffd08a : 0xff6a7a)
      .setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({ targets: [s, halo], alpha: { from: 0, to: 1 }, duration: 160 });
    this.tweens.add({
      targets: s, angle: { from: -8, to: 8 },
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    const kill = () => {
      if (!s.active) return;
      this.tweens.add({
        targets: [s, halo], alpha: 0, scale: s.scale * 0.6, duration: 180,
        onComplete: () => { s.destroy(); halo.destroy(); }
      });
    };
    const life = this.time.delayedCall(1250, kill);

    s.on('pointerdown', () => {
      if (!s.active || this.done) return;
      life.remove();
      this.score += s.points;
      this.scoreText.setText(this.score + ' / ' + TARGET_SCORE);
      AudioManager.sfx('pop');
      this.pop(s.x, s.y, s.points);
      s.destroy(); halo.destroy();
    });
  }

  pop(x, y, points) {
    const t = this.add.text(x, y, '+' + points, {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '22px', color: '#e6c976'
    }).setOrigin(0.5).setShadow(0, 2, '#000', 5);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 620, onComplete: () => t.destroy() });

    const burst = this.add.particles(x, y, 'fx_dot', {
      speed: { min: 60, max: 180 }, lifespan: 420, quantity: 8,
      scale: { start: 1.1, end: 0 }, tint: 0xffd08a,
      blendMode: 'ADD', emitting: false
    });
    burst.explode(8);
    this.time.delayedCall(600, () => burst.destroy());
  }

  finish() {
    this.done = true;
    const win = this.score >= TARGET_SCORE;

    this.targets = [];
    this.tweens.killAll();

    const W = this.scale.gameSize.width, H = this.scale.gameSize.height;
    const msg = this.add.text(W / 2, H / 2, 'BIRTHDAY COMBO\nUNLOCKED',
      {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: Math.round(Math.min(W, H) * 0.075) + 'px',
        color: '#e6c976', align: 'center', lineSpacing: 8
      }).setOrigin(0.5).setAlpha(0).setShadow(0, 3, '#000', 12);

    const sub = this.add.text(W / 2, H / 2 + Math.min(W, H) * 0.12,
      `${this.score} puntos`, {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: Math.round(Math.min(W, H) * 0.05) + 'px',
        color: '#a99f90', fontStyle: 'italic'
      }).setOrigin(0.5).setAlpha(0);

    AudioManager.sfx('quest');
    this.tweens.add({ targets: [msg, sub], alpha: 1, duration: 600 });

    State.data.stats.rushScore = Math.max(State.data.stats.rushScore || 0, this.score);
    State.completeObjective('q2_whispers', 'birthday_rush');
    State.saveNow();

    this.time.delayedCall(1900, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('World', this.back);
        // el comentario de Damon llega una vez ya estas de vuelta en el Grill
        setTimeout(() => Dialogue.start(win ? 'damon_rush_win' : 'damon_rush_meh'), 900);
      });
    });
  }
}
