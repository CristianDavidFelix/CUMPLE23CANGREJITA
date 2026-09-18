/* =====================================================================
   CONFIG TECNICA
   Constantes del motor. Rara vez necesitas tocar esto.
   ===================================================================== */

const params = new URLSearchParams(location.search);

export const CONFIG = {
  /* --- Mundo --- */
  TILE: 16,                   // tamano de tile en pixeles
  PLAYER_SPEED: 78,           // px/segundo
  INTERACT_RADIUS: 30,        // distancia para poder interactuar (px de mundo)

  /* --- Camara / escalado ---
     El zoom se calcula en Viewport.js: se busca que en el lado corto de la
     pantalla se vean ~TARGET_TILES tiles, sin dejar franjas negras. */
  TARGET_TILES: 11,
  MIN_ZOOM: 1.5,
  MAX_ZOOM: 4.5,

  /* --- Guardado --- */
  SAVE_KEY: 'mystic_falls_birthday_v1',
  AUTOSAVE_MS: 4000,          // guarda como mucho una vez cada 4s

  /* --- Debug ---
     Actívalo con  ?debug=1  al final de la URL, o pulsando la tecla 0. */
  DEBUG: params.has('debug') && params.get('debug') !== '0',

  /* --- Rendimiento ---
     Se rebaja solo en telefonos modestos (ver detectPerformance). */
  FX: {
    fireflies: 18,            // maximo de luciernagas
    fogLayers: 2,
    glows: true,
    dust: true
  },

  /* --- Audio --- */
  AUDIO: {
    musicVolume: 0.42,
    sfxVolume: 0.5,
    fadeMs: 900
  },

  /* Empezar directamente en un mapa concreto: ?map=grill */
  START_MAP: params.get('map') || null
};

/* ---------------------------------------------------------------------
   Deteccion muy simple de dispositivo modesto.
   Menos nucleos / poca memoria  ->  menos particulas y menos capas.
   --------------------------------------------------------------------- */
export function detectPerformance() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const low = cores <= 4 || mem <= 3;
  if (low) {
    CONFIG.FX.fireflies = 8;
    CONFIG.FX.fogLayers = 1;
    CONFIG.FX.dust = false;
  }
  return low ? 'low' : 'normal';
}

export const IS_TOUCH = matchMedia('(pointer: coarse)').matches ||
  'ontouchstart' in window || navigator.maxTouchPoints > 0;
