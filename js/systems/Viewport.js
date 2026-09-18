/* =====================================================================
   Viewport
   Calcula el zoom de camara para cada pantalla.

   Reglas, en orden de prioridad:
   1. Nunca dejar franjas negras: el mapa tiene que cubrir la pantalla.
   2. Que se vean unos 11 tiles en el lado corto (sensacion de RPG intimo).
   3. Zoom en pasos de 0.5 para que el pixel art no baile.

   Esto hace que funcione igual en un iPhone vertical, un iPad y un
   monitor, sin deformar nunca los sprites (la relacion de aspecto del
   sprite no se toca jamas; solo cambia cuanto mundo se ve).
   ===================================================================== */

import { CONFIG } from '../config.js';

export const Viewport = {
  /* Zoom ideal para un mapa concreto en el tamano actual de pantalla */
  computeZoom(scene, mapW, mapH) {
    const w = scene.scale.gameSize.width;
    const h = scene.scale.gameSize.height;
    const T = CONFIG.TILE;

    const short = Math.min(w, h);
    const taste = short / (CONFIG.TARGET_TILES * T);         // regla 2
    const cover = Math.max(w / (mapW * T), h / (mapH * T));  // regla 1

    let z = Math.max(taste, cover);
    z = Math.ceil(z * 2) / 2;                                 // regla 3
    return Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, z));
  },

  /* Aplica zoom + limites y engancha la camara al jugador */
  apply(scene, mapW, mapH, target) {
    const T = CONFIG.TILE;
    const cam = scene.cameras.main;
    const z = this.computeZoom(scene, mapW, mapH);

    cam.setZoom(z);
    cam.setBounds(0, 0, mapW * T, mapH * T);
    cam.roundPixels = true;
    if (target) cam.startFollow(target, true, 0.12, 0.12);
    return z;
  },

  /* Se llama al girar el telefono o redimensionar la ventana */
  onResize(scene, mapW, mapH) {
    const cam = scene.cameras.main;
    cam.setZoom(this.computeZoom(scene, mapW, mapH));
  }
};
