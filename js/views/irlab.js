/* Insulin resistance lab — interactive panels built from Petersen & Shulman, Physiol Rev 2018.
 * 1. Insulin dose–response curves (Fig. 7; ED50s from sect. II–IV) and the "selective" hepatic IR question.
 * 2. Direct vs indirect control of hepatic glucose production (Figs. 3 and 6; Rothman 1991; Perry 2015).
 * 3. Lipid infusion: Randle prediction vs ¹³C/³¹P-MRS observation (Fig. 12).
 * 4. Reading a glucose tolerance test (Fig. 10).
 * 5. Evidence board for proposed mediators (sects. V–VII) and the integrated model (Fig. 19).
 * All curves are schematic teaching shapes anchored to the numbers quoted in the paper. */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;

  // ------------------------------------------------------------------ small SVG chart helper
  function chart(W, H, pad) {
    const svg = s('svg', { class: 'irl-svg', viewBox: `0 0 ${W} ${H}`, role: 'img' });
    const P = Object.assign({ l: 52, r: 16, t: 14, b: 40 }, pad || {});
    const g = s('g'); svg.appendChild(g);
    return { svg, g, P, W, H, iw: W - P.l - P.r, ih: H - P.t - P.b, clear() { while (g.firstChild) g.removeChild(g.firstChild); } };
  }
  const line = (pts, style) => s('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(''), style: 'fill:none;' + style });
  const text = (x, y, t, style, anchor) => s('text', { x, y, 'text-anchor': anchor || 'start', style: 'font-size:11px;fill:var(--muted);' + (style || '') }, t);
  function axes(c, xt, yt, xlab, ylab) {
    const { g, P, iw, ih } = c;
    g.appendChild(s('rect', { x: P.l, y: P.t, width: iw, height: ih, style: 'fill:none;stroke:var(--line)' }));
    xt.forEach(([x, l]) => { g.appendChild(s('line', { x1: x, x2: x, y1: P.t, y2: P.t + ih, style: 'stroke:var(--grid)' })); g.appendChild(text(x, P.t + ih + 14, l, '', 'middle')); });
    yt.forEach(([y, l]) => { g.appendChild(s('line', { x1: P.l, x2: P.l + iw, y1: y, y2: y, style: 'stroke:var(--grid)' })); g.appendChild(text(P.l - 6, y + 4, l, '', 'end')); });
    if (xlab) g.appendChild(text(P.l + iw / 2, P.t + ih + 32, xlab, 'font-weight:600', 'middle'));
    if (ylab) { const t = text(0, 0, ylab, 'font-weight:600', 'middle'); t.setAttribute('transform', `translate(13,${P.t + ih / 2}) rotate(-90)`); g.appendChild(t); }
  }
  const slider = (label, min, max, step, val, fmt, on) => {
    const out = h('span.irl-val', fmt(val));
    const inp = h('input', { type: 'range', min, max, step, value: val, 'aria-label': label });
    inp.addEventListener('input', () => { out.textContent = fmt(+inp.value); on(+inp.value); });
    const w = h('label.irl-slider', h('span.irl-lab', label), inp, out);
    w.get = () => +inp.value; w.set = (v) => { inp.value = v; out.textContent = fmt(v); };
    return w;
  };
  const chips = (items, on, multi) => {
    const bar = h('div.statebar');
    items.forEach((it, i) => { const b = h('button.chip' + (it.on || (!multi && i === 0) ? '.on' : ''), { 'data-id': it.id, onclick: () => { if (multi) b.classList.toggle('on'); else bar.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b)); on(it.id, b.classList.contains('on')); } }, it.label); bar.appendChild(b); });
    return bar;
  };
  const panel = (n, title, q) => h('div.irl-head', h('span.irl-num', String(n)), h('div', h('h2', title), q ? h('p.muted', q) : null));
  const fig = (t) => h('span.irl-fig', t);

  // ================================================================== 1. dose–response
  function doseResponse(el) {
    el.appendChild(panel(1, 'Insulin dose–response: what "resistance" means', 'Insulin resistance is a shifted dose–response curve, not an on/off switch, so hyperinsulinemia can compensate. Different insulin actions sit at different points on the insulin scale.'));
    // EC50 in µU/mL of the concentration each tissue sees; the liver sees portal insulin (≈ 2.5× peripheral).
    const PROC = [
      { id: 'lip', label: 'Adipose: suppression of lipolysis', ec: 20, n: 2.2, c: 'var(--tr0)', portal: false, note: 'ED50 ≈ 20 µU/mL — the most insulin-sensitive action' },
      { id: 'srebp', label: 'Liver: SREBP-1c / lipogenic program', ec: 8, n: 1.6, c: 'var(--tr3)', portal: true, note: '≈ 4× more sensitive than the FOXO1 arm (schematic)' },
      { id: 'gly', label: 'Liver: glycogen synthesis / FOXO1 inhibition', ec: 32, n: 1.6, c: 'var(--tr4)', portal: true, note: 'half-max at portal insulin ≈ 20–25 µU/mL for glycogen synthesis' },
      { id: 'glu', label: 'Whole-body glucose uptake (mostly muscle)', ec: 60, n: 1.6, c: 'var(--tr1)', portal: false, note: 'ED50 ≈ 60 µU/mL; maximal only at > 200 µU/mL' },
    ];
    const st = { rec: 100, post: 0, ins: 10 };
    const c = chart(760, 330, { l: 56, b: 44 });
    const lx0 = Math.log10(1), lx1 = Math.log10(1000);
    const X = (i) => c.P.l + (Math.log10(i) - lx0) / (lx1 - lx0) * c.iw, Y = (v) => c.P.t + (1 - v) * c.ih;
    const resp = (p, ins, defect) => {
      const conc = ins * (p.portal ? 2.5 : 1);
      let ec = p.ec, mx = 1;
      if (defect) { const f = st.rec / 100; ec = ec / Math.max(f, 0.01); mx = Math.min(1, f / 0.08); ec *= 1 + 1.5 * st.post; mx *= 1 - 0.25 * st.post; }
      return mx * Math.pow(conc, p.n) / (Math.pow(conc, p.n) + Math.pow(ec, p.n));
    };
    const read = h('div.irl-read');
    const ctrl = h('div.irl-ctrl',
      slider('Surface insulin receptors remaining', 3, 100, 1, 100, (v) => v + '%', (v) => { st.rec = v; draw(); }),
      slider('Post-receptor defect (DAG → PKCε / PKCθ)', 0, 1, 0.05, 0, (v) => (v === 0 ? 'none' : v < 0.4 ? 'mild' : v < 0.75 ? 'moderate' : 'severe'), (v) => { st.post = v; draw(); }),
      slider('Plasma (peripheral) insulin', 0, 1, 0.005, Math.log10(10) / 3, (v) => Math.pow(10, v * 3).toFixed(0) + ' µU/mL', (v) => { st.ins = Math.pow(10, v * 3); draw(); }));
    const presets = chips([{ id: 'norm', label: 'Normal' }, { id: 'rec', label: 'Receptor loss only (−80%)' }, { id: 'ir', label: 'Typical obesity IR (post-receptor)' }, { id: 'comp', label: 'IR + compensatory hyperinsulinemia' }], (id) => {
      const set = { norm: [100, 0, 10], rec: [20, 0, 10], ir: [80, 0.6, 10], comp: [80, 0.6, 25] }[id];
      [st.rec, st.post, st.ins] = set; ctrl.children[0].set(set[0]); ctrl.children[1].set(set[1]); ctrl.children[2].set(Math.log10(set[2]) / 3); draw();
    });
    const key = EP.colorKey([['Curves', PROC.map((p) => ({ line: p.c, label: p.label })).concat([{ line: 'var(--muted)', dash: '5 4', label: 'Dashed = normal; solid = with the defects you set' }, { fill: 'color-mix(in srgb, var(--accent) 14%, transparent)', label: 'Physiological peripheral insulin, ~5–60 µU/mL' }, { line: 'var(--text)', w: 1.5, label: 'Current insulin level (slider)' }])]], { compact: true });
    el.append(h('div.card', presets, h('div.irl-grid', h('div', c.svg, key), h('div', ctrl, read)),
      h('p.small.muted', 'Hepatic curves are plotted against peripheral insulin but computed at the portal concentration (≈ 2.5× higher, Petersen & Shulman 2018). Receptor loss right-shifts the curve but lowers the maximum only when < ~10% of receptors remain (spare receptors); a post-receptor defect shifts it right **and** down (Fig. 7). EC50 values for lipolysis and glucose uptake are from the review; the SREBP-1c vs FOXO1 separation is schematic.'.replace(/\*\*(.+?)\*\*/g, '$1'))));
    function draw() {
      c.clear();
      axes(c, [1, 3, 10, 30, 100, 300, 1000].map((v) => [X(v), String(v)]), [0, 0.25, 0.5, 0.75, 1].map((v) => [Y(v), (v * 100) + '%']), 'Plasma insulin, µU/mL (log scale)', 'Response (% of max)');
      c.g.appendChild(s('rect', { x: X(5), y: c.P.t, width: X(60) - X(5), height: c.ih, style: 'fill:color-mix(in srgb, var(--accent) 12%, transparent)' }));
      PROC.forEach((p) => {
        const pts = (def) => { const a = []; for (let i = 0; i <= 120; i++) { const ins = Math.pow(10, lx0 + (lx1 - lx0) * i / 120); a.push([X(ins), Y(resp(p, ins, def))]); } return a; };
        c.g.appendChild(line(pts(false), `stroke:${p.c};stroke-width:1.6;stroke-dasharray:5 4;opacity:.75`));
        c.g.appendChild(line(pts(true), `stroke:${p.c};stroke-width:3`));
      });
      c.g.appendChild(s('line', { x1: X(st.ins), x2: X(st.ins), y1: c.P.t, y2: c.P.t + c.ih, style: 'stroke:var(--text);stroke-width:1.5' }));
      // readout
      const rows = PROC.map((p) => { const n0 = resp(p, 10, false), now = resp(p, st.ins, true); const rel = now / n0; const cls = rel > 1.15 ? 'up' : rel < 0.87 ? 'dn' : 'eq';
        return `<tr><td><span class="irl-sw" style="background:${p.c}"></span>${EP.esc(p.label)}<div class="small muted">${EP.esc(p.note)}</div></td><td class="qual ${cls}">${(now * 100).toFixed(0)}%</td><td class="small muted">${rel >= 1 ? '×' + rel.toFixed(1) : '×' + rel.toFixed(2)} vs normal fasting</td></tr>`; }).join('');
      const ratio = (i) => resp(PROC[i], st.ins, true) / resp(PROC[i], 10, false);
      const pct = (v) => Math.round(v * 100) + '%';
      let msg;
      if (st.post > 0.3 && st.ins >= 18) msg = `**Compensation works — for every arm.** At ${st.ins.toFixed(0)} µU/mL, glucose uptake is back to ${pct(ratio(3))} and the SREBP-1c (lipogenic) arm to ${pct(ratio(1))} of normal-fasting values. The same receptor-level defect hits all branches, but hyperinsulinemia keeps lipogenesis running. Add substrate push (FFA re-esterification) and nutrient drivers (ChREBP, fructose, mTORC1) and steatosis follows, so no true pathway split ("selective" IR) is needed (Fig. 9).`;
      else if (st.post > 0.3) msg = `**At fasting insulin, antilipolysis fails first:** suppression of lipolysis is only ${pct(ratio(0))} of normal. Its curve is steep, so even mild adipose insulin resistance raises fatty acid and glycerol delivery to liver and muscle — the trigger for ectopic lipid (sect. IV-E). Now raise insulin (or pick the compensation preset).`;
      else if (st.rec < 100) msg = '**Receptor loss alone** only right-shifts the curves (spare receptors): a little extra insulin restores full responses. Obesity-related insulin resistance also lowers the maximum, which implies a post-receptor (signaling) defect (Fig. 7).';
      else msg = 'Move the sliders or pick a preset. Compare where each action sits relative to the shaded physiological range.';
      read.innerHTML = `<table class="labs irl-tab">${rows}</table><p>${EP.md(msg)}</p>`;
    }
    draw();
  }

  // ================================================================== 2. hepatic glucose production
  function hgp(el) {
    el.appendChild(panel(2, 'Who suppresses hepatic glucose production?', 'Insulin suppresses glycogenolysis directly in the liver but suppresses gluconeogenesis mostly indirectly, by shutting off adipose lipolysis (less acetyl-CoA to activate pyruvate carboxylase and less glycerol). The balance depends on how much glycogen is left.'));
    const st = { t: 12, sp: 'human', sc: 'normal' };
    // Rothman 1991 (humans): gluconeogenesis 64% of HGP over 0–22 h, 82% over 22–36 h, 96% over 36–54 h.
    const GNG = (t) => 6.5 * (t < 44 ? 1 : 1 - 0.3 * Math.min(1, (t - 44) / 20));
    const GLY = (t) => (st.sp === 'human' ? 6.0 * Math.exp(-0.065 * (t - 4)) : 6.0 * Math.exp(-0.32 * (t - 2)));
    const SC = {
      normal: { label: 'Normal', hep: 0.85, adip: 1, text: 'Insulin stops net glycogenolysis in the liver (phosphorylase kinase ⊣, PP1 ↑) and suppresses adipose lipolysis, lowering hepatic acetyl-CoA, pyruvate carboxylase flux and glycerol supply.' },
      tlko: { label: 'No hepatic insulin signaling (Akt1/2 + FOXO1 knockout)', hep: 0, adip: 1, text: 'Mice lacking hepatic Akt1, Akt2 and FOXO1 still suppress HGP normally in fasted clamps: the gluconeogenic component is controlled from adipose tissue. Only glycogenolysis — small after a fast — escapes control.' },
      acetate: { label: 'Normal + acetate & glycerol infusion', hep: 0.85, adip: 1, block: true, text: 'Perry 2015: preventing the insulin-induced fall in hepatic acetyl-CoA (acetate) and replacing glycerol abolished insulin suppression of pyruvate carboxylase flux and HGP in fasted rats.' },
      adipir: { label: 'Adipose insulin resistance', hep: 0.85, adip: 0.3, text: 'Lipolysis is not suppressed, so fatty acids keep acetyl-CoA high and gluconeogenesis continues. In a glycogen-depleted liver, impaired HGP suppression can mean adipose — not hepatic — insulin resistance.' },
      aso: { label: 'Liver + WAT INSR knockdown', hep: 0, adip: 0, text: 'Antisense knockdown of the insulin receptor in liver and fat: insulin cannot suppress HGP…' },
      atgl: { label: '… + atglistatin (ATGL inhibitor)', hep: 0, adip: 0, drug: true, text: '…but blocking lipolysis pharmacologically restores suppression of HGP even without insulin receptors in liver (Perry 2015) — the indirect pathway is sufficient.' },
      t2d: { label: 'Type 2 diabetes', hep: 0.45, adip: 0.45, gngUp: 1.3, glyDn: 0.7, text: 'Basal HGP is raised entirely by gluconeogenesis (glycogen content and glycogenolysis are lower), and both direct and indirect suppression are impaired.' },
    };
    const c = chart(560, 280, { l: 50, b: 42 });
    const bars = chart(300, 280, { l: 44, b: 42 });
    const X = (t) => c.P.l + t / 48 * c.iw, Y = (v) => c.P.t + (1 - v / 16) * c.ih;
    const info = h('div.irl-read');
    const tS = slider('Hours since last meal', 4, 48, 1, 12, (v) => v + ' h', (v) => { st.t = v; draw(); });
    const sp = chips([{ id: 'human', label: 'Human' }, { id: 'rat', label: 'Rat (glycogen gone overnight)' }], (id) => { st.sp = id; draw(); });
    const sc = chips(Object.keys(SC).map((k) => ({ id: k, label: SC[k].label })), (id) => { st.sc = id; draw(); });
    const key = EP.colorKey([['Hepatic glucose production', [{ fill: 'color-mix(in srgb, var(--tr0) 55%, transparent)', label: 'Net glycogenolysis — controlled directly by hepatic insulin action' }, { fill: 'color-mix(in srgb, var(--tr1) 55%, transparent)', label: 'Gluconeogenesis — controlled mostly indirectly, via adipose lipolysis' }, { line: 'var(--text)', w: 1.5, label: 'Selected fasting time' }]]], { compact: true });
    el.append(h('div.card', h('div.irl-row', h('div.small.muted', 'Species'), sp), h('div.irl-row', h('div.small.muted', 'Experiment'), sc), tS,
      h('div.irl-grid', h('div', c.svg), h('div', bars.svg)), key, info,
      h('p.small.muted', 'Human curve calibrated to Rothman 1991 (gluconeogenesis 64% of glucose production over the first 22 h, 82% over 22–36 h, 96% over 36–54 h); rat glycogen is almost exhausted after an overnight fast, which is why indirect control dominates rodent clamp studies. Suppression fractions are schematic.')));
    function draw() {
      c.clear(); bars.clear();
      const S = SC[st.sc];
      const gng = (t) => GNG(t) * (S.gngUp || 1), gly = (t) => GLY(t) * (S.glyDn || 1);
      axes(c, [0, 12, 24, 36, 48].map((v) => [X(v), v + ' h']), [0, 4, 8, 12, 16].map((v) => [Y(v), String(v)]), 'Fasting duration', 'µmol·kg⁻¹·min⁻¹');
      const a = [], b = [];
      for (let t = 4; t <= 48; t += 0.5) { a.push([X(t), Y(gng(t))]); b.push([X(t), Y(gng(t) + gly(t))]); }
      const area = (top, bot, col) => s('path', { d: 'M' + top.map((p) => p.join(',')).join('L') + 'L' + bot.slice().reverse().map((p) => p.join(',')).join('L') + 'Z', style: `fill:color-mix(in srgb, ${col} 50%, transparent);stroke:${col};stroke-width:1.5` });
      c.g.appendChild(area(a, a.map((p) => [p[0], Y(0)]), 'var(--tr1)'));
      c.g.appendChild(area(b, a, 'var(--tr0)'));
      c.g.appendChild(s('line', { x1: X(st.t), x2: X(st.t), y1: c.P.t, y2: c.P.t + c.ih, style: 'stroke:var(--text);stroke-width:1.5' }));
      // bars: basal vs clamp
      const G0 = gly(st.t), N0 = gng(st.t);
      const lip = S.drug ? 1 : S.adip, indirect = S.block ? 0 : 0.75 * lip;
      const G1 = G0 * (1 - S.hep), N1 = N0 * (1 - indirect);
      const BY = (v) => bars.P.t + (1 - v / 16) * bars.ih, bw = 70;
      axes(bars, [[bars.P.l + 60, 'Basal'], [bars.P.l + 170, '+ insulin']], [0, 4, 8, 12, 16].map((v) => [BY(v), String(v)]), 'Insulin clamp', '');
      [[60, G0, N0], [170, G1, N1]].forEach(([x, g, n]) => {
        const x0 = bars.P.l + x - bw / 2;
        bars.g.appendChild(s('rect', { x: x0, y: BY(n), width: bw, height: BY(0) - BY(n), style: 'fill:color-mix(in srgb, var(--tr1) 60%, transparent);stroke:var(--tr1)' }));
        bars.g.appendChild(s('rect', { x: x0, y: BY(n + g), width: bw, height: BY(0) - BY(g), style: 'fill:color-mix(in srgb, var(--tr0) 60%, transparent);stroke:var(--tr0)' }));
        bars.g.appendChild(text(x0 + bw / 2, BY(n + g) - 5, (n + g).toFixed(1), 'fill:var(--text);font-weight:600', 'middle'));
      });
      const sup = 1 - (G1 + N1) / (G0 + N0);
      const share = G0 / (G0 + N0);
      info.innerHTML = `<div class="irl-stats"><div><b>${(share * 100).toFixed(0)}%</b><span>of basal HGP from glycogen at ${st.t} h</span></div><div><b class="${sup > 0.5 ? 'up' : 'dn'}">${(sup * 100).toFixed(0)}%</b><span>suppression of HGP by insulin</span></div><div><b>${(N0 ? (1 - N1 / N0) * 100 : 0).toFixed(0)}%</b><span>of gluconeogenesis suppressed (indirect)</span></div></div><p>${EP.md(S.text)}</p>`;
    }
    draw();
  }

  // ================================================================== 3. lipid infusion
  function lipidInfusion(el) {
    el.appendChild(panel(3, 'Lipid infusion: Randle was not the answer', 'Randle predicted that fatty-acid oxidation would back glucose up inside the muscle cell (↑ G6P, ↑ free glucose). MRS showed the opposite after a few hours: both fall, because glucose transport itself is blocked.'));
    const st = { t: 5 };
    const c = chart(620, 290, { l: 52, b: 42 });
    const X = (t) => c.P.l + t / 6 * c.iw, Y = (v) => c.P.t + (1 - (v - 0.2) / 1.6) * c.ih;
    const sig = (t, t50, k) => 1 / (1 + Math.exp(-(t - t50) * k));
    const S = {
      dag: (t) => 1 + 0.8 * sig(t, 3.2, 2.2),
      tr: (t) => 1 - 0.5 * sig(t, 3.8, 2.2),
      g6pObs: (t) => 1 + 0.15 * Math.sin(Math.min(t, 3) / 3 * Math.PI) * (t < 3 ? 1 : 0) - 0.35 * sig(t, 3.8, 2.2),
      g6pRandle: (t) => 1 + 0.45 * sig(t, 1.5, 2.5),
    };
    const SER = [['dag', 'var(--tr3)', '', 'Intramyocellular sn-1,2-DAG / PKCθ activation'], ['tr', 'var(--tr1)', '', 'Insulin-stimulated glucose transport (GLUT4)'], ['g6pObs', 'var(--tr2)', '', 'Intracellular G6P — measured (³¹P-MRS)'], ['g6pRandle', 'var(--tr0)', '6 4', 'Intracellular G6P — Randle prediction']];
    const tbl = h('div.irl-read');
    const tS = slider('Hours of lipid–heparin infusion', 0, 6, 0.1, 5, (v) => v.toFixed(1) + ' h', (v) => { st.t = v; draw(); });
    const key = EP.colorKey([['Lines (relative to start)', SER.map(([, col, d, l]) => ({ line: col, dash: d || null, label: l })).concat([{ line: 'var(--text)', w: 1.5, label: 'Selected time' }])]], { compact: true });
    el.append(h('div.card', tS, h('div.irl-grid', h('div', c.svg, key), tbl), h('p.small.muted', 'Schematic time course after Fig. 12: during the first ~3 h G6P rises slightly and glycolysis falls (Randle allostery operates); insulin resistance appears only after 3–5 h, in parallel with the peak in DAG and PKCθ translocation, not ceramide or triglyceride. Pdk2/4-knockout mice, in which the Randle cycle cannot operate, still develop lipid-induced muscle insulin resistance.')));
    function draw() {
      c.clear();
      axes(c, [0, 1, 2, 3, 4, 5, 6].map((v) => [X(v), v + ' h']), [0.4, 0.8, 1.0, 1.2, 1.6].map((v) => [Y(v), '×' + v]), 'Time', 'Relative level');
      c.g.appendChild(s('line', { x1: c.P.l, x2: c.P.l + c.iw, y1: Y(1), y2: Y(1), style: 'stroke:var(--faint);stroke-dasharray:2 3' }));
      SER.forEach(([k, col, d]) => { const pts = []; for (let i = 0; i <= 120; i++) { const t = i / 20; pts.push([X(t), Y(S[k](t))]); } c.g.appendChild(line(pts, `stroke:${col};stroke-width:2.6;${d ? 'stroke-dasharray:' + d : ''}`)); });
      c.g.appendChild(s('line', { x1: X(st.t), x2: X(st.t), y1: c.P.t, y2: c.P.t + c.ih, style: 'stroke:var(--text);stroke-width:1.5' }));
      const late = st.t >= 3.5;
      const arrow = (v) => (v > 1.08 ? '<span class="qual up">↑</span>' : v < 0.92 ? '<span class="qual dn">↓</span>' : '<span class="qual eq">↔</span>');
      const rows = [['Intracellular free glucose', 1.3, late ? 0.7 : 1.0], ['Glucose-6-phosphate', S.g6pRandle(st.t), S.g6pObs(st.t)], ['Glycolysis', 0.75, late ? 0.7 : 0.85], ['Glycogen synthesis', late ? 0.7 : 0.9, late ? 0.55 : 0.95], ['GLUT4 translocation / transport', 1.0, S.tr(st.t)]];
      tbl.innerHTML = `<table class="cmp-table"><tr><th></th><th>Randle predicted</th><th>Measured</th></tr>${rows.map(([n, a, b]) => `<tr><td>${n}</td><td>${arrow(a)}</td><td>${arrow(b)}</td></tr>`).join('')}</table>
        <p>${EP.md(late ? '**Now:** G6P and free glucose are **lower**, not higher — the block is at glucose transport, upstream of hexokinase. Lipid-derived DAG → PKCθ → IRS-1 (Ser1101) / GIV phosphorylation → less PI3K/Akt → less GLUT4 at the membrane.' : '**Early:** substrate competition (acetyl-CoA, NADH ⊣ PDH; citrate ⊣ PFK) slightly raises G6P — the Randle cycle is real but governs fuel choice, not insulin resistance.')}</p>`;
    }
    draw();
  }

  // ================================================================== 4. GTT reader
  function gtt(el) {
    el.appendChild(panel(4, 'Reading a glucose tolerance test', 'A glucose curve alone cannot tell defective insulin secretion from defective insulin action — you need the insulin curve too (Himsworth\'s point, and Fig. 10).'));
    const CO = [
      { id: 'lean', label: 'Lean, chow-fed', c: 'var(--tr2)', g: [110, 140, 18], i: [12, 35, 15], ans: 'ref' },
      { id: 'hfd', label: 'Obese, high-fat-fed', c: 'var(--tr0)', g: [135, 210, 30], i: [40, 120, 22], ans: 'ir', why: 'Glucose high **despite more insulin** → impaired insulin action (insulin resistance).' },
      { id: 'nod', label: 'Pre-diabetic NOD (insulitis)', c: 'var(--tr3)', g: [125, 240, 28], i: [8, 12, 15], ans: 'sec', why: 'Glucose high with **little insulin response** → β-cell secretory defect, not insulin resistance.' },
      { id: 'fgf', label: 'FGF21-treated', c: 'var(--tr4)', g: [95, 85, 16], i: [8, 18, 15], ans: 'sens', why: 'Better glucose with **less insulin** → increased insulin sensitivity.' },
      { id: 'su', label: 'Sulfonylurea-treated', c: 'var(--tr1)', g: [95, 85, 16], i: [28, 80, 15], ans: 'secup', why: 'Better glucose with **more insulin** → increased secretion, not sensitivity.' },
    ];
    const on = new Set(['lean', 'hfd', 'nod']);
    const gc = chart(380, 250, { l: 48, b: 40 }), ic = chart(380, 250, { l: 48, b: 40 });
    const curve = (base, amp, tau) => (t) => base + amp * (t / tau) * Math.exp(1 - t / tau);
    const draw1 = (cc, key, yMax, lab) => {
      cc.clear();
      const X = (t) => cc.P.l + t / 120 * cc.iw, Y = (v) => cc.P.t + (1 - v / yMax) * cc.ih;
      axes(cc, [0, 30, 60, 90, 120].map((v) => [X(v), v + '']), [0, yMax / 4, yMax / 2, 3 * yMax / 4, yMax].map((v) => [Y(v), String(Math.round(v))]), 'Minutes after glucose', lab);
      CO.filter((x) => on.has(x.id)).forEach((x) => { const f = curve(...x[key]); const pts = []; for (let t = 0; t <= 120; t += 2) pts.push([X(t), Y(f(t))]); cc.g.appendChild(line(pts, `stroke:${x.c};stroke-width:2.8`)); });
    };
    const keyEl = h('div');
    const redraw = () => { draw1(gc, 'g', 400, 'Glucose, mg/dL'); draw1(ic, 'i', 160, 'Insulin, µU/mL'); EP.clear(keyEl); keyEl.appendChild(EP.colorKey([['Groups shown', CO.filter((x) => on.has(x.id)).map((x) => ({ line: x.c, label: x.label }))]], { compact: true })); };
    const bar = chips(CO.map((x) => ({ id: x.id, label: x.label, on: on.has(x.id) })), (id, isOn) => { if (isOn) on.add(id); else on.delete(id); redraw(); }, true);
    // quiz
    const quiz = h('div.irl-quiz');
    const ANS = [['ir', 'Insulin resistance'], ['sec', 'Secretion defect'], ['sens', '↑ Insulin sensitivity'], ['secup', '↑ Insulin secretion']];
    function newQ() {
      const x = CO.slice(1)[Math.floor(Math.random() * 4)];
      const qc = chart(360, 200, { l: 44, b: 34 }), X = (t) => qc.P.l + t / 120 * qc.iw, Y = (v) => qc.P.t + (1 - v / 400) * qc.ih;
      axes(qc, [0, 60, 120].map((v) => [X(v), v + ' min']), [0, 200, 400].map((v) => [Y(v), String(v)]), '', 'Glucose');
      [[CO[0], 'var(--muted)'], [x, 'var(--accent)']].forEach(([cc, col]) => { const f = curve(...cc.g); const pts = []; for (let t = 0; t <= 120; t += 2) pts.push([X(t), Y(f(t))]); qc.g.appendChild(line(pts, `stroke:${col};stroke-width:2.6`)); });
      const fb = h('p'); const ins = h('div');
      EP.clear(quiz);
      quiz.append(h('h3', 'Mystery mouse'), h('p.small.muted', 'Grey = lean control, blue = mystery. Step 1: look at glucose. Step 2: reveal insulin, then decide.'), qc.svg,
        h('button.btn', { onclick: (ev) => { ev.target.disabled = true; const ic2 = chart(360, 160, { l: 44, b: 30 }); const Yi = (v) => ic2.P.t + (1 - v / 160) * ic2.ih; axes(ic2, [0, 60, 120].map((v) => [ic2.P.l + v / 120 * ic2.iw, v + ' min']), [0, 80, 160].map((v) => [Yi(v), String(v)]), '', 'Insulin'); [[CO[0], 'var(--muted)'], [x, 'var(--accent)']].forEach(([cc, col]) => { const f = curve(...cc.i); const pts = []; for (let t = 0; t <= 120; t += 2) pts.push([ic2.P.l + t / 120 * ic2.iw, Yi(f(t))]); ic2.g.appendChild(line(pts, `stroke:${col};stroke-width:2.6`)); }); ins.appendChild(ic2.svg); } }, 'Reveal insulin curve'), ins,
        h('div.statebar', ANS.map(([id, l]) => h('button.chip', { onclick: () => { fb.innerHTML = (id === x.ans ? '<b class="qual up">Correct.</b> ' : '<b class="qual dn">Not quite.</b> ') + EP.md(x.why) + ` <span class="muted">(${EP.esc(x.label)})</span>`; } }, l))), fb,
        h('button.btn', { onclick: newQ }, 'Another mouse'));
    }
    el.append(h('div.card', bar, h('div.irl-grid2', gc.svg, ic.svg), keyEl, h('p.small.muted', 'Schematic intraperitoneal GTT shapes after Fig. 10 (hypothetical data in the review). The clamp avoids this ambiguity by fixing insulin and measuring the glucose infusion needed to hold euglycemia.')), h('div.card', quiz));
    redraw(); newQ();
  }

  // ================================================================== 5. evidence board
  function evidence(el) {
    el.appendChild(panel(5, 'Proposed causes of insulin resistance: how strong is the evidence?', 'The review weighs each candidate by whether it is sufficient, necessary, and present in typical human insulin resistance. Ratings below summarize that discussion (3 dots = strong).'));
    const M = [
      { t: ['liver', 'muscle'], name: 'Diacylglycerol → novel PKC', mech: 'Lipogenic **sn-1,2-DAG** activates PKCε in liver → **INSR Thr1160** phosphorylation (kinase nearly dead when phosphomimetic); PKCθ in muscle → IRS-1 Ser1101 / GIV / PDK1. sn-1,3-DAG from ATGL lipolysis does not activate PKC.', s: 3, n: 2, hu: 3, key: 'PKCε knockdown or knockout protects against high-fat-diet hepatic IR; Insr T1150A knock-in mice are protected; PKCθ-knockout mice are protected from lipid infusion. Hepatic DAG tracks IR in 5 human studies; PKCε translocation in obese human liver. Dissociations (CGI-58 knockdown, ChREBP overexpression, Mttp knockout) point to DAG compartment (lipid droplet vs Golgi/membrane).', verdict: 'The only fully defined mechanism linking a lipid to impaired hepatocellular insulin signaling.' },
      { t: ['muscle', 'liver', 'wat'], name: 'Ceramides', mech: 'Ceramide → PP2A activation and PKCζ → reduced Akt activity (downstream of IRS/PI3K).', s: 2, n: 1, hu: 2, key: 'Myriocin partly prevents palmitate/lard-induced IR; acid ceramidase overexpression protects liver. But unsaturated fatty acids cause equal IR without raising ceramides; many IR models have normal ceramides; typical IR shows **proximal** (receptor/IRS) defects, not just Akt.', verdict: 'Sufficient in some models, not necessary; strongest in muscle (C18:0 ceramide).' },
      { t: ['muscle'], name: 'Acylcarnitines / incomplete fat oxidation', mech: 'Fat oxidation outrunning the TCA cycle → acylcarnitines and ROS.', s: 1, n: 1, hu: 1, key: 'Acylcarnitines modestly (20–30%) lower Akt Ser473 in myotubes; plasma levels reflect liver more than muscle; fasted insulin-sensitive rats have similar levels.', verdict: 'Most likely a marker of metabolic inflexibility — a consequence, not a cause.' },
      { t: ['liver', 'wat'], name: 'ER stress / unfolded protein response', mech: 'PERK, IRE1, ATF6 → JNK; XBP1s drives de novo lipogenesis.', s: 2, n: 1, hu: 1, key: 'Liver-specific Xbp1 knockout mice have **more** ER stress but **less** liver fat and are **more** insulin sensitive; liver-specific JNK knockout worsens steatosis. In WAT, ER stress may drive lipolysis.', verdict: 'Probably acts through ectopic lipid (lipogenesis → DAG), not directly.' },
      { t: ['muscle'], name: 'Mitochondrial dysfunction & ROS', mech: 'Reduced ATP synthesis (elderly, lean insulin-resistant offspring) favors lipid storage; excess H₂O₂ oxidizes the cell.', s: 2, n: 1, hu: 2, key: 'Mitochondrial catalase (MCAT) mice are protected from diet- and age-induced muscle IR, with less DAG/PKCθ. But severe mitochondrial knockouts (Tfam, Aif) improve glucose uptake; 78 antioxidant trials showed no mortality benefit.', verdict: 'An amplifier of lipid accumulation; therapeutic value unproven.' },
      { t: ['wat', 'liver'], name: 'Inflammation (macrophages, TNF-α, JNK)', mech: 'Dead-adipocyte crown-like structures → macrophage cytokines → **more lipolysis** (and possibly impaired signaling).', s: 2, n: 1, hu: 1, key: 'Adipose IR appears after days of high-fat feeding; macrophage infiltration only after ~12 weeks. Lipodystrophy causes severe IR without inflammation. T2D risk variants are not enriched in immune cells. TNF-α blockers do not consistently improve human insulin sensitivity; IRS-1 Ser307Ala mice are **more** insulin resistant.', verdict: 'Exacerbates IR, mainly by increasing lipolysis; not the primary defect.' },
      { t: ['muscle', 'wat'], name: 'Branched-chain amino acids', mech: 'Leucine → mTORC1/S6K1 → IRS-1 serine phosphorylation; valine catabolite 3-HIB → muscle fatty acid uptake → DAG/PKCθ.', s: 1, n: 1, hu: 2, key: 'Strong biomarker and predictor of T2D; BCAA alone does not cause IR in chow-fed rats; BCATm-knockout mice have very high BCAAs yet are protected. Genetics suggest high BCAA is a consequence of IR.', verdict: 'Excellent biomarker; causal role uncertain.' },
      { t: ['wat', 'liver'], name: 'Adipokines & hepatokines', mech: 'RBP4 (↑ in obesity), adiponectin (↓; AdipoR ceramidase activity), fetuin-A (inhibits INSR kinase), FGF21 (↑ fat oxidation; obesity is FGF21-resistant).', s: 2, n: 1, hu: 2, key: 'RBP4 correlates with clamp IR and falls with exercise; adiponectin-transgenic ob/ob mice weigh twice as much yet are insulin sensitive; lean insulin-resistant offspring have normal adiponectin; FGF21 rises in humans only after ~10 days of fasting.', verdict: 'Modulators that largely act by redistributing lipid.' },
      { t: ['muscle'], name: 'Randle glucose–fatty acid cycle', mech: 'Fat oxidation → acetyl-CoA/NADH ⊣ PDH, citrate ⊣ PFK → G6P ↑ → hexokinase ⊣.', s: 1, n: 1, hu: 1, key: 'MRS during lipid infusion: G6P and glucose fall rather than rise; Pdk2/4-knockout mice still develop IR.', verdict: 'Governs fuel selection; does not explain insulin resistance (see panel 3).' },
    ];
    const grid = h('div.irl-cards');
    const dots = (n) => '●●●'.slice(0, n) + '<span class="irl-off">' + '●●●'.slice(n) + '</span>';
    function show(tissue) {
      EP.clear(grid);
      M.filter((m) => tissue === 'all' || m.t.includes(tissue)).forEach((m) => {
        const body = h('div.irl-more', { html: `<p>${EP.md(m.mech)}</p><p class="small"><b>Key experiments:</b> ${EP.md(m.key)}</p>` });
        const card = h('div.irl-mcard', h('div.irl-mtop', h('b', m.name), h('span.small.muted', m.t.map((x) => ({ liver: 'liver', muscle: 'muscle', wat: 'adipose' })[x]).join(' · '))),
          h('div.irl-dots', { html: `<span>Sufficient</span><i>${dots(m.s)}</i><span>Necessary</span><i>${dots(m.n)}</i><span>Human evidence</span><i>${dots(m.hu)}</i>` }),
          h('p.irl-verdict', m.verdict), body);
        card.addEventListener('click', () => card.classList.toggle('open'));
        grid.appendChild(card);
      });
    }
    el.append(h('div.card', chips([{ id: 'all', label: 'All tissues' }, { id: 'liver', label: 'Liver' }, { id: 'muscle', label: 'Skeletal muscle' }, { id: 'wat', label: 'Adipose' }], show), h('p.small.muted', 'Click a card for the mechanism and the key experiments.'), grid,
      h('div.irl-conclude', { html: EP.md('**The review\'s synthesis (Fig. 19):** every proposed mediator is a response to **nutrient oversupply**, and they converge on **ectopic lipid** in liver and muscle. ER stress promotes lipogenesis; mitochondrial changes favour lipid storage; inflammation drives lipolysis. In humans, **muscle IR comes first** (lean offspring of people with T2D have muscle IR with normal liver fat); diverted glucose then fuels hepatic lipogenesis, NAFLD and hepatic IR. In rodents the order is reversed (liver within days of fat feeding).') })));
    show('all');
  }

  // ================================================================== 6. hepatic IR readouts (Table 1)
  function readouts(el) {
    el.appendChild(panel(6, 'Measuring hepatic insulin resistance', 'Popular readouts mix direct (hepatocyte) and indirect (adipose) insulin action. Pick the readout that matches the question (Table 1).'));
    const R = [['Net hepatic glycogen synthesis', 'Direct', 'Acute', '↓', 'Needs both hyperinsulinemia and hyperglycemia; insulin is permissive, portal glucose the driver.'], ['Suppression of gluconeogenesis', 'Indirect', 'Acute', '↓', 'Mostly via adipose lipolysis → acetyl-CoA, glycerol.'], ['Suppression of hepatic glucose production', 'Direct + indirect', 'Acute', '↓', 'Mix depends on species and fasting duration (panel 2).'], ['INSR kinase activity / Tyr phosphorylation', 'Direct', 'Acute', '↓', 'Most proximal site — where PKCε acts (Thr1160).'], ['IRS Tyr phosphorylation', 'Direct', 'Acute', '↓', ''], ['Akt Ser/Thr phosphorylation', 'Direct', 'Acute', '↓', 'Ser473 has many non-insulin inputs.'], ['Gluconeogenic gene expression (G6pc, Pck1)', 'Direct', 'Chronic', '↑ (rodents)', 'Not increased in human T2D liver; >90% less Pck1 cuts flux only ~40%.'], ['De novo lipogenesis', 'Direct', 'Chronic', 'variable', 'Many inputs (mTORC1, ChREBP); ↓ in fat-fed rats, ↑ in human NAFLD.'], ['Fasting plasma insulin (HOMA-IR)', 'Direct + indirect', 'Chronic', '↑', 'Crude; also reflects ↓ hepatic insulin clearance and β-cell function.']];
    const tag = (v) => `<span class="irl-tag ${/Indirect/.test(v) && !/Direct/.test(v) ? 'ind' : /\+/.test(v) ? 'mix' : 'dir'}">${v}</span>`;
    el.appendChild(h('div.card', h('table.cmp-table', { html: `<tr><th>Readout</th><th>Direct / indirect</th><th>Timescale</th><th>In hepatic IR</th><th>Notes</th></tr>` + R.map((r) => `<tr><td>${r[0]}</td><td>${tag(r[1])}</td><td>${r[2]}</td><td>${r[3]}</td><td class="small muted">${EP.esc(r[4])}</td></tr>`).join('') })));
  }

  EP.views.irlab = function (el) {
    el.appendChild(EP.pageHeader('Insulin resistance lab', 'What exactly is resistant, where, and why? Six interactive experiments built from Petersen & Shulman (Physiol Rev 2018).', { section: 'Pancreas & Glucose', lede: 'Each panel reproduces a figure or argument from the review. Drag the sliders, switch experiments, and read the conclusion underneath. The multi-organ cycle itself (Fig. 19) is on the Insulin signaling page.' }));
    el.appendChild(h('p', h('a', { href: '#/insulin' }, 'Open the integrated insulin-resistance cycle (adipose → liver → muscle → β-cell) →')));
    doseResponse(el); hgp(el); lipidInfusion(el); gtt(el); evidence(el); readouts(el);
    el.appendChild(EP.sources(['petersen2018', 'rothman1991', 'perry2015', 'petersen2007', 'brown2008', 'donnelly2005', 'lambert2014', 'shulman1990']));
  };
})();
