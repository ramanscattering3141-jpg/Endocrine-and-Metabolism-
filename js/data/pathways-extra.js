/* Additional integrative pathways added from the textbook gap audit:
 * potassium balance (Molina Ch10), hypoglycemia counterregulation (Molina Ch7, Kovacs Ch15),
 * appetite & energy balance (Molina Ch10, Kovacs Ch15), parturition (Kovacs Ch10). */
(function () {
  const P = window.EP.pathways;
  const n = (id, x, y, o) => Object.assign({ id, x, y }, o || {});
  const e = (from, to, type, o) => Object.assign({ from, to, type: type || 'stim' }, o || {});
  const pr = (id, x, y, label, o) => n(id, x, y, Object.assign({ type: 'process', label }, o || {}));

  // ======================================================================
  // POTASSIUM BALANCE
  // ======================================================================
  P.potassium = {
    id: 'potassium', title: 'Potassium balance: fast shifts and slow excretion', view: { w: 1100, h: 520 },
    compartments: [
      { x: 10, y: 10, w: 220, h: 500, label: 'Meal & hormones', kind: 'organ' },
      { x: 240, y: 10, w: 240, h: 500, label: 'Cells (98% of body K⁺)', kind: 'cytosol' },
      { x: 490, y: 10, w: 220, h: 500, label: 'ECF (2% of body K⁺)', kind: 'blood' },
      { x: 720, y: 10, w: 180, h: 500, label: 'Adrenal (ZG)', kind: 'organ' },
      { x: 910, y: 10, w: 180, h: 500, label: 'Collecting duct', kind: 'organ' },
    ],
    inputs: [
      { node: 'intake', label: 'K⁺ intake', value: 1, labels: ['very low', 'low', 'usual', 'high', 'very high'] },
      { node: 'epi', label: 'Epinephrine (β2)', value: 1, labels: ['none', 'low', 'basal', 'stress', 'very high'] },
      { node: 'angii', label: 'Angiotensin II', value: 1, labels: ['very low', 'low', 'normal', 'high', 'very high'] },
    ],
    nodes: [
      pr('intake', 120, 90, 'Dietary K⁺ (absorbed rapidly)', { w: 180, h: 46 }),
      n('insulin', 120, 230, { label: 'Insulin (meal)', w: 140 }),
      n('epi', 120, 370, { ent: 'epinephrine', label: 'Epinephrine (β2)', w: 150 }),
      n('nhe', 360, 230, { type: 'transporter', label: 'Na⁺/H⁺ exchanger', w: 170 }),
      n('nka', 360, 370, { type: 'transporter', label: 'Na⁺/K⁺-ATPase', w: 170 }),
      pr('shift', 360, 470, 'K⁺ shift into cells', { w: 180 }),
      n('kplasma', 600, 230, { ent: 'potassium', type: 'ion', label: 'Plasma [K⁺]', w: 130 }),
      n('angii', 810, 90, { label: 'Angiotensin II', w: 150 }),
      n('aldo', 810, 230, { ent: 'aldosterone', w: 140 }),
      n('enac', 1000, 150, { label: 'ENaC + Na⁺/K⁺-ATPase', w: 165, h: 46 }),
      n('romk', 1000, 280, { type: 'transporter', label: 'ROMK / BK: K⁺ secretion', w: 165, h: 46 }),
      pr('kexc', 1000, 420, 'Urinary K⁺ excretion', { w: 165, h: 46 }),
    ],
    edges: [
      e('intake', 'kplasma', 'transport', { w: 0.7, why: 'Dietary K⁺ is absorbed quickly and raises plasma K⁺ transiently (Molina Ch10).' }),
      e('intake', 'insulin', 'stim', { w: 0.6, why: 'The insulin released with a meal moves K⁺ into cells within minutes.' }),
      e('insulin', 'nhe', 'stim', { w: 0.8, why: 'Insulin activates the electroneutral Na⁺/H⁺ antiporter; the Na⁺ that enters drives Na⁺/K⁺-ATPase (Molina Ch10).' }),
      e('nhe', 'nka', 'stim', { w: 0.6, why: 'More intracellular Na⁺ activates the electrogenic pump.' }),
      e('epi', 'nka', 'stim', { w: 0.6, why: 'β2-adrenergic stimulation increases Na⁺/K⁺-ATPase activity; α-adrenergic stimulation shifts K⁺ out of cells (Molina Ch10).' }),
      e('nka', 'shift', 'stim', { w: 0.85, why: 'The pump moves K⁺ from ECF into cells.' }),
      e('shift', 'kplasma', 'inhib', { w: 0.6, why: 'Short-term regulation of plasma K⁺ is by transcellular shifts (insulin, catecholamines).' }),
      e('kplasma', 'aldo', 'stim', { w: 0.8, why: 'High K⁺ directly stimulates aldosterone secretion by zona glomerulosa cells.' }),
      e('angii', 'aldo', 'stim', { w: 0.5, why: 'Angiotensin II synergizes with K⁺ in stimulating aldosterone.' }),
      e('aldo', 'enac', 'stim', { w: 0.6, why: 'Aldosterone increases ENaC and basolateral Na⁺/K⁺-ATPase in principal cells.' }),
      e('aldo', 'romk', 'stim', { w: 0.4, why: 'Aldosterone increases apical K⁺ conductance.' }),
      e('enac', 'romk', 'stim', { w: 0.6, why: 'K⁺ secretion is coupled to Na⁺ reabsorption: Na⁺ entry makes the lumen negative and drives K⁺ out. Less Na⁺ reabsorption (amiloride) → less K⁺ secretion.' }),
      e('kplasma', 'romk', 'stim', { w: 0.4, curve: 70, why: 'Chronic adaptation: high K⁺ intake increases distal K⁺ secretion per nephron, so intake is matched by excretion (Molina Ch10).' }),
      e('romk', 'kexc', 'stim', { w: 0.85 }),
      e('kexc', 'kplasma', 'inhib', { w: 0.5, why: 'The kidney excretes ~90% of daily K⁺ losses and sets long-term balance.' }),
    ],
    steps: [
      { n: ['intake', 'kplasma'], t: '**A K⁺ load arrives.** Only ~2% of body K⁺ is extracellular, so a meal could raise plasma K⁺ sharply.' },
      { n: ['insulin', 'nhe', 'nka', 'shift', 'epi'], t: '**Minutes: shift into cells.** Insulin (Na⁺/H⁺ exchanger → Na⁺/K⁺-ATPase) and β2-catecholamines move K⁺ into muscle and liver.' },
      { n: ['kplasma', 'aldo', 'angii'], t: '**Hours: aldosterone.** K⁺ directly stimulates zona glomerulosa cells; Ang II synergizes.' },
      { n: ['aldo', 'enac', 'nkak', 'romk', 'kexc'], t: '**Excretion.** Aldosterone increases ENaC and K⁺ channels; Na⁺ reabsorption drives K⁺ secretion. The kidney matches excretion to intake.' },
    ],
    clinical: [
      { id: 'addison', label: 'Aldosterone deficiency (e.g., Addison disease)', caps: { aldo: 0.1 }, desc: 'Without aldosterone, distal K⁺ secretion falls → hyperkalemia (with salt wasting).', chain: ['↓ aldosterone', '↓ ENaC, ↓ K⁺ channels', '↓ K⁺ excretion', 'hyperkalemia'], highlight: ['aldo', 'romk', 'kexc', 'kplasma'] },
      { id: 'conn', label: 'Primary aldosteronism / Liddle syndrome', autos: { aldo: 4 }, desc: 'Excess mineralocorticoid action (or constitutively active ENaC in Liddle) → increased K⁺ secretion → hypokalemia with hypertension (Molina Ch10).', chain: ['↑ aldosterone action', '↑ ENaC', '↑ K⁺ secretion', 'hypokalemia'], highlight: ['aldo', 'enac', 'romk', 'kplasma'] },
      { id: 'amiloride', label: 'Amiloride (ENaC blocker)', caps: { enac: 0.1 }, desc: 'Less Na⁺ entry removes the lumen-negative drive for K⁺ secretion → K⁺-sparing (risk of hyperkalemia).', chain: ['ENaC blocked', '↓ lumen-negative voltage', '↓ K⁺ secretion'], highlight: ['enac', 'romk'] },
      { id: 'insulin_tx', label: 'Insulin deficiency (e.g., DKA)', caps: { insulin: 0.1 }, desc: 'Without insulin, K⁺ shifts out of cells: plasma K⁺ may be normal or high even though total-body K⁺ is depleted. Insulin therapy drives K⁺ back into cells.', chain: ['↓ insulin', '↓ Na⁺/K⁺-ATPase drive', 'K⁺ stays extracellular'], highlight: ['insulin', 'nka', 'shift', 'kplasma'] },
    ],
    refs: ['molina10', 'molina6', 'kovacs13'],
  };

  // ======================================================================
  // HYPOGLYCEMIA COUNTERREGULATION
  // ======================================================================
  P.counterreg = {
    id: 'counterreg', title: 'Defending against hypoglycemia: the counterregulatory response', view: { w: 1100, h: 545 },
    compartments: [
      { x: 10, y: 10, w: 470, h: 525, label: 'Sensing', kind: 'organ' },
      { x: 490, y: 10, w: 250, h: 525, label: 'Hormonal response', kind: 'blood' },
      { x: 750, y: 10, w: 340, h: 525, label: 'Tissue effects', kind: 'organ' },
    ],
    inputs: [{ node: 'glucose', label: 'Blood glucose', value: 1, labels: ['severe hypoglycemia', 'hypoglycemia', 'normal', 'elevated', 'high'] }],
    nodes: [
      n('glucose', 120, 270, { label: 'Blood glucose', w: 150 }),
      pr('beta', 350, 90, 'β-cell glucose sensing', { w: 180 }),
      pr('alpha', 350, 200, 'α-cell glucose sensing', { w: 180 }),
      pr('hypo', 350, 380, 'Hypothalamic & portal glucose sensors', { w: 190, h: 46 }),
      n('insulin', 615, 90, { w: 120 }),
      n('glucagon', 615, 200, { w: 120 }),
      pr('sns', 615, 310, 'Sympathetic activation', { w: 190 }),
      n('epinephrine', 615, 405, { w: 130 }),
      n('gh', 555, 490, { label: 'GH (hours)', w: 105 }),
      n('cortisol', 680, 490, { label: 'Cortisol (hours)', w: 115 }),
      pr('hgo', 920, 90, 'Hepatic glucose output', { ent: 'gluconeogenesis', w: 220 }),
      pr('muscle', 920, 190, 'Muscle glucose uptake', { ent: 'glut4', w: 220 }),
      pr('lipol', 920, 290, 'Lipolysis → FFA (glucose sparing)', { ent: 'lipolysis', w: 250 }),
      pr('auto', 920, 390, 'Autonomic symptoms (tremor, palpitations, sweating)', { w: 290, h: 46 }),
      pr('neuro', 920, 480, 'Neuroglycopenic symptoms (confusion, seizures)', { w: 290, h: 46 }),
    ],
    edges: [
      e('glucose', 'beta', 'stim', { why: 'β-cells sense glucose through GLUT/glucokinase metabolism.' }),
      e('glucose', 'alpha', 'inhib', { why: 'Low glucose stimulates α-cells.' }),
      e('glucose', 'hypo', 'inhib', { why: 'Falling glucose activates hypothalamic glucose-sensing neurons.' }),
      e('glucose', 'neuro', 'inhib', { via: [[120, 528], [920, 528]], why: 'Neuroglycopenia as glucose approaches ~50 mg/dL: confusion, blurred vision, difficulty speaking; then seizures or loss of consciousness (Molina Ch7).' }),
      e('beta', 'insulin', 'stim', { why: 'The first defense: insulin secretion falls as glucose falls.' }),
      e('alpha', 'glucagon', 'stim', { why: 'Glucagon release — an immediate counterregulatory response (Molina Ch7).' }),
      e('insulin', 'glucagon', 'inhib', { w: 0.4, why: 'Intra-islet insulin restrains α-cells; the fall in insulin during hypoglycemia helps release glucagon.' }),
      e('hypo', 'sns', 'stim', { why: 'Sympathetic nervous system activation (Molina Ch7).' }),
      e('sns', 'epinephrine', 'stim', { why: 'Adrenal medullary epinephrine release.' }),
      e('sns', 'glucagon', 'stim', { w: 0.3, why: 'Autonomic input also stimulates glucagon.' }),
      e('hypo', 'gh', 'stim', { w: 0.5, why: 'GH and cortisol follow, acting over hours (Molina Ch7). Insulin-induced hypoglycemia is used to test GH and ACTH reserve (Kovacs Ch4–5).' }),
      e('hypo', 'cortisol', 'stim', { w: 0.5, why: 'Via CRH/ACTH.' }),
      e('glucagon', 'hgo', 'stim', { why: 'Glucagon: rapid glycogenolysis, then gluconeogenesis.' }),
      e('epinephrine', 'hgo', 'stim', { w: 0.5, why: 'Epinephrine stimulates hepatic glucose output (β2, α1).' }),
      e('insulin', 'hgo', 'inhib', { w: 0.6, why: 'Falling insulin removes restraint on hepatic glucose output.' }),
      e('cortisol', 'hgo', 'stim', { w: 0.3, via: [[760, 490], [760, 105]], why: 'Cortisol supports gluconeogenesis over hours.' }),
      e('insulin', 'muscle', 'stim', { w: 0.6, why: 'Less insulin → less GLUT4 at the membrane.' }),
      e('epinephrine', 'muscle', 'inhib', { w: 0.4, why: 'Epinephrine limits insulin-stimulated glucose uptake.' }),
      e('epinephrine', 'lipol', 'stim', { w: 0.6, why: 'Catecholamines are the main activators of lipolysis in humans (Kovacs Ch15).' }),
      e('insulin', 'lipol', 'inhib', { w: 0.6, why: 'Removal of insulin inhibition.' }),
      e('gh', 'lipol', 'stim', { w: 0.3 }),
      e('sns', 'auto', 'stim', { why: 'Autonomic warning symptoms appear as glucose falls to about 54 mg/dL (Molina Ch7).' }),
    ],
    steps: [
      { n: ['glucose', 'beta', 'insulin'], t: '**First:** insulin secretion falls.' },
      { n: ['alpha', 'glucagon', 'hgo', 'insulin'], t: '**Then glucagon**, released immediately (helped by the fall in intra-islet insulin) → hepatic glycogenolysis.' },
      { n: ['hypo', 'sns', 'epinephrine', 'hgo', 'muscle', 'lipol', 'auto'], t: '**Sympathoadrenal response:** epinephrine raises hepatic output, limits muscle uptake and drives lipolysis; autonomic symptoms warn the person.' },
      { n: ['hypo', 'gh', 'cortisol', 'hgo', 'lipol'], t: '**Hours later:** GH and cortisol sustain glucose production and fat mobilization.' },
      { n: ['glucose', 'neuro'], t: '**If defenses fail:** neuroglycopenia.' },
    ],
    clinical: [
      { id: 't1d', label: 'Long-standing type 1 diabetes on insulin', caps: { glucagon: 0.15 }, desc: 'Injected insulin cannot be switched off, and the glucagon response to hypoglycemia is often lost in long-standing type 1 diabetes, so defense rests on epinephrine (and warning symptoms).', chain: ['insulin cannot fall', 'absent glucagon response', 'epinephrine-dependent defense'], highlight: ['insulin', 'glucagon', 'epinephrine'] },
      { id: 'hypopit', label: 'Hypopituitarism / adrenal insufficiency', caps: { gh: 0.1, cortisol: 0.1 }, desc: 'Loss of GH and cortisol impairs prolonged counterregulation; fasting hypoglycemia can occur (Kovacs Ch13).', chain: ['↓ GH, ↓ cortisol', '↓ sustained gluconeogenesis'], highlight: ['gh', 'cortisol', 'hgo'] },
      { id: 'adrenal_med', label: 'Loss of adrenal medulla / sympathetic response', caps: { epinephrine: 0.15, sns: 0.2 }, desc: 'Glucagon still acts, but warning symptoms and epinephrine support are reduced.', chain: ['↓ epinephrine', '↓ warning symptoms'], highlight: ['sns', 'epinephrine', 'auto'] },
    ],
    refs: ['molina7', 'kovacs15', 'kovacs4', 'kovacs5'],
  };

  // ======================================================================
  // APPETITE & ENERGY BALANCE
  // ======================================================================
  P.appetite = {
    id: 'appetite', title: 'Appetite and energy balance: gut, fat and hypothalamus', view: { w: 1100, h: 530 },
    compartments: [
      { x: 10, y: 10, w: 200, h: 510, label: 'State', kind: 'organ' },
      { x: 220, y: 10, w: 230, h: 510, label: 'Peripheral signals', kind: 'blood' },
      { x: 460, y: 10, w: 450, h: 510, label: 'Brain: brainstem, reward, arcuate → PVN', kind: 'organ' },
      { x: 920, y: 10, w: 170, h: 510, label: 'Output', kind: 'organ' },
    ],
    inputs: [
      { node: 'meal', label: 'Meal', value: 1, labels: ['long fast', 'fasting', 'between meals', 'fed', 'large meal'] },
      { node: 'fat', label: 'Fat mass', value: 1, labels: ['very lean', 'lean', 'normal', 'obese', 'severe obesity'] },
    ],
    nodes: [
      pr('meal', 110, 150, 'Food in the GI tract', { w: 160 }),
      pr('fat', 110, 430, 'Fat mass', { w: 120 }),
      pr('stretch', 335, 70, 'Gastric stretch (vagal)', { w: 190 }),
      n('cck', 335, 140, { label: 'CCK', w: 100 }),
      n('glp1', 335, 210, { w: 110 }),
      n('ghrelin', 335, 300, { w: 130 }),
      n('insulin', 335, 390, { w: 110 }),
      n('leptin', 335, 470, { w: 110 }),
      pr('nts', 600, 140, 'NTS / area postrema (satiety relay)', { w: 220, h: 46 }),
      pr('reward', 600, 240, 'Mesolimbic reward (VTA, accumbens)', { w: 230, h: 46 }),
      pr('npy', 600, 340, 'NPY / AgRP neurons (orexigenic)', { w: 230 }),
      pr('pomc', 600, 430, 'POMC / CART neurons → α-MSH', { w: 230 }),
      n('mc4r', 820, 385, { type: 'receptor', label: 'MC4R (PVN)', w: 130 }),
      pr('intake', 1005, 220, 'Food intake', { w: 150 }),
      pr('ee', 1005, 410, 'Energy expenditure (sympathetic, UCP)', { w: 150, h: 58 }),
      n('gh', 1005, 495, { label: 'GH release', w: 130 }),
    ],
    edges: [
      e('meal', 'stretch', 'stim', { why: 'Mechanoreceptors signal gastric distension.' }),
      e('meal', 'cck', 'stim', { why: 'CCK is released from the duodenum by lipid and protein (Molina Ch10).' }),
      e('meal', 'glp1', 'stim', { why: 'GLP-1 from intestinal L cells; meals also raise insulin.' }),
      e('meal', 'ghrelin', 'inhib', { why: 'Ghrelin is highest in the fasted state and falls with meals (Molina Ch10; Kovacs Ch15).' }),
      e('fat', 'insulin', 'stim', { w: 0.5, why: 'Insulin is released in proportion to body fat (and with meals).' }),
      e('fat', 'leptin', 'stim', { why: 'Leptin reflects fat mass, not individual meals (Molina Ch10).' }),
      e('fat', 'ghrelin', 'inhib', { w: 0.3, why: 'Ghrelin is low in obesity and high with low-calorie diets, anorexia nervosa and chronic strenuous exercise (Molina Ch10).' }),
      e('stretch', 'nts', 'stim'), e('cck', 'nts', 'stim', { why: 'CCK acts on local vagal sensory receptors → brainstem: short-term satiety.' }), e('glp1', 'nts', 'stim', { why: 'GLP-1 suppresses appetite.' }),
      e('ghrelin', 'reward', 'stim', { why: 'Ghrelin acts on mesolimbic reward circuits (VTA, nucleus accumbens) (Kovacs Ch15).' }),
      e('ghrelin', 'npy', 'stim', { why: 'Ghrelin is a potent appetite stimulant.' }),
      e('ghrelin', 'gh', 'stim', { w: 0.6, why: 'Ghrelin is a potent GH secretagogue (Molina Ch10).' }),
      e('insulin', 'npy', 'inhib', { w: 0.4 }), e('insulin', 'pomc', 'stim', { w: 0.5, why: 'Insulin, like leptin, signals long-term energy stores to the hypothalamus.' }),
      e('leptin', 'npy', 'inhib', { why: 'Leptin reduces NPY and AgRP expression (Molina Ch10).' }), e('leptin', 'pomc', 'stim', { why: 'Leptin increases α-MSH and CART expression.' }),
      e('nts', 'intake', 'inhib', { why: 'Short-term satiety: meal termination.' }),
      e('reward', 'intake', 'stim', { w: 0.4 }),
      e('npy', 'intake', 'stim', { why: 'NPY is orexigenic.' }),
      e('npy', 'mc4r', 'inhib', { why: 'AgRP is an endogenous MC4R antagonist (Kovacs Ch5).' }), e('pomc', 'mc4r', 'stim', { why: 'α-MSH activates MC4R.' }),
      e('mc4r', 'intake', 'inhib', { why: 'Melanocortins act at MC4R to inhibit feeding.' }), e('mc4r', 'ee', 'stim', { why: 'Increased sympathetic energy expenditure.' }),
    ],
    steps: [
      { n: ['meal', 'ghrelin', 'npy', 'reward', 'intake'], t: '**Before a meal:** ghrelin is high → hunger (NPY/AgRP, reward circuits).' },
      { n: ['meal', 'stretch', 'cck', 'glp1', 'nts', 'intake'], t: '**During the meal:** stretch, CCK and GLP-1 signal satiety through the brainstem — meal termination.' },
      { n: ['fat', 'leptin', 'insulin', 'npy', 'pomc', 'mc4r'], t: '**Long-term:** leptin and insulin report fat stores to the arcuate nucleus (NPY/AgRP ↓, POMC/CART ↑).' },
      { n: ['pomc', 'mc4r', 'intake', 'ee'], t: '**Output:** MC4R lowers intake and raises energy expenditure.' },
    ],
    clinical: [
      { id: 'ob', label: 'Congenital leptin deficiency', caps: { leptin: 0.05 }, desc: 'The hypothalamus perceives starvation despite large fat stores → hyperphagia and obesity.', chain: ['no leptin', 'NPY/AgRP ↑, POMC ↓', 'hyperphagia'], highlight: ['leptin', 'npy', 'pomc', 'intake'] },
      { id: 'mc4r', label: 'MC4R loss-of-function', caps: { mc4r: 0.1 }, desc: 'The most common monogenic obesity: upstream signals intact, melanocortin output lost.', chain: ['MC4R ✕', '↑ intake, ↓ expenditure'], highlight: ['mc4r', 'intake', 'ee'] },
      { id: 'glp1ra', label: 'GLP-1 receptor agonist therapy', autos: { glp1: 4 }, desc: 'Pharmacological GLP-1 receptor activation enhances satiety signaling and reduces food intake (and amplifies glucose-dependent insulin secretion).', chain: ['↑ GLP-1R signaling', '↑ satiety', '↓ intake'], highlight: ['glp1', 'nts', 'intake'] },
      { id: 'anorexia', label: 'Low-calorie diet / anorexia nervosa', inputs: { fat: 0.35, meal: 0.5 }, desc: 'Leptin falls and ghrelin rises → strong drive to eat and to save energy; low leptin also suppresses the reproductive axis.', chain: ['↓ leptin, ↑ ghrelin', 'NPY/AgRP ↑', 'hunger, ↓ energy expenditure'], highlight: ['leptin', 'ghrelin', 'npy'] },
    ],
    refs: ['molina10', 'kovacs15', 'kovacs5', 'myers2008'],
  };

  // ======================================================================
  // PARTURITION
  // ======================================================================
  P.parturition = {
    id: 'parturition', title: 'Parturition: the feto-placental clock', view: { w: 1100, h: 540 },
    compartments: [
      { x: 10, y: 10, w: 290, h: 520, label: 'Fetus', kind: 'organ' },
      { x: 310, y: 10, w: 330, h: 520, label: 'Placenta, membranes, decidua', kind: 'mito' },
      { x: 650, y: 10, w: 440, h: 520, label: 'Mother: uterus and cervix', kind: 'organ' },
    ],
    inputs: [
      { node: 'clock', label: 'Late gestation (placental CRH rise)', value: 1, labels: ['mid-pregnancy', '', '28 weeks', 'term', 'post-term'] },
      { node: 'pra', label: 'Functional progesterone withdrawal (PR-A : PR-B)', value: 1, labels: ['none', '', 'baseline', 'rising', 'marked'] },
    ],
    nodes: [
      pr('clock', 470, 60, 'Placental "clock"', { w: 170 }),
      n('pcrh', 470, 160, { ent: 'crh', label: 'Placental CRH', w: 150 }),
      pr('facth', 150, 120, 'Fetal pituitary ACTH', { ent: 'acth', w: 190 }),
      pr('fadrenal', 150, 250, 'Fetal adrenal (DHEA-S, cortisol)', { ent: 'dhea', w: 200, h: 46 }),
      n('fcort', 150, 380, { ent: 'cortisol', label: 'Fetal cortisol', w: 150 }),
      n('estriol', 470, 280, { ent: 'estradiol', label: 'Estriol / estradiol (placental aromatase)', w: 220, h: 46 }),
      n('prog', 470, 400, { ent: 'progesterone', label: 'Progesterone', w: 140 }),
      pr('pg', 470, 490, 'Prostaglandins (COX-2)', { w: 200 }),
      pr('caps', 790, 230, 'Contraction-associated proteins (oxytocin receptors, gap junctions)', { w: 210, h: 64 }),
      pr('prfun', 790, 400, 'Progesterone action (quiescence)', { w: 200, h: 46 }),
      pr('cervix', 790, 490, 'Cervical ripening (MMP-9)', { w: 200 }),
      n('oxytocin', 1000, 70, { w: 140 }),
      pr('myo', 1000, 230, 'Myometrial contractility', { w: 150, h: 46 }),
      pr('stretch', 1000, 350, 'Cervical stretch (Ferguson reflex)', { w: 150, h: 46 }),
      pr('pra', 1000, 470, 'PR-A : PR-B ratio', { w: 150 }),
    ],
    edges: [
      e('clock', 'pcrh', 'stim', { why: 'Placental CRH rises exponentially from ~28 weeks; CRH-binding protein falls in the last weeks, raising free CRH. Progesterone may restrain placental CRH output (Kovacs Ch10).' }),
      e('pcrh', 'facth', 'stim', { w: 0.5, why: 'Placental CRH can stimulate fetal pituitary ACTH.' }),
      e('facth', 'fadrenal', 'stim', { why: 'The fetal adrenal makes large amounts of DHEA-S (fetal zone) and cortisol.' }),
      e('fadrenal', 'fcort', 'stim', { w: 0.6 }),
      e('fcort', 'pcrh', 'stim', { w: 0.4, why: 'Glucocorticoids increase placental CRH output — a possible positive feedback loop (Kovacs Ch10).' }),
      e('fadrenal', 'estriol', 'stim', { why: 'Fetal DHEA-S (16-hydroxylated in fetal liver) is aromatized by the placenta → estriol. Low estrogen (anencephaly, fetal adrenal hypoplasia, steroid sulfatase deficiency) → prolonged pregnancy, poor cervical ripening.' }),
      e('pcrh', 'pg', 'stim', { w: 0.5, via: [[610, 160], [610, 490]], why: 'CRH stimulates prostaglandin production by membranes and decidua, and MMP-9 (cervical remodeling).' }),
      e('estriol', 'pg', 'stim', { w: 0.5, via: [[335, 280], [335, 490]], why: 'Estrogen stimulates prostaglandin synthesis.' }),
      e('estriol', 'caps', 'stim', { w: 0.6, why: 'Estrogen increases contraction-associated proteins.' }),
      e('prog', 'prfun', 'stim', { w: 0.8, why: 'Progesterone keeps the myometrium quiet for most of gestation.' }),
      e('pra', 'prfun', 'inhib', { why: 'In humans plasma progesterone does not fall before labor; a **functional withdrawal** (relative rise in inhibitory PR-A) is proposed (Kovacs Ch10).' }),
      e('prfun', 'caps', 'inhib', { w: 0.6 }),
      e('prfun', 'myo', 'inhib', { w: 0.5 }),
      e('caps', 'myo', 'stim', { w: 0.6 }),
      e('pg', 'myo', 'stim', { w: 0.6, why: 'Prostaglandins cause contractions and cervical ripening; prostaglandin inhibitors can delay preterm labor (Kovacs Ch10).' }),
      e('pg', 'cervix', 'stim', { w: 0.6 }),
      e('oxytocin', 'myo', 'stim', { w: 0.5, why: 'Oxytocin does not rise before labor; it regulates the expulsive phase and postpartum uterine contraction. Labor can occur without it (Kovacs Ch10).' }),
      e('myo', 'stretch', 'stim', { w: 0.5 }),
      e('stretch', 'oxytocin', 'stim', { w: 0.5, via: [[1083, 350], [1083, 70]], why: 'Cervical/vaginal stretch → oxytocin release: positive feedback in the expulsive phase.' }),
    ],
    steps: [
      { n: ['clock', 'pcrh'], t: '**The placental clock.** CRH rises exponentially in late gestation.' },
      { n: ['pcrh', 'facth', 'fadrenal', 'fcort', 'estriol'], t: '**Fetal adrenal → estrogen.** Fetal ACTH drives DHEA-S, which the placenta aromatizes to estriol. Fetal cortisol may feed forward to placental CRH.' },
      { n: ['estriol', 'pcrh', 'pg', 'caps'], t: '**Activation.** Estrogen and CRH increase prostaglandins and contraction-associated proteins.' },
      { n: ['prog', 'pra', 'prfun', 'myo', 'caps'], t: '**Functional progesterone withdrawal.** Progesterone stays high, but its quiescent effect weakens.' },
      { n: ['pg', 'myo', 'cervix', 'oxytocin', 'stretch'], t: '**Labor.** Prostaglandins ripen the cervix and drive contractions; oxytocin and the Ferguson reflex dominate the expulsive phase.' },
    ],
    clinical: [
      { id: 'anenceph', label: 'Anencephaly / fetal adrenal hypoplasia', caps: { fadrenal: 0.1 }, desc: 'Little DHEA-S → low estrogen → often prolonged (post-date) pregnancy and poor cervical ripening (Kovacs Ch10).', chain: ['↓ fetal adrenal precursors', '↓ estriol', '↓ prostaglandins and CAPs', 'prolonged pregnancy'], highlight: ['fadrenal', 'estriol', 'pg'] },
      { id: 'sts', label: 'Placental steroid sulfatase deficiency', caps: { estriol: 0.2 }, desc: 'DHEA-S cannot be desulfated → low estrogen → prolonged pregnancy.', chain: ['↓ estrogen', 'failure of cervical ripening'], highlight: ['estriol', 'cervix'] },
      { id: 'nsaid', label: 'Prostaglandin synthesis inhibitor', caps: { pg: 0.2 }, desc: 'Can prevent or delay preterm labor (Kovacs Ch10).', chain: ['↓ prostaglandins', '↓ contractions, ↓ ripening'], highlight: ['pg', 'myo', 'cervix'] },
      { id: 'mife', label: 'Progesterone receptor antagonist', caps: { prfun: 0.1 }, desc: 'Removing progesterone action releases the brake on the myometrium and cervix.', chain: ['↓ progesterone action', '↑ CAPs', '↑ contractility'], highlight: ['prfun', 'caps', 'myo'] },
    ],
    refs: ['kovacs10', 'molina9'],
  };
})();
