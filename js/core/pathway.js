/* Reusable interactive pathway renderer.
 * Renders any EP.pathways[id] definition as a zoomable/pannable SVG with:
 *  - typed node shapes (hormone/receptor/enzyme/metabolite/…) and typed edges
 *  - level-of-detail filtering (L1–L4) without moving nodes (diagram stays recognizable)
 *  - layer toggles, click-to-explain nodes, click-to-ask-"why" on edges
 *  - live activity propagation from input sliders (via EP.Model)
 *  - clinical "what goes wrong" overlays, walk-through mode, follow-the-molecule, quiz mode
 */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;

  const SIZE = {
    hormone: [112, 40], receptor: [124, 40], enzyme: [128, 34], kinase: [104, 34], protein: [110, 34],
    metabolite: [112, 32], process: [150, 36], organ: [170, 60], cell: [170, 60], tf: [116, 34],
    messenger: [84, 40], ion: [54, 30], transporter: [100, 40], drug: [120, 32], gene: [118, 30], note: [160, 40],
    vesicle: [100, 34], channel: [100, 40], complex: [130, 40],
  };
  const TYPE_LABEL = {
    hormone: 'Hormone', receptor: 'Receptor', enzyme: 'Enzyme', kinase: 'Signaling protein', protein: 'Protein',
    metabolite: 'Metabolite', process: 'Pathway / process', organ: 'Organ', cell: 'Cell type', tf: 'Transcription factor',
    messenger: 'Second messenger', ion: 'Ion', transporter: 'Transporter', drug: 'Drug / pharmacology', gene: 'Gene / transcript',
    note: 'Note', vesicle: 'Vesicle', channel: 'Ion channel', complex: 'Complex',
  };
  EP.TYPE_LABEL = TYPE_LABEL;

  function ent(id) { return (EP.data.entities || {})[id] || null; }
  function edgeKey(e) { return e.from + '>' + e.to; }

  /** Build an EP.Model from a pathway's regulatory edges so slider inputs propagate. */
  function buildModel(pw) {
    const incoming = {};
    pw.nodes.forEach((n) => { incoming[n.id] = []; });
    // Level-limited shortcut arrows (lvMax) summarize a detailed route; count them only when the
    // target has no detailed regulatory input, otherwise the same signal would be applied twice.
    const detailed = {};
    pw.edges.forEach((e) => { if (e.reg !== false && !e.lvMax) detailed[e.to] = true; });
    pw.edges.forEach((e) => {
      if (e.reg === false || e.type === 'fb-note') return;
      if (e.lvMax && detailed[e.to]) return;
      if (!incoming[e.to]) return;
      const sign = e.type === 'inhib' || e.type === 'fb' ? -1 : 1;
      incoming[e.to].push({ src: e.from, w: sign * (e.w != null ? e.w : 0.85), why: e.why });
    });
    const inputIds = new Set((pw.inputs || []).map((i) => i.node));
    const nodes = pw.nodes.map((n) => {
      const isInput = inputIds.has(n.id) || !incoming[n.id].length;
      const inp = (pw.inputs || []).find((i) => i.node === n.id);
      return isInput
        ? { id: n.id, label: labelOf(n), input: true, value: inp && inp.value != null ? inp.value : 1 }
        : { id: n.id, label: labelOf(n), terms: incoming[n.id], mode: n.mode, damp: 0.35 };
    });
    // ensure ref computed with defaults = 1
    const m = new EP.Model({ nodes });
    m.nodes.forEach((n) => { if (n.input) m.inputs[n.id] = 1; });
    m.ref = m.solve(true);
    (pw.inputs || []).forEach((i) => { if (i.value != null) m.inputs[i.node] = i.value; });
    m.solve();
    return m;
  }

  function labelOf(n) {
    if (n.label) return n.label.replace(/\n/g, ' ');
    const e = ent(n.ent || n.id);
    return e ? (e.short || e.name) : n.id;
  }
  function labelLines(n) {
    let L = n.label;
    if (!L) { const e = ent(n.ent || n.id); L = e ? (e.short || e.name) : n.id; }
    if (L.includes('\n')) return L.split('\n');
    const [w] = sizeOf(n);
    const max = Math.max(8, Math.floor(w / 7.2));
    if (L.length <= max) return [L];
    const words = L.split(' ');
    const lines = [''];
    words.forEach((wd) => {
      const cur = lines[lines.length - 1];
      if ((cur + ' ' + wd).trim().length > max && cur) lines.push(wd); else lines[lines.length - 1] = (cur + ' ' + wd).trim();
    });
    return lines.slice(0, 3);
  }
  function typeOf(n) { if (n.type) return n.type; const e = ent(n.ent || n.id); return (e && e.type) || 'protein'; }
  function sizeOf(n) {
    const d = SIZE[typeOf(n)] || [110, 34];
    return [n.w || d[0], n.h || d[1]];
  }

  /** Shape path for node types (centered at 0,0). Shapes differ so color is never the only cue. */
  function shapeFor(type, w, hh) {
    const W = w / 2, H = hh / 2;
    switch (type) {
      case 'hormone': { const k = 12; return s('path', { d: `M${-W + k},${-H} L${W - k},${-H} L${W},0 L${W - k},${H} L${-W + k},${H} L${-W},0 Z` }); }
      case 'receptor': return s('path', { d: `M${-W},${-H} L${-W + 16},${-H} L${-W + 16},${-H + 8} L${W - 16},${-H + 8} L${W - 16},${-H} L${W},${-H} L${W},${H} L${-W},${H} Z` });
      case 'enzyme': return s('rect', { x: -W, y: -H, width: w, height: hh, rx: 2 });
      case 'metabolite': return s('ellipse', { cx: 0, cy: 0, rx: W, ry: H });
      case 'ion': return w > 70 ? s('rect', { x: -W, y: -H, width: w, height: hh, rx: H }) : s('circle', { cx: 0, cy: 0, r: Math.min(W, H) + 2 });
      case 'messenger': return s('path', { d: `M0,${-H} L${W},0 L0,${H} L${-W},0 Z` });
      case 'tf': return s('path', { d: `M${-W + 10},${-H} L${W},${-H} L${W - 10},${H} L${-W},${H} Z` });
      case 'process': return s('rect', { x: -W, y: -H, width: w, height: hh, rx: H });
      case 'organ': case 'cell': return s('rect', { x: -W, y: -H, width: w, height: hh, rx: 14 });
      case 'transporter': case 'channel': return s('rect', { x: -W, y: -H, width: w, height: hh, rx: 8 });
      case 'drug': { const k = 8; return s('path', { d: `M${-W + k},${-H} L${W - k},${-H} L${W},${-H + k} L${W},${H - k} L${W - k},${H} L${-W + k},${H} L${-W},${H - k} L${-W},${-H + k} Z` }); }
      case 'gene': return s('path', { d: `M${-W},${-H} L${W},${-H} L${W},${H - 6} Q${W / 2},${H + 4} 0,${H - 4} T${-W},${H - 4} Z` });
      case 'vesicle': return s('rect', { x: -W, y: -H, width: w, height: hh, rx: H });
      default: return s('rect', { x: -W, y: -H, width: w, height: hh, rx: 9 });
    }
  }

  /** Point on node boundary toward (tx,ty) — rectangle approximation. */
  function boundary(n, tx, ty, pad) {
    const [w, hh] = sizeOf(n);
    const dx = tx - n.x, dy = ty - n.y;
    if (!dx && !dy) return [n.x, n.y];
    const sx = (w / 2 + pad) / Math.abs(dx || 1e-9), sy = (hh / 2 + pad) / Math.abs(dy || 1e-9);
    const k = Math.min(sx, sy);
    return [n.x + dx * k, n.y + dy * k];
  }

  function defs() {
    const mk = (id, path, cls, opts = {}) => s('marker', { id, viewBox: '0 0 12 12', refX: opts.refX || 10, refY: 6, markerWidth: opts.size || 9, markerHeight: opts.size || 9, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' }, s('path', { d: path, class: cls }));
    return s('defs', {},
      mk('m-stim', 'M0,0 L12,6 L0,12 Z', 'mk mk-stim', { size: 11 }),
      mk('m-rxn', 'M0,0 L12,6 L0,12 Z', 'mk mk-rxn', { size: 11 }),
      mk('m-endo', 'M0,0 L12,6 L0,12 Z', 'mk mk-endo', { size: 11 }),
      mk('m-transport', 'M0,1 L11,6 L0,11', 'mk mk-transport open', { size: 11 }),
      mk('m-inhib', 'M5,0 L7,0 L7,12 L5,12 Z', 'mk mk-inhib', { refX: 6, size: 14 }),
      mk('m-fb', 'M5,0 L7,0 L7,12 L5,12 Z', 'mk mk-fb', { refX: 6, size: 14 }),
      mk('m-fbpos', 'M0,0 L12,6 L0,12 Z', 'mk mk-fbpos', { size: 11 }),
      mk('m-bind', 'M6,2 A4,4 0 1,1 5.9,2 Z', 'mk mk-bind', { refX: 6, size: 9 }),
      s('filter', { id: 'glow', x: '-30%', y: '-30%', width: '160%', height: '160%' },
        s('feGaussianBlur', { stdDeviation: 4, result: 'b' }),
        s('feMerge', {}, s('feMergeNode', { in: 'b' }), s('feMergeNode', { in: 'SourceGraphic' }))));
  }
  EP.svgDefs = defs;
  EP.shapeFor = shapeFor;
  EP.SIZE = SIZE;

  /** Legend element shared by all diagrams. */
  EP.legend = function () {
    const row = (shape, label) => h('div.lg-row', shape, h('span', label));
    const mini = (type) => {
      const svg = s('svg', { width: 46, height: 24, viewBox: '-23 -12 46 24', class: 'lg-svg' });
      const g = s('g', { class: 'node t-' + type }); g.appendChild(shapeFor(type, 40, type === 'messenger' ? 22 : 18)); svg.appendChild(g); return svg;
    };
    const line = (type, marker, label) => {
      const svg = s('svg', { width: 46, height: 14, viewBox: '0 0 46 14', class: 'lg-svg' }, defs(),
        s('path', { d: 'M2,7 L40,7', class: 'edge e-' + type, 'marker-end': `url(#m-${marker})` }));
      return row(svg, label);
    };
    return h('div.legend',
      h('div.lg-col', h('div.lg-title', 'Nodes'),
        row(mini('hormone'), 'Hormone'), row(mini('receptor'), 'Receptor'), row(mini('kinase'), 'Signaling protein'),
        row(mini('messenger'), 'Second messenger'), row(mini('enzyme'), 'Enzyme'), row(mini('metabolite'), 'Metabolite'),
        row(mini('transporter'), 'Transporter / channel'), row(mini('tf'), 'Transcription factor'), row(mini('process'), 'Pathway / process'),
        row(mini('drug'), 'Drug (Level 4)')),
      h('div.lg-col', h('div.lg-title', 'Arrows'),
        line('stim', 'stim', 'Stimulates (+)'), line('inhib', 'inhib', 'Inhibits (⊣, dashed)'),
        line('rxn', 'rxn', 'Converted to (reaction)'), line('transport', 'transport', 'Moves / translocates (dotted)'),
        line('endo', 'endo', 'Travels in blood (endocrine)'), line('fb', 'fb', 'Negative feedback (curved)'),
        line('fbpos', 'fbpos', 'Positive feedback'),
        h('div.lg-note', 'Badges: ↑↑ ↑ ↔ ↓ ↓↓ = change vs. reference. Dimmed = low activity.')));
  };

  /**
   * Mount a pathway into a container.
   * opts: { id, height, extModel (EP.Model to bind), onSelect, compact, focus }
   */
  EP.mountPathway = function (container, pwOrId, opts = {}) {
    const pw = typeof pwOrId === 'string' ? EP.pathways[pwOrId] : pwOrId;
    if (!pw) { container.appendChild(h('p.error', 'Unknown pathway ' + pwOrId)); return null; }
    const W = pw.view ? pw.view.w : 1200, H = pw.view ? pw.view.h : 760;
    const nodeById = {};
    pw.nodes.forEach((n) => { nodeById[n.id] = n; });

    const api = { pw, nodeById };
    let model = opts.extModel ? null : (pw.inputs && pw.inputs.length) || pw.live ? buildModel(pw) : null;
    api.model = model;
    const layerOn = {};
    (pw.layers || []).forEach((L) => { layerOn[L.id] = L.on !== false; });
    let clinical = null;
    let selected = null;
    let highlight = null; // Set of node ids
    let highlightEdges = null;
    let quiz = null;

    // ---------- DOM ----------
    const root = h('div.pathway' + (opts.compact ? '.compact' : ''));
    const toolbar = h('div.pw-toolbar');
    const stage = h('div.pw-stage', { style: { height: (opts.height || 560) + 'px' } });
    const caption = h('div.pw-caption', { 'aria-live': 'polite' });
    const svg = s('svg', { class: 'pw-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': pw.title });
    svg.appendChild(defs());
    const world = s('g', { class: 'world' });
    const gComp = s('g', { class: 'g-comp' }), gEdge = s('g', { class: 'g-edge' }), gNode = s('g', { class: 'g-node' });
    world.append(gComp, gEdge, gNode);
    svg.appendChild(world);
    stage.appendChild(svg);
    const zoomCtl = h('div.zoom-ctl',
      h('button', { title: 'Zoom in', onclick: () => zoomBy(1.25) }, '+'),
      h('button', { title: 'Zoom out', onclick: () => zoomBy(0.8) }, '−'),
      h('button', { title: 'Fit', onclick: () => fit() }, '⤢'));
    stage.appendChild(zoomCtl);
    root.append(toolbar, stage, caption);
    container.appendChild(root);

    // ---------- zoom / pan ----------
    let tf = { k: 1, x: 0, y: 0 };
    const applyTf = () => world.setAttribute('transform', `translate(${tf.x},${tf.y}) scale(${tf.k})`);
    function svgPoint(ev) {
      const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      const m = svg.getScreenCTM(); return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
    }
    function zoomBy(f, cx = W / 2, cy = H / 2) {
      const nk = EP.clamp(tf.k * f, 0.4, 4);
      tf.x = cx - (cx - tf.x) * (nk / tf.k); tf.y = cy - (cy - tf.y) * (nk / tf.k); tf.k = nk; applyTf();
    }
    function fit() { tf = { k: 1, x: 0, y: 0 }; applyTf(); }
    function centerOn(id) {
      const n = nodeById[id]; if (!n) return;
      tf.k = Math.max(tf.k, 1.3); tf.x = W / 2 - n.x * tf.k; tf.y = H / 2 - n.y * tf.k; applyTf();
    }
    api.centerOn = centerOn;
    svg.addEventListener('wheel', (ev) => {
      if (!ev.ctrlKey && !ev.metaKey && !stage.classList.contains('zoom-armed')) return;
      ev.preventDefault(); const p = svgPoint(ev); zoomBy(ev.deltaY < 0 ? 1.12 : 0.89, p.x, p.y);
    }, { passive: false });
    stage.addEventListener('click', () => stage.classList.add('zoom-armed'));
    stage.addEventListener('mouseleave', () => stage.classList.remove('zoom-armed'));
    let drag = null;
    svg.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('.node') || ev.target.closest('.edge-hit')) return;
      drag = { x: ev.clientX, y: ev.clientY, tx: tf.x, ty: tf.y };
      svg.setPointerCapture(ev.pointerId); svg.classList.add('panning');
    });
    svg.addEventListener('pointermove', (ev) => {
      if (!drag) return;
      const m = svg.getScreenCTM(); const sc = m ? 1 / m.a : 1;
      tf.x = drag.tx + (ev.clientX - drag.x) * sc; tf.y = drag.ty + (ev.clientY - drag.y) * sc; applyTf();
    });
    const endDrag = () => { drag = null; svg.classList.remove('panning'); };
    svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);

    // ---------- visibility ----------
    const lv = () => EP.state.level;
    function nodeVisible(n) {
      if ((n.lv || 1) > lv()) return false;
      if (n.lvMax && lv() > n.lvMax) return false;
      if (n.layer && layerOn[n.layer] === false) return false;
      return true;
    }
    function edgeVisible(e) {
      if (!nodeById[e.from] || !nodeById[e.to]) return false;
      if (!nodeVisible(nodeById[e.from]) || !nodeVisible(nodeById[e.to])) return false;
      if ((e.lv || 1) > lv()) return false;
      if (e.lvMax && lv() > e.lvMax) return false;
      if (e.layer && layerOn[e.layer] === false) return false;
      return true;
    }

    // ---------- activity ----------
    function activity(n) {
      if (opts.extModel && n.bind) { const m = opts.extModel; return { v: m.eff(n.bind), ref: m.ref[n.bind] }; }
      if (model && model.byId[n.id]) return { v: model.eff(n.id), ref: model.ref[n.id] };
      return null;
    }
    function edgeActivity(e) {
      const src = nodeById[e.from];
      const a = activity(src);
      if (e.bind && opts.extModel) return opts.extModel.eff(e.bind) / (opts.extModel.ref[e.bind] || 1);
      return a ? a.v / (a.ref || 1) : null;
    }

    // ---------- render ----------
    const nodeEls = {}, edgeEls = {};
    function render() {
      EP.clear(gComp); EP.clear(gEdge); EP.clear(gNode);
      (pw.compartments || []).forEach((c) => {
        if ((c.lv || 1) > lv()) return;
        const g = s('g', { class: 'comp k-' + (c.kind || 'cytosol') });
        g.appendChild(s('rect', { x: c.x, y: c.y, width: c.w, height: c.h, rx: c.kind === 'membrane' ? 6 : 18 }));
        if (c.label) g.appendChild(c.kind === 'membrane' ? s('text', { x: c.x + c.w - 12, y: c.y + c.h / 2 + 4, class: 'comp-label', 'text-anchor': 'end' }, c.label) : s('text', { x: c.x + 12, y: c.y + 20, class: 'comp-label' }, c.label));
        gComp.appendChild(g);
      });
      pw.edges.forEach((e) => {
        if (!edgeVisible(e)) return;
        const a = nodeById[e.from], b = nodeById[e.to];
        const type = e.type || 'stim';
        let d, mx, my;
        const ax = a.x + (e.dx1 || 0), ay = a.y + (e.dy1 || 0), bx = b.x + (e.dx2 || 0), by = b.y + (e.dy2 || 0);
        if (e.via) {
          const pts = [[ax, ay], ...e.via, [bx, by]];
          const p0 = boundary(a, pts[1][0], pts[1][1], 3);
          const pn = boundary(b, pts[pts.length - 2][0], pts[pts.length - 2][1], 6);
          pts[0] = p0; pts[pts.length - 1] = pn;
          d = 'M' + pts.map((p) => p.join(',')).join(' L');
          const mid = pts[Math.floor(pts.length / 2)]; mx = mid[0]; my = mid[1];
        } else {
          const curve = e.curve != null ? e.curve : (type === 'fb' || type === 'fbpos' ? 60 : 0);
          const cx0 = (ax + bx) / 2, cy0 = (ay + by) / 2;
          const len = Math.hypot(bx - ax, by - ay) || 1;
          const nx = -(by - ay) / len, ny = (bx - ax) / len;
          const qx = cx0 + nx * curve, qy = cy0 + ny * curve;
          const p0 = boundary(a, curve ? qx : bx, curve ? qy : by, 3);
          const p1 = boundary(b, curve ? qx : ax, curve ? qy : ay, type === 'inhib' || type === 'fb' ? 4 : 6);
          d = curve ? `M${p0[0]},${p0[1]} Q${qx},${qy} ${p1[0]},${p1[1]}` : `M${p0[0]},${p0[1]} L${p1[0]},${p1[1]}`;
          mx = curve ? (p0[0] + 2 * qx + p1[0]) / 4 : (p0[0] + p1[0]) / 2; my = curve ? (p0[1] + 2 * qy + p1[1]) / 4 : (p0[1] + p1[1]) / 2;
        }
        const marker = { stim: 'stim', inhib: 'inhib', rxn: 'rxn', transport: 'transport', endo: 'endo', fb: 'fb', fbpos: 'fbpos', bind: 'bind' }[type] || 'stim';
        const g = s('g', { class: 'edge-g', 'data-k': edgeKey(e) });
        const path = s('path', { d, class: `edge e-${type}`, 'marker-end': `url(#m-${marker})` });
        const flow = s('path', { d, class: `flow f-${type}` });
        const hit = s('path', { d, class: 'edge-hit' });
        hit.addEventListener('click', (ev) => { ev.stopPropagation(); showWhy(e, ev); });
        hit.appendChild(s('title', {}, (e.why ? 'Why? ' : '') + labelOf(a) + (type === 'inhib' ? ' ⊣ ' : ' → ') + labelOf(b)));
        g.append(path, flow, hit);
        if (e.label) {
          const t = s('text', { x: mx + (e.lx || 0), y: my + (e.ly || -6), class: 'edge-label' }, e.label);
          g.appendChild(t);
        }
        if (type === 'inhib' || type === 'stim') {
          // + / − glyph near the midpoint so sign never relies on color alone
          if (!e.label && e.glyph !== false) g.appendChild(s('text', { x: mx + 7, y: my + 4, class: 'edge-glyph g-' + type }, type === 'inhib' ? '−' : '+'));
        }
        gEdge.appendChild(g);
        edgeEls[edgeKey(e)] = { g, path, flow, e };
      });
      pw.nodes.forEach((n) => {
        if (!nodeVisible(n)) return;
        const type = typeOf(n);
        const [w, hh] = sizeOf(n);
        const g = s('g', { class: `node t-${type}`, transform: `translate(${n.x},${n.y})`, tabindex: 0, role: 'button', 'data-id': n.id });
        g.appendChild(shapeFor(type, w, hh));
        if (type === 'transporter' || type === 'channel') {
          g.appendChild(s('path', { d: `M${-w / 2 + 10},${-hh / 2 + 4} L${-w / 2 + 10},${hh / 2 - 4} M${w / 2 - 10},${-hh / 2 + 4} L${w / 2 - 10},${hh / 2 - 4}`, class: 'tp-bars' }));
        }
        const lines = quiz ? ['?'] : labelLines(n);
        const t = s('text', { class: 'node-label', 'text-anchor': 'middle', y: -(lines.length - 1) * 6.5 + 4.5 });
        lines.forEach((L, i) => t.appendChild(s('tspan', { x: 0, dy: i ? 13 : 0 }, L)));
        g.appendChild(t);
        const badge = s('text', { class: 'badge', x: w / 2 - 2, y: -hh / 2 - 4, 'text-anchor': 'end' }, '');
        g.appendChild(badge);
        g.appendChild(s('title', {}, labelOf(n)));
        g.addEventListener('click', (ev) => { ev.stopPropagation(); onNodeClick(n); });
        g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onNodeClick(n); } });
        g.addEventListener('mouseenter', () => hoverNeighbors(n.id, true));
        g.addEventListener('mouseleave', () => hoverNeighbors(n.id, false));
        gNode.appendChild(g);
        nodeEls[n.id] = { g, badge, n };
      });
      update();
    }
    api.render = render;

    function hoverNeighbors(id, on) {
      Object.values(edgeEls).forEach(({ g, e }) => { if (e.from === id || e.to === id) g.classList.toggle('hover', on); });
    }

    /** Refresh activity coloring, badges, flow speeds, highlights. */
    function update() {
      if (model) model.solve();
      Object.values(nodeEls).forEach(({ g, badge, n }) => {
        const a = activity(n);
        g.classList.remove('up', 'up2', 'dn', 'dn2', 'eq', 'blocked', 'hl', 'dim', 'sel', 'cl-up', 'cl-dn');
        if (a) {
          const q = EP.qual(a.v, a.ref);
          g.classList.add(q.cls);
          badge.textContent = q.sym === '↔' ? '' : q.sym;
          g.style.setProperty('--act', EP.clamp(0.35 + 0.35 * Math.log2(a.v / (a.ref || 1) + 1), 0.3, 1).toFixed(2));
        } else badge.textContent = '';
        if (clinical && clinical.nodes && clinical.nodes[n.id]) {
          const st = clinical.nodes[n.id];
          g.classList.add(st === 'blocked' ? 'blocked' : st === 'up' ? 'cl-up' : 'cl-dn');
          if (!a) badge.textContent = st === 'up' ? '↑' : st === 'blocked' ? '✕' : '↓';
        }
        if (highlight) g.classList.add(highlight.has(n.id) ? 'hl' : 'dim');
        if (selected === n.id) g.classList.add('sel');
      });
      Object.values(edgeEls).forEach(({ g, flow, e }) => {
        g.classList.remove('hl', 'dim', 'blocked', 'off');
        const r = edgeActivity(e);
        if (r != null) {
          const speed = EP.clamp(r, 0.15, 6);
          flow.style.animationDuration = (2.4 / speed / EP.state.motion).toFixed(2) + 's';
          g.classList.toggle('off', r < 0.35);
          g.style.setProperty('--w', EP.clamp(1 + Math.log2(r + 1) * 1.3, 0.6, 5).toFixed(2));
        } else {
          flow.style.animationDuration = (2.4 / EP.state.motion).toFixed(2) + 's';
        }
        if (clinical && clinical.edges && clinical.edges[edgeKey(e)]) g.classList.add('blocked');
        if (highlightEdges) g.classList.add(highlightEdges.has(edgeKey(e)) ? 'hl' : 'dim');
      });
      if (opts.onUpdate) opts.onUpdate(api);
    }
    api.update = update;

    // ---------- interactions ----------
    function onNodeClick(n) {
      if (quiz) return quizAnswer(n);
      selected = n.id;
      update();
      EP.showInfo(n.ent || n.id, {
        node: n, pathway: pw, model: opts.extModel || model, modelId: opts.extModel ? n.bind : n.id,
        onFollow: () => follow(n.id),
        followable: pw.edges.some((e) => e.from === n.id),
      });
      if (opts.onSelect) opts.onSelect(n);
    }
    function showWhy(e, ev) {
      const a = nodeById[e.from], b = nodeById[e.to];
      const verb = { stim: 'stimulates', inhib: 'inhibits', rxn: 'is converted to', transport: 'moves to', endo: 'travels (blood) to', fb: 'feeds back to inhibit', fbpos: 'feeds back to stimulate', bind: 'binds' }[e.type || 'stim'];
      EP.showInfoHTML(`<div class="why-head">Why?</div><h3>${EP.esc(labelOf(a))} ${verb} ${EP.esc(labelOf(b))}</h3>` +
        `<p>${EP.md(e.why || 'No additional explanation recorded for this link — click the nodes for details.')}</p>` +
        (e.ref ? `<p class="small">${EP.md(e.ref.split(',').map((r) => `{{ref:${r.trim()}}}`).join(' '))}</p>` : ''));
    }

    /** Follow-the-molecule: BFS downstream over conversion/transport/stim edges. */
    function follow(id) {
      const types = new Set(['rxn', 'transport', 'endo', 'stim', 'bind']);
      const seen = new Set([id]); const es = new Set(); const q = [id];
      while (q.length) {
        const c = q.shift();
        pw.edges.forEach((e) => {
          if (e.from === c && types.has(e.type || 'stim') && edgeVisible(e)) {
            es.add(edgeKey(e));
            if (!seen.has(e.to)) { seen.add(e.to); q.push(e.to); }
          }
        });
      }
      highlight = seen; highlightEdges = es;
      caption.innerHTML = `<span class="tag">Following</span> <strong>${EP.esc(labelOf(nodeById[id]))}</strong> — every downstream destination in this diagram is highlighted. <button class="linkish" data-act="clear">Clear</button>`;
      update();
    }
    api.follow = follow;
    caption.addEventListener('click', (ev) => { if (ev.target.dataset.act === 'clear') clearHL(); });
    function clearHL() { highlight = null; highlightEdges = null; caption.textContent = ''; stopWalk(); update(); }
    api.clearHL = clearHL;
    svg.addEventListener('click', () => { if (!quiz && (highlight && !walk.on)) clearHL(); });

    // ---------- walkthrough ----------
    const walk = { on: false, i: 0, timer: null, playing: false };
    function showStep(i) {
      const steps = (pw.steps || []).filter((st) => (st.lv || 1) <= lv());
      if (!steps.length) return;
      walk.i = EP.clamp(i, 0, steps.length - 1);
      const st = steps[walk.i];
      highlight = new Set(st.n || []);
      highlightEdges = new Set(st.e || []);
      // auto-include edges between highlighted nodes if none given
      if (!st.e) pw.edges.forEach((e) => { if (highlight.has(e.from) && highlight.has(e.to)) highlightEdges.add(edgeKey(e)); });
      caption.innerHTML = `<span class="tag">Step ${walk.i + 1}/${steps.length}</span> ${EP.md(st.t)}`;
      update();
      walkBar.querySelector('.wk-count').textContent = `${walk.i + 1}/${steps.length}`;
    }
    function startWalk() { walk.on = true; walkBar.hidden = false; showStep(0); }
    function stopWalk() { walk.on = false; walk.playing = false; clearInterval(walk.timer); walkBar.hidden = true; if (playBtn) playBtn.textContent = '▶'; }
    let playBtn;
    const walkBar = h('div.walkbar', { hidden: true },
      h('button', { title: 'First step', onclick: () => showStep(0) }, '⏮'),
      h('button', { title: 'Step back', onclick: () => showStep(walk.i - 1) }, '◀'),
      (playBtn = h('button', { title: 'Play / pause', onclick: () => togglePlay() }, '▶')),
      h('button', { title: 'Step forward', onclick: () => showStep(walk.i + 1) }, '▶|'),
      h('span.wk-count', ''),
      h('label.wk-speed', 'speed ', h('select', { onchange: (ev) => { walk.speed = +ev.target.value; if (walk.playing) { togglePlay(); togglePlay(); } } },
        h('option', { value: 0.5 }, 'slow-mo'), h('option', { value: 1, selected: true }, '1×'), h('option', { value: 1.8 }, 'fast'))),
      h('button', { title: 'Exit walkthrough', onclick: () => clearHL() }, '✕'));
    walk.speed = 1;
    function togglePlay() {
      walk.playing = !walk.playing; playBtn.textContent = walk.playing ? '⏸' : '▶';
      clearInterval(walk.timer);
      if (walk.playing) walk.timer = setInterval(() => {
        const n = (pw.steps || []).filter((st) => (st.lv || 1) <= lv()).length;
        if (walk.i >= n - 1) { togglePlay(); return; }
        showStep(walk.i + 1);
      }, 3600 / walk.speed);
    }
    EP.onTeardown(() => clearInterval(walk.timer));
    stage.appendChild(walkBar);

    // ---------- quiz ----------
    const quizBox = h('div.quizbox', { hidden: true });
    stage.appendChild(quizBox);
    function startQuiz() {
      const pool = pw.nodes.filter((n) => nodeVisible(n) && typeOf(n) !== 'note');
      const order = pool.map((n) => n.id).sort(() => Math.random() - 0.5).slice(0, Math.min(8, pool.length));
      quiz = { order, i: 0, score: 0, tries: 0 };
      quizBox.hidden = false; render(); quizPrompt();
    }
    function quizPrompt() {
      if (quiz.i >= quiz.order.length) {
        quizBox.innerHTML = `<strong>Done!</strong> ${quiz.score}/${quiz.order.length} on first try. <button class="linkish">Exit</button>`;
        quizBox.querySelector('button').onclick = endQuiz; return;
      }
      const n = nodeById[quiz.order[quiz.i]];
      quizBox.innerHTML = `<span class="tag">Test yourself</span> Labels hidden. Click: <strong>${EP.esc(labelOf(n))}</strong> <span class="muted">(${quiz.i + 1}/${quiz.order.length})</span> <button class="linkish">Exit</button>`;
      quizBox.querySelector('button').onclick = endQuiz;
    }
    function quizAnswer(n) {
      const target = quiz.order[quiz.i];
      const el = nodeEls[n.id] && nodeEls[n.id].g;
      if (n.id === target) {
        if (!quiz.tries) quiz.score++;
        quiz.tries = 0; quiz.i++;
        if (el) { el.classList.add('q-ok'); const t = el.querySelector('.node-label'); EP.clear(t); labelLines(n).forEach((L, i) => t.appendChild(s('tspan', { x: 0, dy: i ? 13 : 0 }, L))); }
        quizPrompt();
      } else {
        quiz.tries++;
        if (el) { el.classList.add('q-bad'); setTimeout(() => el.classList.remove('q-bad'), 600); }
      }
    }
    function endQuiz() { quiz = null; quizBox.hidden = true; render(); }

    // ---------- clinical overlay ----------
    function setClinical(c) {
      clinical = c || null;
      if (model) {
        model.resetPerturbations();
        (pw.inputs || []).forEach((i) => { model.inputs[i.node] = sliders[i.node] ? sliders[i.node].get() : (i.value || 1); });
        if (c) {
          Object.assign(model.caps, c.caps || {});
          Object.assign(model.inputs, c.inputs || {});
          Object.assign(model.autos, c.autos || {});
          Object.keys(c.inputs || {}).forEach((k) => sliders[k] && sliders[k].set(c.inputs[k]));
        }
      }
      if (c) {
        caption.innerHTML = `<span class="tag warn">What goes wrong?</span> <strong>${EP.esc(c.label)}</strong> — ${EP.md(c.desc || '')}` +
          (c.chain ? `<div class="chain">${c.chain.map((x) => `<span>${EP.md(x)}</span>`).join('<i>→</i>')}</div>` : '');
        highlight = c.highlight ? new Set(c.highlight) : null;
        highlightEdges = null;
      } else { caption.textContent = ''; highlight = null; }
      update();
    }
    api.setClinical = setClinical;

    // ---------- toolbar ----------
    const sliders = {};
    if (model && pw.inputs) {
      const knobs = h('div.pw-knobs');
      pw.inputs.forEach((i) => {
        const k = EP.logSlider({ label: i.label, value: i.value || 1, span: i.span || 2.5, labels: i.labels, onChange: (v) => { model.inputs[i.node] = v; update(); } });
        sliders[i.node] = k; knobs.appendChild(k);
      });
      root.insertBefore(knobs, stage);
    }
    if (pw.layers && pw.layers.length) {
      const lay = h('div.tb-group', h('span.tb-label', 'Layers'),
        pw.layers.map((L) => h('label.chk', h('input', { type: 'checkbox', checked: layerOn[L.id], onchange: (ev) => { layerOn[L.id] = ev.target.checked; render(); } }), L.label)));
      toolbar.appendChild(lay);
    }
    if (pw.steps && pw.steps.length) toolbar.appendChild(h('button.btn', { onclick: startWalk }, '▶ Walk me through it'));
    if (pw.clinical && pw.clinical.length) {
      const sel = h('select.btn', { onchange: (ev) => setClinical(pw.clinical.find((c) => c.id === ev.target.value)) },
        h('option', { value: '' }, '⚠ What goes wrong? — normal'),
        pw.clinical.map((c) => h('option', { value: c.id }, c.label)));
      toolbar.appendChild(sel);
      api.clinicalSelect = sel;
    }
    toolbar.appendChild(h('button.btn.ghost', { onclick: startQuiz, title: 'Hide labels and identify components' }, '✎ Test yourself'));
    toolbar.appendChild(h('button.btn.ghost', { onclick: () => { EP.state.paused = !EP.state.paused; document.body.classList.toggle('paused', EP.state.paused); }, title: 'Pause/resume flow animations' }, '⏯ Motion'));
    const legendBtn = h('button.btn.ghost', { onclick: () => { lg.hidden = !lg.hidden; } }, 'Legend');
    toolbar.appendChild(legendBtn);
    const lg = EP.legend(); lg.hidden = true; stage.appendChild(lg);

    const offLevel = EP.on('level', () => { render(); if (walk.on) showStep(walk.i); });
    EP.onTeardown(offLevel);
    render();
    if (opts.focus) setTimeout(() => { centerOn(opts.focus); const n = nodeById[opts.focus]; if (n) onNodeClick(n); }, 50);
    api.root = root;
    api.setInput = (id, v) => { if (model) { model.inputs[id] = v; if (sliders[id]) sliders[id].set(v); update(); } };
    api.sliders = sliders;
    api.highlightNodes = (ids, text) => { highlight = new Set(ids); highlightEdges = new Set(pw.edges.filter((e) => highlight.has(e.from) && highlight.has(e.to)).map(edgeKey)); caption.innerHTML = text ? EP.md(text) : ''; update(); };
    return api;
  };
})();
