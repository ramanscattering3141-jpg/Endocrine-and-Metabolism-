/* Signaling fundamentals and gland-level pathways. */
(function () {
  const P = window.EP.pathways;
  const n = (id, x, y, o) => Object.assign({ id, x, y }, o || {});
  const e = (from, to, type, o) => Object.assign({ from, to, type: type || 'stim' }, o || {});
  const cell = (label) => [
    { x: 10, y: 10, w: 880, h: 80, label: 'Extracellular fluid', kind: 'blood' },
    { x: 10, y: 98, w: 880, h: 42, label: 'Plasma membrane', kind: 'membrane' },
    { x: 10, y: 148, w: 880, h: 432, label: label || 'Cytosol', kind: 'cytosol' },
  ];

  // ---------------- receptor classes ----------------
  P.gs = {
    id: 'gs', title: 'Gs-coupled GPCR → cAMP → PKA', view: { w: 900, h: 590 }, compartments: cell(),
    inputs: [{ node: 'hormone', label: 'Hormone (e.g., glucagon, ACTH, TSH, LH)', value: 1 }],
    nodes: [n('hormone', 160, 50, { ent: 'glucagon', label: 'Hormone' }), n('gpcr', 160, 118), n('gs', 330, 190), n('ac', 500, 118), n('camp', 500, 260), n('pka', 500, 360), n('creb', 300, 470), n('targets', 700, 360, { type: 'process', label: 'Phosphorylated targets\n(enzymes, channels)', ent: 'pka', w: 190, h: 44 }), n('genes', 300, 545, { type: 'gene', ent: 'hre', label: 'CRE-driven genes' }), n('pde', 700, 260, { ent: 'pde3b', label: 'Phosphodiesterase', lv: 2 }), n('grk', 330, 50, { lv: 3 })],
    edges: [e('hormone', 'gpcr', 'bind'), e('gpcr', 'gs', 'stim', { why: 'Receptor catalyses GDP→GTP exchange on Gαs; αs-GTP dissociates from βγ.' }), e('gs', 'ac', 'stim'), e('ac', 'camp', 'rxn', { label: 'ATP → cAMP', why: '**Amplification:** one receptor activates many G proteins; each cyclase makes many cAMP.' }), e('camp', 'pka', 'stim', { why: 'cAMP binds PKA regulatory subunits, releasing catalytic subunits.' }), e('pka', 'targets', 'stim'), e('pka', 'creb', 'stim', { why: 'Catalytic subunits enter the nucleus and phosphorylate CREB.' }), e('creb', 'genes', 'stim'), e('pde', 'camp', 'inhib', { lv: 2, why: 'Termination: phosphodiesterases degrade cAMP.' }), e('grk', 'gpcr', 'inhib', { lv: 3, why: '**Desensitization:** GRKs phosphorylate the occupied receptor, β-arrestin uncouples it and promotes internalization (down-regulation with prolonged exposure).' })],
    steps: [{ n: ['hormone', 'gpcr', 'gs'], t: 'Hormone binding → Gαs exchanges GDP for GTP.' }, { n: ['gs', 'ac', 'camp'], t: 'Gαs-GTP activates adenylyl cyclase → cAMP (amplification).' }, { n: ['camp', 'pka', 'targets'], t: 'cAMP activates PKA → rapid phosphorylation of enzymes/channels.' }, { n: ['pka', 'creb', 'genes'], t: 'Slower: PKA → CREB → gene transcription.' }, { n: ['pde', 'grk', 'gpcr', 'camp'], t: 'Termination and desensitization: PDEs, GTPase activity of Gα, GRK/β-arrestin.' }],
    refs: ['kovacs3', 'molina1'],
  };
  P.gi = {
    id: 'gi', title: 'Gi-coupled GPCR → ↓ cAMP', view: { w: 900, h: 590 }, compartments: cell(),
    inputs: [{ node: 'hormone', label: 'Inhibitory ligand (somatostatin, dopamine D2, α2)', value: 1 }, { node: 'stimulus', label: 'Gs stimulus present', value: 1 }],
    nodes: [n('hormone', 160, 50, { ent: 'somatostatin', label: 'Ligand' }), n('gpcr', 160, 118), n('gi', 330, 200), n('ac', 500, 118), n('stimulus', 680, 50, { ent: 'gs', label: 'Gs input', type: 'kinase' }), n('camp', 500, 280), n('pka', 500, 370), n('kch', 160, 300, { type: 'channel', ent: 'katp', label: 'K⁺ channel (GIRK)' }), n('hyper', 160, 400, { type: 'process', ent: 'exocytosis', label: 'Hyperpolarization → ↓ secretion', w: 210 }), n('secretion', 500, 480, { type: 'process', ent: 'exocytosis', label: '↓ Hormone secretion' })],
    edges: [e('hormone', 'gpcr', 'bind'), e('gpcr', 'gi', 'stim'), e('gi', 'ac', 'inhib', { why: 'Gαi inhibits adenylyl cyclase.' }), e('stimulus', 'ac', 'stim'), e('ac', 'camp', 'rxn'), e('camp', 'pka', 'stim'), e('pka', 'secretion', 'stim'), e('gi', 'kch', 'stim', { why: 'Gβγ opens GIRK K⁺ channels.' }), e('kch', 'hyper', 'stim')],
    refs: ['kovacs3'],
  };
  P.gq = {
    id: 'gq', title: 'Gq-coupled GPCR → PLC → IP3/Ca²⁺ + DAG/PKC', view: { w: 900, h: 590 }, compartments: cell(),
    inputs: [{ node: 'hormone', label: 'Hormone (TRH, GnRH, angiotensin II, ADH-V1, oxytocin)', value: 1 }],
    nodes: [n('hormone', 160, 50, { ent: 'angii', label: 'Hormone' }), n('gpcr', 160, 118), n('gq', 330, 200), n('plc', 500, 118), n('pip2', 700, 118), n('ip3', 600, 280), n('dag', 780, 280), n('er', 600, 390, { type: 'process', ent: 'ip3', label: 'ER IP₃ receptor → Ca²⁺ release', w: 210 }), n('ca', 420, 470), n('pkc', 780, 400), n('response', 600, 540, { type: 'process', ent: 'exocytosis', label: 'Secretion, contraction, gene expression', w: 260 })],
    edges: [e('hormone', 'gpcr', 'bind'), e('gpcr', 'gq', 'stim'), e('gq', 'plc', 'stim'), e('pip2', 'plc', 'rxn'), e('plc', 'ip3', 'rxn', { why: 'PLCβ cleaves PIP₂ into IP₃ (soluble) and DAG (membrane).' }), e('plc', 'dag', 'rxn'), e('ip3', 'er', 'stim'), e('er', 'ca', 'transport'), e('dag', 'pkc', 'stim'), e('ca', 'pkc', 'stim'), e('ca', 'response', 'stim'), e('pkc', 'response', 'stim')],
    refs: ['kovacs3'],
  };
  P.jakstat = {
    id: 'jakstat', title: 'Cytokine-type receptor → JAK2–STAT5 (GH, prolactin, leptin)', view: { w: 900, h: 590 }, compartments: cell('Cytosol / nucleus'),
    inputs: [{ node: 'gh', label: 'GH (or prolactin)', value: 1 }],
    nodes: [n('gh', 220, 50), n('ghr', 220, 118), n('jak2', 420, 190), n('stat5', 420, 300), n('igf1', 700, 470, { label: 'IGF-1, ALS, IGFBP-3 genes', type: 'gene', ent: 'igf1', w: 190 }), n('socs', 700, 300, { lv: 2 }), n('mapk', 220, 300, { lv: 3 })],
    edges: [e('gh', 'ghr', 'bind', { why: 'GH binds a preformed receptor dimer, causing a rotation that brings associated JAK2 molecules together.' }), e('ghr', 'jak2', 'stim', { why: 'JAK2s trans-phosphorylate each other and receptor tyrosines.' }), e('jak2', 'stat5', 'stim', { why: 'STAT5 docks on phospho-receptor, is phosphorylated, dimerizes and enters the nucleus.' }), e('stat5', 'igf1', 'stim'), e('stat5', 'socs', 'stim', { lv: 2 }), e('socs', 'jak2', 'inhib', { lv: 2, why: 'SOCS proteins provide intracellular negative feedback.' }), e('jak2', 'mapk', 'stim', { lv: 3 })],
    refs: ['kovacs3', 'kovacs11'],
  };
  P.rtk = {
    id: 'rtk', title: 'Receptor tyrosine kinase (insulin / IGF-1)', view: { w: 900, h: 590 }, compartments: cell(),
    inputs: [{ node: 'insulin', label: 'Ligand', value: 1 }],
    nodes: [n('insulin', 220, 50), n('ir', 220, 118), n('irs', 220, 230), n('pi3k', 220, 330), n('akt', 220, 450), n('metab', 420, 520, { type: 'process', ent: 'akt', label: 'Metabolic actions', w: 160 }), n('mapk', 600, 330), n('growth', 600, 450, { type: 'process', ent: 'mapk', label: 'Growth / mitogenesis', w: 170 })],
    edges: [e('insulin', 'ir', 'bind'), e('ir', 'irs', 'stim', { why: 'Autophosphorylated receptor phosphorylates IRS.' }), e('irs', 'pi3k', 'stim'), e('pi3k', 'akt', 'stim'), e('akt', 'metab', 'stim'), e('irs', 'mapk', 'stim'), e('mapk', 'growth', 'stim')],
    refs: ['kovacs3', 'petersen2018'],
  };
  P.nuclear = {
    id: 'nuclear', title: 'Nuclear receptors: steroids (cytosolic GR) and thyroid hormone (nuclear TR)', view: { w: 900, h: 590 },
    compartments: [{ x: 10, y: 10, w: 880, h: 80, label: 'Plasma (bound to CBG / TBG)', kind: 'blood' }, { x: 10, y: 98, w: 880, h: 42, label: 'Plasma membrane (lipophilic hormones diffuse; T4/T3 use MCT8)', kind: 'membrane' }, { x: 10, y: 148, w: 880, h: 220, label: 'Cytosol', kind: 'cytosol' }, { x: 10, y: 376, w: 880, h: 204, label: 'Nucleus', kind: 'nucleus' }],
    inputs: [{ node: 'cortisol', label: 'Cortisol', value: 1 }, { node: 't3', label: 'T3', value: 1 }],
    nodes: [n('cortisol', 200, 50), n('gr', 200, 200), n('hsp90', 380, 200), n('dimer', 200, 300, { type: 'complex', ent: 'gr', label: 'GR dimer' }), n('hre', 200, 450, { label: 'GRE' }), n('transcription', 450, 540, { label: 'mRNA → protein (hours)', w: 200 }), n('t4', 640, 50), n('mct8', 640, 118), n('d2', 640, 220), n('t3', 780, 220), n('tr', 700, 450), n('nfkb', 380, 450, { lv: 3, ent: 'gr', label: 'Tethering: ⊣ NF-κB / AP-1', type: 'tf', w: 170 })],
    edges: [e('cortisol', 'gr', 'transport', { why: 'Free cortisol diffuses into the cell.' }), e('hsp90', 'gr', 'bind', { why: 'Unliganded GR is held by HSP90 chaperones.' }), e('gr', 'dimer', 'stim', { why: 'Ligand binding releases chaperones; GR dimerizes and translocates to the nucleus.' }), e('dimer', 'hre', 'bind'), e('hre', 'transcription', 'stim'), e('dimer', 'nfkb', 'inhib', { lv: 3, why: 'Transrepression: GR tethers to and inhibits pro-inflammatory transcription factors.' }), e('t4', 'mct8', 'transport'), e('mct8', 'd2', 'transport'), e('d2', 't3', 'rxn', { label: 'T4 → T3' }), e('t3', 'tr', 'bind', { why: 'TR/RXR is already on the TRE; T3 swaps corepressors for coactivators.' }), e('tr', 'transcription', 'stim')],
    refs: ['kovacs3', 'brent2012'],
  };

  // ---------------- thyroid ----------------
  P.thyroid = {
    id: 'thyroid', title: 'Thyroid follicular cell: from iodide to T4/T3', view: { w: 1200, h: 640 },
    compartments: [
      { x: 10, y: 10, w: 190, h: 620, label: 'Blood (basolateral)', kind: 'blood' },
      { x: 210, y: 10, w: 34, h: 620, label: '', kind: 'membrane' },
      { x: 250, y: 10, w: 640, h: 620, label: 'Thyrocyte', kind: 'cytosol' },
      { x: 896, y: 10, w: 34, h: 620, label: '', kind: 'membrane' },
      { x: 936, y: 10, w: 254, h: 620, label: 'Colloid (follicle lumen)', kind: 'mito' },
    ],
    inputs: [{ node: 'tsh', label: 'TSH', value: 1 }, { node: 'iodide', label: 'Iodide supply', value: 1 }],
    nodes: [
      n('tsh', 100, 60), n('tshr', 227, 60, { w: 90 }), n('camp', 400, 60),
      n('iodide', 100, 170), n('nis', 227, 170, { w: 70 }), n('i_cell', 430, 170, { ent: 'iodide', label: 'I⁻ (intracellular)' }), n('pendrin', 913, 170, { w: 80 }),
      n('i_colloid', 1060, 170, { ent: 'iodide', label: 'I⁻' }), n('duox', 913, 250, { w: 70 }), n('h2o2', 1060, 250), n('tpo', 913, 330, { w: 70 }),
      n('tg_thy', 650, 330, { label: 'Thyroglobulin synthesis' }), n('mitdit', 1060, 330, { label: 'Organification:\nMIT/DIT on Tg', type: 'process', w: 170, h: 40 }),
      n('coupling', 1060, 410, { type: 'process', ent: 'tpo', label: 'Coupling → T4, T3 on Tg', w: 200 }),
      n('colloidstore', 1060, 500, { type: 'process', ent: 'tg_thy', label: 'Stored in colloid (weeks)', w: 200 }),
      n('endocytosis', 650, 500, { type: 'process', ent: 'tg_thy', label: 'Tg endocytosis → lysosomal proteolysis', w: 260 }),
      n('dehal', 430, 420, { lv: 3, type: 'enzyme', ent: 'mitdit', label: 'DEHAL1 (iodide recycling)', w: 170 }),
      n('mct8', 227, 520, { w: 70 }), n('t4', 100, 470), n('t3', 100, 570),
      n('methimazole', 790, 410, { lv: 4, label: 'Thionamides', w: 110 }), n('perchlorate', 227, 260, { lv: 4, w: 100 }),
    ],
    edges: [
      e('tsh', 'tshr', 'bind'), e('tshr', 'camp', 'stim', { why: 'TSH-R → Gs → cAMP (also Gq) stimulates virtually every step and thyrocyte growth.' }),
      e('camp', 'nis', 'stim', { lv: 2, curve: -30 }), e('camp', 'tg_thy', 'stim', { lv: 2 }), e('camp', 'endocytosis', 'stim', { lv: 2, via: [[560, 120], [560, 460]] }),
      e('iodide', 'nis', 'transport'), e('nis', 'i_cell', 'transport', { why: 'NIS uses the Na⁺ gradient (2 Na⁺ : 1 I⁻) to concentrate iodide 20–40×.' }),
      e('i_cell', 'pendrin', 'transport'), e('pendrin', 'i_colloid', 'transport', { why: 'Pendrin exports I⁻ apically.' }),
      e('duox', 'h2o2', 'rxn'), e('h2o2', 'tpo', 'stim', { why: 'TPO requires H₂O₂.' }),
      e('i_colloid', 'mitdit', 'rxn'), e('tpo', 'mitdit', 'stim', { why: 'TPO oxidizes iodide and iodinates tyrosyl residues on Tg (organification).' }),
      e('tg_thy', 'mitdit', 'transport', { via: [[800, 290], [960, 330]], why: 'Tg is secreted into the colloid by exocytosis.' }),
      e('mitdit', 'coupling', 'rxn'), e('tpo', 'coupling', 'stim', { why: 'TPO couples DIT+DIT → T4 and MIT+DIT → T3.' }),
      e('coupling', 'colloidstore', 'rxn'), e('colloidstore', 'endocytosis', 'transport'),
      e('endocytosis', 'mct8', 'transport', { why: 'Lysosomal proteases liberate T4 (mostly) and T3; MCT8 exports them.' }),
      e('endocytosis', 'dehal', 'rxn', { lv: 3, why: 'Free MIT/DIT are deiodinated; iodide re-used.' }), e('dehal', 'i_cell', 'transport', { lv: 3 }),
      e('mct8', 't4', 'transport'), e('mct8', 't3', 'transport'),
      e('methimazole', 'tpo', 'inhib', { lv: 4 }), e('perchlorate', 'nis', 'inhib', { lv: 4 }),
    ],
    steps: [
      { n: ['iodide', 'nis', 'i_cell'], t: '**Trapping:** NIS concentrates iodide (TSH-stimulated).' },
      { n: ['i_cell', 'pendrin', 'i_colloid'], t: '**Apical efflux** via pendrin.' },
      { n: ['duox', 'h2o2', 'tpo', 'mitdit', 'tg_thy'], t: '**Organification:** TPO + H₂O₂ iodinate thyroglobulin tyrosines → MIT/DIT.' },
      { n: ['mitdit', 'coupling', 'tpo'], t: '**Coupling:** DIT+DIT → T4; MIT+DIT → T3 (still attached to Tg).' },
      { n: ['coupling', 'colloidstore'], t: '**Storage** in colloid — weeks of hormone.' },
      { n: ['colloidstore', 'endocytosis', 'mct8', 't4', 't3', 'tsh', 'tshr', 'camp'], t: '**Release:** TSH → endocytosis of Tg → lysosomal proteolysis → T4 ≫ T3 secreted.' },
    ],
    clinical: [
      { id: 'iod', label: 'Iodine deficiency', inputs: { iodide: 0.2 }, desc: 'Less substrate → less hormone → TSH rises → goiter.', chain: ['↓ iodide', '↓ T4', '↑ TSH', 'goiter'] },
      { id: 'thion', label: 'Thionamide therapy', caps: { tpo: 0.15 }, desc: 'Methimazole/PTU block TPO; stored colloid hormone delays the clinical effect.', chain: ['⊣ TPO', '↓ organification/coupling', '↓ new T4/T3'] },
      { id: 'graves', label: 'Graves disease', inputs: { tsh: 3 }, desc: 'TSI mimics TSH at TSH-R (shown here as high receptor stimulation).', chain: ['TSI → TSH-R', '↑ all steps', '↑ T4/T3'] },
    ],
    refs: ['kovacs12', 'molina4', 'bianco2002'],
  };
  P.thyroidaction = {
    id: 'thyroidaction', title: 'Thyroid hormone activation and action in target cells', view: { w: 1100, h: 520 },
    compartments: [{ x: 10, y: 10, w: 1080, h: 90, label: 'Plasma (T4 ≫ T3, >99% protein bound)', kind: 'blood' }, { x: 10, y: 108, w: 1080, h: 404, label: 'Target cell', kind: 'cytosol' }],
    inputs: [{ node: 't4', label: 'Free T4', value: 1 }],
    nodes: [n('tbg', 120, 55), n('t4', 340, 55), n('mct8', 340, 150), n('d2', 220, 240), n('d3', 460, 240), n('t3', 220, 330), n('rt3', 460, 330), n('tr', 220, 430), n('effects', 640, 430, { type: 'process', ent: 't3', label: '↑ Na⁺/K⁺-ATPase, BMR, thermogenesis, β1-receptors, LDL-R, gluconeogenesis', w: 420, h: 44 }), n('d1', 700, 240, { lv: 2 }), n('t3p', 700, 55, { ent: 't3', label: 'Plasma T3' })],
    edges: [e('tbg', 't4', 'bind', { why: 'Binding proteins buffer free hormone.' }), e('t4', 'mct8', 'transport'), e('mct8', 'd2', 'rxn'), e('mct8', 'd3', 'rxn'), e('d2', 't3', 'rxn', { label: 'outer-ring', why: 'D2 activates T4 → T3 inside the cell.' }), e('d3', 'rt3', 'rxn', { label: 'inner-ring', why: 'D3 inactivates T4 → rT3.' }), e('t3', 'tr', 'bind'), e('tr', 'effects', 'stim'), e('d1', 't3p', 'rxn', { lv: 2, why: 'Liver/kidney D1 contributes to plasma T3; PTU inhibits D1.' }), e('t4', 'd1', 'rxn', { lv: 2 })],
    refs: ['bianco2002', 'brent2012', 'kovacs12'],
  };

  // ---------------- adrenal medulla ----------------
  P.catecholamine = {
    id: 'catecholamine', title: 'Adrenal medulla: catecholamine synthesis, release and receptors', view: { w: 1150, h: 600 },
    compartments: [{ x: 10, y: 10, w: 640, h: 580, label: 'Chromaffin cell', kind: 'cytosol' }, { x: 380, y: 140, w: 250, h: 300, label: 'Secretory granule', kind: 'mito' }, { x: 665, y: 10, w: 475, h: 580, label: 'Targets', kind: 'blood' }],
    inputs: [{ node: 'sympathetic', label: 'Sympathetic (preganglionic) firing', value: 1 }, { node: 'cortisol', label: 'Intra-adrenal cortisol', value: 1 }],
    nodes: [n('sympathetic', 120, 50, { ent: 'norepinephrine', type: 'process', label: 'Splanchnic nerve (ACh → nicotinic)', w: 220 }), n('tyrosine', 120, 140), n('th', 120, 210), n('ldopa', 120, 280), n('aadc', 120, 350), n('dopamine', 260, 420), n('dbh', 500, 200), n('norepinephrine', 500, 290), n('pnmt', 250, 520), n('epinephrine', 500, 520), n('cortisol', 120, 520), n('exocytosis', 500, 390, { label: 'Ca²⁺-triggered exocytosis' }),
      n('b2ar', 800, 100, { label: 'β2 (Gs): glycogenolysis, bronchodilation' , w: 220}), n('b3ar', 800, 200, { label: 'β1/β3: lipolysis, ↑ HR', w: 170 }), n('a2ar', 800, 300, { label: 'α2 (Gi): ↓ insulin', w: 160 }), n('a1', 800, 400, { ent: 'gq', label: 'α1 (Gq): vasoconstriction', type: 'receptor', w: 200 }), n('comt', 1030, 520, { label: 'COMT/MAO → metanephrines' , w: 190})],
    edges: [e('sympathetic', 'th', 'stim', { why: 'Nerve activity acutely activates TH (phosphorylation) and induces it chronically.' }), e('tyrosine', 'th', 'rxn'), e('th', 'ldopa', 'rxn', { why: 'Rate-limiting step.' }), e('ldopa', 'aadc', 'rxn'), e('aadc', 'dopamine', 'rxn'), e('dopamine', 'dbh', 'transport', { why: 'VMAT moves dopamine into granules.' }), e('dbh', 'norepinephrine', 'rxn'), e('norepinephrine', 'pnmt', 'transport', { via: [[340, 290], [250, 460]], why: 'NE leaves the granule to be methylated in the cytosol.' }), e('pnmt', 'epinephrine', 'rxn'), e('cortisol', 'pnmt', 'stim', { why: 'Cortisol arriving via intra-adrenal portal blood induces PNMT — why the medulla makes epinephrine.' }), e('epinephrine', 'exocytosis', 'transport'), e('norepinephrine', 'exocytosis', 'transport'), e('sympathetic', 'exocytosis', 'stim', { via: [[640, 50], [640, 390]], why: 'ACh → nicotinic receptors → depolarization → Ca²⁺ entry → exocytosis.' }), e('exocytosis', 'b2ar', 'endo'), e('exocytosis', 'b3ar', 'endo'), e('exocytosis', 'a2ar', 'endo'), e('exocytosis', 'a1', 'endo'), e('exocytosis', 'comt', 'rxn', { via: [[650, 520]], why: 't½ <2 min; metabolized by COMT/MAO.' })],
    refs: ['molina6', 'kovacs13'],
  };

  // ---------------- glucocorticoid actions (multi-organ) ----------------
  P.cortisolaction = {
    id: 'cortisolaction', title: 'Cortisol: where it goes and what it does', view: { w: 1100, h: 560 },
    inputs: [{ node: 'cortisol', label: 'Cortisol', value: 1 }],
    nodes: [n('cortisol', 550, 280, { w: 130, h: 46 }), n('brain', 550, 70, { label: 'Brain: ⊣ CRH/ACTH (feedback), mood, appetite' , w: 300}), n('liver', 200, 160, { label: 'Liver: ↑ PEPCK/G6Pase → gluconeogenesis', w: 290 }), n('muscle', 200, 300, { label: 'Muscle: ↑ proteolysis (AA for GNG), ↓ glucose uptake', w: 320 }), n('adipose', 200, 440, { label: 'Adipose: permissive lipolysis; central fat redistribution', w: 330 }), n('immune', 900, 160, { label: 'Immune: ⊣ NF-κB, ↓ cytokines, ↓ eosinophils/lymphocytes', w: 330 }), n('kidneyv', 900, 300, { ent: 'hsd11b2', label: 'Kidney: 11β-HSD2 inactivates cortisol (protects MR)', w: 330 }), n('medulla', 900, 440, { label: 'Adrenal medulla: ↑ PNMT → epinephrine', w: 270 }), n('bone', 550, 500, { label: 'Bone: ↓ osteoblasts, ↑ RANKL', w: 230 })],
    edges: ['brain', 'liver', 'muscle', 'adipose', 'immune', 'kidneyv', 'medulla', 'bone'].map((t) => e('cortisol', t, t === 'kidneyv' || t === 'immune' || t === 'bone' ? 'stim' : 'endo', { why: 'Cortisol diffuses into cells and acts via the glucocorticoid receptor (and MR where unprotected).' })),
    refs: ['kovacs13', 'molina6', 'oster2017'],
  };

  // ---------------- bone remodeling ----------------
  P.bone = {
    id: 'bone', title: 'Bone remodeling: RANK / RANKL / OPG', view: { w: 1100, h: 560 },
    compartments: [{ x: 10, y: 10, w: 1080, h: 120, label: 'Hormonal inputs', kind: 'blood' }, { x: 10, y: 140, w: 520, h: 410, label: 'Osteoblast lineage / osteocyte', kind: 'cytosol' }, { x: 545, y: 140, w: 545, h: 410, label: 'Osteoclast lineage', kind: 'mito' }],
    inputs: [{ node: 'pth', label: 'PTH (continuous)', value: 1 }, { node: 'estradiol', label: 'Estrogen', value: 1 }, { node: 'calcitriol', label: 'Calcitriol', value: 1 }, { node: 'cortisol', label: 'Glucocorticoid', value: 1 }],
    nodes: [n('pth', 120, 60), n('calcitriol', 330, 60), n('estradiol', 560, 60), n('cortisol', 780, 60), n('calcitonin', 980, 60, { lv: 2 }), n('pth1r', 120, 190), n('osteoblast', 270, 270, { w: 180 }), n('rankl', 270, 370), n('opg', 450, 450), n('rank', 650, 370), n('mcsf', 650, 470, { lv: 2 }), n('osteoclastogenesis', 830, 300, { w: 180 }), n('boneresorp', 830, 420), n('boneform', 120, 450), n('sclerostin', 120, 340, { lv: 3 }), n('denosumab', 450, 370, { lv: 4, w: 110 })],
    edges: [e('pth', 'pth1r', 'bind'), e('pth1r', 'osteoblast', 'stim'), e('osteoblast', 'rankl', 'stim', { why: 'Continuous PTH raises RANKL and lowers OPG on osteoblast-lineage cells.' }), e('pth1r', 'opg', 'inhib', { via: [[450, 190]] }), e('calcitriol', 'rankl', 'stim', { via: [[330, 300]] }), e('estradiol', 'rankl', 'inhib', { via: [[560, 160], [380, 330]], why: 'Estrogen suppresses RANKL and osteoclast lifespan; its loss after menopause accelerates resorption.' }), e('estradiol', 'opg', 'stim'), e('cortisol', 'rankl', 'stim', { via: [[780, 200], [380, 360]] }), e('cortisol', 'boneform', 'inhib', { via: [[20, 100], [20, 450]], why: 'Glucocorticoids suppress osteoblast formation — glucocorticoid-induced osteoporosis.' }), e('rankl', 'rank', 'bind'), e('opg', 'rankl', 'inhib', { why: 'OPG is a decoy receptor that sequesters RANKL.' }), e('rank', 'osteoclastogenesis', 'stim'), e('mcsf', 'osteoclastogenesis', 'stim', { lv: 2 }), e('osteoclastogenesis', 'boneresorp', 'stim'), e('calcitonin', 'boneresorp', 'inhib', { lv: 2, via: [[980, 420]] }), e('osteoblast', 'boneform', 'stim'), e('sclerostin', 'boneform', 'inhib', { lv: 3 }), e('denosumab', 'rankl', 'inhib', { lv: 4 })],
    clinical: [{ id: 'meno', label: 'Postmenopausal osteoporosis', inputs: { estradiol: 0.2 }, desc: 'Estrogen loss → ↑ RANKL, ↓ OPG → resorption outpaces formation.', chain: ['↓ estrogen', '↑ RANKL / ↓ OPG', '↑ osteoclastogenesis', 'bone loss'] }, { id: 'gio', label: 'Glucocorticoid-induced osteoporosis', inputs: { cortisol: 4 }, desc: '↓ formation + ↑ resorption.', chain: ['↑ glucocorticoid', '↓ osteoblasts', '↑ RANKL', 'bone loss'] }],
    refs: ['boyle2003', 'kovacs14'],
  };

  // ---------------- kidney & gut mineral handling ----------------
  P.kidneymineral = {
    id: 'kidneymineral', title: 'Kidney and gut handling of calcium and phosphate', view: { w: 1150, h: 560 }, route: true,
    compartments: [{ x: 10, y: 10, w: 270, h: 540, label: 'Proximal tubule', kind: 'cytosol' }, { x: 290, y: 10, w: 270, h: 540, label: 'Thick ascending limb', kind: 'cytosol' }, { x: 570, y: 10, w: 270, h: 540, label: 'Distal convoluted tubule', kind: 'cytosol' }, { x: 850, y: 10, w: 290, h: 540, label: 'Duodenum (enterocyte)', kind: 'organ' }],
    inputs: [{ node: 'pth', label: 'PTH', value: 1 }, { node: 'fgf23', label: 'FGF23', value: 1 }, { node: 'calcitriol', label: 'Calcitriol', value: 1 }, { node: 'ca', label: 'Plasma Ca²⁺', value: 1 }],
    nodes: [n('pth', 140, 50), n('fgf23', 140, 130), n('napi', 80, 260), n('pexc', 80, 360, { type: 'process', ent: 'phosphate', label: '↑ Phosphate excretion', w: 150 }), n('cyp27b1', 210, 260, { w: 110 }), n('cyp24a1', 210, 450, { lv: 2, w: 100 }), n('ca', 420, 50), n('casr', 420, 160), n('tal', 420, 280, { type: 'process', ent: 'casr', label: 'Paracellular Ca²⁺\nreabsorption (claudins)', h: 44, w: 180 }), n('trpv5', 700, 260), n('dctca', 700, 360, { type: 'process', ent: 'trpv5', label: '↑ Ca²⁺ reabsorption', w: 160 }), n('calcitriol', 1000, 50), n('vdr', 1000, 130), n('trpv6', 1000, 250), n('gutca', 1000, 350, { type: 'process', ent: 'trpv6', label: '↑ Ca²⁺ absorption', w: 150 }), n('napi2b', 1000, 450), n('pth2', 700, 50, { ent: 'pth', label: 'PTH' })],
    edges: [e('pth', 'napi', 'inhib', { why: 'PTH (direct) → NaPi-IIa/IIc endocytosis → phosphaturia.' }), e('fgf23', 'napi', 'inhib', { why: 'FGF23 (FGFR1/α-Klotho) → NaPi endocytosis.' }), e('napi', 'pexc', 'inhib'), e('pth', 'cyp27b1', 'stim', { why: 'Direct PTH action on proximal tubule.' }), e('fgf23', 'cyp27b1', 'inhib'), e('fgf23', 'cyp24a1', 'stim', { lv: 2 }), e('cyp27b1', 'calcitriol', 'rxn', { via: [[210, 20], [900, 20]], why: '25-OH-D → 1,25-(OH)₂D.' }), e('ca', 'casr', 'bind'), e('casr', 'tal', 'inhib', { why: 'CaSR → claudin-14 ↑ → less paracellular Ca²⁺ reabsorption (hypercalciuria when Ca is high).' }), e('pth2', 'trpv5', 'stim', { why: 'Direct PTH action: the regulated Ca²⁺ reabsorption step.' }), e('calcitriol', 'trpv5', 'stim', { lv: 2, via: [[860, 90], [760, 220]] }), e('trpv5', 'dctca', 'stim'), e('calcitriol', 'vdr', 'bind'), e('vdr', 'trpv6', 'stim', { why: 'VDR induces TRPV6, calbindin-D9k, PMCA1b.' }), e('trpv6', 'gutca', 'stim'), e('vdr', 'napi2b', 'stim', { via: [[1100, 130], [1100, 450]] })],
    refs: ['blaine2015', 'martin2012', 'kovacs14', 'molina5'],
  };

  // ---------------- testis ----------------
  P.testis = {
    id: 'testis', title: 'Testis: Leydig–Sertoli cooperation', view: { w: 1100, h: 560 },
    compartments: [{ x: 10, y: 10, w: 1080, h: 80, label: 'Blood', kind: 'blood' }, { x: 10, y: 100, w: 430, h: 450, label: 'Leydig cell (interstitium)', kind: 'cytosol' }, { x: 455, y: 100, w: 635, h: 450, label: 'Seminiferous tubule: Sertoli cell + germ cells', kind: 'mito' }],
    inputs: [{ node: 'lh', label: 'LH', value: 1 }, { node: 'fsh', label: 'FSH', value: 1 }],
    nodes: [n('lh', 150, 50), n('fsh', 650, 50), n('lhr', 150, 140), n('camp', 150, 220), n('star', 150, 300), n('cholesterol', 330, 220), n('pregnenolone', 330, 300), n('testosterone', 230, 460, { label: 'Testosterone (very high locally)', w: 200 }), n('fshr', 650, 140), n('sertoli', 650, 240), n('abp', 870, 240, { ent: 'sertoli', type: 'protein', label: 'ABP (keeps T high)' }), n('inhibin', 870, 140), n('spermatogenesis', 760, 460, { w: 160 }), n('t_out', 330, 50, { ent: 'testosterone', label: 'Serum T' }), n('cyp19', 650, 360, { lv: 2, label: 'Aromatase (→ E2)', w: 140 })],
    edges: [e('lh', 'lhr', 'bind'), e('lhr', 'camp', 'stim'), e('camp', 'star', 'stim', { why: 'Acute: StAR moves cholesterol into mitochondria.' }), e('cholesterol', 'star', 'transport'), e('star', 'pregnenolone', 'rxn', { label: 'CYP11A1' }), e('pregnenolone', 'testosterone', 'rxn', { label: '3β-HSD, CYP17A1, 17β-HSD3' }), e('testosterone', 't_out', 'transport'), e('testosterone', 'spermatogenesis', 'stim', { why: 'Intratesticular testosterone (bound by ABP) is essential — much higher than serum.' }), e('fsh', 'fshr', 'bind'), e('fshr', 'sertoli', 'stim'), e('sertoli', 'abp', 'stim'), e('abp', 'spermatogenesis', 'stim'), e('sertoli', 'spermatogenesis', 'stim'), e('sertoli', 'inhibin', 'stim'), e('inhibin', 'fsh', 'fb', { why: 'Inhibin B selectively suppresses FSH.' }), e('sertoli', 'cyp19', 'stim', { lv: 2 })],
    refs: ['kovacs9', 'molina8'],
  };
  P.ovary = {
    id: 'ovary', title: 'Ovary: two-cell, two-gonadotropin model', view: { w: 1100, h: 520 },
    compartments: [{ x: 10, y: 10, w: 1080, h: 80, label: 'Blood', kind: 'blood' }, { x: 10, y: 100, w: 520, h: 410, label: 'Theca cell (LH)', kind: 'cytosol' }, { x: 545, y: 100, w: 545, h: 410, label: 'Granulosa cell (FSH)', kind: 'mito' }],
    inputs: [{ node: 'lh', label: 'LH', value: 1 }, { node: 'fsh', label: 'FSH', value: 1 }],
    nodes: [n('lh', 180, 50), n('fsh', 780, 50), n('lhr', 180, 150), n('cholesterol', 380, 150), n('cyp17', 280, 270, { w: 140 }), n('androstenedione', 280, 380, { w: 150 }), n('fshr', 780, 150), n('cyp19', 780, 270), n('estradiol', 780, 380), n('inhibin', 980, 270), n('e2out', 780, 470, { ent: 'estradiol', label: 'E2 → blood, endometrium, LH surge', w: 260 })],
    edges: [e('lh', 'lhr', 'bind'), e('lhr', 'cyp17', 'stim', { why: 'LH → cAMP → StAR, CYP11A1, CYP17A1 in theca.' }), e('cholesterol', 'cyp17', 'rxn'), e('cyp17', 'androstenedione', 'rxn'), e('androstenedione', 'cyp19', 'transport', { why: 'Theca androgens diffuse to granulosa cells, which lack CYP17.' }), e('fsh', 'fshr', 'bind'), e('fshr', 'cyp19', 'stim', { why: 'FSH induces aromatase.' }), e('cyp19', 'estradiol', 'rxn'), e('fshr', 'inhibin', 'stim'), e('estradiol', 'e2out', 'transport')],
    refs: ['kovacs8', 'molina9'],
  };
  P.androgen = {
    id: 'androgen', title: 'Androgen metabolism and tissue-specific action', view: { w: 1100, h: 560 },
    inputs: [{ node: 'lh', label: 'LH', value: 1 }],
    nodes: [n('lh', 100, 60), n('cholesterol', 100, 150), n('pregnenolone', 100, 240), n('dhea', 100, 330), n('androstenedione', 300, 330), n('hsd17b3', 300, 240, { w: 100 }), n('testosterone', 500, 240), n('srd5a2', 700, 150), n('dht', 870, 150), n('cyp19', 700, 330), n('estradiol', 900, 330), n('ar', 700, 240, { label: 'AR (testosterone)' }), n('ar2', 1035, 150, { ent: 'ar', label: 'AR (DHT)', w: 100 }), n('er', 1000, 420, { w: 90 }),
      n('t_eff', 500, 450, { type: 'process', ent: 'testosterone', label: 'T: Wolffian ducts, muscle, spermatogenesis, LH feedback, libido', w: 330, h: 44 }), n('dht_eff', 900, 60, { type: 'process', ent: 'dht', label: 'DHT: external genitalia, prostate, hair, sebum', w: 280, h: 40 }), n('e_eff', 880, 500, { type: 'process', ent: 'estradiol', label: 'E2: epiphyseal closure, bone density, feedback', w: 300, h: 40 }), n('finasteride', 560, 120, { lv: 4, w: 100 }), n('aromataseinh', 580, 392, { lv: 4, label: 'Aromatase inhibitors', w: 130 })],
    edges: [e('lh', 'cholesterol', 'stim', { why: 'LH → StAR in Leydig cells.' }), e('cholesterol', 'pregnenolone', 'rxn', { label: 'CYP11A1' }), e('pregnenolone', 'dhea', 'rxn', { label: 'CYP17A1' }), e('dhea', 'androstenedione', 'rxn', { label: '3β-HSD' }), e('androstenedione', 'hsd17b3', 'rxn'), e('hsd17b3', 'testosterone', 'rxn'), e('testosterone', 'srd5a2', 'rxn'), e('srd5a2', 'dht', 'rxn'), e('testosterone', 'cyp19', 'rxn'), e('cyp19', 'estradiol', 'rxn'), e('testosterone', 'ar', 'bind'), e('ar', 't_eff', 'stim'), e('dht', 'ar2', 'bind', { why: 'DHT binds AR with higher affinity and dissociates more slowly — amplifying androgen action in tissues expressing 5α-reductase.' }), e('ar2', 'dht_eff', 'stim'), e('estradiol', 'er', 'bind'), e('er', 'e_eff', 'stim'), e('finasteride', 'srd5a2', 'inhib', { lv: 4 }), e('aromataseinh', 'cyp19', 'inhib', { lv: 4 })],
    clinical: [{ id: '5ar', label: '5α-reductase type 2 deficiency', caps: { srd5a2: 0.1 }, desc: '46,XY: normal testosterone (Wolffian structures), low DHT → undervirilized external genitalia.', chain: ['↓ 5α-reductase', '↓ DHT', 'T normal'] }, { id: 'cais', label: 'Androgen insensitivity', caps: { ar: 0.05, ar2: 0.05 }, desc: 'AR loss: female external phenotype, high T and LH; aromatized E2 drives breast development.', chain: ['AR nonfunctional', 'no androgen action', '↑ LH → ↑ T → ↑ E2'] }, { id: 'arom', label: 'Aromatase deficiency', caps: { cyp19: 0.05 }, desc: 'No estrogen: unfused epiphyses, tall stature, osteoporosis (men).', chain: ['↓ aromatase', '↓ E2', 'epiphyses fail to fuse'] }],
    refs: ['kovacs9', 'miller2011'],
  };
  P.placenta = {
    id: 'placenta', title: 'Pregnancy: the feto-placental unit', view: { w: 1100, h: 520 },
    compartments: [{ x: 10, y: 10, w: 340, h: 500, label: 'Mother', kind: 'organ' }, { x: 365, y: 10, w: 340, h: 500, label: 'Placenta (syncytiotrophoblast)', kind: 'mito' }, { x: 720, y: 10, w: 370, h: 500, label: 'Fetus', kind: 'cytosol' }],
    nodes: [n('ldl', 180, 80, { label: 'Maternal LDL-cholesterol', w: 180 }), n('cholesterol', 530, 80), n('pregnenolone', 530, 170), n('progesterone', 530, 260), n('pfx', 180, 260, { ent: 'progesterone', label: 'Uterine quiescence', type: 'process' }), n('fadrenal', 900, 170, { ent: 'dhea', label: 'Fetal adrenal: DHEA-S', type: 'process', w: 180 }), n('fliver', 900, 290, { ent: 'dhea', label: 'Fetal liver: 16-OH-DHEA-S', type: 'process', w: 190 }), n('cyp19', 530, 380), n('estriol', 180, 380, { ent: 'estradiol', label: 'Estriol (+E2) → mother', w: 170 }), n('hcg', 530, 470), n('cl', 180, 470, { ent: 'progesterone', label: 'Corpus luteum (early)', type: 'cell' })],
    edges: [e('ldl', 'cholesterol', 'transport'), e('cholesterol', 'pregnenolone', 'rxn'), e('pregnenolone', 'progesterone', 'rxn', { why: 'The placenta lacks CYP17, so it cannot make androgens itself.' }), e('progesterone', 'pfx', 'endo'), e('pregnenolone', 'fadrenal', 'transport', { why: 'Pregnenolone is used by the large fetal adrenal zone.' }), e('fadrenal', 'fliver', 'rxn'), e('fliver', 'cyp19', 'transport', { why: '16-OH-DHEA-S returns to the placenta (sulfatase, 3β-HSD) and is aromatized.' }), e('cyp19', 'estriol', 'rxn'), e('hcg', 'cl', 'stim', { why: 'hCG acts on LH receptors to rescue the corpus luteum until the placenta takes over progesterone production.' })],
    refs: ['kovacs10'],
  };
  P.adhcd = {
    id: 'adhcd', title: 'ADH in the collecting duct: V2 → cAMP → aquaporin-2', view: { w: 900, h: 460 },
    compartments: [{ x: 10, y: 10, w: 200, h: 440, label: 'Blood (basolateral)', kind: 'blood' }, { x: 220, y: 10, w: 460, h: 440, label: 'Principal cell', kind: 'cytosol' }, { x: 690, y: 10, w: 200, h: 440, label: 'Tubular lumen', kind: 'mito' }],
    inputs: [{ node: 'adh', label: 'ADH', value: 1 }],
    nodes: [n('adh', 110, 80), n('v2r', 260, 80), n('camp', 420, 160), n('pka', 420, 250), n('aqp2', 600, 250, { label: 'AQP2 vesicles → apical membrane', w: 150, h: 46 }), n('water', 790, 250), n('water2', 110, 360, { ent: 'water', label: 'Water reabsorbed' })],
    edges: [e('adh', 'v2r', 'bind'), e('v2r', 'camp', 'stim'), e('camp', 'pka', 'stim'), e('pka', 'aqp2', 'transport', { why: 'PKA phosphorylates AQP2 (Ser256) → exocytic insertion; chronic: ↑ AQP2 transcription.' }), e('water', 'aqp2', 'transport'), e('aqp2', 'water2', 'transport', { via: [[500, 360]], why: 'Water exits basolaterally via AQP3/4 into the hypertonic medulla.' })],
    clinical: [{ id: 'ndi', label: 'Nephrogenic DI', caps: { v2r: 0.1 }, desc: 'V2R or AQP2 defect: ADH present but water not reabsorbed.', chain: ['V2R/AQP2 defect', 'no water channel insertion', 'dilute polyuria'] }],
    refs: ['kovacs6', 'molina2'],
  };

  // ---------------- hormone life cycle ----------------
  P.peptidelife = {
    id: 'peptidelife', title: 'Peptide hormone life cycle (e.g., insulin)', view: { w: 1100, h: 420 },
    nodes: [n('gene', 100, 80, { ent: 'hre', type: 'gene', label: 'Gene → mRNA' }), n('er', 300, 80, { ent: 'insulin', type: 'process', label: 'Rough ER: prepro- → prohormone', w: 200 }), n('golgi', 520, 80, { ent: 'insulin', type: 'process', label: 'Golgi → granule (prohormone convertases)', w: 230 }), n('granule', 760, 80, { ent: 'exocytosis', type: 'vesicle', label: 'Stored in granules', w: 150 }), n('secr', 980, 80, { ent: 'exocytosis', type: 'process', label: 'Stimulus → Ca²⁺ → exocytosis', w: 200 }), n('plasma', 980, 220, { ent: 'insulin', type: 'hormone', label: 'Free in plasma (t½ minutes)', w: 200 }), n('rec', 760, 220, { ent: 'gpcr', type: 'receptor', label: 'Membrane receptor', w: 160 }), n('clear', 500, 220, { ent: 'insulin', type: 'process', label: 'Receptor-mediated endocytosis;\nliver/kidney clearance', w: 230, h: 42 })],
    edges: [e('gene', 'er', 'rxn'), e('er', 'golgi', 'transport'), e('golgi', 'granule', 'transport'), e('granule', 'secr', 'transport'), e('secr', 'plasma', 'transport'), e('plasma', 'rec', 'bind'), e('rec', 'clear', 'transport')],
    refs: ['molina1', 'kovacs1'],
  };
  P.steroidlife = {
    id: 'steroidlife', title: 'Steroid hormone life cycle (e.g., cortisol)', view: { w: 1100, h: 420 },
    nodes: [n('cholesterol', 100, 80), n('star', 300, 80), n('enz', 520, 80, { ent: 'cyp11a1', type: 'process', label: 'Mitochondrial/ER P450 enzymes', w: 210 }), n('nostore', 760, 80, { ent: 'steroidogenesis', type: 'note', label: 'No storage: secretion = synthesis', w: 220 }), n('cbg', 980, 80, { ent: 'tbg', type: 'protein', label: '~90% bound (CBG, albumin)', w: 190 }), n('free', 980, 220, { ent: 'cortisol', type: 'hormone', label: 'Free fraction (active)', w: 180 }), n('nucl', 760, 220, { ent: 'gr', type: 'receptor', label: 'Intracellular receptor', w: 170 }), n('liverclear', 520, 220, { ent: 'liver', type: 'process', label: 'Hepatic reduction/conjugation → urine', w: 270 })],
    edges: [e('cholesterol', 'star', 'transport'), e('star', 'enz', 'rxn', { why: 'Acute regulation is at cholesterol delivery (StAR), so secretion rate tracks synthesis rate.' }), e('enz', 'nostore', 'rxn'), e('nostore', 'cbg', 'transport'), e('cbg', 'free', 'bind'), e('free', 'nucl', 'transport'), e('nucl', 'liverclear', 'transport')],
    refs: ['molina1', 'kovacs1', 'miller2011'],
  };
})();
