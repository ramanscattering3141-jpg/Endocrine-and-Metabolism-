/* Shared page templates and the simpler module pages. */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;
  const V = EP.views;

  // ------------------------------------------------------------------ home
  V.home = function (el) {
    const ask = [
      ['What happens when insulin increases?', '#/insulin'],
      ['What happens to acetyl-CoA during fasting?', '#/acetylcoa'],
      ['Why does glucagon promote ketogenesis?', '#/glucagon'],
      ['Why does exercise increase GLUT4 translocation even when insulin is low?', '#/glut4'],
      ['Why is ACTH high in Addison disease but low in steroid withdrawal?', '#/hpa?preset=primary'],
      ['Where does a glucose molecule go?', '#/follow?m=glucose'],
    ];
    el.append(
      h('div.hero',
        h('div', h('div.crumb.tag', 'Interactive physiology laboratory'), h('h1', 'If I change X, what happens downstream — and why?'),
          h('p', 'Manipulate hormones, nutrients and metabolic signals and watch the consequences propagate: hormone → receptor → signaling → enzymes → pathways → organs → whole-body physiology → feedback.'),
          h('p.small.muted', 'Use the L1–L4 switch (top) to move from medical-student overview to molecular detail and clinical correlation — diagrams stay in the same place, only the detail changes.')),
        h('div.askbox', h('h3', 'Start with a question'), ask.map(([q, href]) => h('a', { href }, q)))),
      h('h2', 'Signature features'),
      h('div.tiles',
        tile('Simulator', 'Metabolic flux simulator', 'Six organs, live fuel fluxes, 17 knobs, fed/fasting/exercise/stress presets — every change explained.', 'flux'),
        tile('Global mode', 'What happens if…?', 'Pick a perturbation and get an interactive, mechanism-by-mechanism cascade.', 'whatif'),
        tile('Prototype', 'Insulin → GLUT4', 'Animated cell: receptor, IRS, PI3K, Akt, AS160, vesicle fusion — plus organ-level effects.', 'insulin'),
        tile('Explorer', 'Follow the molecule', 'Click glucose, then follow it to G6P, pyruvate, acetyl-CoA… anywhere it can go.', 'follow'),
        tile('Feedback', 'Endocrine axes', 'HPA, HPT, HPG, GH, prolactin, ADH, RAAS: lesions, tumors and drugs with live time-courses.', 'hpa'),
        tile('Map', 'Steroidogenesis', 'Knock out an enzyme and watch flux re-route across the three cortical zones.', 'steroidogenesis'),
        tile('Mineral', 'Calcium–PTH–vitamin D', 'Direct vs. vitamin-D-mediated actions on bone, kidney and gut.', 'calcium'),
        tile('Practice', 'Clinical cases', 'Predict hormone levels and pathway changes, then check against the model.', 'cases')),
      h('h2', { style: { marginTop: '22px' } }, 'Visual language'),
      h('div.card', EP.legend()),
      h('p.footer-note', { html: EP.md('Primary sources: Kovacs & Ojeda, *Textbook of Endocrine Physiology* 6e; Molina, *Endocrine Physiology* 5e; Petersen & Shulman, *Physiol Rev* 2018 — supplemented with PubMed-verified literature (see **Sources**). Simulations are qualitative teaching models: they show the direction and relative strength of regulation, not measured fluxes or concentrations.') }));
    function tile(k, t, d, id) { return h('a.tile', { href: '#/' + id }, h('div.tile-k', k), h('h3', t), h('p', d)); }
    // legend in a card should be static (not absolute)
    const lg = el.querySelector('.card .legend'); if (lg) { lg.style.position = 'static'; lg.style.boxShadow = 'none'; lg.style.border = '0'; }
  };

  // ------------------------------------------------------------------ generic pathway page
  V.pathwayPage = function (el, id, opts = {}, params = {}) {
    const pw = EP.pathways[id];
    el.appendChild(EP.pageHeader(pw.title, opts.q, { section: EP.pages[EP.pageForPathway[id]] ? EP.pages[EP.pageForPathway[id]].section : '' }));
    const api = EP.mountPathway(el, id, { height: opts.height || Math.min(640, Math.round(pw.view.h * 0.78)), focus: params.focus });
    (opts.more || []).forEach((mid) => { el.appendChild(h('h2', EP.pathways[mid].title)); EP.mountPathway(el, mid, { height: Math.round(EP.pathways[mid].view.h * 0.7), focus: params.focus }); });
    if (opts.net) {
      el.appendChild(h('h2', { style: { marginTop: '18px' } }, 'Linked feedback system: ' + EP.networks[opts.net].title));
      EP.mountNetwork(el, opts.net);
    }
    el.appendChild(EP.sources(pw.refs || []));
    return api;
  };

  // ------------------------------------------------------------------ axis page
  const AXIS_Q = {
    hpa: 'If cortisol changes, how do CRH and ACTH respond — and how does that localize a lesion?',
    hpt: 'Why is TSH the most sensitive test for primary thyroid disease, and when does it mislead?',
    hpgm: 'Why do exogenous androgens cause infertility even though serum testosterone is high?',
    hpgf: 'How can the same hormone (estradiol) switch from negative to positive feedback?',
    gh: 'Why is GH high when IGF-1 is low in GH insensitivity and malnutrition?',
    prl: 'Why does cutting the pituitary stalk raise prolactin while other pituitary hormones fall?',
    raas: 'How do renin and aldosterone distinguish primary from secondary hyperaldosteronism?',
  };
  const AXIS_REFS = { hpa: ['kovacs5', 'kovacs13', 'molina6', 'oster2017', 'bornstein2016', 'nieman2008'], hpt: ['kovacs5', 'kovacs12', 'molina4', 'bianco2002'], hpgm: ['kovacs9', 'molina8'], hpgf: ['kovacs8', 'molina9'], gh: ['kovacs11', 'molina3'], prl: ['freeman2000', 'kovacs5', 'molina3'], raas: ['molina6', 'kovacs13'] };
  V.axisPage = function (el, id, params = {}) {
    const net = EP.networks[id];
    el.appendChild(EP.pageHeader(net.title, AXIS_Q[id], { section: EP.pages[id] ? EP.pages[id].section : '', lede: 'Each node shows its value relative to normal (bar under the node; ↑/↓ badge). Feedback travels back up the curved dashed arrows. Choose a preset or move a slider — the time course shows the order in which hormones change.' }));
    const extra = h('div');
    if (id === 'hpa') {
      const chk = h('input', { type: 'checkbox', onchange: (ev) => { EP.networks.hpa.circadian = ev.target.checked; } });
      EP.networks.hpa.circadian = false;
      const clock = h('span.kbd', '');
      extra.append(h('label.chk', chk, ' Run 24-h circadian clock (SCN drive; morning cortisol peak — Oster 2017) '), clock);
      const stop = EP.loop(() => { clock.textContent = EP.networks.hpa.circadian ? String(Math.floor(EP.networks.hpa.clockHour || 7)).padStart(2, '0') + ':00' : ''; });
      EP.onTeardown(stop);
      EP.onTeardown(() => { EP.networks.hpa.circadian = false; });
    }
    el.appendChild(extra);
    const api = EP.mountNetwork(el, id);
    if (params.preset) api.choose(params.preset);
    if (id === 'hpgm') { el.appendChild(h('h2', 'Inside the testis')); EP.mountPathway(el, 'testis', { height: 440 }); }
    if (id === 'hpgf') { el.appendChild(h('h2', 'Inside the follicle')); EP.mountPathway(el, 'ovary', { height: 420 }); }
    if (id === 'gh') { el.appendChild(h('h2', 'GH receptor signaling (JAK2–STAT5)')); EP.mountPathway(el, 'jakstat', { height: 460 }); }
    if (id === 'hpa') { el.appendChild(h('p', h('a', { href: '#/cortisol' }, 'Where cortisol acts →'), ' · ', h('a', { href: '#/steroidogenesis' }, 'How cortisol is made →'))); }
    el.appendChild(EP.sources(AXIS_REFS[id] || []));
  };

  // ------------------------------------------------------------------ bound (metabolic-model) pathway page
  V.boundPathway = function (el, id, params = {}, question) {
    const pw = EP.pathways[id];
    el.appendChild(EP.pageHeader(pw.title.split(' (')[0], question, { section: 'Metabolism' }));
    el.appendChild(EP.modelNote('This diagram is wired to the same whole-body model as the flux simulator: change the state below and every node and arrow updates. Click any node for *why*.'));
    const model = EP.metabolic.create();
    let api;
    const knobs = EP.metabolicKnobs(model, () => api && api.update(), { compact: true, preset: params.preset });
    el.appendChild(knobs);
    api = EP.mountPathway(el, id, { extModel: model, height: Math.min(700, Math.round(pw.view.h * 0.8)), focus: params.focus });
    model.solve(); api.update();
    if (id === 'acetylcoa') el.appendChild(h('div.card', h('h3', 'Bottlenecks to remember'), h('ul.keypoints', { html: [
      '**Substrate vs. enzyme:** pyruvate carboxylase can be fully activated by acetyl-CoA, but gluconeogenic flux still depends on lactate, glycerol and amino-acid supply.',
      '**OAA is shared:** the same oxaloacetate pool feeds citrate synthase (oxidation) and PEPCK (glucose). Fasting pulls it toward glucose; acetyl-CoA then spills into ketones.',
      '**No net glucose from acetyl-CoA** (or even-chain fatty acids) in humans — glycerol and odd-chain propionyl-CoA are the exceptions.',
      '**Try it:** set *Hepatic acetyl-CoA* to manual-high in the knobs above (or use What-if → ↑ Acetyl-CoA): PC and ketogenesis rise; glucose output barely moves without more substrate.',
    ].map((t) => `<li>${EP.md(t)}</li>`).join('') })));
    el.appendChild(EP.sources(pw.refs || []));
  };

  // ------------------------------------------------------------------ metabolic knobs (shared)
  EP.metabolicKnobs = function (model, onChange, opts = {}) {
    const M = EP.metabolic;
    const wrap = h('div.sim-panel' + (opts.compact ? '.compact-knobs' : ''));
    const presetRow = h('div.statebar');
    const btns = [];
    M.presets.forEach((p) => {
      const b = h('button.chip', { title: p.text, onclick: () => apply(p, b) }, (p.icon || '') + ' ' + p.label);
      btns.push(b); presetRow.appendChild(b);
    });
    const story = h('p.small.muted', '');
    wrap.append(h('h4', 'Physiological state'), presetRow, story);
    const sliders = {};
    const body = h('div', { style: opts.compact ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '4px 16px' } : {} });
    const group = (title, items) => { body.appendChild(h('h4', { style: opts.compact ? { gridColumn: '1 / -1' } : {} }, title)); items.forEach((it) => body.appendChild(knob(it))); };
    function knob(it) {
      const k = EP.logSlider({ label: it.label, value: 1, span: it.span || 2.5, labels: it.labels, onChange: (v) => { setVal(it, v); if (lock) lock.checked = true; fire(); } });
      sliders[it.id] = k;
      let lock = null;
      if (it.kind === 'clamp') {
        lock = h('input', { type: 'checkbox', onchange: () => { if (lock.checked) setVal(it, k.get()); else delete model.clamps[it.id]; fire(); } });
        return h('div.knobrow', k, h('label.lockchk', { title: it.lockTitle || 'Override the model and hold this value' }, lock, it.lockLabel || 'set manually (else: model decides)'));
      }
      return h('div.knobrow', k);
    }
    function setVal(it, v) { if (it.kind === 'clamp') model.clamps[it.id] = v * (model.ref[it.id] || 1); else model.inputs[it.id] = v; }
    group('Hormones', [
      { id: 'insulin', label: 'Insulin', kind: 'clamp', lockLabel: 'clamp (else: pancreas responds)' },
      { id: 'glucagon', label: 'Glucagon', kind: 'clamp', lockLabel: 'clamp (else: pancreas responds)' },
      { id: 'epi', label: 'Epinephrine', kind: 'clamp' }, { id: 'cortisol', label: 'Cortisol', kind: 'clamp' }, { id: 'gh', label: 'Growth hormone', kind: 'clamp' },
    ]);
    group('Nutrient availability', [
      { id: 'carb', label: 'Dietary carbohydrate', kind: 'input', labels: ['none', 'little', 'overnight fast', 'meal', 'large meal'] },
      { id: 'fat', label: 'Dietary fat', kind: 'input' }, { id: 'protein', label: 'Dietary protein / amino acids', kind: 'input' },
      { id: 'glucose', label: 'Plasma glucose (clamp)', kind: 'clamp', lockLabel: 'glucose clamp' },
      { id: 'ffa', label: 'Plasma fatty acids (clamp)', kind: 'clamp' }, { id: 'aa', label: 'Plasma amino acids (clamp)', kind: 'clamp' },
    ]);
    group('Metabolic signals (liver unless stated)', [
      { id: 'amp', label: 'AMP : ATP (energy stress)', kind: 'clamp', lockLabel: 'set (↑AMP = ↓ATP)' }, { id: 'citrate', label: 'Citrate', kind: 'clamp' },
      { id: 'acoa', label: 'Acetyl-CoA', kind: 'clamp' }, { id: 'nadh', label: 'NADH : NAD⁺', kind: 'clamp', lockLabel: 'set (↑NADH = ↓NAD⁺)' }, { id: 'malonyl', label: 'Malonyl-CoA', kind: 'clamp' },
    ]);
    group('Physiological state', [
      { id: 'fastdur', label: 'Fasting duration', kind: 'input', labels: ['fed', 'recent meal', 'overnight', '1–2 days', 'prolonged'] },
      { id: 'exercise', label: 'Exercise intensity', kind: 'input', labels: ['—', '—', 'rest', 'moderate', 'intense'] },
      { id: 'stress', label: 'Stress', kind: 'input' }, { id: 'sens', label: 'Insulin sensitivity', kind: 'input', labels: ['severe resistance', 'resistant', 'normal', 'sensitive', 'very sensitive'] },
      { id: 'betacap', label: 'β-cell capacity', kind: 'input', labels: ['absent (T1D)', 'impaired', 'normal', 'high', 'very high'] },
    ]);
    if (opts.compact) {
      const det = h('details', h('summary.small', { style: { cursor: 'pointer', color: 'var(--accent)', margin: '6px 0' } }, 'All knobs (hormones · nutrients · signals · state)'), body);
      wrap.appendChild(det);
    } else wrap.appendChild(body);
    function apply(p, b) {
      btns.forEach((x) => x.classList.toggle('on', x === b));
      model.applyPreset({ inputs: p.inputs });
      wrap.querySelectorAll('.lockchk input').forEach((c) => { c.checked = false; });
      syncSliders();
      story.innerHTML = EP.md(p.text);
      fire();
    }
    function syncSliders() {
      Object.keys(sliders).forEach((id) => {
        const n = model.byId[id];
        if (n && n.input) sliders[id].set(model.inputs[id]);
        else sliders[id].set(model.eff(id) / (model.ref[id] || 1));
      });
    }
    function fire() { model.solve(); syncSliders(); onChange && onChange(model); }
    wrap.apply = (id) => { const i = M.presets.findIndex((p) => p.id === id); if (i >= 0) apply(M.presets[i], btns[i]); };
    wrap.sync = syncSliders;
    setTimeout(() => { if (opts.preset) wrap.apply(opts.preset); else { btns[0].classList.add('on'); story.innerHTML = EP.md(M.presets[0].text); fire(); } }, 0);
    return wrap;
  };

  // ------------------------------------------------------------------ fundamentals: classes
  V.classes = function (el) {
    el.appendChild(EP.pageHeader('Hormone classes & life cycle', 'Why do peptide hormones act in minutes but steroids over hours — and why are steroids never stored?', { section: 'Endocrine Fundamentals' }));
    const rows = [
      ['', 'Peptide / protein', 'Steroid', 'Amine: catecholamine', 'Amine: thyroid hormone'],
      ['Examples', 'Insulin, glucagon, ACTH, PTH, GH', 'Cortisol, aldosterone, testosterone, estradiol, calcitriol', 'Epinephrine, norepinephrine, dopamine', 'T4, T3'],
      ['Made from', 'Gene → prepro-hormone (ER, Golgi)', 'Cholesterol (StAR → CYP enzymes)', 'Tyrosine', 'Tyrosine + iodide on thyroglobulin'],
      ['Stored?', 'Yes — secretory granules', '**No** — secretion rate = synthesis rate', 'Yes — chromaffin granules', 'Yes — colloid (weeks)'],
      ['Transport', 'Mostly free (GH, IGF-1 bound)', 'Bound (CBG, SHBG, albumin)', 'Free / loosely bound', '>99% bound (TBG, TTR, albumin)'],
      ['Plasma t½ (sourced)', 'Insulin 3–8 min; glucagon 5–10 min; PTH <5 min', 'Cortisol 70–90 min; aldosterone ~15–20 min', '<2 min', 'T4 ≈7 days; T3 <1 day'],
      ['Receptor', 'Membrane (GPCR, RTK, cytokine)', 'Intracellular nuclear receptor', 'Membrane GPCR (α/β)', 'Nuclear TR (enters via MCT8)'],
      ['Onset of action', 'Seconds–minutes (phosphorylation)', 'Hours (transcription); some rapid non-genomic effects', 'Seconds', 'Hours–days'],
    ];
    const t = h('table.cmp-table', rows.map((r, i) => h('tr', r.map((c, j) => i === 0 ? h('th', c) : h(j === 0 ? 'th' : 'td', { html: EP.md(c) })))));
    el.append(h('div.card', t, h('p.small.muted', { html: EP.md('Half-lives: Kovacs Ch1 Table 1-3, Ch12, Ch13, Ch14; Molina Ch6–7. {{ref:kovacs1}} {{ref:molina1}} {{ref:molina7}}') })));
    el.appendChild(h('div.tabs', ...[['peptidelife', 'Peptide life cycle'], ['steroidlife', 'Steroid life cycle']].map(([id, l], i) => h('button' + (i ? '' : '.on'), { onclick: (ev) => { ev.target.parentNode.querySelectorAll('button').forEach((b) => b.classList.remove('on')); ev.target.classList.add('on'); EP.clear(slot); EP.mountPathway(slot, id, { height: 340 }); } }, l))));
    const slot = h('div'); el.appendChild(slot); EP.mountPathway(slot, 'peptidelife', { height: 340 });
    el.appendChild(EP.sources(['kovacs1', 'molina1', 'kovacs3']));
  };

  // ------------------------------------------------------------------ receptors
  V.receptors = function (el, params) {
    el.appendChild(EP.pageHeader('Receptors & second messengers', 'How does a hormone that never enters the cell change what the cell does — and how is the signal amplified and switched off?', { section: 'Endocrine Fundamentals', lede: 'Each diagram is live: move the ligand slider and watch the signal propagate. Use Level 3 to see desensitization (GRK/β-arrestin) and termination steps.' }));
    const list = [['gs', 'Gs → cAMP'], ['gi', 'Gi'], ['gq', 'Gq → IP₃/DAG/Ca²⁺'], ['rtk', 'Receptor tyrosine kinase'], ['jakstat', 'JAK–STAT'], ['nuclear', 'Nuclear receptors']];
    const tabs = h('div.tabs'); const slot = h('div');
    list.forEach(([id, l]) => tabs.appendChild(h('button', { 'data-id': id, onclick: () => show(id) }, l)));
    el.append(tabs, slot);
    function show(id) { tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === id)); EP.clear(slot); EP.mountPathway(slot, id, { height: 520, focus: params.focus }); }
    show(params.focus && ['gs', 'gi', 'gq', 'rtk', 'jakstat', 'nuclear'].find((p) => EP.pathways[p].nodes.some((n) => (n.ent || n.id) === params.focus)) || 'gs');
    el.appendChild(h('div.card', h('h3', 'Key ideas'), h('ul.keypoints', { html: [
      '**Amplification:** one occupied receptor activates many G proteins; each adenylyl cyclase makes many cAMP; each PKA phosphorylates many targets.',
      '**Desensitization** (minutes): GRK phosphorylation + β-arrestin uncoupling. **Down-regulation** (hours): receptor internalization/degradation with sustained exposure (e.g., continuous GnRH). **Up-regulation** follows hormone deficiency.',
      '**Specificity** comes from receptor expression (glucagon receptors are abundant in liver, negligible in skeletal muscle) and from local enzymes (D2, 11β-HSD2, 5α-reductase, aromatase).',
      '**Termination:** GTPase activity of Gα, phosphodiesterases, phosphatases (PP1, PTEN), SOCS proteins, receptor-mediated hormone degradation.',
    ].map((t) => `<li>${EP.md(t)}</li>`).join('') })));
    el.appendChild(EP.sources(['kovacs3', 'molina1']));
  };

  // ------------------------------------------------------------------ feedback
  V.feedback = function (el) {
    el.appendChild(EP.pageHeader('Feedback loops', 'Perturb one hormone: which way does the rest of the loop move, and how fast?', { section: 'Endocrine Fundamentals', lede: 'Three canonical motifs, each a live simulation. Long-loop vs short-loop feedback are labelled on the HPA and GH axes; open those pages to see them in a real axis.' }));
    [['motif_neg', 'Negative feedback: the default control mode (Kovacs Ch1)'], ['motif_pos', 'Positive feedback: the oxytocin / Ferguson reflex'], ['motif_ff', 'Feed-forward: incretins']].forEach(([id, t]) => {
      el.appendChild(h('h2', t));
      const api = EP.mountNetwork(el, id);
      if (id === 'motif_ff') {
        const btn = h('button.btn.primary', { onclick: () => { api.model.inputs.meal = 5; setTimeout(() => { api.model.inputs.meal = 1; }, 2500); } }, '🍽 Eat a meal (pulse)');
        el.insertBefore(h('p', btn, h('span.muted.small', '  — watch GLP-1 and insulin rise before glucose peaks.')), api.root);
      }
    });
    el.appendChild(h('div.card', h('h3', 'Vocabulary'), h('ul.keypoints', { html: [
      '**Long-loop:** target-gland hormone → hypothalamus/pituitary (cortisol ⊣ CRH, ACTH).',
      '**Short-loop:** pituitary hormone → hypothalamus (ACTH ⊣ CRH; GH → somatostatin; prolactin → dopamine).',
      '**Ultrashort-loop:** a hypothalamic hormone on its own neurons.',
      '**Feed-forward:** a signal anticipates a disturbance (gut incretins before the glucose rise).',
      '**Positive feedback** is self-limiting only when the stimulus is removed (delivery; ovulation ends the LH surge).',
    ].map((t) => `<li>${EP.md(t)}</li>`).join('') })));
    el.appendChild(EP.sources(['kovacs1', 'molina1', 'drucker2018']));
  };

  // ------------------------------------------------------------------ secretion patterns
  V.secretion = function (el) {
    el.appendChild(EP.pageHeader('Pulsatile, circadian & clearance', 'Why must GnRH be pulsatile, and why do hormones with short half-lives change so quickly?', { section: 'Endocrine Fundamentals' }));
    // pulsatility demo
    el.appendChild(h('h2', 'Pulsatile vs continuous GnRH'));
    const cv = h('canvas.chart', { width: 1000, height: 260 });
    const mode = { m: 'pulse' };
    const tabs = h('div.tabs', ...[['pulse', 'Pulsatile (physiological)'], ['cont', 'Continuous (agonist)'], ['fast', 'Very fast pulses']].map(([k, l], i) => h('button' + (i ? '' : '.on'), { onclick: (ev) => { mode.m = k; tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === ev.target)); run(); } }, l)));
    el.append(h('div.card', tabs, cv, h('p.small.muted', 'Schematic simulation (receptor desensitization model, arbitrary units). Continuous GnRH produces a brief flare then suppression of LH — the basis of GnRH-agonist therapy (Kovacs Ch5, Ch8).')));
    function run() {
      const ctx = cv.getContext('2d'); const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      const css = getComputedStyle(document.body);
      let R = 1, out = [], g = [];
      for (let i = 0; i < 1000; i++) {
        const t = i / 1000 * 24; // hours
        let G = 0;
        if (mode.m === 'pulse') G = (t % 1.5) < 0.12 ? 1 : 0; else if (mode.m === 'fast') G = (t % 0.35) < 0.12 ? 1 : 0; else G = t > 1 ? 1 : 0;
        R += (0.06 * (1 - R) - 0.35 * G * R) * 0.024 * 10;
        R = EP.clamp(R, 0, 1);
        out.push(G * R); g.push(G);
      }
      const plot = (arr, color, y0, hgt) => { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); arr.forEach((v, i) => { const x = 40 + i / arr.length * (W - 50); const y = y0 + hgt - v * hgt; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); };
      ctx.fillStyle = css.getPropertyValue('--muted'); ctx.font = '12px Inter, sans-serif';
      ctx.fillText('GnRH', 2, 50); ctx.fillText('LH', 2, 180); ctx.fillText('24 h →', W - 60, H - 4);
      plot(g, css.getPropertyValue('--tr4'), 15, 70); plot(out, css.getPropertyValue('--tr0'), 130, 100);
    }
    run();
    // half-life
    el.appendChild(h('h2', 'Clearance: sourced plasma half-lives'));
    const hl = [['Epinephrine', 2, 'Molina Ch6 (<2 min)'], ['Insulin', 5, 'Molina Ch7 (3–8 min)'], ['Glucagon', 7.5, 'Molina Ch7 (5–10 min)'], ['PTH', 4, 'Kovacs Ch14 (<5 min)'], ['Aldosterone', 17.5, 'Molina Ch6 (~15–20 min)'], ['Cortisol', 80, 'Kovacs Ch13 (70–90 min)'], ['T3', 0.75 * 1440, 'Kovacs Ch1 (0.75 day)'], ['T4', 6.7 * 1440, 'Kovacs Ch1 (6.7 days)']];
    const cv2 = h('canvas.chart', { width: 1000, height: 260 });
    const sel = h('div.statebar', hl.map(([n2], i) => h('button.chip' + (i < 6 ? '.on' : ''), { onclick: (ev) => { ev.target.classList.toggle('on'); draw2(); } }, n2)));
    el.append(h('div.card', sel, cv2, h('p.small.muted', 'Fraction remaining after secretion stops (log time axis), computed from the textbook half-lives shown in the legend (midpoints of reported ranges). Short half-lives allow minute-to-minute control; T4\'s long half-life buffers thyroid status for weeks.')));
    function draw2() {
      const ctx = cv2.getContext('2d'); const W = cv2.width, H = cv2.height; ctx.clearRect(0, 0, W, H);
      const css = getComputedStyle(document.body);
      const on = [...sel.querySelectorAll('button')].map((b) => b.classList.contains('on'));
      const tmax = Math.log10(30 * 1440), tmin = Math.log10(0.5);
      ctx.strokeStyle = css.getPropertyValue('--grid'); ctx.fillStyle = css.getPropertyValue('--muted'); ctx.font = '11px Inter, sans-serif';
      [[1, '1 min'], [10, '10 min'], [60, '1 h'], [1440, '1 day'], [10080, '1 wk']].forEach(([m, l]) => { const x = 50 + (Math.log10(m) - tmin) / (tmax - tmin) * (W - 70); ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, H - 20); ctx.stroke(); ctx.fillText(l, x - 12, H - 6); });
      let k = 0;
      hl.forEach(([name, t12, src], i) => {
        if (!on[i]) return;
        const col = css.getPropertyValue('--tr' + (k % 6)); k++;
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath();
        for (let j = 0; j <= 300; j++) { const lt = tmin + (j / 300) * (tmax - tmin); const t = Math.pow(10, lt); const f = Math.pow(0.5, t / t12); const x = 50 + (j / 300) * (W - 70); const y = 10 + (1 - f) * (H - 40); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); ctx.fillStyle = col; ctx.fillText(name + ' — ' + src, W - 300, 20 + k * 14);
      });
    }
    draw2();
    el.appendChild(h('h2', 'Circadian rhythm'));
    el.appendChild(h('p', { html: EP.md('Cortisol peaks around waking and is lowest near midnight, driven by the suprachiasmatic nucleus through CRH/ACTH (Oster 2017). Open the [HPA axis](#/hpa) and tick **Run 24-h circadian clock** to watch the rhythm propagate down the axis and feedback shape it.').replace('[HPA axis](#/hpa)', '<a href="#/hpa">HPA axis</a>') }));
    el.appendChild(EP.sources(['kovacs1', 'kovacs5', 'kovacs8', 'molina6', 'molina7', 'oster2017']));
  };

  // ------------------------------------------------------------------ posterior pituitary
  V.posterior = function (el, params) {
    el.appendChild(EP.pageHeader('Posterior pituitary: ADH & oxytocin', 'How does a 1–2% change in plasma osmolality control urine concentration — and when does volume override it?', { section: 'Hypothalamus & Pituitary' }));
    const api = EP.mountNetwork(el, 'adh');
    if (params.preset) api.choose(params.preset);
    el.appendChild(h('h2', 'In the collecting duct'));
    EP.mountPathway(el, 'adhcd', { height: 380 });
    el.appendChild(h('h2', 'Oxytocin: positive feedback'));
    EP.mountNetwork(el, 'motif_pos');
    el.appendChild(EP.sources(['kovacs6', 'molina2']));
  };

  // ------------------------------------------------------------------ sources page
  V.sourcesPage = function (el) {
    el.appendChild(EP.pageHeader('Sources & model notes', null, { section: 'Explore & Learn' }));
    const R = EP.data.refs;
    el.appendChild(h('div.card', h('h3', 'Primary textbooks'), h('ol', ['kovacs', 'molina', 'petersen2018', 'williams'].map((id) => h('li', { html: EP.refHTML(R[id]) })))));
    el.appendChild(h('div.card', h('h3', 'Peer-reviewed literature (PubMed-verified PMIDs and DOIs)'), h('ol', Object.values(R).filter((r) => r.pmid && r.id !== 'petersen2018').map((r) => h('li', { html: EP.refHTML(r) })))));
    el.appendChild(h('div.card', h('h3', 'How the simulations work — and what they do not claim'), h('ul.keypoints', { html: [
      'All simulators use one engine: each variable\'s target value is a product of its regulators raised to signed exponents (stimulatory > 0, inhibitory < 0). With every input at its reference value every variable equals 1, so all outputs read as **relative to a reference state** (overnight-fasted adult; normal axis).',
      'Exponents encode the **direction and approximate relative strength** of documented regulatory links from the sources. They are not fitted kinetic constants, so outputs are **qualitative**: "↑↑ markedly increased", not "4.2 µmol/kg/min".',
      'Arrow thickness in the flux simulator shows **modelled regulatory drive** on a pathway. A pathway being activated is not the same as it carrying a particular measured flux; where real human numbers are quoted (half-lives, Shulman 1990, Owen 1967) the source is named.',
      'Steady states are found with a damped Newton solver; axis pages integrate first-order dynamics so you can watch the order in which hormones change (time units are arbitrary).',
      'Simplifications are deliberate: e.g. one "hepatic acetyl-CoA" pool, one plasma amino-acid pool, glucagon effects on adipose omitted, menstrual-cycle curves drawn schematically. Where textbooks and newer literature differ (e.g., how much of insulin\'s suppression of gluconeogenesis is indirect via adipose lipolysis; the acute glycogenolytic vs gluconeogenic effect of glucagon), the app presents the modern view and names the source.',
      'Williams Textbook of Endocrinology was requested as a primary source but was not among the uploaded files; the uploaded Molina *Endocrine Physiology* 5e is used as the second primary textbook instead.',
    ].map((t) => `<li>${EP.md(t)}</li>`).join('') })));
  };
})();
