/* =====================================================================
   AudioManager

   Dos modos, y cambia solo:

   1) SI EXISTE EL ARCHIVO  ->  reproduce assets/audio/<id>.mp3 en bucle.
      Si quieres poner musica de la serie, copia los mp3 con estos nombres:
         menu.mp3  town.mp3  boarding.mp3  grill.mp3
         school.mp3  cemetery.mp3  woods.mp3  finale.mp3

   2) SI NO EXISTE  ->  genera musica ambiental por codigo (Web Audio).
      Cada lugar tiene su escala, su tempo y su timbre, asi que el juego
      suena distinto en cada sitio aunque no pongas ningun archivo.

   Los efectos de sonido siempre son sintetizados: pesan 0 bytes.
   ===================================================================== */

import { CONFIG } from '../config.js';

/* Notas (Hz). Trabajamos con nombres para que las escalas se lean bien. */
const N = {
  C2: 65.41, D2: 73.42, Eb2: 77.78, E2: 82.41, F2: 87.31, G2: 98.00, Ab2: 103.83, A2: 110.00, Bb2: 116.54,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16,
  C5: 523.25, D5: 587.33, Eb5: 622.25, F5: 698.46, G5: 783.99, A5: 880.00
};

/* Definicion de cada tema generativo */
const TRACKS = {
  menu: {
    beat: 2100, wave: 'sine', filter: 1400, gain: 0.30,
    bass: [N.A2, N.F2, N.C3, N.G2],
    scale: [N.A4, N.C5, N.E4, N.G4, N.A4, N.D5, N.C5, N.E4]
  },
  town: {
    beat: 1500, wave: 'triangle', filter: 1800, gain: 0.26,
    bass: [N.D2, N.A2, N.Bb2, N.F2],
    scale: [N.D4, N.F4, N.A4, N.C5, N.D5, N.A4, N.F4, N.G4]
  },
  boarding: {
    beat: 1750, wave: 'sawtooth', filter: 760, gain: 0.22,
    bass: [N.C2, N.Ab2, N.F2, N.G2],
    scale: [N.C4, N.Eb4, N.G4, N.Bb4, N.C5, N.G4, N.Eb4, N.F4]
  },
  grill: {
    beat: 820, wave: 'square', filter: 2200, gain: 0.16,
    bass: [N.E2, N.E2, N.A2, N.Bb2],
    scale: [N.E4, N.G4, N.A4, N.C5, N.D5, N.E4, N.A4, N.G4]
  },
  school: {
    beat: 1950, wave: 'sine', filter: 1100, gain: 0.22,
    bass: [N.F2, N.C3, N.D2, N.Bb2],
    scale: [N.F4, N.A4, N.C5, N.F5, N.C5, N.A4, N.G4, N.D4]
  },
  cemetery: {
    beat: 2500, wave: 'sine', filter: 900, gain: 0.26,
    bass: [N.A2, N.A2, N.F2, N.E2],
    scale: [N.A4, N.C5, N.E4, N.A4, N.G4, N.E4, N.D4, N.C5]
  },
  woods: {
    beat: 1400, wave: 'triangle', filter: 1250, gain: 0.24,
    bass: [N.E2, N.C3, N.D2, N.G2],
    scale: [N.E4, N.G4, N.Bb4, N.D5, N.E4, N.A4, N.G4, N.C5]
  },
  finale: {
    beat: 1650, wave: 'triangle', filter: 2000, gain: 0.34,
    bass: [N.F2, N.C3, N.G2, N.Ab2],
    scale: [N.F4, N.A4, N.C5, N.F5, N.G4, N.C5, N.A4, N.D5]
  }
};

class AudioManagerClass {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.musicOn = true;
    this.sfxOn = true;

    this.current = null;      // id del tema sonando
    this._timer = null;       // temporizador del generador
    this._nodes = [];         // nodos vivos del tema actual
    this._fileEl = null;      // <audio> si hay mp3
    this._step = 0;
    this._fileCache = {};     // id -> true/false (existe el mp3?)
  }

  /* Se llama en el primer toque del usuario: los navegadores lo exigen */
  unlock() {
    if (this.ready) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();

      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = CONFIG.AUDIO.musicVolume;

      // un eco corto da sensacion de sala grande sin coste real
      this.delay = this.ctx.createDelay(1.2);
      this.delay.delayTime.value = 0.42;
      this.feedback = this.ctx.createGain();
      this.feedback.gain.value = 0.32;
      this.wet = this.ctx.createGain();
      this.wet.gain.value = 0.35;

      this.musicGain.connect(this.master);
      this.musicGain.connect(this.delay);
      this.delay.connect(this.feedback);
      this.feedback.connect(this.delay);
      this.delay.connect(this.wet);
      this.wet.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = CONFIG.AUDIO.sfxVolume;
      this.sfxGain.connect(this.master);

      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.ready = true;
      return true;
    } catch (e) {
      console.warn('[audio] no disponible', e);
      return false;
    }
  }

  resume() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }

  /* ---------------- musica ---------------- */

  play(id) {
    if (!TRACKS[id]) id = 'town';
    if (this.current === id) return;
    this.stopMusic();
    this.current = id;
    if (!this.musicOn || !this.ready) return;

    // 1) intenta el mp3
    this._tryFile(id, ok => {
      if (!ok && this.current === id) this._startGenerative(id);
    });
  }

  _tryFile(id, cb) {
    if (this._fileCache[id] === false) return cb(false);

    const el = new Audio(`./assets/audio/${id}.mp3`);
    el.loop = true;
    el.volume = 0;
    el.preload = 'auto';

    const fail = () => { this._fileCache[id] = false; cb(false); };
    const ok = () => {
      if (this.current !== id) { el.pause(); return; }
      this._fileCache[id] = true;
      this._fileEl = el;
      el.play().then(() => this._fadeEl(el, CONFIG.AUDIO.musicVolume)).catch(fail);
      cb(true);
    };

    el.addEventListener('canplaythrough', ok, { once: true });
    el.addEventListener('error', fail, { once: true });
    // si en 2.5s no dijo nada, damos por hecho que no esta
    setTimeout(() => { if (this._fileCache[id] === undefined) fail(); }, 2500);
  }

  _fadeEl(el, to, ms = CONFIG.AUDIO.fadeMs) {
    const from = el.volume, t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      el.volume = from + (to - from) * k;
      if (k < 1 && !el.paused) requestAnimationFrame(step);
      else if (to === 0) el.pause();
    };
    step();
  }

  /* Generador: un bajo largo + notas sueltas de la escala */
  _startGenerative(id) {
    const t = TRACKS[id];
    this._step = 0;
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(
      CONFIG.AUDIO.musicVolume, this.ctx.currentTime + CONFIG.AUDIO.fadeMs / 1000);

    const tick = () => {
      if (!this.musicOn || this.current !== id) return;
      const s = this._step++;

      // bajo cada 4 tiempos
      if (s % 4 === 0) {
        const f = t.bass[(s / 4) % t.bass.length];
        this._note(f, t.beat * 4 / 1000, 'sine', t.gain * 0.8, t.filter * 0.6);
        this._note(f * 1.5, t.beat * 3.4 / 1000, 'sine', t.gain * 0.3, t.filter * 0.6);
      }

      // melodia: no toca en todos los tiempos, respira
      if (s % 2 === 0 || Math.random() < 0.45) {
        const f = t.scale[(s * 3 + ((Math.random() * 3) | 0)) % t.scale.length];
        this._note(f, t.beat * 1.6 / 1000, t.wave, t.gain * 0.5, t.filter);
        if (Math.random() < 0.22) {
          setTimeout(() => this._note(f * 2, t.beat / 1000, t.wave, t.gain * 0.2, t.filter), t.beat * 0.5);
        }
      }

      this._timer = setTimeout(tick, t.beat);
    };
    tick();
  }

  _note(freq, dur, wave, gain, cutoff) {
    if (!this.ready) return;
    const ctx = this.ctx, t0 = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = freq;

    const flt = ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = cutoff;
    flt.Q.value = 0.8;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + dur * 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(flt); flt.connect(g); g.connect(this.musicGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    osc.onended = () => { try { g.disconnect(); flt.disconnect(); } catch {} };
  }

  stopMusic() {
    clearTimeout(this._timer);
    this._timer = null;
    if (this._fileEl) { this._fadeEl(this._fileEl, 0, 400); this._fileEl = null; }
    if (this.ready) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
    }
    this.current = null;
  }

  toggleMusic(on) {
    this.musicOn = on ?? !this.musicOn;
    if (!this.musicOn) {
      const c = this.current;
      this.stopMusic();
      this._pending = c;
    } else if (this._pending) {
      const c = this._pending; this._pending = null; this.play(c);
    }
    return this.musicOn;
  }

  toggleSfx(on) {
    this.sfxOn = on ?? !this.sfxOn;
    if (this.ready) this.sfxGain.gain.value = this.sfxOn ? CONFIG.AUDIO.sfxVolume : 0;
    return this.sfxOn;
  }

  /* ---------------- efectos ---------------- */

  sfx(name) {
    if (!this.ready || !this.sfxOn) return;
    const ctx = this.ctx, t0 = ctx.currentTime;

    const beep = (f1, f2, dur, wave = 'triangle', vol = 0.3) => {
      const osc = ctx.createOscillator();
      osc.type = wave;
      osc.frequency.setValueAtTime(f1, t0);
      if (f2 !== f1) osc.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    };

    const noise = (dur, vol = 0.12, cutoff = 1200) => {
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = cutoff;
      const g = ctx.createGain(); g.gain.value = vol;
      src.connect(flt); flt.connect(g); g.connect(this.sfxGain);
      src.start(t0);
    };

    switch (name) {
      case 'step':     noise(0.06, 0.05, 700); break;
      case 'select':   beep(520, 700, 0.09, 'triangle', 0.22); break;
      case 'cancel':   beep(420, 240, 0.12, 'triangle', 0.2); break;
      case 'talk':     beep(660, 660, 0.03, 'square', 0.055); break;
      case 'door':     noise(0.22, 0.16, 500); beep(180, 120, 0.25, 'sine', 0.18); break;
      case 'unlock':   beep(523, 784, 0.16, 'triangle', 0.26);
                       setTimeout(() => beep(784, 1046, 0.22, 'triangle', 0.2), 110); break;
      case 'candle':   beep(880, 1320, 0.12, 'sine', 0.2); noise(0.1, 0.05, 2400); break;
      case 'quest':    beep(392, 523, 0.14, 'triangle', 0.24);
                       setTimeout(() => beep(523, 659, 0.16, 'triangle', 0.22), 130);
                       setTimeout(() => beep(659, 784, 0.28, 'triangle', 0.2), 280); break;
      case 'pop':      beep(900, 1400, 0.07, 'square', 0.18); break;
      case 'miss':     beep(200, 150, 0.1, 'sawtooth', 0.12); break;
      case 'heart':    beep(110, 80, 0.3, 'sine', 0.3);
                       setTimeout(() => beep(110, 80, 0.3, 'sine', 0.22), 260); break;
      case 'chime':    [523, 659, 784, 1046].forEach((f, i) =>
                         setTimeout(() => beep(f, f, 0.9, 'sine', 0.16), i * 170)); break;
      default: break;
    }
  }
}

export const Audio2 = new AudioManagerClass();
export const AudioManager = Audio2;
