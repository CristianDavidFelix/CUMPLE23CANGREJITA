/* =====================================================================
   JournalUI
   El diario (misiones / recuerdos / 23 razones / lugares) y el visor de
   fotos tipo polaroid.

   Si una foto todavia no existe en assets/photos/, el marco muestra el
   texto "hint" en vez de romperse.
   ===================================================================== */

import { bus } from './EventBus.js';
import { State } from './GameState.js';
import { QUESTS, QUEST_ORDER } from '../data/quests.js';
import { MEMORIES } from '../data/memories.js';
import { REASONS } from '../data/reasons.js';
import { PLACE_LIST } from '../data/maps.js';
import { getPhoto } from '../data/photos.js';
import { fillTokens } from '../data/playerConfig.js';
import { AudioManager } from './AudioManager.js';

class JournalUIClass {
  constructor() {
    this.el       = document.getElementById('journal');
    this.content  = document.getElementById('journal-content');
    this.tabs     = document.getElementById('journal-tabs');
    this.viewer   = document.getElementById('viewer');
    this.viewerImg = document.getElementById('viewer-img');
    this.viewerFb = document.getElementById('viewer-fallback');
    this.viewerCap = document.getElementById('viewer-caption');
    this.tab = 'quests';
  }

  init() {
    document.getElementById('btn-journal').addEventListener('click', () => this.toggle());
    document.getElementById('journal-close').addEventListener('click', () => this.close());
    document.getElementById('viewer-close').addEventListener('click', () => this.closeViewer());
    this.viewer.addEventListener('click', e => { if (e.target === this.viewer) this.closeViewer(); });

    this.tabs.addEventListener('click', e => {
      const b = e.target.closest('.tab');
      if (!b) return;
      AudioManager.sfx('select');
      this.tab = b.dataset.tab;
      [...this.tabs.children].forEach(c => c.classList.toggle('active', c === b));
      this.render();
    });

    bus.on('photo:show', id => this.showPhoto(id));
  }

  /* ---------------- diario ---------------- */

  toggle() { this.el.classList.contains('hidden') ? this.open() : this.close(); }

  open(tab) {
    if (tab) {
      this.tab = tab;
      [...this.tabs.children].forEach(c => c.classList.toggle('active', c.dataset.tab === tab));
    }
    AudioManager.sfx('select');
    State.blocked = true;
    this.el.classList.remove('hidden');
    this.render();
  }

  close() {
    AudioManager.sfx('cancel');
    this.el.classList.add('hidden');
    if (this.viewer.classList.contains('hidden')) State.blocked = false;
  }

  render() {
    const f = {
      quests: () => this.renderQuests(),
      memories: () => this.renderMemories(),
      reasons: () => this.renderReasons(),
      places: () => this.renderPlaces()
    }[this.tab];
    this.content.innerHTML = '';
    this.content.appendChild(f());
    this.content.scrollTop = 0;
  }

  renderQuests() {
    const frag = document.createDocumentFragment();
    let any = false;

    for (const id of QUEST_ORDER) {
      const q = State.quest(id);
      if (!q) continue;                     // todavia no desbloqueada
      any = true;
      const def = QUESTS[id];
      const box = document.createElement('div');
      box.className = 'j-quest';

      const h = document.createElement('h3');
      h.textContent = fillTokens(def.title);
      if (q.status === 'done') {
        const b = document.createElement('span');
        b.className = 'badge';
        b.textContent = 'completada';
        h.appendChild(b);
      }

      const d = document.createElement('p');
      d.className = 'desc';
      d.textContent = fillTokens(def.desc);

      const ul = document.createElement('ul');
      for (const o of def.objectives) {
        const done = State.objectiveDone(id, o.id);
        const li = document.createElement('li');
        if (done) li.classList.add('done');
        const m = document.createElement('span');
        m.className = 'mark';
        m.textContent = done ? '✦' : '☐';
        const t = document.createElement('span');
        let text = fillTokens(o.text);
        if (o.count && !done) text += `  (${State.counter(id, o.id)}/${o.count})`;
        t.textContent = text;
        li.append(m, t);
        ul.appendChild(li);
      }

      box.append(h, d, ul);
      frag.appendChild(box);
    }

    if (!any) frag.appendChild(this._empty('Todavía no hay nada escrito aquí.'));
    return frag;
  }

  renderMemories() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this._progress(State.countMemories(), State.totalMemories(), 'Recuerdos'));

    const grid = document.createElement('div');
    grid.className = 'j-grid';

    for (const [id, m] of Object.entries(MEMORIES)) {
      const has = State.hasMemory(id);
      const card = document.createElement(has && m.photo ? 'button' : 'div');
      card.className = 'j-card' + (has ? '' : ' locked');

      const b = document.createElement('b');
      b.textContent = has ? m.title : '? ? ?';
      const s = document.createElement('small');
      s.textContent = has ? m.text : 'Sin descubrir · ' + m.place;
      card.append(b, s);

      if (has && m.photo) {
        const tag = document.createElement('small');
        tag.style.color = 'var(--gold)';
        tag.style.marginTop = '6px';
        tag.textContent = '✦ ver fotografía';
        card.appendChild(tag);
        card.addEventListener('click', () => this.showPhoto(m.photo));
      }
      grid.appendChild(card);
    }

    frag.appendChild(grid);
    return frag;
  }

  renderReasons() {
    const frag = document.createDocumentFragment();
    const n = State.countReasons();
    frag.appendChild(this._progress(n, REASONS.length, '23 deseos para tus 23'));

    const ul = document.createElement('ul');
    ul.className = 'j-reasons';
    REASONS.forEach((text, i) => {
      const has = State.hasReason(i);
      const li = document.createElement('li');
      if (!has) li.classList.add('locked');
      const num = document.createElement('span');
      num.className = 'n';
      num.textContent = (i + 1) + '.';
      const t = document.createElement('span');
      t.textContent = has ? fillTokens(text) : 'vela sin encender: deseo por descubrir';
      li.append(num, t);
      ul.appendChild(li);
    });

    frag.appendChild(ul);
    return frag;
  }

  renderPlaces() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this._progress(State.countVisited(), PLACE_LIST.length, 'Lugares'));

    const grid = document.createElement('div');
    grid.className = 'j-grid';
    for (const p of PLACE_LIST) {
      const has = State.visited(p.id);
      const card = document.createElement('div');
      card.className = 'j-card' + (has ? '' : ' locked');
      const b = document.createElement('b');
      b.textContent = has ? p.name : '? ? ?';
      const s = document.createElement('small');
      s.textContent = has ? 'Visitado' : 'Sin visitar';
      card.append(b, s);
      grid.appendChild(card);
    }
    frag.appendChild(grid);
    return frag;
  }

  _progress(n, total, label) {
    const w = document.createElement('div');
    w.className = 'j-progress';
    const t = document.createElement('span');
    t.textContent = `${label}  ${n}/${total}`;
    const bar = document.createElement('div');
    bar.className = 'bar';
    const i = document.createElement('i');
    i.style.width = Math.round((n / total) * 100) + '%';
    bar.appendChild(i);
    w.append(t, bar);
    return w;
  }

  _empty(text) {
    const p = document.createElement('p');
    p.className = 'j-empty';
    p.textContent = text;
    return p;
  }

  /* ---------------- visor de fotos ---------------- */

  showPhoto(id, captionOverride) {
    const p = getPhoto(id);
    if (!p) return;
    State.blocked = true;
    AudioManager.sfx('select');

    this.viewerCap.textContent = fillTokens(captionOverride || p.caption || '');
    this.viewerFb.textContent = p.hint || 'Aqui va una fotografia';
    this.viewerImg.classList.remove('ok');
    this.viewerFb.style.display = '';

    this.viewerImg.onload = () => {
      this.viewerImg.classList.add('ok');
      this.viewerFb.style.display = 'none';
    };
    this.viewerImg.onerror = () => {
      this.viewerImg.classList.remove('ok');
      this.viewerFb.style.display = '';
    };
    this.viewerImg.src = p.src;

    this.viewer.classList.remove('hidden');
  }

  closeViewer() {
    AudioManager.sfx('cancel');
    this.viewer.classList.add('hidden');
    if (this.el.classList.contains('hidden')) State.blocked = false;
  }

  get isOpen() {
    return !this.el.classList.contains('hidden') || !this.viewer.classList.contains('hidden');
  }
}

export const Journal = new JournalUIClass();
