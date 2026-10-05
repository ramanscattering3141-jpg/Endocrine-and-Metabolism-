/* Cell / organ animations sharing one small framework:
 *   EP.mountAnim(container, def)  — step list, caption, play/step controls, toggles, particle engine.
 * Scenes: EP.anim.hp (hypothalamic–pituitary portal + axonal transport),
 *         EP.anim.beta (β-cell stimulus–secretion coupling), EP.anim.gr (cortisol → GR → gene). */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;
  EP.anim = EP.anim || {};
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;

  EP.mountAnim = function (container, def) {
    const W = def.W || 900, H = def.H || 560;
    const st = { step: 0, tStep: 0, auto: true, speed: 1, tog: {}, done: false };
    (def.toggles || []).forEach((t) => (st.tog[t.id] = !!t.on));
    const root = h('div.g4.anim');
    const left = h('div'), right = h('div');
    root.append(left, right); container.appendChild(root);
    const togBtns = (def.toggles || []).map((t) => {
      const b = h('button.btn', { title: t.title || '', onclick: () => { st.tog[t.id] = !st.tog[t.id]; if (t.excl) t.excl.forEach((x) => { if (st.tog[t.id]) st.tog[x] = false; }); sync(); } });
      b.__t = t; return b;
    });
    const bPlay = h('button.btn', { onclick: () => { st.auto = !st.auto; if (st.auto && st.step >= def.steps.length - 1) { st.step = 0; st.tStep = 0; } sync(); } });
    const motion = EP.animSwitch(root);
    const controls = h('div.g4-controls', motion, ...togBtns, h('span', { style: { width: '8px' } }),
      h('button.btn.ghost', { onclick: () => go(st.step - 1) }, '◀ step'), bPlay, h('button.btn.ghost', { onclick: () => go(st.step + 1) }, 'step ▶'),
      h('label.chk', h('input', { type: 'checkbox', onchange: (ev) => { st.speed = ev.target.checked ? 0.4 : 1; } }), 'slow motion'),
      h('button.btn.ghost', { onclick: () => { go(0); st.auto = true; api.reset && api.reset(); sync(); } }, '⟲ reset'));
    const svg = s('svg', { class: 'g4-svg anim-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': def.title });
    const cap = h('div.g4-cap');
    left.append(controls, svg, cap);
    if (def.key) left.appendChild(EP.colorKey(def.key));
    const stepList = h('ol.g4-steps', def.steps.map(([t], i) => h('li', { onclick: () => go(i), style: { cursor: 'pointer' } }, t)));
    right.append(h('h4', def.listTitle || 'Sequence'), stepList);
    if (def.side) right.appendChild(h('div.small.muted', { style: { marginTop: '10px' }, html: EP.md(def.side) }));
    const readout = h('div.anim-readout'); right.appendChild(readout);

    // ----- particle engine
    const L = { bg: s('g'), mid: s('g'), fg: s('g'), dots: s('g'), top: s('g') };
    svg.append(EP.svgDefs(), L.bg, L.mid, L.fg, L.dots, L.top);
    let dots = [];
    const P = {
      svg, L, W, H, st,
      path(d, cls, layer) { const p = s('path', { d, class: cls || 'a-route' }); (L[layer || 'mid']).appendChild(p); p.__len = p.getTotalLength(); return p; },
      /** spawn a dot moving along path p (px/s), stopping at `stop` px (default end) */
      dot(p, o = {}) {
        const c = s('circle', { r: o.r || 4, class: 'a-dot ' + (o.cls || '') });
        if (o.color) c.style.fill = o.color;
        L.dots.appendChild(c);
        const d = { c, p, x: o.from || 0, v: o.v || 90, stop: o.stop != null ? o.stop : p.__len, onEnd: o.onEnd, life: o.life, jitter: o.jitter || 0, j: (Math.random() - 0.5) * 2 };
        dots.push(d); place(d); return d;
      },
      /** free dot that drifts toward (tx,ty) */
      drift(x, y, tx, ty, o = {}) {
        const c = s('circle', { r: o.r || 3.5, class: 'a-dot ' + (o.cls || ''), cx: x, cy: y });
        if (o.color) c.style.fill = o.color;
        L.dots.appendChild(c);
        const d = { c, free: true, x, y, tx, ty, v: o.v || 60, onEnd: o.onEnd, fade: o.fade };
        dots.push(d); return d;
      },
      clearDots() { dots.forEach((d) => d.c.remove()); dots = []; },
      count(cls) { return dots.filter((d) => d.c.classList.contains(cls)).length; },
    };
    function place(d) {
      const pt = d.p.getPointAtLength(clamp(d.x, 0, d.p.__len));
      d.c.setAttribute('cx', pt.x + (d.jitter ? d.j * d.jitter : 0)); d.c.setAttribute('cy', pt.y);
    }
    const api = def.build(P);

    function go(i) { st.step = clamp(i, 0, def.steps.length - 1); st.tStep = 0; st.auto = false; sync(); }
    function sync() {
      togBtns.forEach((b) => { b.textContent = (st.tog[b.__t.id] ? '✓ ' : '') + b.__t.label; b.classList.toggle('primary', !!st.tog[b.__t.id]); });
      bPlay.textContent = st.auto ? '❚❚ hold this step' : '▶ auto-advance steps';
      [...stepList.children].forEach((li, i) => { li.classList.toggle('done', i < st.step); li.classList.toggle('cur', i === st.step); });
      cap.innerHTML = EP.md(api.caption ? api.caption(st) || def.steps[st.step][1] : def.steps[st.step][1]);
      api.sync && api.sync(st);
    }
    const stepDur = def.stepDur || 4.2;
    const stop = EP.loop((dt) => {
      dt *= st.speed;
      st.tStep += dt;
      if (st.auto && st.tStep > stepDur) {
        if (st.step < def.steps.length - 1) { st.step++; st.tStep = 0; sync(); } else { st.auto = false; sync(); }
      }
      api.update(dt, st);
      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i];
        if (d.free) {
          const dx = d.tx - d.x, dy = d.ty - d.y, dist = Math.hypot(dx, dy), stp = d.v * dt;
          if (dist <= stp) { d.x = d.tx; d.y = d.ty; d.c.remove(); dots.splice(i, 1); d.onEnd && d.onEnd(d); continue; }
          d.x += dx / dist * stp; d.y += dy / dist * stp; d.c.setAttribute('cx', d.x); d.c.setAttribute('cy', d.y);
          continue;
        }
        if (d.hold) continue;
        d.x += d.v * dt;
        if (d.x >= d.stop) {
          d.x = d.stop; place(d);
          if (d.stop < d.p.__len && d.keep) { d.hold = true; d.onEnd && d.onEnd(d); continue; }
          d.c.remove(); dots.splice(i, 1); d.onEnd && d.onEnd(d); continue;
        }
        place(d);
      }
      if (api.readout) readout.innerHTML = api.readout(st);
    }, { scope: root });
    EP.onTeardown && EP.onTeardown(stop);
    sync();
    return { st, sync };
  };

  // small drawing helpers
  const lbl = (P, x, y, t, cls, anchor) => { const e = s('text', { x, y, class: cls || 'a-lbl', 'text-anchor': anchor || 'middle' }, t); P.L.top.appendChild(e); return e; };
  const every = (o, key, period, dt) => { o[key] = (o[key] || 0) + dt; if (o[key] >= period) { o[key] -= period; return true; } return false; };

  // ======================================================================
  // 1. Hypothalamic–pituitary: portal system + axonal transport
  // ======================================================================
  EP.anim.hp = function (container) {
    const RH = [ // releasing hormones: neuron, color var, target cell
      { id: 'crh', name: 'CRH', n: [110, 92], col: 'var(--tr2)', cell: 'cort', out: 'ACTH' },
      { id: 'trh', name: 'TRH', n: [180, 66], col: 'var(--tr3)', cell: 'thyro', out: 'TSH' },
      { id: 'gnrh', name: 'GnRH', n: [250, 92], col: 'var(--tr4)', cell: 'gonado', out: 'LH/FSH' },
      { id: 'ghrh', name: 'GHRH', n: [150, 150], col: 'var(--tr0)', cell: 'somato', out: 'GH' },
      { id: 'da', name: 'Dopamine', n: [230, 160], col: 'var(--tr1)', cell: 'lacto', out: 'PRL', inhib: true },
    ];
    const CELLS = { cort: [175, 430, 'Corticotroph', 'var(--tr2)'], thyro: [255, 402, 'Thyrotroph', 'var(--tr3)'], gonado: [330, 440, 'Gonadotroph', 'var(--tr4)'], somato: [190, 478, 'Somatotroph', 'var(--tr0)'], lacto: [292, 488, 'Lactotroph', 'var(--tr1)'] };
    const ME = [360, 232];
    return EP.mountAnim(container, {
      key: [
        ['Releasing hormones (dots on the portal route)', RH.map((r) => ({ dot: r.col, label: r.name + (r.inhib ? ' (inhibits)' : '') + ' → ' + CELLS[r.cell][2] }))],
        ['Other moving dots', [{ dot: 'var(--c-hormone)', label: 'Trophic hormone leaving a cell (coloured like its cell)' }, { dot: 'var(--c-inhib)', label: 'Target-gland hormone feeding back' }, { dot: 'var(--accent)', label: 'ADH / oxytocin granule (with neurophysin)' }, { dot: 'var(--c-messenger)', label: 'Osmoreceptor signal' }]],
        ['Vessels & regions', [{ line: '#e05561', w: 3, label: 'Artery / capillary plexus' }, { line: '#b04a8a', w: 4, label: 'Hypophyseal portal veins' }, { line: '#6b7fd6', w: 4, label: 'Venous drainage → systemic blood' }, { line: 'var(--accent)', w: 3, label: 'Magnocellular axons (stalk)' }, { band: 'var(--accent2)', label: 'Hypothalamus / stalk' }, { band: 'var(--c-hormone)', label: 'Anterior lobe' }, { band: 'var(--accent)', label: 'Posterior lobe' }]],
        ['Pituitary cells', [{ fill: 'color-mix(in srgb, var(--tr2) 70%, var(--panel))', stroke: 'var(--tr2)', rx: 9, label: 'Bright = secreting' }, { fill: 'color-mix(in srgb, var(--tr2) 12%, var(--panel))', stroke: 'var(--tr2)', rx: 9, label: 'Faint = quiet' }]],
      ],
      title: 'Hypothalamic–pituitary portal system and axonal transport', W: 900, H: 580, listTitle: 'Two routes from brain to pituitary',
      steps: [
        ['Parvocellular neurons fire', '**Parvocellular neurons** (PVN, arcuate, preoptic) fire in bursts and send **releasing hormones** down short axons to the **median eminence**.'],
        ['Median eminence → portal blood', 'At the median eminence, releasing hormones enter the **primary capillary plexus**, which lies outside the blood–brain barrier.'],
        ['Long portal veins down the stalk', '**Hypophyseal portal veins** carry them down the stalk. The volume is tiny and nothing is diluted by systemic blood, so concentrations stay high.'],
        ['Secondary plexus → target cells', 'In the anterior lobe each releasing hormone reaches its own cell type. **Dopamine is inhibitory**: it holds lactotrophs in check.'],
        ['Trophic hormones → systemic blood', 'Stimulated cells secrete **ACTH, TSH, LH/FSH and GH** into the anterior-lobe veins, which drain to the systemic circulation and on to target glands.'],
        ['Target-gland feedback', 'Cortisol, T₄/T₃, sex steroids and IGF-1 return in the blood and **inhibit** the hypothalamus and pituitary (long-loop negative feedback).'],
        ['Magnocellular: ADH & oxytocin made', '**Magnocellular** neurons in the SON and PVN synthesize pre-pro-ADH and pre-pro-oxytocin. These are packaged into granules with **neurophysin**.'],
        ['Fast axonal transport', 'Granules ride **fast axonal transport** down the stalk to the posterior lobe. No portal blood is involved: the posterior pituitary is neural tissue.'],
        ['Storage and release', 'Granules are stored in terminals (Herring bodies). **↑ Plasma osmolality** or ↓ volume triggers action potentials → Ca²⁺ entry → exocytosis into posterior-lobe capillaries.'],
      ],
      toggles: [
        { id: 'osm', label: '↑ Plasma osmolality', title: 'Osmoreceptors in the OVLT drive SON/PVN firing' },
        { id: 'cut', label: 'Cut the stalk', title: 'Interrupts portal blood flow and axonal transport' },
      ],
      side: 'Why **stalk section** raises prolactin but lowers everything else: lactotrophs are under tonic **dopamine inhibition** that arrives through the portal veins. {{ref:kovacs5}} {{ref:molina2}} {{ref:molina3}}',
      build(P) {
        const { L } = P;
        // regions
        L.bg.append(
          s('path', { d: 'M20,20 Q450,-10 880,20 L880,205 Q640,232 470,228 L420,228 Q200,232 20,205 Z', class: 'a-region hyp' }),
          s('path', { d: 'M330,226 L470,226 L445,352 L355,352 Z', class: 'a-region stalk' }),
          s('ellipse', { cx: 255, cy: 455, rx: 175, ry: 98, class: 'a-region ant' }),
          s('ellipse', { cx: 575, cy: 452, rx: 120, ry: 88, class: 'a-region post' }));
        lbl(P, 40, 42, 'HYPOTHALAMUS', 'a-head', 'start');
        lbl(P, 255, 548, 'ANTERIOR LOBE (adenohypophysis)', 'a-head');
        lbl(P, 575, 548, 'POSTERIOR LOBE (neurohypophysis)', 'a-head');
        lbl(P, 492, 300, 'stalk', 'a-note', 'start');
        lbl(P, 476, 249, 'median eminence', 'a-note', 'start');
        // arteries/plexus
        P.path('M20,236 C120,236 240,240 330,236', 'a-artery', 'bg');
        lbl(P, 30, 254, 'superior hypophyseal a.', 'a-note', 'start');
        P.path('M330,236 q10,-12 20,0 q10,12 20,0 q10,-12 20,0 q10,12 20,0 q10,-12 20,0', 'a-plexus', 'bg');
        // portal veins (visible)
        const portal = ['M372,240 C372,300 350,330 330,375', 'M405,240 C410,300 380,340 300,380'];
        portal.forEach((d) => P.path(d, 'a-portal', 'bg'));
        const portalEls = [...L.bg.querySelectorAll('.a-portal')];
        // secondary plexus
        P.path('M175,400 q20,-14 40,0 q20,14 40,0 q20,-14 40,0 q20,14 40,0 M160,470 q25,-14 50,0 q25,14 50,0 q12,-7 25,0', 'a-plexus', 'bg');
        // systemic vein out
        const vein = 'M255,553 C300,570 700,570 880,560';
        P.path(vein, 'a-vein', 'bg');
        lbl(P, 870, 548, '→ systemic circulation', 'a-note', 'end');
        // feedback path
        const fbD = 'M880,545 C900,420 900,250 760,212 C650,190 520,205 470,215';
        const fbPath = P.path(fbD, 'a-fb', 'bg');
        lbl(P, 868, 380, 'feedback', 'a-note fbtxt', 'end');
        // cells
        const cellEls = {};
        Object.entries(CELLS).forEach(([k, [x, y, name, col]]) => {
          const g = s('g', { class: 'a-cell', style: `--c:${col}` });
          g.append(s('circle', { cx: x, cy: y, r: 17 }), s('circle', { cx: x, cy: y, r: 5, class: 'nuc' }));
          L.fg.appendChild(g);
          const t = lbl(P, x, y + 31, name, 'a-small');
          cellEls[k] = { g, x, y, glow: 0, t };
        });
        // parvocellular neurons + axons + full routes
        const routes = {};
        RH.forEach((r, i) => {
          const [nx, ny] = r.n; const cell = CELLS[r.cell];
          const meX = ME[0] - 20 + i * 12;
          const axon = `M${nx},${ny} C${nx + 60},${ny + 40} ${meX - 40},${ME[1] - 40} ${meX},${ME[1]}`;
          P.path(axon, 'a-axon', 'bg').style.stroke = r.col;
          const g = s('g', { class: 'a-neuron', style: `--c:${r.col}` });
          g.append(s('circle', { cx: nx, cy: ny, r: 11 }));
          L.fg.appendChild(g);
          lbl(P, nx, ny - 16, r.name, 'a-small');
          const pd = portal[i % 2].replace(/^M[\d.,]+/, '');
          const full = `${axon} L${portal[i % 2].match(/^M([\d.]+),([\d.]+)/).slice(1).join(',')}${pd} L${cell[0] + (cell[0] > 300 ? -14 : 14) * 0},${cell[1]}`;
          const route = P.path(full, 'a-route');
          const lenA = P.path(axon, 'a-route').__len;
          const lenAP = lenA + 10 + portalEls[i % 2].getTotalLength();
          routes[r.id] = { route, lenA, lenAP, neuron: g, r };
        });
        // cell → vein routes
        const outRoutes = {};
        Object.entries(CELLS).forEach(([k, [x, y]]) => { outRoutes[k] = P.path(`M${x},${y} C${x},${y + 40} ${x + 20},552 ${Math.max(x + 40, 300)},560 L880,560`, 'a-route'); });
        // magnocellular
        const SON = [640, 92], PVN = [540, 70];
        const term = [[560, 430], [590, 455], [620, 425], [575, 480]];
        const magno = [SON, PVN].map(([x, y], i) => {
          const tgt = term[i];
          const d = `M${x},${y} C${x - 80},${y + 80} 445,190 ${435 - i * 18},260 C${425 - i * 18},320 ${tgt[0] - 60},${tgt[1] - 60} ${tgt[0]},${tgt[1]}`;
          const p = P.path(d, 'a-maxon', 'bg');
          const g = s('g', { class: 'a-neuron magno' }); g.append(s('circle', { cx: x, cy: y, r: 13 })); L.fg.appendChild(g);
          lbl(P, x + (i ? -20 : 22), y - 18, i ? 'PVN (magno)' : 'SON', 'a-small');
          const route = P.path(d, 'a-route');
          const stalkCut = (() => { let best = 0; for (let l = 0; l < route.__len; l += 4) { const pt = route.getPointAtLength(l); if (pt.y > 280) { best = l; break; } } return best; })();
          return { route, g, stalkCut, tgt };
        });
        term.forEach(([x, y]) => L.fg.appendChild(s('circle', { cx: x, cy: y, r: 8, class: 'a-term' })));
        const postCap = P.path('M480,500 C540,470 610,500 690,470', 'a-plexus', 'bg');
        lbl(P, 690, 500, 'inferior hypophyseal capillaries', 'a-note', 'end');
        const postOut = P.path('M600,485 C640,520 700,540 760,556 L880,560', 'a-route');
        lbl(P, 664, 132, 'ADH · oxytocin (+ neurophysin)', 'a-small', 'start');
        // osmoreceptor
        const ovlt = s('g', { class: 'a-neuron osm' }); ovlt.append(s('circle', { cx: 780, cy: 80, r: 10 })); L.fg.appendChild(ovlt);
        lbl(P, 780, 60, 'OVLT osmoreceptors', 'a-small');
        const osmPath = P.path('M780,80 C740,90 690,90 650,92', 'a-route');
        // ---- state
        const T = {}; const stored = [0, 0]; let released = 0;
        const cut = (st) => st.tog.cut;
        return {
          update(dt, st) {
            const k = st.step;
            // parvocellular pulses
            if (every(T, 'parvo', 0.55, dt)) {
              RH.forEach((r) => {
                const R = routes[r.id];
                R.neuron.classList.add('fire'); setTimeout(() => R.neuron.classList.remove('fire'), 160);
                const stop = cut(st) ? R.lenA : k < 1 ? R.lenA : k < 3 ? R.lenAP : R.route.__len;
                P.dot(R.route, { color: r.col, v: 120, stop, r: 3.5, onEnd: () => { if (stop === R.route.__len) cellEls[r.cell].hit = (cellEls[r.cell].hit || 0) + 1; } });
              });
            }
            // cell activity: stimulated cells secrete; lactotroph is inhibited by dopamine arriving
            Object.entries(cellEls).forEach(([key, c]) => {
              const hits = c.hit || 0; c.hit = 0;
              let drive;
              if (key === 'lacto') drive = cut(st) || k < 3 ? 1 : Math.max(0.15, c.glow - hits * 0.4 + dt * 0.25);
              else drive = cut(st) ? Math.max(0.05, c.glow - dt * 0.4) : hits ? 1 : Math.max(0.15, c.glow - dt * 0.25);
              if (k < 3 && !cut(st)) drive = 0.15;
              if (key === 'lacto' && k < 3 && !cut(st)) drive = 0.15;
              c.glow = lerp(c.glow, drive, 0.12);
              c.g.style.setProperty('--glow', c.glow.toFixed(2));
              if (k >= 4 && Math.random() < c.glow * dt * 3) P.dot(outRoutes[key], { color: CELLS[key][3], v: 140, r: 3, cls: 'troph' });
            });
            // feedback dots
            if (k >= 5 && every(T, 'fb', 0.6, dt)) P.dot(fbPath, { cls: 'fbdot', v: 150, r: 3.5 });
            // magnocellular
            const osm = st.tog.osm;
            if (osm && every(T, 'osm', 0.35, dt)) P.dot(osmPath, { cls: 'osmdot', v: 120, r: 2.5 });
            if (k >= 6 && every(T, 'magno', osm ? 0.28 : 0.7, dt)) {
              magno.forEach((m, i) => {
                const stop = k < 7 ? 14 : cut(st) ? m.stalkCut : m.route.__len;
                P.dot(m.route, { cls: 'gran', v: k < 7 ? 20 : 95, stop, r: 4, onEnd: () => { if (stop === m.route.__len) stored[i] = Math.min(12, stored[i] + 1); } });
              });
            }
            if (k >= 8 && every(T, 'rel', osm ? 0.18 : 0.9, dt)) {
              const i = stored[0] >= stored[1] ? 0 : 1;
              if (stored[i] > 0) { stored[i]--; released++; P.dot(postOut, { cls: 'adh', v: 150, r: 3 }); }
            }
            magno.forEach((m, i) => m.g.classList.toggle('fire', osm && Math.random() < 0.3));
          },
          readout(st) {
            const lv = (x) => (x > 0.7 ? '↑' : x > 0.3 ? 'normal' : '↓');
            if (st.step < 4) return '';
            const c = cellEls;
            return `<div class="why-head">Secretion now</div><table class="cmp-table small"><tr><td>ACTH</td><td>${lv(c.cort.glow)}</td></tr><tr><td>TSH</td><td>${lv(c.thyro.glow)}</td></tr><tr><td>LH/FSH</td><td>${lv(c.gonado.glow)}</td></tr><tr><td>GH</td><td>${lv(c.somato.glow)}</td></tr><tr><td>Prolactin</td><td>${c.lacto.glow > 0.6 ? '↑ (no dopamine)' : 'restrained'}</td></tr>${st.step >= 8 ? `<tr><td>ADH release</td><td>${st.tog.cut ? '↓ (transport cut)' : st.tog.osm ? '↑' : 'basal'}</td></tr>` : ''}</table>`;
          },
          caption(st) {
            if (st.tog.cut) return '**Stalk cut:** portal blood no longer reaches the anterior lobe, so ACTH, TSH, LH/FSH and GH fall. **Prolactin rises** because dopamine inhibition is lost. Axonal transport of ADH is interrupted, so ADH falls (diabetes insipidus).';
            return null;
          },
          reset() { P.clearDots(); stored[0] = stored[1] = 0; Object.values(cellEls).forEach((c) => (c.glow = 0)); },
        };
      },
    });
  };

  // ======================================================================
  // 2. β-cell stimulus–secretion coupling
  // ======================================================================
  EP.anim.beta = function (container) {
    return EP.mountAnim(container, {
      key: [
        ['Moving dots', [{ dot: 'var(--m-glc)', label: 'Glucose' }, { dot: 'color-mix(in srgb, var(--m-glc) 60%, var(--panel))', label: 'Glucose-6-P → metabolism' }, { dot: 'var(--c-ion)', label: 'K⁺ leaving (K-ATP open)' }, { dot: 'var(--c-messenger)', label: 'Ca²⁺ entering' }, { dot: 'var(--accent2)', label: 'cAMP (GLP-1 signal)' }, { dot: 'var(--c-hormone)', label: 'Insulin released' }]],
        ['Membrane proteins (filled = open/active)', [{ fill: 'var(--panel)', stroke: 'var(--c-transporter)', label: 'GLUT1/2' }, { fill: 'color-mix(in srgb, var(--c-ion) 35%, var(--panel))', stroke: 'var(--c-ion)', label: 'K-ATP channel' }, { fill: 'color-mix(in srgb, var(--c-messenger) 40%, var(--panel))', stroke: 'var(--c-messenger)', label: 'Voltage-gated Ca²⁺ channel' }, { fill: 'color-mix(in srgb, var(--c-receptor) 40%, var(--panel))', stroke: 'var(--c-receptor)', label: 'GLP-1 receptor' }]],
        ['Inside the cell', [{ fill: 'color-mix(in srgb, var(--c-hormone) 25%, var(--panel))', stroke: 'var(--c-hormone)', rx: 9, label: 'Insulin granule' }, { fill: 'color-mix(in srgb, var(--c-enzyme) 15%, var(--panel))', stroke: 'var(--c-enzyme)', rx: 8, label: 'Mitochondria' }, { fill: 'var(--c-enzyme)', label: 'ATP/ADP gauge' }, { line: 'var(--accent)', label: 'Membrane potential trace' }]],
      ],
      title: 'β-cell stimulus–secretion coupling', W: 900, H: 560, listTitle: 'Glucose → insulin',
      steps: [
        ['Glucose enters (GLUT1/2)', 'Glucose enters through facilitative transporters (GLUT1 in human β-cells, GLUT2 in rodents). Inside, glucose rises in step with plasma glucose.'],
        ['Glucokinase: the glucose sensor', '**Glucokinase** (high Km, no product inhibition) phosphorylates glucose in proportion to its concentration. This sets the threshold for secretion.'],
        ['Metabolism raises ATP/ADP', 'Glycolysis and mitochondrial oxidation raise the **ATP/ADP ratio**.'],
        ['KATP channels close', 'ATP closes **K-ATP channels** (Kir6.2/SUR1), so K⁺ efflux stops. **Sulfonylureas** close them directly; **diazoxide** holds them open.'],
        ['Depolarization', 'With less outward K⁺ current the membrane **depolarizes** and fires Ca²⁺ action potentials in bursts.'],
        ['Voltage-gated Ca²⁺ entry', 'L-type (and other) **voltage-gated Ca²⁺ channels** open and Ca²⁺ floods in.'],
        ['Exocytosis: first phase', 'Ca²⁺ triggers fusion of **docked granules**. Insulin and C-peptide (equimolar) are released in a first-phase spike.'],
        ['Second phase + incretin amplification', 'Reserve granules are recruited (**second phase**). **GLP-1/GIP** → cAMP → PKA/Epac2 amplify exocytosis, but only when glucose is elevated (glucose-dependent).'],
      ],
      toggles: [
        { id: 'glc', label: 'High glucose', on: true },
        { id: 'glp1', label: 'GLP-1' },
        { id: 'su', label: 'Sulfonylurea', excl: ['dz'] },
        { id: 'dz', label: 'Diazoxide', excl: ['su'] },
      ],
      side: '{{ref:rorsman2018}} {{ref:molina7}} {{ref:drucker2018}}',
      build(P) {
        const { L } = P;
        L.bg.append(s('rect', { x: 0, y: 0, width: 900, height: 96, class: 'a-region blood' }), s('rect', { x: 30, y: 100, width: 840, height: 440, rx: 34, class: 'a-region cell' }));
        lbl(P, 14, 22, 'Islet capillary', 'a-head', 'start'); lbl(P, 52, 528, 'β-CELL', 'a-head', 'start');
        // channels on membrane (y=100)
        const ch = (x, label, cls) => { const g = s('g', { class: 'a-chan ' + cls }); g.append(s('rect', { x: x - 16, y: 86, width: 32, height: 30, rx: 6 })); L.fg.appendChild(g); lbl(P, x, 136, label, 'a-small'); return g; };
        const glut = ch(110, 'GLUT1/2', 'glut'), katp = ch(330, 'K-ATP', 'katp'), vgcc = ch(510, 'VGCC', 'vgcc'), glp1r = ch(780, 'GLP-1R', 'glp1r');
        // inner nodes
        const node = (x, y, t, cls) => { const g = s('g', { class: 'a-node ' + (cls || '') }); const w = EP.textWidth(t, 12) + 22; g.append(s('rect', { x: x - w / 2, y: y - 14, width: w, height: 28, rx: 14 })); L.fg.appendChild(g); lbl(P, x, y + 4, t, 'a-nlabel'); return g; };
        const gk = node(110, 210, 'Glucokinase');
        L.bg.appendChild(s('ellipse', { cx: 150, cy: 360, rx: 85, ry: 45, class: 'a-mito' }));
        lbl(P, 150, 364, 'Mitochondria', 'a-small');
        const atpBar = s('rect', { x: 250, y: 300, width: 18, height: 0, class: 'a-bar' });
        L.fg.append(s('rect', { x: 250, y: 220, width: 18, height: 160, class: 'a-bartrack' }), atpBar);
        lbl(P, 259, 398, 'ATP/ADP', 'a-small');
        const camp = node(760, 210, 'cAMP → PKA / Epac2', 'camp');
        // granules
        const docked = [], reserve = [];
        for (let i = 0; i < 6; i++) docked.push({ x: 580 + i * 34, y: 122, s: 'docked' });
        for (let i = 0; i < 14; i++) reserve.push({ x: 560 + (i % 7) * 36, y: 270 + Math.floor(i / 7) * 46, s: 'reserve' });
        const grans = [...docked, ...reserve].map((g) => { const c = s('g', { class: 'a-gran' }); c.append(s('circle', { r: 11 }), s('circle', { r: 4.5, class: 'core' })); L.fg.appendChild(c); g.el = c; g.hx = g.x; g.hy = g.y; return g; });
        lbl(P, 690, 340 + 46, 'insulin granules (reserve pool)', 'a-small');
        // Vm trace
        const VX = 330, VY = 430, VW = 250, VH = 80;
        L.fg.append(s('rect', { x: VX, y: VY, width: VW, height: VH, rx: 8, class: 'a-trace-bg' }));
        lbl(P, VX + 6, VY - 8, 'Membrane potential', 'a-small', 'start');
        lbl(P, VX + VW + 4, VY + VH - 6, '−70 mV', 'a-note', 'start'); lbl(P, VX + VW + 4, VY + 10, '≈ 0 mV', 'a-note', 'start');
        const trace = s('polyline', { class: 'a-trace', points: '' }); L.fg.appendChild(trace);
        const vHist = new Array(120).fill(-70);
        // state
        const S = { gin: 0, atp: 0.2, katp: 1, vm: -70, ca: 0, sec: 0, phase: 0 }; const T = {};
        let caEl = s('rect', { x: 480, y: 160, width: 120, height: 0 });
        return {
          update(dt, st) {
            const k = st.step, tg = st.tog, G = tg.glc ? 1 : 0.15;
            S.gin = lerp(S.gin, G, dt * 1.5);
            if (every(T, 'gl', 0.35 / (0.3 + G), dt)) P.drift(110 + (Math.random() - 0.5) * 30, 30, 110, 180, { cls: 'glc', v: 110, onEnd: () => { if (k >= 1) P.drift(110, 230, 150, 340, { cls: 'g6p', v: 80, r: 3 }); } });
            const atpT = k >= 2 ? 0.15 + 0.85 * S.gin : 0.2;
            S.atp = lerp(S.atp, atpT, dt * 0.9);
            atpBar.setAttribute('height', (S.atp * 160).toFixed(1)); atpBar.setAttribute('y', (380 - S.atp * 160).toFixed(1));
            let kt = k >= 3 ? clamp(1.25 - S.atp * 1.3, 0.05, 1) : 1;
            if (tg.su) kt = 0.03; if (tg.dz) kt = 1;
            S.katp = lerp(S.katp, kt, dt * 3);
            katp.classList.toggle('open', S.katp > 0.5);
            if (every(T, 'k', 0.12 / Math.max(S.katp, 0.05), dt) && S.katp > 0.15) P.drift(330, 115, 330 + (Math.random() - 0.5) * 40, 20, { cls: 'kion', v: 110, r: 3 });
            // membrane potential: bursting when KATP mostly closed
            const depol = k >= 4 ? clamp((0.55 - S.katp) / 0.5, 0, 1) : 0;
            S.phase += dt * 6;
            const spike = depol > 0.05 ? (Math.sin(S.phase * 3) > 0.6 ? 35 * depol : 0) : 0;
            S.vm = lerp(S.vm, -70 + 32 * depol + spike, 0.5);
            if (every(T, 'tr', 0.03, dt)) { vHist.push(S.vm); vHist.shift(); trace.setAttribute('points', vHist.map((v, i) => `${VX + i * (VW / 119)},${VY + VH - clamp((v + 75) / 78, 0, 1) * VH}`).join(' ')); }
            S.ca = k >= 5 ? lerp(S.ca, depol, dt * 2) : 0;
            vgcc.classList.toggle('open', S.ca > 0.2);
            if (S.ca > 0.15 && every(T, 'ca', 0.1 / S.ca, dt)) P.drift(510 + (Math.random() - 0.5) * 20, 30, 520 + (Math.random() - 0.5) * 140, 160 + Math.random() * 120, { cls: 'caion', v: 140, r: 2.8 });
            const inc = tg.glp1 && k >= 7 ? (G > 0.5 ? 1.8 : 1.1) : 1;
            glp1r.classList.toggle('open', !!tg.glp1); camp.classList.toggle('on', !!tg.glp1 && k >= 7);
            if (tg.glp1 && k >= 7 && every(T, 'camp', 0.4, dt)) P.drift(780, 120, 760, 200, { cls: 'campdot', v: 70, r: 3 });
            // exocytosis
            S.sec = k >= 6 ? S.ca * inc : 0;
            grans.forEach((g) => {
              if (g.s === 'docked' && S.sec > 0.2 && Math.random() < S.sec * dt * 0.9) {
                g.s = 'fusing'; g.t = 0;
                for (let i = 0; i < 3; i++) P.drift(g.x, 100, g.x + (Math.random() - 0.5) * 60, 20 + Math.random() * 30, { cls: 'ins', v: 70, r: 2.6 });
              } else if (g.s === 'fusing') { g.t += dt; if (g.t > 0.6) { g.s = 'gone'; g.t = 0; } }
              else if (g.s === 'gone') { g.t += dt; if (g.t > (k >= 7 ? 1.4 / inc : 6)) { g.s = 'refill'; g.x = g.hx; g.y = 300; } }
              else if (g.s === 'refill') { g.y = lerp(g.y, g.hy, dt * 2); if (Math.abs(g.y - g.hy) < 1) g.s = 'docked'; }
              else if (g.s === 'reserve' && k >= 7) { g.y = g.hy + Math.sin(S.phase * 0.3 + g.hx) * 3; }
              const op = g.s === 'gone' ? 0 : g.s === 'fusing' ? 1 - g.t / 0.6 : 1;
              const yy = g.s === 'fusing' ? lerp(g.y, 104, Math.min(1, g.t * 3)) : g.y;
              g.el.setAttribute('transform', `translate(${g.x},${yy})`); g.el.style.opacity = op;
            });
          },
          readout(st) {
            const w = (x, a = 0.3, b = 0.7) => (x > b ? '↑↑' : x > a ? '↑' : 'low');
            return `<div class="why-head">Now</div><table class="cmp-table small"><tr><td>ATP/ADP</td><td>${w(S.atp, 0.35, 0.75)}</td></tr><tr><td>K-ATP</td><td>${S.katp > 0.5 ? 'open' : 'closed'}</td></tr><tr><td>Membrane</td><td>${S.vm > -55 ? 'depolarized, bursting' : 'resting ≈ −70 mV'}</td></tr><tr><td>Ca²⁺ entry</td><td>${w(S.ca)}</td></tr><tr><td>Insulin release</td><td>${S.sec > 1.2 ? '↑↑ (amplified)' : w(S.sec)}</td></tr></table>`;
          },
          caption(st) {
            if (st.tog.su && !st.tog.glc) return '**Sulfonylurea at low glucose:** K-ATP closes regardless of metabolism, so insulin is released even when glucose is low — the cause of **sulfonylurea hypoglycemia**.';
            if (st.tog.dz) return '**Diazoxide** holds K-ATP open, so the cell cannot depolarize. It is used for hyperinsulinemic hypoglycemia (e.g., insulinoma).';
            if (st.tog.glp1 && !st.tog.glc && st.step >= 7) return '**GLP-1 at low glucose:** cAMP alone cannot trigger exocytosis without the Ca²⁺ signal. This is why GLP-1 agonists rarely cause hypoglycemia on their own.';
            return null;
          },
          reset() { P.clearDots(); },
        };
      },
    });
  };

  // ======================================================================
  // 3. Nuclear receptor: cortisol → GR → GRE → gene → protein
  // ======================================================================
  EP.anim.gr = function (container) {
    return EP.mountAnim(container, {
      key: [
        ['Molecules', [{ dot: 'var(--c-hormone)', label: 'Cortisol' }, { dot: 'var(--c-drug)', label: 'Dexamethasone' }, { fill: 'color-mix(in srgb, var(--c-transport) 25%, var(--panel))', stroke: 'var(--c-transport)', rx: 8, label: 'CBG carrying cortisol' }, { fill: 'color-mix(in srgb, var(--c-receptor) 30%, var(--panel))', stroke: 'var(--c-receptor)', rx: 6, label: 'Glucocorticoid receptor (GR)' }, { dot: 'var(--muted)', label: 'HSP90 chaperone' }, { dot: 'var(--c-tf)', label: 'mRNA' }, { fill: 'var(--c-enzyme)', rx: 3, label: 'New PEPCK protein' }]],
        ['Structures', [{ band: '#ff6b6b', label: 'Plasma' }, { fill: 'var(--panel2)', stroke: 'var(--c-hormone)', sw: 3, rx: 7, label: 'Cell membrane' }, { fill: 'var(--panel)', stroke: 'var(--c-tf)', dash: '6 3', rx: 7, label: 'Nucleus' }, { line: 'var(--c-tf)', w: 3, label: 'DNA (GRE box lights up when bound)' }, { fill: 'color-mix(in srgb, var(--c-enzyme) 30%, var(--panel))', stroke: 'var(--c-enzyme)', rx: 8, label: 'Ribosome' }]],
      ],
      title: 'Cortisol acting through the glucocorticoid receptor', W: 900, H: 540, listTitle: 'Steroid hormone → gene', stepDur: 4.5,
      steps: [
        ['Mostly bound in plasma', 'About 90% of cortisol travels bound to **CBG** (and albumin). Only the **free** fraction can enter cells.'],
        ['Diffuses across the membrane', 'Free cortisol is lipophilic and **diffuses** across the plasma membrane. No membrane receptor is needed.'],
        ['Binds GR; HSP90 released', 'In the cytosol, GR is held in a complex with **HSP90** chaperones. Cortisol binding releases HSP90 and exposes the nuclear localization signal.'],
        ['Nuclear import', 'Liganded GR **dimerizes** and moves through nuclear pores.'],
        ['Binds GREs → transcription', 'GR dimers bind **glucocorticoid response elements** and recruit co-activators → transcription of genes such as **PEPCK**, G6Pase and tyrosine aminotransferase. GR monomers also tether to and inhibit **NF-κB/AP-1** (anti-inflammatory).'],
        ['mRNA → protein (hours)', 'mRNA leaves the nucleus and is translated, so new enzyme accumulates over **hours**. Steroid effects are slow but long-lasting.'],
      ],
      toggles: [
        { id: 'dex', label: 'Dexamethasone', title: 'Synthetic: not bound by CBG, high GR potency', excl: ['mife'] },
        { id: 'mife', label: 'Mifepristone', title: 'GR antagonist', excl: ['dex'] },
      ],
      side: 'Tissue selectivity: in the kidney, **11β-HSD2** converts cortisol to cortisone, so the mineralocorticoid receptor "sees" aldosterone. {{ref:kovacs3}} {{ref:kovacs13}} {{ref:molina6}}',
      build(P) {
        const { L } = P;
        L.bg.append(s('rect', { x: 0, y: 0, width: 900, height: 92, class: 'a-region blood' }), s('rect', { x: 30, y: 98, width: 840, height: 430, rx: 34, class: 'a-region cell' }),
          s('circle', { cx: 650, cy: 330, r: 150, class: 'a-region nucleus' }));
        lbl(P, 14, 22, 'Plasma', 'a-head', 'start'); lbl(P, 52, 516, 'HEPATOCYTE (target cell)', 'a-head', 'start'); lbl(P, 650, 200, 'NUCLEUS', 'a-head');
        // DNA with GRE
        P.path('M540,400 C590,380 620,420 670,400 C720,380 750,420 780,400', 'a-dna', 'bg');
        const gre = s('rect', { x: 618, y: 392, width: 44, height: 18, rx: 4, class: 'a-gre' }); L.fg.appendChild(gre);
        lbl(P, 640, 432, 'GRE · PEPCK gene', 'a-small');
        // pores
        const pores = [[528, 250], [512, 370]];
        pores.forEach(([x, y]) => L.fg.appendChild(s('rect', { x: x - 6, y: y - 12, width: 12, height: 24, rx: 4, class: 'a-pore' })));
        // CBG carriers in plasma
        const cbg = [];
        for (let i = 0; i < 7; i++) { const x = 60 + i * 120, y = 46; const g = s('g', { class: 'a-cbg' }); g.append(s('ellipse', { cx: 0, cy: 0, rx: 22, ry: 13 }), s('circle', { cx: 9, cy: -3, r: 5, class: 'lig' })); L.fg.appendChild(g); cbg.push({ g, x, y, ph: i }); }
        lbl(P, 120, 82, 'CBG-bound', 'a-note');
        // receptors
        const R = [];
        [[200, 250], [300, 330], [200, 400], [380, 230]].forEach(([x, y]) => {
          const g = s('g', { class: 'a-gr' });
          g.append(s('rect', { x: -16, y: -11, width: 32, height: 22, rx: 8, class: 'gr' }), s('circle', { cx: -22, cy: -10, r: 7, class: 'hsp' }), s('circle', { cx: 22, cy: -10, r: 7, class: 'hsp' }), s('circle', { cx: 0, cy: 0, r: 4.5, class: 'lig' }));
          L.fg.appendChild(g); R.push({ g, x, y, hx: x, hy: y, s: 'apo', t: 0 });
        });
        lbl(P, 200, 212, 'GR · HSP90', 'a-small');
        const ribo = [[300, 470], [380, 455], [440, 480]];
        ribo.forEach(([x, y]) => L.fg.appendChild(s('ellipse', { cx: x, cy: y, rx: 12, ry: 8, class: 'a-ribo' })));
        lbl(P, 380, 505, 'ribosomes → PEPCK protein', 'a-small');
        let protein = 0; const protEls = [];
        const T = {};
        return {
          update(dt, st) {
            const k = st.step, dex = st.tog.dex, mife = st.tog.mife;
            cbg.forEach((c) => { c.x += dt * 25; if (c.x > 900) c.x = -20; c.g.setAttribute('transform', `translate(${c.x},${c.y + Math.sin(c.x / 40 + c.ph) * 5})`); });
            // free hormone diffusing
            const rate = dex ? 0.35 : 0.9;
            if (every(T, 'free', rate, dt)) {
              const x = 80 + Math.random() * 400;
              if (k >= 1) P.drift(x, 30, x + (Math.random() - 0.5) * 60, 160 + Math.random() * 60, { cls: dex ? 'dex' : 'cort', v: 70, onEnd: (d) => {
                if (k < 2) return;
                const apo = R.find((r) => r.s === 'apo'); if (apo) { apo.s = 'bound'; apo.t = 0; apo.anta = !!mife; }
              } });
              else P.drift(x, 30, x + 60, 60, { cls: dex ? 'dex' : 'cort', v: 40 });
            }
            R.forEach((r, i) => {
              r.t += dt;
              const hsp = r.g.querySelectorAll('.hsp'), lig = r.g.querySelector('.lig');
              if (r.s === 'apo') { hsp.forEach((e) => (e.style.opacity = 1)); lig.style.opacity = 0; r.x = lerp(r.x, r.hx, dt * 2); r.y = lerp(r.y, r.hy, dt * 2); }
              else if (r.s === 'bound') {
                lig.style.opacity = 1;
                if (r.anta) { if (r.t > 2.5) { r.s = 'apo'; r.t = 0; } }
                else { hsp.forEach((e) => (e.style.opacity = Math.max(0, 1 - r.t * 1.5))); if (r.t > 0.8 && k >= 3) { r.s = 'move'; r.t = 0; r.pore = pores[i % 2]; } }
              } else if (r.s === 'move') {
                const [px, py] = r.pore; r.x = lerp(r.x, px, dt * 1.6); r.y = lerp(r.y, py, dt * 1.6);
                if (Math.hypot(r.x - px, r.y - py) < 6) { r.s = 'nuc'; r.t = 0; }
              } else if (r.s === 'nuc') {
                r.x = lerp(r.x, 640, dt * 1.4); r.y = lerp(r.y, 388, dt * 1.4);
                if (Math.hypot(r.x - 640, r.y - 388) < 6 && k >= 4) { r.s = 'dna'; r.t = 0; }
              } else if (r.s === 'dna') {
                gre.classList.add('on');
                if (every(r, 'tx', dex ? 0.5 : 0.8, dt)) P.drift(640, 380, pores[0][0], pores[0][1], { cls: 'mrna', v: 90, r: 3.2, onEnd: () => { if (k >= 5) { const rb = ribo[Math.floor(Math.random() * 3)]; P.drift(pores[0][0] - 10, pores[0][1], rb[0], rb[1], { cls: 'mrna', v: 90, r: 3.2, onEnd: () => { protein = Math.min(24, protein + 1); } }); } } });
                if (r.t > 5) { r.s = 'apo'; r.t = 0; r.x = r.hx; r.y = r.hy; gre.classList.remove('on'); }
              }
              r.g.setAttribute('transform', `translate(${r.x},${r.y})`);
              r.g.classList.toggle('blocked', !!r.anta && r.s === 'bound');
            });
            while (protEls.length < protein) { const i = protEls.length; const e = s('rect', { x: 80 + (i % 12) * 16, y: 440 + Math.floor(i / 12) * 16, width: 11, height: 11, rx: 3, class: 'a-prot' }); L.fg.appendChild(e); protEls.push(e); }
          },
          readout(st) { return st.step >= 5 ? `<div class="why-head">PEPCK protein made</div><div class="a-meter"><i style="width:${Math.round(protein / 24 * 100)}%"></i></div>` : ''; },
          caption(st) {
            if (st.tog.mife && st.step >= 2) return '**Mifepristone** occupies GR but does not trigger the active conformation. The receptor stays cytosolic and genes are not induced.';
            if (st.tog.dex) return '**Dexamethasone** is not bound by CBG, so far more of it is free and it is a potent GR agonist. It is also not a substrate for 11β-HSD2, so it is used to suppress ACTH (dexamethasone suppression test).';
            return null;
          },
          reset() { P.clearDots(); protein = 0; protEls.forEach((e) => e.remove()); protEls.length = 0; R.forEach((r) => { r.s = 'apo'; r.x = r.hx; r.y = r.hy; }); },
        };
      },
    });
  };
})();
