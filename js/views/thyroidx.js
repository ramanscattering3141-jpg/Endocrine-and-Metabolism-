/* Thyroid disorder explorer (lab pattern + follicle schematic) and the Wolff–Chaikoff curve.
 * Sources: Kovacs Ch3, Ch12 (Wolff–Chaikoff, autoregulation, RAIU, subacute thyroiditis),
 * Molina Ch4 (thyroiditis types, iodine abnormalities, NIS defect, euthyroid sick). */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;

  // levels: 2 ↑↑, 1 ↑, 0 normal, -1 ↓, -2 ↓↓, 'v' variable, null n/a
  const ST = [
    { id: 'eu', label: 'Euthyroid', tsh: 0, t4: 0, raiu: 0, tg: 0, ab: 'negative', gland: 'Normal', steps: { tsh: 0, nis: 0, tpo: 0, rel: 0 }, why: 'Intact feedback keeps TSH and free hormone in range.' },
    { id: 'graves', label: 'Graves disease', tsh: -2, t4: 2, raiu: 2, tg: 1, ab: 'TSH-receptor (stimulating)', gland: 'Diffuse goiter; eye signs', steps: { tsh: -2, nis: 2, tpo: 2, rel: 2, ab: 1 }, why: 'Antibodies mimic TSH and escape feedback, so the whole gland is stimulated while TSH is suppressed (Kovacs Ch3, Ch12). Uptake is **high** — new hormone is being made.', src: 'Kovacs Ch3, Ch12' },
    { id: 'nodule', label: 'Toxic nodular disease', tsh: -2, t4: 2, raiu: 1, tg: 0, ab: 'negative', gland: 'Nodule(s); "hot" on scintigraphy', steps: { tsh: -2, nis: 1, tpo: 1, rel: 1 }, why: 'Autonomous nodules make hormone without TSH; uptake is high in the nodules ("hot") while the rest of the gland is suppressed (Kovacs Ch12).', src: 'Kovacs Ch12' },
    { id: 'subacute', label: 'Subacute thyroiditis', tsh: -2, t4: 2, raiu: -2, tg: 1, ab: 'usually negative', gland: 'Tender, slightly enlarged; neck pain', steps: { tsh: -2, nis: -2, tpo: -1, rel: 2, leak: 1 }, why: '**Destruction** releases stored hormone (and thyroglobulin) → transient hyperthyroidism with **very low iodine uptake** (no new synthesis). As follicles regenerate, function recovers; transient or permanent hypothyroidism can follow (Kovacs Ch12, Box 12-2).', src: 'Kovacs Ch12' },
    { id: 'acute', label: 'Acute (infectious) thyroiditis', tsh: 0, t4: 0, raiu: null, tg: null, ab: 'negative', gland: 'Painful, hot, enlarged; fever, chills', steps: { tsh: 0, nis: 0, tpo: 0, rel: 0 }, why: 'Rare infection of the gland. T3, T4 and TSH are usually normal; reverse T3 is increased (Molina Ch4).', src: 'Molina Ch4' },
    { id: 'hashi', label: 'Hashimoto thyroiditis (established)', tsh: 2, t4: -2, raiu: -1, tg: null, ab: 'anti-TPO, anti-thyroglobulin', gland: 'Firm goiter or atrophy', steps: { tsh: 2, nis: -2, tpo: -2, rel: -2, ab: 1 }, why: 'Autoimmune lymphocytic infiltration; antibodies impair the Na⁺/I⁻ symporter and hormone synthesis. The most common cause of adult hypothyroidism; early on, values can be variable (Molina Ch4).', src: 'Molina Ch4' },
    { id: 'iodef', label: 'Iodine deficiency', tsh: 1, t4: -1, raiu: 2, tg: null, ab: 'negative', gland: 'Goiter', steps: { tsh: 1, nis: 2, tpo: -1, rel: -1 }, why: 'Autoregulation increases the efficiency of iodide transport, and TSH rises → goiter. In pregnancy, severe deficiency causes fetal brain injury — the leading preventable cause of intellectual disability (Kovacs Ch12; Molina Ch4).', src: 'Kovacs Ch12; Molina Ch4' },
    { id: 'wc', label: 'Acute iodide excess (Wolff–Chaikoff)', tsh: 0, t4: 0, raiu: -2, tg: null, ab: 'negative', gland: 'Normal', steps: { tsh: 0, nis: -1, tpo: -2, rel: -1 }, why: 'High plasma iodide transiently **inhibits organification** (and hormone release — used in severe hyperthyroidism). In a normal gland, **escape** occurs within days as NIS is down-regulated (Kovacs Ch12; Molina Ch4). Maternal iodide excess can cause fetal hypothyroidism and goiter.', src: 'Kovacs Ch12; Molina Ch4' },
    { id: 'nis', label: 'Congenital NIS defect', tsh: 2, t4: -2, raiu: -2, tg: null, ab: 'negative', gland: 'Neonatal goiter', steps: { tsh: 2, nis: -2, tpo: 0, rel: -2 }, why: 'Absent or defective Na⁺/I⁻ symporter: low T3/T4, high TSH, poor radioiodine or pertechnetate uptake (Molina Ch4).', src: 'Molina Ch4' },
    { id: 'central', label: 'Central hypothyroidism', tsh: -1, t4: -2, raiu: -1, tg: null, ab: 'negative', gland: 'Normal or small', steps: { tsh: -2, nis: -1, tpo: -1, rel: -1 }, why: 'TSH is low or inappropriately normal despite low free T4, so TSH alone misleads in pituitary disease (Kovacs Ch5, Ch12).', src: 'Kovacs Ch5, Ch12' },
    { id: 'sick', label: 'Euthyroid sick (nonthyroidal illness)', tsh: 0, t4: 0, t3: -1, raiu: null, tg: null, ab: 'negative', gland: 'Normal', steps: { tsh: 0, nis: 0, tpo: 0, rel: 0, d3: 1 }, why: 'Illness lowers peripheral T4→T3 conversion and raises inactivation: low T3, high reverse T3, usually normal TSH (Molina Ch4, Ch10; Bianco 2002).', src: 'Molina Ch4, Ch10' },
  ];
  const sym = (v) => (v === null || v === undefined ? '—' : v === 'v' ? 'variable' : v === 2 ? '↑↑' : v === 1 ? '↑' : v === 0 ? 'normal' : v === -1 ? '↓' : '↓↓');
  const cls = (v) => (typeof v !== 'number' ? '' : v > 0 ? 'up' : v < 0 ? 'dn' : 'eq');

  EP.mountThyroidStates = function (el, params = {}) {
    const bar = h('div.statebar', ST.map((x) => h('button.chip', { 'data-id': x.id, onclick: () => show(x.id) }, x.label)));
    const W = 760, H = 300;
    const svg = s('svg', { class: 'tx-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Thyroid follicle schematic' });
    svg.appendChild(EP.svgDefs());
    const box = (x, y, w, hh, label) => { const g = s('g', { class: 'tx-box' }); g.append(s('rect', { x, y, width: w, height: hh, rx: 12 }), s('text', { x: x + w / 2, y: y + hh / 2 + 4, 'text-anchor': 'middle' }, label)); svg.appendChild(g); return g; };
    const pit = box(30, 40, 150, 46, 'Pituitary: TSH');
    svg.appendChild(s('rect', { x: 250, y: 20, width: 480, height: 260, rx: 30, class: 'tx-follicle' }));
    svg.appendChild(s('text', { x: 266, y: 42, class: 'tx-lbl' }, 'THYROID FOLLICLE'));
    const nis = box(270, 120, 130, 46, 'NIS: iodide uptake');
    const tpo = box(430, 120, 140, 46, 'TPO: organification');
    const rel = box(600, 120, 116, 46, 'Release T4/T3');
    const abBadge = s('g', { class: 'tx-ab' }); abBadge.append(s('circle', { cx: 300, cy: 225, r: 14 }), s('text', { x: 300, y: 230, 'text-anchor': 'middle' }, 'Ab')); svg.appendChild(abBadge);
    const abLbl = s('text', { x: 322, y: 230, class: 'tx-lbl' }, ''); svg.appendChild(abLbl);
    const leak = s('text', { x: 600, y: 230, class: 'tx-lbl tx-leak' }, ''); svg.appendChild(leak);
    const tLine = s('path', { d: 'M180,63 C230,63 230,143 270,143', class: 'tx-arrow', 'marker-end': 'url(#m-stim)' }); svg.appendChild(tLine);
    svg.appendChild(s('path', { d: 'M400,143 L430,143', class: 'tx-arrow', 'marker-end': 'url(#m-stim)' }));
    svg.appendChild(s('path', { d: 'M570,143 L600,143', class: 'tx-arrow', 'marker-end': 'url(#m-stim)' }));
    const fb = s('path', { d: 'M658,166 C658,300 105,300 105,90', class: 'tx-fb', 'marker-end': 'url(#m-inhib)' }); svg.appendChild(fb);
    svg.appendChild(s('text', { x: 380, y: 296, class: 'tx-lbl', 'text-anchor': 'middle' }, 'T4/T3 feedback on TSH'));
    const panel = h('div.tx-panel');
    const key = EP.colorKey([
      ['Schematic boxes', [{ fill: 'color-mix(in srgb, var(--up) 22%, var(--panel))', stroke: 'var(--up)', rx: 6, label: 'Increased activity' }, { fill: 'var(--panel)', stroke: 'var(--line)', rx: 6, label: 'Normal' }, { fill: 'color-mix(in srgb, var(--dn) 18%, var(--panel))', stroke: 'var(--dn)', dash: '4 3', rx: 6, label: 'Reduced / blocked' }]],
      ['Other marks', [{ line: 'var(--c-stim)', marker: 'stim', label: 'TSH drive (thicker = stronger)' }, { line: 'var(--c-fb)', dash: '6 4', marker: 'inhib', label: 'Negative feedback (thicker = stronger)' }, { dot: 'var(--c-drug)', label: 'Ab = thyroid autoantibodies present' }, { sym: 'Tg', color: 'var(--c-hormone)', label: 'Stored hormone / thyroglobulin leaking out' }]],
      ['Lab table', [{ sym: '↑', color: 'var(--up)', label: 'Raised' }, { sym: '↓', color: 'var(--dn)', label: 'Low' }]],
    ], { compact: true });
    el.append(bar, h('div.tx-grid', h('div.card', svg, key), panel));
    const lv = (g, v) => g.setAttribute('class', 'tx-box ' + (v > 0 ? 'up' : v < 0 ? 'dn' : ''));
    function show(id) {
      const x = ST.find((y) => y.id === id) || ST[0];
      bar.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', b.dataset.id === x.id));
      lv(pit, x.steps.tsh); lv(nis, x.steps.nis); lv(tpo, x.steps.tpo); lv(rel, x.steps.rel);
      tLine.style.strokeWidth = (2.2 + 1.4 * (x.steps.tsh || 0)).toFixed(1); tLine.style.opacity = x.steps.tsh <= -2 ? 0.25 : 1;
      fb.style.strokeWidth = (2 + 1.2 * (x.t4 || 0)).toFixed(1);
      abBadge.style.display = x.steps.ab ? '' : 'none'; abLbl.textContent = x.steps.ab ? x.ab : '';
      leak.textContent = x.steps.leak ? 'Tg + stored hormone leak out' : '';
      const row = (k, v, extra) => `<tr><td>${k}</td><td class="qual ${cls(v)}">${sym(v)}</td><td class="small muted">${extra || ''}</td></tr>`;
      panel.innerHTML = `<div class="card"><h3>${EP.esc(x.label)}</h3><table class="cmp-table">
        ${row('TSH', x.tsh)}${row('Free T4' + (x.t3 != null ? '' : ' / T3'), x.t4)}${x.t3 != null ? row('T3', x.t3, 'reverse T3 ↑') : ''}
        ${row('Radioiodine uptake', x.raiu, x.raiu === null ? 'not informative here' : '')}${row('Thyroglobulin', x.tg)}
        <tr><td>Antibodies</td><td colspan="2">${EP.esc(x.ab)}</td></tr><tr><td>Gland</td><td colspan="2">${EP.esc(x.gland)}</td></tr></table>
        <p>${EP.md(x.why)}</p>${x.src ? `<p class="small muted">Source: ${EP.esc(x.src)}</p>` : ''}
        <p class="small muted">Rule of thumb (Kovacs Ch12): in hyperthyroidism, a **high uptake** means new synthesis (Graves, toxic nodules); a **low uptake** means release of stored hormone (destructive thyroiditis) or exogenous hormone.</p></div>`.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    }
    show(params.state || 'graves');
  };

  EP.mountWolffChaikoff = function (el) {
    const cv = h('canvas.chart', { width: 1000, height: 280 });
    const key = EP.colorKey([['Lines', [{ line: 'var(--tr1)', label: 'Acute: organified iodine vs. plasma iodide' }, { line: 'var(--tr2)', dash: '6 4', label: 'After escape (days later; NIS down-regulated)' }, { fill: 'rgba(255,107,125,.25)', label: 'Plasma iodide range where organification falls (~15–20 µg/dL; Kovacs Ch12)' }]]], { compact: true });
    el.append(h('div.card', cv, key, h('p.small.muted', 'Schematic shape after Kovacs Fig. 12-4: as plasma iodide rises, organified iodine rises to a maximum and then falls abruptly (acute Wolff–Chaikoff effect). Inhibition requires organification and lasts days; escape follows as NIS is down-regulated, lowering intrathyroidal iodide below the inhibitory threshold. Arbitrary vertical units.')));
    function draw() {
      const ctx = cv.getContext('2d'); const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      const css = getComputedStyle(document.body);
      const X = (lx) => 60 + (lx / 3) * (W - 90); // log10 plasma iodide, 0..3 → 1..1000 (relative)
      const thr = Math.log10(17.5 / 0.5); // threshold around 15–20 µg/dL on a schematic scale (baseline ≈ 0.5)
      ctx.fillStyle = 'rgba(255,107,125,.12)'; ctx.fillRect(X(thr - 0.06), 10, X(thr + 0.06) - X(thr - 0.06), H - 50);
      ctx.strokeStyle = css.getPropertyValue('--grid'); ctx.fillStyle = css.getPropertyValue('--muted'); ctx.font = '12px Inter, sans-serif';
      ctx.beginPath(); ctx.moveTo(60, H - 40); ctx.lineTo(W - 20, H - 40); ctx.moveTo(60, 10); ctx.lineTo(60, H - 40); ctx.stroke();
      ctx.fillText('Plasma iodide (log scale) →', W - 230, H - 14); ctx.save(); ctx.translate(18, H / 2 + 50); ctx.rotate(-Math.PI / 2); ctx.fillText('Organified iodine →', 0, 0); ctx.restore();
      const Y = (v) => H - 40 - v * (H - 70);
      const acute = (lx) => { const r = Math.pow(10, lx - thr); return r < 1 ? 0.15 + 0.8 * r : 0.95 * Math.exp(-3.2 * (r - 1)) + 0.08; };
      const escape = (lx) => { const r = Math.pow(10, lx - thr); return 0.15 + 0.8 * (r / (r + 0.25)); };
      [[acute, '--tr1', []], [escape, '--tr2', [6, 4]]].forEach(([f, c, dash]) => { ctx.strokeStyle = css.getPropertyValue(c); ctx.lineWidth = 2.6; ctx.setLineDash(dash); ctx.beginPath(); for (let i = 0; i <= 300; i++) { const lx = i / 100; const y = Y(Math.min(1, f(lx))); i ? ctx.lineTo(X(lx), y) : ctx.moveTo(X(lx), y); } ctx.stroke(); ctx.setLineDash([]); });
    }
    draw();
    EP.on && EP.onTeardown && EP.onTeardown(EP.on('theme', draw));
  };
})();
