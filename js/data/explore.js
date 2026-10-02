/* Data for Follow-the-molecule, Follow-the-hormone, Organ cross-talk map and Clinical cases. */
(function () {
  const D = window.EP.data;
  const F = (to, process, where, when, page, note) => ({ to, process, where, when, page, note });

  // ---------------- molecule fates ----------------
  D.fates = {
    glucose: { summary: 'Every cell can take up glucose, but what happens next depends on the tissue and on insulin.', dest: [
      F('g6p', 'Phosphorylation (hexokinase / glucokinase)', 'All tissues', 'Always — the first committed step that traps glucose', 'hepatocyte'),
      F('glycogen', 'Glycogenesis (via G6P → UDP-glucose)', 'Liver, muscle', 'Fed / insulin', 'insulin'),
      F('pyruvate', 'Glycolysis', 'All tissues (RBCs: only route)', 'Always; ↑ fed (liver) or with exercise (muscle)', 'hepatocyte'),
      F('ribose5p', 'Pentose phosphate pathway → NADPH + ribose-5-P', 'Liver, adipose, adrenal, RBC', 'When NADPH is needed (lipogenesis, antioxidant)', 'hepatocyte'),
      F('acetylcoa', 'Glycolysis + PDH', 'Liver, adipose, brain, muscle', 'Fed (PDH active)', 'acetylcoa'),
      F('tg', 'De novo lipogenesis (via citrate → malonyl-CoA)', 'Liver (mainly), adipose', 'Fed, carbohydrate excess', 'fattyacid'),
      F('g3p', 'Glycerol-3-phosphate (triglyceride backbone)', 'Adipose', 'Fed / insulin (GLUT4)', 'fattyacid'),
    ] },
    g6p: { summary: 'The branch point of carbohydrate metabolism.', dest: [
      F('glycogen', 'Glycogen synthesis', 'Liver, muscle', 'Fed', 'hepatocyte'), F('pyruvate', 'Glycolysis', 'All', 'Energy demand / fed liver', 'hepatocyte'), F('ribose5p', 'Pentose phosphate pathway', 'Lipogenic tissues', 'NADPH demand', 'hepatocyte'),
      F('glucose', 'Glucose-6-phosphatase', '**Liver and kidney only** (not muscle)', 'Fasting', 'glucagon', 'Muscle lacks G6Pase — muscle G6P cannot become blood glucose.'),
    ] },
    glycogen: { summary: 'Stored glucose. Liver glycogen serves the whole body; muscle glycogen serves only muscle.', dest: [
      F('glucose', 'Glycogenolysis → G6P → G6Pase', 'Liver', 'Post-absorptive; glucagon, epinephrine', 'glucagon'), F('g6p', 'Glycogenolysis', 'Muscle', 'Exercise (Ca²⁺, AMP), epinephrine', 'glut4'),
    ] },
    pyruvate: { summary: 'The crossroads after glycolysis.', dest: [
      F('lactate', 'Lactate dehydrogenase', 'RBC, exercising muscle, all tissues', 'Anaerobic / high glycolytic rate', 'flux'), F('acetylcoa', 'Pyruvate dehydrogenase (irreversible)', 'Mitochondria', 'Fed, insulin; ↓ by fatty-acid oxidation', 'acetylcoa'),
      F('oaa', 'Pyruvate carboxylase (activated by acetyl-CoA)', 'Liver, kidney (gluconeogenesis); all (anaplerosis)', 'Fasting', 'acetylcoa'), F('alanine', 'Transamination (ALT)', 'Muscle', 'Fasting (glucose–alanine cycle)', 'aminoacid'),
    ] },
    acetylcoa: { summary: 'The two-carbon hub. It can be oxidized, stored as fat, made into ketones or cholesterol — but **not** turned into net glucose.', dest: [
      F('tca', 'Citrate synthase → TCA cycle → CO₂ + NADH', 'All mitochondria', 'Whenever OAA is available', 'acetylcoa'), F('ketones', 'Ketogenesis (HMGCS2)', '**Liver only**', 'Fasting, low insulin, high glucagon', 'acetylcoa'),
      F('malonylcoa', 'Export as citrate → ACC', 'Liver, adipose (cytosol)', 'Fed, insulin', 'fattyacid'), F('cholesterol', 'HMG-CoA reductase', 'Liver (cytosol/ER), steroidogenic cells', 'Fed; sterol-regulated', 'lipoprotein'),
      F('pc', 'Allosteric activation of pyruvate carboxylase (signal, not substrate)', 'Liver', 'Fasting', 'acetylcoa', 'Promotes gluconeogenesis from pyruvate/lactate/alanine.'),
    ] },
    malonylcoa: { summary: 'Building block of fatty acids and brake on fat oxidation.', dest: [F('palmitate', 'Fatty acid synthase', 'Liver, adipose', 'Fed', 'fattyacid'), F('cpt1', '⊣ Inhibits CPT-1 (regulatory)', 'Mitochondrial outer membrane', 'Fed — prevents futile oxidation of new fat', 'fattyacid')] },
    ffa: { summary: 'Fatty acids released by adipose lipolysis travel on albumin.', dest: [
      F('acetylcoa', 'β-Oxidation (after CPT-1)', 'Muscle, heart, liver', 'Fasting, exercise', 'fattyacid'), F('ketones', 'β-Oxidation → ketogenesis', 'Liver', 'Fasting, low insulin', 'acetylcoa'),
      F('tg', 'Re-esterification', 'Liver (→ VLDL), adipose', 'Fed or when oxidation is limited', 'fattyacid'), F('dag', 'Ectopic lipid → DAG → PKCε/θ', 'Liver, muscle', 'Lipid oversupply → insulin resistance', 'insulin'),
    ] },
    glycerol: { summary: 'The glucogenic part of triglyceride.', dest: [F('gap', 'Glycerol kinase → DHAP → gluconeogenesis', 'Liver, kidney (adipocytes lack glycerol kinase)', 'Fasting', 'hepatocyte')] },
    tg: { summary: 'Stored or transported fat.', dest: [F('ffa', 'Lipolysis (ATGL/HSL) or LPL', 'Adipose; capillaries', 'Fasting (lipolysis); fed (LPL storage)', 'fattyacid'), F('glycerol', 'Lipolysis', 'Adipose', 'Fasting, catecholamines', 'fattyacid'), F('vldl', 'VLDL assembly', 'Liver', 'Fed and fasting', 'lipoprotein')] },
    lactate: { summary: 'Not a waste product — a shuttle of carbon and reducing equivalents.', dest: [F('pyruvate', 'LDH → gluconeogenesis (Cori cycle)', 'Liver, kidney', 'Post-absorptive, exercise recovery', 'hepatocyte'), F('acetylcoa', 'Oxidation', 'Heart, oxidative muscle', 'Exercise', 'flux')] },
    alanine: { summary: 'Carries both carbon and nitrogen from muscle to liver (Felig 1973).', dest: [F('pyruvate', 'ALT (transamination)', 'Liver', 'Fasting', 'aminoacid'), F('urea', 'Nitrogen → glutamate → NH₄⁺ → urea', 'Liver', 'Fasting, protein catabolism', 'aminoacid')] },
    aa: { summary: 'Amino acids: build protein first; excess or fasting → fuel.', dest: [
      F('protsyn', 'Protein synthesis (mTORC1)', 'Muscle, liver, all', 'Fed, insulin, leucine', 'aminoacid'), F('urea', 'Transamination/deamination → urea cycle', 'Liver', 'Excess protein, fasting (glucagon)', 'aminoacid'),
      F('gluconeogenesis', 'Glucogenic carbon skeletons', 'Liver, kidney', 'Fasting', 'aminoacid'), F('ketones', 'Ketogenic skeletons (Leu, Lys)', 'Liver', 'Fasting', 'aminoacid'), F('insulin', 'Stimulus for insulin and glucagon secretion', 'Pancreatic islets', 'Protein meal', 'aminoacid'),
    ] },
    ketones: { summary: 'Made by liver, burned elsewhere (liver lacks SCOT).', dest: [F('acetylcoa', 'Ketolysis (SCOT) → TCA', 'Brain, heart, muscle, kidney', 'Fasting (brain uptake rises with concentration)', 'flux'), F('urea', 'Excreted in urine / exhaled acetone', 'Kidney, lungs', 'High concentrations (DKA)', 'flux')] },
    cholesterol: { summary: 'Membranes, bile acids, steroids, vitamin D.', dest: [F('pregnenolone', 'CYP11A1 (after StAR)', 'Adrenal, gonads, placenta', 'ACTH / LH / hCG', 'steroidogenesis'), F('ldl', 'VLDL → IDL → LDL', 'Circulation', 'Always', 'lipoprotein'), F('calcidiol', '7-Dehydrocholesterol → vitamin D₃ → 25-OH-D', 'Skin (UVB) → liver', 'Sunlight', 'calcium')] },
    pregnenolone: { summary: 'The first steroid.', dest: [F('aldosterone', 'Mineralocorticoid branch', 'Zona glomerulosa', 'Angiotensin II, K⁺', 'steroidogenesis'), F('cortisol', 'Glucocorticoid branch', 'Zona fasciculata', 'ACTH', 'steroidogenesis'), F('dhea', 'Androgen branch', 'Zona reticularis, gonads', 'ACTH; LH', 'steroidogenesis')] },
    cortisol: { summary: 'Cortisol diffuses into nearly all cells; specificity comes from receptor and 11β-HSD expression.', dest: [F('gr', 'Glucocorticoid receptor → transcription', 'Liver, muscle, adipose, immune, brain', 'Stress, morning peak', 'cortisol'), F('cortisone', '11β-HSD2 inactivation', 'Kidney, placenta', 'Protects MR', 'cortisol'), F('crh', '⊣ Negative feedback', 'Hypothalamus, pituitary', 'Always', 'hpa')] },
    testosterone: { summary: 'A hormone and a prohormone.', dest: [F('dht', '5α-reductase', 'Genital skin, prostate, hair follicles', 'Always', 'testis'), F('estradiol', 'Aromatase', 'Adipose, brain, bone, granulosa', 'Always', 'testis'), F('ar', 'Androgen receptor directly', 'Muscle, Wolffian ducts, Sertoli, hypothalamus', 'Always', 'testis')] },
    t4: { summary: 'T4 is mostly a prohormone.', dest: [F('t3', 'D1/D2 outer-ring deiodination', 'Liver/kidney (D1); brain, pituitary, muscle, BAT (D2)', 'Normal', 'thyroid'), F('rt3', 'D3 inner-ring deiodination', 'Brain, placenta; illness', 'Inactivation', 'thyroid')] },
    t3: { summary: 'The active thyroid hormone.', dest: [F('tr', 'TR/RXR on TREs → transcription', 'Nearly all cells', 'Always', 'thyroid'), F('tsh', '⊣ Feedback (after local D2 conversion)', 'Pituitary, hypothalamus', 'Always', 'hpt')] },
    ca: { summary: 'Ionized calcium is defended within narrow limits.', dest: [F('hydroxyapatite', 'Mineralization', 'Bone', 'Positive balance', 'calcium'), F('casr', 'Sensed by CaSR → ⊣ PTH', 'Parathyroid, kidney TAL', 'Always', 'calcium'), F('urea', 'Urinary excretion (after reabsorption)', 'Kidney', 'Filtered load > reabsorption', 'calcium')] },
    phosphate: { summary: 'Regulated mostly by the kidney.', dest: [F('hydroxyapatite', 'Bone mineral', 'Bone', 'Growth, positive balance', 'calcium'), F('fgf23', 'Phosphate load stimulates FGF23', 'Osteocytes', 'High intake, CKD', 'calcium'), F('napi', 'Renal reabsorption (NaPi-IIa/c) or excretion', 'Proximal tubule', 'PTH and FGF23 increase excretion', 'calcium')] },
  };
  // make sure fate destinations that are themselves followable are linkable
  D.followable = Object.keys(D.fates);

  // ---------------- hormone maps ----------------
  const TG = (organ, effects, mech) => ({ organ, effects, mech });
  D.hormoneMap = {
    insulin: { source: 'pancreas', route: 'Portal vein → liver (>50% extracted on first pass) → systemic circulation', targets: [
      TG('liver', '↑ glycogenesis, ↑ glycolysis, ↑ lipogenesis, ↓ gluconeogenesis, ↓ glycogenolysis, ↓ ketogenesis', 'IR → Akt: GSK3 ⊣ (glycogen synthase on), FOXO1 exclusion (↓ PEPCK/G6Pase), SREBP-1c; ↑ malonyl-CoA closes CPT-1.'),
      TG('muscle', '↑ glucose uptake, ↑ glycogen synthesis, ↑ protein synthesis, ↓ proteolysis', 'Akt → AS160/TBC1D4 → GLUT4 translocation; GSK3 ⊣; mTORC1.'),
      TG('adipose', '↑ glucose uptake, ↑ TG synthesis, ↑ LPL, ↓↓ lipolysis', 'Akt → PDE3B → ↓ cAMP/PKA → HSL/ATGL off; GLUT4.'),
      TG('brain', 'Satiety signaling; brain glucose uptake is insulin-independent', 'Hypothalamic insulin receptors (minor metabolic role).'),
      TG('kidney', '↓ renal gluconeogenesis, ↑ Na⁺ reabsorption', 'Proximal tubule insulin signaling.'),
    ] },
    glucagon: { source: 'pancreas', route: 'Portal vein → liver (main target, highest concentration)', targets: [
      TG('liver', '↑ glycogenolysis, ↑ gluconeogenesis, ↓ glycolysis, ↓ glycogenesis, ↑ fatty-acid oxidation & ketogenesis, ↑ amino-acid uptake & ureagenesis', 'Gs → cAMP → PKA: phosphorylase kinase, ↓ F-2,6-BP, ⊣ L-PK, ⊣ ACC, CREB/CRTC2.'),
      TG('kidney', 'Gluconeogenesis, natriuresis (receptor present)', 'Glucagon receptors in kidney (Molina Ch7).'),
      TG('adipose', 'Little direct lipolytic effect in humans at physiological levels', 'Receptor expressed, role unclear.'),
      TG('muscle', '**No meaningful direct effect** — muscle lacks functional glucagon signaling and G6Pase', 'Epinephrine (β2) and contraction drive muscle glycogenolysis instead.'),
      TG('pancreas', 'Stimulates insulin secretion (paracrine)', 'β-cell glucagon/GLP-1 receptors.'),
    ] },
    cortisol: { source: 'adrenal', route: 'Systemic, ~90% bound to CBG/albumin; free fraction enters cells', targets: [
      TG('brain', '⊣ CRH and ACTH (feedback), mood, appetite, memory', 'GR/MR in hypothalamus, pituitary, hippocampus.'),
      TG('liver', '↑ gluconeogenic enzymes (PEPCK, G6Pase), ↑ glycogen storage (permissive), ↑ amino-acid catabolism', 'GR binding to GREs.'),
      TG('muscle', '↑ proteolysis (alanine/glutamine supply), ↓ insulin-stimulated glucose uptake', 'GR → atrogenes; post-receptor insulin antagonism.'),
      TG('adipose', 'Permissive lipolysis; central fat redistribution with excess', 'GR; synergy with catecholamines/GH.'),
      TG('immune', '↓ cytokines, ↓ eosinophils/lymphocytes, anti-inflammatory', 'GR tethering ⊣ NF-κB/AP-1.'),
      TG('medulla', '↑ PNMT → epinephrine synthesis', 'Intra-adrenal portal cortisol.'),
      TG('bone', '↓ osteoblast function, ↑ RANKL', 'GR in osteoblasts.'),
    ] },
    epinephrine: { source: 'medulla', route: 'Systemic (t½ < 2 min)', targets: [TG('liver', '↑ glycogenolysis, ↑ gluconeogenesis', 'β2/α1.'), TG('muscle', '↑ glycogenolysis, ↑ glycolysis', 'β2 → cAMP → phosphorylase kinase.'), TG('adipose', '↑↑ lipolysis', 'β1/β3 → cAMP → PKA → HSL.'), TG('pancreas', '↓ insulin (α2), ↑ glucagon (β)', 'Islet adrenergic receptors.')] },
    gh: { source: 'pituitary', route: 'Pulsatile secretion (largest after sleep onset)', targets: [TG('liver', '↑ IGF-1, IGFBP-3, ALS; ↑ glucose output (insulin antagonism)', 'GHR → JAK2 → STAT5.'), TG('adipose', '↑ lipolysis', 'Direct GH action.'), TG('muscle', '↑ protein synthesis; ↓ glucose uptake', 'GH/IGF-1.'), TG('bone', 'Linear growth (with IGF-1)', 'Growth plate chondrocytes.')] },
    t3: { source: 'thyroid', route: 'T4 secreted; T3 made locally by D1/D2', targets: [TG('heart', '↑ HR, contractility (β1, α-MHC, SERCA2)', 'TR.'), TG('liver', '↑ LDL receptors, gluconeogenesis, lipogenesis/oxidation', 'TR.'), TG('muscle', '↑ Na⁺/K⁺-ATPase, thermogenesis, protein turnover', 'TR.'), TG('brain', 'Development; mood; feedback on TRH', 'TR; D2 in tanycytes.'), TG('adipose', 'Brown fat thermogenesis (UCP1, D2)', 'TR.'), TG('bone', 'Bone turnover, growth', 'TR.')] },
    pth: { source: 'parathyroid', route: 'Systemic (t½ < 5 min)', targets: [TG('kidney', '↑ Ca²⁺ reabsorption (DCT), ↑ phosphate excretion, ↑ 1α-hydroxylase', '**Direct** PTH1R actions.'), TG('bone', '↑ resorption (RANKL ↑, OPG ↓); intermittent PTH is anabolic', '**Direct** on osteoblasts/osteocytes.'), TG('gut', '↑ Ca²⁺ and phosphate absorption', '**Indirect** — only via calcitriol.')] },
    calcitriol: { source: 'kidney', route: 'Systemic (VDBP-bound)', targets: [TG('gut', '↑ Ca²⁺ (TRPV6/calbindin) and phosphate absorption', 'VDR.'), TG('bone', 'Mineralization supply; RANKL ↑ at high levels; ↑ FGF23', 'VDR.'), TG('parathyroid', '↓ PTH transcription', 'VDR.'), TG('kidney', '↑ CYP24A1 (self-inactivation), ↑ Ca reabsorption', 'VDR.')] },
    leptin: { source: 'adipose', route: 'Systemic, proportional to fat mass', targets: [TG('brain', '↓ appetite, ↑ energy expenditure, permissive for GnRH/puberty', 'LepR → JAK2/STAT3 in arcuate POMC/AgRP neurons.')] },
    testosterone: { source: 'testis', route: 'Systemic (SHBG/albumin-bound)', targets: [TG('muscle', '↑ mass and strength', 'AR.'), TG('bone', '↑ density (partly via aromatization to E2), epiphyseal closure via E2', 'AR/ER.'), TG('brain', '⊣ GnRH/LH (feedback), libido', 'AR, ER after aromatization.'), TG('testis', 'Spermatogenesis (high intratesticular levels)', 'AR in Sertoli cells.')] },
    aldosterone: { source: 'adrenal', route: 'Systemic (little binding, t½ ~15–20 min)', targets: [TG('kidney', '↑ Na⁺ reabsorption, ↑ K⁺ and H⁺ secretion', 'MR → ENaC, ROMK, Na⁺/K⁺-ATPase.'), TG('heart', 'Fibrosis with chronic excess', 'MR.')] },
  };

  // ---------------- body map ----------------
  D.body = {
    organs: {
      brain: { label: 'Brain / hypothalamus', x: 450, y: 55, w: 190 }, pituitary: { label: 'Pituitary', x: 450, y: 125, w: 110 },
      thyroid: { label: 'Thyroid', x: 450, y: 190, w: 100 }, parathyroid: { label: 'Parathyroid', x: 600, y: 190, w: 110 },
      heart: { label: 'Heart', x: 540, y: 270, w: 90 }, liver: { label: 'Liver', x: 330, y: 340, w: 120 },
      pancreas: { label: 'Pancreas (islets)', x: 520, y: 360, w: 150 }, adrenal: { label: 'Adrenal cortex', x: 690, y: 330, w: 130 }, medulla: { label: 'Adrenal medulla', x: 700, y: 385, w: 140 },
      kidney: { label: 'Kidney', x: 690, y: 445, w: 110 }, gut: { label: 'Gut', x: 450, y: 450, w: 100 },
      adipose: { label: 'Adipose', x: 210, y: 470, w: 110 }, muscle: { label: 'Skeletal muscle', x: 230, y: 610, w: 150 },
      testis: { label: 'Gonads', x: 450, y: 560, w: 100 }, bone: { label: 'Bone', x: 660, y: 610, w: 100 }, immune: { label: 'Immune system', x: 800, y: 520, w: 140 },
      ovary: { label: 'Gonads', x: 450, y: 560, w: 100, alias: 'testis' },
    },
    links: [
      { from: 'pancreas', to: 'liver', mol: 'Insulin, glucagon', kind: 'hormone', desc: 'Portal delivery: the liver sees 2–3× higher insulin and glucagon than peripheral tissues; >50% of insulin is cleared on first pass (Molina Ch7).' },
      { from: 'pancreas', to: 'muscle', mol: 'Insulin', kind: 'hormone', desc: 'GLUT4 translocation, glycogen and protein synthesis.' },
      { from: 'pancreas', to: 'adipose', mol: 'Insulin', kind: 'hormone', desc: 'Antilipolysis (PDE3B), GLUT4, LPL.' },
      { from: 'adipose', to: 'liver', mol: 'FFA, glycerol', kind: 'metabolite', desc: 'Fasting: fatty acids fuel hepatic β-oxidation/ketogenesis and activate pyruvate carboxylase; glycerol feeds gluconeogenesis.' },
      { from: 'adipose', to: 'muscle', mol: 'FFA', kind: 'metabolite', desc: 'Fatty acids are the main resting/fasting fuel of muscle; excess causes insulin resistance.' },
      { from: 'adipose', to: 'brain', mol: 'Leptin', kind: 'adipokine', desc: 'Signals energy stores to the hypothalamus: satiety, permissive for reproduction.' },
      { from: 'adipose', to: 'liver', mol: 'Adiponectin', kind: 'adipokine', desc: 'Insulin-sensitizing adipokine (AMPK, PPARα); falls with obesity.', bend: 40 },
      { from: 'muscle', to: 'liver', mol: 'Lactate, alanine', kind: 'metabolite', desc: 'Cori and glucose–alanine cycles return carbon (and nitrogen) to the liver for gluconeogenesis.' },
      { from: 'muscle', to: 'kidney', mol: 'Glutamine', kind: 'metabolite', desc: 'Renal glutamine use for ammoniagenesis and gluconeogenesis (prolonged fasting, acidosis).' },
      { from: 'liver', to: 'brain', mol: 'Glucose, ketones', kind: 'metabolite', desc: 'The brain depends on hepatic glucose — and on ketones in prolonged fasting.' },
      { from: 'liver', to: 'muscle', mol: 'Glucose, ketones', kind: 'metabolite', desc: 'Hepatic glucose output supports exercising muscle.' },
      { from: 'liver', to: 'adipose', mol: 'VLDL-triglyceride', kind: 'metabolite', desc: 'Hepatic fat delivered to adipose via LPL.' },
      { from: 'liver', to: 'kidney', mol: 'Urea, 25-OH-D', kind: 'metabolite', desc: 'Urea excretion; 25-OH-D for 1α-hydroxylation.' },
      { from: 'liver', to: 'bone', mol: 'IGF-1', kind: 'hormone', desc: 'GH-driven hepatic IGF-1 supports growth.' },
      { from: 'gut', to: 'pancreas', mol: 'GLP-1, GIP', kind: 'hormone', desc: 'Incretins: feed-forward amplification of insulin secretion.' },
      { from: 'gut', to: 'liver', mol: 'Glucose, amino acids', kind: 'metabolite', desc: 'Absorbed nutrients reach the liver first via the portal vein.' },
      { from: 'brain', to: 'pituitary', mol: 'CRH, TRH, GnRH, GHRH, SST, dopamine', kind: 'hormone', desc: 'Hypophyseal portal circulation.' },
      { from: 'pituitary', to: 'adrenal', mol: 'ACTH', kind: 'hormone', desc: 'Drives cortisol (and adrenal androgen) synthesis.' },
      { from: 'pituitary', to: 'thyroid', mol: 'TSH', kind: 'hormone', desc: 'Drives every step of thyroid hormone synthesis.' },
      { from: 'pituitary', to: 'testis', mol: 'LH, FSH', kind: 'hormone', desc: 'Gonadal steroidogenesis and gametogenesis.' },
      { from: 'pituitary', to: 'liver', mol: 'GH', kind: 'hormone', desc: 'IGF-1 production; GH also lipolytic and insulin-antagonistic.' },
      { from: 'pituitary', to: 'kidney', mol: 'ADH', kind: 'hormone', desc: 'V2 → aquaporin-2.' },
      { from: 'adrenal', to: 'brain', mol: 'Cortisol', kind: 'hormone', desc: 'Negative feedback on CRH/ACTH.' },
      { from: 'adrenal', to: 'liver', mol: 'Cortisol', kind: 'hormone', desc: 'Gluconeogenic gene transcription.' },
      { from: 'adrenal', to: 'muscle', mol: 'Cortisol', kind: 'hormone', desc: 'Proteolysis supplies gluconeogenic amino acids.' },
      { from: 'adrenal', to: 'immune', mol: 'Cortisol', kind: 'hormone', desc: 'Anti-inflammatory, immunosuppressive.' },
      { from: 'adrenal', to: 'medulla', mol: 'Cortisol (portal)', kind: 'hormone', desc: 'Induces PNMT → epinephrine.' },
      { from: 'adrenal', to: 'kidney', mol: 'Aldosterone', kind: 'hormone', desc: 'Na⁺ retention, K⁺ secretion.' },
      { from: 'medulla', to: 'liver', mol: 'Epinephrine', kind: 'hormone', desc: 'Glycogenolysis, gluconeogenesis.' },
      { from: 'medulla', to: 'adipose', mol: 'Epinephrine', kind: 'hormone', desc: 'Lipolysis.' },
      { from: 'medulla', to: 'pancreas', mol: 'Epinephrine', kind: 'hormone', desc: '⊣ insulin (α2), ↑ glucagon.' },
      { from: 'medulla', to: 'muscle', mol: 'Epinephrine', kind: 'hormone', desc: 'Muscle glycogenolysis (β2).' },
      { from: 'thyroid', to: 'heart', mol: 'T4 → T3', kind: 'hormone', desc: 'Rate, contractility.' },
      { from: 'thyroid', to: 'muscle', mol: 'T4 → T3', kind: 'hormone', desc: 'Metabolic rate, thermogenesis.' },
      { from: 'thyroid', to: 'pituitary', mol: 'T4 → T3', kind: 'hormone', desc: 'Feedback (local D2).' },
      { from: 'parathyroid', to: 'kidney', mol: 'PTH', kind: 'hormone', desc: 'Ca²⁺ reabsorption, phosphaturia, 1α-hydroxylase.' },
      { from: 'parathyroid', to: 'bone', mol: 'PTH', kind: 'hormone', desc: 'Resorption via RANKL.' },
      { from: 'kidney', to: 'gut', mol: 'Calcitriol', kind: 'hormone', desc: 'Intestinal Ca²⁺/phosphate absorption.' },
      { from: 'kidney', to: 'parathyroid', mol: 'Calcitriol', kind: 'hormone', desc: '⊣ PTH transcription.' },
      { from: 'bone', to: 'kidney', mol: 'FGF23', kind: 'hormone', desc: 'Phosphaturia; ⊣ 1α-hydroxylase.' },
      { from: 'testis', to: 'brain', mol: 'Testosterone, E2, inhibin', kind: 'hormone', desc: 'Negative feedback (and positive E2 feedback mid-cycle in females).' },
      { from: 'testis', to: 'muscle', mol: 'Testosterone', kind: 'hormone', desc: 'Anabolic.' },
      { from: 'testis', to: 'bone', mol: 'Sex steroids', kind: 'hormone', desc: 'Bone density; epiphyseal closure (estrogen).' },
      { from: 'kidney', to: 'adrenal', mol: 'Renin → angiotensin II', kind: 'hormone', desc: 'Stimulates aldosterone.' },
      { from: 'brain', to: 'medulla', mol: 'Sympathetic (ACh)', kind: 'neural', desc: 'Splanchnic preganglionic fibres.' },
      { from: 'brain', to: 'pancreas', mol: 'Autonomic', kind: 'neural', desc: 'Vagal (↑ insulin) and sympathetic (⊣ insulin, ↑ glucagon) input.' },
    ],
  };

  // ---------------- clinical cases ----------------
  const Q = (label, answer, why) => ({ label, answer, why });
  D.cases = [
    { id: 'addison', title: 'Fatigue, salt craving, darkening skin', tags: 'Addison primary adrenal insufficiency', stem: 'A 34-year-old woman has months of fatigue, weight loss, dizziness on standing, salt craving and darkening of her palmar creases. BP 92/58. Na⁺ 128, K⁺ 5.9 mmol/L.', questions: [Q('Cortisol', 'down', 'Autoimmune destruction of the cortex.'), Q('ACTH', 'up', 'Loss of cortisol negative feedback.'), Q('Aldosterone', 'down', 'Zona glomerulosa destroyed too → hyperkalemia, hyponatremia.'), Q('Renin', 'up', 'Volume depletion and loss of aldosterone feedback.'), Q('Skin pigmentation (POMC/MSH)', 'up', 'High ACTH/POMC peptides act on MC1R.')], sim: { page: 'hpa', preset: 'primary' }, teach: 'The pattern **low cortisol + high ACTH** localizes the lesion to the adrenal. Aldosterone deficiency distinguishes primary from secondary insufficiency (Bornstein 2016).' },
    { id: 'steroidwd', title: 'Stopped prednisone abruptly', tags: 'exogenous glucocorticoid HPA suppression adrenal crisis', stem: 'A 60-year-old man took prednisone 20 mg/day for 6 months for polymyalgia rheumatica and stopped it suddenly. Two days later he is weak, nauseated and hypotensive.', questions: [Q('ACTH (while on prednisone)', 'down', 'Exogenous glucocorticoid suppresses CRH/ACTH.'), Q('Endogenous cortisol production', 'down', 'Prolonged ACTH suppression → adrenal atrophy; recovery takes weeks–months.'), Q('Aldosterone', 'same', 'RAAS-driven, preserved — no hyperkalemia.')], sim: { page: 'hpa', preset: 'exo' }, teach: 'This is **tertiary/secondary-type** suppression: the whole axis is shut down, but the zona glomerulosa is spared.' },
    { id: 'dka', title: 'Teenager missed insulin doses', tags: 'type 1 diabetes ketoacidosis DKA', stem: 'A 16-year-old with type 1 diabetes skipped insulin for 2 days during a viral illness. Glucose 28 mmol/L, β-hydroxybutyrate 6 mmol/L, pH 7.15.', questions: [Q('Glucagon', 'up', 'Loss of intra-islet insulin restraint + stress.'), Q('Adipose lipolysis', 'up', 'No PDE3B antilipolysis → HSL/ATGL active.'), Q('Hepatic malonyl-CoA', 'down', 'Low insulin, high glucagon/PKA ⊣ ACC.'), Q('CPT-1 activity / β-oxidation', 'up', 'Malonyl-CoA brake removed.'), Q('Ketogenesis', 'up', 'Acetyl-CoA overflow with OAA diverted to gluconeogenesis.'), Q('Hepatic glucose output', 'up', 'Glucagon + no insulin → glycogenolysis and gluconeogenesis.')], sim: { page: 'flux', preset: 't1d' }, teach: 'DKA = insulin deficiency + glucagon excess acting on liver and adipose together.' },
    { id: 'marathon', title: 'Mid-marathon', tags: 'exercise GLUT4 contraction', stem: 'A trained runner at kilometre 25 of a marathon, without having eaten during the race.', questions: [Q('Plasma insulin', 'down', 'α2-adrenergic suppression of β-cells.'), Q('Glucagon', 'up', 'Exercise and catecholamines stimulate α-cells.'), Q('Muscle GLUT4 at the membrane', 'up', 'Contraction route (AMPK/TBC1D1, Ca²⁺/CaMKII, Rac1) — insulin-independent.'), Q('Muscle glycogenolysis', 'up', 'Ca²⁺, AMP, epinephrine.'), Q('Hepatic glucose output', 'up', 'Glucagon + epinephrine.'), Q('Plasma lactate', 'up', 'Glycolysis exceeds PDH capacity.')], sim: { page: 'flux', preset: 'exercise' }, teach: 'GLUT4 is not exclusively insulin-dependent; contraction-stimulated uptake is preserved in insulin resistance (Sylow 2017).' },
    { id: 'steroids', title: 'Bodybuilder with infertility', tags: 'anabolic steroids testosterone LH FSH', stem: 'A 28-year-old bodybuilder using injectable testosterone presents with infertility and small testes.', questions: [Q('LH', 'down', 'Androgen/estradiol negative feedback.'), Q('FSH', 'down', 'Feedback on GnRH.'), Q('Serum androgen', 'up', 'Exogenous.'), Q('Intratesticular testosterone', 'down', 'No LH drive to Leydig cells.'), Q('Sperm production', 'down', 'Needs high intratesticular T + FSH.')], sim: { page: 'hpgm', preset: 'exoT' }, teach: 'Serum testosterone cannot substitute for the very high **intratesticular** concentrations spermatogenesis requires.' },
    { id: 'meno', title: 'Hot flashes at 51', tags: 'menopause FSH ovarian failure', stem: 'A 51-year-old woman has had no menses for 14 months and has hot flashes.', questions: [Q('Estradiol', 'down', 'Follicle depletion.'), Q('Inhibin B', 'down', 'Granulosa cells gone.'), Q('FSH', 'up', 'Loss of inhibin and estradiol feedback — FSH rises most.'), Q('LH', 'up', 'Loss of steroid feedback.')], sim: { page: 'hpgf', preset: 'meno' }, teach: 'Primary gonadal failure → high gonadotropins (hypergonadotropic hypogonadism).' },
    { id: 'hashimoto', title: 'Cold intolerance and weight gain', tags: 'Hashimoto primary hypothyroidism TSH', stem: 'A 45-year-old woman has fatigue, cold intolerance, constipation and a firm goiter; anti-TPO antibodies are positive.', questions: [Q('Free T4', 'down', 'Thyroid failure.'), Q('TSH', 'up', 'Loss of feedback.'), Q('TRH', 'up', 'Loss of feedback.')], sim: { page: 'hpt', preset: 'primary' }, teach: '**Primary**: ↓T4 with ↑TSH. Contrast **secondary**: ↓T4 with low/inappropriately normal TSH.' },
    { id: 'central', title: 'Hypothyroid after pituitary surgery', tags: 'secondary central hypothyroidism', stem: 'Six weeks after resection of a large pituitary macroadenoma, a man feels sluggish. His TSH is "normal".', questions: [Q('Free T4', 'down', 'Inadequate TSH bioactivity.'), Q('TSH', 'down', 'Low or inappropriately normal — a "normal" TSH does not exclude central disease.')], sim: { page: 'hpt', preset: 'secondary' }, teach: 'Always measure free T4 when pituitary disease is suspected.' },
    { id: 'phpt', title: 'Kidney stones and hypercalcemia', tags: 'primary hyperparathyroidism calcium PTH', stem: 'A 58-year-old woman has a kidney stone; Ca²⁺ is elevated and phosphate low-normal.', questions: [Q('PTH', 'up', 'Autonomous adenoma.'), Q('Serum calcium', 'up', 'Resorption + renal reabsorption + calcitriol-driven absorption.'), Q('Serum phosphate', 'down', 'PTH-induced phosphaturia.'), Q('Calcitriol', 'up', 'PTH induces 1α-hydroxylase.')], sim: { page: 'calcium', preset: 'phpt' }, teach: 'Contrast humoral hypercalcemia of malignancy (PTHrP): same Ca/phosphate pattern but **suppressed PTH**.' },
    { id: 'ckd', title: 'Advanced chronic kidney disease', tags: 'CKD mineral bone FGF23 secondary hyperparathyroidism', stem: 'A 66-year-old with eGFR 18 has bone pain and itching.', questions: [Q('Phosphate', 'up', 'Reduced filtration.'), Q('FGF23', 'up', 'Phosphate retention (rises early).'), Q('Calcitriol', 'down', 'FGF23 + loss of renal mass.'), Q('PTH', 'up', 'Low calcitriol, high phosphate → secondary hyperparathyroidism.')], sim: { page: 'calcium', preset: 'ckd' }, teach: 'CKD-mineral bone disorder begins with phosphate retention and FGF23.' },
    { id: 'starve', title: 'Day 7 of a hunger strike', tags: 'prolonged fasting ketosis protein sparing', stem: 'A healthy adult has taken only water for a week.', questions: [Q('Hepatic glycogen', 'down', 'Depleted within about a day.'), Q('Plasma ketones', 'up', 'High FFA delivery, low malonyl-CoA, OAA to gluconeogenesis.'), Q('Brain ketone oxidation', 'up', 'Ketones become a major brain fuel (Owen 1967).'), Q('Insulin', 'down', 'Low.'), Q('Muscle proteolysis (vs. early fasting)', 'down', 'Protein sparing as the brain needs less glucose.')], sim: { page: 'flux', preset: 'prolonged' }, teach: 'Adaptation to starvation is about **sparing protein** by switching the brain to ketones (Cahill 2006).' },
    { id: 'cah', title: 'Ambiguous genitalia and salt wasting', tags: '21-hydroxylase CAH congenital adrenal hyperplasia', stem: 'A 2-week-old 46,XX infant with virilized genitalia presents with vomiting, Na⁺ 124, K⁺ 7.1.', questions: [Q('Cortisol', 'down', '21-hydroxylase needed for 11-deoxycortisol.'), Q('ACTH', 'up', 'Loss of feedback → adrenal hyperplasia.'), Q('17-OH-progesterone', 'up', 'Substrate pile-up — screening marker.'), Q('Adrenal androgens', 'up', 'Precursors shunted to the CYP17 lyase branch.'), Q('Aldosterone', 'down', 'Classic salt-wasting form.')], sim: { page: 'steroidogenesis', defect: 'cyp21' }, teach: 'Treat with glucocorticoid (+ mineralocorticoid): suppressing ACTH also shuts off the androgen excess (Speiser 2018).' },
    { id: 'prl', title: 'Galactorrhea on an antipsychotic', tags: 'hyperprolactinemia dopamine antagonist', stem: 'A 25-year-old woman started risperidone 3 months ago; she now has amenorrhea and galactorrhea.', questions: [Q('Prolactin', 'up', 'D2 blockade removes tonic dopamine inhibition.'), Q('GnRH/LH', 'down', 'Prolactin suppresses kisspeptin/GnRH.'), Q('Estradiol', 'down', 'Anovulation.')], sim: { page: 'prl', preset: 'antipsych' }, teach: 'Prolactin is the one anterior pituitary hormone under **predominantly inhibitory** hypothalamic control.' },
    { id: 'insulinoma', title: 'Fasting hypoglycemia — insulinoma or insulin injection?', tags: 'insulinoma C-peptide factitious', stem: 'A 40-year-old nurse has confusion when fasting; glucose 2.1 mmol/L with high insulin.', questions: [Q('C-peptide if insulinoma', 'up', 'Endogenous secretion: insulin and C-peptide equimolar.'), Q('C-peptide if injected insulin', 'down', 'Exogenous insulin suppresses β-cells.'), Q('Ketones', 'down', 'Insulin suppresses lipolysis and ketogenesis.')], sim: { page: 'insulin' }, teach: 'C-peptide distinguishes endogenous from exogenous hyperinsulinism (Molina Ch7).' },
  ];
})();
