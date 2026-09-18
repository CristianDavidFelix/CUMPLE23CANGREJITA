/* =====================================================================
   Player
   Movimiento en 8 direcciones con fisicas Arcade.
   El sprite mira a 4 lados (arriba/abajo/izq/der): es lo estandar en los
   RPG 2D y evita necesitar 8 juegos de animaciones.
   ===================================================================== */

import { CONFIG } from '../config.js';
import { PLAYER } from '../data/playerConfig.js';
import { buildCharacterSheet } from '../systems/TextureFactory.js';
import { AudioManager } from '../systems/AudioManager.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    buildCharacterSheet(scene, 'char_player', PLAYER.PLAYER_AVATAR);
    super(scene, x, y, 'char_player', 'down0');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.85);          // los pies marcan la posicion real
    this.body.setSize(10, 8);
    this.body.setOffset(3, 14);
    this.setCollideWorldBounds(true);

    this.facing = 'down';
    this.moving = false;
    this._stepTimer = 0;

    /* sombra: un sprite suelto que sigue a la jugadora */
    this.shadow = scene.add.image(x, y, 'fx_shadow').setDepth(1).setAlpha(0.55);

    Player.createAnims(scene, 'char_player');
    this.play('player_idle_down');
  }

  static createAnims(scene, key) {
    const dirs = ['down', 'left', 'right', 'up'];
    for (const d of dirs) {
      const walk = `player_walk_${d}`;
      if (!scene.anims.exists(walk)) {
        scene.anims.create({
          key: walk,
          frames: [0, 1, 2, 3].map(i => ({ key, frame: `${d}${i}` })),
          frameRate: 8,
          repeat: -1
        });
      }
      const idle = `player_idle_${d}`;
      if (!scene.anims.exists(idle)) {
        scene.anims.create({ key: idle, frames: [{ key, frame: `${d}0` }], frameRate: 1 });
      }
    }
  }

  update(vec, dt) {
    const speed = CONFIG.PLAYER_SPEED;
    const vx = vec.x * speed;
    const vy = vec.y * speed;
    this.setVelocity(vx, vy);

    const moving = Math.abs(vec.x) > 0.06 || Math.abs(vec.y) > 0.06;

    if (moving) {
      // la direccion dominante decide a donde mira
      if (Math.abs(vec.x) > Math.abs(vec.y)) this.facing = vec.x < 0 ? 'left' : 'right';
      else this.facing = vec.y < 0 ? 'up' : 'down';

      const anim = `player_walk_${this.facing}`;
      if (this.anims.currentAnim?.key !== anim) this.play(anim);

      this._stepTimer -= dt;
      if (this._stepTimer <= 0) { AudioManager.sfx('step'); this._stepTimer = 330; }
    } else if (this.moving) {
      this.play(`player_idle_${this.facing}`);
    }

    this.moving = moving;
    this.setDepth(this.y);
    this.shadow.setPosition(this.x, this.y + 2);
    this.shadow.setDepth(this.y - 1);
  }

  destroy(fromScene) {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
