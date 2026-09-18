/* =====================================================================
   main.js  --  punto de entrada

   Aqui se monta Phaser, se enchufa la interfaz del DOM y se conectan los
   eventos entre las dos mitades del juego (canvas y HTML).

   Orden de arranque:
     pantalla de carga -> Boot -> "toca para empezar" (desbloquea el audio)
     -> menu -> intro -> mundo
   ===================================================================== */

import { CONFIG, IS_TOUCH } from './config.js';
import { bus } from './systems/EventBus.js';
import { State } from './systems/GameState.js';
import { SaveManager } from './systems/SaveManager.js';
import { AudioManager } from './systems/AudioManager.js';
import { HUD } from './systems/HUD.js';
import { Journal } from './systems/JournalUI.js';
import { Dialogue } from './systems/DialogueSystem.js';
import { MobileControls } from './systems/MobileControls.js';
import { Input } from './systems/InputManager.js';
import { Debug } from './systems/DebugMode.js';
import { Intro } from './systems/Intro.js';
import { Finale } from './systems/Finale.js';

import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { MinigameScene } from './scenes/MinigameScene.js';
import { FinaleScene } from './scenes/FinaleScene.js';

/* ---------------------------------------------------------------------
   1. Referencias del DOM
   --------------------------------------------------------------------- */
const $ = id => document.getElementById(id);
const els = {
  loading: $('loading'), loadingFill: $('loading-fill'), loadingText: $('loading-text'),
  tapStart: $('tap-start'),
  menu: $('menu'), menuSub: $('menu-sub'), menuActions: document.querySelector('.menu-actions'),
  btnContinue: $('btn-continue'), btnNew: $('btn-new'), btnResume: $('btn-resume'),
  btnReset: $('btn-reset'), btnMusic: $('btn-music'), btnSfx: $('btn-sfx'),
  btnPause: $('btn-pause')
};

let game = null;
let inGame = false;         // true cuando la partida esta en marcha
let menuOpen = true;
let menuOpenedAt = 0;       // para ignorar el 'toque fantasma' al abrir el menu
const menuArmed = () => performance.now() - menuOpenedAt > 450;

/* ---------------------------------------------------------------------
   2. Configuracion de Phaser

   - scale RESIZE: el lienzo ocupa exactamente la pantalla, sin franjas.
     El "zoom" del mundo lo calcula systems/Viewport.js segun el mapa.
   - pixelArt + roundPixels: el pixel art se mantiene nitido y no vibra.
   - antialias off: mas rapido y mas fiel al estilo.
   --------------------------------------------------------------------- */
const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#07080d',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  powerPreference: 'low-power',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: '100%',
    height: '100%'
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false }
  },
  fps: { target: 60, forceSetTimeOut: false },
  scene: [BootScene, MenuScene, WorldScene, MinigameScene, FinaleScene]
};

/* ---------------------------------------------------------------------
   3. Cambio de escena desde fuera de Phaser
   --------------------------------------------------------------------- */
function gotoScene(key, data) {
  for (const s of ['Menu', 'World', 'Minigame', 'Finale']) {
    if (s !== key && game.scene.isActive(s)) game.scene.stop(s);
  }
  game.scene.start(key, data);
}

function world() {
  const s = game?.scene.getScene('World');
  return s && game.scene.isActive('World') ? s : null;
}

/* ---------------------------------------------------------------------
   4. Menu
   --------------------------------------------------------------------- */
function openMenu(paused) {
  menuOpen = true;
  menuOpenedAt = performance.now();
  State.blocked = true;
  els.menu.classList.remove('hidden');

  els.btnResume.classList.toggle('hidden', !paused);
  els.btnContinue.classList.toggle('hidden', paused || !SaveManager.has());
  els.btnReset.classList.toggle('hidden', !SaveManager.has());
  els.btnNew.textContent = paused ? 'Empezar de nuevo' : 'Nueva historia';

  /* si ya termino el juego, deja volver a leer la carta */
  let again = $('btn-letter-again');
  if (State.flag('letter_read')) {
    if (!again) {
      again = document.createElement('button');
      again.id = 'btn-letter-again';
      again.className = 'menu-btn';
      again.textContent = 'Leer la carta otra vez';
      again.onclick = () => { els.menu.classList.add('hidden'); Finale.openLetterDirect(); };
      els.menuActions.appendChild(again);
    }
    again.classList.remove('hidden');
  } else if (again) again.classList.add('hidden');

  els.menuSub.textContent = paused
    ? 'La historia te espera donde la dejaste'
    : 'Una historia de cumpleaños';

  if (paused) world()?.snapshot();
  AudioManager.play('menu');
}

function closeMenu() {
  menuOpen = false;
  els.menu.classList.add('hidden');
  State.blocked = false;
}

function enterWorld(mapId, marker, pos) {
  closeMenu();
  inGame = true;
  Input.clear();
  gotoScene('World', { mapId, marker, pos });
}

function startNewGame() {
  State.newGame();
  closeMenu();
  inGame = true;
  gotoScene('Menu');                  // fondo bonito detras de la intro
  Intro.run(() => enterWorld(CONFIG.START_MAP || 'town', 'start'));
}

function continueGame() {
  if (!State.loadSaved()) { startNewGame(); return; }
  const d = State.data;
  enterWorld(d.map || 'town', d.marker || 'start', d.pos || null);
}

/* ---------------------------------------------------------------------
   5. Enchufado de la interfaz
   --------------------------------------------------------------------- */
function wireUI() {
  els.btnNew.addEventListener('click', () => {
    if (!menuArmed()) return;
    if (SaveManager.has() && !confirm('Esto borra el progreso actual. ¿Empezar de nuevo?')) return;
    AudioManager.sfx('select');
    startNewGame();
  });

  els.btnContinue.addEventListener('click', () => {
    if (!menuArmed()) return;
    AudioManager.sfx('select');
    continueGame();
  });

  els.btnResume.addEventListener('click', () => {
    if (!menuArmed()) return;
    AudioManager.sfx('select');
    closeMenu();
    const w = world();
    if (w) AudioManager.play(w.map.music);
    else continueGame();
  });

  els.btnReset.addEventListener('click', () => {
    if (!menuArmed()) return;
    if (!confirm('¿Borrar todo el progreso guardado?')) return;
    State.wipe();
    inGame = false;
    location.reload();
  });

  els.btnMusic.addEventListener('click', () => {
    const on = AudioManager.toggleMusic();
    els.btnMusic.setAttribute('aria-pressed', String(on));
    els.btnMusic.textContent = on ? '♪ Música: sí' : '♪ Música: no';
    if (on) AudioManager.play(menuOpen ? 'menu' : (world()?.map.music || 'town'));
  });

  els.btnSfx.addEventListener('click', () => {
    const on = AudioManager.toggleSfx();
    els.btnSfx.setAttribute('aria-pressed', String(on));
    els.btnSfx.textContent = on ? '◆ Sonido: sí' : '◆ Sonido: no';
  });

  els.btnPause.addEventListener('click', () => {
    AudioManager.sfx('select');
    if (menuOpen) closeMenu(); else openMenu(true);
  });

  /* atajos de teclado (opcionales, el juego se puede jugar sin teclado) */
  bus.on('input:menu', () => {
    if (Dialogue.active || Journal.isOpen) return;
    if (!inGame) return;
    menuOpen ? closeMenu() : openMenu(true);
  });

  bus.on('input:journal', () => {
    if (!inGame || menuOpen || Dialogue.active) return;
    Journal.toggle();
  });

  /* eventos del juego */
  bus.on('minigame:start', () => {
    const w = world();
    w?.snapshot();
    gotoScene('Minigame', { back: { mapId: 'grill', marker: 'from_town' } });
  });

  bus.on('finale:start', () => {
    const w = world();
    w?.snapshot();
    setTimeout(() => gotoScene('Finale', { back: { mapId: 'boarding', marker: 'from_town' } }), 400);
  });

  bus.on('place:first', () => AudioManager.resume());
}

/* ---------------------------------------------------------------------
   6. Detalles de navegador movil
   --------------------------------------------------------------------- */
function hardenMobile() {
  // nada de zoom por doble toque ni por pinza
  document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
  document.addEventListener('contextmenu', e => e.preventDefault());

  // evita el "pull to refresh" y el rebote de iOS en el area de juego
  document.addEventListener('touchmove', e => {
    if (e.target.closest('#journal-content, #letter')) return;   // ahi si queremos scroll
    e.preventDefault();
  }, { passive: false });

  // al volver a la pestana, reanuda el audio
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      world()?.snapshot();
    } else {
      AudioManager.resume();
    }
  });

  // guarda antes de cerrar
  window.addEventListener('pagehide', () => world()?.snapshot());

  // el teclado del navegador nunca debe robar el foco
  window.addEventListener('focus', () => AudioManager.resume());
}

/* ---------------------------------------------------------------------
   7. Arranque
   --------------------------------------------------------------------- */
function fakeLoading() {
  let p = 0;
  const t = setInterval(() => {
    p = Math.min(96, p + 8 + Math.random() * 14);
    els.loadingFill.style.width = p + '%';
    if (p >= 96) clearInterval(t);
  }, 90);
  return t;
}

function boot() {
  SaveManager.check();
  State.loadSaved();          // para que el menu sepa que ofrecer
  const loadTimer = fakeLoading();

  HUD.init();
  Journal.init();
  MobileControls.init();
  Input.init();
  Finale.init();
  wireUI();
  hardenMobile();

  game = new Phaser.Game(phaserConfig);
  Debug.init(game);

  /* Ganchos para depurar desde la consola del navegador.
     Por ejemplo:  __mf.State.unlockMemory('mem_falls')  */
  window.__game = game;
  window.__mf = { State, bus, Dialogue, Journal, Finale, Intro, AudioManager,
                  enterWorld, startNewGame, openMenu, closeMenu };

  /* el menu no se ve hasta que el jugador toque la pantalla:
     asi podemos arrancar el audio con permiso del navegador */
  els.menu.classList.add('hidden');

  bus.once('boot:ready', () => {
    clearInterval(loadTimer);
    els.loadingFill.style.width = '100%';
    els.loadingText.textContent = 'Listo';

    setTimeout(() => {
      els.loading.classList.add('done');
      setTimeout(() => els.loading.classList.add('hidden'), 700);
      els.tapStart.classList.remove('hidden');
    }, 420);
  });

  /* primer toque: desbloquea el audio y abre el menu.
     Se usa 'click' (y no 'pointerdown') a proposito: asi el toque termina
     aqui y no "atraviesa" hasta el boton del menu que queda debajo. */
  const firstTouch = () => {
    els.tapStart.classList.add('hidden');
    AudioManager.unlock();
    AudioManager.play('menu');
    openMenu(false);
    els.tapStart.removeEventListener('click', firstTouch);
  };
  els.tapStart.addEventListener('click', firstTouch);

  /* en escritorio, ademas del joystick, se puede jugar con teclado */
  if (!IS_TOUCH) console.log('[input] teclado: WASD/flechas, E interactuar, J diario, Esc menu');
  if (CONFIG.DEBUG) console.log('[debug] activo. Tecla 0 para abrir/cerrar el panel.');
}

/* Si algo falla, que al menos se vea el motivo en pantalla */
window.addEventListener('error', e => {
  console.error(e.error || e.message);
  if (els.loadingText && !els.loading.classList.contains('hidden')) {
    els.loadingText.textContent = 'Error: ' + (e.message || 'revisa la consola');
  }
});

boot();
