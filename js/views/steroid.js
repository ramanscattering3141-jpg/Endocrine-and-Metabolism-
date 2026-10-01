/* Adrenal steroidogenesis flux map with enzyme-deficiency mode.
 * Flux model: each zone receives cholesterol in proportion to its trophic drive
 * (ZG ← angiotensin II/renin; ZF, ZR ← ACTH). At each metabolite, flux splits among the
 * enzymes present in that zone using fixed branch weights; a deficient enzyme's share is
 * retained as accumulating precursor and the remainder flows on by relative weight.
 * Cortisol feeds back on ACTH; mineralocorticoid activity (aldosterone + DOC) feeds back on renin.
 * Branch weights are teaching approximations (relative), not measured kinetics. */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;

  const MET = {
    chol: ['Cholesterol', 'cholesterol'], preg: ['Pregnenolone', 'pregnenolone'], oh17preg: ['17-OH-pregnenolone', 'oh17preg'], dhea: ['DHEA / DHEA-S', 'dhea'],
    prog: ['Progesterone', 'prog_a'], oh17p: ['17-OH-progesterone', 'oh17p'], a4: ['Androstenedione', 'androstenedione'],
    doc: ['11-Deoxycorticosterone (DOC)', 'doc'], s11: ['11-Deoxycortisol', 'deoxycortisol'], b: ['Corticosterone', 'corticosterone'], cortisol: ['Cortisol', 'cortisol'],
    oh18b: ['18-OH-corticosterone', 'oh18b'], aldo: ['Aldosterone', 'aldosterone'],
    t: ['Testosterone', 'testosterone'], dht: ['DHT', 'dht'], e2: ['Estradiol', 'estradiol'], e1: ['Estrone', 'estrone'],
  };
  const POS = {
    chol: [480, 50], preg: [200, 150], oh17preg: [480, 150], dhea: [760, 150], prog: [200, 280], oh17p: [480, 280], a4: [760, 280],
    doc: [200, 410], s11: [480, 410], b: [200, 530], cortisol: [480, 530], oh18b: [200, 640], aldo: [200, 740],
    t: [1000, 280], dht: [1000, 410], e2: [1000, 530], e1: [1000, 150],
  };
  const ENZ = {
    cyp11a1: 'CYP11A1 (P450scc)', hsd3b2: '3β-HSD2', cyp17oh: 'CYP17 17α-hydroxylase', cyp17ly: 'CYP17 17,20-lyase', cyp21: '21-hydroxylase', cyp11b1: '11β-hydroxylase', cyp11b2: 'Aldosterone synthase', hsd17b: '17β-HSD', srd5a2: '5α-reductase', cyp19: 'Aromatase', star: 'StAR',
  };
  const ENT = { cyp11a1: 'cyp11a1', hsd3b2: 'hsd3b2', cyp17oh: 'cyp17', cyp17ly: 'cyp17', cyp21: 'cyp21', cyp11b1: 'cyp11b1', cyp11b2: 'cyp11b2', hsd17b: 'hsd17b3', srd5a2: 'srd5a2', cyp19: 'cyp19', star: 'star' };
  // reactions: [from, to, enzyme]
  const RX = [
    ['chol', 'preg', 'cyp11a1'], ['preg', 'oh17preg', 'cyp17oh'], ['oh17preg', 'dhea', 'cyp17ly'], ['preg', 'prog', 'hsd3b2'], ['oh17preg', 'oh17p', 'hsd3b2'], ['dhea', 'a4', 'hsd3b2'],
    ['prog', 'oh17p', 'cyp17oh'], ['oh17p', 'a4', 'cyp17ly'], ['prog', 'doc', 'cyp21'], ['oh17p', 's11', 'cyp21'], ['doc', 'b', 'cyp11b1'], ['s11', 'cortisol', 'cyp11b1'],
    ['doc', 'b', 'cyp11b2'], ['b', 'oh18b', 'cyp11b2'], ['oh18b', 'aldo', 'cyp11b2'],
    ['a4', 't', 'hsd17b'], ['t', 'dht', 'srd5a2'], ['t', 'e2', 'cyp19'], ['a4', 'e1', 'cyp19'],
  ];
  // zone-specific branch weights (relative; teaching approximations)
  const ZONES = {
    zg: { label: 'Zona glomerulosa', drive: 'angii', w: { preg: { hsd3b2: 1 }, prog: { cyp21: 1 }, doc: { cyp11b2: 1 }, b: { cyp11b2: 1 }, oh18b: { cyp11b2: 1 } } },
    zf: { label: 'Zona fasciculata', drive: 'acth', leak: { doc: 0.2, b: 1 }, w: { preg: { cyp17oh: 0.8, hsd3b2: 0.2 }, oh17preg: { hsd3b2: 0.9, cyp17ly: 0.1 }, prog: { cyp17oh: 0.7, cyp21: 0.3 }, oh17p: { cyp21: 0.95, cyp17ly: 0.05 }, s11: { cyp11b1: 1 }, doc: { cyp11b1: 1 } } },
    zr: { label: 'Zona reticularis', drive: 'acth', w: { preg: { cyp17oh: 0.9, hsd3b2: 0.1 }, oh17preg: { cyp17ly: 0.9, hsd3b2: 0.1 }, dhea: { hsd3b2: 0.15 }, prog: { cyp17oh: 1 }, oh17p: { cyp17ly: 0.6, cyp21: 0.4 }, s11: { cyp11b1: 1 }, doc: { cyp11b1: 1 } } },
  };
  const ZONE_SHARE = { zg: 0.12, zf: 0.6, zr: 0.28 }; // relative cholesterol throughput at baseline
  const PERIPH = { a4: { hsd17b: 0.15, cyp19: 0.02 }, t: { srd5a2: 0.1, cyp19: 0.02 } };

  const DEFECTS = [
    { id: 'cyp21', label: '21-hydroxylase deficiency (classic)', set: { cyp21: 0.02 }, text: '>90% of CAH. Cortisol (± aldosterone) cannot be made; ACTH rises and drives precursors (17-OHP) into the androgen branch → virilization of 46,XX infants; salt-wasting crisis in the classic form (Speiser 2018).' },
    { id: 'cyp21nc', label: '21-hydroxylase (non-classic, partial)', set: { cyp21: 0.25 }, text: 'Partial activity: cortisol maintained at the cost of higher ACTH; mild androgen excess (hirsutism, irregular menses) presenting later.' },
    { id: 'cyp11b1', label: '11β-hydroxylase deficiency', set: { cyp11b1: 0.03 }, text: 'Cortisol ↓, ACTH ↑ → 11-deoxycortisol and **DOC** accumulate. DOC is a mineralocorticoid → **hypertension, hypokalemia, low renin**; androgens ↑ → virilization.' },
    { id: 'cyp17', label: '17α-hydroxylase deficiency', set: { cyp17oh: 0.02, cyp17ly: 0.02 }, text: 'No cortisol or sex steroids; flux is forced down the mineralocorticoid path: DOC and corticosterone ↑ → hypertension, hypokalemia, suppressed renin/aldosterone. 46,XY undervirilized; absent puberty (Miller & Auchus 2011).' },
    { id: 'hsd3b2', label: '3β-HSD2 deficiency', set: { hsd3b2: 0.03 }, text: 'Δ5 steroids (pregnenolone, 17-OH-pregnenolone, DHEA) accumulate; cortisol and aldosterone fall (salt wasting). Weak DHEA causes mild virilization in 46,XX and undervirilization in 46,XY.' },
    { id: 'star', label: 'Lipoid CAH (StAR)', set: { cyp11a1: 0.03 }, text: 'Cholesterol cannot enter mitochondria: all adrenal and gonadal steroids are deficient; cholesterol esters accumulate and destroy the cells.' },
    { id: 'cyp11b2', label: 'Aldosterone synthase deficiency', set: { cyp11b2: 0.03 }, text: 'Isolated aldosterone deficiency: salt wasting, hyperkalemia, ↑ renin; cortisol and androgens normal; corticosterone/18-OH-B pattern depends on the step affected.' },
    { id: 'srd5a2', label: '5α-reductase type 2 deficiency (periphery)', set: { srd5a2: 0.05 }, text: 'Adrenal output normal; DHT low (undervirilized external genitalia in 46,XY).' },
    { id: 'cyp19', label: 'Aromatase deficiency (periphery)', set: { cyp19: 0.05 }, text: 'Estrogens low, androgens high; in pregnancy maternal virilization.' },
  ];
  EP.data.steroidDefects = DEFECTS;

  function simulate(actIn, exoGC) {
    // returns {rel: {met: level relative to a normal adrenal}, flux, baseFlux, acth, renin}
    let act = {};
    const run = (acth, angii) => {
      const lev = {}; const flux = {};
      Object.keys(MET).forEach((k) => { lev[k] = 0; });
      Object.keys(ZONES).forEach((zk) => {
        const Z = ZONES[zk]; const input = ZONE_SHARE[zk] * (Z.drive === 'acth' ? acth : angii);
        const pool = { chol: input };
        const order = ['chol', 'preg', 'oh17preg', 'prog', 'dhea', 'oh17p', 'doc', 's11', 'b', 'oh18b', 'cortisol', 'aldo', 'a4'];
        const zoneOut = {};
        order.forEach((m) => {
          const amt = pool[m] || 0; if (!amt) return;
          const outs = RX.filter((r) => r[0] === m && ((m === 'chol' && r[2] === 'cyp11a1') || (Z.w[m] && Z.w[m][r[2]] != null)));
          let wsum = 0; const ws = outs.map((r) => { const w = (m === 'chol' ? 1 : Z.w[m][r[2]]) * (act[r[2]] != null ? act[r[2]] : 1); wsum += w; return w; });
          const capacity = outs.reduce((a, r) => a + (m === 'chol' ? 1 : Z.w[m][r[2]]), 0) || 0;
          // fraction converted onward vs. retained (if enzymes deficient, more is retained)
          // a small fraction of every intermediate is secreted as such (basal precursor output)
          const conv = capacity ? Math.min(1, wsum / capacity) * (m === 'chol' ? 1 : 1 - ((Z.leak && Z.leak[m]) || 0.04)) : 0;
          const moved = amt * conv;
          outs.forEach((r, i) => { const f = wsum ? moved * ws[i] / wsum : 0; pool[r[1]] = (pool[r[1]] || 0) + f; flux[zk + ':' + r[0] + '>' + r[1] + ':' + r[2]] = f; });
          zoneOut[m] = amt - moved; // retained / secreted precursor
        });
        Object.keys(zoneOut).forEach((m) => { lev[m] += zoneOut[m]; });
      });
      // periphery: A4 → T → DHT/E2
      const a4 = lev.a4; const tA = a4 * PERIPH.a4.hsd17b * (act.hsd17b != null ? act.hsd17b : 1);
      lev.t += tA; flux['p:a4>t:hsd17b'] = tA;
      const e1 = a4 * PERIPH.a4.cyp19 * (act.cyp19 != null ? act.cyp19 : 1); lev.e1 += e1; flux['p:a4>e1:cyp19'] = e1;
      const dht = lev.t * PERIPH.t.srd5a2 * (act.srd5a2 != null ? act.srd5a2 : 1); lev.dht += dht; flux['p:t>dht:srd5a2'] = dht;
      const e2 = lev.t * PERIPH.t.cyp19 * (act.cyp19 != null ? act.cyp19 : 1); lev.e2 += e2; flux['p:t>e2:cyp19'] = e2;
      return { lev, flux };
    };
    const baseRun = run(1, 1); // normal enzymes (act = {})
    const base = baseRun.lev;
    act = actIn;
    // feedback iteration
    let acth = 1, angii = 1, out;
    for (let i = 0; i < 80; i++) {
      out = run(acth, angii);
      // activity = Σ amount × relative receptor potency (teaching approximations)
      const gc = (out.lev.cortisol + 0.03 * out.lev.b) / (base.cortisol + 0.03 * base.b) + (exoGC || 0);
      const mc = (out.lev.aldo + 0.5 * out.lev.doc + 0.03 * out.lev.b) / (base.aldo + 0.5 * base.doc + 0.03 * base.b);
      const tA = EP.clamp(Math.pow(Math.max(gc, 0.02), -1.1), 0.05, 12);
      const tR = EP.clamp(Math.pow(Math.max(mc, 0.02), -1.2), 0.05, 10);
      acth += 0.3 * (tA - acth); angii += 0.3 * (tR - angii);
    }
    const rel = {}; Object.keys(MET).forEach((k) => { rel[k] = (out.lev[k] + 1e-6) / (base[k] + 1e-6); });
    const mcNow = (out.lev.aldo + 0.5 * out.lev.doc + 0.03 * out.lev.b) / (base.aldo + 0.5 * base.doc + 0.03 * base.b);
    return { rel, flux: out.flux, baseFlux: baseRun.flux, acth, renin: angii, mc: mcNow };
  }

  EP.views.steroid = function (el, params) {
    el.appendChild(EP.pageHeader('Adrenal steroidogenesis map', 'Knock out an enzyme: where does the cholesterol go instead, and what does that do to cortisol, aldosterone, androgens, ACTH and renin?', { section: 'Adrenal', lede: 'The three cortical zones are the visual framework: each zone expresses a different enzyme set. Click any enzyme to learn about it — or toggle it into deficiency and watch flux re-route under ACTH and renin feedback.' }));
    const act = {};
    let exoGC = 0;
    const defBar = h('div.statebar');
    const normal = h('button.chip.on', { onclick: () => setDefect(null, normal) }, 'Normal');
    defBar.appendChild(normal);
    const dBtns = DEFECTS.map((d) => { const b = h('button.chip', { onclick: () => setDefect(d, b) }, d.label); defBar.appendChild(b); return b; });
    const treat = h('input', { type: 'checkbox', onchange: () => { exoGC = treat.checked ? 1 : 0; draw(); } });
    el.append(h('div.card', h('h4', 'Enzyme deficiency mode'), defBar, h('label.chk', treat, ' Treat with glucocorticoid (suppresses ACTH)'), h('p.small.muted', 'Or click any enzyme box on the map to cycle normal → partial → deficient.')));
    const grid = h('div.cols'); const left = h('div'); const right = h('div.sim-panel');
    grid.append(left, right); el.appendChild(grid);
    const story = h('div.net-story'); left.appendChild(story);
    const W = 1120, H = 800;
    const svg = s('svg', { class: 'steroid-svg', viewBox: `0 0 ${W} ${H}` });
    svg.appendChild(EP.svgDefs());
    left.appendChild(svg);
    // zone bands
    [['zg', 70, 'Zona glomerulosa\n(mineralocorticoid)'], ['zf', 350, 'Zona fasciculata\n(glucocorticoid)'], ['zr', 630, 'Zona reticularis\n(androgen)'], ['zp', 880, 'Gonads / periphery']].forEach(([k, x, l]) => {
      svg.appendChild(s('rect', { x, y: 95, width: k === 'zp' ? 230 : 265, height: 700, rx: 18, class: 'zone-band ' + k }));
      l.split('\n').forEach((t, i) => svg.appendChild(s('text', { x: x + 12, y: 770 + i * 14, class: 'zone-title' }, t)));
    });
    const gE = s('g'), gN = s('g'), gZ = s('g');
    svg.append(gE, gN, gZ);
    const edgeEls = {}; const enzEls = {};
    const pairs = {};
    RX.forEach((r) => { const k = r[0] + '>' + r[1]; (pairs[k] = pairs[k] || []).push(r[2]); });
    Object.keys(pairs).forEach((k) => {
      const [a, b] = k.split('>'); const A = POS[a], B = POS[b];
      const enzs = pairs[k];
      const x1 = A[0], y1 = A[1], x2 = B[0], y2 = B[1];
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      const sx = x1 + dx / L * 62, sy = y1 + dy / L * 22, ex = x2 - dx / L * 66, ey = y2 - dy / L * 24;
      const d = `M${sx},${sy} L${ex},${ey}`;
      const p = s('path', { d, class: 'st-edge', 'marker-end': 'url(#m-rxn)' });
      const fl = s('path', { d, class: 'flow' });
      gE.append(p, fl);
      edgeEls[k] = { p, fl, enzs };
      enzs.forEach((en, i) => {
        const mx = (sx + ex) / 2 + (dy === 0 ? 0 : 0), my = (sy + ey) / 2 + (enzs.length > 1 ? (i ? 14 : -14) : 0);
        const label = ENZ[en];
        const w = label.length * 6.1 + 14;
        const g = s('g', { class: 'st-enz', transform: `translate(${mx - w / 2 + (dx === 0 ? (enzs.length > 1 ? (i ? 60 : -60) : 0) : 0)},${my - 10})` });
        g.appendChild(s('rect', { width: w, height: 20, rx: 4 }));
        g.appendChild(s('text', { x: 7, y: 14 }, label));
        g.appendChild(s('title', {}, label + ' — click to cycle normal / partial / deficient; details in the panel'));
        g.addEventListener('click', () => { const v = act[en] == null ? 1 : act[en]; act[en] = v > 0.9 ? 0.25 : v > 0.1 ? 0.02 : 1; [normal, ...dBtns].forEach((b) => b.classList.remove('on')); draw(); EP.showInfo(ENT[en]); });
        gZ.appendChild(g);
        (enzEls[en] = enzEls[en] || []).push(g);
      });
    });
    const nodeEls = {};
    Object.keys(MET).forEach((k) => {
      const [x, y] = POS[k]; const lab = MET[k][0]; const w = Math.max(110, lab.length * 7 + 20);
      const g = s('g', { class: 'st-node' + (['cortisol', 'aldo', 't', 'dhea', 'dht', 'e2'].includes(k) ? ' hormone' : ''), transform: `translate(${x - w / 2},${y - 18})` });
      g.appendChild(s('rect', { width: w, height: 36, rx: 18 }));
      g.appendChild(s('text', { x: w / 2, y: 22, 'text-anchor': 'middle' }, lab));
      const badge = s('text', { x: w - 4, y: -4, 'text-anchor': 'end', class: 'badge' }, '');
      g.appendChild(badge);
      g.style.cursor = 'pointer';
      g.addEventListener('click', () => EP.showInfo(MET[k][1]));
      gN.appendChild(g); nodeEls[k] = { g, badge };
    });
    function setDefect(d, btn) {
      Object.keys(act).forEach((k) => delete act[k]);
      if (d) Object.assign(act, d.set);
      [normal, ...dBtns].forEach((b) => b.classList.toggle('on', b === btn));
      story.innerHTML = d ? `<strong>${EP.esc(d.label)}.</strong> ${EP.md(d.text)}` : 'Normal adrenal: each zone\'s enzyme set channels cholesterol to its characteristic product.';
      draw();
    }
    function draw() {
      const r = simulate(act, exoGC);
      Object.keys(nodeEls).forEach((k) => {
        const q = EP.qual(r.rel[k], 1); const { g, badge } = nodeEls[k];
        g.classList.remove('up', 'up2', 'dn', 'dn2', 'eq'); g.classList.add(q.cls); badge.textContent = q.sym === '↔' ? '' : q.sym; badge.setAttribute('fill', /up/.test(q.cls) ? 'var(--up)' : 'var(--dn)');
      });
      Object.keys(edgeEls).forEach((k) => {
        const { p, fl, enzs } = edgeEls[k];
        let f = 0, f0 = 0;
        Object.keys(r.flux).forEach((fk) => { if (fk.includes(':' + k + ':')) f += r.flux[fk]; });
        Object.keys(r.baseFlux).forEach((fk) => { if (fk.includes(':' + k + ':')) f0 += r.baseFlux[fk]; });
        const rel = f0 > 0 ? f / f0 : 0;
        const blocked = enzs.every((e) => act[e] != null && act[e] < 0.1);
        p.classList.toggle('blocked', blocked);
        p.style.strokeWidth = EP.clamp(1 + Math.log2(rel + 0.2) * 1.6 + 2, 0.6, 9) + 'px';
        fl.style.display = rel < 0.15 ? 'none' : ''; fl.style.animationDuration = (2.4 / EP.clamp(rel, 0.2, 5)).toFixed(2) + 's';
      });
      Object.keys(enzEls).forEach((en) => enzEls[en].forEach((g) => { const v = act[en] == null ? 1 : act[en]; g.classList.toggle('def', v < 0.1); g.classList.toggle('partial', v >= 0.1 && v < 0.9); }));
      // side panel
      const row = (l, v, extra) => { const q = EP.qual(v, 1); return `<tr><td>${l}</td><td class="qual ${q.cls}">${q.sym}</td><td class="small muted">${q.word}${extra ? ' · ' + extra : ''}</td></tr>`; };
      const andro = (r.rel.dhea * 0.5 + r.rel.a4 * 0.3 + r.rel.t * 0.2);
      const mc = r.mc;
      right.innerHTML = '<h4>Hormone read-out</h4><table class="labs">' + row('ACTH', r.acth, 'cortisol feedback') + row('Cortisol', r.rel.cortisol) + row('Aldosterone', r.rel.aldo) + row('DOC (mineralocorticoid)', r.rel.doc) + row('Corticosterone', r.rel.b) + row('Mineralocorticoid activity', r.mc) + row('17-OH-progesterone', r.rel.oh17p) + row('11-Deoxycortisol', r.rel.s11) + row('Adrenal androgens', andro) + row('Testosterone (periph.)', r.rel.t) + row('DHT', r.rel.dht) + row('Estradiol', r.rel.e2) + row('Renin', r.renin, 'mineralocorticoid feedback') + '</table>' +
        '<h4>Clinical picture</h4><ul class="keypoints small">' + [
          r.rel.cortisol < 0.6 ? 'Glucocorticoid deficiency → hypoglycemia, hypotension under stress' : '',
          mc < 0.6 ? 'Mineralocorticoid deficiency → salt wasting, hyponatremia, **hyperkalemia**, ↑ renin' : '',
          (mc > 1.6 || (r.renin < 0.8 && r.rel.doc > 2)) ? 'DOC-driven mineralocorticoid excess → **hypertension, hypokalemia**, suppressed renin (and therefore low aldosterone)' : '',
          andro > 1.6 ? 'Androgen excess → virilization (46,XX), precocious pseudopuberty' : '',
          andro < 0.5 && r.rel.t < 0.5 ? 'Sex-steroid deficiency → undervirilization (46,XY), absent puberty' : '',
          r.acth > 1.6 ? 'High ACTH → bilateral adrenal **hyperplasia** (and hyperpigmentation)' : '',
          exoGC ? 'Glucocorticoid treatment suppresses ACTH and removes the drive for precursor accumulation.' : '',
        ].filter(Boolean).map((t) => `<li>${EP.md(t)}</li>`).join('') + '</ul><p class="small muted">Qualitative flux model: relative levels vs. normal adrenal. Branch weights are teaching approximations.</p>';
    }
    setDefect(DEFECTS.find((d) => d.id === params.defect) || null, dBtns[DEFECTS.findIndex((d) => d.id === params.defect)] || normal);
    el.appendChild(h('h2', 'Androgen physiology downstream'));
    el.appendChild(h('p', h('a', { href: '#/testis' }, 'Testosterone → DHT (5α-reductase) and → estradiol (aromatase): tissue-specific actions →')));
    el.appendChild(EP.sources(['miller2011', 'speiser2018', 'kovacs13', 'molina6', 'bornstein2016']));
  };
})();
