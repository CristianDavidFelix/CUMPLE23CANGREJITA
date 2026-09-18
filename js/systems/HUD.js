/* =====================================================================
   HUD
   Barra superior, rastreador de la mision activa, cartel de lugar y
   avisos flotantes. Todo DOM, todo reactivo a eventos del bus.
   ===================================================================== */

import { bus } from './EventBus.js';
import { State } from './GameState.js';
import { QUESTS } from '../data/quests.js';
import { fillTokens } from '../data/playerConfig.js';
import { AudioManager } from './AudioManager.js';

class HUDClass {
  constructor() {
    this.root      = document.getElementById('hud');
    this.locName   = document.getElementById('location-name');
    this.tracker   = document.getElementById('quest-tracker');
    this.trackerT  = document.getElementById('quest-tracker-title');
    this.trackerL  = document.getElementById('quest-tracker-list');
    this.banner    = document.getElementById('place-banner');
    this.bannerT   = document.getElementById('place-banner-title');
    this.bannerS   = document.getElementById('place-banner-sub');
    this.toastWrap = document.getElementById('toast-stack');
    this.journalBtn = document.getElementById('btn-journal');
    this._bannerTimer = null;
    this._compactTimer = null;
  }

  init() {
    bus.on('quest:update',   () => this.renderTracker());
    bus.on('quest:start',    () => this.renderTracker());
    bus.on('quest:complete', () => { AudioManager.sfx('quest'); this.renderTracker(); });
    bus.on('quest:objective', d => this.flashObjective(d.objective));
    bus.on('toast', t => this.toast(t));
    bus.on('memory:unlock',  () => this.pulseJournal());
    bus.on('reason:unlock',  () => this.pulseJournal());
    // tocar el rastreador abre el diario
    this.tracker.addEventListener('click', () => bus.emit('input:journal'));
    this.renderTracker();
  }

  show() { this.root.classList.remove('hidden'); this.renderTracker(); }
  hide() { this.root.classList.add('hidden'); this.tracker.classList.add('hidden'); }

  setLocation(name) { this.locName.textContent = name; }

  /* ---------------- cartel al entrar a un sitio ---------------- */
  showBanner(title, sub) {
    clearTimeout(this._bannerTimer);
    this.bannerT.textContent = title;
    this.bannerS.textContent = sub || '';
    this.banner.classList.remove('hidden');
    // reinicia la animacion CSS
    this.banner.style.animation = 'none';
    void this.banner.offsetWidth;
    this.banner.style.animation = '';
    this._bannerTimer = setTimeout(() => this.banner.classList.add('hidden'), 3200);
  }

  /* ---------------- rastreador ---------------- */
  renderTracker() {
    const id = State.activeQuestId();
    if (!id) { this.tracker.classList.add('hidden'); return; }

    const def = QUESTS[id];
    this.tracker.classList.remove('hidden');
    this.expandTracker();
    this.trackerT.textContent = fillTokens(def.title);
    this.trackerL.innerHTML = '';

    for (const o of def.objectives) {
      const done = State.objectiveDone(id, o.id);
      const li = document.createElement('li');
      li.dataset.obj = o.id;
      if (done) li.classList.add('done');

      const mark = document.createElement('span');
      mark.className = 'mark';
      mark.textContent = done ? '✦' : '☐';

      const label = document.createElement('span');
      let text = fillTokens(o.text);
      if (o.count && !done) text += `  (${State.counter(id, o.id)}/${o.count})`;
      label.textContent = text;

      li.append(mark, label);
      this.trackerL.appendChild(li);
    }
  }

  /* En el telefono la lista ocupa mucho: se muestra entera cuando cambia
     algo y a los pocos segundos se recoge, dejando solo el titulo. */
  expandTracker() {
    this.tracker.classList.remove('compact');
    clearTimeout(this._compactTimer);
    this._compactTimer = setTimeout(() => this.tracker.classList.add('compact'), 7000);
  }

  flashObjective(objId) {
    const li = this.trackerL.querySelector(`[data-obj="${objId}"]`);
    if (!li) return;
    li.classList.add('just-done');
    setTimeout(() => li.classList.remove('just-done'), 900);
  }

  /* ---------------- avisos ---------------- */
  toast({ title, sub }) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = fillTokens(title || '');
    if (sub) {
      const s = document.createElement('small');
      s.textContent = fillTokens(sub);
      el.appendChild(s);
    }
    this.toastWrap.appendChild(el);
    AudioManager.sfx('unlock');
    setTimeout(() => el.remove(), 3500);

    // nunca mas de 3 avisos a la vez
    while (this.toastWrap.children.length > 3) this.toastWrap.firstChild.remove();
  }

  pulseJournal() {
    this.journalBtn.classList.add('pulse');
    setTimeout(() => this.journalBtn.classList.remove('pulse'), 3000);
  }
}

export const HUD = new HUDClass();
