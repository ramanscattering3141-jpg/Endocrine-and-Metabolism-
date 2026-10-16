/* Animated GLUT4 cell + insulin, GLUT4 and glucagon pages. */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;
  const V = EP.views;

  const STEPS = [
    ['Insulin binds the insulin receptor', 'Insulin binds the α subunits of the receptor dimer.', ['ir']],
    ['Receptor autophosphorylation', 'β-subunit tyrosine kinases trans-phosphorylate each other (P).', ['ir']],
    ['IRS activation', 'IRS-1/2 dock on phosphotyrosines and are phosphorylated.', ['irs']],
    ['PI3K activation', 'p85/p110 PI3K binds phospho-IRS at the membrane.', ['pi3k']],
    ['PIP₂ → PIP₃', 'PI3K converts membrane PIP₂ to PIP₃.', ['pip3']],
    ['Akt activation', 'PIP₃ recruits Akt; PDK1 + mTORC2 phosphorylate it.', ['akt']],
    ['AS160/TBC1D4 inhibited', 'Akt phosphorylates the Rab-GAP AS160 — the brake is released, Rab-GTP rises.', ['as160', 'rab']],
    ['GLUT4 vesicles move to the membrane', 'Rab-GTP + motors carry GLUT4 storage vesicles toward the surface.', ['ves']],
    ['Docking & fusion', 'SNAREs (VAMP2–syntaxin-4) fuse vesicles with the plasma membrane.', ['ves']],
    ['GLUT4 appears on the membrane', 'Transporters now sit in the plasma membrane (and T-tubules).', ['glut']],
    ['Glucose entry ↑', 'Glucose flows down its gradient → hexokinase II → G6P → glycogen / glycolysis (/ triglyceride in fat).', ['glc']],
  ];

  /** Animated cell. opts: {mode:'muscle'|'adipose', insulin, exercise, ir, compact, lockRoute} */
  EP.mountGlut4 = function (container, opts = {}) {
    const W = 900, H = 560;
    const st = { step: 0, ins: !!opts.insulin, ex: !!opts.exercise, ir: !!opts.ir, mode: opts.mode || 'muscle', auto: true, speed: 1, t: 0, stepT: 0, exRamp: 0 };
    const root = h('div.g4' + (opts.compact ? '.compact' : ''), { style: opts.compact ? { gridTemplateColumns: '1fr' } : {} });
    const left = h('div'), right = h('div');
    root.append(left, right);
    container.appendChild(root);

    // ---------- controls ----------
    const bIns = h('button.btn', { onclick: () => setIns(!st.ins) });
    const bEx = h('button.btn', { onclick: () => { st.ex = !st.ex; sync(); } });
    const bIR = h('button.btn', { onclick: () => { st.ir = !st.ir; sync(); }, title: 'Lipid-induced impairment of IRS/PI3K/Akt signaling' });
    const bMode = h('button.btn.ghost', { onclick: () => { st.mode = st.mode === 'muscle' ? 'adipose' : 'muscle'; buildCell(); sync(); } });
    const bPlay = h('button.btn', { onclick: () => { st.auto = !st.auto; sync(); }, title: 'Auto-advance the insulin cascade' });
    const controls = h('div.g4-controls',
      EP.animSwitch(root),
      bIns, opts.lockRoute === 'insulin' ? null : bEx, bIR, bMode,
      h('span', { style: { width: '10px' } }),
      h('button.btn.ghost', { title: 'Step back', onclick: () => { st.auto = false; st.ins = true; st.step = Math.max(0, st.step - 1); sync(); } }, '◀ step'),
      bPlay,
      h('button.btn.ghost', { title: 'Step forward', onclick: () => { st.auto = false; st.ins = true; st.step = Math.min(STEPS.length, st.step + 1); sync(); } }, 'step ▶'),
      h('label.chk', h('input', { type: 'checkbox', onchange: (ev) => { st.speed = ev.target.checked ? 0.35 : 1; } }), 'slow motion'),
      h('button.btn.ghost', { onclick: reset }, '⟲ reset'));
    const svg = s('svg', { class: 'g4-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Animated GLUT4 translocation' });
    svg.appendChild(EP.svgDefs());
    const cap = h('div.g4-cap', '');
    left.append(controls, svg, cap);
    left.appendChild(EP.colorKey([
      ['Moving things', [{ fill: 'var(--c-hormone)', rx: 3, label: 'Insulin (hexagons in blood)' }, { dot: 'var(--c-metabolite)', label: 'Glucose' }, { dot: 'var(--c-tf)', label: 'Glucose-6-P (trapped inside by hexokinase II)' }, { fill: 'color-mix(in srgb, var(--c-transporter) 25%, var(--panel))', stroke: 'var(--c-transporter)', rx: 9, label: 'GLUT4 vesicle → GLUT4 in membrane' }]],
      ['Structures', [{ line: 'var(--c-receptor)', w: 5, label: 'Insulin receptor' }, { fill: 'color-mix(in srgb, #ff6b6b 10%, var(--panel))', label: 'Blood / interstitial fluid' }, { fill: 'var(--panel2)', stroke: 'var(--c-hormone)', sw: 3, rx: 7, label: 'Cell membrane' }, { dot: 'var(--accent2)', label: 'Glycogen granules (muscle)' }, { fill: 'color-mix(in srgb, #ffd166 30%, var(--panel))', stroke: '#ffd166', rx: 8, label: 'Lipid droplet (adipocyte)' }, { fill: 'color-mix(in srgb, var(--c-enzyme) 25%, var(--panel))', stroke: 'var(--c-enzyme)', rx: 8, label: 'Mitochondria' }]],
      ['Signaling boxes (light up in sequence)', ['receptor', 'kinase', 'messenger', 'ion', 'transporter'].map((x) => ({ node: x, label: EP.TYPE_LABEL[x] }))],
    ]));

    const stepList = h('ol.g4-steps', STEPS.map(([t]) => h('li', t)));
    const fateBox = h('div');
    right.append(h('h4', 'Insulin cascade'), stepList, h('h4', 'Where the glucose goes'), fateBox,
      h('p.small.muted', { html: EP.md('Contraction route (Level 2+): AMPK → TBC1D1, Ca²⁺/CaMKII and Rac1 — distinct from Akt/AS160 and preserved in insulin resistance {{ref:sylow2017}} {{ref:richter2013}}.') }));

    // ---------- scene ----------
    let gStatic, gCascade, gVes, gMem, gParticles, nodes = {}, slots = [], vesicles = [], parts = [], fateCount = { glycogen: 0, glycolysis: 0, lipid: 0 }, fateEls = {};
    function pill(id, x, y, label, type) {
      const g = s('g', { class: `node t-${type} g4n`, transform: `translate(${x},${y})` });
      const w = Math.max(56, label.length * 7.2 + 18);
      g.appendChild(EP.shapeFor(type, w, 26));
      g.appendChild(s('text', { class: 'node-label', 'text-anchor': 'middle', y: 4 }, label));
      g.style.opacity = 0.25;
      gCascade.appendChild(g); nodes[id] = g; return g;
    }
    function link(a, b, type) {
      const A = nodes[a].transform.baseVal[0].matrix, B = nodes[b].transform.baseVal[0].matrix;
      const p = s('path', { d: `M${A.e},${A.f + 14} L${B.e},${B.f - 14}`, class: 'edge e-' + type, 'marker-end': `url(#m-${type})`, style: 'opacity:.25' });
      gCascade.insertBefore(p, gCascade.firstChild); nodes[a + '>' + b] = p;
    }
    function buildCell() {
      EP.clear(svg); svg.appendChild(EP.svgDefs());
      gStatic = s('g'); gCascade = s('g'); gVes = s('g'); gMem = s('g'); gParticles = s('g');
      svg.append(gStatic, gMem, gCascade, gVes, gParticles);
      nodes = {}; vesicles = []; parts = []; slots = [];
      gStatic.appendChild(s('rect', { x: 0, y: 0, width: W, height: 112, class: 'g4-blood', fill: 'color-mix(in srgb, #ff6b6b 7%, transparent)' }));
      gStatic.appendChild(s('text', { x: 14, y: 22, class: 'comp-label' }, 'Interstitial fluid / capillary'));
      gStatic.appendChild(s('rect', { x: 30, y: 112, width: W - 60, height: H - 130, rx: 30, fill: 'color-mix(in srgb, var(--panel2) 75%, transparent)', stroke: 'var(--c-hormone)', 'stroke-width': 5, 'stroke-opacity': 0.55 }));
      gStatic.appendChild(s('text', { x: 50, y: H - 30, class: 'comp-label' }, st.mode === 'muscle' ? 'Skeletal muscle fibre' : 'Adipocyte'));
      if (st.mode === 'muscle') {
        // striations stop short of the mitochondria and glycogen (and their labels) so no line runs under text
        for (let x = 60; x < W - 60; x += 26) gStatic.appendChild(s('line', { x1: x, y1: 400, x2: x, y2: x < 170 ? 440 : x > 228 && x < 305 ? 456 : 520, stroke: 'var(--line)', 'stroke-width': 6, opacity: 0.35 }));
        gStatic.appendChild(s('text', { x: 560, y: 535, class: 'comp-label' }, 'sarcomeres · SR Ca²⁺ stores'));
        // glycogen granules
        const gg = s('g', { transform: 'translate(250,470)' });
        for (let i = 0; i < 9; i++) gg.appendChild(s('circle', { cx: (i % 3) * 14, cy: Math.floor(i / 3) * 14, r: 6, fill: 'var(--accent2)', opacity: 0.6 }));
        gg.appendChild(s('text', { x: -8, y: 56, class: 'edge-label' }, 'glycogen'));
        gStatic.appendChild(gg);
      } else {
        gStatic.appendChild(s('ellipse', { cx: 270, cy: 470, rx: 90, ry: 50, fill: 'color-mix(in srgb, #ffd166 30%, transparent)', stroke: '#ffd166' }));
        gStatic.appendChild(s('text', { x: 230, y: 475, class: 'edge-label' }, 'lipid droplet (TG)'));
      }
      gStatic.appendChild(s('ellipse', { cx: 110, cy: 470, rx: 48, ry: 24, fill: 'color-mix(in srgb, var(--c-enzyme) 25%, transparent)', stroke: 'var(--c-enzyme)' }));
      gStatic.appendChild(s('text', { x: 72, y: 510, class: 'edge-label' }, 'mitochondria'));
      // receptor
      const rec = s('g', { transform: 'translate(150,118)' });
      rec.appendChild(s('path', { d: 'M-14,-22 L-14,6 L-4,16 L-4,40 M14,-22 L14,6 L4,16 L4,40', stroke: 'var(--c-receptor)', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }));
      gStatic.appendChild(rec);
      nodes.recP = s('text', { x: 172, y: 150, class: 'badge', fill: 'var(--c-stim)', style: 'opacity:0' }, 'P  P');
      gStatic.appendChild(nodes.recP);
      gStatic.appendChild(s('text', { x: 128, y: 100, class: 'edge-label', 'text-anchor': 'end' }, 'insulin receptor'));
      nodes.insBound = s('path', { d: 'M138,80 L162,80 L168,90 L162,100 L138,100 L132,90 Z', fill: 'var(--c-hormone)', style: 'opacity:0' });
      gStatic.appendChild(nodes.insBound);
      // cascade pills
      pill('ir', 150, 175, 'IR (pY)', 'receptor'); pill('irs', 150, 225, 'IRS-1/2', 'kinase'); pill('pi3k', 150, 275, 'PI3K', 'kinase');
      pill('pip3', 300, 150, 'PIP₂ → PIP₃', 'messenger'); pill('akt', 150, 335, 'Akt', 'kinase'); pill('as160', 300, 335, 'AS160 ⊣', 'kinase'); pill('rab', 430, 335, 'Rab-GTP', 'kinase');
      link('ir', 'irs', 'stim'); link('irs', 'pi3k', 'stim'); link('pi3k', 'akt', 'stim');
      // contraction route
      pill('ca', 770, 185, 'Ca²⁺ (SR)', 'ion'); pill('ampk', 770, 240, 'AMPK', 'kinase'); pill('rac1', 770, 295, 'Rac1 / CaMKII', 'kinase'); pill('tbc1d1', 640, 335, 'TBC1D1 ⊣', 'kinase');
      link('ca', 'ampk', 'stim'); link('ampk', 'rac1', 'stim');
      gStatic.appendChild(s('text', { x: 700, y: 160, class: 'edge-label' }, 'contraction route'));
      // membrane slots
      for (let x = 330, i = 0; x <= 840 && i < 14; x += 36, i++) slots.push({ x, used: null });
      // vesicles
      for (let i = 0; i < 14; i++) {
        const hx = 470 + (i % 5) * 46 + (Math.floor(i / 5) % 2) * 20, hy = 395 + Math.floor(i / 5) * 36;
        const g = s('g');
        g.appendChild(s('circle', { r: 13, fill: 'color-mix(in srgb, var(--c-transporter) 18%, var(--panel))', stroke: 'var(--c-transporter)', 'stroke-width': 2 }));
        g.appendChild(s('rect', { x: -6, y: -4, width: 4, height: 8, fill: 'var(--c-transporter)' })); g.appendChild(s('rect', { x: 2, y: -4, width: 4, height: 8, fill: 'var(--c-transporter)' }));
        gVes.appendChild(g);
        vesicles.push({ g, home: [hx, hy], x: hx, y: hy, state: 'in', slot: null, t: 0, tr: null });
      }
      gStatic.appendChild(s('text', { x: 520, y: 380, class: 'edge-label' }, 'GLUT4 storage vesicles'));
      // fate labels
      EP.clear(fateBox);
      const fates = st.mode === 'muscle' ? [['glycogen', 'Glycogen (dominant fate in muscle)'], ['glycolysis', 'Glycolysis / oxidation']] : [['lipid', 'Glycerol-3-P → triglyceride'], ['glycolysis', 'Glycolysis / oxidation']];
      fateEls = {};
      fates.forEach(([k, l]) => { const i = h('i'); fateEls[k] = { i, n: h('span.small.muted', '') }; fateBox.appendChild(h('div.fatebar', h('span', l), h('div.fb', i), fateEls[k].n)); });
      fateBox.appendChild(h('div.fatebar', h('span', 'Uptake rate'), h('div.fb', fateEls.rate = h('i', { style: { background: 'var(--c-transporter)' } })), fateEls.rateN = h('span.small.muted', '')));
      fateCount = { glycogen: 0, glycolysis: 0, lipid: 0 };
    }

    // ---------- logic ----------
    function setIns(on) { st.ins = on; st.auto = true; sync(); }
    function reset() { st.ins = !!opts.insulin; st.ex = !!opts.exercise; st.ir = false; st.step = 0; st.auto = true; buildCell(); sync(); }
    function insStrength() { return st.ins ? (st.ir ? 0.3 : 1) : 0; }
    function sync() {
      bIns.textContent = st.ins ? '💉 Insulin: ON' : '💉 Insulin: off'; bIns.classList.toggle('primary', st.ins);
      bEx.textContent = st.ex ? '🏃 Contraction: ON' : '🏃 Contraction: off'; bEx.classList.toggle('primary', st.ex);
      bIR.textContent = st.ir ? '🧱 Insulin resistance: ON' : '🧱 Insulin resistance: off'; bIR.classList.toggle('primary', st.ir);
      bMode.textContent = st.mode === 'muscle' ? 'Cell: muscle ⇄' : 'Cell: adipocyte ⇄';
      bPlay.textContent = st.auto ? '❚❚ hold this step' : '▶ auto-advance steps';
      paintCascade();
    }
    function paintCascade() {
      const k = insStrength();
      const lit = (id, on, strength) => { if (nodes[id]) nodes[id].style.opacity = on ? (0.35 + 0.65 * strength) : 0.22; };
      const s1 = st.step;
      nodes.insBound.style.opacity = st.ins && s1 >= 1 ? 1 : 0;
      nodes.recP.style.opacity = st.ins && s1 >= 2 ? 1 : 0;
      lit('ir', st.ins && s1 >= 2, 1);
      lit('irs', st.ins && s1 >= 3, k); lit('pi3k', st.ins && s1 >= 4, k); lit('pip3', st.ins && s1 >= 5, k); lit('akt', st.ins && s1 >= 6, k);
      lit('as160', st.ins && s1 >= 7, k); lit('rab', st.ins && s1 >= 7, k);
      ['ir>irs', 'irs>pi3k', 'pi3k>akt'].forEach((e, i) => { if (nodes[e]) nodes[e].style.opacity = st.ins && s1 >= 3 + i ? 0.35 + 0.6 * k : 0.2; });
      const exOn = st.ex && EP.state.level >= 1;
      ['ca', 'ampk', 'rac1', 'tbc1d1'].forEach((id) => lit(id, exOn, 1));
      ['ca>ampk', 'ampk>rac1'].forEach((e) => { if (nodes[e]) nodes[e].style.opacity = exOn ? 0.9 : 0.2; });
      [...stepList.children].forEach((li, i) => { li.classList.toggle('done', st.ins && i < s1); li.classList.toggle('cur', st.ins && i === s1 - 1); });
      const msg = st.ins ? (s1 ? `<strong>Step ${s1}: ${STEPS[s1 - 1][0]}.</strong> ${STEPS[s1 - 1][1]}` : 'Insulin arriving…') : (st.step > 0 ? 'Insulin removed: receptor dephosphorylates, Akt activity decays, GLUT4 is endocytosed back into storage vesicles.' : 'Baseline: most GLUT4 is stored intracellularly; glucose uptake is low (basal GLUT1 and a few surface GLUT4).');
      cap.innerHTML = msg + (st.ex ? ' <span class="tag">Contraction</span> AMPK/TBC1D1, Ca²⁺/CaMKII and Rac1 translocate GLUT4 <em>independently of insulin</em>.' : '') + (st.ir && st.ins ? ' <span class="tag warn">Insulin resistance</span> IRS→PI3K→Akt signaling is blunted, so fewer vesicles move.' : '');
    }
    function targetOut() {
      const insPart = st.ins && st.step >= 8 ? 0.62 * insStrength() : 0;
      const exPart = 0.55 * st.exRamp;
      return Math.round(EP.clamp(0.12 + insPart + exPart - 0.6 * insPart * exPart, 0, 0.92) * vesicles.length);
    }
    const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    let spawnAcc = 0, uptakeRate = 0;
    const stop = EP.loop((dtRaw) => {
      const dt = dtRaw * st.speed;
      st.t += dt;
      // step progression
      st.stepT += dt;
      if (st.ins && st.auto && st.step < STEPS.length && st.stepT > 1.3) { st.step++; st.stepT = 0; paintCascade(); }
      if (!st.ins && st.step > 0 && st.stepT > 0.5) { st.step--; st.stepT = 0; paintCascade(); }
      st.exRamp = EP.clamp(st.exRamp + (st.ex ? 1 : -1) * dt * 0.8, 0, 1);
      // vesicle management
      const out = vesicles.filter((v) => v.state !== 'in' && v.state !== 'returning').length;
      const tgt = targetOut();
      if (out < tgt) {
        const v = vesicles.find((x) => x.state === 'in');
        const slot = slots.find((x) => !x.used);
        if (v && slot && Math.random() < dt * 3) { v.state = 'moving'; v.slot = slot; slot.used = v; v.t = 0; v.from = [v.x, v.y]; }
      } else if (out > tgt) {
        const v = vesicles.find((x) => x.state === 'fused');
        if (v && Math.random() < dt * 2) { v.state = 'returning'; v.t = 0; v.from = [v.slot.x, 130]; if (v.tr) { v.tr.remove(); v.tr = null; } v.slot.used = null; v.slot = null; v.g.style.display = ''; }
      }
      vesicles.forEach((v) => {
        if (v.state === 'moving') {
          v.t += dt / 1.6; const e = ease(Math.min(1, v.t));
          v.x = EP.lerp(v.from[0], v.slot.x, e); v.y = EP.lerp(v.from[1], 142, e) - Math.sin(e * Math.PI) * 30;
          if (v.t >= 1) { v.state = 'docked'; v.t = 0; }
        } else if (v.state === 'docked') {
          v.t += dt / 0.5; v.g.style.opacity = 1 - v.t * 0.7;
          if (v.t >= 1) {
            v.state = 'fused'; v.g.style.display = 'none'; v.g.style.opacity = 1;
            const tr = s('g', { transform: `translate(${v.slot.x},118)` });
            tr.appendChild(s('rect', { x: -9, y: -12, width: 18, height: 24, rx: 4, fill: 'color-mix(in srgb, var(--c-transporter) 30%, var(--panel))', stroke: 'var(--c-transporter)', 'stroke-width': 2 }));
            tr.appendChild(s('line', { x1: 0, y1: -10, x2: 0, y2: 10, stroke: 'var(--c-transporter)', 'stroke-width': 2 }));
            gMem.appendChild(tr); v.tr = tr;
          }
        } else if (v.state === 'returning') {
          v.t += dt / 1.6; const e = ease(Math.min(1, v.t));
          v.x = EP.lerp(v.from[0], v.home[0], e); v.y = EP.lerp(v.from[1] + 20, v.home[1], e);
          if (v.t >= 1) v.state = 'in';
        }
        if (v.state !== 'fused') v.g.setAttribute('transform', `translate(${v.x},${v.y})`);
      });
      // glucose particles
      const active = slots.filter((x) => x.used && x.used.state === 'fused');
      const basal = 0.6; // GLUT1/basal
      const rate = basal + active.length * 1.1;
      uptakeRate = EP.lerp(uptakeRate, rate, dt * 2);
      spawnAcc += rate * dt;
      while (spawnAcc > 1) {
        spawnAcc -= 1;
        const viaSlot = active.length && Math.random() > basal / rate ? active[Math.floor(Math.random() * active.length)] : { x: 60 + Math.random() * 200 };
        const c = s('circle', { r: 4.5, fill: 'var(--c-metabolite)', stroke: '#000', 'stroke-opacity': 0.25 });
        gParticles.appendChild(c);
        const fate = st.mode === 'muscle' ? (Math.random() < 0.7 ? 'glycogen' : 'glycolysis') : (Math.random() < 0.55 ? 'lipid' : 'glycolysis');
        const dest = fate === 'glycogen' ? [262, 484] : fate === 'lipid' ? [270, 470] : [110, 470];
        parts.push({ c, x: viaSlot.x + (Math.random() - 0.5) * 8, y: 40 + Math.random() * 40, gate: viaSlot.x, phase: 0, dest, fate, t: 0 });
      }
      parts = parts.filter((p) => {
        p.t += dt;
        if (p.phase === 0) { p.y += dt * 70; if (p.y >= 130) { p.phase = 1; p.from = [p.x, p.y]; p.t = 0; p.c.setAttribute('fill', 'var(--c-tf)'); } }
        else { const e = Math.min(1, p.t / 1.8); p.x = EP.lerp(p.from[0], p.dest[0], e); p.y = EP.lerp(p.from[1], p.dest[1], e); if (e >= 1) { fateCount[p.fate] = (fateCount[p.fate] || 0) * 0.98 + 1; p.c.remove(); return false; } }
        p.c.setAttribute('cx', p.x); p.c.setAttribute('cy', p.y);
        return true;
      });
      // insulin particles in blood (decor with meaning: present only when insulin on)
      if (st.ins && Math.random() < dt * 3) {
        const hx = s('path', { d: 'M-7,-5 L7,-5 L10,0 L7,5 L-7,5 L-10,0 Z', fill: 'var(--c-hormone)', opacity: 0.8 });
        const p = { c: hx, x: -10, y: 50 + Math.random() * 40, ins: true };
        gParticles.appendChild(hx);
        const mv = EP.loop((d) => { p.x += d * 90 * st.speed; hx.setAttribute('transform', `translate(${p.x},${p.y})`); if (p.x > W + 20) { hx.remove(); mv(); } }, { scope: root });
      }
      // fate bars
      const tot = Object.values(fateCount).reduce((a, b) => a + b, 0) || 1;
      Object.keys(fateEls).forEach((k) => { if (fateEls[k].i && fateCount[k] != null) { fateEls[k].i.style.width = (100 * fateCount[k] / tot).toFixed(0) + '%'; fateEls[k].n.textContent = Math.round(100 * fateCount[k] / tot) + '%'; } });
      if (fateEls.rate) { fateEls.rate.style.width = EP.clamp(uptakeRate / 16 * 100, 2, 100) + '%'; const rr = uptakeRate / basal; fateEls.rateN.textContent = rr < 1.5 ? 'basal' : rr < 5 ? '↑' : '↑↑'; }
    }, { scope: root });
    EP.onTeardown(stop);
    buildCell(); sync();
    return { st, sync, setIns, setEx: (v) => { st.ex = v; sync(); } };
  };

  // ------------------------------------------------------------------ insulin page (prototype module)
  V.insulin = function (el, params) {
    el.appendChild(EP.pageHeader('Insulin: from receptor to whole body', 'What happens when insulin increases? Follow it from receptor binding to GLUT4, glycogen, gluconeogenesis and lipolysis.', { section: 'Pancreas & Glucose', lede: 'Three linked views of the same physiology: (1) an animated cell, (2) the signaling pathway with live organ effects, (3) a whole-body read-out from the metabolic model. Change insulin in any of them.' }));
    el.appendChild(h('h2', '1 · Animated cell: GLUT4 translocation'));
    EP.mountGlut4(el, { mode: 'muscle', insulin: false });
    el.appendChild(h('h2', { style: { marginTop: '18px' } }, '2 · Signaling map with organ effects'));
    el.appendChild(h('p.muted', 'Drag the insulin slider. Level 1 shows the essentials; Level 3 adds PIP₃, PDK1/mTORC2, AS160→Rab, TSC2/Rheb, PKCε; Level 4 adds drugs and lipid-induced insulin resistance. Use "What goes wrong?" to compare insulin resistance and deficiency.'));
    EP.mountPathway(el, 'insulin', { height: 640, focus: params.focus });
    el.appendChild(h('h2', '3 · Whole-body read-out'));
    el.appendChild(wholeBody());
    el.appendChild(h('h2', { style: { marginTop: '18px' } }, '4 · The whole insulin network: PI3K–Akt, mTORC1 and Ras–MAPK'));
    el.appendChild(h('p.muted', 'One receptor, three branches: metabolic (minutes), anabolic (minutes–hours) and mitogenic (hours–days). Try the PI3K inhibitor, rapamycin or MEK inhibitor to see which outputs depend on which branch.'));
    EP.mountCascade(el, 'insulin', { sources: false });
    el.appendChild(h('h2', { style: { marginTop: '18px' } }, '5 · Mechanisms of insulin resistance: the multi-organ cycle'));
    el.appendChild(h('p.muted', 'Petersen & Shulman (2018): adipose insulin resistance raises FFA delivery; hepatic sn-1,2-DAG → PKCε → INSR Thr1160 and muscle DAG → PKCθ → IRS-1 Ser1101 impair signaling; glucose not taken up by muscle feeds hepatic lipogenesis; β-cells compensate until they fail. Step through it, or raise the sliders.'));
    EP.mountPathway(el, 'irmech', { height: 560 });
    el.appendChild(EP.sources(EP.pathways.insulin.refs));
  };
  function wholeBody() {
    const m = EP.metabolic.create();
    const box = h('div.card');
    const clampG = h('input', { type: 'checkbox', checked: true });
    const k = EP.logSlider({ label: 'Insulin infusion', value: 1, span: 2.5, labels: ['none', 'low', 'basal', 'high', 'very high'], onChange: () => upd() });
    const table = h('table.cmp-table');
    clampG.onchange = upd;
    box.append(h('div.pw-knobs', { style: { border: 0, padding: 0 } }, k, h('label.chk', clampG, ' hold glucose constant (euglycemic clamp) — untick to see hypoglycemia and counter-regulation')), EP.modelNote(), table);
    const rows = [['Liver', 'h_glycogenesis', 'h_glycolysis', 'dnl', 'gng', 'h_glycogenolysis', 'ketogenesis', 'hgo'], ['Muscle', 'm_glut4', 'm_uptake', 'm_glycogenesis', 'm_protsyn', 'm_proteolysis'], ['Adipose', 'a_glut4', 'a_uptake', 'esterif', 'lipolysis'], ['Systemic', 'glucose', 'glucagon', 'ffa', 'ketones']];
    function upd() {
      const v = k.get();
      m.applyPreset({ exo: { insulin: Math.max(0, v - 1) * 1 }, clamps: v < 1 ? { insulin: v } : {} });
      if (clampG.checked) m.clamps.glucose = 1;
      m.solve();
      table.innerHTML = '<tr><th>Organ</th><th>Process</th><th></th><th>Main reason</th></tr>' + rows.map((r) => r.slice(1).map((id, i) => {
        const q = EP.qual(m.eff(id), m.ref[id]); const ex = m.explain(id).filter((e) => e.src)[0];
        return `<tr><td>${i ? '' : r[0]}</td><td><a class="linkish" data-n="${id}">${EP.esc(m.byId[id].label)}</a></td><td class="qual ${q.cls}">${q.sym}</td><td class="small muted">${ex && Math.abs(ex.score) > 0.05 ? EP.md((m.byId[ex.src] ? m.byId[ex.src].label : ex.src) + ': ' + (ex.term.why || '')) : '—'}</td></tr>`;
      }).join('')).join('');
      table.querySelectorAll('[data-n]').forEach((a) => { a.onclick = () => { const id = a.dataset.n; const n = m.byId[id]; EP.showInfo(n.ent || id, { node: n, model: m, modelId: id }); }; });
    }
    k.set(3); upd();
    return box;
  }

  // ------------------------------------------------------------------ GLUT4 comparison page
  V.glut4page = function (el) {
    el.appendChild(EP.pageHeader('GLUT4: insulin route vs contraction route', 'Why does exercise increase GLUT4 translocation even when insulin is low?', { section: 'Pancreas & Glucose', lede: 'GLUT4 is not exclusively insulin-dependent. Turn on contraction with insulin off; then add insulin resistance and compare which route survives.' }));
    EP.mountGlut4(el, { mode: 'muscle', exercise: true });
    el.appendChild(h('div.card', h('table.cmp-table', { html:
      '<tr><th></th><th>Insulin-stimulated</th><th>Contraction-stimulated</th></tr>' +
      [['Trigger', 'Insulin → insulin receptor', 'Excitation–contraction, ATP turnover, mechanical stress'],
        ['Proximal signals', 'IRS-1 → PI3K → PIP₃ → Akt2', 'AMPK (↑ AMP:ATP), Ca²⁺/CaMKII, Rac1 / actin remodeling'],
        ['Rab-GAP brake released', 'AS160/TBC1D4 (Akt sites)', 'TBC1D1 (AMPK sites) ± TBC1D4'],
        ['Depends on PI3K?', 'Yes (wortmannin-sensitive)', 'No'],
        ['In insulin resistance', 'Impaired', '**Largely preserved**'],
        ['Other factors', 'Hexokinase II induction', '↑ blood flow / capillary recruitment, ↑ hexokinase, glycogen depletion'],
        ['After exercise', '—', '↑ insulin sensitivity for hours (glycogen resynthesis)']].map((r) => `<tr><th>${r[0]}</th><td>${EP.md(r[1])}</td><td>${EP.md(r[2])}</td></tr>`).join('') }),
      h('p.small.muted', { html: EP.md('{{ref:richter2013}} {{ref:sylow2017}} {{ref:petersen2018}}') })));
    el.appendChild(h('h2', 'In the whole body'));
    el.appendChild(h('p', 'Open the ', h('a', { href: '#/flux?preset=exercise' }, 'flux simulator in the Exercise state'), ': muscle glucose uptake rises ~3–4× while insulin falls (α2-adrenergic suppression) — the contraction route at work.'));
    el.appendChild(EP.sources(['richter2013', 'sylow2017', 'petersen2018', 'hardie2012']));
  };

  // ------------------------------------------------------------------ glucagon page
  V.glucagonPage = function (el, params) {
    el.appendChild(EP.pageHeader('Glucagon simulation', 'Why does glucagon promote glycogenolysis, gluconeogenesis and ketogenesis in the liver — but barely affect skeletal muscle?', { section: 'Pancreas & Glucose', lede: 'Left half: hepatocyte. Right half: skeletal myocyte. Raise glucagon and watch the liver light up while the myocyte stays dark unless epinephrine rises.' }));
    EP.mountPathway(el, 'glucagon', { height: 680, focus: params.focus });
    el.appendChild(h('h2', 'Glucagon signaling network: every branch and what it produces'));
    EP.mountCascade(el, 'glucagon', { sources: false });
    el.appendChild(h('h2', 'Liver vs. muscle in the whole-body model'));
    const m = EP.metabolic.create();
    const card = h('div.card');
    const k = EP.logSlider({ label: 'Glucagon infusion', value: 1, span: 2.5, onChange: () => upd() });
    const holdIns = h('input', { type: 'checkbox', checked: true, onchange: () => upd() });
    const out = h('div.grid2');
    card.append(h('div.pw-knobs', { style: { border: 0, padding: 0 } }, k, h('label.chk', holdIns, ' hold insulin at basal (pancreatic clamp)')), out, EP.modelNote('Acute physiological glucagon rises act mainly through glycogenolysis (Ramnanan 2011); the transcriptional gluconeogenic program is slower.'));
    el.appendChild(card);
    const liver = [['h_pka', 'cAMP/PKA'], ['h_glycogenolysis', 'Glycogenolysis'], ['gng', 'Gluconeogenesis'], ['h_glycolysis', 'Glycolysis'], ['h_glycogenesis', 'Glycogenesis'], ['malonyl', 'Malonyl-CoA'], ['h_fao', 'β-Oxidation'], ['ketogenesis', 'Ketogenesis'], ['h_aaup', 'AA uptake'], ['urea', 'Ureagenesis'], ['hgo', 'Glucose output']];
    const muscle = [['m_glycogenolysis', 'Glycogenolysis'], ['m_glycolysis', 'Glycolysis'], ['m_uptake', 'Glucose uptake'], ['m_fao', 'Fat oxidation'], ['m_protsyn', 'Protein synthesis']];
    function bars(list) {
      return h('table.cmp-table', list.map(([id, l]) => {
        const r = m.eff(id) / m.ref[id]; const q = EP.qual(m.eff(id), m.ref[id]); const lg = EP.clamp(Math.log2(r) / 3, -1, 1);
        return h('tr', h('td', l), h('td', h('span.minibar', h('i', { style: { left: lg >= 0 ? '50%' : (50 + lg * 50) + '%', width: Math.abs(lg) * 50 + '%', background: lg >= 0 ? 'var(--up)' : 'var(--dn)' } }))), h('td.qual.' + q.cls, q.sym));
      }));
    }
    function upd() {
      m.applyPreset({ exo: { glucagon: Math.max(0, k.get() - 1) }, clamps: k.get() < 1 ? { glucagon: k.get() } : {} });
      if (holdIns.checked) m.clamps.insulin = 1;
      m.solve();
      EP.clear(out);
      out.append(h('div', h('h3', 'Liver'), bars(liver)), h('div', h('h3', 'Skeletal muscle'), bars(muscle), h('p.small.muted', { html: EP.md('Muscle changes here are indirect (via plasma glucose and FFA), not via muscle glucagon receptors — muscle lacks functional glucagon signaling and glucose-6-phosphatase (Molina Ch7).') })));
    }
    k.set(3); upd();
    el.appendChild(EP.sources(EP.pathways.glucagon.refs));
  };
})();
