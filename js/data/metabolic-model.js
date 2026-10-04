/* Whole-body qualitative metabolic regulatory model.
 * Every term carries a mechanism ("why") so the simulator can explain each change.
 * Exponents encode direction and rough relative strength only (see EP.Model).
 * Reference state (all values = 1) = overnight post-absorptive adult at rest.
 *
 * tier: input → hormone → signal → enzyme → pathway → output → systemic
 */
(function () {
  const EP = window.EP;
  const T = (src, w, why) => ({ src, w, why });
  const C = (src, c, why) => ({ src, c, why });
  const N = (id, label, organ, tier, terms, extra) => Object.assign({ id, label, organ, tier, terms }, extra || {});
  const I = (id, label, organ, desc) => ({ id, label, organ, tier: 'input', input: true, value: 1, desc });

  const nodes = [
    // ---------------- inputs ----------------
    I('carb', 'Dietary carbohydrate', 'gut', 'Glucose absorbed from the gut (reference = none; fed ≈ high).'),
    I('fat', 'Dietary fat', 'gut', 'Chylomicron triglyceride from the meal.'),
    I('protein', 'Dietary protein', 'gut', 'Amino acids absorbed from a protein meal.'),
    I('exercise', 'Muscle contraction (exercise)', 'muscle', '1 = rest. Higher = more intense/longer contraction.'),
    I('stress', 'Stress (sympathetic + HPA drive)', 'brain', 'Trauma, illness, fear, hypotension…'),
    I('fastdur', 'Fasting duration', 'systemic', '1 = overnight fast. ~2 = one day; ≥5 = prolonged (days–weeks).'),
    I('betacap', 'β-cell secretory capacity', 'pancreas', 'Lowered in type 1 diabetes (autoimmune loss) and progressively in type 2.'),
    I('sens', 'Tissue insulin sensitivity', 'systemic', 'Lowered in insulin resistance (ectopic lipid → DAG → PKCε/θ, Petersen & Shulman).'),

    // ---------------- hormones ----------------
    N('glp1', 'GLP-1 (incretin)', 'gut', 'hormone', [T('carb', 0.5, 'Luminal glucose stimulates L-cells.'), T('fat', 0.2, 'Luminal fat stimulates L-cells.'), T('protein', 0.2, 'Luminal protein stimulates L-cells.')], { ent: 'glp1' }),
    N('glcinv', 'Low-glucose signal', 'brain', 'signal', [T('glucose', -3, 'Hypothalamic and portal glucose sensors fire steeply as glucose falls.')], { hide: true }),
    N('hypo', 'Hypoglycemia sensing', 'brain', 'signal', [C(null, 0.8, 'Tonic component (independent of glucose).'), C('glcinv', 0.2, 'Steep response below normal glucose; little suppression above it.')], { mode: 'sum', desc: 'Asymmetric glucose sensing that drives counter-regulation (strong when glucose falls, weak when it rises).' }),
    N('insulin', 'Insulin', 'pancreas', 'hormone', [
      T('betacap', 1, 'Secretory capacity of the β-cell mass.'),
      T('glucose', 2.6, 'Glucose → GLUT1/glucokinase → ↑ ATP/ADP → K-ATP closure → depolarization → Ca²⁺ entry → exocytosis (Rorsman 2018). The dominant stimulus.'),
      T('aa', 0.35, 'Arginine/leucine stimulate β-cells (depolarization; leucine allosterically activates GDH).'),
      T('glp1', 0.45, 'GLP-1R → Gs → cAMP → PKA/Epac2 amplify glucose-stimulated secretion (feed-forward from the gut).'),
      T('epi', -0.7, 'α2-adrenergic (Gi) inhibition of insulin exocytosis — why insulin falls in stress and exercise.'),
      T('sens', -0.3, 'Hepatic insulin clearance falls in insulin resistance (fewer surface insulin receptors, CEACAM1) → peripheral hyperinsulinemia (Petersen & Shulman 2018).'),
      T('fastdur', -0.3, 'Fasting removes meal-related stimuli (incretins, vagal input, amino acids) and β-cell responsiveness declines, so insulin falls steeply although glucose falls only modestly.'),
    ], { ent: 'insulin' }),
    N('glucagon', 'Glucagon', 'pancreas', 'hormone', [
      T('glucose', -0.6, 'Glucose suppresses α-cells (directly and via β-cell products).'),
      T('hypo', 0.7, 'Hypoglycemia is the primary α-cell stimulus (plus autonomic input).'),
      T('sens', -0.5, 'α-cell insulin resistance in T2D blunts glucose/insulin suppression → inappropriate glucagon.'),
      T('aa', 0.7, 'Amino acids (alanine, arginine) stimulate α-cells — the liver–α-cell feedback loop (Wewer Albrechtsen 2019).'),
      T('epi', 0.5, 'β-adrenergic stimulation of α-cells (counter-regulation).'),
      T('insulin', -0.35, 'Insulin (and Zn²⁺, somatostatin) restrains α-cells.'),
      T('fastdur', 0.15, 'Glucagon rises during early fasting (autonomic input, loss of meal-related suppression) and then drifts back as amino-acid supply falls in prolonged starvation.'),
      T('betacap', -0.3, 'Loss of β-cells removes the very high intra-islet insulin that restrains neighbouring α-cells → hyperglucagonemia despite hyperglycemia (Unger & Cherrington 2012).'),
      T('glp1', -0.2, 'GLP-1 suppresses glucagon (largely via somatostatin/insulin).'),
    ], { ent: 'glucagon' }),
    N('epi', 'Epinephrine', 'adrenal', 'hormone', [
      T('stress', 1, 'Sympathoadrenal activation.'), T('exercise', 0.45, 'Exercise activates the sympathoadrenal system in proportion to intensity.'),
      T('hypo', 1.1, 'Hypoglycemia triggers hypothalamic counter-regulatory sympathoadrenal discharge.'),
    ], { ent: 'epinephrine' }),
    N('cortisol', 'Cortisol', 'adrenal', 'hormone', [
      T('stress', 0.8, 'Stress → CRH → ACTH → cortisol (HPA axis).'), T('hypo', 0.6, 'Hypoglycemia activates the HPA axis.'), T('fastdur', 0.15, 'Fasting modestly raises cortisol.'),
    ], { ent: 'cortisol' }),
    N('gh', 'Growth hormone', 'pituitary', 'hormone', [
      T('hypo', 1.1, 'Hypoglycemia is a potent GH stimulus (hypothalamic GHRH↑/somatostatin↓) — the basis of the insulin tolerance test for GH reserve.'), T('glucose', -0.3, 'Hyperglycemia suppresses GH.'), T('fastdur', 0.4, 'Fasting increases GH pulse amplitude.'),
      T('exercise', 0.4, 'Exercise stimulates GH.'), T('ffa', -0.15, 'Free fatty acids suppress GH secretion (a weaker signal that hypoglycemia overrides).'),
    ], { ent: 'gh' }),

    // ---------------- systemic metabolites ----------------
    N('gutglc', 'Gut glucose absorption', 'gut', 'output', [T('carb', 1.7, 'Carbohydrate digestion → SGLT1/GLUT2 absorption into the portal vein.')], { ent: 'glucose' }),
    N('ra', 'Glucose appearance (Ra)', 'systemic', 'systemic', [
      C('hgo', 0.85, 'Hepatic glucose output (glycogenolysis + gluconeogenesis) supplies most post-absorptive glucose.'),
      C('renalgng', 0.11, 'Renal gluconeogenesis.'),
      C('gutglc', 0.04, 'Glucose absorbed from the gut (near zero after an overnight fast).'),
    ], { mode: 'sum', desc: 'Total rate of glucose entry into plasma.' }),
    N('kdisp', 'Glucose disposal capacity', 'systemic', 'systemic', [
      C('brainglc', 0.42, 'Brain (insulin-independent GLUT1/GLUT3) — the largest post-absorptive consumer.'),
      C('m_clear', 0.3, 'Skeletal muscle (GLUT4 at the membrane × delivery).'),
      C('a_glut4', 0.05, 'Adipose GLUT4.'),
      C('h_gk', 0.1, 'Hepatic glucose uptake/phosphorylation (glucokinase).'),
      C(null, 0.13, 'Red cells, kidney medulla, other insulin-independent tissues.'),
    ], { mode: 'sum', desc: 'Combined clearance capacity of tissues (transporters at the membrane × metabolic demand).' }),
    N('glucose', 'Plasma glucose', 'systemic', 'systemic', [T('ra', 1, 'More glucose entering plasma raises concentration.'), T('kdisp', -0.85, 'Greater tissue uptake capacity lowers concentration.')], { ent: 'glucose' }),
    N('ffa', 'Plasma free fatty acids', 'systemic', 'systemic', [
      T('lipolysis', 0.85, 'Adipose lipolysis is the source of plasma NEFA.'), T('esterif', -0.25, 'Adipose re-esterification traps fatty acids back as triglyceride (insulin-promoted).'), T('fat', 0.15, 'LPL "spillover" from dietary chylomicrons.'),
    ], { ent: 'ffa' }),
    N('glycerol', 'Plasma glycerol', 'systemic', 'systemic', [T('lipolysis', 1, 'Every lipolysed triglyceride releases one glycerol (adipocytes cannot re-use it — little glycerol kinase).')], { ent: 'glycerol' }),
    N('ketones', 'Plasma ketone bodies', 'systemic', 'systemic', [T('ketogenesis', 1.4, 'Hepatic production.'), T('fastdur', 0.8, 'Ketones accumulate over days of fasting (production outpaces clearance; Cahill 2006).')], { ent: 'ketones' }),
    N('lactate', 'Plasma lactate', 'systemic', 'systemic', [T('lactrel', 0.8, 'Release from glycolytic tissues (muscle, red cells).'), T('gng', -0.2, 'Hepatic uptake for gluconeogenesis (Cori cycle).')], { ent: 'lactate' }),
    N('aa', 'Plasma amino acids', 'systemic', 'systemic', [
      T('protein', 0.6, 'Absorbed dietary amino acids.'), T('alarel', 0.6, 'Muscle releases alanine/glutamine from proteolysis.'),
      T('h_aaup', -0.3, 'Hepatic uptake (stimulated by glucagon) clears amino acids.'), T('m_protsyn', -0.15, 'Incorporation into muscle protein.'),
    ], { ent: 'aa' }),
    N('tgp', 'Plasma triglyceride (VLDL + chylomicrons)', 'systemic', 'systemic', [T('vldl', 0.5, 'Hepatic VLDL secretion.'), T('fat', 0.5, 'Dietary chylomicrons.'), T('lpl_a', -0.3, 'Adipose LPL clearance (insulin-stimulated).')], { ent: 'tg' }),

    // ---------------- signals (cell energy/redox) ----------------
    N('amp', 'AMP:ATP (energy stress)', 'muscle', 'signal', [T('exercise', 0.8, 'ATP turnover during contraction raises ADP and AMP (adenylate kinase).')], { ent: 'atp', override: true }),

    // ---------------- LIVER ----------------
    N('h_ins', 'Hepatic insulin signaling (IR→Akt)', 'liver', 'signal', [
      T('insulin', 1, 'Portal insulin binds hepatic insulin receptors → IRS → PI3K → Akt.'), T('sens', 1, 'Hepatic insulin resistance: lipogenic sn-1,2-DAG activates PKCε, which phosphorylates insulin-receptor kinase Thr1160 and inhibits it (Petersen & Shulman 2018).'), T('hdag', -0.25, 'Hepatic DAG accumulation (from fatty-acid re-esterification) → PKCε → INSR Thr1160 inhibition.'),
      T('cortisol', -0.3, 'Glucocorticoids cause hepatic insulin resistance (post-receptor) — steroid-induced hyperglycemia.'), T('gh', -0.15, 'GH is diabetogenic (post-receptor antagonism).'),
    ], { ent: 'akt' }),
    N('h_pka', 'Hepatic cAMP → PKA', 'liver', 'signal', [
      T('glucagon', 0.9, 'Glucagon receptor → Gs → adenylyl cyclase → cAMP → PKA (Molina Ch7).'), T('epi', 0.25, 'β2/α1-adrenergic input (smaller than glucagon in humans).'),
      T('h_ins', -0.35, 'Insulin opposes cAMP signaling (PDE activation, PP1/PP2A) and counteracts PKA targets.'),
    ], { ent: 'pka' }),
    N('foxo1', 'FOXO1 (nuclear)', 'liver', 'signal', [T('h_ins', -0.8, 'Akt phosphorylates FOXO1 → 14-3-3 binding → nuclear exclusion (Matsumoto 2007).')], { ent: 'foxo1' }),
    N('creb', 'CREB/CRTC2', 'liver', 'signal', [T('h_pka', 0.8, 'PKA phosphorylates CREB and dephosphorylates/activates CRTC2.')], { ent: 'creb' }),
    N('gngenes', 'PEPCK / G6Pase expression', 'liver', 'enzyme', [
      T('foxo1', 0.45, 'FOXO1 + PGC-1α drive PCK1/G6PC transcription.'), T('creb', 0.45, 'CREB/CRTC2 → PGC-1α and PEPCK/G6Pase (cAMP response elements).'),
      T('cortisol', 0.35, 'Glucocorticoid receptor binds GREs in the PEPCK promoter.'),
    ], { ent: 'pepck', tau: 4 }),
    N('f26bp', 'Fructose-2,6-bisphosphate', 'liver', 'signal', [T('h_pka', -0.8, 'PKA phosphorylates PFK-2/FBPase-2 → kinase off, phosphatase on (Pilkis & Granner).'), T('h_ins', 0.3, 'Insulin favours the dephosphorylated (kinase-active) form.')], { ent: 'f26bp' }),
    N('chrebp', 'ChREBP', 'liver', 'signal', [T('glucose', 1.2, 'Glucose metabolites (xylulose-5-P, G6P) activate ChREBP. In insulin resistance, glucose that muscle fails to take up is diverted to the liver and feeds lipogenesis (Petersen 2007).'), T('carb', 0.15, 'Dietary sugar (especially fructose) reaching the liver via the portal vein.'), T('h_pka', -0.4, 'PKA phosphorylation inactivates ChREBP.')], { ent: 'chrebp' }),
    N('srebp', 'SREBP-1c', 'liver', 'signal', [T('insulin', 0.8, 'Portal insulin → INSR → mTORC1 → SREBP-1c transcription and processing. In insulin resistance compensatory hyperinsulinemia **raises** SREBP-1c and lipogenesis even while insulin fails to suppress glucose production ("selective" hepatic insulin resistance; Brown & Goldstein 2008). Petersen & Shulman (2018) attribute this less to a true branch-point in signaling than to very high portal insulin plus substrate supply (glucose diverted from muscle, FFA).'), T('h_ins', 0.1, 'Akt-dependent component (shared with glycogen synthesis), which is impaired in hepatic insulin resistance.'), T('aa', 0.25, 'Amino acids activate mTORC1 → SREBP-1c independently of insulin (nutrient-driven lipogenesis).')], { ent: 'srebp1c' }),
    N('h_gk', 'Glucokinase activity', 'liver', 'enzyme', [T('h_ins', 0.4, 'Insulin induces GCK transcription.'), T('glucose', 0.8, 'Glucose releases glucokinase from GKRP (nucleus → cytosol).')], { ent: 'gk' }),
    N('lgly', 'Liver glycogen store', 'liver', 'signal', [T('fastdur', -1.6, 'Hepatic glycogen is progressively depleted over the first day or so of fasting (Cahill 2006).'), T('carb', 0.25, 'Carbohydrate meals refill liver glycogen.'), T('exercise', -0.3, 'Prolonged exercise draws down liver glycogen.')], { ent: 'glycogen' }),
    N('lglyav', 'Glycogen availability (liver)', 'liver', 'signal', [T('lgly', 1, 'Phosphorylase flux is limited only when stores run low (saturating).')], { sat: 0.3 }),
    N('h_gs', 'Glycogen synthase (liver)', 'liver', 'enzyme', [T('h_ins', 0.5, 'Akt ⊣ GSK3 and PP1 activation dephosphorylate (activate) glycogen synthase.'), T('h_pka', -0.6, 'PKA (directly and via phosphorylase kinase) phosphorylates/inactivates glycogen synthase.'), T('glucose', 0.5, 'Glucose binds phosphorylase a, promoting its inactivation and releasing PP1 to activate GS.')], { ent: 'glycsyn' }),
    N('h_gp', 'Glycogen phosphorylase (liver)', 'liver', 'enzyme', [
      T('h_pka', 0.9, 'PKA → phosphorylase kinase → phosphorylase a. Acute glucagon rises raise HGP mainly this way (Ramnanan 2011).'),
      T('epi', 0.2, 'α1/β2-adrenergic activation.'), T('h_ins', -0.25, 'Insulin activates PP1 (dephosphorylation).'),
      T('glucose', -0.6, 'Glucose is an allosteric inhibitor — liver phosphorylase is a glucose sensor.'), T('lglyav', 1, 'Glycogenolysis needs glycogen: substrate availability limits flux when stores are depleted.'),
    ], { ent: 'gp' }),
    N('h_glycogenesis', 'Hepatic glycogenesis', 'liver', 'pathway', [T('h_gs', 0.8, 'Active glycogen synthase.'), T('h_gk', 0.6, 'Glucokinase supplies G6P.')], { ent: 'glycogenesis' }),
    N('h_glycogenolysis', 'Hepatic glycogenolysis', 'liver', 'pathway', [T('h_gp', 1, 'Glycogen phosphorylase activity.')], { ent: 'glycogenolysis' }),
    N('lpk', 'L-pyruvate kinase', 'liver', 'enzyme', [T('h_pka', -0.6, 'PKA phosphorylation inhibits L-PK, preventing PEP → pyruvate futile cycling during gluconeogenesis.'), T('chrebp', 0.3, 'ChREBP induces L-PK.')], { ent: 'lpk' }),
    N('h_glycolysis', 'Hepatic glycolysis', 'liver', 'pathway', [T('h_gk', 0.6, 'Glucose phosphorylation.'), T('f26bp', 0.6, 'F-2,6-BP activates PFK-1.'), T('lpk', 0.4, 'Pyruvate kinase.')], { ent: 'glycolysis' }),
    N('ampk_h', 'Hepatic AMPK', 'liver', 'signal', [T('amp', 0.3, 'Cellular energy stress.'), T('glucagon', 0.2, 'Glucagon can activate hepatic AMPK (via Ca²⁺/AMP) — modest.')], { ent: 'ampk' }),
    N('pdh_h', 'Pyruvate dehydrogenase (liver)', 'liver', 'enzyme', [
      T('h_ins', 0.3, 'Insulin promotes PDH dephosphorylation (PDP) and lowers PDK4.'), T('h_fao', -0.4, 'Fatty-acid oxidation products (acetyl-CoA, NADH) activate PDK → inhibit PDH (Randle effect).'),
      T('nadh', -0.3, 'NADH product inhibition.'), T('h_glycolysis', 0.2, 'Pyruvate supply.'),
    ], { ent: 'pdh' }),
    N('citrate', 'Cytosolic citrate', 'liver', 'signal', [T('h_glycolysis', 0.5, 'Glycolytic carbon → pyruvate → acetyl-CoA → citrate exported when energy is abundant.'), T('pdh_h', 0.3, 'PDH supplies acetyl-CoA for citrate.')], { ent: 'citrate', override: true }),
    N('acc', 'Acetyl-CoA carboxylase', 'liver', 'enzyme', [
      T('h_ins', 0.15, 'Insulin dephosphorylates ACC (Molina Ch7).'), T('h_pka', -0.4, 'PKA phosphorylation inhibits ACC (glucagon).'),
      T('ampk_h', -0.6, 'AMPK phosphorylates ACC (Ser79/Ser221) — classic energy-stress brake.'), T('citrate', 0.4, 'Citrate allosterically activates (polymerizes) ACC.'), T('srebp', 0.6, 'SREBP-1c increases ACC expression.'), T('chrebp', 0.3, 'ChREBP increases ACC expression.'),
    ], { ent: 'acc' }),
    N('malonyl', 'Malonyl-CoA', 'liver', 'signal', [T('acc', 1, 'Product of ACC.')], { ent: 'malonylcoa', override: true }),
    N('cpt1', 'CPT-1 (mitochondrial entry)', 'liver', 'enzyme', [T('malonyl', -1, 'Malonyl-CoA inhibits CPT-1 (McGarry 1977) — when making fat, do not burn it.')], { ent: 'cpt1' }),
    N('h_fao', 'Hepatic β-oxidation', 'liver', 'pathway', [T('cpt1', 0.8, 'Gate for long-chain fatty acid entry into mitochondria.'), T('ffa', 0.7, 'Substrate supply from adipose lipolysis.')], { ent: 'betaox' }),
    N('nadh', 'Mitochondrial NADH/NAD⁺', 'liver', 'signal', [T('h_fao', 0.4, 'β-Oxidation generates NADH and FADH₂.')], { ent: 'nadh', override: true }),
    N('acoa', 'Hepatic acetyl-CoA', 'liver', 'signal', [T('h_fao', 0.75, 'β-Oxidation is the main acetyl-CoA source during fasting.'), T('pdh_h', 0.25, 'PDH supplies acetyl-CoA from glucose in the fed state.')], { ent: 'acetylcoa', override: true }),
    N('pc', 'Pyruvate carboxylase activity', 'liver', 'enzyme', [T('acoa', 0.8, 'Acetyl-CoA is an obligate allosteric activator of pyruvate carboxylase — lipolysis-derived acetyl-CoA drives gluconeogenesis (Perry 2015).')], { ent: 'pc' }),
    N('fbp', 'FBPase-1', 'liver', 'enzyme', [T('f26bp', -0.7, 'F-2,6-BP inhibits FBPase-1; when glucagon lowers F-2,6-BP, FBPase-1 is released.')], { ent: 'fbpase' }),
    N('gngsub', 'Gluconeogenic substrate supply', 'liver', 'signal', [
      C('lactate', 0.35, 'Lactate (Cori cycle) — the largest post-absorptive substrate.'), C('glycerol', 0.2, 'Glycerol from lipolysis.'), C('aa', 0.35, 'Alanine/glutamine from muscle (glucose–alanine cycle).'), C(null, 0.1, 'Other (pyruvate, etc.).'),
    ], { mode: 'sum' }),
    N('gng', 'Hepatic gluconeogenesis', 'liver', 'pathway', [
      T('gngsub', 0.9, 'Substrate availability is a major determinant of gluconeogenic flux.'), T('gngenes', 0.3, 'Enzyme capacity (PEPCK, G6Pase) set by FOXO1, CREB, GR.'),
      T('pc', 0.5, 'Pyruvate carboxylase activation by acetyl-CoA from lipolysis-driven β-oxidation — a major controller of fasting gluconeogenesis (Perry 2015).'), T('fbp', 0.35, 'FBPase-1 released from F-2,6-BP inhibition.'),
      T('glucose', -0.6, 'Glucose effectiveness: hyperglycemia per se suppresses hepatic glucose production (substrate cycling at glucokinase/G6Pase), independent of hormones.'),
    ], { ent: 'gluconeogenesis' }),
    N('oaa', 'OAA available to TCA', 'liver', 'signal', [
      T('pc', 0.3, 'Anaplerosis via pyruvate carboxylase.'), T('gng', -0.7, 'Gluconeogenesis drains oxaloacetate (cataplerosis via PEPCK).'),
      T('nadh', -0.4, 'High NADH/NAD⁺ shifts OAA → malate.'), T('h_glycolysis', 0.2, 'Carbohydrate supply replenishes intermediates.'),
    ], { ent: 'oaa' }),
    N('hmgcs2', 'HMGCS2 (ketogenic enzyme)', 'liver', 'enzyme', [T('insulin', -0.4, 'Insulin represses HMGCS2 (FOXA2/mTORC1). Ketogenesis is among the most insulin-sensitive hepatic processes, so the hyperinsulinemia of insulin resistance and T2D keeps ketones low; ketoacidosis needs near-absolute insulin deficiency.'), T('h_ins', -0.15, 'Akt-dependent component.'), T('h_pka', 0.3, 'Fasting/glucagon (PPARα, cAMP) induce HMGCS2.')], { ent: 'hmgcs2' }),
    N('ketogenesis', 'Ketogenesis', 'liver', 'pathway', [
      T('acoa', 1, 'High acetyl-CoA from β-oxidation.'), T('oaa', -0.7, 'When OAA is scarce, acetyl-CoA cannot enter the TCA cycle and spills into HMG-CoA → ketones.'), T('hmgcs2', 0.6, 'HMGCS2 capacity.'),
    ], { ent: 'ketogenesis' }),
    N('h_tca', 'Hepatic TCA cycle', 'liver', 'pathway', [T('acoa', 0.5, 'Acetyl-CoA supply.'), T('oaa', 0.6, 'Requires oxaloacetate to form citrate.')], { ent: 'tca' }),
    N('dnl', 'De novo lipogenesis', 'liver', 'pathway', [T('srebp', 0.9, 'SREBP-1c lipogenic program (ACC, FAS, SCD1) — kept high by hyperinsulinemia in insulin resistance.'), T('chrebp', 0.5, 'ChREBP (carbohydrate) — driven by glucose diverted from insulin-resistant muscle to the liver.'), T('malonyl', 0.35, 'Malonyl-CoA supply (ACC).'), T('citrate', 0.2, 'Citrate → cytosolic acetyl-CoA (ATP-citrate lyase).')], { ent: 'lipogenesis' }),
    N('htg', 'Hepatic triglyceride (steatosis)', 'liver', 'pathway', [T('ffa', 0.85, '"Substrate push": plasma fatty acids are re-esterified in the liver regardless of hepatic insulin signaling — the main lipogenic flux in insulin-resistant humans.'), T('dnl', 0.35, 'De novo lipogenesis adds newly made fatty acids (~23–26% of liver/VLDL TG in hyperinsulinemic NAFLD vs ~10% with low liver fat; Donnelly 2005, Lambert 2014).'), T('fat', 0.1, 'Dietary fat delivered as chylomicron remnants.'), T('h_fao', -0.12, 'Fatty acids oxidized are not stored — but oxidation removes only part of an increased FFA influx, so steatosis accompanies FFA excess (including uncontrolled diabetes).')], { ent: 'tg' }),
    N('hdag', 'Hepatic diacylglycerol (sn-1,2-DAG)', 'liver', 'signal', [T('htg', 0.8, 'Lipogenic DAG accumulates in parallel with re-esterification.')], { ent: 'dag' }),
    N('vldl', 'VLDL secretion', 'liver', 'pathway', [T('htg', 0.5, 'Hepatic triglyceride pool available for export.'), T('dnl', 0.3, 'Newly synthesized fatty acids are preferentially exported.'), T('ffa', 0.3, 'Re-esterified plasma fatty acids.'), T('h_ins', -0.3, 'Insulin acutely suppresses apoB/VLDL secretion (MTP, apoB degradation) — this suppression fails in hepatic insulin resistance → VLDL overproduction.')], { ent: 'vldl' }),
    N('hgo', 'Hepatic glucose output', 'liver', 'output', [C('h_glycogenolysis', 0.55, 'Glycogenolysis.'), C('gng', 0.45, 'Gluconeogenesis.')], { mode: 'sum', desc: 'Glucose released by liver = glycogenolysis + gluconeogenesis (via G6Pase).' }),
    N('h_aaup', 'Hepatic amino-acid uptake', 'liver', 'pathway', [T('aa', 0.7, 'Substrate.'), T('glucagon', 0.5, 'Glucagon stimulates hepatic amino-acid transport and catabolism (Wewer Albrechtsen 2019).'), T('cortisol', 0.2, 'Glucocorticoids increase amino-acid catabolic enzymes.')], { ent: 'transamination' }),
    N('urea', 'Ureagenesis', 'liver', 'pathway', [T('h_aaup', 0.8, 'Nitrogen load from amino-acid deamination.'), T('glucagon', 0.3, 'Glucagon increases urea-cycle enzyme expression/capacity.')], { ent: 'ureacycle' }),

    // ---------------- MUSCLE ----------------
    N('m_ins', 'Muscle insulin signaling (Akt)', 'muscle', 'signal', [
      T('insulin', 0.9, 'Insulin receptor → IRS-1 → PI3K → Akt2.'), T('sens', 1, 'Muscle insulin resistance: sarcolemmal sn-1,2-DAG → PKCθ → IRS-1 Ser1101 phosphorylation → ↓ PI3K/Akt → ↓ GLUT4 translocation. Glucose transport is the rate-controlling defect (Petersen & Shulman 2018).'),
      T('cortisol', -0.4, 'Glucocorticoids impair post-receptor signaling (↓ IRS-1/PI3K/Akt) and GLUT4 translocation — a major cause of steroid-induced hyperglycemia.'), T('gh', -0.2, 'GH antagonizes insulin action.'), T('ffa', -0.4, 'Lipid-induced insulin resistance: intramyocellular DAG → PKCθ. During lipid infusion intracellular G6P falls rather than rises, so impaired GLUT4 transport, not the classic Randle substrate-competition cycle, is the main defect.'),
    ], { ent: 'akt' }),
    N('m_ampk', 'Muscle AMPK', 'muscle', 'signal', [T('amp', 1, 'Rising AMP:ATP activates AMPK.')], { ent: 'ampk' }),
    N('m_contr', 'Contraction signals (Ca²⁺/CaMKII, Rac1)', 'muscle', 'signal', [T('exercise', 0.9, 'Excitation releases SR Ca²⁺; mechanical stress activates Rac1.')], { ent: 'camk' }),
    N('as160', 'AS160/TBC1D4 inhibited (insulin route)', 'muscle', 'signal', [T('m_ins', 0.8, 'Akt phosphorylates AS160/TBC1D4, inhibiting its Rab-GAP activity → Rab-GTP → GLUT4 vesicle translocation (Sano 2003).')], { ent: 'as160' }),
    N('tbc1d1', 'TBC1D1 inhibited (contraction route)', 'muscle', 'signal', [T('m_ampk', 0.5, 'AMPK phosphorylates TBC1D1.'), T('m_contr', 0.5, 'Ca²⁺/CaMKII and Rac1 signals act in parallel (Sylow 2017).')], { ent: 'tbc1d1' }),
    N('m_glut4', 'Muscle GLUT4 at membrane', 'muscle', 'enzyme', [
      C(null, 0.3, 'Basal surface GLUT4 (and GLUT1).'), C('as160', 0.45, 'Insulin-stimulated translocation.'), C('tbc1d1', 0.25, 'Contraction-stimulated translocation — independent of insulin and preserved in insulin resistance.'),
    ], { mode: 'sum', ent: 'glut4' }),
    N('m_clear', 'Muscle glucose clearance', 'muscle', 'enzyme', [T('m_glut4', 1, 'Transporters at the membrane.'), T('exercise', 0.45, 'Exercise increases capillary recruitment and blood flow (glucose delivery; Sylow 2017).')], { ent: 'glut4' }),
    N('m_uptake', 'Muscle glucose uptake', 'muscle', 'output', [T('m_clear', 1, 'Clearance capacity (GLUT4 × delivery).'), T('glucose', 0.7, 'Concentration gradient (mass action).')], { ent: 'glucose_uptake' }),
    N('mgly', 'Muscle glycogen store', 'muscle', 'signal', [T('exercise', -0.5, 'Contraction consumes muscle glycogen.'), T('fastdur', -0.3, 'Modest decline with fasting.'), T('carb', 0.1, 'Carbohydrate refeeding.')], { ent: 'glycogen' }),
    N('mglyav', 'Glycogen availability (muscle)', 'muscle', 'signal', [T('mgly', 1, 'Saturating substrate availability.')], { sat: 0.3 }),
    N('m_gp', 'Muscle glycogen phosphorylase', 'muscle', 'enzyme', [
      T('epi', 0.6, 'β2 → cAMP → PKA → phosphorylase kinase.'), T('m_contr', 0.6, 'Ca²⁺ activates phosphorylase kinase directly (calmodulin subunit).'), T('m_ampk', 0.2, 'AMP allosterically activates muscle phosphorylase b.'),
      T('mglyav', 0.7, 'Substrate availability.'), T('m_ins', -0.2, 'Insulin activates PP1, inactivating phosphorylase.'),
    ], { ent: 'gp', note: 'No glucagon term: skeletal muscle lacks meaningful glucagon-receptor signaling (Molina Ch7).' }),
    N('m_g6p', 'Muscle G6P', 'muscle', 'signal', [T('m_uptake', 0.7, 'Glucose → hexokinase II → G6P.'), T('m_gp', 0.3, 'Glycogen → G1P → G6P.')], { ent: 'g6p' }),
    N('m_gs', 'Muscle glycogen synthase', 'muscle', 'enzyme', [T('m_ins', 0.6, 'Akt ⊣ GSK3 → GS dephosphorylation.'), T('m_g6p', 0.4, 'G6P allosterically activates GS.'), T('epi', -0.3, 'PKA phosphorylates GS.'), T('mgly', -0.3, 'Glycogen content feeds back on GS (low glycogen → high GS activity after exercise).')], { ent: 'glycsyn' }),
    N('m_glycogenesis', 'Muscle glycogenesis', 'muscle', 'pathway', [T('m_gs', 0.8, 'Glycogen synthase activity.'), T('m_g6p', 0.5, 'Substrate.')], { ent: 'glycogenesis' }),
    N('m_glycogenolysis', 'Muscle glycogenolysis', 'muscle', 'pathway', [T('m_gp', 1, 'Phosphorylase activity.')], { ent: 'glycogenolysis' }),
    N('m_glycolysis', 'Muscle glycolysis', 'muscle', 'pathway', [T('m_g6p', 0.6, 'Substrate.'), T('m_ampk', 0.5, 'AMP/ADP activate PFK-1 — demand-driven.')], { ent: 'glycolysis' }),
    N('m_pdh', 'Muscle PDH', 'muscle', 'enzyme', [T('m_ins', 0.2, 'Insulin activates PDP.'), T('m_contr', 0.5, 'Ca²⁺ activates PDH phosphatase during contraction.'), T('ffa', -0.3, 'Fatty acid oxidation → PDK4/acetyl-CoA inhibition (Randle cycle).')], { ent: 'pdh' }),
    N('lactrel', 'Lactate release', 'muscle', 'output', [T('m_glycolysis', 0.9, 'Glycolytic pyruvate production.'), T('m_pdh', -0.4, 'Pyruvate not oxidized by PDH is reduced to lactate.')], { ent: 'lactate' }),
    N('m_malonyl', 'Muscle malonyl-CoA (ACC2)', 'muscle', 'signal', [T('m_ins', 0.3, 'Insulin activates ACC2.'), T('m_ampk', -0.8, 'AMPK phosphorylates ACC2 → malonyl-CoA falls during exercise.')], { ent: 'malonylcoa' }),
    N('m_fao', 'Muscle fatty-acid oxidation', 'muscle', 'pathway', [T('ffa', 0.6, 'Fatty-acid supply.'), T('m_malonyl', -0.5, 'Malonyl-CoA ⊣ CPT-1 (muscle isoform).'), T('exercise', 0.4, 'Oxidative demand.')], { ent: 'betaox' }),
    N('m_protsyn', 'Muscle protein synthesis (mTORC1)', 'muscle', 'pathway', [T('m_ins', 0.4, 'Akt → TSC2 ⊣ → Rheb → mTORC1.'), T('aa', 0.5, 'Leucine → Rag GTPases → mTORC1 (Saxton & Sabatini).'), T('cortisol', -0.3, 'Glucocorticoids inhibit mTORC1/translation.'), T('m_ampk', -0.2, 'AMPK inhibits mTORC1.'), T('gh', 0.15, 'GH/IGF-1 are anabolic.')], { ent: 'protsyn' }),
    N('brainket', 'Brain ketone oxidation', 'brain', 'pathway', [T('ketones', 0.85, 'Uptake rises with blood ketone concentration (MCT1).'), T('fastdur', 0.35, 'MCT transporter upregulation over days of fasting.')], { ent: 'ketolysis', sat: 12 }),
    N('m_proteolysis', 'Muscle proteolysis', 'muscle', 'pathway', [T('cortisol', 0.4, 'Glucocorticoids induce ubiquitin–proteasome components.'), T('m_ins', -0.7, 'Insulin suppresses proteolysis.'), T('ketones', -0.15, 'β-Hydroxybutyrate itself restrains muscle proteolysis and alanine release (Cahill 2006).'), T('brainglc', 0.8, 'As ketones replace glucose in the brain, gluconeogenic demand and muscle protein breakdown fall — protein sparing in prolonged starvation (Cahill 2006).')], { ent: 'proteolysis' }),
    N('alarel', 'Alanine/glutamine release', 'muscle', 'output', [T('m_proteolysis', 0.8, 'Amino acids from protein breakdown are transaminated onto pyruvate/glutamate.'), T('m_glycolysis', 0.2, 'Pyruvate accepts amino groups (alanine).')], { ent: 'alanine' }),
    N('m_ketox', 'Muscle ketone oxidation', 'muscle', 'pathway', [T('ketones', 0.6, 'Supply.'), T('fastdur', -0.15, 'In prolonged fasting muscle shifts toward fatty acids, leaving ketones for the brain.')], { ent: 'ketolysis' }),

    // ---------------- ADIPOSE ----------------
    N('a_ins', 'Adipocyte insulin signaling', 'adipose', 'signal', [T('insulin', 0.9, 'Insulin → Akt.'), T('sens', 1, 'Adipose insulin resistance.'), T('cortisol', -0.15, 'Glucocorticoid antagonism.'), T('gh', -0.25, 'GH antagonism.')], { ent: 'akt' }),
    N('a_pka', 'Adipocyte cAMP → PKA', 'adipose', 'signal', [
      T('epi', 0.8, 'β1/β3-adrenergic → Gs → cAMP.'), T('a_ins', -0.9, 'Akt → PDE3B → cAMP hydrolysis: the antilipolytic action of insulin (Petersen & Shulman).'),
      T('gh', 0.25, 'GH increases lipolysis (slower, transcriptional).'), T('cortisol', 0.15, 'Permissive effect of glucocorticoids.'),
    ], { ent: 'pka' }),
    N('lipolysis', 'Adipose lipolysis', 'adipose', 'pathway', [T('a_pka', 1.0, 'PKA phosphorylates HSL and perilipin-1 → ATGL/HSL activity (Zechner 2012).')], { ent: 'lipolysis' }),
    N('a_glut4', 'Adipose GLUT4 at membrane', 'adipose', 'enzyme', [T('a_ins', 0.8, 'Insulin → Akt → AS160 → GLUT4 translocation.')], { ent: 'glut4' }),
    N('a_uptake', 'Adipose glucose uptake', 'adipose', 'output', [T('a_glut4', 1, 'Transporters.'), T('glucose', 0.7, 'Mass action.')], { ent: 'glucose_uptake' }),
    N('lpl_a', 'Adipose LPL', 'adipose', 'enzyme', [T('insulin', 0.7, 'Insulin increases adipose LPL (fed: direct fat to storage).'), T('sens', 0.3, 'Insulin sensitivity.')], { ent: 'lpl' }),
    N('esterif', 'Adipose TG synthesis', 'adipose', 'pathway', [T('a_uptake', 0.4, 'Glucose → DHAP → glycerol-3-P backbone.'), T('lpl_a', 0.5, 'Fatty acids from lipoprotein triglyceride.'), T('a_ins', 0.3, 'Insulin activates esterification enzymes.')], { ent: 'tgsynth' }),
    N('leptin', 'Leptin', 'adipose', 'hormone', [T('insulin', 0.2, 'Insulin/feeding increases leptin.'), T('fastdur', -0.4, 'Leptin falls quickly with fasting — a starvation signal to the hypothalamus.')], { ent: 'leptin' }),

    // ---------------- BRAIN ----------------
    N('brainglc', 'Brain glucose use', 'brain', 'output', [C(null, 0.95, 'Brain energy demand is roughly constant.'), C('glucose', 0.1, 'GLUT1/3 are near-saturated at normal glucose; uptake falls when glucose is very low.'), C('brainket', -0.05, 'Ketone oxidation replaces part of the brain’s glucose use (Owen 1967).')], { mode: 'sum', ent: 'glucose' }),

    // ---------------- KIDNEY ----------------
    N('renalgng', 'Renal gluconeogenesis', 'kidney', 'pathway', [T('fastdur', 0.2, 'Contribution grows in prolonged fasting (glutamine, with acid excretion).'), T('epi', 0.2, 'Adrenergic stimulation.'), T('insulin', -0.3, 'Insulin suppresses renal gluconeogenesis.')], { ent: 'gluconeogenesis' }),
  ];

  // Some nodes defined after use (ketone use by muscle etc.). Order matters only for convergence speed.
  const M = (EP.metabolic = {
    nodes,
    organs: {
      pancreas: 'Pancreas', liver: 'Liver', muscle: 'Skeletal muscle', adipose: 'Adipose tissue', brain: 'Brain', kidney: 'Kidney', gut: 'Gut', adrenal: 'Adrenal', pituitary: 'Pituitary', systemic: 'Blood / whole body',
    },
    tiers: ['input', 'hormone', 'signal', 'enzyme', 'pathway', 'output', 'systemic'],
    tierLabels: { input: 'Stimulus', hormone: 'Hormone', signal: 'Receptor / signaling', enzyme: 'Enzyme / transporter', pathway: 'Pathway', output: 'Organ output', systemic: 'Whole-body' },
  });

  // ---------- physiological states ----------
  M.presets = [
    { id: 'postabs', label: 'Post-absorptive (overnight fast)', icon: '🌙', inputs: {}, text: 'The reference state (all values = 1). Liver glycogenolysis and gluconeogenesis supply glucose consumed mostly by brain; insulin is low-basal, fatty acids fuel muscle.' },
    { id: 'fed', label: 'Fed state', icon: '🍽', inputs: { carb: 9, fat: 2, protein: 3, fastdur: 0.55 }, text: 'High insulin / low glucagon. Glucose uptake, glycogen synthesis, glycolysis, lipogenesis and protein synthesis rise; lipolysis, gluconeogenesis and ketogenesis fall. Malonyl-CoA rises and closes CPT-1.' },
    { id: 'early', label: 'Early fasting (~24 h)', icon: '⏳', inputs: { fastdur: 1.9 }, text: 'Insulin falls further and glucagon rises: glycogenolysis (while glycogen lasts), gluconeogenesis, lipolysis and fatty acid oxidation increase; ketogenesis begins.' },
    { id: 'prolonged', label: 'Prolonged fasting (days–weeks)', icon: '🏜', inputs: { fastdur: 7 }, text: 'Hepatic glycogen is depleted; gluconeogenesis and ketogenesis dominate; the brain oxidizes ketones and uses less glucose, so muscle proteolysis falls (protein sparing; Cahill 2006, Owen 1967). Renal gluconeogenesis grows.' },
    { id: 'exercise', label: 'Exercise', icon: '🏃', inputs: { exercise: 5 }, text: 'Contraction (AMPK, Ca²⁺/CaMKII, Rac1) translocates GLUT4 even though insulin falls (α2-adrenergic suppression). Muscle glycogenolysis and glycolysis rise, lactate is released, fatty-acid oxidation increases, and glucagon + epinephrine raise hepatic glucose output.' },
    { id: 'stress', label: 'Acute stress', icon: '⚡', inputs: { stress: 4 }, text: 'Epinephrine and cortisol: hepatic glucose output and lipolysis rise, insulin secretion is restrained (α2), proteolysis increases — stress hyperglycemia.' },
    { id: 'ir', label: 'Insulin resistance', icon: '🧱', inputs: { sens: 0.3 }, text: 'Impaired signaling to Akt in muscle, liver and fat. β-cells compensate with hyperinsulinemia, keeping glucose only mildly raised — while lipolysis is less suppressed (↑ FFA). In the liver, insulin still drives **lipogenesis**: hyperinsulinemia → SREBP-1c, plus glucose diverted from insulin-resistant muscle → ChREBP, so **de novo lipogenesis roughly doubles** (Petersen 2007, Lambert 2014). Together with FFA re-esterification this gives steatosis, hepatic DAG → PKCε (worsening hepatic insulin resistance), VLDL overproduction and hypertriglyceridemia. Ketogenesis stays low because insulin is high.' },
    { id: 't2d', label: 'Type 2 diabetes', icon: '🩸', inputs: { sens: 0.3, betacap: 0.35 }, text: 'Insulin resistance plus β-cell dysfunction: compensation fails → fasting hyperglycemia, ↑ hepatic glucose output, relative glucagon excess. Insulin is still above normal, so lipogenesis, steatosis and VLDL/TG remain raised and ketosis is only mild — unlike insulin-deficient T1D.' },
    { id: 't1d', label: 'Type 1 diabetes (untreated)', icon: '⚠', inputs: { betacap: 0.01 }, text: 'Absolute insulin deficiency: unrestrained lipolysis → FFA flood → hepatic β-oxidation and ketogenesis (low malonyl-CoA, high glucagon) → ketoacidosis; hyperglycemia from ↑ HGO and ↓ uptake.' },
  ];

  // ---------- What-if perturbations ----------
  M.perturbations = [
    { id: 'ins_up', label: '↑ Insulin', focus: 'insulin', apply: { exo: { insulin: 3 } }, clampGlucose: true, note: 'Exogenous insulin infusion. With "hold glucose constant" on, this is a hyperinsulinemic–euglycemic clamp — isolating insulin\'s direct actions.' },
    { id: 'ins_dn', label: '↓ Insulin', focus: 'insulin', apply: { inputs: { betacap: 0.15 } }, note: 'Loss of β-cell secretion.' },
    { id: 'gcg_up', label: '↑ Glucagon', focus: 'glucagon', apply: { exo: { glucagon: 3 } }, clampInsulin: true, note: 'Glucagon infusion with insulin held at basal (pancreatic clamp, as in human glucagon studies) — the liver responds while skeletal muscle barely does. Untick "hold insulin" to see how the resulting hyperglycemia recruits insulin and blunts ketogenesis.' },
    { id: 'gcg_dn', label: '↓ Glucagon', focus: 'glucagon', apply: { clamps: { glucagon: 0.3 } }, note: 'Glucagon held low (e.g., receptor antagonism).' },
    { id: 'cort_up', label: '↑ Cortisol', focus: 'cortisol', apply: { exo: { cortisol: 2.5 } }, note: 'Glucocorticoid excess: insulin resistance, ↑ gluconeogenic enzymes and proteolysis. With normal β-cells, compensatory hyperinsulinemia keeps fasting glucose near normal — overt steroid-induced hyperglycemia appears after meals or when β-cell reserve is limited (try lowering β-cell capacity). Also see the HPA axis: CRH and ACTH fall.' , axis: 'hpa', axisPreset: 'exo' },
    { id: 'cort_dn', label: '↓ Cortisol', focus: 'cortisol', apply: { clamps: { cortisol: 0.25 } }, note: 'Adrenal insufficiency (metabolic view).', axis: 'hpa', axisPreset: 'primary' },
    { id: 'gh_up', label: '↑ Growth hormone', focus: 'gh', apply: { exo: { gh: 3 } }, note: 'GH excess: lipolytic and diabetogenic.' },
    { id: 'epi_up', label: '↑ Catecholamines', focus: 'epi', apply: { exo: { epi: 3 } }, note: 'Epinephrine infusion / pheochromocytoma-like.' },
    { id: 'glc_up', label: '↑ Glucose', focus: 'glucose', apply: { inputs: { carb: 9 } }, note: 'Oral glucose load.' },
    { id: 'glc_dn', label: '↓ Glucose (hypoglycemia)', focus: 'glucose', apply: { clamps: { glucose: 0.55 } }, note: 'Glucose clamped low: watch the counter-regulatory cascade.' },
    { id: 'ffa_up', label: '↑ Fatty acids', focus: 'ffa', apply: { clamps: { ffa: 3 } }, note: 'Lipid infusion / unrestrained lipolysis: β-oxidation, acetyl-CoA, PC and ketones rise; muscle insulin signaling falls.' },
    { id: 'aa_up', label: '↑ Amino acids', focus: 'aa', apply: { inputs: { protein: 5 } }, note: 'Protein meal: both insulin and glucagon rise.' },
    { id: 'acoa_up', label: '↑ Acetyl-CoA', focus: 'acoa', apply: { clamps: { acoa: 3 } }, note: 'Hepatic acetyl-CoA forced high: pyruvate carboxylase → gluconeogenesis, and ketogenesis — but no net glucose from acetyl-CoA itself.' },
    { id: 'fast', label: 'Fasting', focus: 'fastdur', apply: { inputs: { fastdur: 3 } } },
    { id: 'feed', label: 'Feeding', focus: 'carb', apply: { inputs: { carb: 9, fat: 2, protein: 3, fastdur: 0.55 } } },
    { id: 'ex', label: 'Exercise', focus: 'exercise', apply: { inputs: { exercise: 5 } } },
    { id: 'ir', label: 'Insulin resistance', focus: 'sens', apply: { inputs: { sens: 0.3 } } },
  ];

  M.create = function () { return new EP.Model({ nodes: M.nodes, newton: true, iters: 3000, damp: 0.05 }); };
})();
