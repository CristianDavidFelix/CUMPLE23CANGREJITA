/* =====================================================================
   FinaleScene
   Solo el lienzo negro con brasas flotando por detras del texto.
   La secuencia (el 23, la felicitacion y la carta) la lleva
   systems/Finale.js sobre el DOM.
   ===================================================================== */

import { Finale } from '../systems/Finale.js';
import { HUD } from '../systems/HUD.js';
import { MobileControls } from '../systems/MobileControls.js';
import { bus } from '../systems/EventBus.js';

export class FinaleScene extends Phaser.Scene {
  constructor() { super('Finale'); }

  init(data) {
    this.back = data?.back || { mapId: 'boarding', marker: 'from_town' };
  }

  create() {
    const W = this.scale.gameSize.width;
    const H = this.scale.gameSize.height;

    HUD.hide();
    MobileControls.hide();

    this.cameras.main.setZoom(1);
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setBackgroundColor('#000000');

    /* brasas subiendo, muy despacio: da profundidad al negro */
    this.add.particles(0, 0, 'fx_dot', {
      x: { min: 0, max: W },
      y: H + 10,
      lifespan: { min: 6000, max: 11000 },
      speedY: { min: -18, max: -6 },
      speedX: { min: -6, max: 6 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.55, end: 0 },
      tint: [0xffb347, 0xffd08a, 0xc0392f],
      blendMode: 'ADD',
      frequency: 420,
      maxAliveParticles: 22
    });

    /* resplandor calido abajo, como el pastel fuera de plano */
    this.add.image(W / 2, H * 1.02, 'fx_glow')
      .setDisplaySize(W * 1.4, H * 0.7)
      .setTint(0xff9a4a).setAlpha(0.14)
      .setBlendMode(Phaser.BlendModes.ADD);

    Finale.run();

    /* al cerrar la carta, volvemos a la casa de los Salvatore */
    this._off = bus.once('finale:done', () => {
      this.scene.start('World', this.back);
    });
  }
}
