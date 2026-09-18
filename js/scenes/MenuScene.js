/* =====================================================================
   MenuScene
   Solo el fondo: cielo nocturno, luna, niebla y la silueta del pueblo.
   Los botones del menu son DOM (#menu en index.html), porque el texto se
   ve mucho mejor y se adapta solo al telefono.
   ===================================================================== */

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const W = this.scale.gameSize.width;
    const H = this.scale.gameSize.height;
    this.cameras.main.setZoom(1);
    this.cameras.main.setScroll(0, 0);

    /* cielo */
    const g = this.add.graphics();
    g.fillGradientStyle(0x0a0d18, 0x0a0d18, 0x1a1428, 0x241a2e, 1);
    g.fillRect(0, 0, W, H);

    /* estrellas */
    this.stars = [];
    const n = Math.min(70, Math.round((W * H) / 14000));
    for (let i = 0; i < n; i++) {
      const s = this.add.image(Math.random() * W, Math.random() * H * 0.62, 'fx_dot')
        .setScale(0.4 + Math.random() * 0.5)
        .setAlpha(0.2 + Math.random() * 0.6)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: s,
        alpha: { from: s.alpha, to: s.alpha * 0.25 },
        duration: 1200 + Math.random() * 2600,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
      this.stars.push(s);
    }

    /* luna */
    const mx = W * 0.76, my = H * 0.2;
    this.add.image(mx, my, 'fx_glow')
      .setDisplaySize(H * 0.55, H * 0.55)
      .setTint(0xdfd0a8).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD);
    const moon = this.add.circle(mx, my, Math.max(18, H * 0.045), 0xf2e8c8);
    this.add.circle(mx + moon.radius * 0.35, my - moon.radius * 0.25,
      moon.radius * 0.8, 0x1a1428).setAlpha(0.22);

    /* silueta del bosque y los tejados */
    const sil = this.add.graphics();
    sil.fillStyle(0x070810, 1);
    const baseY = H * 0.76;
    sil.fillRect(0, baseY + H * 0.1, W, H);
    for (let x = -20; x < W + 40; x += 26) {
      const h = 40 + Math.random() * 90;
      sil.fillTriangle(x, baseY + H * 0.1, x + 13, baseY + H * 0.1 - h, x + 26, baseY + H * 0.1);
    }
    // un par de tejados con ventana encendida
    for (const [px, pw, ph] of [[W * 0.14, 90, 70], [W * 0.42, 70, 54]]) {
      sil.fillRect(px, baseY + H * 0.1 - ph, pw, ph);
      sil.fillTriangle(px - 8, baseY + H * 0.1 - ph, px + pw / 2, baseY + H * 0.1 - ph - 26, px + pw + 8, baseY + H * 0.1 - ph);
      const win = this.add.rectangle(px + pw * 0.5, baseY + H * 0.1 - ph * 0.55, 10, 12, 0xffca6a).setAlpha(0.85);
      this.add.image(win.x, win.y, 'fx_glow').setDisplaySize(90, 90)
        .setTint(0xffca6a).setAlpha(0.22).setBlendMode(Phaser.BlendModes.ADD);
    }

    /* niebla baja */
    this.fog = this.add.tileSprite(0, H * 0.55, W, H * 0.5, 'fx_fog')
      .setOrigin(0, 0).setAlpha(0.42);
    this.fog2 = this.add.tileSprite(0, H * 0.68, W, H * 0.4, 'fx_fog')
      .setOrigin(0, 0).setAlpha(0.3);

    this.scale.on('resize', this.handleResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.handleResize, this));
  }

  handleResize() {
    // en el menu basta con volver a montarlo: es barato
    this.scene.restart();
  }

  update(time, dt) {
    if (this.fog) {
      this.fog.tilePositionX += 0.012 * dt;
      this.fog2.tilePositionX -= 0.007 * dt;
    }
  }
}
