/* =====================================================================
   NPC
   Personaje con el que se habla. No camina: respira, mira a la jugadora
   cuando se acerca y abre el dialogo que le toque segun el progreso.
   ===================================================================== */

import { CONFIG } from '../config.js';
import { buildCharacterSheet, CHAR_PALETTES } from '../systems/TextureFactory.js';
import { NPC_ENTRY } from '../data/dialogues.js';
import { Dialogue } from '../systems/DialogueSystem.js';
import { State } from '../systems/GameState.js';
import { AudioManager } from '../systems/AudioManager.js';

const T = CONFIG.TILE;

export class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, data) {
    const key = 'char_' + data.id;
    buildCharacterSheet(scene, key, CHAR_PALETTES[data.id] || CHAR_PALETTES.stefan);
    super(scene, data.x * T + T / 2, data.y * T + T, key, (data.dir || 'down') + '0');

    scene.add.existing(this);
    scene.physics.add.existing(this, true);   // estatico: no lo empujas

    this.npcId = data.id;
    this.npcName = data.name || data.id;
    this.baseDir = data.dir || 'down';
    this.facing = this.baseDir;

    this.setOrigin(0.5, 0.85);
    this.body.setSize(12, 10);
    this.body.setOffset(2, 12);
    this.setDepth(this.y);

    this.shadow = scene.add.image(this.x, this.y + 2, 'fx_shadow')
      .setDepth(this.y - 1).setAlpha(0.5);

    /* respiracion: un latido lentisimo, suficiente para que no parezca
       una estatua y practicamente gratis en rendimiento */
    scene.tweens.add({
      targets: this,
      scaleY: { from: 1, to: 1.025 },
      duration: 1900,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  /* Gira hacia la jugadora cuando esta cerca */
  lookAt(player) {
    const dx = player.x - this.x, dy = player.y - this.y;
    if (Math.hypot(dx, dy) > 64) {
      if (this.facing !== this.baseDir) { this.facing = this.baseDir; this.setFrame(this.baseDir + '0'); }
      return;
    }
    const dir = Math.abs(dx) > Math.abs(dy)
      ? (dx < 0 ? 'left' : 'right')
      : (dy < 0 ? 'up' : 'down');
    if (dir !== this.facing) { this.facing = dir; this.setFrame(dir + '0'); }
  }

  get label() { return 'Hablar con ' + this.npcName; }

  interact() {
    AudioManager.sfx('select');
    const entry = NPC_ENTRY[this.npcId];
    const node = typeof entry === 'function' ? entry(State.api) : entry;
    if (node) Dialogue.start(node);
    else console.warn('[npc] sin dialogo:', this.npcId);
  }

  destroy(fromScene) {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
