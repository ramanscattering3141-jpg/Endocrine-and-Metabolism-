/* Endocrine Physiology Lab — core utilities
 * Everything hangs off a single global namespace (EP) so the site runs from
 * file:// without a build step or module loader. */
(function () {
  'use strict';
  const EP = (window.EP = window.EP || {});
  EP.data = EP.data || {};
  EP.views = EP.views || {};
  EP.pathways = EP.pathways || {};
  EP.networks = EP.networks || {};

  const SVGNS = 'http://www.w3.org/2000/svg';

  /** Create an HTML element. h('div.card#x', {onclick}, children...) */
  const isAttrs = (a) => a != null && typeof a === 'object' && !(a instanceof Node) && !Array.isArray(a);
  EP.h = function h(tag, attrs, ...kids) {
    if (!isAttrs(attrs)) { if (attrs != null) kids.unshift(attrs); attrs = null; }
    const m = /^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i.exec(tag) || [];
    const el = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, (_, t, v) => {
      if (t === '.') el.classList.add(v); else el.id = v;
    });
    applyAttrs(el, attrs);
    appendKids(el, kids);
    return el;
  };

  /** Create an SVG element. */
  EP.s = function s(tag, attrs, ...kids) {
    if (!isAttrs(attrs)) { if (attrs != null) kids.unshift(attrs); attrs = null; }
    const el = document.createElementNS(SVGNS, tag);
    applyAttrs(el, attrs, true);
    appendKids(el, kids);
    return el;
  };

  function applyAttrs(el, attrs, svg) {
    if (!attrs) return;
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') {
        // custom properties (--x) are ignored by Object.assign on CSSStyleDeclaration
        for (const sk in v) { if (sk.startsWith('--')) el.style.setProperty(sk, v[sk]); else el.style[sk] = v[sk]; }
      }
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'class' || k === 'className') el.setAttribute('class', v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (!svg && (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected')) el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  function appendKids(el, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k == null || k === false) continue;
      el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
    }
  }

  EP.clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  EP.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  EP.lerp = (a, b, t) => a + (b - a) * t;
  EP.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /** Tiny inline markup: **bold**, *italic*, [[entity-id|label]] links, -> arrows, ⊣ */
  EP.md = function md(text) {
    if (!text) return '';
    let t = EP.esc(text);
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*]+?)\*/g, '$1<em>$2</em>');
    t = t.replace(/\[\[([\w-]+)\|([^\]]+)\]\]/g, '<a class="ent-link" data-ent="$1">$2</a>');
    t = t.replace(/\[\[([\w-]+)\]\]/g, (_, id) => {
      const e = EP.data.entities && EP.data.entities[id];
      return `<a class="ent-link" data-ent="${id}">${e ? EP.esc(e.name) : id}</a>`;
    });
    t = t.replace(/\{\{ref:([\w-]+)\}\}/g, (_, id) => {
      const r = EP.data.refs && EP.data.refs[id];
      return r ? `<a class="ref-link" data-ref="${id}" title="${EP.esc(r.short)}">[${EP.esc(r.cite)}]</a>` : '';
    });
    t = t.replace(/-&gt;/g, '→').replace(/\n/g, '<br>');
    return t;
  };

  /** Qualitative change label relative to a reference value of 1. */
  EP.qual = function qual(v, ref) {
    const r = ref ? v / ref : v;
    const l = Math.log2(Math.max(r, 1e-6));
    if (l > 1.2) return { sym: '↑↑', cls: 'up2', word: 'markedly increased' };
    if (l > 0.2) return { sym: '↑', cls: 'up', word: 'increased' };
    if (l < -1.2) return { sym: '↓↓', cls: 'dn2', word: 'markedly decreased' };
    if (l < -0.2) return { sym: '↓', cls: 'dn', word: 'decreased' };
    return { sym: '↔', cls: 'eq', word: 'about unchanged' };
  };

  /** Log-scale slider helpers: slider position p in [-1,1] -> value 2^(p*span) */
  EP.logSlider = function (opts) {
    const span = opts.span || 2.5; // ±2.5 doublings
    const labels = opts.labels || ['very low', 'low', 'reference', 'high', 'very high'];
    const input = EP.h('input', { type: 'range', min: -100, max: 100, step: 1, value: Math.round(100 * Math.log2(opts.value || 1) / span), 'aria-label': opts.label });
    const out = EP.h('span.knob-val');
    const toV = () => Math.pow(2, (input.value / 100) * span);
    const word = () => {
      const p = input.value / 100;
      const i = p < -0.7 ? 0 : p < -0.15 ? 1 : p <= 0.15 ? 2 : p <= 0.7 ? 3 : 4;
      return labels[i];
    };
    const sync = () => { out.textContent = word(); };
    input.addEventListener('input', () => { sync(); opts.onChange && opts.onChange(toV()); });
    sync();
    const wrap = EP.h('label.knob', { title: opts.title || '' },
      EP.h('span.knob-name', opts.label), input, out);
    wrap.set = (v) => { input.value = Math.round(100 * Math.log2(v) / span); sync(); };
    wrap.get = toV;
    wrap.input = input;
    return wrap;
  };

  /** Simple event bus */
  const subs = {};
  EP.on = (ev, fn) => { (subs[ev] = subs[ev] || []).push(fn); return () => { subs[ev] = subs[ev].filter((f) => f !== fn); }; };
  EP.emit = (ev, data) => (subs[ev] || []).slice().forEach((f) => f(data));

  /** Global UI state */
  EP.state = {
    level: 2, // 1 student, 2 physiology, 3 molecular, 4 clinical
    motion: 1, // animation speed multiplier
    paused: false,
    textScale: 1,
  };
  EP.setLevel = (lv) => { EP.state.level = lv; document.body.dataset.level = lv; EP.emit('level', lv); };

  /** Safe localStorage */
  EP.store = {
    get(k, d) { try { const v = localStorage.getItem('ep:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('ep:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };

  /** Animation frame loop registry so views can be torn down cleanly on navigation */
  const loops = new Set();
  EP.loop = function (fn) {
    let last = performance.now();
    const rec = { alive: true };
    const tick = (t) => {
      if (!rec.alive) return;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!EP.state.paused) fn(dt * EP.state.motion, t);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    loops.add(rec);
    return () => { rec.alive = false; loops.delete(rec); };
  };
  EP.stopAllLoops = () => { loops.forEach((r) => (r.alive = false)); loops.clear(); };

  /** Teardown hooks for the current view */
  let teardowns = [];
  EP.onTeardown = (fn) => teardowns.push(fn);
  EP.teardown = () => { teardowns.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); teardowns = []; EP.stopAllLoops(); };

  /** Reference-list block for a module */
  EP.sources = function (ids, note) {
    const refs = EP.data.refs || {};
    const det = EP.h('details.sources',
      EP.h('summary', 'Sources / Further reading'),
      note ? EP.h('p.muted', { html: EP.md(note) }) : null,
      EP.h('ol', ids.filter((i) => refs[i]).map((i) => EP.h('li', { html: EP.refHTML(refs[i]) }))));
    return det;
  };
  EP.refHTML = function (r) {
    let s = EP.esc(r.full);
    if (r.doi) s += ` <a href="https://doi.org/${r.doi}" target="_blank" rel="noopener">doi:${EP.esc(r.doi)}</a>`;
    if (r.pmid) s += ` · <a href="https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/" target="_blank" rel="noopener">PMID ${r.pmid}</a>`;
    if (r.note) s += `<div class="muted small">${EP.md(r.note)}</div>`;
    return s;
  };

  /** Page header helper */
  EP.pageHeader = function (title, question, opts = {}) {
    return EP.h('header.page-head',
      EP.h('div.crumb', opts.section || ''),
      EP.h('h1', title),
      question ? EP.h('p.question', { html: EP.md(question) }) : null,
      opts.lede ? EP.h('p.lede', { html: EP.md(opts.lede) }) : null);
  };

  /** A callout explaining model semantics (activation vs flux). */
  EP.modelNote = function (extra) {
    return EP.h('div.model-note', { html:
      '<strong>How to read this model.</strong> Values are <em>relative activity indices</em> (1 = overnight-fasted reference) produced by a qualitative regulatory model. ' +
      'An arrow getting thicker means the regulatory drive on that pathway rises — it is <em>not</em> a measured flux in µmol/kg/min. ' +
      '"Pathway activated" ≠ "pathway carries X flux".' + (extra ? ' ' + EP.md(extra) : '') });
  };
})();
