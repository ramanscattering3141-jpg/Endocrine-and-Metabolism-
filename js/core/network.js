/* Feedback-loop / endocrine-axis engine.
 * Mounts an EP.networks[id] definition: a dynamic EP.Model drawn as an axis diagram,
 * with perturbation presets, gland-capacity and exogenous-hormone sliders, live
 * time-course traces and a qualitative "lab pattern" read-out.
 */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;

  EP.mountNetwork = function (container, netOrId, opts = {}) {
    const net = typeof netOrId === 'string' ? EP.networks[netOrId] : netOrId;
    const W = net.view ? net.view.w : 900, H = net.view ? net.view.h : 560;
    const model = new EP.Model({ nodes: net.nodes });
    const byId = model.byId;
    let preset = null;

    const root = h('div.network');
    const top = h('div.net-top');
    const left = h('div.net-diagram');
    const right = h('div.net-side');
    root.append(top, h('div.net-body', left, right));
    container.appendChild(root);

    // ---------- diagram ----------
    const svg = s('svg', { class: 'pw-svg net-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': net.title });
    svg.appendChild(EP.svgDefs());
    const gBg = s('g'), gE = s('g'), gN = s('g');
    svg.append(gBg, gE, gN);
    left.appendChild(svg);
    (net.bands || []).forEach((b) => {
      gBg.appendChild(s('rect', { x: b.x || 0, y: b.y, width: b.w || W, height: b.h, class: 'band', rx: 12 }));
      gBg.appendChild(Object.assign(s('text', { x: (b.x || 0) + 12, y: b.y + 18, class: 'comp-label' }, b.label), { __comp: { x: b.x || 0, y: b.y, w: b.w || W, h: b.h } }));
    });
    const drawNodes = net.nodes.filter((n) => n.x != null);
    const nodeEl = {}, edgeEl = [];
    // edges from terms
    drawNodes.forEach((n) => {
      (n.terms || []).forEach((t) => {
        const a = byId[t.src];
        if (!a || a.x == null || t.hide) return;
        const inhib = t.w < 0;
        const isFb = !!t.fb;
        const type = isFb ? (inhib ? 'fb' : 'fbpos') : inhib ? 'inhib' : (t.endo ? 'endo' : 'stim');
        const curve = t.curve != null ? t.curve : isFb ? 70 : 0;
        const ax = a.x, ay = a.y, bx = n.x, by = n.y;
        const len = Math.hypot(bx - ax, by - ay) || 1;
        const nx = -(by - ay) / len, ny = (bx - ax) / len;
        const qx = (ax + bx) / 2 + nx * curve, qy = (ay + by) / 2 + ny * curve;
        const p0 = bnd(a, curve ? qx : bx, curve ? qy : by), p1 = bnd(n, curve ? qx : ax, curve ? qy : ay, 8);
        const d = curve ? `M${p0[0]},${p0[1]} Q${qx},${qy} ${p1[0]},${p1[1]}` : `M${p0[0]},${p0[1]} L${p1[0]},${p1[1]}`;
        const g = s('g', { class: 'edge-g' + (isFb ? ' fbk' : '') });
        const path = s('path', { d, class: `edge e-${type}`, 'marker-end': `url(#m-${type === 'endo' ? 'endo' : type})` });
        const flow = s('path', { d, class: `flow f-${type}` });
        const hit = s('path', { d, class: 'edge-hit' });
        hit.addEventListener('click', () => EP.showInfoHTML(`<div class="why-head">Why?</div><h3>${EP.esc(a.label)} ${inhib ? '⊣' : '→'} ${EP.esc(n.label)}</h3>` +
          (t.fb ? `<p class="tag">${t.fb === 'short' ? 'Short-loop feedback' : t.fb === 'ultra' ? 'Ultrashort-loop feedback' : t.fb === 'ff' ? 'Feed-forward' : 'Long-loop feedback'}</p>` : '') +
          `<p>${EP.md(t.why || '')}</p>`));
        g.append(path, flow, hit);
        const mx = curve ? (p0[0] + 2 * qx + p1[0]) / 4 : (p0[0] + p1[0]) / 2, my = curve ? (p0[1] + 2 * qy + p1[1]) / 4 : (p0[1] + p1[1]) / 2;
        if (t.label || t.fb) g.appendChild(s('text', { x: mx + (t.lx || 6), y: my + (t.ly || 0), class: 'edge-label' + (isFb ? ' fb-label' : '') }, t.label || (t.fb === 'short' ? 'short loop' : t.fb === 'ultra' ? 'ultrashort' : t.fb === 'ff' ? 'feed-forward' : 'long loop')));
        else g.appendChild(s('text', { x: mx + 7, y: my + 4, class: 'edge-glyph g-' + (inhib ? 'inhib' : 'stim') }, inhib ? '−' : '+'));
        gE.appendChild(g);
        edgeEl.push({ g, flow, t, a, n });
      });
    });
    function bnd(n, tx, ty, pad = 3) {
      const [w, hh] = sz(n);
      const dx = tx - n.x, dy = ty - n.y;
      const k = Math.min((w / 2 + pad) / Math.abs(dx || 1e-9), (hh / 2 + 14 + pad) / Math.abs(dy || 1e-9));
      return [n.x + dx * k, n.y + dy * k];
    }
    function sz(n) { if (!n._nsz) { const d = EP.SIZE[n.type || 'hormone'] || [110, 36]; n._nsz = EP.fitBox(n.type || 'hormone', n.label.split('\n'), n.w || d[0], n.h || d[1]); } return n._nsz; }
    drawNodes.forEach((n) => {
      const [w, hh] = sz(n);
      const g = s('g', { class: `node t-${n.type || 'hormone'}`, transform: `translate(${n.x},${n.y})`, tabindex: 0, role: 'button' });
      g.appendChild(EP.shapeFor(n.type || 'hormone', w, hh));
      const lines = n.label.split('\n');
      const t = s('text', { class: 'node-label', 'text-anchor': 'middle', y: -(lines.length - 1) * 6.5 + 4.5 });
      lines.forEach((L, i) => t.appendChild(s('tspan', { x: 0, dy: i ? 13 : 0 }, L)));
      g.appendChild(t);
      // meter below node
      const mw = Math.min(w, 110);
      const meter = s('g', { class: 'meter', transform: `translate(${-mw / 2},${hh / 2 + 6})` },
        s('rect', { width: mw, height: 7, rx: 3.5, class: 'm-bg' }),
        s('line', { x1: mw / 2, x2: mw / 2, y1: -2, y2: 9, class: 'm-ref' }));
      const bar = s('rect', { height: 7, rx: 3.5, class: 'm-bar', x: mw / 2, width: 0 });
      meter.appendChild(bar);
      const badge = s('text', { class: 'badge', x: w / 2 - 2, y: -hh / 2 - 4, 'text-anchor': 'end' });
      g.append(meter, badge);
      g.addEventListener('click', () => info(n));
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') info(n); });
      gN.appendChild(g);
      nodeEl[n.id] = { g, bar, badge, mw };
    });

    {
      const types = [...new Set(drawNodes.map((n) => n.type || 'hormone'))];
      const etypes = [...new Set(svg.querySelectorAll('path.edge').length ? [...svg.querySelectorAll('path.edge')].map((p) => (p.getAttribute('class').match(/e-(\w+)/) || [])[1]) : [])].filter(Boolean);
      const EL = { stim: 'Stimulates (+)', inhib: 'Inhibits (⊣)', endo: 'Hormone travels in blood', fb: 'Negative feedback (curved, dashed)', fbpos: 'Positive feedback', transport: 'Moves / is transported', rxn: 'Is converted to' };
      const meterSw = (pos) => { const sv = EP.s('svg', { width: 34, height: 20, viewBox: '0 0 34 20', class: 'ck-sw' }); const g = EP.s('g', { class: 'meter', transform: 'translate(2,7)' }); g.append(EP.s('rect', { width: 30, height: 7, rx: 3.5, class: 'm-bg' }), EP.s('line', { x1: 15, x2: 15, y1: -2, y2: 9, class: 'm-ref' }), EP.s('rect', { height: 7, rx: 3.5, x: pos ? 15 : 4, width: 11, class: 'm-bar ' + (pos ? 'pos' : 'neg') })); sv.appendChild(g); return sv; };
      const k = EP.colorKey([
        ['Box colour = kind of signal', types.map((x) => ({ node: x, label: EP.TYPE_LABEL[x] || x }))],
        ['Arrows', etypes.map((x) => ({ edge: x, label: EL[x] || x }))],
        ['Level vs. normal', [{ node: 'hormone', cls: 'up', label: 'Brighter fill + ↑ badge = above normal' }, { node: 'hormone', cls: 'dn', label: 'Pale, dashed = below normal' }]],
      ]);
      const items = k.querySelectorAll('.ck-items');
      const lv = items[items.length - 1];
      lv.append(EP.h('span.ck-item', meterSw(true), EP.h('span', 'Bar right of the tick: above normal')), EP.h('span.ck-item', meterSw(false), EP.h('span', 'Bar left of the tick: below normal')));
      left.appendChild(k);
    }
    const nboxes = drawNodes.map((n) => { const [w, hh] = sz(n); return { x: n.x - w / 2, y: n.y - hh / 2, w, h: hh + 16 }; });
    requestAnimationFrame(() => EP.declutter(svg, nboxes));

    function info(n) {
      const ex = model.explain(n.id).slice(0, 5);
      const q = EP.qual(model.eff(n.id), model.ref[n.id]);
      const extra = { node: n, model, modelId: n.id, explain: ex };
      if (n.ent && EP.data.entities[n.ent]) EP.showInfo(n.ent, extra);
      else EP.showInfoHTML(`<h3>${EP.esc(n.label.replace(/\n/g, ' '))}</h3><p class="qual ${q.cls}">${q.sym} ${q.word} vs. normal</p>` +
        (n.desc ? `<p>${EP.md(n.desc)}</p>` : '') + EP.explainHTML(model, n.id));
    }

    // ---------- side panel: presets, sliders, labs, traces ----------
    const presetBox = h('div.presets');
    const pBtns = [];
    const normalBtn = h('button.chip.on', { onclick: () => choose(null, normalBtn) }, 'Normal');
    presetBox.appendChild(normalBtn); pBtns.push(normalBtn);
    (net.presets || []).forEach((p) => {
      const b = h('button.chip', { onclick: () => choose(p, b), title: p.desc || '' }, p.label);
      presetBox.appendChild(b); pBtns.push(b);
    });
    top.append(h('div.tb-label', 'Perturbation presets'), presetBox);
    const story = h('div.net-story');
    top.appendChild(story);

    const knobs = h('div.net-knobs');
    const capKnobs = {}, exoKnobs = {}, inKnobs = {};
    (net.inputs || []).forEach((i) => {
      const k = EP.logSlider({ label: i.label, value: byId[i.id].value || 1, span: i.span || 2, labels: i.labels, title: i.title,
        onChange: (v) => { model.inputs[i.id] = v; afterChange(); } });
      inKnobs[i.id] = k; knobs.appendChild(k);
    });
    (net.capacities || []).forEach((c) => {
      const k = EP.logSlider({ label: c.label, value: 1, span: 3, labels: ['failed', 'impaired', 'normal', 'hyperactive', 'autonomous-like'],
        onChange: (v) => { model.caps[c.id] = v; afterChange(); } });
      capKnobs[c.id] = k; knobs.appendChild(k);
    });
    (net.exogenous || []).forEach((x) => {
      const inp = h('input', { type: 'range', min: 0, max: 100, value: 0, 'aria-label': x.label });
      const out = h('span.knob-val', 'none');
      inp.addEventListener('input', () => { const v = (inp.value / 100) * (x.max || 4); model.exo[x.id] = v; out.textContent = v < 0.05 ? 'none' : v < 1 ? 'low dose' : v < 2.5 ? 'replacement-range' : 'supraphysiologic'; afterChange(); });
      const wrap = h('label.knob.exo', h('span.knob-name', x.label), inp, out);
      wrap.set = (v) => { inp.value = Math.round((v / (x.max || 4)) * 100); inp.dispatchEvent(new Event('input')); };
      exoKnobs[x.id] = wrap; knobs.appendChild(wrap);
    });
    right.append(h('h4', 'Manipulate'), knobs);

    const labs = h('table.labs');
    right.append(h('h4', 'Read-out (vs. normal)'), labs);
    const pattern = h('div.pattern');
    right.appendChild(pattern);

    // traces
    const traceIds = net.traces || drawNodes.filter((n) => n.type !== 'organ' && n.type !== 'process').map((n) => n.id).slice(0, 5);
    const cv = h('canvas.trace', { width: 520, height: 170 });
    const traceWrap = h('div.trace-wrap', h('div.trace-head', h('span', 'Time course'), h('span.muted.small', 'log scale · relative to normal · arbitrary time units')), cv, h('div.trace-legend', traceIds.map((id, i) => h('span', { style: { '--c': `var(--tr${i})` } }, byId[id].label.replace(/\n/g, ' ')))));
    (opts.traceInto || left).appendChild(traceWrap);
    const hist = traceIds.map(() => []);
    const HN = 260;

    function choose(p, btn) {
      pBtns.forEach((b) => b.classList.toggle('on', b === btn));
      preset = p;
      model.applyPreset(p);
      // sync sliders
      Object.keys(inKnobs).forEach((id) => inKnobs[id].set(model.inputs[id]));
      Object.keys(capKnobs).forEach((id) => capKnobs[id].set(model.caps[id] || 1));
      Object.keys(exoKnobs).forEach((id) => { const x = (net.exogenous.find((e) => e.id === id)); const inp = exoKnobs[id].querySelector('input'); inp.value = Math.round(((model.exo[id] || 0) / (x.max || 4)) * 100); exoKnobs[id].querySelector('.knob-val').textContent = model.exo[id] ? 'on' : 'none'; });
      story.innerHTML = p ? `<strong>${EP.esc(p.label)}.</strong> ${EP.md(p.desc || '')}` + (p.chain ? `<div class="chain">${p.chain.map((x) => `<span>${EP.md(x)}</span>`).join('<i>→</i>')}</div>` : '') : (net.normalText ? EP.md(net.normalText) : '');
      if (opts.onPreset) opts.onPreset(p);
    }
    function afterChange() { /* dynamics pick it up on next frame */ }

    function paint() {
      drawNodes.forEach((n) => {
        const el = nodeEl[n.id];
        const r = model.eff(n.id) / (model.ref[n.id] || 1);
        const q = EP.qual(model.eff(n.id), model.ref[n.id]);
        el.g.classList.remove('up', 'up2', 'dn', 'dn2', 'eq');
        el.g.classList.add(q.cls);
        el.badge.textContent = q.sym === '↔' ? '' : q.sym;
        const l = EP.clamp(Math.log2(r) / 3, -1, 1);
        const half = el.mw / 2;
        el.bar.setAttribute('x', l >= 0 ? half : half + l * half);
        el.bar.setAttribute('width', Math.abs(l) * half);
        el.bar.setAttribute('class', 'm-bar ' + (l >= 0 ? 'pos' : 'neg'));
      });
      edgeEl.forEach(({ g, flow, a }) => {
        const r = model.eff(a.id) / (model.ref[a.id] || 1);
        g.style.setProperty('--w', EP.clamp(1 + Math.log2(r + 1) * 1.4, 0.6, 5.5).toFixed(2));
        flow.style.animationDuration = (2.2 / EP.clamp(r, 0.15, 6)).toFixed(2) + 's';
        g.classList.toggle('off', r < 0.3);
      });
      // labs table
      const rows = (net.labs || traceIds).map((id) => {
        const n = byId[id];
        const tot = model.eff(id);
        const q = EP.qual(tot, model.ref[id]);
        const endo = model.exo[id] ? ` <span class="muted small">(endogenous ${EP.qual(model.v[id], model.ref[id]).sym})</span>` : '';
        return `<tr><td>${EP.esc(n.label.replace(/\n/g, ' '))}</td><td class="qual ${q.cls}">${q.sym}</td><td class="muted small">${q.word}${endo}</td></tr>`;
      });
      labs.innerHTML = rows.join('');
      if (net.interpret) pattern.innerHTML = EP.md(net.interpret(model, preset) || '');
    }

    function drawTrace() {
      const ctx = cv.getContext('2d');
      const cw = cv.width, ch = cv.height;
      ctx.clearRect(0, 0, cw, ch);
      const css = getComputedStyle(document.body);
      ctx.strokeStyle = css.getPropertyValue('--grid').trim() || '#334';
      ctx.lineWidth = 1;
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.fillStyle = css.getPropertyValue('--muted').trim() || '#889';
      [-2, -1, 0, 1, 2].forEach((l) => {
        const y = ch / 2 - (l / 2.6) * (ch / 2 - 8);
        ctx.globalAlpha = l === 0 ? 0.9 : 0.35; ctx.beginPath(); ctx.moveTo(26, y); ctx.lineTo(cw, y); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillText(l === 0 ? '1×' : (l > 0 ? Math.pow(2, l) + '×' : '1/' + Math.pow(2, -l)), 0, y + 3);
      });
      hist.forEach((hs, i) => {
        ctx.strokeStyle = css.getPropertyValue(`--tr${i}`).trim() || '#fff';
        ctx.lineWidth = 2; ctx.beginPath();
        hs.forEach((v, j) => {
          const x = 26 + (j / HN) * (cw - 28);
          const y = ch / 2 - EP.clamp(Math.log2(v) / 2.6, -1, 1) * (ch / 2 - 8);
          j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.stroke();
      });
    }

    let acc = 0;
    const stop = EP.loop((dt) => {
      if (net.clock) net.clock(model, dt);
      // multiple sub-steps for stability
      const simDt = dt * (net.speed || 2.5);
      for (let k = 0; k < 4; k++) model.step(simDt / 4);
      acc += dt;
      if (acc > 0.06) {
        acc = 0;
        traceIds.forEach((id, i) => { hist[i].push(model.eff(id) / (model.ref[id] || 1)); if (hist[i].length > HN) hist[i].shift(); });
        paint(); drawTrace();
      }
    });
    EP.onTeardown(stop);
    const api = { model, choose, root };
    api.choose = (id) => { const p = (net.presets || []).find((x) => x.id === id); const i = (net.presets || []).indexOf(p); choose(p || null, pBtns[i + 1] || normalBtn); };
    api.settle = () => { model.solve(); paint(); };
    choose(null, normalBtn);
    paint();
    return api;
  };

  /** HTML list of contributions for a model node */
  EP.explainHTML = function (model, id) {
    const ex = model.explain(id).filter((e) => Math.abs(e.score) > 0.03).slice(0, 6);
    if (!ex.length) return '<p class="muted small">At reference: no input is pushing this node away from normal.</p>';
    return '<div class="why-head">Why is it changed?</div><ul class="explain">' + ex.map((e) => {
      const dir = e.score > 0 ? 'pushes ↑' : 'pushes ↓';
      return `<li><span class="push ${e.score > 0 ? 'up' : 'dn'}">${dir}</span> ${EP.md(EP.explainLine(model, e))}</li>`;
    }).join('') + '</ul>';
  };
})();
