/* Endocrine axes and feedback systems for the network engine (EP.mountNetwork).
 * Values are relative (1 = normal); exponents encode sign and rough strength only.
 * tau = relative time constant (hypothalamic/pituitary peptides fast; T4 slow…). */
(function () {
  const EP = window.EP;
  const T = (src, w, why, o) => Object.assign({ src, w, why }, o || {});
  const FB = (src, w, why, kind, o) => Object.assign({ src, w, why, fb: kind || 'long' }, o || {});
  const BANDS = (labels) => labels.map((l, i) => ({ y: 20 + i * 140, h: 128, label: l }));
  const N = EP.networks;

  // ============================ HPA ============================
  N.hpa = {
    id: 'hpa', title: 'Hypothalamic–pituitary–adrenal axis', view: { w: 900, h: 590 },
    bands: BANDS(['Hypothalamus (PVN)', 'Anterior pituitary (corticotroph)', 'Adrenal cortex', 'Targets']),
    nodes: [
      { id: 'stress', label: 'Stress', input: true, x: 120, y: 75, type: 'process', w: 110 },
      { id: 'circ', label: 'Circadian (SCN)', input: true, x: 120, y: 130, type: 'process', w: 130, h: 30 },
      { id: 'crh', label: 'CRH', ent: 'crh', x: 420, y: 95, tau: 0.25, terms: [
        T('stress', 0.8, 'Physical and emotional stressors activate PVN CRH neurons.'), T('circ', 1, 'The suprachiasmatic nucleus drives a morning peak in CRH/ACTH (Oster 2017).'),
        FB('cortisol', -0.7, 'Cortisol acts on hypothalamic GR to suppress CRH (long-loop negative feedback).'),
        FB('acth', -0.2, 'ACTH can inhibit CRH release (short-loop feedback).', 'short', { curve: -50, lx: -70 }),
      ] },
      { id: 'acth', label: 'ACTH', ent: 'acth', x: 420, y: 230, tau: 0.35, terms: [
        T('crh', 0.9, 'CRH → CRHR1 (Gs) → POMC transcription and ACTH release.', { endo: true, label: 'portal blood' }),
        FB('cortisol', -0.6, 'Cortisol suppresses POMC transcription and ACTH secretion at the corticotroph.', 'long', { curve: 60 }),
      ] },
      { id: 'cortisol', label: 'Cortisol', ent: 'cortisol', x: 420, y: 370, tau: 1.2, terms: [T('acth', 0.9, 'ACTH → MC2R → cAMP → StAR + CYP11A1/CYP17A1/CYP21A2/CYP11B1.', { endo: true })] },
      { id: 'renin', label: 'Renin', ent: 'renin', x: 760, y: 230, tau: 0.6, type: 'enzyme', terms: [T('aldo', -0.9, 'Aldosterone-driven Na⁺ retention expands volume and suppresses renin (volume feedback).', { fb: 'long' })] },
      { id: 'aldo', label: 'Aldosterone', ent: 'aldosterone', x: 700, y: 370, tau: 0.8, terms: [T('renin', 0.8, 'Renin → angiotensin II → AT1 on zona glomerulosa. Largely ACTH-independent.', { endo: true }), T('acth', 0.1, 'ACTH has only a minor, transient effect on aldosterone.', { hide: true })] },
      { id: 'pigment', label: 'Skin pigmentation\n(POMC → MSH)', x: 180, y: 300, type: 'process', w: 150, h: 44, tau: 2, terms: [T('acth', 0.8, 'High ACTH (and co-secreted POMC peptides) activates MC1R on melanocytes → hyperpigmentation in primary adrenal insufficiency.')] },
      { id: 'effects', label: 'Glucocorticoid effects\n(gluconeogenesis, ↓ immune)', x: 420, y: 510, type: 'process', w: 220, h: 46, tau: 1, terms: [T('cortisol', 1, 'GR-mediated transcription in liver, muscle, adipose, immune cells.')] },
    ],
    inputs: [{ id: 'stress', label: 'Stress' }],
    capacities: [{ id: 'crh', label: 'Hypothalamus' }, { id: 'acth', label: 'Pituitary' }, { id: 'cortisol', label: 'Adrenal cortex (ZF)' }],
    exogenous: [{ id: 'cortisol', label: 'Exogenous glucocorticoid' }],
    traces: ['crh', 'acth', 'cortisol', 'aldo', 'renin'],
    labs: ['crh', 'acth', 'cortisol', 'aldo', 'renin', 'pigment'],
    normalText: 'Normal axis. Drag the sliders or pick a disorder; feedback signals travel back up the axis along the curved dashed arrows. Toggle the circadian clock to watch the morning cortisol peak.',
    presets: [
      { id: 'primary', label: 'Primary adrenal insufficiency', caps: { cortisol: 0.12, aldo: 0.12 }, desc: 'Adrenal cortex destroyed (autoimmune Addison disease). Both cortisol and aldosterone fall; loss of feedback raises CRH and ACTH; aldosterone loss raises renin.', chain: ['↓ cortisol', 'loss of negative feedback', '↑↑ ACTH (+ POMC peptides)', 'hyperpigmentation', '↓ aldosterone → ↑ renin, hyperkalemia'] },
      { id: 'secondary', label: 'Secondary (pituitary)', caps: { acth: 0.12 }, desc: 'ACTH deficiency. Cortisol falls but **aldosterone is preserved** (RAAS-driven), so no hyperkalemia and no hyperpigmentation.', chain: ['↓ ACTH', '↓ cortisol', '↑ CRH (feedback lost)', 'renin–aldosterone intact'] },
      { id: 'tertiary', label: 'Tertiary (hypothalamic)', caps: { crh: 0.12 }, desc: 'CRH deficiency: everything downstream is low.', chain: ['↓ CRH', '↓ ACTH', '↓ cortisol'] },
      { id: 'autonomous', label: 'Adrenal adenoma (ACTH-independent Cushing)', autos: { cortisol: 3 }, desc: 'Autonomous cortisol secretion suppresses CRH and ACTH; the contralateral adrenal atrophies.', chain: ['↑↑ cortisol (autonomous)', '⊣ CRH', '⊣ ACTH (suppressed)'] },
      { id: 'disease', label: 'Cushing disease (pituitary adenoma)', autos: { acth: 1.5 }, mods: { acth: { cortisol: 0.35 } }, desc: 'ACTH-secreting adenoma with a raised feedback set-point: ACTH inappropriately normal-to-high, cortisol high, CRH suppressed. High-dose dexamethasone still partially suppresses ACTH (residual feedback).', chain: ['adenoma: autonomous ACTH + feedback resistance', '↑ cortisol', '⊣ CRH'] },
      { id: 'ectopic', label: 'Ectopic ACTH', autos: { acth: 5 }, mods: { acth: { cortisol: 0 } }, desc: 'Tumor (e.g., small-cell lung cancer) secretes ACTH with no feedback: very high ACTH and cortisol; can cause hypokalemia (cortisol overwhelms 11β-HSD2) and hyperpigmentation.', chain: ['↑↑ ACTH (ectopic, no feedback)', '↑↑ cortisol', '⊣ CRH'] },
      { id: 'exo', label: 'Exogenous glucocorticoids', exo: { cortisol: 3 }, desc: 'Therapeutic glucocorticoids suppress CRH and ACTH; endogenous cortisol production falls and the adrenal atrophies — abrupt withdrawal risks adrenal crisis.', chain: ['↑ glucocorticoid activity', '⊣ CRH', '⊣ ACTH', '↓ endogenous cortisol (adrenal atrophy)'] },
      { id: 'stress', label: 'Acute stress', inputs: { stress: 3 }, desc: 'Stress overrides feedback set-point: CRH, ACTH and cortisol all rise.', chain: ['stress', '↑ CRH (+AVP)', '↑ ACTH', '↑ cortisol'] },
    ],
    interpret(m) {
      const q = (id) => EP.qual(m.eff(id), m.ref[id]).cls;
      const c = q('cortisol'), a = q('acth');
      if (/dn/.test(c) && /up/.test(a)) return '**Pattern:** low cortisol with high ACTH → **primary** adrenal failure (feedback intact, gland failing).';
      if (/dn/.test(c) && /dn|eq/.test(a)) return '**Pattern:** low cortisol with low/inappropriately normal ACTH → **central** (secondary/tertiary) insufficiency.';
      if (/up/.test(c) && /dn/.test(a)) return m.exo.cortisol ? '**Pattern:** suppressed ACTH and *endogenous* cortisol with exogenous glucocorticoid activity → iatrogenic suppression.' : '**Pattern:** high cortisol, suppressed ACTH → **ACTH-independent** (adrenal) source.';
      if (/up/.test(c) && /up|eq/.test(a)) return '**Pattern:** high cortisol with high/inappropriately normal ACTH → **ACTH-dependent** (pituitary or ectopic) source.';
      return '';
    },
  };
  // circadian clock (24 h ≈ 24 s of animation)
  let tClock = 7;
  EP.networks.hpa.clock = function (m, dt) {
    if (!EP.networks.hpa.circadian) { m.inputs.circ = 1; return; }
    tClock = (tClock + dt) % 24;
    m.inputs.circ = Math.exp(0.6 * Math.cos(2 * Math.PI * (tClock - 7) / 24));
    EP.networks.hpa.clockHour = tClock;
  };

  // ============================ HPT ============================
  N.hpt = {
    id: 'hpt', title: 'Hypothalamic–pituitary–thyroid axis', view: { w: 900, h: 590 },
    bands: BANDS(['Hypothalamus', 'Anterior pituitary (thyrotroph)', 'Thyroid', 'Peripheral tissues']),
    nodes: [
      { id: 'cold', label: 'Cold / energy status', input: true, x: 130, y: 85, type: 'process', w: 150 },
      { id: 'trh', label: 'TRH', ent: 'trh', x: 420, y: 90, tau: 0.25, terms: [T('cold', 0.3, 'Cold exposure (and leptin) activate TRH neurons.'), FB('t3cns', -0.6, 'Hypothalamic tanycyte D2 converts T4 → T3, which suppresses TRH transcription.', 'long', { curve: -70 })] },
      { id: 'tsh', label: 'TSH', ent: 'tsh', x: 420, y: 230, tau: 0.35, terms: [T('trh', 0.8, 'TRH → Gq → TSH synthesis/release.', { endo: true, label: 'portal blood' }), FB('t3cns', -1.0, 'Thyrotroph D2 converts T4 → T3; T3 on TRβ2 represses TSHβ and α-subunit genes — the dominant feedback site.', 'long', { curve: 70 })] },
      { id: 't4', label: 'T4 (thyroxine)', ent: 't4', x: 420, y: 370, tau: 3, terms: [T('tsh', 0.8, 'TSH → TSH-R (Gs) → NIS, TPO, Tg, iodide organification, Tg proteolysis and release.', { endo: true })] },
      { id: 't3', label: 'T3 (serum)', ent: 't3', x: 680, y: 370, tau: 1.5, terms: [T('t4', 0.75, 'Peripheral 5′-deiodination (D1, D2) produces most circulating T3.'), T('tsh', 0.15, 'TSH stimulates thyroidal T3 secretion and D2.')] },
      { id: 't3cns', label: 'Intracellular T3\n(pituitary/hypothalamus)', x: 700, y: 160, type: 'metabolite', w: 170, h: 44, tau: 0.5, terms: [T('t4', 0.75, 'Feedback mostly reflects local D2 conversion of T4 — which is why serum T4 is so important for TSH regulation (Bianco 2002).'), T('t3', 0.25, 'Serum T3 also enters directly.')] },
      { id: 'bmr', label: 'Metabolic rate, HR,\nthermogenesis', x: 560, y: 515, type: 'process', w: 190, h: 46, tau: 1.5, terms: [T('t3', 1, 'T3 → TR/RXR → Na⁺/K⁺-ATPase, β1 receptors, α-MHC, UCP1…')] },
    ],
    inputs: [{ id: 'cold', label: 'Cold / energy' }],
    capacities: [{ id: 'trh', label: 'Hypothalamus' }, { id: 'tsh', label: 'Pituitary' }, { id: 't4', label: 'Thyroid gland' }],
    exogenous: [{ id: 't4', label: 'Levothyroxine (T4)' }],
    traces: ['trh', 'tsh', 't4', 't3'],
    labs: ['trh', 'tsh', 't4', 't3', 'bmr'],
    normalText: 'TSH responds steeply (log-linear) to small changes in free T4 — making it the most sensitive screening test for primary thyroid disease (Kovacs Ch12).',
    presets: [
      { id: 'primary', label: 'Primary hypothyroidism (Hashimoto)', caps: { t4: 0.25 }, desc: 'Thyroid failure: T4/T3 fall, TSH rises markedly. TRH rises too (can raise prolactin).', chain: ['↓ T4/T3', 'loss of feedback', '↑↑ TSH', '↑ TRH'] },
      { id: 'secondary', label: 'Secondary (central) hypothyroidism', caps: { tsh: 0.2 }, desc: 'Pituitary failure: T4 low with low or **inappropriately normal** TSH — so TSH alone misses central hypothyroidism; measure free T4.', chain: ['↓ TSH (bioactivity)', '↓ T4/T3', 'TSH low or "normal"'] },
      { id: 'tertiary', label: 'Tertiary (hypothalamic)', caps: { trh: 0.2 }, desc: 'TRH deficiency.', chain: ['↓ TRH', '↓ TSH', '↓ T4'] },
      { id: 'graves', label: 'Graves disease (TSI)', autos: { t4: 2.5 }, desc: 'Thyroid-stimulating immunoglobulins activate TSH-R independently of TSH: T4/T3 high, TSH suppressed.', chain: ['TSI → TSH-R', '↑↑ T4/T3', '⊣ TSH (suppressed)'] },
      { id: 'tshoma', label: 'TSH-secreting adenoma', autos: { tsh: 1.5 }, mods: { tsh: { t3cns: 0.3 } }, desc: 'Central hyperthyroidism: high T4 with non-suppressed TSH.', chain: ['autonomous TSH', '↑ T4/T3', 'TSH not suppressed'] },
      { id: 'rth', label: 'Thyroid hormone resistance (TRβ)', mods: { tsh: { t3cns: 0.3 }, trh: { t3cns: 0.3 } }, desc: 'Reduced feedback sensitivity at TRβ: T4/T3 high with normal/high TSH.', chain: ['↓ TRβ sensitivity', 'feedback set-point raised', '↑ T4 with unsuppressed TSH'] },
      { id: 'excess', label: 'Excess levothyroxine', exo: { t4: 2.5 }, desc: 'Iatrogenic thyrotoxicosis: high T4, suppressed TSH and endogenous production.', chain: ['↑ T4 (exogenous)', '⊣ TSH', '↓ endogenous thyroid output'] },
      { id: 'iodine', label: 'Iodine deficiency', caps: { t4: 0.55 }, desc: 'Limited substrate: TSH rises and drives goiter while T4 is partly maintained; relatively more T3 is produced.', chain: ['↓ iodide', '↓ T4 synthesis', '↑ TSH', 'goiter'] },
    ],
    interpret(m) {
      const q = (id) => EP.qual(m.eff(id), m.ref[id]).cls; const t4 = q('t4'), tsh = q('tsh');
      if (/dn/.test(t4) && /up/.test(tsh)) return '**Pattern:** ↓ T4 with ↑ TSH → **primary** hypothyroidism.';
      if (/dn/.test(t4)) return '**Pattern:** ↓ T4 with low/inappropriately normal TSH → **central** hypothyroidism.';
      if (/up/.test(t4) && /dn/.test(tsh)) return m.exo.t4 ? '**Pattern:** ↑ T4, suppressed TSH, exogenous source → iatrogenic.' : '**Pattern:** ↑ T4 with suppressed TSH → **primary** hyperthyroidism.';
      if (/up/.test(t4)) return '**Pattern:** ↑ T4 with unsuppressed TSH → **TSH-dependent** (TSH-oma) or **thyroid hormone resistance**.';
      return '';
    },
  };

  // ============================ HPG (male) ============================
  N.hpgm = {
    id: 'hpgm', title: 'HPG axis (male)', view: { w: 900, h: 590 },
    bands: BANDS(['Hypothalamus (kisspeptin → GnRH)', 'Anterior pituitary (gonadotroph)', 'Testis', 'Targets']),
    nodes: [
      { id: 'energy', label: 'Energy / leptin', input: true, x: 120, y: 70, type: 'process', w: 130 },
      { id: 'prl', label: 'Prolactin', input: true, x: 120, y: 125, type: 'hormone', w: 100, ent: 'prolactin' },
      { id: 'gnrh', label: 'GnRH (pulses)', ent: 'gnrh', x: 450, y: 90, tau: 0.2, terms: [T('energy', 0.5, 'Leptin/energy sufficiency is permissive for kisspeptin–GnRH output.'), T('prl', -0.6, 'Prolactin suppresses kisspeptin/GnRH.'), FB('t', -0.3, 'Testosterone (via AR on kisspeptin neurons) slows GnRH pulses.', 'long', { curve: -90 }), FB('e2', -0.3, 'Aromatized estradiol is a major negative-feedback signal in men.', 'long', { curve: 100, lx: 10 })] },
      { id: 'lh', label: 'LH', ent: 'lh', x: 330, y: 230, tau: 0.3, terms: [T('gnrh', 0.9, 'GnRH (Gq) → LH; faster pulses favour LH.', { endo: true }), FB('t', -0.4, 'Testosterone/estradiol suppress LH at the pituitary.', 'long', { curve: 50 })] },
      { id: 'fsh', label: 'FSH', ent: 'fsh', x: 590, y: 230, tau: 0.5, terms: [T('gnrh', 0.6, 'GnRH → FSH (slower pulses favour FSH).', { endo: true }), FB('inhibin', -0.8, 'Inhibin B selectively suppresses FSH.', 'long', { curve: -60 }), T('t', -0.15, 'Sex steroids modestly suppress FSH.', { hide: true })] },
      { id: 'itt', label: 'Leydig cells:\nintratesticular T', x: 330, y: 370, type: 'cell', w: 160, h: 50, tau: 0.6, terms: [T('lh', 0.9, 'LH → LH-R (Gs) → cAMP → StAR/CYP11A1/CYP17A1/17β-HSD3.', { endo: true })] },
      { id: 'sperm', label: 'Sertoli cells:\nspermatogenesis', x: 590, y: 370, type: 'cell', w: 160, h: 50, tau: 2, terms: [T('fsh', 0.4, 'FSH supports Sertoli function (ABP, nutrients).', { endo: true }), T('itt', 0.8, 'Spermatogenesis needs intratesticular testosterone far above serum levels — exogenous testosterone cannot supply it.')] },
      { id: 'inhibin', label: 'Inhibin B', ent: 'inhibin', x: 790, y: 300, tau: 0.6, terms: [T('fsh', 0.4, 'FSH stimulates Sertoli inhibin B.'), T('sperm', 0.4, 'Inhibin B tracks Sertoli/germ-cell integrity.')] },
      { id: 't', label: 'Serum testosterone', ent: 'testosterone', x: 330, y: 500, tau: 0.6, w: 150, terms: [T('itt', 1, 'Testosterone diffuses from Leydig cells into blood.')] },
      { id: 'e2', label: 'Estradiol', ent: 'estradiol', x: 120, y: 420, tau: 0.6, terms: [T('t', 0.9, 'Aromatase (adipose, brain, bone) converts testosterone → estradiol.')] },
      { id: 'dht', label: 'DHT', ent: 'dht', x: 560, y: 510, tau: 0.6, terms: [T('t', 1, '5α-Reductase type 2 in genital skin/prostate.')] },
    ],
    inputs: [{ id: 'energy', label: 'Energy availability' }, { id: 'prl', label: 'Prolactin' }],
    capacities: [{ id: 'gnrh', label: 'GnRH neurons' }, { id: 'lh', label: 'Gonadotrophs (LH)' }, { id: 'itt', label: 'Leydig cells' }, { id: 'sperm', label: 'Seminiferous tubules' }],
    exogenous: [{ id: 't', label: 'Exogenous testosterone' }],
    traces: ['gnrh', 'lh', 'fsh', 't', 'sperm'],
    labs: ['gnrh', 'lh', 'fsh', 't', 'itt', 'sperm', 'inhibin', 'e2', 'dht'],
    presets: [
      { id: 'klinefelter', label: 'Primary hypogonadism (Klinefelter)', caps: { itt: 0.35, sperm: 0.08 }, desc: 'Testicular failure: low testosterone and inhibin B; LH and especially FSH high.', chain: ['↓ Leydig & Sertoli function', '↓ T, ↓ inhibin B', '↑ LH, ↑↑ FSH'] },
      { id: 'secondary', label: 'Secondary (pituitary) hypogonadism', caps: { lh: 0.15 }, mods: {}, desc: 'Gonadotroph failure — low LH/FSH and low testosterone. (FSH capacity is lowered together with LH.)', chain: ['↓ LH/FSH', '↓ T', '↓ spermatogenesis'], also: { fsh: 0.15 } },
      { id: 'kallmann', label: 'Kallmann (GnRH deficiency)', caps: { gnrh: 0.08 }, desc: 'Absent GnRH pulses: all downstream hormones low; anosmia.', chain: ['↓ GnRH', '↓ LH/FSH', '↓ T'] },
      { id: 'exoT', label: 'Exogenous testosterone / anabolic steroids', exo: { t: 2.5 }, desc: 'Serum androgens high, but LH/FSH are suppressed → intratesticular testosterone collapses → **infertility and testicular atrophy**.', chain: ['↑ serum androgen', '⊣ GnRH/LH/FSH', '↓↓ intratesticular T', '↓↓ spermatogenesis'] },
      { id: 'prl', label: 'Hyperprolactinemia', inputs: { prl: 4 }, desc: 'Prolactin suppresses GnRH: low LH and testosterone, low libido.', chain: ['↑ prolactin', '⊣ GnRH', '↓ LH', '↓ T'] },
      { id: 'sertoli', label: 'Sertoli-cell-only', caps: { sperm: 0.06 }, desc: 'Germ-cell aplasia: inhibin B falls → selective FSH rise; LH and testosterone normal.', chain: ['↓ inhibin B', '↑ FSH (selective)', 'LH & T normal'] },
      { id: 'srd5a', label: '5α-reductase deficiency', caps: { dht: 0.1 }, desc: 'Testosterone and LH normal; DHT low (undervirilized external genitalia, normal Wolffian structures).', chain: ['↓ 5α-reductase', '↓ DHT', 'T normal'] },
      { id: 'energy', label: 'Energy deficit', inputs: { energy: 0.3 }, desc: 'Low leptin suppresses kisspeptin/GnRH.', chain: ['↓ leptin', '↓ GnRH', '↓ LH/FSH', '↓ T'] },
    ],
  };

  // ============================ HPG (female) ============================
  N.hpgf = {
    id: 'hpgf', title: 'HPG axis (female)', view: { w: 900, h: 590 },
    bands: BANDS(['Hypothalamus', 'Anterior pituitary', 'Ovary (two-cell model)', 'Targets']),
    nodes: [
      { id: 'energy', label: 'Energy / leptin', input: true, x: 120, y: 70, type: 'process', w: 130 },
      { id: 'prl', label: 'Prolactin', input: true, x: 120, y: 125, type: 'hormone', w: 100, ent: 'prolactin' },
      { id: 'gnrh', label: 'GnRH (pulses)', ent: 'gnrh', x: 450, y: 90, tau: 0.2, terms: [T('energy', 0.5, 'Leptin is permissive.'), T('prl', -0.6, 'Prolactin suppresses kisspeptin/GnRH (lactational amenorrhea).'), FB('e2', -0.4, 'Estradiol negative feedback (most of the cycle).', 'long', { curve: 100, lx: 8 }), FB('prog', -0.6, 'Progesterone slows GnRH pulse frequency (luteal phase).', 'long', { curve: -110 })] },
      { id: 'lh', label: 'LH', ent: 'lh', x: 330, y: 230, tau: 0.25, terms: [T('gnrh', 0.9, 'GnRH → LH.', { endo: true }), FB('e2', -0.3, 'Estradiol feedback at the gonadotroph. **Sustained high estradiol flips this to positive feedback** (LH surge).', 'long', { curve: 50 })] },
      { id: 'fsh', label: 'FSH', ent: 'fsh', x: 590, y: 230, tau: 0.4, terms: [T('gnrh', 0.6, 'GnRH → FSH.', { endo: true }), FB('inhibin', -0.7, 'Inhibin B (granulosa) selectively suppresses FSH.', 'long', { curve: -60 }), T('e2', -0.4, 'Estradiol suppresses FSH.', { hide: true })] },
      { id: 'andro', label: 'Theca: androgens', x: 330, y: 370, type: 'cell', w: 150, h: 46, tau: 0.5, terms: [T('lh', 0.8, 'LH → theca CYP17 → androstenedione.', { endo: true })] },
      { id: 'foll', label: 'Dominant follicle', input: true, x: 790, y: 160, type: 'cell', w: 140 },
      { id: 'e2', label: 'Granulosa: estradiol', ent: 'estradiol', x: 590, y: 370, w: 170, tau: 0.6, terms: [T('andro', 0.6, 'Theca androgens are the substrate (two-cell, two-gonadotropin model).'), T('fsh', 0.6, 'FSH induces granulosa aromatase.', { endo: true }), T('foll', 1, 'Granulosa cell mass of the growing dominant follicle.')] },
      { id: 'inhibin', label: 'Inhibins (A + B)', ent: 'inhibin', x: 790, y: 300, tau: 0.5, terms: [T('fsh', 0.4, 'FSH stimulates granulosa inhibin secretion.'), T('foll', 0.5, 'Granulosa mass: small antral follicles make inhibin B (early follicular); the dominant follicle makes inhibin A (late follicular).'), T('cl', 0.4, 'The corpus luteum secretes inhibin A, helping keep FSH low in the luteal phase.')] },
      { id: 'cl', label: 'Corpus luteum', input: true, x: 790, y: 440, type: 'cell', w: 130 },
      { id: 'prog', label: 'Progesterone', ent: 'progesterone', x: 780, y: 520, tau: 0.6, terms: [T('cl', 1, 'Corpus luteum (LH-supported) secretes progesterone.'), T('lh', 0.3, 'LH supports the corpus luteum.')] },
      { id: 'endo', label: 'Endometrium\n(proliferation)', x: 400, y: 515, type: 'process', w: 150, h: 44, tau: 1, terms: [T('e2', 1, 'Estradiol → ERα → endometrial proliferation.')] },
    ],
    inputs: [{ id: 'foll', label: 'Follicle development' }, { id: 'energy', label: 'Energy availability' }, { id: 'prl', label: 'Prolactin' }, { id: 'cl', label: 'Luteal function' }],
    capacities: [{ id: 'gnrh', label: 'GnRH neurons' }, { id: 'lh', label: 'Gonadotrophs' }, { id: 'e2', label: 'Ovarian follicles' }],
    exogenous: [{ id: 'e2', label: 'Exogenous estrogen' }, { id: 'prog', label: 'Exogenous progestin' }],
    traces: ['gnrh', 'lh', 'fsh', 'e2', 'prog'],
    labs: ['gnrh', 'lh', 'fsh', 'e2', 'prog', 'inhibin', 'andro'],
    presets: [
      { id: 'surge', label: 'Mid-cycle: positive feedback (LH surge)', flips: { lh: { e2: 1.4 }, fsh: { e2: 0.5 }, gnrh: { e2: 0.2 } }, inputs: { foll: 2.5 }, desc: 'Once estradiol from the dominant follicle stays high (~2 days), feedback on the gonadotroph switches from negative to **positive** → LH surge with a smaller FSH surge → ovulation.', chain: ['dominant follicle → sustained ↑ E2', 'feedback switches sign', '↑↑ LH, ↑ FSH surge', 'ovulation'] },
      { id: 'late', label: 'Late follicular (negative feedback)', inputs: { foll: 2.5 }, desc: 'A growing dominant follicle raises estradiol and inhibin; under negative feedback FSH falls (atresia of the other follicles) — compare with the surge preset.', chain: ['↑ follicle mass', '↑ E2, ↑ inhibin', '↓ FSH'] },
      { id: 'luteal', label: 'Luteal phase', inputs: { cl: 6 }, desc: 'Progesterone (with estradiol) slows GnRH pulses: LH and FSH fall.', chain: ['corpus luteum', '↑ progesterone', '⊣ GnRH', '↓ LH/FSH'] },
      { id: 'meno', label: 'Menopause / primary ovarian insufficiency', caps: { e2: 0.06 }, desc: 'Follicle depletion: estradiol and inhibin fall → FSH rises first and most.', chain: ['follicle depletion', '↓ E2, ↓ inhibin B', '↑↑ FSH, ↑ LH'], also: { inhibin: 0.06, andro: 0.6 } },
      { id: 'fha', label: 'Functional hypothalamic amenorrhea', inputs: { energy: 0.3 }, desc: 'Energy deficit/stress suppresses GnRH: low LH, FSH and estradiol.', chain: ['↓ leptin/energy', '↓ GnRH', '↓ LH/FSH', '↓ E2'] },
      { id: 'prl', label: 'Hyperprolactinemia', inputs: { prl: 4 }, desc: 'Prolactin suppresses GnRH → anovulation, amenorrhea (± galactorrhea).', chain: ['↑ prolactin', '⊣ GnRH', '↓ LH/FSH', '↓ E2'] },
      { id: 'ocp', label: 'Combined oral contraceptive', exo: { e2: 1.5, prog: 3 }, desc: 'Exogenous estrogen + progestin suppress GnRH, LH and FSH → no follicle selection or LH surge.', chain: ['exogenous E + P', '⊣ GnRH/LH/FSH', 'no ovulation'] },
    ],
  };
  // fix-ups for presets that need more than one capacity
  ['hpgm', 'hpgf'].forEach((k) => N[k].presets.forEach((p) => { if (p.also) p.caps = Object.assign({}, p.caps, p.also); }));

  // ============================ GH / IGF-1 ============================
  N.gh = {
    id: 'gh', title: 'GH – IGF-1 axis', view: { w: 900, h: 590 },
    bands: BANDS(['Hypothalamus', 'Anterior pituitary (somatotroph)', 'Liver', 'Targets']),
    nodes: [
      { id: 'stim', label: 'Sleep · fasting · exercise\nhypoglycemia', input: true, x: 140, y: 85, type: 'process', w: 190, h: 44 },
      { id: 'nutr', label: 'Nutrition', input: true, x: 780, y: 330, type: 'process', w: 110 },
      { id: 'ghrh', label: 'GHRH', ent: 'ghrh', x: 330, y: 90, tau: 0.2, terms: [T('stim', 0.6, 'Physiological stimuli increase GHRH (and lower somatostatin).'), FB('igf1', -0.4, 'IGF-1 suppresses GHRH.', 'long', { curve: -120 })] },
      { id: 'sst', label: 'Somatostatin', ent: 'somatostatin', x: 600, y: 90, tau: 0.2, terms: [T('stim', -0.4, 'Stimuli reduce somatostatin tone.'), FB('igf1', 0.5, 'IGF-1 stimulates hypothalamic somatostatin (feedback via an inhibitor).', 'long', { curve: 110 }), FB('gh', 0.3, 'GH stimulates somatostatin (short loop).', 'short', { curve: 50 })] },
      { id: 'gh', label: 'GH', ent: 'gh', x: 450, y: 230, tau: 0.3, terms: [T('ghrh', 0.9, 'GHRH → Gs → GH.', { endo: true }), T('sst', -0.9, 'Somatostatin → Gi → inhibits GH release.', { endo: true }), FB('igf1', -0.5, 'IGF-1 directly inhibits somatotrophs.', 'long', { curve: 70 })] },
      { id: 'igf1', label: 'IGF-1', ent: 'igf1', x: 450, y: 370, tau: 1.2, terms: [T('gh', 0.8, 'GH receptor → JAK2 → STAT5b → IGF-1, IGFBP-3, ALS transcription.', { endo: true }), T('nutr', 0.5, 'Malnutrition and insulin deficiency cause hepatic GH resistance.')] },
      { id: 'growth', label: 'Linear growth /\nprotein synthesis', x: 330, y: 515, type: 'process', w: 170, h: 44, tau: 1.5, terms: [T('igf1', 0.8, 'IGF-1R signaling in growth plate chondrocytes and muscle.')] },
      { id: 'lipo', label: 'Lipolysis /\ninsulin antagonism', x: 640, y: 515, type: 'process', w: 170, h: 44, tau: 0.8, terms: [T('gh', 0.7, 'Direct GH actions (independent of IGF-1).')] },
    ],
    inputs: [{ id: 'stim', label: 'GH stimuli' }, { id: 'nutr', label: 'Nutrition' }],
    capacities: [{ id: 'ghrh', label: 'Hypothalamus' }, { id: 'gh', label: 'Somatotrophs' }, { id: 'igf1', label: 'Liver GH response' }],
    exogenous: [{ id: 'igf1', label: 'Exogenous IGF-1 (mecasermin)' }, { id: 'gh', label: 'Exogenous GH' }],
    traces: ['ghrh', 'sst', 'gh', 'igf1'],
    labs: ['ghrh', 'sst', 'gh', 'igf1', 'growth', 'lipo'],
    presets: [
      { id: 'acro', label: 'Acromegaly (somatotroph adenoma)', autos: { gh: 2.5 }, mods: { gh: { sst: 0.3, igf1: 0.2 } }, desc: 'Autonomous GH with blunted feedback: GH and IGF-1 high; GH fails to suppress after oral glucose.', chain: ['adenoma', '↑ GH', '↑ IGF-1', 'acral growth, insulin resistance'] },
      { id: 'ghd', label: 'GH deficiency', caps: { gh: 0.12 }, desc: 'Low GH and IGF-1 → short stature (children), ↑ adiposity.', chain: ['↓ GH', '↓ IGF-1', '↓ growth'] },
      { id: 'laron', label: 'GH insensitivity (Laron)', caps: { igf1: 0.08 }, desc: 'GH receptor defect: IGF-1 very low, so feedback is lost and GH is high.', chain: ['GHR defect', '↓↓ IGF-1', 'loss of feedback', '↑↑ GH'] },
      { id: 'malnut', label: 'Malnutrition', inputs: { nutr: 0.3 }, desc: 'Acquired GH resistance: GH high, IGF-1 low.', chain: ['↓ nutrition', 'hepatic GH resistance', '↓ IGF-1', '↑ GH'] },
      { id: 'sleep', label: 'Deep sleep / fasting', inputs: { stim: 3 }, desc: 'Physiological GH bursts.', chain: ['↑ GHRH, ↓ SST', '↑ GH'] },
    ],
  };

  // ============================ Prolactin ============================
  N.prl = {
    id: 'prl', title: 'Prolactin regulation (dopamine-dominant)', view: { w: 900, h: 590 },
    bands: BANDS(['Hypothalamus (TIDA neurons)', 'Anterior pituitary (lactotroph)', 'Targets', 'Reproductive axis']),
    nodes: [
      { id: 'suck', label: 'Suckling / stress', input: true, x: 140, y: 80, type: 'process', w: 150 },
      { id: 'trh', label: 'TRH', input: true, x: 760, y: 80, type: 'hormone', ent: 'trh' },
      { id: 'estr', label: 'Estrogen\n(pregnancy)', input: true, x: 780, y: 230, type: 'hormone', w: 110, h: 44, ent: 'estradiol' },
      { id: 'da', label: 'Dopamine', ent: 'dopamine', x: 420, y: 90, tau: 0.2, terms: [T('suck', -0.8, 'Suckling and stress inhibit TIDA dopamine neurons.'), FB('prl', 0.5, 'Prolactin stimulates TIDA neurons → more dopamine (short-loop feedback via an inhibitor).', 'short', { curve: -80, w: 0.5 })] },
      { id: 'prl', label: 'Prolactin', ent: 'prolactin', x: 420, y: 235, tau: 0.4, terms: [T('da', -1.2, '**Tonic dopamine (D2, Gi) inhibition is the dominant control** — remove it and prolactin rises.', { endo: true, label: 'portal blood' }), T('trh', 0.4, 'TRH stimulates lactotrophs.'), T('estr', 0.4, 'Estrogen stimulates lactotroph growth and prolactin synthesis.')] },
      { id: 'milk', label: 'Milk synthesis', x: 260, y: 370, type: 'process', w: 140, tau: 1, terms: [T('prl', 0.8, 'PRL-R → JAK2/STAT5 → milk protein genes.')] },
      { id: 'gnrh', label: 'GnRH', ent: 'gnrh', x: 580, y: 370, tau: 0.3, terms: [T('prl', -0.6, 'Prolactin suppresses kisspeptin/GnRH.')] },
      { id: 'lh', label: 'LH → ovulation', ent: 'lh', x: 580, y: 510, tau: 0.3, w: 140, terms: [T('gnrh', 0.9, 'GnRH drives LH.')] },
    ],
    inputs: [{ id: 'suck', label: 'Suckling / stress' }, { id: 'trh', label: 'TRH' }, { id: 'estr', label: 'Estrogen' }],
    capacities: [{ id: 'da', label: 'Dopamine reaching pituitary (stalk)' }],
    exogenous: [{ id: 'da', label: 'Dopamine agonist (cabergoline)' }],
    traces: ['da', 'prl', 'gnrh', 'lh'],
    labs: ['da', 'prl', 'milk', 'gnrh', 'lh'],
    normalText: 'Unique among anterior pituitary hormones, prolactin is held down by the hypothalamus. Anything that interrupts dopamine delivery raises prolactin (Freeman 2000).',
    presets: [
      { id: 'suck', label: 'Suckling', inputs: { suck: 4 }, desc: 'Suckling inhibits TIDA neurons → dopamine falls → prolactin rises → milk; prolactin suppresses GnRH (lactational amenorrhea).', chain: ['suckling', '↓ dopamine', '↑ prolactin', '⊣ GnRH → ↓ LH'] },
      { id: 'stalk', label: 'Stalk compression / section', caps: { da: 0.1 }, desc: 'Dopamine cannot reach the pituitary: prolactin **rises** while other pituitary hormones (which need stimulatory hypothalamic input) fall — the "stalk effect".', chain: ['↓ portal dopamine delivery', 'disinhibition', '↑ prolactin'] },
      { id: 'antipsych', label: 'D2 antagonist drug', mods: { prl: { da: 0.15 } }, desc: 'Antipsychotics/metoclopramide block lactotroph D2 receptors.', chain: ['D2 blockade', '↑ prolactin', '⊣ GnRH'] },
      { id: 'prolactinoma', label: 'Prolactinoma', autos: { prl: 4 }, desc: 'Autonomous prolactin: amenorrhea/galactorrhea or hypogonadism; dopamine agonists treat it.', chain: ['adenoma', '↑↑ prolactin', '⊣ GnRH', 'hypogonadism'] },
      { id: 'hypothyroid', label: 'Primary hypothyroidism', inputs: { trh: 3 }, desc: 'High TRH stimulates lactotrophs.', chain: ['↓ T4', '↑ TRH', '↑ prolactin'] },
      { id: 'pregnancy', label: 'Pregnancy', inputs: { estr: 5 }, desc: 'Estrogen drives lactotroph hyperplasia; lactation is held back until progesterone falls at delivery.', chain: ['↑ estrogen', '↑ prolactin'] },
    ],
  };

  // ============================ ADH / water ============================
  N.adh = {
    id: 'adh', title: 'ADH and water balance', view: { w: 900, h: 560 },
    bands: [{ y: 20, h: 128, label: 'Hypothalamus (osmoreceptors, SON/PVN)' }, { y: 160, h: 128, label: 'Posterior pituitary' }, { y: 300, h: 128, label: 'Kidney collecting duct' }, { y: 440, h: 110, label: 'Plasma' }],
    nodes: [
      { id: 'dehyd', label: 'Water deficit', input: true, x: 140, y: 495, type: 'process', w: 130 },
      { id: 'vol', label: 'Effective volume', input: true, x: 140, y: 230, type: 'process', w: 140 },
      { id: 'posm', label: 'Plasma osmolality', x: 450, y: 495, type: 'metabolite', w: 160, tau: 0.8, terms: [T('dehyd', 0.5, 'Net water loss concentrates plasma.'), FB('h2o', -0.3, 'Water reabsorption dilutes plasma — closing the loop.', 'long', { curve: -60 })] },
      { id: 'adh', label: 'ADH', ent: 'adh', x: 450, y: 225, tau: 0.25, terms: [T('posm', 3, 'Osmoreceptors are exquisitely sensitive: ~1% change in osmolality changes ADH.', { curve: 120, label: 'osmoreceptors' }), T('vol', -1.2, 'Large (>~10%) falls in volume/pressure stimulate ADH via baroreceptors, overriding osmolality.')] },
      { id: 'thirst', label: 'Thirst', x: 720, y: 90, type: 'process', w: 110, tau: 0.5, terms: [T('posm', 3, 'Hypothalamic osmoreceptors drive thirst.')] },
      { id: 'h2o', label: 'Water reabsorption\n(V2 → AQP2)', x: 450, y: 365, type: 'process', w: 190, h: 44, tau: 0.6, terms: [T('adh', 0.6, 'V2 (Gs) → cAMP → PKA → AQP2 insertion.', { endo: true })] },
      { id: 'uosm', label: 'Urine osmolality', x: 740, y: 365, type: 'metabolite', w: 150, tau: 0.6, terms: [T('h2o', 1.2, 'More water reabsorbed → more concentrated urine.')] },
    ],
    inputs: [{ id: 'dehyd', label: 'Water deficit' }, { id: 'vol', label: 'Effective volume' }],
    capacities: [{ id: 'adh', label: 'ADH secretion' }, { id: 'h2o', label: 'Renal ADH response' }],
    traces: ['posm', 'adh', 'h2o', 'uosm'],
    labs: ['posm', 'adh', 'h2o', 'uosm', 'thirst'],
    presets: [
      { id: 'dehyd', label: 'Dehydration', inputs: { dehyd: 2 }, desc: 'Osmolality rises → ADH and thirst rise → concentrated urine.', chain: ['↑ osmolality', '↑ ADH', '↑ water reabsorption', 'concentrated urine'] },
      { id: 'waterload', label: 'Water load', inputs: { dehyd: 0.5 }, desc: 'Osmolality falls → ADH suppressed → dilute urine (water diuresis).', chain: ['↓ osmolality', '↓ ADH', 'dilute urine'] },
      { id: 'cdi', label: 'Central diabetes insipidus', caps: { adh: 0.06 }, desc: 'No ADH: dilute urine despite rising osmolality; responds to desmopressin.', chain: ['↓ ADH', '↓ AQP2', 'dilute urine', '↑ osmolality → thirst'] },
      { id: 'ndi', label: 'Nephrogenic DI', caps: { h2o: 0.1 }, desc: 'Collecting duct unresponsive (V2/AQP2 defect, lithium): ADH high, urine dilute.', chain: ['V2/AQP2 resistance', 'dilute urine', '↑ osmolality', '↑↑ ADH'] },
      { id: 'siadh', label: 'SIADH', autos: { adh: 2.5 }, desc: 'Inappropriate ADH: concentrated urine with **low** plasma osmolality (hyponatremia).', chain: ['autonomous ADH', '↑ water retention', '↓ osmolality (hyponatremia)', 'urine inappropriately concentrated'] },
      { id: 'hemorrhage', label: 'Hemorrhage', inputs: { vol: 0.5 }, desc: 'Volume depletion stimulates ADH even as osmolality falls — volume defence wins.', chain: ['↓ volume', 'baroreceptors', '↑ ADH', '↓ osmolality'] },
    ],
  };

  // ============================ RAAS ============================
  N.raas = {
    id: 'raas', title: 'Renin–angiotensin–aldosterone system', view: { w: 900, h: 560 },
    bands: [{ y: 20, h: 128, label: 'Kidney (juxtaglomerular apparatus)' }, { y: 160, h: 128, label: 'Circulation (lung ACE)' }, { y: 300, h: 128, label: 'Adrenal zona glomerulosa' }, { y: 440, h: 110, label: 'Kidney collecting duct / plasma' }],
    nodes: [
      { id: 'perf', label: 'Renal perfusion', input: true, x: 140, y: 90, type: 'process', w: 140 },
      { id: 'kin', label: 'K⁺ intake', input: true, x: 140, y: 365, type: 'process', w: 110 },
      { id: 'renin', label: 'Renin', ent: 'renin', type: 'enzyme', x: 450, y: 90, tau: 0.3, terms: [T('perf', -1.2, 'Low afferent arteriolar pressure, low macula-densa NaCl and β1 sympathetic input release renin.'), FB('vol', -1.2, 'Na⁺ retention restores volume and suppresses renin.', 'long', { curve: -150 }), FB('ang', -0.3, 'Angiotensin II directly inhibits renin (short loop).', 'short', { curve: 50 })] },
      { id: 'ang', label: 'Angiotensin II', ent: 'angii', x: 450, y: 225, tau: 0.2, terms: [T('renin', 0.9, 'Renin cleaves angiotensinogen; ACE converts Ang I → Ang II.', { endo: true })] },
      { id: 'kp', label: 'Plasma K⁺', type: 'ion', x: 260, y: 495, w: 90, tau: 0.6, terms: [T('kin', 0.5, 'K⁺ load.'), FB('aldo', -0.5, 'Aldosterone → ROMK/ENaC → K⁺ secretion.', 'long', { curve: 60 })] },
      { id: 'aldo', label: 'Aldosterone', ent: 'aldosterone', x: 450, y: 365, tau: 0.5, terms: [T('ang', 0.8, 'AT1 (Gq) → CYP11B2.', { endo: true }), T('kp', 1.5, 'Hyperkalemia depolarizes glomerulosa cells → Ca²⁺ → aldosterone.', { curve: -40 })] },
      { id: 'vol', label: 'Na⁺ retention /\nECF volume', x: 660, y: 495, type: 'process', w: 160, h: 44, tau: 1, terms: [T('aldo', 0.4, 'ENaC and Na⁺/K⁺-ATPase in principal cells.'), T('ang', 0.2, 'Angiotensin II increases proximal Na⁺ reabsorption.'), T('perf', 0.3, 'Effective circulating volume itself.', { hide: true })] },
    ],
    inputs: [{ id: 'perf', label: 'Renal perfusion / salt' }, { id: 'kin', label: 'K⁺ intake' }],
    capacities: [{ id: 'renin', label: 'JG cells (renin)' }, { id: 'ang', label: 'ACE / AT1 signaling' }, { id: 'aldo', label: 'Zona glomerulosa' }],
    traces: ['renin', 'ang', 'aldo', 'kp', 'vol'],
    labs: ['renin', 'ang', 'aldo', 'kp', 'vol'],
    presets: [
      { id: 'pa', label: 'Primary aldosteronism', autos: { aldo: 3 }, desc: 'Autonomous aldosterone: hypertension, hypokalemia, **suppressed renin** (high aldosterone:renin ratio).', chain: ['↑ aldosterone', '↑ Na⁺ retention', '⊣ renin', '↓ K⁺'] },
      { id: 'ras', label: 'Renal artery stenosis', inputs: { perf: 0.45 }, desc: 'Secondary hyperaldosteronism: renin and aldosterone both high.', chain: ['↓ renal perfusion', '↑ renin', '↑ Ang II', '↑ aldosterone'] },
      { id: 'addison', label: 'Primary adrenal insufficiency', caps: { aldo: 0.1 }, desc: 'Low aldosterone, high renin, hyperkalemia, volume depletion.', chain: ['↓ aldosterone', '↓ Na⁺ retention', '↑ renin', '↑ K⁺'] },
      { id: 'acei', label: 'ACE inhibitor / ARB', caps: { ang: 0.2 }, desc: 'Ang II falls → aldosterone falls (K⁺ may rise); loss of feedback raises renin.', chain: ['⊣ Ang II', '↓ aldosterone', '↑ renin'] },
      { id: 'hyperk', label: 'High K⁺ intake', inputs: { kin: 3 }, desc: 'K⁺ directly stimulates aldosterone independent of renin.', chain: ['↑ K⁺', '↑ aldosterone', '↑ K⁺ excretion'] },
    ],
  };

  // ============================ Calcium / PTH / vitamin D / FGF23 ============================
  N.calcium = {
    id: 'calcium', title: 'Calcium–phosphate regulation', view: { w: 960, h: 620 },
    bands: [
      { x: 10, y: 20, w: 300, h: 250, label: 'Parathyroid' }, { x: 330, y: 20, w: 620, h: 250, label: 'Kidney' },
      { x: 10, y: 290, w: 300, h: 320, label: 'Gut' }, { x: 330, y: 290, w: 300, h: 320, label: 'Plasma' }, { x: 650, y: 290, w: 300, h: 320, label: 'Bone' },
    ],
    nodes: [
      { id: 'dietca', label: 'Dietary Ca', input: true, x: 90, y: 560, type: 'process', w: 110 },
      { id: 'dietp', label: 'Dietary phosphate', input: true, x: 230, y: 560, type: 'process', w: 130 },
      { id: 'd25', label: '25-OH vitamin D', input: true, x: 560, y: 60, type: 'metabolite', w: 140, ent: 'calcidiol' },
      { id: 'pth', label: 'PTH', ent: 'pth', x: 160, y: 120, tau: 0.15, terms: [FB('ca', -2.2, 'Ca²⁺ → CaSR (Gq/Gi) → ↓ PTH secretion — steep sigmoidal relationship (Brown 1993).', 'long', { curve: 30 }), T('phos', 0.3, 'Hyperphosphatemia stimulates PTH (directly and by lowering ionized Ca).', { hide: true }), FB('d125', -0.3, 'Calcitriol → VDR → ↓ PTH gene transcription.', 'long', { curve: -40 }), T('fgf23', -0.2, 'FGF23 suppresses PTH.', { hide: true })] },
      { id: 'pthr', label: 'PTH1R activation', type: 'receptor', ent: 'pth1r', x: 160, y: 225, tau: 0.1, terms: [T('pth', 1, 'PTH binds PTH1R on kidney and bone cells.', { endo: true })] },
      { id: 'd125', label: '1,25-(OH)₂D\n(calcitriol)', ent: 'calcitriol', x: 780, y: 70, tau: 0.6, h: 44, terms: [T('pthr', 0.6, '**Direct**: PTH induces CYP27B1 (1α-hydroxylase).', { label: 'direct' }), T('phos', -0.4, 'Hypophosphatemia stimulates 1α-hydroxylase.'), T('fgf23', -0.6, 'FGF23 suppresses CYP27B1 and induces CYP24A1.'), T('d25', 0.5, 'Substrate availability.'), T('ca', -0.5, 'Hypercalcemia directly suppresses renal 1α-hydroxylase (and induces CYP24A1), independent of PTH.', { hide: true })] },
      { id: 'renalca', label: 'Renal Ca²⁺ reabsorption', x: 470, y: 160, type: 'process', w: 200, tau: 0.3, terms: [T('pthr', 0.6, '**Direct**: PTH → TRPV5 in the distal convoluted tubule.', { label: 'direct' }), T('ca', -0.4, 'Ca²⁺ → CaSR in thick ascending limb → claudin-14 → ↓ paracellular reabsorption.'), T('d125', 0.15, 'Calcitriol up-regulates TRPV5 and calbindin-D28k in the distal tubule.', { hide: true })] },
      { id: 'pexcr', label: 'Fractional phosphate excretion', desc: 'Fraction of filtered phosphate excreted (the inverse of the renal phosphate threshold, TmP/GFR). Set by PTH and FGF23; together with intestinal absorption and bone release it determines plasma phosphate.', x: 760, y: 200, type: 'process', w: 210, tau: 0.3, terms: [T('pthr', 0.9, '**Direct**: PTH internalizes NaPi-IIa/IIc → phosphaturia — the main cause of hypophosphatemia in hyperparathyroid states, including secondary hyperparathyroidism of vitamin D deficiency.', { label: 'direct' }), T('fgf23', 0.45, 'FGF23–Klotho internalizes NaPi-IIa/IIc.')] },
      { id: 'gutca', label: 'Intestinal Ca²⁺ absorption', x: 160, y: 360, type: 'process', w: 200, tau: 0.6, terms: [T('d125', 0.8, '**Via calcitriol**: VDR → TRPV6, calbindin-D9k, PMCA1b. PTH acts on the gut only through vitamin D.', { label: 'via 1,25-D', endo: true }), T('dietca', 0.5, 'Supply.')] },
      { id: 'gutp', label: 'Intestinal phosphate absorption', x: 160, y: 460, type: 'process', w: 220, tau: 0.6, terms: [T('d125', 0.4, '**Via calcitriol**: NaPi-IIb.', { label: 'via 1,25-D' }), T('dietp', 0.6, 'Supply.')] },
      { id: 'res', label: 'Bone resorption', ent: 'boneresorp', x: 800, y: 380, type: 'process', w: 160, tau: 0.6, terms: [T('pthr', 0.7, '**Direct**: PTH → osteoblast RANKL ↑, OPG ↓ → osteoclastogenesis.', { label: 'direct' }), T('d125', 0.2, 'Calcitriol also increases RANKL.')] },
      { id: 'fgf23', label: 'FGF23', ent: 'fgf23', x: 800, y: 520, tau: 0.8, terms: [T('d125', 0.6, 'Calcitriol induces FGF23 (protects from vitamin D excess).'), T('phos', 0.6, 'Phosphate load increases FGF23.')] },
      { id: 'ca', label: 'Ionized Ca²⁺', ent: 'ca', type: 'ion', x: 480, y: 400, w: 120, h: 40, tau: 0.3, terms: [T('gutca', 0.35, 'Absorbed calcium.'), T('res', 0.3, 'Calcium released from bone.'), T('renalca', 0.35, 'Calcium reclaimed by the kidney.')] },
      { id: 'phos', label: 'Phosphate', ent: 'phosphate', type: 'ion', x: 480, y: 530, w: 120, h: 40, tau: 0.4, terms: [T('gutp', 0.3, 'Absorbed phosphate.'), T('res', 0.2, 'Released with bone mineral.'), T('pexcr', -0.9, 'Higher fractional excretion lowers the renal phosphate threshold and so plasma phosphate.')] },
    ],
    inputs: [{ id: 'dietca', label: 'Dietary Ca' }, { id: 'dietp', label: 'Dietary phosphate' }, { id: 'd25', label: 'Vitamin D status (25-OH-D)' }],
    capacities: [{ id: 'pth', label: 'Parathyroid' }, { id: 'd125', label: 'Renal 1α-hydroxylase' }, { id: 'pexcr', label: 'Renal phosphate clearance (GFR)' }],
    exogenous: [{ id: 'd125', label: 'Calcitriol (drug)' }],
    traces: ['ca', 'phos', 'pth', 'd125', 'fgf23'],
    labs: ['ca', 'phos', 'pth', 'd125', 'fgf23', 'gutca', 'res', 'renalca', 'pexcr'],
    speed: 2,
    normalText: '**Direct** PTH actions (bone, kidney Ca²⁺ and phosphate handling, 1α-hydroxylase) are labelled "direct"; intestinal effects occur only **via calcitriol**.',
    presets: [
      { id: 'phpt', label: 'Primary hyperparathyroidism', autos: { pth: 2.5 }, desc: 'Parathyroid adenoma: Ca ↑, phosphate ↓ (phosphaturia), calcitriol ↑, PTH inappropriately high.', chain: ['autonomous PTH', '↑ resorption, ↑ renal Ca reabsorption, ↑ 1α-OH', '↑ Ca', 'phosphaturia → ↓ phosphate'] },
      { id: 'hypopara', label: 'Hypoparathyroidism', caps: { pth: 0.08 }, desc: 'Post-surgical/autoimmune: Ca ↓, phosphate ↑, calcitriol ↓.', chain: ['↓ PTH', '↓ resorption, ↓ 1α-OH, ↓ phosphaturia', '↓ Ca, ↑ phosphate'] },
      { id: 'vitd', label: 'Vitamin D deficiency', inputs: { d25: 0.1 }, desc: 'Low calcitriol substrate → less Ca absorption → **secondary hyperparathyroidism** keeps Ca near normal at the cost of bone and phosphate.', chain: ['↓ 25-OH-D', '↓ gut Ca absorption', '↓ Ca', '↑ PTH (secondary)', '↓ phosphate'] },
      { id: 'ckd', label: 'Advanced chronic kidney disease', caps: { pexcr: 0.25, d125: 0.3, fgf23: 4 }, mods: { pexcr: { fgf23: 0.4 } }, desc: 'Falling GFR retains phosphate → FGF23 rises early and steeply (phosphate load, reduced renal clearance, and Klotho loss making the kidney FGF23-resistant) → calcitriol ↓ (also less renal mass) → Ca ↓ → secondary hyperparathyroidism (CKD-MBD). In early CKD the FGF23/PTH rise keeps phosphate normal; once GFR is low enough, hyperphosphatemia appears.', chain: ['↓ GFR', '↑ phosphate', '↑↑ FGF23', '↓ calcitriol', '↑ PTH'] },
      { id: 'fgf23', label: 'FGF23 excess (XLH / TIO)', autos: { fgf23: 4 }, desc: 'Renal phosphate wasting with inappropriately low calcitriol.', chain: ['↑ FGF23', 'phosphaturia + ↓ 1α-OH', '↓↓ phosphate', 'osteomalacia'] },
      { id: 'pthrp', label: 'Humoral hypercalcemia (PTHrP)', autos: { pthr: 2.5 }, mods: { d125: { pthr: 0.3 } }, desc: 'Tumor PTHrP activates PTH1R: Ca ↑, phosphate ↓, **PTH suppressed** by CaSR. Unlike primary hyperparathyroidism, **calcitriol is low–normal**: PTHrP is a weak stimulator of renal 1α-hydroxylase in vivo and hypercalcemia suppresses it, so gut Ca absorption is not increased.', chain: ['PTHrP → PTH1R', '↑ bone resorption, ↑ renal Ca reabsorption', '↑ Ca', '⊣ PTH (suppressed)', 'calcitriol low–normal'] },
      { id: 'granuloma', label: 'Granulomatous disease (sarcoid)', autos: { d125: 3.5 }, desc: 'Macrophage 1α-hydroxylase escapes regulation: calcitriol ↑ → Ca ↑, PTH ↓.', chain: ['extrarenal 1α-OH', '↑ calcitriol', '↑ gut Ca absorption', '↑ Ca', '⊣ PTH'] },
      { id: 'fhh', label: 'Familial hypocalciuric hypercalcemia', mods: { pth: { ca: 0.75 }, renalca: { ca: 0.6 } }, desc: 'Heterozygous inactivating CaSR mutation raises the set-point: **mild** hypercalcemia, normal or mildly raised PTH, and inappropriately **low urinary Ca** (CaSR in the thick ascending limb no longer brakes Ca reabsorption; Ca/Cr clearance ratio < 0.01). Benign — parathyroidectomy does not cure it.', chain: ['CaSR less sensitive', 'set-point ↑', '↑ Ca with unsuppressed PTH'] },
    ],
  };

  // ============================ Feedback motifs ============================
  N.motif_neg = {
    id: 'motif_neg', title: 'Negative feedback', view: { w: 700, h: 420 }, speed: 3,
    nodes: [
      { id: 'drive', label: 'Upstream drive', input: true, x: 120, y: 80, type: 'process' },
      { id: 'a', label: 'Hormone A\n(trophic)', x: 350, y: 80, h: 44, tau: 0.3, terms: [T('drive', 1, 'Drive.'), FB('b', -0.9, 'Hormone B inhibits A.', 'long', { curve: 90 })] },
      { id: 'b', label: 'Hormone B\n(target)', x: 350, y: 280, h: 44, tau: 0.8, terms: [T('a', 1, 'A stimulates B.')] },
    ],
    inputs: [{ id: 'drive', label: 'Upstream drive' }], capacities: [{ id: 'b', label: 'Target gland' }], exogenous: [{ id: 'b', label: 'Exogenous B' }], traces: ['a', 'b'], labs: ['a', 'b'],
    presets: [{ id: 'gland', label: 'Target gland fails', caps: { b: 0.2 }, desc: 'B falls; loss of feedback raises A — partially compensating.' }, { id: 'exo', label: 'Give exogenous B', exo: { b: 2 }, desc: 'A falls; endogenous B falls.' }],
  };
  N.motif_pos = {
    id: 'motif_pos', title: 'Positive feedback (oxytocin – Ferguson reflex)', view: { w: 700, h: 420 }, speed: 1.5,
    nodes: [
      { id: 'labor', label: 'Labor onset', input: true, x: 120, y: 80, type: 'process' },
      { id: 'oxy', label: 'Oxytocin', ent: 'oxytocin', x: 360, y: 80, tau: 0.4, terms: [T('labor', 0.6, 'Onset of labor.'), FB('stretch', 0.95, 'Cervical stretch → afferents → more oxytocin.', 'long', { curve: 90 })] },
      { id: 'contr', label: 'Uterine contraction', x: 360, y: 200, type: 'process', w: 170, tau: 0.4, terms: [T('oxy', 1, 'OT receptor (Gq) → Ca²⁺ → myometrial contraction.')] },
      { id: 'stretch', label: 'Cervical stretch', x: 360, y: 320, type: 'process', w: 150, tau: 0.4, terms: [T('contr', 1, 'Contractions push the fetus against the cervix.')] },
    ],
    inputs: [{ id: 'labor', label: 'Labor stimulus' }], capacities: [{ id: 'stretch', label: 'Delivery (stretch removed)' }], traces: ['oxy', 'contr', 'stretch'], labs: ['oxy', 'contr', 'stretch'],
    normalText: 'Loop gain just under 1 here so the loop amplifies without running away. Raise the labor stimulus to see escalation; "Delivery" removes the stretch stimulus and breaks the loop.',
    presets: [{ id: 'labor', label: 'Labor', inputs: { labor: 3 }, desc: 'Each contraction increases the stimulus for the next — escalation until delivery.' }, { id: 'delivery', label: 'Delivery', inputs: { labor: 3 }, caps: { stretch: 0.1 }, desc: 'Removing the stimulus terminates positive feedback.' }],
  };
  N.motif_ff = {
    id: 'motif_ff', title: 'Feed-forward: incretins anticipate the glucose rise', view: { w: 700, h: 420 }, speed: 1.2,
    nodes: [
      { id: 'meal', label: 'Meal in gut', input: true, x: 120, y: 80, type: 'process' },
      { id: 'glp1', label: 'GLP-1 / GIP', ent: 'glp1', x: 360, y: 80, tau: 0.15, terms: [T('meal', 1, 'L- and K-cells sense luminal nutrients within minutes.')] },
      { id: 'glc', label: 'Plasma glucose', ent: 'glucose', type: 'metabolite', x: 140, y: 300, tau: 1.2, terms: [T('meal', 0.5, 'Absorbed glucose (slower).'), FB('ins', -0.6, 'Insulin promotes disposal.', 'long', { curve: -50 })] },
      { id: 'ins', label: 'Insulin', ent: 'insulin', x: 450, y: 300, tau: 0.3, terms: [T('glc', 1.2, 'Glucose-stimulated secretion (feedback).'), T('glp1', 0.6, 'Incretin potentiation arrives first (feed-forward).', { fb: 'ff', curve: 0 })] },
    ],
    inputs: [{ id: 'meal', label: 'Meal size' }], capacities: [{ id: 'glp1', label: 'Incretin effect' }], traces: ['glp1', 'glc', 'ins'], labs: ['glp1', 'glc', 'ins'],
    normalText: 'Press **Eat a meal**: GLP-1 and insulin begin rising *before* glucose peaks — feed-forward control limits the excursion. Repeat with the incretin effect impaired (as in type 2 diabetes).',
    presets: [{ id: 'noincretin', label: 'Impaired incretin effect', caps: { glp1: 0.2 }, desc: 'Without feed-forward the glucose excursion is larger and insulin lags.' }],
  };
})();
