/* Metabolic flux simulator, What-if cascade and Compare. */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;
  const V = EP.views;

  // ---------------- organ map layout ----------------
  const ORG = {
    brain: { x: 390, y: 20, w: 220, title: 'Brain', procs: [['brainglc', 'Glucose use'], ['brainket', 'Ketone oxidation']] },
    pancreas: { x: 395, y: 210, w: 210, title: 'Pancreas', procs: [['insulin', 'Insulin secretion'], ['glucagon', 'Glucagon secretion']] },
    adrenal: { x: 700, y: 20, w: 190, title: 'Adrenal', procs: [['epi', 'Epinephrine'], ['cortisol', 'Cortisol']] },
    liver: { x: 20, y: 150, w: 260, title: 'Liver', procs: [['h_glycogenolysis', 'Glycogenolysis'], ['gng', 'Gluconeogenesis'], ['h_glycogenesis', 'Glycogenesis'], ['h_glycolysis', 'Glycolysis'], ['dnl', 'Lipogenesis'], ['h_fao', 'β-Oxidation'], ['ketogenesis', 'Ketogenesis'], ['urea', 'Urea cycle']] },
    muscle: { x: 700, y: 210, w: 230, title: 'Skeletal muscle', procs: [['m_uptake', 'Glucose uptake'], ['m_glycogenesis', 'Glycogen synthesis'], ['m_glycogenolysis', 'Glycogenolysis'], ['m_glycolysis', 'Glycolysis'], ['m_fao', 'Fat oxidation'], ['m_protsyn', 'Protein synthesis'], ['m_proteolysis', 'Proteolysis']] },
    adipose: { x: 20, y: 480, w: 260, title: 'Adipose tissue', procs: [['a_uptake', 'Glucose uptake'], ['esterif', 'TG synthesis'], ['lipolysis', 'Lipolysis'], ['leptin', 'Leptin']] },
    kidney: { x: 720, y: 520, w: 210, title: 'Kidney', procs: [['renalgng', 'Gluconeogenesis']] },
    gut: { x: 395, y: 600, w: 210, title: 'Gut', procs: [['gutglc', 'Glucose absorption'], ['glp1', 'GLP-1 (incretin)']] },
  };
  const ROWH = 24;
  ORG.blood = { x: 360, y: 345, w: 280, title: 'Blood', procs: [['glucose', 'Glucose'], ['ffa', 'Free fatty acids'], ['ketones', 'Ketone bodies'], ['lactate', 'Lactate'], ['aa', 'Amino acids'], ['tgp', 'Triglyceride (VLDL)']] };
  Object.values(ORG).forEach((o) => { o.h = 34 + o.procs.length * ROWH + 6; });
  const anchor = (o, side) => { const O = ORG[o]; return side === 'r' ? [O.x + O.w, O.y + O.h / 2] : side === 'l' ? [O.x, O.y + O.h / 2] : side === 't' ? [O.x + O.w / 2, O.y] : [O.x + O.w / 2, O.y + O.h]; };
  const FLUX = [
    { from: ['liver', 'r'], to: ['blood', 'l'], bind: 'hgo', label: 'glucose output', k: 'glc', dy1: -30, dy2: -40 },
    { from: ['blood', 't'], to: ['brain', 'b'], bind: 'brainglc', label: 'glucose', k: 'glc', dx1: -40, dx2: -40 },
    { from: ['blood', 'r'], to: ['muscle', 'l'], bind: 'm_uptake', label: 'glucose', k: 'glc', dy1: -40, dy2: -50 },
    { from: ['blood', 'l'], to: ['adipose', 'r'], bind: 'a_uptake', label: 'glucose', k: 'glc', dy1: 40, dy2: -50 },
    { from: ['gut', 't'], to: ['blood', 'b'], bind: 'gutglc', label: 'absorbed glucose', k: 'glc', dx1: -50, dx2: -50 },
    { from: ['kidney', 'l'], to: ['blood', 'r'], bind: 'renalgng', label: 'glucose', k: 'glc', dy2: 50 },
    { from: ['muscle', 'l'], to: ['liver', 'r'], bind: 'lactrel', label: 'lactate (Cori)', k: 'lac', dy1: 40, dy2: 30, curve: 70 },
    { from: ['muscle', 'l'], to: ['liver', 'r'], bind: 'alarel', label: 'alanine', k: 'aa', dy1: 70, dy2: 60, curve: 100 },
    { from: ['adipose', 't'], to: ['liver', 'b'], bind: 'ffa', label: 'FFA', k: 'fat', dx1: -60, dx2: -60 },
    { from: ['adipose', 't'], to: ['liver', 'b'], bind: 'glycerol', label: 'glycerol', k: 'fat', dx1: 60, dx2: 60 },
    { from: ['adipose', 'r'], to: ['muscle', 'b'], bind: 'm_fao', label: 'FFA', k: 'fat', dy1: 30, dx2: -60, curve: -90 },
    { from: ['liver', 't'], to: ['brain', 'l'], bind: 'brainket', label: 'ketones', k: 'ket', dx1: 40, dy2: 10, curve: 60 },
    { from: ['liver', 'r'], to: ['muscle', 'l'], bind: 'm_ketox', label: 'ketones', k: 'ket', dy1: -80, dy2: -80, curve: -60 },
    { from: ['liver', 'b'], to: ['adipose', 't'], bind: 'vldl', label: 'VLDL-TG', k: 'tg', dx1: 0, dx2: 0 },
    { from: ['pancreas', 'l'], to: ['liver', 'r'], bind: 'insulin', label: 'insulin', k: 'hor', dy1: -10, dy2: -90 },
    { from: ['pancreas', 'l'], to: ['liver', 'r'], bind: 'glucagon', label: 'glucagon', k: 'hor', dy1: 12, dy2: -70, curve: 30 },
    { from: ['pancreas', 'r'], to: ['muscle', 'l'], bind: 'insulin', label: 'insulin', k: 'hor', dy1: 0, dy2: -90 },
    { from: ['gut', 'r'], to: ['pancreas', 'b'], bind: 'glp1', label: 'GLP-1', k: 'hor', dx2: 70, curve: -60 },
    { from: ['adrenal', 'l'], to: ['brain', 'r'], bind: 'cortisol', label: '', k: 'hor', hide: true },
    { from: ['adrenal', 'b'], to: ['muscle', 't'], bind: 'epi', label: 'epinephrine', k: 'hor', dx1: 20, dx2: 0 },
    { from: ['adipose', 'l'], to: ['brain', 'l'], bind: 'leptin', label: 'leptin', k: 'hor', dy1: -20, dy2: 40, via: [[10, 470], [10, 80]] },
    { from: ['liver', 'b'], to: ['kidney', 'l'], bind: 'urea', label: 'urea', k: 'n', dx1: 90, dy2: 30, via: [[300, 640], [600, 690]] },
  ];

  /** Draws the organ map and returns {update(model), focus(organ)} */
  EP.mountOrganMap = function (container, model, opts = {}) {
    const W = 950, H = 720;
    const svg = s('svg', { class: 'organmap', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Organ flux map' });
    svg.appendChild(EP.svgDefs());
    container.appendChild(svg);
    const gF = s('g'), gO = s('g'), gD = s('g');
    svg.append(gF, gO, gD);
    const fluxEls = [];
    FLUX.forEach((f) => {
      if (f.hide) return;
      const a = anchor(f.from[0], f.from[1]), b = anchor(f.to[0], f.to[1]);
      a[0] += f.dx1 || 0; a[1] += f.dy1 || 0; b[0] += f.dx2 || 0; b[1] += f.dy2 || 0;
      let d;
      if (f.via) d = 'M' + [a, ...f.via, b].map((p) => p.join(',')).join(' L');
      else {
        const c = f.curve || 0; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const qx = mx - (b[1] - a[1]) / len * c, qy = my + (b[0] - a[0]) / len * c;
        d = `M${a[0]},${a[1]} Q${qx},${qy} ${b[0]},${b[1]}`;
      }
      const g = s('g', { class: 'flux-g' });
      const p = s('path', { d, class: 'flux k-' + f.k, 'marker-end': 'url(#m-rxn)' });
      const flow = s('path', { d, class: 'flow' });
      const t = s('text', { class: 'flux-label' }, f.label);
      g.append(p, flow, t);
      g.appendChild(s('title', {}, f.label));
      g.addEventListener('click', () => opts.onPick && opts.onPick(f.bind));
      gF.appendChild(g);
      fluxEls.push({ f, g, p, flow, t, from: f.from[0], to: f.to[0] });
      requestAnimationFrame(() => { try { const L = p.getTotalLength(); const pt = p.getPointAtLength(L * 0.45); t.setAttribute('x', pt.x + 6); t.setAttribute('y', pt.y - 6); } catch (e) { /* hidden */ } });
    });
    const procEls = [];
    const orgEls = {};
    Object.keys(ORG).forEach((k) => {
      const O = ORG[k];
      const g = s('g', { class: 'organ-box', transform: `translate(${O.x},${O.y})` });
      g.appendChild(s('rect', { class: 'ob', width: O.w, height: O.h, rx: 14 }));
      const title = s('text', { class: 'organ-title', x: 12, y: 22 }, O.title);
      g.appendChild(title);
      title.style.cursor = 'pointer';
      title.addEventListener('click', () => focus(k));
      O.procs.forEach(([id, label], i) => {
        const pg = s('g', { class: 'proc', transform: `translate(10,${34 + i * ROWH})` });
        const bw = O.w - 20;
        pg.appendChild(s('rect', { class: 'pbg', width: bw, height: ROWH - 4, rx: 5 }));
        const bar = s('rect', { class: 'pbar', height: ROWH - 4, rx: 5, x: bw / 2, width: 0, opacity: 0.55 });
        pg.appendChild(bar);
        pg.appendChild(s('line', { x1: bw / 2, x2: bw / 2, y1: 0, y2: ROWH - 4, stroke: 'var(--muted)', 'stroke-opacity': 0.4 }));
        pg.appendChild(s('text', { x: 8, y: 13 }, label));
        const sym = s('text', { class: 'psym', x: bw - 8, y: 13, 'text-anchor': 'end' }, '');
        pg.appendChild(sym);
        pg.addEventListener('click', () => opts.onPick && opts.onPick(id));
        g.appendChild(pg);
        procEls.push({ id, bar, sym, bw });
      });
      gO.appendChild(g); orgEls[k] = g;
    });
    let focused = null;
    function focus(k) {
      focused = focused === k ? null : k;
      Object.keys(orgEls).forEach((o) => { orgEls[o].classList.toggle('focus', o === focused); orgEls[o].classList.toggle('dim', !!focused && o !== focused && !fluxEls.some((f) => (f.from === focused && f.to === o) || (f.to === focused && f.from === o))); });
      fluxEls.forEach((f) => f.g.classList.toggle('dim', !!focused && f.from !== focused && f.to !== focused));
      if (opts.onFocus) opts.onFocus(focused);
    }
    function update() {
      procEls.forEach(({ id, bar, sym, bw }) => {
        const r = model.eff(id) / (model.ref[id] || 1); const q = EP.qual(model.eff(id), model.ref[id]);
        const l = EP.clamp(Math.log2(r) / 3, -1, 1);
        bar.setAttribute('x', l >= 0 ? bw / 2 : bw / 2 + l * bw / 2); bar.setAttribute('width', Math.abs(l) * bw / 2);
        bar.setAttribute('class', 'pbar ' + (l >= 0 ? 'pos' : 'neg'));
        sym.textContent = q.sym === '↔' ? '' : q.sym; sym.setAttribute('fill', l >= 0 ? 'var(--up)' : 'var(--dn)');
      });
      fluxEls.forEach(({ f, p, flow }) => {
        const r = model.eff(f.bind) / (model.ref[f.bind] || 1);
        const w = EP.clamp(1.2 + Math.log2(r + 0.15) * 2.4 + 2, 0.6, 11);
        p.style.strokeWidth = w + 'px'; flow.style.strokeWidth = Math.max(1, w * 0.5) + 'px';
        flow.style.animationDuration = (2.6 / EP.clamp(r, 0.12, 6)).toFixed(2) + 's';
        p.style.opacity = r < 0.25 ? 0.25 : 0.85; flow.style.display = r < 0.25 ? 'none' : '';
      });
    }
    return { update, focus, svg };
  };

  // ------------------------------------------------------------------ flux simulator page
  V.flux = function (el, params) {
    el.appendChild(EP.pageHeader('Metabolic flux simulator', 'Change one hormone, nutrient or signal: which pathways speed up or slow down in each organ — and why?', { section: 'Metabolism' }));
    el.appendChild(EP.modelNote('Click any process or arrow for the mechanism. Click an organ\'s name to isolate its cross-talk.'));
    const model = EP.metabolic.create();
    const grid = h('div.sim');
    const left = h('div.sim-left'), center = h('div'), right = h('div.sim-panel.sim-why');
    grid.append(left, center, right);
    el.appendChild(grid);
    const map = EP.mountOrganMap(center, model, { onPick: (id) => explain(id), onFocus: () => {} });
    const knobs = EP.metabolicKnobs(model, () => { map.update(); ticker(); if (cur) explain(cur, true); }, { preset: params.preset });
    left.appendChild(knobs);
    let cur = null;
    const whyBox = h('div'), tick = h('ol.ticker');
    right.append(h('div', h('h4', 'Why?'), whyBox), h('div', h('h4', 'Largest changes vs. reference'), tick));
    whyBox.innerHTML = '<p class="muted small">Click a process bar or a flux arrow.</p>';
    function explain(id, silent) {
      cur = id; const n = model.byId[id];
      const q = EP.qual(model.eff(id), model.ref[id]);
      const chain = model.trace(id);
      whyBox.innerHTML = `<h3>${EP.esc(n.label)} <span class="qual ${q.cls}">${q.sym}</span></h3><p class="small muted">${q.word} vs. reference (qualitative model)</p>` +
        (chain.length > 1 ? `<div class="chain">${chain.map((c) => `<span>${EP.esc(model.byId[c].label)} ${EP.qual(model.eff(c), model.ref[c]).sym}</span>`).join('<i>→</i>')}</div>` : '') + EP.explainHTML(model, id) +
        (n.ent ? `<p><button class="btn" data-ent="${n.ent}">About ${EP.esc((EP.data.entities[n.ent] || {}).name || n.ent)}</button></p>` : '') + (n.note ? `<p class="small">${EP.md(n.note)}</p>` : '');
      const b = whyBox.querySelector('[data-ent]'); if (b) b.onclick = () => EP.showInfo(n.ent, { node: n, model, modelId: id });
    }
    function ticker() {
      const ids = model.nodes.filter((n) => !n.input && !n.hide && n.tier !== 'signal' || ['malonyl', 'acoa', 'cpt1'].includes(n.id)).map((n) => n.id);
      const ch = ids.map((id) => ({ id, l: Math.log2(model.eff(id) / model.ref[id]) })).filter((x) => Math.abs(x.l) > 0.3).sort((a, b) => Math.abs(b.l) - Math.abs(a.l)).slice(0, 12);
      tick.innerHTML = ch.length ? ch.map((x) => { const q = EP.qual(model.eff(x.id), model.ref[x.id]); return `<li><a class="linkish" data-id="${x.id}">${EP.esc(model.byId[x.id].label)}</a> <span class="qual ${q.cls}">${q.sym}</span></li>`; }).join('') : '<li class="muted">At reference.</li>';
      tick.querySelectorAll('[data-id]').forEach((a) => { a.onclick = () => explain(a.dataset.id); });
    }
    el.appendChild(h('h2', { style: { marginTop: '18px' } }, 'Zoom into a pathway (same model)'));
    el.appendChild(h('p', ...[['hepatocyte', 'Liver map'], ['acetylcoa', 'Acetyl-CoA hub'], ['fattyacid', 'Fatty acids & malonyl-CoA'], ['aminoacid', 'Amino acids & urea']].map(([id, l]) => h('a.btn', { href: '#/' + id, style: { marginRight: '8px' } }, l))));
    el.appendChild(EP.sources(['petersen2018', 'cahill2006', 'owen1967', 'richter2013', 'sylow2017', 'mcgarry1980', 'perry2015', 'felig1973', 'kovacs15', 'molina10', 'rui2014']));
  };

  // ------------------------------------------------------------------ What-if
  V.whatif = function (el, params) {
    const M = EP.metabolic;
    el.appendChild(EP.pageHeader('What happens if…?', 'Pick a perturbation. The cascade is generated from the model: stimulus → hormones → signaling → enzymes → pathways → organ outputs → whole body.', { section: 'Explore & Learn' }));
    const bar = h('div.statebar'); const base = h('div.statebar');
    const holdG = h('input', { type: 'checkbox' }), holdI = h('input', { type: 'checkbox' });
    el.append(h('div.card', h('h4', 'Perturbation'), bar, h('h4', 'Starting state'), base,
      h('div', h('label.chk', holdG, ' hold glucose constant (clamp)'), ' ', h('label.chk', holdI, ' hold insulin at basal')), h('p.small.muted', 'Threshold: only variables changing by more than ~15% are drawn. Click a node to see why; hover to trace its inputs.')));
    const note = h('div.net-story'); el.appendChild(note);
    const svgWrap = h('div'); el.appendChild(svgWrap);
    const cols = h('div.grid2'); const story = h('div.card'); const axisBox = h('div');
    cols.append(story, axisBox); el.appendChild(cols);
    let pert = M.perturbations.find((p) => p.id === params.p) || M.perturbations[0];
    let baseP = M.presets[0];
    M.perturbations.forEach((p) => bar.appendChild(h('button.chip' + (p === pert ? '.on' : ''), { onclick: (ev) => { pert = p; bar.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === ev.target)); holdG.checked = !!p.clampGlucose; holdI.checked = !!p.clampInsulin; run(); } }, p.label)));
    M.presets.slice(0, 4).forEach((p, i) => base.appendChild(h('button.chip' + (i ? '' : '.on'), { onclick: (ev) => { baseP = p; base.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === ev.target)); run(); } }, p.label)));
    holdG.checked = !!pert.clampGlucose; holdI.checked = !!pert.clampInsulin;
    holdG.onchange = run; holdI.onchange = run;
    const mRef = M.create(), m = M.create();
    function run() {
      mRef.applyPreset({ inputs: baseP.inputs }); mRef.solve();
      const ap = pert.apply;
      m.applyPreset({ inputs: Object.assign({}, baseP.inputs, ap.inputs || {}), exo: ap.exo, clamps: ap.clamps, caps: ap.caps });
      if (holdG.checked) m.clamps.glucose = mRef.eff('glucose');
      if (holdI.checked) m.clamps.insulin = mRef.eff('insulin');
      m.solve();
      // relative to the starting state
      m.ref = Object.assign({}, mRef.last || mRef.solve());
      note.innerHTML = `<strong>${EP.esc(pert.label)}</strong> starting from <em>${EP.esc(baseP.label)}</em>. ${pert.note ? EP.md(pert.note) : ''}`;
      drawCascade();
      writeStory();
      EP.clear(axisBox);
      if (pert.axis) {
        axisBox.appendChild(h('div.card', h('h3', 'Feedback consequence: ' + EP.networks[pert.axis].title), h('div', { id: 'wf-axis' })));
        const api = EP.mountNetwork(axisBox.querySelector('#wf-axis'), pert.axis); api.choose(pert.axisPreset);
      }
    }
    function drawCascade() {
      EP.clear(svgWrap);
      const tiers = M.tiers;
      const focusIds = [pert.focus];
      const chg = (id) => Math.log2(m.eff(id) / (m.ref[id] || 1));
      const shown = m.nodes.filter((n) => !n.hide && (Math.abs(chg(n.id)) > 0.2 || focusIds.includes(n.id) || (pert.apply.inputs && n.id in pert.apply.inputs)));
      // perturbed inputs shown as stimulus
      const byTier = {}; tiers.forEach((t) => { byTier[t] = []; });
      shown.forEach((n) => { (byTier[n.tier] || byTier.pathway).push(n); });
      const order = ['liver', 'muscle', 'adipose', 'brain', 'kidney', 'pancreas', 'adrenal', 'pituitary', 'gut', 'systemic'];
      Object.values(byTier).forEach((arr) => arr.sort((a, b) => order.indexOf(a.organ) - order.indexOf(b.organ) || Math.abs(chg(b.id)) - Math.abs(chg(a.id))));
      const colW = 190, rowH = 34, top = 40;
      const maxRows = Math.max(...Object.values(byTier).map((a) => a.length), 1);
      const W = tiers.length * colW + 20, H = top + maxRows * rowH + 20;
      const svg = s('svg', { class: 'cascade', viewBox: `0 0 ${W} ${H}` });
      svg.appendChild(EP.svgDefs());
      const pos = {};
      tiers.forEach((t, i) => {
        svg.appendChild(s('text', { x: 10 + i * colW + 8, y: 22, class: 'tierlabel' }, M.tierLabels[t]));
        byTier[t].forEach((n, j) => { pos[n.id] = [10 + i * colW, top + j * rowH]; });
      });
      const gE = s('g'), gN = s('g'); svg.append(gE, gN);
      const edges = [];
      // stimulus pseudo-node: the perturbation itself
      if (!byTier.input.length) {
        const sx = 10, sy = top;
        const g = s('g', { class: 'cnode focus up', transform: `translate(${sx},${sy})` });
        g.appendChild(s('rect', { width: colW - 22, height: 26, rx: 7 })); g.appendChild(s('text', { x: 8, y: 17 }, pert.label + (pert.apply.exo ? ' (infusion)' : pert.apply.clamps ? ' (clamp)' : '')));
        gN.appendChild(g);
        if (pos[pert.focus]) { const b = pos[pert.focus]; gE.appendChild(s('path', { d: `M${sx + colW - 22},${sy + 13} C${sx + colW + 10},${sy + 13} ${b[0] - 30},${b[1] + 13} ${b[0]},${b[1] + 13}`, class: 'cedge pushup hl', 'marker-end': 'url(#m-stim)' })); }
      }
      shown.forEach((n) => {
        const scored = (n.terms || []).filter((t) => t.src && pos[t.src]).map((t) => ({ t, score: n.mode === 'sum' ? t.c * (m.eff(t.src) - m.ref[t.src]) : m.weight(n, t) * Math.log(m.seen(n, t) / (m.ref[t.src] || 1)) }))
          .filter((x) => Math.abs(x.score) >= 0.08).sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 2);
        scored.forEach(({ t, score }) => {
          const a = pos[t.src], b = pos[n.id];
          const x1 = a[0] + colW - 22, y1 = a[1] + 13, x2 = b[0], y2 = b[1] + 13;
          const back = x2 <= x1;
          const d = back ? `M${x1},${y1} C${x1 + 40},${y1 - 60} ${x2 - 40},${y2 - 60} ${x2},${y2}` : `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`;
          const p = s('path', { d, class: 'cedge ' + (score > 0 ? 'pushup' : 'pushdn'), 'marker-end': `url(#m-${(n.mode === 'sum' ? t.c : m.weight(n, t)) < 0 ? 'inhib' : 'stim'})` });
          p.appendChild(s('title', {}, `${m.byId[t.src].label} → ${n.label}: ${t.why || ''}`));
          gE.appendChild(p); edges.push({ p, from: t.src, to: n.id });
        });
      });
      shown.forEach((n) => {
        const [x, y] = pos[n.id]; const l = chg(n.id); const q = EP.qual(m.eff(n.id), m.ref[n.id]);
        const g = s('g', { class: `cnode ${l > 0.2 ? 'up' : l < -0.2 ? 'dn' : ''} ${focusIds.includes(n.id) ? 'focus' : ''}`, transform: `translate(${x},${y})` });
        g.appendChild(s('rect', { width: colW - 22, height: 26, rx: 7 }));
        const lab = n.label.length > 24 ? n.label.slice(0, 23) + '…' : n.label;
        g.appendChild(s('text', { x: 8, y: 17 }, lab));
        g.appendChild(s('text', { x: colW - 30, y: 17, 'text-anchor': 'end', class: 'csym' }, q.sym));
        g.appendChild(s('title', {}, `${n.label}: ${q.word} — ${M.organs[n.organ] || ''}`));
        g.addEventListener('mouseenter', () => edges.forEach((e) => { const on = e.to === n.id || e.from === n.id; e.p.classList.toggle('hl', on); e.p.classList.toggle('dim', !on); }));
        g.addEventListener('mouseleave', () => edges.forEach((e) => { e.p.classList.remove('hl', 'dim'); }));
        g.addEventListener('click', () => {
          const chain = m.trace(n.id);
          EP.showInfoHTML(`<div class="info-type t-process"><i></i>${EP.esc(M.organs[n.organ] || '')} · ${EP.esc(M.tierLabels[n.tier])}</div><h3>${EP.esc(n.label)} <span class="qual ${q.cls}">${q.sym}</span></h3>` +
            (chain.length > 1 ? `<div class="why-head">Causal chain from the perturbation</div><div class="chain">${chain.map((c) => `<span>${EP.esc(m.byId[c].label)} ${EP.qual(m.eff(c), m.ref[c]).sym}</span>`).join('<i>→</i>')}</div>` : '') +
            EP.explainHTML(m, n.id) + (n.ent && EP.data.entities[n.ent] ? `<p><a class="ent-link" data-ent="${n.ent}">About ${EP.esc(EP.data.entities[n.ent].name)}</a></p>` : ''));
        });
        gN.appendChild(g);
      });
      svgWrap.appendChild(svg);
    }
    function writeStory() {
      const lines = [];
      const pick = (tier, n) => m.nodes.filter((x) => x.tier === tier && !x.hide && Math.abs(Math.log2(m.eff(x.id) / m.ref[x.id])) > 0.25).sort((a, b) => Math.abs(Math.log2(m.eff(b.id) / m.ref[b.id])) - Math.abs(Math.log2(m.eff(a.id) / m.ref[a.id]))).slice(0, n);
      ['hormone', 'signal', 'enzyme', 'pathway', 'output', 'systemic'].forEach((tier) => pick(tier, tier === 'pathway' ? 5 : 3).forEach((n) => {
        const q = EP.qual(m.eff(n.id), m.ref[n.id]); const e = m.explain(n.id).filter((x) => x.src && Math.abs(x.score) > 0.05)[0];
        lines.push(`<li><strong>${EP.esc(n.label)}</strong> <span class="qual ${q.cls}">${q.sym}</span>${e ? ' — because ' + EP.esc(m.byId[e.src].label) + ' ' + EP.qual(m.eff(e.src), m.ref[e.src]).sym + (e.term.why ? ': ' + EP.md(e.term.why) : '') : ''}</li>`);
      }));
      story.innerHTML = `<h3>The story, step by step</h3><ol class="story">${lines.join('') || '<li>No substantial change.</li>'}</ol>`;
    }
    run();
    el.appendChild(EP.modelNote());
    el.appendChild(EP.sources(['petersen2018', 'ramnanan2011', 'perry2015', 'perry2020', 'mcgarry1980', 'cahill2006', 'albrechtsen2019', 'richter2013']));
  };

  // ------------------------------------------------------------------ Compare
  V.compare = function (el, params) {
    el.appendChild(EP.pageHeader('Compare', 'Put two states side by side and see exactly which mechanisms differ.', { section: 'Explore & Learn' }));
    const tabs = h('div.tabs'); const slot = h('div');
    const list = [['states', 'Fed vs. fasting (any two states)'], ['hormones', 'Insulin vs. glucagon vs. cortisol'], ['failure', 'Primary vs. secondary failure'], ['glut4', 'Insulin vs. exercise GLUT4']];
    list.forEach(([id, l]) => tabs.appendChild(h('button', { 'data-id': id, onclick: () => show(id) }, l)));
    el.append(tabs, slot);
    function show(id) {
      tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
      EP.teardown(); EP.clear(slot);
      ({ states: cmpStates, hormones: cmpHormones, failure: cmpFailure, glut4: cmpGlut4 })[id](slot);
    }
    show(params.t || 'states');
  };
  const KEY = [['Hormones', ['insulin', 'glucagon', 'epi', 'cortisol', 'gh']], ['Blood', ['glucose', 'ffa', 'ketones', 'lactate', 'aa']], ['Liver', ['h_glycogenolysis', 'gng', 'h_glycogenesis', 'h_glycolysis', 'dnl', 'malonyl', 'h_fao', 'ketogenesis', 'urea']], ['Muscle', ['m_glut4', 'm_uptake', 'm_glycogenesis', 'm_glycogenolysis', 'm_fao', 'm_protsyn', 'm_proteolysis']], ['Adipose', ['a_uptake', 'esterif', 'lipolysis']], ['Brain', ['brainglc', 'brainket']]];
  function minibar(r) { const lg = EP.clamp(Math.log2(r) / 3, -1, 1); return `<span class="minibar"><i style="left:${lg >= 0 ? 50 : 50 + lg * 50}%;width:${Math.abs(lg) * 50}%;background:${lg >= 0 ? 'var(--up)' : 'var(--dn)'}"></i></span>`; }
  function cmpStates(el) {
    const M = EP.metabolic; const a = M.create(), b = M.create();
    let A = M.presets.find((p) => p.id === 'fed'), B = M.presets.find((p) => p.id === 'early');
    const selA = h('select.btn', { onchange: () => { A = M.presets[selA.value]; run(); } }, M.presets.map((p, i) => h('option', { value: i, selected: p === A }, p.label)));
    const selB = h('select.btn', { onchange: () => { B = M.presets[selB.value]; run(); } }, M.presets.map((p, i) => h('option', { value: i, selected: p === B }, p.label)));
    const t = h('table.cmp-table');
    el.append(h('div.card', h('p', 'State A ', selA, '  vs.  State B ', selB), t, EP.modelNote()));
    function run() {
      a.applyPreset({ inputs: A.inputs }); a.solve(); b.applyPreset({ inputs: B.inputs }); b.solve();
      t.innerHTML = `<tr><th>Organ</th><th>Variable</th><th>A</th><th>B</th><th>B vs A</th><th>Why (in B)</th></tr>` + KEY.map(([org, ids]) => ids.map((id, i) => {
        const ra = a.eff(id) / a.ref[id], rb = b.eff(id) / b.ref[id]; const q = EP.qual(rb, ra); const e = b.explain(id).filter((x) => x.src)[0];
        return `<tr><td>${i ? '' : org}</td><td>${EP.esc(a.byId[id].label)}</td><td>${minibar(ra)}</td><td>${minibar(rb)}</td><td class="qual ${q.cls}">${q.sym}</td><td class="small muted">${e && Math.abs(e.score) > 0.05 ? EP.esc(b.byId[e.src].label) + ' ' + EP.qual(b.eff(e.src), b.ref[e.src]).sym : ''}</td></tr>`;
      }).join('')).join('');
    }
    run();
  }
  function cmpHormones(el) {
    const M = EP.metabolic; const ps = ['ins_up', 'gcg_up', 'cort_up', 'epi_up', 'gh_up'].map((id) => M.perturbations.find((p) => p.id === id));
    const ms = ps.map((p) => { const m = M.create(); m.applyPreset(p.apply); if (p.clampGlucose) m.clamps.glucose = 1; if (p.clampInsulin) m.clamps.insulin = 1; m.solve(); return m; });
    const t = h('table.cmp-table');
    t.innerHTML = `<tr><th>Organ</th><th>Variable</th>${ps.map((p) => `<th>${EP.esc(p.label)}</th>`).join('')}</tr>` + KEY.slice(1).map(([org, ids]) => ids.map((id, i) => `<tr><td>${i ? '' : org}</td><td>${EP.esc(ms[0].byId[id].label)}</td>${ms.map((m) => { const q = EP.qual(m.eff(id), m.ref[id]); return `<td class="qual ${q.cls}">${q.sym}</td>`; }).join('')}</tr>`).join('')).join('');
    el.append(h('div.card', h('p.small.muted', 'Each column is a separate infusion from the post-absorptive state. ↑ Insulin is shown with glucose clamped and ↑ Glucagon with insulin held basal, to isolate each hormone\'s direct actions.'), t, h('p', { html: EP.md('**Read across:** insulin and glucagon are mirror images in liver; cortisol shares glucagon\'s gluconeogenic direction but acts slowly (transcription) and adds proteolysis; epinephrine is the only one that strongly drives *muscle* glycogenolysis; GH is lipolytic and insulin-antagonistic.') })));
  }
  function cmpFailure(el) {
    const pairs = [['hpa', 'primary', 'secondary'], ['hpt', 'primary', 'secondary'], ['hpgm', 'klinefelter', 'secondary']];
    let i = 0;
    const sel = h('div.statebar', pairs.map((p, j) => h('button.chip' + (j ? '' : '.on'), { onclick: (ev) => { i = j; sel.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === ev.target)); run(); } }, EP.networks[p[0]].title)));
    const grid = h('div.grid2');
    el.append(sel, grid);
    function run() {
      EP.teardown(); EP.clear(grid);
      const [net, a, b] = pairs[i];
      const A = h('div'), B = h('div'); grid.append(A, B);
      EP.mountNetwork(A, net).choose(a); EP.mountNetwork(B, net).choose(b);
    }
    run();
  }
  function cmpGlut4(el) {
    const grid = h('div.grid2'); el.appendChild(grid);
    const A = h('div', h('h3', 'Insulin route')), B = h('div', h('h3', 'Contraction route'));
    grid.append(A, B);
    EP.mountGlut4(A, { insulin: true, compact: true, lockRoute: 'insulin' });
    EP.mountGlut4(B, { exercise: true, compact: true });
  }
})();
