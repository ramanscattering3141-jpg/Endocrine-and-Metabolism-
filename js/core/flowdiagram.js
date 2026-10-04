/* Lightweight, hand-laid-out explainer diagrams (used by the insulin-resistance guide).
 * EP.flow(spec) returns an element containing an SVG with:
 *  - typed, colour-coded boxes (same palette as the pathway atlas) and typed arrows
 *    (act → green, inh ⊣ red bar, flow = metabolite flux, move = translocation, fb = feedback)
 *  - collapsible branches: nodes tagged with a group fold into a single "▸ branch" pill
 *  - state toggles (e.g. insulin-sensitive vs insulin-resistant) that badge/dim nodes and edges
 *  - a step-through walk with a one-line caption per step
 *  - click any box with `info` to read a short note under the diagram
 * spec = { w, h, minW, zones:[{x,y,w,h,label,kind}], nodes:[{id,x,y,label,k,w,h,g,info,badge}],
 *          edges:[{f,t,k,label,bend,via,g,anim,w}], groups:{id:{label,open,x,y}},
 *          states:[{id,label,n:{id:{b,c}},e:{'f>t':c},cap}], steps:[{n:[],e:[],cap,open:[]}] } */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;
  let uid = 0;

  const KCOL = {
    hormone: 'var(--c-hormone)', receptor: 'var(--c-receptor)', kinase: 'var(--c-kinase)', enzyme: 'var(--c-enzyme)',
    tf: 'var(--c-tf)', metab: 'var(--c-metabolite)', process: 'var(--c-process)', transporter: 'var(--c-transporter)',
    messenger: 'var(--c-messenger)', lipid: 'var(--m-fat)', glc: 'var(--m-glc)', bad: 'var(--dn)', good: 'var(--up)',
    organ: 'var(--c-organ)', drug: 'var(--c-drug)', note: 'var(--faint)', gene: 'var(--c-tf)', immune: 'var(--tr3)',
  };
  const ECOL = { act: 'var(--c-stim)', inh: 'var(--c-inhib)', flow: 'var(--c-rxn)', move: 'var(--c-transport)', endo: 'var(--c-endo)', fb: 'var(--c-fb)', fbpos: 'var(--c-stim)', plain: 'var(--faint)', bad: 'var(--dn)' };
  EP.FLOW_KCOL = KCOL;
  EP.FLOW_ECOL = ECOL;

  function lines(label) { return String(label).split('\n'); }
  function sizeOf(n) {
    const L = lines(n.label);
    const fs = n.fs || 12;
    const tw = Math.max(...L.map((l) => EP.textWidth(l, fs, n.k === 'note' ? 500 : 600)));
    return [n.w || Math.ceil(tw + (n.k === 'note' ? 14 : 20)), n.h || Math.ceil(L.length * (fs + 2) + 12)];
  }
  // point on the rectangle boundary of box b in direction of (tx,ty)
  function edgePt(b, tx, ty, pad) {
    const dx = tx - b.x, dy = ty - b.y;
    if (!dx && !dy) return [b.x, b.y];
    const hw = b.w / 2 + pad, hh = b.h / 2 + pad;
    const sc = Math.min(hw / Math.abs(dx || 1e-9), hh / Math.abs(dy || 1e-9));
    return [b.x + dx * sc, b.y + dy * sc];
  }

  function markers(id) {
    const mk = (name, d, col, o = {}) => s('marker', { id: `${id}-${name}`, viewBox: '0 0 12 12', refX: o.refX || 10, refY: 6, markerWidth: o.size || 10, markerHeight: o.size || 10, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' },
      s('path', { d, style: `fill:${col};stroke:${o.stroke ? col : 'none'};stroke-width:1.6` + (o.open ? ';fill:none' : '') }));
    return s('defs', {},
      mk('act', 'M0,0 L12,6 L0,12 Z', ECOL.act),
      mk('flow', 'M0,0 L12,6 L0,12 Z', ECOL.flow),
      mk('endo', 'M0,0 L12,6 L0,12 Z', ECOL.endo),
      mk('fbpos', 'M0,0 L12,6 L0,12 Z', ECOL.fbpos),
      mk('bad', 'M0,0 L12,6 L0,12 Z', ECOL.bad),
      mk('plain', 'M0,0 L12,6 L0,12 Z', ECOL.plain),
      mk('move', 'M0,1 L11,6 L0,11', ECOL.move, { open: true, stroke: true }),
      mk('inh', 'M4.5,0 L7.5,0 L7.5,12 L4.5,12 Z', ECOL.inh, { refX: 6, size: 14 }),
      mk('fb', 'M4.5,0 L7.5,0 L7.5,12 L4.5,12 Z', ECOL.fb, { refX: 6, size: 14 }));
  }

  EP.flow = function (spec, opts = {}) {
    const id = 'fd' + (++uid);
    const groups = spec.groups || {};
    const open = {};
    Object.keys(groups).forEach((g) => { open[g] = groups[g].open !== false; });
    let state = spec.states ? spec.states[0].id : null;
    let step = -1;
    let selected = null;

    const root = h('div.fd' + (opts.cls ? '.' + opts.cls : ''));
    const bar = h('div.fd-bar');
    const stage = h('div.fd-stage');
    const info = h('div.fd-info', { 'aria-live': 'polite' });
    const capEl = h('div.fd-cap', { 'aria-live': 'polite' });
    const svg = s('svg', { class: 'fd-svg', viewBox: `0 0 ${spec.w} ${spec.h}`, role: 'img', 'aria-label': opts.label || spec.label || 'Diagram', style: `min-width:${spec.minW || 600}px` });
    stage.appendChild(svg);

    // ---- toolbar: states, branch toggles
    let stateBar = null;
    if (spec.states) {
      stateBar = h('div.fd-states', spec.states.map((st) => h('button.chip' + (st.id === state ? '.on' : ''), { 'data-s': st.id, onclick: () => { state = st.id; step = -1; render(); } }, st.label)));
      bar.appendChild(stateBar);
    }
    let grpBar = null;
    if (Object.keys(groups).length) {
      grpBar = h('div.fd-groups');
      bar.appendChild(grpBar);
    }
    root.append(bar, stage);

    // ---- step-through
    let stepUI = null, playT = null;
    if (spec.steps && spec.steps.length) {
      const prev = h('button.fd-btn', { title: 'Previous step', onclick: () => go(Math.max(-1, step - 1)) }, '◀');
      const next = h('button.fd-btn', { title: 'Next step', onclick: () => go(step + 1 >= spec.steps.length ? -1 : step + 1) }, '▶');
      const play = h('button.fd-btn.fd-play', { onclick: () => togglePlay() }, '▶ Walk me through it');
      const cnt = h('span.fd-cnt');
      stepUI = { prev, next, play, cnt };
      root.appendChild(h('div.fd-steps', play, prev, cnt, next, capEl));
    } else root.appendChild(capEl);
    root.appendChild(info);

    function togglePlay() {
      if (playT) { clearInterval(playT); playT = null; stepUI.play.textContent = '▶ Walk me through it'; return; }
      stepUI.play.textContent = '❚❚ Pause';
      if (step >= spec.steps.length - 1) step = -1;
      go(step + 1);
      playT = setInterval(() => { if (!root.isConnected) { clearInterval(playT); playT = null; return; } if (step >= spec.steps.length - 1) { togglePlay(); return; } go(step + 1); }, 3200);
    }
    function go(i) {
      step = i;
      const st = spec.steps[i];
      if (st && st.open) st.open.forEach((g) => { open[g] = true; });
      if (st && st.close) st.close.forEach((g) => { open[g] = false; });
      if (st && st.state) state = st.state;
      render();
    }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(markers(id));
      const st = spec.states ? spec.states.find((x) => x.id === state) : null;
      if (stateBar) stateBar.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', b.dataset.s === state));
      if (grpBar) {
        EP.clear(grpBar);
        Object.keys(groups).forEach((g) => grpBar.appendChild(h('button.fd-tog' + (open[g] ? '.on' : ''), { onclick: () => { open[g] = !open[g]; render(); }, 'aria-expanded': String(!!open[g]) }, (open[g] ? '▾ ' : '▸ ') + groups[g].label)));
      }
      // zones
      (spec.zones || []).forEach((z) => {
        if (z.g && !open[z.g]) return;
        const g = s('g', { class: 'fd-zone z-' + (z.kind || 'cell') });
        g.appendChild(s('rect', { x: z.x, y: z.y, width: z.w, height: z.h, rx: z.rx != null ? z.rx : 16, style: z.col ? `stroke:${z.col};fill:color-mix(in srgb, ${z.col} 7%, transparent)` : null }));
        if (z.label) g.appendChild(s('text', { x: z.lx != null ? z.lx : z.x + 12, y: z.ly != null ? z.ly : z.y + 18, class: 'fd-zl', 'text-anchor': z.anchor || 'start', style: z.col ? `fill:${z.col}` : null }, z.label));
        svg.appendChild(g);
      });
      // visible boxes (collapsed groups → stub pill)
      const box = {};
      const hiddenG = (g) => g && groups[g] && !open[g];
      spec.nodes.forEach((n) => { if (hiddenG(n.g)) return; const [w, hh] = sizeOf(n); box[n.id] = { x: n.x, y: n.y, w, h: hh, n }; });
      Object.keys(groups).forEach((g) => {
        if (open[g]) return;
        const G = groups[g];
        const cnt = spec.nodes.filter((n) => n.g === g).length;
        const lab = '▸ ' + G.label + (cnt ? ` (+${cnt})` : '');
        const w = EP.textWidth(lab, 12, 700) + 22;
        box['§' + g] = { x: G.x, y: G.y, w, h: 28, stub: g, lab };
      });
      const resolve = (nid) => { const n = spec.nodes.find((x) => x.id === nid); if (!n) return null; return hiddenG(n.g) ? '§' + n.g : nid; };
      // edges
      const gE = s('g', { class: 'fd-edges' }), gL = s('g', { class: 'fd-labels' });
      const seen = new Set();
      (spec.edges || []).forEach((e0) => {
        let e = e0;
        const a = resolve(e.f), b = resolve(e.t);
        if (!a || !b || a === b || !box[a] || !box[b]) return;
        const stubbed = a !== e.f || b !== e.t;
        if (stubbed) {
          // edges into/out of a collapsed branch: one plain straight connector per pair
          const pair = [a, b].sort().join('|');
          if (seen.has(pair)) return; seen.add(pair);
          e = { f: e.f, t: e.t, k: 'plain' };
        }
        const A = box[a], B = box[b];
        const k = e.k || 'act';
        const via = e.via || [];
        const first = via.length ? via[0] : [B.x, B.y], last = via.length ? via[via.length - 1] : [A.x, A.y];
        let p0 = edgePt(A, first[0], first[1], 2), p1 = edgePt(B, last[0], last[1], k === 'inh' || k === 'fb' ? 3 : 4);
        if (e.fp) p0 = e.fp; if (e.tp) p1 = e.tp;
        let d, mid;
        if (via.length) {
          const pts = [p0].concat(via, [p1]);
          d = 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
          const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
          let half = seg.reduce((a, x) => a + x, 0) / 2, i = 0;
          while (i < seg.length - 1 && half > seg[i]) { half -= seg[i]; i++; }
          const f = seg[i] ? half / seg[i] : 0;
          mid = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
        } else if (e.bend) {
          const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2, dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1;
          const cx = mx - dy / L * e.bend, cy = my + dx / L * e.bend;
          d = `M${p0[0].toFixed(1)},${p0[1].toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
          mid = [0.25 * p0[0] + 0.5 * cx + 0.25 * p1[0], 0.25 * p0[1] + 0.5 * cy + 0.25 * p1[1]];
        } else {
          d = `M${p0[0].toFixed(1)},${p0[1].toFixed(1)} L${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
          mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
        }
        const ek = e.f + '>' + e.t;
        const g = s('g', { class: `fd-e ek-${k}` + (e.anim ? ' anim' : ''), 'data-e': ek, 'data-a': e.f, 'data-b': e.t });
        const path = s('path', { d, class: 'fd-ep', style: `stroke:${e.col || ECOL[k] || ECOL.act};stroke-width:${e.w || (k === 'flow' ? 2.6 : 2)}` + (k === 'inh' || k === 'fb' ? ';stroke-dasharray:6 4' : k === 'move' ? ';stroke-dasharray:2 4' : '') });
        if (k !== 'line') path.setAttribute('marker-end', `url(#${id}-${k === 'line' ? 'plain' : ECOL[k] ? k : 'act'})`);
        if (e.both) path.setAttribute('marker-start', `url(#${id}-${k})`);
        g.appendChild(path);
        if (e.label) {
          if (e.lp) mid = e.lp;
          const off = e.lo || [0, -6];
          gL.appendChild(s('text', { x: mid[0] + off[0], y: mid[1] + off[1], class: 'fd-el fd-e', 'data-e': ek, 'data-a': e.f, 'data-b': e.t, 'text-anchor': e.la || 'middle' }, e.label));
        }
        gE.appendChild(g);
      });
      svg.appendChild(gE);
      // nodes
      const gN = s('g', { class: 'fd-nodes' });
      Object.keys(box).forEach((bid) => {
        const B = box[bid];
        if (B.stub) {
          const g = s('g', { class: 'fd-n fd-stub', transform: `translate(${B.x},${B.y})`, tabindex: 0, role: 'button', 'aria-label': 'Expand ' + groups[B.stub].label });
          g.appendChild(s('rect', { x: -B.w / 2, y: -B.h / 2, width: B.w, height: B.h, rx: B.h / 2 }));
          g.appendChild(s('text', { x: 0, y: 4, 'text-anchor': 'middle' }, B.lab));
          const tog = () => { open[B.stub] = true; render(); };
          g.addEventListener('click', tog); g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tog(); } });
          gN.appendChild(g);
          return;
        }
        const n = B.n;
        const col = n.col || KCOL[n.k] || KCOL.kinase;
        const g = s('g', { class: `fd-n k-${n.k || 'kinase'}` + (n.info ? ' has-info' : ''), 'data-n': n.id, transform: `translate(${n.x},${n.y})` });
        const shape = n.k === 'metab' || n.k === 'lipid' || n.k === 'glc'
          ? s('rect', { x: -B.w / 2, y: -B.h / 2, width: B.w, height: B.h, rx: B.h / 2 })
          : n.k === 'note' ? s('rect', { x: -B.w / 2, y: -B.h / 2, width: B.w, height: B.h, rx: 6 })
            : s('rect', { x: -B.w / 2, y: -B.h / 2, width: B.w, height: B.h, rx: n.k === 'receptor' ? 4 : 9 });
        shape.setAttribute('style', n.k === 'note' ? 'fill:var(--panel);stroke:var(--line);stroke-dasharray:3 3' : `fill:color-mix(in srgb, ${col} 20%, var(--panel));stroke:${col}`);
        g.appendChild(shape);
        const L = lines(n.label), fs = n.fs || 12;
        L.forEach((l, i) => g.appendChild(s('text', { x: 0, y: (i - (L.length - 1) / 2) * (fs + 2) + fs * 0.36, 'text-anchor': 'middle', style: `font-size:${fs}px` + (n.k === 'note' ? ';font-weight:500;fill:var(--muted)' : '') }, l)));
        if (n.badge) addBadge(g, B, n.badge);
        if (n.info) {
          g.setAttribute('tabindex', 0); g.setAttribute('role', 'button');
          const show = () => { selected = n.id; info.innerHTML = `<b>${EP.esc(n.label.replace(/\n/g, ' '))}</b> — ${EP.md(n.info)}`; info.classList.add('on'); gN.querySelectorAll('.fd-n').forEach((x) => x.classList.toggle('sel', x === g)); };
          g.addEventListener('click', show); g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); show(); } });
          if (selected === n.id) g.classList.add('sel');
        }
        gN.appendChild(g);
      });
      svg.appendChild(gN);
      svg.appendChild(gL);
      // state overlay
      if (st) {
        Object.entries(st.n || {}).forEach(([nid, v]) => {
          const g = gN.querySelector(`[data-n="${nid}"]`); if (!g) return;
          if (v.c) v.c.split(' ').forEach((c) => g.classList.add('s-' + c));
          if (v.b) addBadge(g, box[nid], v.b);
        });
        const offN = new Set(Object.entries(st.n || {}).filter(([, v]) => v.c && v.c.split(' ').includes('off')).map(([k]) => k));
        svg.querySelectorAll('.fd-e').forEach((g) => { if (offN.has(g.dataset.a) || offN.has(g.dataset.b)) g.classList.add('s-off'); });
        Object.entries(st.e || {}).forEach(([ek, c]) => { const g = gE.querySelector(`[data-e="${ek}"]`); if (g) c.split(' ').forEach((x) => g.classList.add('s-' + x)); });
      }
      // step highlight
      if (stepUI) {
        stepUI.cnt.textContent = step < 0 ? `${spec.steps.length} steps` : `${step + 1} / ${spec.steps.length}`;
        const S = spec.steps[step];
        if (S) {
          const on = new Set(S.n || []), onE = new Set(S.e || []);
          gN.querySelectorAll('.fd-n').forEach((g) => { const nid = g.dataset.n; g.classList.toggle('dim', !!nid && !on.has(nid) && !(S.keep || []).includes(nid)); g.classList.toggle('hot', on.has(nid)); });
          svg.querySelectorAll('.fd-e').forEach((g) => { const lit = onE.has(g.dataset.e) || (S.auto !== false && on.has(g.dataset.a) && on.has(g.dataset.b)); g.classList.toggle('dim', !lit); g.classList.toggle('hot', lit); });
          svg.querySelectorAll('.fd-zone').forEach((z) => z.classList.add('dimz'));
          capEl.innerHTML = `<span class="fd-sn">${step + 1}</span> ${EP.md(S.cap)}`;
        } else capEl.innerHTML = st && st.cap ? EP.md(st.cap) : spec.cap ? EP.md(spec.cap) : '<span class="muted">Press ▶ to walk through the diagram one step at a time.</span>';
      } else capEl.innerHTML = st && st.cap ? EP.md(st.cap) : spec.cap ? EP.md(spec.cap) : '';
      capEl.hidden = !capEl.innerHTML;
    }
    function addBadge(g, B, b) {
      const old = g.querySelector('.fd-badge'); if (old) old.remove();
      const cls = /↑|\+|✓/.test(b) ? 'up' : /↓|✕|−/.test(b) ? 'dn' : 'eq';
      const bg = s('g', { class: 'fd-badge ' + cls, transform: `translate(${B.w / 2 - 2},${-B.h / 2 + 1})` });
      const w = Math.max(18, EP.textWidth(b, 11, 800) + 8);
      bg.appendChild(s('rect', { x: -w / 2, y: -9, width: w, height: 18, rx: 9 }));
      bg.appendChild(s('text', { x: 0, y: 4, 'text-anchor': 'middle' }, b));
      g.appendChild(bg);
    }
    render();
    root.api = { render, setState: (x) => { state = x; render(); }, go };
    return root;
  };

  /** Static mini legend for the flow diagrams (shown once per chapter where useful). */
  EP.flowKey = function () {
    const it = (k) => ({ fill: `color-mix(in srgb, ${KCOL[k]} 20%, var(--panel))`, stroke: KCOL[k] });
    return EP.colorKey([
      ['Boxes', [Object.assign(it('hormone'), { label: 'Hormone' }), Object.assign(it('receptor'), { label: 'Receptor' }), Object.assign(it('kinase'), { label: 'Signaling protein' }), Object.assign(it('enzyme'), { label: 'Enzyme' }), Object.assign(it('tf'), { label: 'Transcription factor' }), Object.assign(it('process'), { label: 'Process / output' }), Object.assign(it('lipid'), { label: 'Lipid', rx: 8 }), Object.assign(it('bad'), { label: 'Proposed cause of IR' })]],
      ['Arrows', [{ line: 'var(--c-stim)', marker: 'stim', label: 'Activates' }, { line: 'var(--c-inhib)', dash: '6 4', label: 'Inhibits (⊣)' }, { line: 'var(--c-rxn)', w: 2.6, label: 'Flux / converted to' }, { line: 'var(--c-transport)', dash: '2 4', label: 'Moves / translocates' }, { line: 'var(--c-fb)', dash: '6 4', label: 'Feedback' }]],
      ['Badges', [{ sym: '↓', color: 'var(--dn)', label: 'Reduced / impaired' }, { sym: '↑', color: 'var(--up)', label: 'Increased' }, { sym: '▸', color: 'var(--accent)', label: 'Collapsed branch — click to open' }]],
    ], { compact: true, open: false, title: 'How to read the diagrams' });
  };
})();
