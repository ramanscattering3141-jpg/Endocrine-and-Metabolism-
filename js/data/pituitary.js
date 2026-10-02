/* Pituitary integration: each axis's effects on organ systems, cross-axis interactions and
 * multi-step scenarios. Sources: Kovacs & Ojeda Ch5, 11, 12, 13; Molina Ch3, 4, 9, 10;
 * Freeman 2000 (prolactin); Bianco 2002 (deiodinases). */
(function () {
  const D = window.EP.data;
  D.pit = {};
  // ---------- columns ----------
  D.pit.hyp = [
    { id: 'ghrh', label: 'GHRH', sign: '+', axis: 'gh' }, { id: 'sst', label: 'Somatostatin', sign: '−', axis: 'gh' },
    { id: 'da', label: 'Dopamine', sign: '−', axis: 'prl', ent: 'dopamine' }, { id: 'crh', label: 'CRH (+ AVP)', sign: '+', axis: 'hpa', ent: 'crh' },
    { id: 'trh', label: 'TRH', sign: '+', axis: 'hpt', ent: 'trh' }, { id: 'gnrh', label: 'GnRH (pulses)', sign: '+', axis: 'hpg', ent: 'gnrh' },
    { id: 'magno', label: 'SON/PVN neurons', sign: '+', axis: 'post', ent: 'hypothalamus' },
  ];
  D.pit.cells = [
    { id: 'somato', label: 'Somatotroph · GH', axis: 'gh', ent: 'somatotroph' }, { id: 'lacto', label: 'Lactotroph · PRL', axis: 'prl', ent: 'lactotroph' },
    { id: 'cortico', label: 'Corticotroph · ACTH', axis: 'hpa', ent: 'corticotroph' }, { id: 'thyro', label: 'Thyrotroph · TSH', axis: 'hpt', ent: 'thyrotroph' },
    { id: 'gonado', label: 'Gonadotroph · LH/FSH', axis: 'hpg', ent: 'gonadotroph' }, { id: 'postlobe', label: 'Posterior lobe', axis: 'post', ent: 'postpit' },
  ];
  D.pit.horm = [
    { id: 'gh', label: 'GH / IGF-1', axis: 'gh', ent: 'gh' }, { id: 'prl', label: 'Prolactin', axis: 'prl', ent: 'prolactin' },
    { id: 'cort', label: 'Cortisol (adrenal)', axis: 'hpa', ent: 'cortisol' }, { id: 'th', label: 'T4 / T3 (thyroid)', axis: 'hpt', ent: 't3' },
    { id: 'sex', label: 'Sex steroids (gonads)', axis: 'hpg', ent: 'testosterone' }, { id: 'adh', label: 'ADH · oxytocin', axis: 'post', ent: 'adh' },
  ];
  D.pit.sys = [
    { id: 'metab', label: 'Liver & glucose' }, { id: 'adipose', label: 'Adipose' }, { id: 'muscle', label: 'Muscle' }, { id: 'bone', label: 'Bone & growth' },
    { id: 'cv', label: 'Heart & vessels' }, { id: 'kidney', label: 'Kidney & water' }, { id: 'brain', label: 'Brain & behaviour' }, { id: 'immune', label: 'Immune system' },
    { id: 'repro', label: 'Reproduction' }, { id: 'breast', label: 'Breast' }, { id: 'skin', label: 'Skin & hair' },
  ];
  D.pit.axisNames = { gh: 'GH – IGF-1', prl: 'Prolactin', hpa: 'HPA', hpt: 'HPT', hpg: 'HPG', post: 'Posterior pituitary' };
  D.pit.axisPage = { gh: 'gh', prl: 'prl', hpa: 'hpa', hpt: 'hpt', hpg: 'hpgf', post: 'posterior' };
  // ---------- hormone → system effects (what the axis does to the rest of the body) ----------
  const E = (h, sys, effect, mech) => ({ h, sys, effect, mech });
  D.pit.effects = [
    E('gh', 'metab', '↑ hepatic glucose output, insulin antagonism; ↑ IGF-1, IGFBP-3, ALS', 'GHR → JAK2/STAT5 in hepatocytes; post-receptor antagonism of insulin (diabetogenic).'),
    E('gh', 'adipose', '↑ lipolysis, ↓ fat mass', 'Direct GH action, independent of IGF-1.'),
    E('gh', 'muscle', '↑ protein synthesis, ↑ lean mass', 'GH and IGF-1 are anabolic (positive nitrogen balance).'),
    E('gh', 'bone', 'Linear growth at the growth plate; bone turnover', 'IGF-1 (endocrine and local) drives chondrocyte proliferation; requires thyroid hormone and is opposed by excess glucocorticoid (Kovacs Ch11).'),
    E('gh', 'cv', 'Excess → cardiomyopathy, hypertension', 'Chronic GH/IGF-1 excess (acromegaly).'),
    E('gh', 'kidney', 'Na⁺ and water retention (excess)', 'Contributes to soft-tissue swelling in acromegaly.'),
    E('prl', 'breast', 'Milk protein synthesis, lobuloalveolar development', 'PRL-R → JAK2/STAT5.'),
    E('prl', 'repro', '⊣ GnRH → ↓ LH/FSH → anovulation, ↓ testosterone', 'Prolactin inhibits kisspeptin/GnRH neurons — lactational amenorrhea (Molina Ch3, Kovacs Ch5).'),
    E('prl', 'bone', '↓ bone density (via hypogonadism)', 'Secondary to sex-steroid deficiency.'),
    E('prl', 'brain', 'Maternal behaviour; short-loop ↑ hypothalamic dopamine', 'PRL receptors on TIDA neurons (Freeman 2000).'),
    E('cort', 'metab', '↑ gluconeogenesis, ↑ glycogen storage, insulin resistance', 'GR → PEPCK/G6Pase; post-receptor insulin antagonism (Molina Ch10).'),
    E('cort', 'adipose', 'Permissive lipolysis; visceral fat with excess', 'Synergy with catecholamines and GH.'),
    E('cort', 'muscle', '↑ proteolysis, proximal myopathy with excess', 'Supplies amino acids for gluconeogenesis.'),
    E('cort', 'bone', '↓ osteoblast function → bone loss; growth suppression', 'Also inhibits sex-steroid-driven remodeling (Molina Ch10).'),
    E('cort', 'cv', 'Maintains vascular tone (permissive for catecholamines); excess → hypertension', 'Glucocorticoids up-regulate adrenergic responsiveness.'),
    E('cort', 'immune', 'Anti-inflammatory, ↓ cytokines, ↑ infection risk', 'GR tethering ⊣ NF-κB/AP-1 (Molina Ch10).'),
    E('cort', 'kidney', 'Free-water excretion; MR protected by 11β-HSD2', 'Cortisol deficiency impairs water excretion (hyponatremia).'),
    E('cort', 'brain', 'Mood, memory, appetite; ⊣ CRH/ACTH', 'GR/MR in hippocampus and hypothalamus.'),
    E('cort', 'skin', 'Thin skin, striae (excess); hyperpigmentation when ACTH is high', 'Hyperpigmentation reflects ACTH/POMC, not cortisol.'),
    E('th', 'metab', '↑ basal metabolic rate, ↑ gluconeogenesis and glycogenolysis, ↑ LDL-receptor (↓ LDL)', 'T3 → TR/RXR on target genes (Kovacs Ch12).'),
    E('th', 'cv', '↑ heart rate and contractility, ↓ systemic vascular resistance', '↑ β1-receptors, α-MHC, SERCA2.'),
    E('th', 'bone', 'Required for linear growth and skeletal maturation; excess → bone loss', 'Thyroid hormone is essential for normal linear growth (Kovacs Ch11).'),
    E('th', 'brain', 'Brain development (fetal/neonatal), mood, reflexes', 'Deficiency in infancy → cretinism.'),
    E('th', 'muscle', 'Thermogenesis, protein turnover', 'Na⁺/K⁺-ATPase, uncoupling.'),
    E('th', 'adipose', 'Brown-fat thermogenesis, lipolysis', 'UCP1, local D2.'),
    E('th', 'skin', 'Dry skin and hair loss (deficiency)', ''),
    E('sex', 'repro', 'Gametogenesis, cycle, secondary sex characteristics', 'LH → theca/Leydig; FSH → granulosa/Sertoli.'),
    E('sex', 'bone', 'Bone density; estrogen closes epiphyses (both sexes)', 'Estrogen ↓ RANKL, ↑ OPG.'),
    E('sex', 'muscle', 'Testosterone ↑ muscle mass', 'Androgen receptor.'),
    E('sex', 'metab', 'Estrogen ↑ hepatic TBG, CBG and SHBG', 'Raises *total* T4 and cortisol without changing free hormone (Kovacs Ch12, Ch13).'),
    E('sex', 'skin', 'Androgens → hair, sebum (DHT)', '5α-reductase in skin.'),
    E('sex', 'brain', 'Libido; feedback on GnRH (± LH surge)', 'Kisspeptin neurons.'),
    E('adh', 'kidney', 'V2 → aquaporin-2 → water reabsorption', 'Osmotic control (Kovacs Ch6).'),
    E('adh', 'cv', 'V1a vasoconstriction (large volume losses)', ''),
    E('adh', 'brain', 'V1b potentiates CRH at corticotrophs', 'Link between water and stress axes.'),
    E('adh', 'breast', 'Oxytocin: milk ejection', 'Myoepithelial contraction (suckling reflex).'),
    E('adh', 'repro', 'Oxytocin: uterine contraction (Ferguson reflex)', 'Positive feedback in labour.'),
  ];
  // ---------- cross-axis interactions ----------
  const X = (from, to, sign, why) => ({ from, to, sign, why });
  D.pit.cross = [
    X('cort', 'thyro', '−', 'Glucocorticoids (and CRH) suppress TSH and peripheral 5′-deiodination (Molina Ch4, Ch10).'),
    X('cort', 'gonado', '−', 'CRH, β-endorphin and cortisol suppress GnRH, LH and FSH; gonadotropin resistance at the gonad (Molina Ch10).'),
    X('cort', 'somato', '−', 'Chronic HPA activation suppresses GH release and IGF-1 action (Molina Ch10).'),
    X('th', 'lacto', '+', 'In primary hypothyroidism, raised TRH stimulates lactotrophs → mild hyperprolactinemia (Molina Ch3).'),
    X('th', 'somato', '+', 'Thyroid hormone is required for normal GH secretion and linear growth (Kovacs Ch11).'),
    X('prl', 'gonado', '−', 'Prolactin suppresses kisspeptin/GnRH (Molina Ch3).'),
    X('sex', 'somato', '+', 'Sex steroids (estrogen) amplify GH secretion — the pubertal growth spurt (Kovacs Ch11).'),
    X('sex', 'lacto', '+', 'Estrogen stimulates lactotroph growth and prolactin synthesis (Freeman 2000).'),
    X('adh', 'cortico', '+', 'AVP (V1b) synergizes with CRH on corticotrophs.'),
    X('sst', 'thyro', '−', 'Somatostatin also inhibits TSH (Molina Ch4).'),
    X('da', 'thyro', '−', 'Dopamine inhibits TSH as well as prolactin (Molina Ch4).'),
  ];
  // ---------- scenarios (step-by-step) ----------
  const S = (text, marks, links) => ({ text, marks, links: links || [] });
  D.pit.scenarios = [
    { id: 'stress', label: 'Chronic stress / Cushing', src: 'Molina Ch10',
      steps: [
        S('**Chronic HPA activation**: CRH and ACTH stay high, so does cortisol.', { crh: 'up', cortico: 'up', cort: 'up' }),
        S('**Reproduction is switched off**: CRH, β-endorphin and cortisol suppress GnRH → LH/FSH fall; the gonads also become gonadotropin-resistant.', { gnrh: 'down', gonado: 'down', sex: 'down', repro: 'down' }, [['cort', 'gonado']]),
        S('**Growth axis suppressed**: GH secretion falls and IGF-1 action is blunted — children stop growing.', { somato: 'down', gh: 'down', bone: 'down' }, [['cort', 'somato']]),
        S('**Thyroid axis dampened**: TSH and peripheral T4→T3 conversion fall (euthyroid sick pattern).', { thyro: 'down', th: 'down' }, [['cort', 'thyro']]),
        S('**Metabolism**: ↑ gluconeogenesis, insulin resistance, visceral fat, muscle wasting, bone loss; **immune** suppression.', { metab: 'up', muscle: 'down', adipose: 'up', immune: 'down' }),
      ] },
    { id: 'hypothyroid', label: 'Primary hypothyroidism', src: 'Molina Ch3–4; Kovacs Ch11–12',
      steps: [
        S('Thyroid failure: **T4/T3 fall**, so feedback is lost and **TRH and TSH rise** (thyrotroph hyperplasia can enlarge the pituitary).', { th: 'down', trh: 'up', thyro: 'up' }),
        S('**TRH also stimulates lactotrophs** → prolactin rises.', { lacto: 'up', prl: 'up' }, [['th', 'lacto']]),
        S('Prolactin **suppresses GnRH** → menstrual irregularity, infertility.', { gnrh: 'down', gonado: 'down', repro: 'down' }, [['prl', 'gonado']]),
        S('Thyroid hormone is needed for GH secretion and growth → **growth delay** in children.', { somato: 'down', bone: 'down' }, [['th', 'somato']]),
        S('Systemic: ↓ metabolic rate, bradycardia, ↑ LDL (fewer hepatic LDL receptors), cold intolerance, slowed reflexes.', { metab: 'down', cv: 'down', brain: 'down' }),
      ] },
    { id: 'prl', label: 'Prolactinoma / D2-blocking drug', src: 'Kovacs Ch5; Freeman 2000',
      steps: [
        S('Autonomous prolactin (or loss of dopamine action at D2).', { lacto: 'up', prl: 'up' }),
        S('Prolactin inhibits **kisspeptin → GnRH** → LH/FSH fall.', { gnrh: 'down', gonado: 'down' }, [['prl', 'gonado']]),
        S('→ Amenorrhea and anovulation, ↓ libido and erectile dysfunction, and **bone loss** from sex-steroid deficiency; galactorrhea.', { sex: 'down', repro: 'down', bone: 'down', breast: 'up' }),
      ] },
    { id: 'starve', label: 'Energy deficit (anorexia, extreme exercise)', src: 'Molina Ch4, Ch10',
      steps: [
        S('Low energy availability: leptin falls; stress pathways activate (↑ CRH, cortisol).', { crh: 'up', cort: 'up' }),
        S('**GnRH pulses slow** → hypothalamic amenorrhea / low testosterone.', { gnrh: 'down', gonado: 'down', sex: 'down', repro: 'down' }, [['cort', 'gonado']]),
        S('Thyroid adapts: **↓ T3, ↑ reverse T3** with normal TSH (↑ type 3 deiodinase) — energy saving.', { th: 'down' }, [['cort', 'thyro']]),
        S('**GH rises but IGF-1 falls** — acquired hepatic GH resistance.', { somato: 'up', gh: 'down' }),
        S('Net: bone loss (low estrogen + high cortisol + low IGF-1), muscle wasting.', { bone: 'down', muscle: 'down' }),
      ] },
    { id: 'preg', label: 'Pregnancy', src: 'Molina Ch9; Kovacs Ch10, Ch12, Ch13',
      steps: [
        S('Placental **estrogen** rises steeply.', { sex: 'up' }),
        S('Estrogen drives **lactotroph hyperplasia** → prolactin rises; the pituitary enlarges.', { lacto: 'up', prl: 'up', breast: 'up' }, [['sex', 'lacto']]),
        S('Estrogen ↑ hepatic **TBG and CBG** → total T4 and total cortisol rise while free levels stay near normal.', { metab: 'up' }),
        S('**Placental GH variant** replaces pituitary GH (maternal GH becomes undetectable) and raises IGF-1; hPL adds insulin resistance.', { somato: 'down', gh: 'up', metab: 'up' }),
        S('Lactation is held back by high progesterone until delivery; oxytocin then drives labour and milk ejection.', { postlobe: 'up', adh: 'up' }),
      ] },
    { id: 'mass', label: 'Pituitary macroadenoma (mass effect)', src: 'Kovacs Ch4–5, Ch11',
      steps: [
        S('A non-secreting macroadenoma compresses normal pituitary tissue (and may compress the optic chiasm).', {}),
        S('Hormone deficiency usually appears first in **GH** and **gonadotropins** (classic clinical teaching).', { somato: 'down', gh: 'down', gonado: 'down', sex: 'down' }),
        S('Later **TSH** and **ACTH** deficiency (central hypothyroidism, secondary adrenal insufficiency — aldosterone preserved).', { thyro: 'down', th: 'down', cortico: 'down', cort: 'down' }),
        S('**Stalk compression** cuts dopamine delivery → *prolactin rises modestly* (the "stalk effect"); the only pituitary hormone that goes up. Very large prolactinomas can read falsely low (hook effect).', { da: 'down', lacto: 'up', prl: 'up' }),
      ] },
  ];
})();
