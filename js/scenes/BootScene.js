/* =====================================================================
   BootScene
   Prepara las texturas de efectos y avisa de que el juego esta listo.
   No carga ningun archivo: todo el arte se genera en el momento, asi que
   esto tarda milisegundos incluso en un telefono modesto.
   ===================================================================== */

import { buildFxTextures } from '../systems/TextureFactory.js';
import { validateMaps } from '../data/maps.js';
import { detectPerformance } from '../config.js';
import { bus } from '../systems/EventBus.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const level = detectPerformance();
    console.log('[boot] modo de rendimiento:', level);

    validateMaps();        // avisa por consola si algun mapa esta mal escrito
    buildFxTextures(this);

    bus.emit('boot:ready');
    this.scene.start('Menu');
  }
}
