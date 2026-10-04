/* Insulin action & resistance — a visual guide to Petersen & Shulman, Physiol Rev 2018.
 * The page follows the review section by section (I–VIII). Every section is a collapsible chapter of
 * diagrams (js/views/irguide1.js = I–IV, irguide2.js = V–VIII) built with EP.flow (js/core/flowdiagram.js).
 * This file holds the shared helpers, the interactive experiments and the page assembly.
 * All curves are schematic teaching shapes anchored to numbers quoted in the review. */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;
  const IRV = (EP.irv = EP.irv || {});

  // ------------------------------------------------------------------ chart helpers
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
  Object.assign(IRV, { chart, line, text, axes, slider, chips });

  /** Small static line chart: {w,h,x:[a,b],y:[a,b],xt:[[v,l]],yt, xl, yl, series:[{f|pts,col,dash,w,label,lx,ly}], bands:[{x0,x1,col,label}], vl:[{x,label}], logx} */
  IRV.mini = function (o) {
    const c = chart(o.w || 420, o.h || 220, o.pad || { l: 60, b: 36, r: 14, t: 12 });
    const lg = (v) => (o.logx ? Math.log10(v) : v);
    const X = (v) => c.P.l + (lg(v) - lg(o.x[0])) / (lg(o.x[1]) - lg(o.x[0])) * c.iw;
    const Y = (v) => c.P.t + (1 - (v - o.y[0]) / (o.y[1] - o.y[0])) * c.ih;
    (o.bands || []).forEach((b) => { c.g.appendChild(s('rect', { x: X(b.x0), y: c.P.t, width: X(b.x1) - X(b.x0), height: c.ih, style: `fill:color-mix(in srgb, ${b.col || 'var(--accent)'} 13%, transparent)` })); if (b.label) c.g.appendChild(text((X(b.x0) + X(b.x1)) / 2, c.P.t + 12, b.label, `fill:${b.col || 'var(--accent)'};font-weight:600`, 'middle')); });
    axes(c, (o.xt || []).map(([v, l]) => [X(v), l]), (o.yt || []).map(([v, l]) => [Y(v), l]), o.xl, o.yl);
    (o.series || []).forEach((sr) => {
      let pts = sr.pts;
      if (sr.f) { pts = []; for (let i = 0; i <= 160; i++) { const v = o.logx ? Math.pow(10, lg(o.x[0]) + (lg(o.x[1]) - lg(o.x[0])) * i / 160) : o.x[0] + (o.x[1] - o.x[0]) * i / 160; pts.push([v, sr.f(v)]); } }
      c.g.appendChild(line(pts.map(([a, b]) => [X(a), Y(b)]), `stroke:${sr.col};stroke-width:${sr.w || 2.6};` + (sr.dash ? `stroke-dasharray:${sr.dash}` : '')));
      if (sr.label) c.g.appendChild(text(X(sr.lx), Y(sr.ly), sr.label, `fill:${sr.col};font-weight:700`, sr.la || 'start'));
    });
    (o.vl || []).forEach((v) => { c.g.appendChild(s('line', { x1: X(v.x), x2: X(v.x), y1: c.P.t, y2: c.P.t + c.ih, style: `stroke:${v.col || 'var(--faint)'};stroke-dasharray:4 3` })); if (v.label) c.g.appendChild(text(X(v.x) + 4, c.P.t + c.ih - 6, v.label, `fill:${v.col || 'var(--muted)'}`)); });
    (o.marks || []).forEach((m) => { c.g.appendChild(s('circle', { cx: X(m.x), cy: Y(m.y), r: 4, style: `fill:${m.col}` })); if (m.label) c.g.appendChild(text(X(m.x) + (m.dx || 6), Y(m.y) + (m.dy || -6), m.label, `fill:${m.col};font-weight:600`, m.la)); });
    c.svg.classList.add('irv-mini');
    return c.svg;
  };

  // ------------------------------------------------------------------ layout helpers
  /** A figure block: number tag, title, one-line take-home, then content. */
  IRV.fig = (num, title, take, ...kids) => h('section.irv-fig', h('div.irv-fh', num ? h('span.irv-fn', num) : null, h('h3', title)), take ? h('p.irv-take', { html: EP.md(take) }) : null, ...kids);
  /** Icon bullet tiles: [[icon, markdown]] */
  IRV.pts = (items) => h('ul.irv-pts', items.map(([ic, t]) => h('li', h('b', ic), h('span', { html: EP.md(t) }))));
  /** Collapsible evidence list: rows [[verdict y|n|m|q, model, result]] */
  IRV.ev = (title, rows, open) => h('details.irv-ev', { open: !!open }, h('summary', `🔬 ${title} (${rows.length})`),
    h('div.irv-evrows', rows.map(([v, m, r]) => h('div.irv-evr', h('i.' + v, { title: { y: 'supports', n: 'argues against', m: 'mixed / partial', q: 'open question' }[v] }, { y: '✓', n: '✗', m: '~', q: '?' }[v]), h('b', { html: EP.md(m) }), h('span', { html: EP.md(r) })))));
  /** Cards: [{t, p, v:[cls,label], ico}] */
  IRV.cards = (items) => h('div.irv-cards', items.map((c) => h('div.irv-card', h('h4', c.ico || null, h('span', { html: EP.md(c.t) })), h('p', { html: EP.md(c.p) }), c.v ? h('span.irv-verdict.' + c.v[0], c.v[1]) : null)));
  IRV.chipRow = (items) => h('div.irv-chips', items.map(([cls, t]) => h('span.irv-chip.' + cls, { html: EP.md(t) })));
  IRV.cap = (t) => h('p.irv-cap', { html: EP.md(t) });

  // ================================================================== interactive: dose–response (Fig. 7)
  IRV.doseResponse = function () {
    const el = h('div');
    // EC50 in µU/mL of the concentration each tissue sees; the liver sees portal insulin (≈ 2.5× peripheral).
    const PROC = [
      { id: 'lip', label: 'WAT: suppress lipolysis', ec: 20, n: 2.2, c: 'var(--tr0)', portal: false, note: 'ED50 ≈ 20 µU/mL' },
      { id: 'srebp', label: 'Liver: SREBP-1c (lipogenic)', ec: 8, n: 1.6, c: 'var(--tr3)', portal: true, note: '~4× more sensitive than FOXO1 arm' },
      { id: 'gly', label: 'Liver: glycogen / FOXO1 off', ec: 32, n: 1.6, c: 'var(--tr4)', portal: true, note: 'half-max at portal 20–25 µU/mL' },
      { id: 'glu', label: 'Muscle: glucose uptake', ec: 60, n: 1.6, c: 'var(--tr1)', portal: false, note: 'ED50 ≈ 60; max only > 200' },
    ];
    const st = { rec: 100, post: 0, ins: 10 };
    const c = chart(760, 320, { l: 56, b: 44 });
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
      slider('Surface insulin receptors', 3, 100, 1, 100, (v) => v + '%', (v) => { st.rec = v; draw(); }),
      slider('Post-receptor defect (e.g. DAG → PKCε)', 0, 1, 0.05, 0, (v) => (v === 0 ? 'none' : v < 0.4 ? 'mild' : v < 0.75 ? 'moderate' : 'severe'), (v) => { st.post = v; draw(); }),
      slider('Plasma insulin', 0, 1, 0.005, Math.log10(10) / 3, (v) => Math.pow(10, v * 3).toFixed(0) + ' µU/mL', (v) => { st.ins = Math.pow(10, v * 3); draw(); }));
    const presets = chips([{ id: 'norm', label: 'Normal' }, { id: 'rec', label: 'Receptor loss only (−80%)' }, { id: 'ir', label: 'Obesity IR (post-receptor)' }, { id: 'comp', label: '+ compensatory hyperinsulinemia' }], (id) => {
      const set = { norm: [100, 0, 10], rec: [20, 0, 10], ir: [80, 0.6, 10], comp: [80, 0.6, 25] }[id];
      [st.rec, st.post, st.ins] = set; ctrl.children[0].set(set[0]); ctrl.children[1].set(set[1]); ctrl.children[2].set(Math.log10(set[2]) / 3); draw();
    });
    const key = EP.colorKey([['Curves', PROC.map((p) => ({ line: p.c, label: p.label })).concat([{ line: 'var(--muted)', dash: '5 4', label: 'Dashed = normal · solid = with your defects' }, { fill: 'color-mix(in srgb, var(--accent) 14%, transparent)', label: 'Normal plasma insulin range (~5–60)' }])]], { compact: true });
    el.append(presets, h('div.irl-grid', h('div', c.svg, key), h('div', ctrl, read)));
    function draw() {
      c.clear();
      axes(c, [1, 3, 10, 30, 100, 300, 1000].map((v) => [X(v), String(v)]), [0, 0.25, 0.5, 0.75, 1].map((v) => [Y(v), (v * 100) + '%']), 'Plasma insulin, µU/mL (log)', 'Response');
      c.g.appendChild(s('rect', { x: X(5), y: c.P.t, width: X(60) - X(5), height: c.ih, style: 'fill:color-mix(in srgb, var(--accent) 12%, transparent)' }));
      PROC.forEach((p) => {
        const pts = (def) => { const a = []; for (let i = 0; i <= 120; i++) { const ins = Math.pow(10, lx0 + (lx1 - lx0) * i / 120); a.push([X(ins), Y(resp(p, ins, def))]); } return a; };
        c.g.appendChild(line(pts(false), `stroke:${p.c};stroke-width:1.6;stroke-dasharray:5 4;opacity:.75`));
        c.g.appendChild(line(pts(true), `stroke:${p.c};stroke-width:3`));
      });
      c.g.appendChild(s('line', { x1: X(st.ins), x2: X(st.ins), y1: c.P.t, y2: c.P.t + c.ih, style: 'stroke:var(--text);stroke-width:1.5' }));
      const rows = PROC.map((p) => { const n0 = resp(p, 10, false), now = resp(p, st.ins, true); const rel = now / n0; const cls = rel > 1.15 ? 'up' : rel < 0.87 ? 'dn' : 'eq';
        return `<tr><td><span class="irl-sw" style="background:${p.c}"></span>${EP.esc(p.label)}<div class="small muted">${EP.esc(p.note)}</div></td><td class="qual ${cls}">${(now * 100).toFixed(0)}%</td></tr>`; }).join('');
      const ratio = (i) => resp(PROC[i], st.ins, true) / resp(PROC[i], 10, false);
      const pct = (v) => Math.round(v * 100) + '%';
      let msg;
      if (st.post > 0.3 && st.ins >= 18) msg = `**Hyperinsulinemia compensates every arm:** uptake ${pct(ratio(3))}, lipogenic arm ${pct(ratio(1))} of normal.`;
      else if (st.post > 0.3) msg = `**Antilipolysis fails first:** only ${pct(ratio(0))} of normal → more fatty acid to liver & muscle.`;
      else if (st.rec < 100) msg = '**Receptor loss alone:** curves shift right only (spare receptors). A little more insulin fixes it.';
      else msg = 'Pick a preset or drag the sliders.';
      read.innerHTML = `<table class="labs irl-tab">${rows}</table><p>${EP.md(msg)}</p>`;
    }
    draw();
    return el;
  };

  // ================================================================== interactive: sources of HGP + key experiments (Figs. 3, 6)
  IRV.hgp = function () {
    const el = h('div');
    const st = { t: 12, sp: 'human', sc: 'normal' };
    // Rothman 1991 (humans): gluconeogenesis 64% of HGP over 0–22 h, 82% over 22–36 h, 96% over 36–54 h.
    const GNG = (t) => 6.5 * (t < 44 ? 1 : 1 - 0.3 * Math.min(1, (t - 44) / 20));
    const GLY = (t) => (st.sp === 'human' ? 6.0 * Math.exp(-0.065 * (t - 4)) : 6.0 * Math.exp(-0.32 * (t - 2)));
    const SC = {
      normal: { label: 'Normal', hep: 0.85, adip: 1, text: 'Insulin stops glycogen breakdown **directly** and shuts off lipolysis → ↓ acetyl-CoA & glycerol → ↓ gluconeogenesis **indirectly**.' },
      tlko: { label: 'Liver can\'t respond (Akt1/2 + FoxO1 KO)', hep: 0, adip: 1, text: 'HGP is still suppressed: gluconeogenesis is controlled from fat. Only glycogenolysis escapes.' },
      acetate: { label: '+ acetate & glycerol infusion', hep: 0.85, adip: 1, block: true, text: 'Clamp hepatic acetyl-CoA & glycerol supply → insulin can no longer suppress PC flux or HGP.' },
      adipir: { label: 'Adipose insulin resistance', hep: 0.85, adip: 0.3, text: 'Lipolysis keeps going → acetyl-CoA stays high → gluconeogenesis continues. Looks like "hepatic" IR but is adipose IR.' },
      aso: { label: 'INSR knockdown (liver + fat)', hep: 0, adip: 0, text: 'No insulin receptors in liver or fat: no suppression…' },
      atgl: { label: '… + atglistatin', hep: 0, adip: 0, drug: true, text: '…block lipolysis with a drug and suppression returns — no hepatic INSR needed.' },
      t2d: { label: 'Type 2 diabetes', hep: 0.45, adip: 0.45, gngUp: 1.3, glyDn: 0.7, text: 'Raised HGP is **all gluconeogenesis**; glycogen is lower. Direct and indirect suppression both impaired.' },
    };
    const c = chart(560, 270, { l: 50, b: 42 });
    const bars = chart(300, 270, { l: 44, b: 42 });
    const X = (t) => c.P.l + t / 48 * c.iw, Y = (v) => c.P.t + (1 - v / 16) * c.ih;
    const info = h('div.irl-read');
    const tS = slider('Hours since last meal', 4, 48, 1, 12, (v) => v + ' h', (v) => { st.t = v; draw(); });
    const sp = chips([{ id: 'human', label: 'Human' }, { id: 'rat', label: 'Rat (glycogen gone overnight)' }], (id) => { st.sp = id; draw(); });
    const sc = chips(Object.keys(SC).map((k) => ({ id: k, label: SC[k].label })), (id) => { st.sc = id; draw(); });
    const key = EP.colorKey([['Hepatic glucose production', [{ fill: 'color-mix(in srgb, var(--tr0) 55%, transparent)', label: 'Glycogenolysis — DIRECT insulin control' }, { fill: 'color-mix(in srgb, var(--tr1) 55%, transparent)', label: 'Gluconeogenesis — mostly INDIRECT (via fat)' }]]], { compact: true });
    el.append(h('div.irl-row', h('div.small.muted', 'Species'), sp), h('div.irl-row', h('div.small.muted', 'Experiment'), sc), tS,
      h('div.irl-grid', h('div', c.svg), h('div', bars.svg)), key, info);
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
      c.g.appendChild(text(X(30), Y(gng(30)) + 22, 'Gluconeogenesis', 'fill:var(--text);font-weight:700', 'middle'));
      c.g.appendChild(text(X(9), Y(gng(9) + gly(9) / 2) + 4, 'Glycogenolysis', 'fill:var(--text);font-weight:700', 'middle'));
      c.g.appendChild(s('line', { x1: X(st.t), x2: X(st.t), y1: c.P.t, y2: c.P.t + c.ih, style: 'stroke:var(--text);stroke-width:1.5' }));
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
      info.innerHTML = `<div class="irl-stats"><div><b>${(share * 100).toFixed(0)}%</b><span>of HGP from glycogen at ${st.t} h</span></div><div><b class="${sup > 0.5 ? 'up' : 'dn'}">${(sup * 100).toFixed(0)}%</b><span>HGP suppressed by insulin</span></div><div><b>${(N0 ? (1 - N1 / N0) * 100 : 0).toFixed(0)}%</b><span>of gluconeogenesis suppressed</span></div></div><p>${EP.md(S.text)}</p>`;
    }
    draw();
    return el;
  };

  // ================================================================== interactive: lipid infusion time course (Fig. 12)
  IRV.lipidInfusion = function () {
    const el = h('div');
    const st = { t: 5 };
    const c = chart(620, 280, { l: 52, b: 42 });
    const X = (t) => c.P.l + t / 6 * c.iw, Y = (v) => c.P.t + (1 - (v - 0.2) / 1.6) * c.ih;
    const sig = (t, t50, k) => 1 / (1 + Math.exp(-(t - t50) * k));
    const S = {
      dag: (t) => 1 + 0.8 * sig(t, 3.2, 2.2),
      tr: (t) => 1 - 0.5 * sig(t, 3.8, 2.2),
      g6pObs: (t) => 1 + 0.15 * Math.sin(Math.min(t, 3) / 3 * Math.PI) * (t < 3 ? 1 : 0) - 0.35 * sig(t, 3.8, 2.2),
      g6pRandle: (t) => 1 + 0.45 * sig(t, 1.5, 2.5),
    };
    const SER = [['dag', 'var(--tr3)', '', 'Muscle sn-1,2-DAG / PKCθ'], ['tr', 'var(--tr1)', '', 'Insulin-stimulated glucose transport'], ['g6pObs', 'var(--tr2)', '', 'G6P — measured (³¹P-MRS)'], ['g6pRandle', 'var(--tr0)', '6 4', 'G6P — Randle prediction']];
    const tbl = h('div.irl-read');
    const tS = slider('Hours of lipid–heparin infusion', 0, 6, 0.1, 5, (v) => v.toFixed(1) + ' h', (v) => { st.t = v; draw(); });
    const key = EP.colorKey([['Lines (relative to start)', SER.map(([, col, d, l]) => ({ line: col, dash: d || null, label: l }))]], { compact: true });
    el.append(tS, h('div.irl-grid', h('div', c.svg, key), tbl));
    function draw() {
      c.clear();
      axes(c, [0, 1, 2, 3, 4, 5, 6].map((v) => [X(v), v + ' h']), [0.4, 0.8, 1.0, 1.2, 1.6].map((v) => [Y(v), '×' + v]), 'Time', 'Relative level');
      c.g.appendChild(s('rect', { x: X(3), y: c.P.t, width: X(5) - X(3), height: c.ih, style: 'fill:color-mix(in srgb, var(--tr3) 9%, transparent)' }));
      c.g.appendChild(text(X(4), c.P.t + 12, 'IR appears (3–5 h)', 'fill:var(--tr3);font-weight:600', 'middle'));
      c.g.appendChild(s('line', { x1: c.P.l, x2: c.P.l + c.iw, y1: Y(1), y2: Y(1), style: 'stroke:var(--faint);stroke-dasharray:2 3' }));
      SER.forEach(([k, col, d]) => { const pts = []; for (let i = 0; i <= 120; i++) { const t = i / 20; pts.push([X(t), Y(S[k](t))]); } c.g.appendChild(line(pts, `stroke:${col};stroke-width:2.6;${d ? 'stroke-dasharray:' + d : ''}`)); });
      c.g.appendChild(s('line', { x1: X(st.t), x2: X(st.t), y1: c.P.t, y2: c.P.t + c.ih, style: 'stroke:var(--text);stroke-width:1.5' }));
      const late = st.t >= 3.5;
      const arrow = (v) => (v > 1.08 ? '<span class="qual up">↑</span>' : v < 0.92 ? '<span class="qual dn">↓</span>' : '<span class="qual eq">↔</span>');
      const rows = [['Free glucose in cell', 1.3, late ? 0.7 : 1.0], ['Glucose-6-phosphate', S.g6pRandle(st.t), S.g6pObs(st.t)], ['Glycolysis', 0.75, late ? 0.7 : 0.85], ['Glycogen synthesis', late ? 0.7 : 0.9, late ? 0.55 : 0.95], ['GLUT4 transport', 1.0, S.tr(st.t)]];
      tbl.innerHTML = `<table class="cmp-table"><tr><th></th><th>Randle predicted</th><th>Measured</th></tr>${rows.map(([n, a, b]) => `<tr><td>${n}</td><td>${arrow(a)}</td><td>${arrow(b)}</td></tr>`).join('')}</table>
        <p>${EP.md(late ? '**Late:** glucose & G6P **fall** → block is at **transport**, not downstream.' : '**Early (< 3 h):** G6P rises a little — Randle allostery is real, but only sets fuel choice.')}</p>`;
    }
    draw();
    return el;
  };

  // ================================================================== interactive: GTT reader (Fig. 10)
  IRV.gtt = function () {
    const el = h('div');
    const CO = [
      { id: 'lean', label: 'Lean, chow-fed', c: 'var(--tr2)', g: [110, 140, 18], i: [12, 35, 15], ans: 'ref' },
      { id: 'hfd', label: 'Obese, high-fat-fed', c: 'var(--tr0)', g: [135, 210, 30], i: [40, 120, 22], ans: 'ir', why: 'High glucose **despite more insulin** → insulin resistance.' },
      { id: 'nod', label: 'Pre-diabetic NOD', c: 'var(--tr3)', g: [125, 240, 28], i: [8, 12, 15], ans: 'sec', why: 'High glucose with **little insulin** → β-cell secretory defect.' },
      { id: 'fgf', label: 'FGF21-treated', c: 'var(--tr4)', g: [95, 85, 16], i: [8, 18, 15], ans: 'sens', why: 'Better glucose with **less insulin** → more insulin-sensitive.' },
      { id: 'su', label: 'Sulfonylurea-treated', c: 'var(--tr1)', g: [95, 85, 16], i: [28, 80, 15], ans: 'secup', why: 'Better glucose with **more insulin** → more secretion, not sensitivity.' },
    ];
    const on = new Set(['lean', 'hfd', 'nod']);
    const gc = chart(380, 240, { l: 48, b: 40 }), ic = chart(380, 240, { l: 48, b: 40 });
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
    const quiz = h('div.irl-quiz');
    const ANS = [['ir', 'Insulin resistance'], ['sec', 'Secretion defect'], ['sens', '↑ Insulin sensitivity'], ['secup', '↑ Insulin secretion']];
    function newQ() {
      const x = CO.slice(1)[Math.floor(Math.random() * 4)];
      const qc = chart(360, 190, { l: 44, b: 34 }), X = (t) => qc.P.l + t / 120 * qc.iw, Y = (v) => qc.P.t + (1 - v / 400) * qc.ih;
      axes(qc, [0, 60, 120].map((v) => [X(v), v + ' min']), [0, 200, 400].map((v) => [Y(v), String(v)]), '', 'Glucose');
      [[CO[0], 'var(--muted)'], [x, 'var(--accent)']].forEach(([cc, col]) => { const f = curve(...cc.g); const pts = []; for (let t = 0; t <= 120; t += 2) pts.push([X(t), Y(f(t))]); qc.g.appendChild(line(pts, `stroke:${col};stroke-width:2.6`)); });
      const fb = h('p'); const ins = h('div');
      EP.clear(quiz);
      quiz.append(h('h3', '🐭 Mystery mouse'), h('p.small.muted', 'Grey = lean control, blue = mystery. Look at glucose, reveal insulin, then decide.'), qc.svg,
        h('button.btn', { onclick: (ev) => { ev.target.disabled = true; const ic2 = chart(360, 150, { l: 44, b: 30 }); const Yi = (v) => ic2.P.t + (1 - v / 160) * ic2.ih; axes(ic2, [0, 60, 120].map((v) => [ic2.P.l + v / 120 * ic2.iw, v + ' min']), [0, 80, 160].map((v) => [Yi(v), String(v)]), '', 'Insulin'); [[CO[0], 'var(--muted)'], [x, 'var(--accent)']].forEach(([cc, col]) => { const f = curve(...cc.i); const pts = []; for (let t = 0; t <= 120; t += 2) pts.push([ic2.P.l + t / 120 * ic2.iw, Yi(f(t))]); ic2.g.appendChild(line(pts, `stroke:${col};stroke-width:2.6`)); }); ins.appendChild(ic2.svg); } }, 'Reveal insulin curve'), ins,
        h('div.statebar', ANS.map(([id, l]) => h('button.chip', { onclick: () => { fb.innerHTML = (id === x.ans ? '<b class="qual up">Correct.</b> ' : '<b class="qual dn">Not quite.</b> ') + EP.md(x.why) + ` <span class="muted">(${EP.esc(x.label)})</span>`; } }, l))), fb,
        h('button.btn', { onclick: newQ }, 'Another mouse'));
    }
    el.append(bar, h('div.irl-grid2', gc.svg, ic.svg), keyEl, h('div.card', quiz));
    redraw(); newQ();
    return el;
  };

  // ================================================================== evidence board (sects. V–VII)
  IRV.evidence = function () {
    const el = h('div');
    const M = [
      { t: ['liver', 'muscle'], name: 'Diacylglycerol → novel PKC', mech: 'sn-1,2-DAG → PKCε → INSR Thr1160 (liver); PKCθ → IRS1 / GIV / PDK1 (muscle).', s: 3, n: 2, hu: 3, verdict: 'Only fully defined lipid → hepatocyte signaling link.' },
      { t: ['muscle', 'liver', 'wat'], name: 'Ceramides', mech: 'PP2A + PKCζ → ↓ AKT.', s: 2, n: 1, hu: 2, verdict: 'Sufficient in some models, not necessary.' },
      { t: ['muscle'], name: 'Acylcarnitines', mech: 'Incomplete fat oxidation → acylcarnitines, ROS.', s: 1, n: 1, hu: 1, verdict: 'Probably a marker of inflexibility.' },
      { t: ['liver', 'wat'], name: 'ER stress', mech: 'UPR → JNK; XBP1s → lipogenesis.', s: 2, n: 1, hu: 1, verdict: 'Acts mainly through ectopic lipid.' },
      { t: ['muscle'], name: 'Mitochondria & ROS', mech: '↓ ATP synthesis → lipid storage; H₂O₂.', s: 2, n: 1, hu: 2, verdict: 'Amplifier; therapy unproven.' },
      { t: ['wat', 'liver'], name: 'Inflammation', mech: 'Macrophages → TNF-α, IL-1β → ↑ lipolysis.', s: 2, n: 1, hu: 1, verdict: 'Exacerbates; not the first hit.' },
      { t: ['muscle', 'wat'], name: 'BCAAs', mech: 'mTORC1/S6K1; 3-HIB → muscle fat uptake.', s: 1, n: 1, hu: 2, verdict: 'Great biomarker; cause uncertain.' },
      { t: ['wat', 'liver'], name: 'Adipokines / hepatokines', mech: 'RBP4 ↑, adiponectin ↓, fetuin-A ↑, FGF21 resistance.', s: 2, n: 1, hu: 2, verdict: 'Modulators; mostly via lipid.' },
      { t: ['muscle'], name: 'Randle cycle', mech: 'Fat oxidation ⊣ PDH, PFK → G6P ↑ ⊣ HK.', s: 1, n: 1, hu: 1, verdict: 'Fuel choice, not IR.' },
    ];
    const grid = h('div.irl-cards');
    const dots = (n) => '●●●'.slice(0, n) + '<span class="irl-off">' + '●●●'.slice(n) + '</span>';
    function show(tissue) {
      EP.clear(grid);
      M.filter((m) => tissue === 'all' || m.t.includes(tissue)).forEach((m) => {
        grid.appendChild(h('div.irl-mcard.open', h('div.irl-mtop', h('b', m.name), h('span.small.muted', m.t.map((x) => ({ liver: 'liver', muscle: 'muscle', wat: 'fat' })[x]).join(' · '))),
          h('div.irl-dots', { html: `<span>Sufficient</span><i>${dots(m.s)}</i><span>Necessary</span><i>${dots(m.n)}</i><span>In humans</span><i>${dots(m.hu)}</i>` }),
          h('p.irl-verdict', { html: EP.md(m.verdict) }), h('p.small.muted', { style: { margin: '6px 0 0' }, html: EP.md(m.mech) })));
      });
    }
    el.append(chips([{ id: 'all', label: 'All tissues' }, { id: 'liver', label: 'Liver' }, { id: 'muscle', label: 'Muscle' }, { id: 'wat', label: 'Fat' }], show), grid);
    show('all');
    return el;
  };

  // ================================================================== Table 1: readouts of hepatic IR
  IRV.readouts = function () {
    const R = [['Net hepatic glycogen synthesis', 'Direct', 'Acute', '↓', 'Needs hyperinsulinemia + hyperglycemia.'], ['Suppression of gluconeogenesis', 'Indirect', 'Acute', '↓', 'Via WAT lipolysis → acetyl-CoA, glycerol.'], ['Suppression of HGP', 'Direct + indirect', 'Acute', '↓', 'Mix depends on species & fast length.'], ['INSR Tyr-P / kinase activity', 'Direct', 'Acute', '↓', 'Most proximal; where PKCε acts.'], ['IRS Tyr-P', 'Direct', 'Acute', '↓', ''], ['AKT Ser/Thr-P', 'Direct', 'Acute', '↓', 'Ser473 has many non-insulin inputs.'], ['Gluconeogenic genes (G6pc, Pck1)', 'Direct', 'Chronic', '↑', 'Not ↑ in human T2D liver.'], ['De novo lipogenesis', 'Direct', 'Chronic', '↓', 'Many inputs (mTORC1, ChREBP).'], ['Fasting insulin (HOMA-IR)', 'Direct + indirect', 'Chronic', '↑', 'Crude; good for big cohorts.']];
    const tag = (v) => `<span class="irl-tag ${/Indirect/.test(v) && !/Direct/.test(v) ? 'ind' : /\+/.test(v) ? 'mix' : 'dir'}">${v}</span>`;
    const ar = (v) => `<span class="qual ${v.startsWith('↑') ? 'up' : 'dn'}" style="font-size:1.1rem">${v}</span>`;
    return h('div', { style: { overflowX: 'auto' } }, h('table.cmp-table', { html: `<tr><th>Readout</th><th>Direct / indirect</th><th>Timescale</th><th>In hepatic IR</th><th>Note</th></tr>` + R.map((r) => `<tr><td>${r[0]}</td><td>${tag(r[1])}</td><td>${r[2] === 'Acute' ? '⚡ acute' : '🐢 chronic'}</td><td>${ar(r[3])}</td><td class="small muted">${EP.esc(r[4])}</td></tr>`).join('') }));
  };

  // ================================================================== page assembly
  IRV.chapters = [];
  /** Registered by irguide1.js / irguide2.js: {rn, id, title, sub, col, build(body)} */
  IRV.chapter = (c) => IRV.chapters.push(c);

  EP.views.irlab = function (el) {
    el.appendChild(EP.pageHeader('Insulin action & resistance — visual guide', 'How does insulin work in muscle, liver and fat — and what exactly breaks in insulin resistance?', { section: 'Pancreas & Glucose · Petersen & Shulman, Physiol Rev 2018' }));
    const order = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    const CH = order.map((rn) => IRV.chapters.find((c) => c.rn === rn)).filter(Boolean);
    const dets = {};
    const map = h('nav.irv-map', { 'aria-label': 'Sections of the review' }, CH.map((c) => h('button.irv-tile', { style: { '--c': c.col }, onclick: () => { dets[c.rn].open = true; dets[c.rn].scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, h('b', 'Section ' + c.rn), h('span', c.title), h('i', c.tile || ''))));
    const tools = h('div.irv-tools',
      h('button.btn', { onclick: () => Object.values(dets).forEach((d) => { d.open = true; }) }, '▾ Expand all sections'),
      h('button.btn', { onclick: () => Object.values(dets).forEach((d) => { d.open = false; }) }, '▸ Collapse all'),
      h('a.btn', { href: '#/insulin' }, 'Insulin signaling map →'), h('a.btn', { href: '#/glut4' }, 'GLUT4 animation →'));
    el.append(map, tools, EP.flowKey());
    CH.forEach((c, i) => {
      const body = h('div.irv-body');
      let built = false;
      const d = h('details.irv-ch', { id: 'irv-' + c.rn, style: { '--c': c.col }, open: i === 0 },
        h('summary', h('span.irv-rn', c.rn), h('h2', c.title), h('span.irv-chev', '▸'), h('p', c.sub)), body);
      const build = () => { if (built) return; built = true; try { c.build(body); } catch (err) { console.error(err); body.appendChild(h('p.error', 'Could not draw this section: ' + err.message)); } };
      d.addEventListener('toggle', () => { if (d.open) build(); });
      if (d.open) build();
      dets[c.rn] = d;
      el.appendChild(d);
    });
    el.appendChild(EP.sources(['petersen2018', 'rothman1991', 'perry2015', 'petersen2007', 'petersen2005', 'brown2008', 'donnelly2005', 'lambert2014', 'shulman1990']));
  };
})();
