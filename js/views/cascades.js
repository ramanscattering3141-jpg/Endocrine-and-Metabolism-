/* Signaling cascades page + hormone signaling cheat sheet. */
(function () {
  'use strict';
  const EP = window.EP;
  const { h } = EP;
  const V = (EP.views = EP.views || {});

  // receptor class → transducer → messenger → main outputs (Kovacs Ch3; Molina Ch1 and organ chapters)
  const T = (hormone, receptor, transducer, messenger, outputs, page) => ({ hormone, receptor, transducer, messenger, outputs, page });
  EP.data.signalTable = [
    { cls: 'Gs-coupled GPCR (↑ cAMP → PKA, Epac)', rows: [
      T('Glucagon', 'GCGR (liver, kidney)', 'Gs (+ Gq)', 'cAMP; IP₃/Ca²⁺', 'Glycogenolysis, gluconeogenesis, ketogenesis, ureagenesis', 'cascades?c=glucagon'),
      T('Epinephrine (β1, β2, β3)', 'β-adrenergic', 'Gs', 'cAMP', 'Heart rate/force, glycogenolysis, lipolysis, bronchodilation', 'cascades?c=epinephrine'),
      T('ACTH', 'MC2R (+ MRAP)', 'Gs', 'cAMP', 'StAR, steroidogenic enzymes, adrenal growth', 'steroidogenesis'),
      T('TSH', 'TSHR', 'Gs (+ Gq)', 'cAMP; Ca²⁺/DAG', 'NIS, Tg, TPO, endocytosis, growth', 'cascades?c=tsh'),
      T('LH / hCG, FSH', 'LHCGR, FSHR', 'Gs', 'cAMP', 'Steroidogenesis (StAR), aromatase (FSH), spermatogenesis support', 'cascades?c=lh'),
      T('PTH / PTHrP', 'PTH1R', 'Gs (+ Gq)', 'cAMP; Ca²⁺/PKC', 'Phosphaturia, CYP27B1, Ca²⁺ reabsorption, RANKL', 'cascades?c=pth'),
      T('ADH (V2)', 'V2 receptor', 'Gs', 'cAMP', 'AQP2 insertion and transcription', 'cascades?c=adh'),
      T('CRH, GHRH', 'CRHR1, GHRHR', 'Gs', 'cAMP', 'ACTH / GH release and synthesis', 'pitmap'),
      T('GLP-1, GIP', 'GLP-1R, GIPR', 'Gs', 'cAMP → PKA, Epac2', 'Glucose-dependent amplification of insulin secretion', 'betacell'),
      T('Calcitonin', 'CTR', 'Gs (+ Gq)', 'cAMP', 'Osteoclast inhibition', 'calcium'),
    ] },
    { cls: 'Gi-coupled GPCR (↓ cAMP; Gβγ → K⁺ channels)', rows: [
      T('Somatostatin', 'SSTR1–5', 'Gi', '↓ cAMP; K⁺ and Ca²⁺ channel effects', 'Inhibits GH, TSH, insulin, glucagon, gut hormones', 'pitmap'),
      T('Dopamine (D2)', 'D2', 'Gi', '↓ cAMP', 'Inhibits prolactin (and TSH)', 'prl'),
      T('Epinephrine (α2)', 'α2-adrenergic', 'Gi', '↓ cAMP; Gβγ → K⁺', 'Inhibits insulin and presynaptic NE release', 'cascades?c=epinephrine'),
    ] },
    { cls: 'Gq-coupled GPCR (PLC → IP₃/Ca²⁺ + DAG/PKC)', rows: [
      T('GnRH', 'GnRHR', 'Gq', 'IP₃/Ca²⁺, DAG/PKC', 'LH/FSH release and synthesis; desensitized by continuous agonist', 'cascades?c=gnrh'),
      T('TRH', 'TRHR', 'Gq', 'IP₃/Ca²⁺', 'TSH (and prolactin) release', 'hpt'),
      T('ADH (V1a, V1b), oxytocin', 'V1a, V1b, OTR', 'Gq', 'IP₃/Ca²⁺', 'Vasoconstriction, ACTH release, uterine contraction, milk ejection', 'cascades?c=adh'),
      T('Angiotensin II', 'AT1', 'Gq', 'IP₃/Ca²⁺, DAG/PKC', 'Aldosterone synthesis, vasoconstriction, thirst', 'raas'),
      T('Epinephrine (α1)', 'α1-adrenergic', 'Gq', 'IP₃/Ca²⁺', 'Vasoconstriction, hepatic glycogenolysis', 'cascades?c=epinephrine'),
      T('Ca²⁺ (CaSR)', 'Calcium-sensing receptor', 'Gq (+ Gi)', 'IP₃/Ca²⁺', '↓ PTH secretion; ↓ renal Ca²⁺ reabsorption', 'calcium'),
    ] },
    { cls: 'Receptor tyrosine kinases', rows: [
      T('Insulin', 'INSR (α₂β₂)', 'Intrinsic tyrosine kinase', 'IRS → PI3K/PIP₃; Shc → Ras', 'GLUT4, glycogen, antilipolysis, mTORC1 anabolism, MAPK growth', 'cascades?c=insulin'),
      T('IGF-1', 'IGF1R', 'Intrinsic tyrosine kinase', 'IRS → PI3K; Shc → Ras', 'Growth, proliferation, protein synthesis', 'gh'),
    ] },
    { cls: 'Cytokine-type receptors (JAK–STAT)', rows: [
      T('Growth hormone', 'GHR (preformed dimer)', 'JAK2', 'STAT5 (+ MAPK, PI3K)', 'IGF-1, ALS, IGFBP-3; lipolysis; insulin antagonism', 'cascades?c=gh'),
      T('Prolactin', 'PRLR', 'JAK2', 'STAT5', 'Milk proteins, mammary development', 'prl'),
      T('Leptin', 'LRb', 'JAK2', 'STAT3', 'POMC ↑, AgRP ↓ → satiety; permissive for GnRH', 'cascades?c=leptin'),
    ] },
    { cls: 'Receptor guanylyl cyclases', rows: [
      T('ANP, BNP', 'NPR-A', 'Intrinsic guanylyl cyclase', 'cGMP → PKG', 'Natriuresis, vasodilation, ⊣ renin and aldosterone', 'cascades?c=anp'),
    ] },
    { cls: 'Nuclear receptors (ligand-activated transcription factors)', rows: [
      T('Cortisol', 'GR (cytosolic, HSP90)', '—', 'GRE transactivation; NF-κB/AP-1 transrepression', 'Gluconeogenesis, proteolysis, anti-inflammation, feedback', 'cascades?c=cortisol'),
      T('Aldosterone', 'MR', '—', 'SGK1 → ⊣ Nedd4-2 → ENaC', 'Na⁺ reabsorption, K⁺ and H⁺ secretion', 'cascades?c=aldo'),
      T('T3', 'TRα/β with RXR (nuclear)', '—', 'TRE', 'Metabolic rate, heart, brain development, growth', 'cascades?c=t3'),
      T('Testosterone / DHT', 'AR', '—', 'ARE', 'Male differentiation, muscle, hair, spermatogenesis', 'testis'),
      T('Estradiol', 'ERα/β', '—', 'ERE (+ non-genomic)', 'Female development, LH surge, bone, TBG/CBG/SHBG', 'ovary'),
      T('Progesterone', 'PR', '—', 'PRE', 'Secretory endometrium, pregnancy maintenance', 'ovary'),
      T('1,25-(OH)₂D', 'VDR with RXR', '—', 'VDRE', 'TRPV6, calbindin, RANKL, FGF23, CYP24A1', 'calcium'),
    ] },
  ];

  V.cascades = function (el, params) {
    el.appendChild(EP.pageHeader('Signaling cascades', 'From receptor to result: which branch of a hormone\'s signaling network produces which effect — and how fast?', {
      section: 'Endocrine Fundamentals',
      lede: 'Each map runs left to right: **receptor → transducer → messenger → kinase → effector → result**. Coloured bands are **branches** (for insulin: PI3K–Akt, mTORC1 and Ras–MAPK). Raise or lower the hormone, or pick a disease, drug or mutation to see which outputs change. Time tags show whether an effect appears in seconds, minutes, hours or days.' }));
    const list = EP.cascadeOrder;
    const tabs = h('div.statebar', list.map(([id, l]) => h('button.chip', { 'data-id': id, onclick: () => show(id) }, l)));
    const slot = h('div'); let cur = null;
    el.append(tabs, slot);
    function show(id) {
      tabs.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
      if (cur) cur.stop();
      EP.clear(slot);
      slot.appendChild(h('h2', EP.cascades[id].title));
      cur = EP.mountCascade(slot, id, { knock: params.knock, sources: true });
      params.knock = null;
      try { history.replaceState(null, '', '#/cascades?c=' + id); } catch (e) { /* file:// */ }
    }
    show(params.c && EP.cascades[params.c] ? params.c : 'insulin');
    // cheat sheet
    const tbl = h('div.card', h('h2', 'Cheat sheet: how each hormone signals'), h('p.muted.small', 'Receptor class predicts speed and mechanism: GPCRs and kinases act in seconds to minutes; nuclear receptors act through transcription over hours (Kovacs Ch3; Molina Ch1).'));
    EP.data.signalTable.forEach((g) => {
      tbl.appendChild(h('h4', g.cls));
      const t = h('table.cmp-table.sig-table', h('tr', h('th', 'Hormone'), h('th', 'Receptor'), h('th', 'Transducer'), h('th', 'Messenger'), h('th', 'Main outputs')));
      g.rows.forEach((r) => t.appendChild(h('tr', h('td', r.page ? h('a', { href: '#/' + r.page }, r.hormone) : r.hormone), h('td', r.receptor), h('td', r.transducer), h('td', r.messenger), h('td.small', r.outputs))));
      tbl.appendChild(t);
    });
    el.appendChild(tbl);
    el.appendChild(h('div.card', { html: EP.md('**Disorders of signal transduction** (Kovacs Ch3): **McCune–Albright** — activating Gαs (Arg201) causes hormone-independent cAMP in endocrine glands (precocious puberty, hyperthyroidism, acromegaly, Cushing). **Pseudohypoparathyroidism 1a** — ~50% Gαs activity causes resistance to PTH, TSH and gonadotropins. **Graves disease** — TSH-receptor-stimulating antibodies. **Androgen resistance** — AR mutations. **Down-regulation** — chronic hyperinsulinemia lowers insulin receptor number; chronic β-agonists desensitize β-receptors. Try each one with the "Cell / disorder / drug" menu.').replace(/^<p>|<\/p>$/g, '') }));
  };
})();
