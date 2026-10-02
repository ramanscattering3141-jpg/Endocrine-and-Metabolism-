/* Pituitary integration map: hypothalamus → pituitary cell types → hormones → organ systems,
 * with cross-axis interactions and step-through scenarios. Data in js/data/pituitary.js. */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;
  const V = (EP.views = EP.views || {});
  const P = () => EP.data.pit;
  const AX = ['gh', 'prl', 'hpa', 'hpt', 'hpg', 'post'];
  const COL = { hyp: { x: 20, w: 150 }, cells: { x: 222, w: 172 }, horm: { x: 470, w: 176 }, sys: { x: 870, w: 196 } };
  const W = 1086, TOP = 64, BAND = 78, NH = 34;

  function layout() {
    const p = P(), pos = {};
    const axY = (a) => TOP + AX.indexOf(a) * BAND;
    AX.forEach((a) => {
      const hy = p.hyp.filter((n) => n.axis === a);
      hy.forEach((n, i) => { const hh = hy.length > 1 ? 30 : NH; pos[n.id] = { col: 'hyp', y: axY(a) + (hy.length > 1 ? (i ? 18 : -18) : 0), h: hh, n }; });
    });
    p.cells.forEach((n) => (pos[n.id] = { col: 'cells', y: axY(n.axis), h: NH, n }));
    p.horm.forEach((n) => (pos[n.id] = { col: 'horm', y: axY(n.axis), h: NH, n }));
    const span = (AX.length - 1) * BAND, step = span / (p.sys.length - 1);
    p.sys.forEach((n, i) => (pos[n.id] = { col: 'sys', y: TOP + i * step, h: 30, n }));
    Object.values(pos).forEach((q) => { q.x = COL[q.col].x; q.w = COL[q.col].w; });
    return pos;
  }
  const L = (q) => [q.x, q.y], R = (q) => [q.x + q.w, q.y];
  const curve = (a, b, bend) => { const dx = (b[0] - a[0]) * (bend || 0.5); return `M${a[0]},${a[1]} C${a[0] + dx},${a[1]} ${b[0] - dx},${b[1]} ${b[0]},${b[1]}`; };
  const back = (a, b) => { const mx = (a[0] + b[0]) / 2; return `M${a[0]},${a[1]} C${mx},${a[1]} ${mx},${b[1]} ${b[0]},${b[1]}`; };
  const axisOf = (id) => { const p = P(); const n = [...p.hyp, ...p.cells, ...p.horm].find((x) => x.id === id); return n && n.axis; };

  EP.mountPitMap = function (host, opts = {}) {
    const p = P(), pos = layout();
    const H = TOP + (AX.length - 1) * BAND + 66;
    const svg = s('svg', { class: 'pitmap', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Pituitary integration map' });
    // column headings
    [['hyp', 'Hypothalamus'], ['cells', 'Anterior / posterior pituitary'], ['horm', 'Peripheral hormone'], ['sys', 'Organ systems']].forEach(([c, t]) =>
      svg.appendChild(s('text', { x: COL[c].x + COL[c].w / 2, y: 22, class: 'pm-head', 'text-anchor': 'middle' }, t)));
    // axis bands
    AX.forEach((a, i) => svg.appendChild(s('rect', { x: 8, y: TOP + i * BAND - BAND / 2 + 3, width: COL.horm.x + COL.horm.w + 8, height: BAND - 6, rx: 10, class: 'pm-band', style: `--ax: var(--tr${i})` })));
    // portal / stalk marker between hypothalamus and pituitary
    const gBase = s('g', { class: 'pm-base' }), gLive = s('g', { class: 'pm-live' }), gNodes = s('g'), gDots = s('g');
    svg.append(gBase, gLive, gNodes, gDots);
    const axColor = (a) => `var(--tr${AX.indexOf(a)})`;
    // static chain lines: hyp → cell → horm
    const chain = [];
    p.hyp.forEach((n) => { const cell = p.cells.find((c) => c.axis === n.axis); chain.push({ a: n.id, b: cell.id, sign: n.sign, axis: n.axis }); });
    p.cells.forEach((c) => { const hm = p.horm.find((x) => x.axis === c.axis); chain.push({ a: c.id, b: hm.id, sign: '+', axis: c.axis }); });
    const chainEls = chain.map((e) => {
      const d = curve(R(pos[e.a]), L(pos[e.b]));
      const el = s('path', { d, class: 'pm-chain' + (e.sign === '−' ? ' neg' : ''), style: `--ax:${axColor(e.axis)}`, 'marker-end': e.sign === '−' ? 'url(#pm-tee)' : 'url(#pm-arr)' });
      gBase.appendChild(el); return { e, el, d };
    });
    const defs = s('defs');
    defs.innerHTML = '<marker id="pm-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="context-stroke"/></marker>' +
      '<marker id="pm-tee" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M8,0 L8,10" stroke="context-stroke" stroke-width="2.6"/></marker>';
    svg.insertBefore(defs, svg.firstChild);
    // nodes
    const nodeEls = {};
    Object.entries(pos).forEach(([id, q]) => {
      const a = q.n.axis;
      const g = s('g', { class: 'pm-node c-' + q.col, tabindex: 0, role: 'button', 'data-id': id, style: a ? `--ax:${axColor(a)}` : '' });
      g.appendChild(s('rect', { x: q.x, y: q.y - q.h / 2, width: q.w, height: q.h, rx: q.col === 'sys' ? 15 : 8 }));
      const label = q.n.label + (q.n.sign && q.col === 'hyp' ? (q.n.sign === '−' ? '  (⊣)' : '') : '');
      g.appendChild(s('text', { x: q.x + (q.col === 'sys' ? 14 : q.w / 2), y: q.y + 4, 'text-anchor': q.col === 'sys' ? 'start' : 'middle' }, label));
      const badge = s('text', { class: 'pm-badge', x: q.x + q.w - 12, y: q.y + 5, 'text-anchor': 'middle' }, '');
      g.appendChild(badge);
      g.addEventListener('click', () => opts.onNode && opts.onNode(id, q.col));
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); opts.onNode && opts.onNode(id, q.col); } });
      gNodes.appendChild(g); nodeEls[id] = { g, badge, q };
    });
    // stalk annotation
    svg.appendChild(s('text', { x: (COL.hyp.x + COL.hyp.w + COL.cells.x) / 2, y: H - 12, class: 'pm-note', 'text-anchor': 'middle' }, 'portal blood · stalk axons'));
    svg.appendChild(s('text', { x: (COL.horm.x + COL.horm.w + COL.sys.x) / 2, y: H - 12, class: 'pm-note', 'text-anchor': 'middle' }, 'systemic circulation'));
    host.appendChild(svg);
    host.appendChild(EP.colorKey([
      ['Band colour = axis', AX.map((a, i) => ({ band: `var(--tr${i})`, label: p.axisNames[a] }))],
      ['Arrows', [{ line: 'var(--tr2)', marker: 'stim', label: 'Within an axis: releasing hormone → cell → hormone' }, { line: 'var(--tr0)', dash: '4 3', label: 'Inhibitory hypothalamic hormone (somatostatin, dopamine)' }, { line: 'var(--tr4)', w: 1.6, label: 'Hormone → organ system (axis colour)' }, { line: 'var(--c-stim)', dash: '6 4', label: 'Cross-axis: stimulates' }, { line: 'var(--c-inhib)', dash: '6 4', label: 'Cross-axis: inhibits' }]],
      ['Scenario marks', [{ fill: 'var(--panel)', stroke: 'var(--up)', sw: 2.6, label: '↑ raised' }, { fill: 'var(--panel)', stroke: 'var(--dn)', sw: 2.6, label: '↓ lowered' }, { dot: 'var(--tr1)', label: 'Moving dots = hormone travelling' }, { fill: 'var(--panel)', stroke: 'var(--accent)', sw: 2.4, rx: 9, label: 'Organ system reached by the selected hormone' }, { fill: 'var(--panel)', stroke: 'var(--line)', rx: 9, label: 'Faded = not involved' }]],
    ]));

    // ---- dynamic layer
    let dots = [];
    const stop = EP.loop((dt) => dots.forEach((d) => { d.t = (d.t + dt * d.v) % 1; const pt = d.p.getPointAtLength(d.t * d.len); d.c.setAttribute('cx', pt.x); d.c.setAttribute('cy', pt.y); }));
    EP.onTeardown && EP.onTeardown(stop);
    function addLive(d, cls, color, n, label) {
      const el = s('path', { d, class: 'pm-link ' + cls, style: `--ax:${color}`, 'marker-end': cls.includes('neg') ? 'url(#pm-tee)' : 'url(#pm-arr)' });
      gLive.appendChild(el);
      if (label) el.appendChild(s('title', {}, label));
      const len = el.getTotalLength();
      for (let i = 0; i < (n || 2); i++) { const c = s('circle', { r: 3.4, class: 'pm-dot', style: `fill:${color}` }); gDots.appendChild(c); dots.push({ c, p: el, len, t: i / (n || 2), v: 140 / Math.max(len, 80) * 0.5 }); }
      return el;
    }
    function highlight(st) {
      EP.clear(gLive); EP.clear(gDots); dots = [];
      st = st || {};
      const on = new Set(st.nodes || []);
      svg.classList.toggle('has-sel', on.size > 0);
      Object.entries(nodeEls).forEach(([id, ne]) => {
        ne.g.classList.toggle('on', on.has(id));
        ne.g.classList.toggle('sel', st.sel === id);
        const m = (st.marks || {})[id];
        ne.g.classList.toggle('up', m === 'up'); ne.g.classList.toggle('down', m === 'down');
        ne.badge.textContent = m === 'up' ? '↑' : m === 'down' ? '↓' : '';
      });
      chainEls.forEach(({ e, el, d }) => {
        const live = (st.axes || []).includes(e.axis);
        el.classList.toggle('on', live);
        if (live) addLive(d, 'chain' + (e.sign === '−' ? ' neg' : ''), axColor(e.axis), 2);
      });
      (st.effects || []).forEach((ef) => {
        const hm = p.horm.find((x) => x.id === ef.h);
        addLive(curve(R(pos[ef.h]), L(pos[ef.sys]), 0.45), 'fx', axColor(hm.axis), 2, ef.effect);
      });
      (st.cross || []).forEach((x) => {
        const from = pos[x.from], to = pos[x.to];
        const d = from.col === 'horm' && to.col === 'cells' ? back(L(from), R(to)) : curve(R(from), L(to));
        addLive(d, 'cross' + (x.sign === '−' ? ' neg' : ' pos'), x.sign === '−' ? 'var(--c-inhib)' : 'var(--c-stim)', 2, x.why);
      });
    }
    highlight({});
    return { highlight, pos };
  };

  // ------------------------------------------------------------------ page
  V.pituitaryMap = function (el, params) {
    const p = P();
    el.appendChild(EP.pageHeader('Pituitary integration map', 'Six pituitary axes, one body: how does each axis reach the organ systems — and how do the axes talk to each other?', {
      section: 'Hypothalamus & Pituitary',
      lede: 'Feedback loops keep each axis stable, but the axes are **not independent**: cortisol, thyroid hormone, prolactin and sex steroids each reset other axes. Click any box to see its reach, or run a **scenario** step by step.' }));
    const modes = h('div.statebar');
    const grid = h('div.pm-layout'); const left = h('div.card.pm-wrap'); const right = h('div.sim-panel.pm-panel');
    grid.append(left, right); el.append(modes, grid);
    let mode = 'explore', sc = null, step = 0, timer = null;
    const map = EP.mountPitMap(left, { onNode: (id, col) => { if (mode !== 'explore') setMode('explore'); select(id, col); } });
    const ctrl = h('div.pm-ctrl');
    left.appendChild(ctrl);
    const btn = (k, t) => h('button.chip', { 'data-k': k, onclick: () => (k === 'explore' ? setMode('explore') : startScenario(k)) }, t);
    modes.append(btn('explore', '🔎 Explore'), h('span.muted.small', { style: 'align-self:center;margin:0 4px' }, 'Scenarios:'), ...p.scenarios.map((x) => btn(x.id, x.label)));
    function setChips(k) { modes.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', b.dataset.k === k)); }
    function setMode(m) { mode = m; clearInterval(timer); timer = null; if (m === 'explore') { sc = null; setChips('explore'); EP.clear(ctrl); const s0 = params.sel || 'cort'; select(s0, p.sys.some((x) => x.id === s0) ? 'sys' : 'horm'); } }

    const sysLabel = (id) => (p.sys.find((x) => x.id === id) || {}).label || id;
    const hormLabel = (id) => (p.horm.find((x) => x.id === id) || {}).label || id;
    const nodeLabel = (id) => { const n = [...p.hyp, ...p.cells, ...p.horm, ...p.sys].find((x) => x.id === id); return n ? n.label : id; };

    function select(id, col) {
      if (col === 'sys') {
        const fx = p.effects.filter((e) => e.sys === id);
        const axes = [...new Set(fx.map((e) => axisOf(e.h)))];
        map.highlight({ sel: id, nodes: [id, ...fx.map((e) => e.h)], effects: fx, axes: [] });
        right.innerHTML = `<div class="why-head">Organ system</div><h3>${EP.esc(sysLabel(id))}</h3><p class="small muted">${axes.length} pituitary axes act here.</p><ul class="keypoints">${fx.map((e) => `<li><strong style="color:var(--tr${AX.indexOf(axisOf(e.h))})">${EP.esc(hormLabel(e.h))}</strong> — ${EP.md(e.effect)}${e.mech ? `<div class="small muted">${EP.md(e.mech)}</div>` : ''}</li>`).join('')}</ul>`;
        return;
      }
      const a = axisOf(id);
      const hm = p.horm.find((x) => x.axis === a), cell = p.cells.find((x) => x.axis === a);
      const fx = p.effects.filter((e) => e.h === hm.id);
      const out = p.cross.filter((x) => x.from === hm.id || (a === 'gh' && x.from === 'sst') || (a === 'prl' && x.from === 'da'));
      const inn = p.cross.filter((x) => x.to === cell.id);
      const hyp = p.hyp.filter((x) => x.axis === a);
      map.highlight({ sel: id, axes: [a], nodes: [...hyp.map((x) => x.id), cell.id, hm.id, ...fx.map((e) => e.sys), ...out.map((x) => x.to), ...inn.map((x) => x.from)], effects: fx, cross: [...out, ...inn] });
      const li = (x, dir) => `<li><span class="${x.sign === '−' ? 'bad' : 'ok'}">${x.sign === '−' ? '⊣' : '→'}</span> <strong>${EP.esc(dir === 'out' ? nodeLabel(x.to) : nodeLabel(x.from))}</strong><div class="small muted">${EP.md(x.why)}</div></li>`;
      right.innerHTML = `<div class="why-head" style="color:var(--tr${AX.indexOf(a)})">${EP.esc(p.axisNames[a])} axis</div><h3>${EP.esc(hm.label)}</h3>
        <p class="small">${hyp.map((x) => `${EP.esc(x.label)} (${x.sign === '−' ? 'inhibits' : 'stimulates'})`).join(' · ')} → ${EP.esc(cell.label)}</p>
        <h4>Effects on organ systems</h4><ul class="keypoints">${fx.map((e) => `<li><strong>${EP.esc(sysLabel(e.sys))}</strong> — ${EP.md(e.effect)}${e.mech ? `<div class="small muted">${EP.md(e.mech)}</div>` : ''}</li>`).join('')}</ul>
        ${out.length ? `<h4>Acts on other axes</h4><ul class="keypoints">${out.map((x) => li(x, 'out')).join('')}</ul>` : ''}
        ${inn.length ? `<h4>Influenced by</h4><ul class="keypoints">${inn.map((x) => li(x, 'in')).join('')}</ul>` : ''}
        <p><a class="btn" href="#/${p.axisPage[a]}">Open the ${EP.esc(p.axisNames[a])} simulator →</a></p>`;
    }

    function startScenario(k) {
      mode = 'scenario'; clearInterval(timer); timer = null;
      sc = p.scenarios.find((x) => x.id === k); step = 0; setChips(k); renderStep();
    }
    function renderStep() {
      const marks = {}; const cross = []; const nodes = new Set();
      sc.steps.slice(0, step + 1).forEach((st, i) => {
        Object.assign(marks, st.marks); Object.keys(st.marks).forEach((n) => nodes.add(n));
        if (i === step) st.links.forEach(([f, t]) => { const x = p.cross.find((c) => c.from === f && c.to === t); if (x) cross.push(x); });
      });
      const cur = sc.steps[step];
      const axes = [...new Set(Object.keys(cur.marks).map(axisOf).filter(Boolean))];
      // effects of hormones changed in this step on the systems marked in this step
      const sysNow = Object.keys(cur.marks).filter((n) => p.sys.some((x) => x.id === n));
      const hormNow = Object.keys(marks).filter((n) => p.horm.some((x) => x.id === n));
      const effects = p.effects.filter((e) => sysNow.includes(e.sys) && hormNow.includes(e.h));
      map.highlight({ marks, nodes: [...nodes], cross, axes, effects });
      EP.clear(ctrl);
      ctrl.append(
        h('button.btn', { disabled: step === 0, onclick: () => { step--; renderStep(); } }, '◀ Back'),
        h('span.pm-step', `Step ${step + 1} / ${sc.steps.length}`),
        h('button.btn.primary', { disabled: step === sc.steps.length - 1, onclick: () => { step++; renderStep(); } }, 'Next ▶'),
        h('button.btn', { onclick: () => { if (timer) { clearInterval(timer); timer = null; renderStep(); return; } step = 0; renderStep(); timer = setInterval(() => { if (step >= sc.steps.length - 1) { clearInterval(timer); timer = null; renderStep(); return; } step++; renderStep(); }, 3200); } }, timer ? '■ Stop' : '▶ Play'));
      right.innerHTML = `<div class="why-head">Scenario · ${EP.esc(sc.src)}</div><h3>${EP.esc(sc.label)}</h3>
        <ol class="pm-steps">${sc.steps.map((st, i) => `<li class="${i === step ? 'cur' : i < step ? 'done' : 'todo'}" data-i="${i}">${EP.md(st.text)}</li>`).join('')}</ol>
        <p class="small muted">↑/↓ badges accumulate across steps; green/red curved arrows are cross-axis effects introduced in the current step.</p>`;
      right.querySelectorAll('.pm-steps li').forEach((li) => li.addEventListener('click', () => { step = +li.dataset.i; renderStep(); }));
    }
    EP.onTeardown(() => clearInterval(timer));
    if (params.scenario) startScenario(params.scenario); else setMode('explore');
    el.appendChild(h('h2', { style: { marginTop: '18px' } }, 'Animated: how hypothalamic signals reach the pituitary'));
    EP.anim.hp && EP.anim.hp(el);
    // Legend / reading guide
    el.appendChild(h('div.card', { html: `<h3>Reading the map</h3><ul class="keypoints">
      <li>Each coloured band is one axis. Arrows run hypothalamus → pituitary cell → hormone; a <strong>⊣</strong> bar marks inhibition (somatostatin, dopamine).</li>
      <li>Lines to the right show <strong>where the hormone acts</strong>; curved green (→) or red (⊣) arrows that loop back are <strong>cross-axis effects</strong>.</li>
      <li>This is a qualitative map of documented interactions, not a quantitative model. Use each axis simulator for feedback dynamics.</li></ul>` }));
    el.appendChild(EP.sources(['kovacs5', 'kovacs11', 'kovacs12', 'kovacs13', 'molina3', 'molina4', 'molina9', 'molina10', 'freeman2000', 'bianco2002'].filter((r) => EP.data.refs[r])));
  };

  // ------------------------------------------------------------------ "systems effects" card for axis pages
  EP.pitSystemsCard = function (netId) {
    const p = P(); if (!p) return null;
    const a = { hpa: 'hpa', hpt: 'hpt', hpgm: 'hpg', hpgf: 'hpg', gh: 'gh', prl: 'prl', adh: 'post' }[netId];
    if (!a) return null;
    const hm = p.horm.find((x) => x.axis === a), cell = p.cells.find((x) => x.axis === a);
    const fx = p.effects.filter((e) => e.h === hm.id);
    const out = p.cross.filter((x) => x.from === hm.id), inn = p.cross.filter((x) => x.to === cell.id);
    const nm = (id) => { const n = [...p.hyp, ...p.cells, ...p.horm].find((x) => x.id === id); return n ? n.label : id; };
    const sys = (id) => p.sys.find((x) => x.id === id).label;
    return h('div.card.pm-card', { html: `<h2>Beyond the feedback loop: ${EP.esc(p.axisNames[a])} and the rest of the body</h2>
      <div class="grid2"><div><h4>Organ-system effects</h4><ul class="keypoints">${fx.map((e) => `<li><strong>${EP.esc(sys(e.sys))}</strong> — ${EP.md(e.effect)}</li>`).join('')}</ul></div>
      <div>${out.length ? `<h4>Resets other axes</h4><ul class="keypoints">${out.map((x) => `<li>${x.sign === '−' ? '⊣' : '→'} <strong>${EP.esc(nm(x.to))}</strong>: ${EP.md(x.why)}</li>`).join('')}</ul>` : ''}
      ${inn.length ? `<h4>Reset by other axes</h4><ul class="keypoints">${inn.map((x) => `<li>${x.sign === '−' ? '⊣' : '→'} from <strong>${EP.esc(nm(x.from))}</strong>: ${EP.md(x.why)}</li>`).join('')}</ul>` : ''}
      <p><a class="btn" href="#/pitmap?sel=${hm.id}">Open the pituitary integration map →</a></p></div></div>` });
  };
})();
