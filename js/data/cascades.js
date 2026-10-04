/* Signaling cascade definitions for EP.mountCascade (js/core/cascade.js).
 * Columns are stages; rows are grouped into coloured branches. 'R' is the receptor bar.
 * Links: [from, to, '+'|'-', why, {w, fb}] — fb links are drawn but not propagated. */
(function () {
  const C = window.EP.cascades = window.EP.cascades || {};
  const N = (id, label, col, row, branch, type, o) => Object.assign({ id, label, col, row, branch, type: type || 'kinase' }, o || {});
  const BR = (id, label, c, desc) => ({ id, label, c, desc });
  const STD = ['Adaptor / G protein', 'Messenger', 'Core kinase', 'Effector', 'Target', 'Result'];

  // =====================================================================
  // INSULIN
  // =====================================================================
  C.insulin = {
    id: 'insulin', title: 'Insulin signaling network', ligand: 'Insulin',
    receptor: { label: 'Insulin receptor (α₂β₂ tyrosine kinase)', short: 'INSR', ent: 'ir', why: 'Insulin binding to the α subunits triggers trans-autophosphorylation of the β-subunit kinases, which then phosphorylate IRS proteins and Shc on tyrosine. From this single node the signal **diverges** into metabolic (PI3K–Akt), anabolic (mTORC1) and mitogenic (Ras–MAPK) branches (Taniguchi 2006).' },
    cols: ['Adaptor', 'Lipid messenger', 'Core kinase', 'Effector', 'Target', 'Result'],
    branches: [
      BR('pi3k', 'PI3K → Akt: metabolic actions', 1, 'The **metabolic** arm. IRS-1/2 recruit PI3K, PIP₃ recruits PDK1 and Akt, and Akt phosphorylates AS160, GSK3, FOXO1/3 and PDE3B. These outputs appear in **minutes** (GLUT4, glycogen, lipolysis) or **hours** (gene expression). This arm is impaired in lipid-induced insulin resistance (Petersen & Shulman 2018).'),
      BR('mtor', 'mTORC1: growth & anabolism', 2, 'Akt inhibits the TSC1/2 complex, freeing Rheb-GTP to activate **mTORC1** (which also needs amino acids via Rag GTPases). mTORC1 drives protein and lipid synthesis and suppresses autophagy. **S6K1 phosphorylates IRS-1 on serine** — a built-in negative feedback (Saxton & Sabatini 2017).'),
      BR('mapk', 'Ras → MAPK: mitogenic / growth', 4, 'Shc (and IRS) bind Grb2–SOS, which loads Ras with GTP → Raf → MEK → ERK1/2 → transcription factors. This arm controls **gene expression, proliferation and differentiation** (hours–days) and is not required for most acute metabolic actions (Taniguchi 2006).'),
    ],
    nodes: [
      N('irs', 'IRS-1 / IRS-2', 0, 2, 'pi3k', 'kinase', { ent: 'irs', why: 'Docking proteins phosphorylated on tyrosine by the receptor; phospho-YXXM motifs recruit PI3K.' }),
      N('ptp1b', 'PTP1B (phosphatase)', 0, 4, 'pi3k', 'enzyme', { why: 'Protein-tyrosine phosphatase 1B dephosphorylates the insulin receptor and IRS, terminating signaling. Its loss increases insulin sensitivity (Taniguchi 2006).' }),
      N('pi3k', 'PI3K → PIP₃', 1, 2, 'pi3k', 'kinase', { ent: 'pi3k', why: 'Class IA PI3K (p85 regulatory + p110 catalytic) converts PIP₂ to PIP₃ at the membrane.' }),
      N('pten', 'PTEN / SHIP2', 1, 4, 'pi3k', 'enzyme', { ent: 'pten', why: 'Lipid phosphatases that remove PIP₃ (PTEN: 3-phosphate; SHIP2: 5-phosphate) and switch the signal off.' }),
      N('akt', 'Akt2 (via PDK1 + mTORC2)', 2, 2, 'pi3k', 'kinase', { ent: 'akt', why: 'The central metabolic node. PIP₃ recruits Akt and PDK1; full activation needs PDK1 (Thr308) and mTORC2 (Ser473).' }),
      N('as160', 'AS160 / TBC1D4 (Rab-GAP)', 3, 0, 'pi3k', 'enzyme', { ent: 'as160', why: 'Active AS160 keeps GLUT4-vesicle Rabs GDP-bound. Akt phosphorylation **inhibits** it (Sano 2003).' }),
      N('rab', 'Rab8A / 10 / 13-GTP', 4, 0, 'pi3k', 'kinase', { ent: 'rab', why: 'GTP-bound Rabs engage motors and tethers that move GLUT4 storage vesicles to the membrane.' }),
      N('o_glut4', 'GLUT4 translocation → glucose uptake', 5, 0, 'pi3k', 'outcome', { time: 'minutes', ent: 'glut4', why: 'Muscle and adipose glucose uptake rises within minutes as GLUT4 vesicles fuse with the plasma membrane.' }),
      N('gsk3', 'GSK3', 3, 1, 'pi3k', 'kinase', { ent: 'gsk3', why: 'Glycogen synthase kinase 3 phosphorylates and inhibits glycogen synthase; Akt phosphorylates (inhibits) GSK3. Dispensable in vivo: insulin-insensitive GSK3 knock-in mice store glycogen normally — G6P allostery is the main switch (Petersen & Shulman 2018).' }),
      N('gs', 'Glycogen synthase (+ PP1, G6P)', 4, 1, 'pi3k', 'enzyme', { ent: 'glycsyn', why: 'Activated by dephosphorylation (PP1) and allosterically by G6P. In liver, glucokinase/G6P and PP1 dominate; GSK3 phosphorylation alone is insufficient (Petersen & Shulman 2018).' }),
      N('o_glyc', 'Glycogen synthesis', 5, 1, 'pi3k', 'outcome', { time: 'minutes', why: 'Muscle stores most insulin-stimulated glucose as glycogen (Shulman 1990).' }),
      N('foxo1', 'FOXO1 (nuclear)', 3, 2, 'pi3k', 'tf', { ent: 'foxo1', why: 'Akt phosphorylation → 14-3-3 binding → nuclear exclusion.' }),
      N('pepck', 'PCK1 / G6PC transcription', 4, 2, 'pi3k', 'gene', { ent: 'pepck', why: 'FOXO1 with PGC-1α drives the gluconeogenic genes.' }),
      N('o_gng', 'Gluconeogenic enzyme capacity (liver)', 5, 2, 'pi3k', 'outcome', { time: 'hours', why: 'Slow: transcriptional control matters most during longer fasts (Petersen & Shulman 2018).' }),
      N('pde3b', 'PDE3B', 3, 3, 'pi3k', 'enzyme', { ent: 'pde3b', why: 'Insulin activates phosphodiesterase 3B, which hydrolyses cAMP. Akt phosphorylates PDE3B Ser273, but that site and Akt2 are dispensable for antilipolysis; signalosome assembly and phosphatases (PP2A → HSL, PP1 → perilipin) also contribute (Petersen & Shulman 2018).' }),
      N('pka', 'cAMP → PKA', 4, 3, 'pi3k', 'messenger', { ent: 'pka', why: 'Less cAMP → less PKA. This opposes glucagon and catecholamine signaling.' }),
      N('o_lipol', 'Lipolysis (ATGL, HSL)', 5, 3, 'pi3k', 'outcome', { time: 'minutes', ent: 'hsl', why: 'Antilipolysis is the most insulin-sensitive action in the body; it falls at insulin levels lower than those needed to stimulate glucose uptake.' }),
      N('foxo3', 'FOXO3 (muscle)', 3, 4, 'pi3k', 'tf', { why: 'Akt phosphorylates FOXO3, keeping it out of the nucleus.' }),
      N('atro', 'Atrogin-1, MuRF1 genes', 4, 4, 'pi3k', 'gene', { why: 'Muscle-specific ubiquitin ligases of the proteasomal pathway.' }),
      N('o_prot', 'Muscle proteolysis', 5, 4, 'pi3k', 'outcome', { time: 'hours', ent: 'proteolysis', why: 'Insulin restrains protein breakdown; insulin deficiency causes muscle wasting.' }),
      N('gk', 'Glucokinase expression (liver)', 4, 5, 'pi3k', 'gene', { ent: 'gk', why: 'Akt-dependent glucokinase expression is a major control point for hepatic glycogen synthesis and glycolysis (Petersen & Shulman 2018).' }),
      N('o_hglu', 'Hepatic glucose uptake & glycolysis', 5, 5, 'pi3k', 'outcome', { time: 'hours', why: 'More glucokinase → more G6P → glycogen and glycolysis/lipogenesis.' }),
      N('tsc', 'TSC1 / TSC2', 2, 7, 'mtor', 'enzyme', { why: 'GTPase-activating complex for Rheb; Akt phosphorylates TSC2 and inhibits it.' }),
      N('rheb', 'Rheb-GTP', 3, 7, 'mtor', 'kinase', { ent: 'rheb', why: 'Activates mTORC1 at the lysosome.' }),
      N('aa', 'Amino acids (Rag GTPases)', 3, 8, 'mtor', 'messenger', { ent: 'aa', why: 'mTORC1 needs both a growth-factor signal (Rheb) and an amino-acid signal (Rags). Leucine is especially potent.' }),
      N('mtor', 'mTORC1', 4, 7, 'mtor', 'kinase', { ent: 'mtorc1', why: 'Phosphorylates S6K1 and 4E-BP1 (translation), promotes SREBP-1c processing (lipogenesis), inhibits ULK1 (autophagy).' }),
      N('o_psyn', 'Protein synthesis (S6K1, 4E-BP1 → eIF4E)', 5, 6, 'mtor', 'outcome', { time: 'min–hours', ent: 'protsyn', why: 'mTORC1 releases eIF4E from 4E-BP1 and activates S6K1 → cap-dependent translation and ribosome biogenesis.' }),
      N('o_dnl', 'Lipogenesis via SREBP-1c (liver)', 5, 7, 'mtor', 'outcome', { time: 'hours', ent: 'srebp1c', why: 'mTORC1 promotes SREBP-1c processing → ACC, FAS, SCD1 → de novo lipogenesis.' }),
      N('o_auto', 'Autophagy (ULK1)', 5, 8, 'mtor', 'outcome', { time: 'min–hours', why: 'mTORC1 phosphorylates and inhibits ULK1, suppressing autophagy in the fed state.' }),
      N('shc', 'Shc (and IRS)', 0, 11, 'mapk', 'kinase', { why: 'Shc is tyrosine-phosphorylated by the receptor and binds Grb2.' }),
      N('grb2', 'Grb2–SOS', 1, 11, 'mapk', 'kinase', { why: 'SOS is a guanine-nucleotide exchange factor that loads Ras with GTP.' }),
      N('ras', 'Ras-GTP', 2, 11, 'mapk', 'kinase', { why: 'Small GTPase; switched off by its own GTPase activity (accelerated by GAPs).' }),
      N('raf', 'Raf → MEK1/2', 3, 11, 'mapk', 'kinase', { ent: 'mapk', why: 'Kinase cascade: Raf phosphorylates MEK, which phosphorylates ERK on Thr and Tyr.' }),
      N('erk', 'ERK1/2', 4, 11, 'mapk', 'kinase', { ent: 'mapk', why: 'Translocates to the nucleus and phosphorylates transcription factors (e.g., Elk-1).' }),
      N('o_tx', 'Immediate-early genes (Elk-1 → c-Fos)', 5, 10, 'mapk', 'outcome', { time: 'min–hours', why: 'ERK-dependent transcription is the first step of the growth program.' }),
      N('o_prolif', 'Cell proliferation', 5, 11, 'mapk', 'outcome', { time: 'days', why: 'Insulin is a weak mitogen compared with IGF-1, but it uses the same Ras–MAPK machinery.' }),
      N('o_diff', 'Differentiation & growth', 5, 12, 'mapk', 'outcome', { time: 'days', why: 'e.g., adipocyte differentiation; trophic actions on many cell types.' }),
    ],
    links: [
      ['R', 'irs', '+', 'Receptor tyrosine kinase phosphorylates IRS-1/2.'], ['R', 'shc', '+', 'Receptor tyrosine kinase phosphorylates Shc.'],
      ['ptp1b', 'irs', '-', 'PTP1B dephosphorylates the receptor and IRS.'],
      ['irs', 'pi3k', '+', 'p85 SH2 domains bind phospho-YXXM on IRS.'], ['pten', 'pi3k', '-', 'PTEN removes PIP₃.'],
      ['pi3k', 'akt', '+', 'PIP₃ recruits Akt and PDK1 via PH domains.'],
      ['akt', 'as160', '-', 'Akt phosphorylates AS160 (Thr642), inhibiting its GAP activity.'], ['as160', 'rab', '-', 'AS160 keeps Rabs GDP-bound.'], ['rab', 'o_glut4', '+', 'Rab-GTP drives vesicle translocation and fusion.'],
      ['akt', 'gsk3', '-', 'Akt phosphorylates GSK3α/β (Ser21/Ser9).'], ['gsk3', 'gs', '-', 'GSK3 phosphorylates and inhibits glycogen synthase.'], ['gs', 'o_glyc', '+'],
      ['akt', 'foxo1', '-', 'Nuclear exclusion of FOXO1.'], ['foxo1', 'pepck', '+', 'FOXO1/PGC-1α drive PCK1 and G6PC.'], ['pepck', 'o_gng', '+'],
      ['akt', 'pde3b', '+', 'Insulin activates PDE3B (Akt phosphorylates Ser273, though this site is dispensable).'], ['pde3b', 'pka', '-', 'PDE3B hydrolyses cAMP.'], ['pka', 'o_lipol', '+', 'PKA phosphorylates HSL and perilipin-1.'],
      ['akt', 'foxo3', '-'], ['foxo3', 'atro', '+'], ['atro', 'o_prot', '+'],
      ['akt', 'gk', '+', 'Hepatic glucokinase expression requires Akt (Petersen & Shulman 2018).'], ['gk', 'o_hglu', '+'],
      ['akt', 'tsc', '-', 'Akt phosphorylates TSC2 (and PRAS40), releasing the brake on mTORC1.'], ['tsc', 'rheb', '-', 'TSC2 is a GAP for Rheb.'], ['rheb', 'mtor', '+'], ['aa', 'mtor', '+', 'Amino acids recruit mTORC1 to the lysosome via Rag GTPases.'],
      ['mtor', 'o_psyn', '+'], ['mtor', 'o_dnl', '+'], ['mtor', 'o_auto', '-'],
      ['mtor', 'irs', '-', '**Negative feedback:** S6K1 phosphorylates IRS-1 on serine, reducing PI3K recruitment (Saxton & Sabatini 2017).', { fb: true, route: 'left' }],
      ['shc', 'grb2', '+'], ['irs', 'grb2', '+', 'IRS can also bind Grb2.', { w: 0.4 }], ['grb2', 'ras', '+'], ['ras', 'raf', '+'], ['raf', 'erk', '+'],
      ['erk', 'o_tx', '+'], ['erk', 'o_prolif', '+'], ['erk', 'o_diff', '+'],
    ],
    knock: [
      { id: 'lipid', label: 'Lipid-induced insulin resistance (PKCε/θ)', force: { irs: 0.3 }, desc: 'Membrane sn-1,2-DAG activates PKCθ (muscle, IRS-1 Ser1101) and PKCε (liver, INSR Thr1160), so signaling through IRS → PI3K → Akt is **blunted** (Petersen & Shulman 2018). Here the Shc → MAPK arm is left intact to illustrate the proposal that growth signaling is relatively preserved while metabolic signaling fails.' },
      { id: 'downreg', label: 'Receptor down-regulation (chronic hyperinsulinemia)', force: { R: 0.35 }, desc: 'Chronic hyperinsulinemia of obesity increases receptor endocytosis and degradation, lowering receptor number. Calorie restriction lowers insulin, restores receptors and reduces insulin resistance (Kovacs Ch3).' },
      { id: 'irab', label: 'Anti-insulin-receptor autoantibodies', force: { R: 0.1 }, desc: 'Rare autoantibodies block insulin binding (and can mimic insulin). They usually cause desensitization, extreme insulin resistance and hyperinsulinemia; occasionally hypoglycemia (Kovacs Ch3).' },
      { id: 'pi3ki', label: 'PI3Kα inhibitor (e.g., alpelisib)', force: { pi3k: 0 }, desc: 'Blocking PI3K removes GLUT4 translocation, glycogen synthesis and FOXO1 restraint. Hyperglycemia is a characteristic side effect of PI3Kα inhibitors used in cancer therapy.' },
      { id: 'tbc', label: 'TBC1D4 (AS160) truncation', force: { as160: 0 }, desc: 'AS160 cannot be inhibited by Akt, so GLUT4 stays inside; other Akt outputs are preserved. Associated with postprandial hyperglycemia (Petersen & Shulman 2018).' },
      { id: 'rapa', label: 'Rapamycin (mTORC1 inhibitor)', force: { mtor: 0 }, desc: 'Removes insulin-stimulated protein synthesis and lipogenesis, and autophagy is no longer suppressed. It also removes the S6K1 → IRS-1 negative feedback.' },
      { id: 'mek', label: 'MEK inhibitor', force: { raf: 0 }, desc: 'The mitogenic arm is cut; the metabolic actions (GLUT4, glycogen, antilipolysis) still occur because they use PI3K–Akt.' },
      { id: 'ptp1b', label: 'PTP1B deficiency (basal insulin)', force: { ptp1b: -1 }, desc: 'Set insulin to **basal**: without PTP1B, receptor/IRS phosphorylation persists, so signaling is enhanced — increased insulin sensitivity (Taniguchi 2006).' },
      { id: 'aa', label: 'Protein meal (amino acids ↑)', force: { aa: 1 }, desc: 'Amino acids activate mTORC1 independently of insulin. Set insulin to **basal** to see mTORC1 outputs rise alone.' },
    ],
    steps: [
      { n: ['R', 'irs', 'shc'], t: '**1. Receptor activation.** Insulin binds; the β-subunit kinases trans-phosphorylate and then phosphorylate IRS and Shc on tyrosine.' },
      { n: ['irs', 'pi3k', 'pten', 'akt'], t: '**2. PI3K → PIP₃ → Akt.** PIP₃ recruits Akt and PDK1. PTEN/SHIP2 and PTP1B oppose the signal.' },
      { n: ['akt', 'as160', 'rab', 'o_glut4', 'gsk3', 'gs', 'o_glyc'], t: '**3. Minutes: glucose in, glycogen made.** Akt inhibits AS160 (GLUT4 translocates) and GSK3 (glycogen synthase active).' },
      { n: ['akt', 'pde3b', 'pka', 'o_lipol'], t: '**4. Minutes: fat kept in.** PDE3B lowers cAMP → PKA falls → ATGL/HSL activity falls.' },
      { n: ['akt', 'foxo1', 'pepck', 'o_gng', 'foxo3', 'atro', 'o_prot', 'gk', 'o_hglu'], t: '**5. Hours: gene programs.** FOXO1/3 leave the nucleus (fewer gluconeogenic and atrophy genes); glucokinase is induced.' },
      { n: ['akt', 'tsc', 'rheb', 'aa', 'mtor', 'o_psyn', 'o_dnl', 'o_auto', 'irs'], t: '**6. mTORC1: build.** With amino acids present, mTORC1 drives protein synthesis and lipogenesis and shuts off autophagy. S6K1 feeds back to dampen IRS-1.' },
      { n: ['R', 'shc', 'grb2', 'ras', 'raf', 'erk', 'o_tx', 'o_prolif', 'o_diff'], t: '**7. Ras–MAPK: grow.** Shc–Grb2–SOS → Ras → Raf → MEK → ERK → transcription → proliferation and differentiation over hours to days.' },
    ],
    refs: ['taniguchi2006', 'petersen2018', 'saxton2017', 'sano2003', 'matsumoto2007', 'shulman1990', 'kovacs3', 'kovacs15', 'molina7'],
  };

  // =====================================================================
  // GLUCAGON (hepatocyte)
  // =====================================================================
  C.glucagon = {
    id: 'glucagon', title: 'Glucagon signaling in the hepatocyte', ligand: 'Glucagon',
    receptor: { label: 'Glucagon receptor (GCGR, class B GPCR)', short: 'GCGR', ent: 'gcgr', why: 'GCGR is abundant in liver (also kidney) and essentially absent from skeletal muscle, so glucagon is a **hepatic** hormone. It couples mainly to **Gαs**, and also to **Gαq** (Jiang & Zhang 2003; Müller 2017).' },
    cols: ['G protein', 'Messenger', 'Kinase', 'Target enzyme / factor', 'Intermediate', 'Result'],
    branches: [
      BR('gly', 'Glycogen: seconds–minutes', 1, 'PKA phosphorylates **phosphorylase kinase**, which phosphorylates glycogen phosphorylase (b → a). PKA also phosphorylates **glycogen synthase** (inactive) and inhibitor-1 (↓ PP1). Result: rapid glucose release from glycogen without futile cycling (Ramnanan 2011).'),
      BR('gng', 'Glycolysis ↔ gluconeogenesis: minutes', 2, 'PKA phosphorylates the bifunctional **PFK-2/FBPase-2**, switching it to phosphatase mode → **fructose-2,6-bisphosphate falls** → PFK-1 slows, FBPase-1 is released. PKA also inhibits **L-pyruvate kinase**, keeping PEP for gluconeogenesis (Pilkis 1992).'),
      BR('tx', 'Gene transcription: hours', 3, 'PKA phosphorylates **CREB**; PKA-mediated inhibition of salt-inducible kinases lets **CRTC2** (TORC2) dephosphorylate and enter the nucleus. Together they induce PGC-1α, PCK1 and G6PC (Koo 2005). Glucagon also increases hepatic amino-acid uptake and ureagenesis (liver–α-cell axis; Wewer Albrechtsen 2019).'),
      BR('fat', 'Fat oxidation & ketogenesis', 4, 'PKA (and AMPK) phosphorylate and inhibit **ACC** → malonyl-CoA falls → CPT-1 is disinhibited → more β-oxidation. With low insulin, acetyl-CoA is channelled into ketone bodies (McGarry & Foster).'),
      BR('gq', 'Gq → InsP3R1 → Ca²⁺', 5, 'GCGR–Gq → PLC → IP₃ → **InsP3R1** Ca²⁺ release (PKA also phosphorylates InsP3R1). In rodents this drives **intrahepatic lipolysis** → acetyl-CoA → pyruvate carboxylase → gluconeogenesis (Perry 2020).'),
    ],
    nodes: [
      N('gs', 'Gαs', 0, 3, null, 'messenger', { why: 'GTP-bound Gαs dissociates from βγ and activates adenylyl cyclase; its intrinsic GTPase ends the signal.' }),
      N('ac', 'Adenylyl cyclase → cAMP', 1, 3, null, 'messenger', { ent: 'camp', why: 'cAMP is the second messenger; one receptor activates many G proteins → large amplification.' }),
      N('pde', 'PDEs (insulin ↑ PDE3B)', 1, 5, null, 'enzyme', { ent: 'pde3b', why: 'Degrade cAMP. Insulin activates PDE3B — one way insulin opposes glucagon.' }),
      N('pka', 'PKA', 2, 3, null, 'kinase', { ent: 'pka', why: 'cAMP binds the regulatory subunits, releasing active catalytic subunits.' }),
      N('phk', 'Phosphorylase kinase', 3, 0, 'gly', 'kinase', { ent: 'phk', why: 'Phosphorylated and activated by PKA.' }),
      N('gp', 'Glycogen phosphorylase a', 4, 0, 'gly', 'enzyme', { ent: 'gp', why: 'Releases glucose-1-P from glycogen.' }),
      N('o_glyco', 'Glycogenolysis → glucose release', 5, 0, 'gly', 'outcome', { time: 'seconds–min', why: 'Dominates the acute rise in hepatic glucose output after glucagon (Ramnanan 2011). Requires glycogen stores.' }),
      N('gsyn', 'Glycogen synthase', 3, 1, 'gly', 'enzyme', { ent: 'glycsyn', why: 'Phosphorylated and inactivated by PKA (and phosphorylase kinase).' }),
      N('o_gsyn', 'Glycogen synthesis', 5, 1, 'gly', 'outcome', { time: 'minutes', why: 'Switched off — no futile cycling.' }),
      N('pfk2', 'PFK-2 / FBPase-2 (bifunctional)', 3, 2, 'gng', 'enzyme', { ent: 'f26bp', why: 'PKA phosphorylation inhibits the kinase and activates the phosphatase activity.' }),
      N('f26', 'Fructose-2,6-P₂', 4, 2, 'gng', 'messenger', { ent: 'f26bp', why: 'Potent activator of PFK-1 and inhibitor of FBPase-1.' }),
      N('o_glycolysis', 'Glycolysis (PFK-1, L-PK)', 5, 2, 'gng', 'outcome', { time: 'minutes', ent: 'glycolysis', why: 'Slowed.' }),
      N('o_gngflux', 'Gluconeogenic flux (FBPase-1, PEP retained)', 5, 3, 'gng', 'outcome', { time: 'minutes', ent: 'gluconeogenesis', why: 'Lower F-2,6-BP releases FBPase-1; less L-PK activity stops PEP from cycling back to pyruvate.' }),
      N('lpk', 'L-pyruvate kinase', 3, 4, 'gng', 'enzyme', { ent: 'lpk', why: 'Liver isoform; inhibited by PKA phosphorylation.' }),
      N('crtc2', 'CREB + CRTC2', 3, 5, 'tx', 'tf', { ent: 'creb', why: 'CREB is phosphorylated by PKA; CRTC2 is dephosphorylated and enters the nucleus in fasting (Koo 2005).' }),
      N('genes', 'PGC-1α, PCK1, G6PC genes', 4, 5, 'tx', 'gene', { ent: 'pepck', why: 'Gluconeogenic enzyme genes.' }),
      N('o_genes', 'Gluconeogenic enzyme capacity', 5, 5, 'tx', 'outcome', { time: 'hours', why: 'Sustains gluconeogenesis during prolonged fasting.' }),
      N('aagenes', 'Amino-acid transporters, urea-cycle enzymes', 4, 6, 'tx', 'gene', { ent: 'cps1', why: 'Glucagon increases hepatic amino-acid uptake and ureagenesis.' }),
      N('o_urea', 'Amino-acid catabolism & ureagenesis', 5, 6, 'tx', 'outcome', { time: 'hours', why: 'Feeds the liver–α-cell axis: high plasma amino acids stimulate glucagon, which clears them (Wewer Albrechtsen 2019).' }),
      N('acc', 'Acetyl-CoA carboxylase (ACC)', 3, 7, 'fat', 'enzyme', { ent: 'acc', why: 'Inhibited by PKA and AMPK phosphorylation.' }),
      N('mal', 'Malonyl-CoA', 4, 7, 'fat', 'messenger', { ent: 'malonylcoa', why: 'Inhibits CPT-1; its fall opens fatty-acid entry into mitochondria.' }),
      N('o_fao', 'CPT-1 → β-oxidation', 5, 7, 'fat', 'outcome', { time: 'minutes', ent: 'cpt1', why: 'Fatty acids enter mitochondria and are oxidized.' }),
      N('o_keto', 'Ketogenesis (when insulin is low)', 5, 8, 'fat', 'outcome', { time: 'min–hours', ent: 'ketogenesis', why: 'Requires both high glucagon and low insulin (DKA when insulin is absent).' }),
      N('gq', 'Gαq → PLC', 0, 9, 'gq', 'messenger', { ent: 'gq', why: 'Secondary coupling of GCGR.' }),
      N('ip3', 'IP₃', 1, 9, 'gq', 'messenger', { ent: 'ip3' }),
      N('ip3r', 'InsP3R1 → Ca²⁺', 2, 9, 'gq', 'transporter', { ent: 'ca', why: 'ER Ca²⁺ release; PKA phosphorylation of InsP3R1 increases its activity.' }),
      N('atgl', 'Intrahepatic lipolysis (ATGL)', 3, 9, 'gq', 'enzyme', { ent: 'hsl', why: 'Ca²⁺-dependent hepatocyte lipolysis (Perry 2020, rodents).' }),
      N('hacoa', 'Hepatic acetyl-CoA', 4, 9, 'gq', 'metabolite', { ent: 'acetylcoa', why: 'Allosteric activator of pyruvate carboxylase.' }),
      N('o_pc', 'Pyruvate carboxylase → gluconeogenesis', 5, 9, 'gq', 'outcome', { time: 'min–hours', ent: 'pc', why: 'Links hepatic fat oxidation to gluconeogenic flux (Perry 2015, 2020).' }),
    ],
    links: [
      ['R', 'gs', '+', 'GCGR → Gαs.'], ['R', 'gq', '+', 'GCGR → Gαq (secondary).', { w: 0.7 }],
      ['gs', 'ac', '+'], ['pde', 'ac', '-', 'PDEs degrade cAMP.'], ['ac', 'pka', '+'],
      ['pka', 'phk', '+'], ['phk', 'gp', '+'], ['gp', 'o_glyco', '+'],
      ['pka', 'gsyn', '-', 'PKA inactivates glycogen synthase.'], ['gsyn', 'o_gsyn', '+'],
      ['pka', 'pfk2', '+', 'PKA phosphorylates PFK-2/FBPase-2 (switches to FBPase-2 activity).'], ['pfk2', 'f26', '-', 'FBPase-2 activity destroys F-2,6-BP.'],
      ['f26', 'o_glycolysis', '+', 'F-2,6-BP activates PFK-1.'], ['f26', 'o_gngflux', '-', 'F-2,6-BP inhibits FBPase-1.'],
      ['pka', 'lpk', '-', 'PKA phosphorylates and inhibits L-pyruvate kinase.'], ['lpk', 'o_glycolysis', '+'], ['lpk', 'o_gngflux', '-', 'Active L-PK would recycle PEP to pyruvate.'],
      ['pka', 'crtc2', '+', 'PKA phosphorylates CREB and (via SIK inhibition) lets CRTC2 enter the nucleus.'], ['crtc2', 'genes', '+'], ['genes', 'o_genes', '+'],
      ['crtc2', 'aagenes', '+', 'cAMP-dependent induction of amino-acid transport and urea-cycle genes.', { w: 0.8 }], ['aagenes', 'o_urea', '+'],
      ['pka', 'acc', '-', 'PKA phosphorylates ACC.'], ['acc', 'mal', '+'], ['mal', 'o_fao', '-', 'Malonyl-CoA inhibits CPT-1.'], ['o_fao', 'o_keto', '+', 'β-oxidation supplies acetyl-CoA for HMGCS2.'],
      ['gq', 'ip3', '+'], ['ip3', 'ip3r', '+'], ['pka', 'ip3r', '+', 'PKA phosphorylates InsP3R1, sensitizing it.', { w: 0.4 }],
      ['ip3r', 'crtc2', '+', 'Ca²⁺/calcineurin also dephosphorylates CRTC2.', { w: 0.4 }],
      ['ip3r', 'atgl', '+'], ['atgl', 'hacoa', '+'], ['hacoa', 'o_pc', '+'], ['hacoa', 'o_keto', '+', { w: 0.5 }],
    ],
    knock: [
      { id: 'insulin', label: 'Insulin present (fed state)', force: { pde: 1 }, desc: 'Insulin activates PDE3B (and PP1), lowering cAMP so every PKA output is **blunted**. The insulin:glucagon ratio, not glucagon alone, sets hepatic flux.' },
      { id: 'gcgra', label: 'Glucagon-receptor antagonist', force: { R: 0 }, desc: 'Blocks every branch. In humans and rodents, GCGR blockade lowers glucose but raises plasma amino acids and glucagon (α-cell hyperplasia) — the liver–α-cell feedback is broken (Wewer Albrechtsen 2019).' },
      { id: 'ip3r1', label: 'Liver InsP3R1 knockdown', force: { ip3r: 0 }, desc: 'In rats, loss of hepatic InsP3R1 abolished glucagon-stimulated intrahepatic lipolysis and its effect on pyruvate carboxylase flux, while PKA → glycogenolysis remained (Perry 2020).' },
      { id: 'mas', label: 'Constitutively active Gαs', force: { gs: 1 }, desc: 'A Gαs mutation that cannot hydrolyse GTP (McCune–Albright type, Kovacs Ch3) keeps cAMP high **without hormone** — set glucagon to basal to see it.' },
      { id: 'pdei', label: 'PDE inhibitor (e.g., theophylline)', force: { pde: -1 }, desc: 'cAMP accumulates and amplifies every PKA output.' },
    ],
    steps: [
      { n: ['R', 'gs', 'ac', 'pka', 'pde'], t: '**1. GCGR → Gαs → cAMP → PKA.** Amplification at every step; phosphodiesterases (raised by insulin) oppose it.' },
      { n: ['pka', 'phk', 'gp', 'o_glyco', 'gsyn', 'o_gsyn'], t: '**2. Seconds: glycogen breakdown on, synthesis off.**' },
      { n: ['pka', 'pfk2', 'f26', 'o_glycolysis', 'o_gngflux', 'lpk'], t: '**3. Minutes: the glycolysis/gluconeogenesis switch.** F-2,6-BP falls and L-PK is inhibited, so carbon flows toward glucose.' },
      { n: ['pka', 'acc', 'mal', 'o_fao', 'o_keto'], t: '**4. Fat oxidation and ketogenesis.** ACC is inhibited → malonyl-CoA falls → CPT-1 opens. Ketogenesis needs low insulin too.' },
      { n: ['R', 'gq', 'ip3', 'ip3r', 'atgl', 'hacoa', 'o_pc', 'o_keto'], t: '**5. Gq/Ca²⁺ arm.** InsP3R1 → Ca²⁺ → intrahepatic lipolysis → acetyl-CoA → pyruvate carboxylase (Perry 2020).' },
      { n: ['pka', 'crtc2', 'genes', 'o_genes', 'aagenes', 'o_urea', 'ip3r'], t: '**6. Hours: transcription.** CREB/CRTC2 induce gluconeogenic and amino-acid-handling genes.' },
    ],
    refs: ['jiang2003', 'muller2017', 'ramnanan2011', 'pilkis1992', 'koo2005', 'perry2020', 'perry2015', 'albrechtsen2019', 'mcgarry1980', 'molina7', 'kovacs15'],
  };

  // =====================================================================
  // CORTISOL
  // =====================================================================
  C.cortisol = {
    id: 'cortisol', title: 'Cortisol signaling through the glucocorticoid receptor', ligand: 'Cortisol',
    receptor: { label: 'Free cortisol → cytosolic GR (with HSP90)', short: 'GR', ent: 'gr', why: 'Only free cortisol (most is CBG-bound) diffuses into cells. Pre-receptor enzymes set how much reaches GR: **11β-HSD1** regenerates cortisol from cortisone (liver, adipose); **11β-HSD2** inactivates it (kidney, colon) so that the MR responds to aldosterone (Kovacs Ch13).' },
    cols: ['Pre-receptor', 'Receptor', 'Mode of action', 'Target genes / proteins', 'Mediator', 'Result'],
    branches: [
      BR('liver', 'Liver: glucose production', 1, 'GR induces PEPCK, G6Pase and tyrosine aminotransferase, increases glycogen deposition, and is **permissive** for glucagon and catecholamine actions (Kovacs Ch13, Molina Ch6).'),
      BR('muscle', 'Muscle & fat: substrate supply', 2, 'In muscle, GR targets **REDD1 and KLF15** inhibit mTORC1, and KLF15 induces atrogin-1/MuRF1 → less protein synthesis, more proteolysis, amino acids to the liver (Shimizu 2011). Glucocorticoids impair insulin-stimulated glucose uptake and are permissive for lipolysis.'),
      BR('immune', 'Immune & inflammation', 3, 'Two mechanisms: (1) **transactivation** of anti-inflammatory genes (lipocortin-1/annexin A1, IL-10, neutral endopeptidase); (2) **transrepression** — GR tethers to NF-κB and AP-1 and blocks pro-inflammatory genes (Oakley & Cidlowski 2013). Most anti-inflammatory effects need **supraphysiological** doses (Kovacs Ch13).'),
      BR('other', 'Bone, vessels, kidney, HPA axis', 4, 'Bone formation falls; vascular adrenergic responsiveness rises; the MR is protected by 11β-HSD2; negative GREs in POMC/CRH genes mediate feedback.'),
    ],
    nodes: [
      N('hsd1', '11β-HSD1 (cortisone → cortisol)', 0, 1, null, 'enzyme', { why: 'Amplifies local glucocorticoid action in liver and adipose tissue.' }),
      N('gr', 'Liganded GR (HSP90 released) → nucleus', 1, 5, null, 'receptor', { ent: 'gr', why: 'Ligand binding releases HSP90 chaperones, exposes the nuclear localization signal and allows nuclear import.' }),
      N('ta', 'GR dimer on GREs (transactivation)', 2, 2, 'liver', 'tf', { ent: 'hre', why: 'Homodimer binds palindromic GREs and recruits co-activators.' }),
      N('tr', 'GR tethered to NF-κB / AP-1 (transrepression)', 2, 8, 'immune', 'tf', { why: 'Monomeric GR binds other transcription factors and blocks their activity (Oakley & Cidlowski 2013).' }),
      N('ngre', 'Negative GREs', 2, 13, 'other', 'tf', { why: 'GR represses POMC and CRH transcription — the genomic arm of negative feedback.' }),
      N('pepck', 'PEPCK, G6Pase, TAT genes', 3, 0, 'liver', 'gene', { ent: 'pepck', why: 'Gluconeogenic and amino-acid-catabolic enzymes.' }),
      N('o_gng', 'Hepatic gluconeogenesis', 5, 0, 'liver', 'outcome', { time: 'hours', ent: 'gluconeogenesis', why: 'Raises fasting glucose; combined with muscle amino-acid release.' }),
      N('gys', 'Glycogen synthase activation (liver)', 3, 1, 'liver', 'enzyme', { ent: 'glycsyn' }),
      N('o_glycogen', 'Hepatic glycogen storage', 5, 1, 'liver', 'outcome', { time: 'hours', why: 'Glucocorticoids increase liver glycogen, a reserve for glucagon/epinephrine to mobilize.' }),
      N('perm', 'Glucagon & catecholamine responsiveness', 3, 2, 'liver', 'process', { why: 'Permissive action: glucocorticoids maintain the expression of signaling components for other hormones.' }),
      N('o_perm', 'Permissive: fuller glucagon / epinephrine effects', 5, 2, 'liver', 'outcome', { time: 'hours' }),
      N('redd1', 'REDD1, KLF15', 3, 3, 'muscle', 'gene', { why: 'Direct GR targets in skeletal muscle (Shimizu 2011).' }),
      N('mtor', 'mTORC1 (muscle)', 4, 3, 'muscle', 'kinase', { ent: 'mtorc1', why: 'Inhibited by REDD1 and by KLF15 (via BCAT2).' }),
      N('o_psyn', 'Muscle protein synthesis', 5, 3, 'muscle', 'outcome', { time: 'hours', ent: 'protsyn' }),
      N('atro', 'Atrogin-1, MuRF1', 4, 4, 'muscle', 'gene', { why: 'Induced by KLF15.' }),
      N('o_prot', 'Proteolysis → amino acids to liver', 5, 4, 'muscle', 'outcome', { time: 'hours–days', ent: 'proteolysis', why: 'Supplies gluconeogenic substrate; with excess → proximal myopathy.' }),
      N('o_glut4', 'Insulin-stimulated glucose uptake', 5, 5, 'muscle', 'outcome', { time: 'hours', ent: 'glut4', why: 'Glucocorticoids induce insulin resistance in muscle (and liver).' }),
      N('lip', 'Adipocyte lipase / β-AR responsiveness', 3, 6, 'muscle', 'process', { ent: 'hsl', why: 'Permissive for catecholamine- and GH-stimulated lipolysis.' }),
      N('o_lipol', 'Lipolysis (permissive)', 5, 6, 'muscle', 'outcome', { time: 'hours', ent: 'lipolysis', why: 'With chronic excess, fat is redistributed (central/visceral).' }),
      N('anx', 'Lipocortin-1 (annexin A1), IL-10, neutral endopeptidase', 3, 7, 'immune', 'gene', { why: 'Anti-inflammatory proteins induced by glucocorticoids (Kovacs Ch13).' }),
      N('pla2', 'Phospholipase A₂', 4, 7, 'immune', 'enzyme', { why: 'Releases arachidonic acid; inhibited by lipocortin-1.' }),
      N('o_eic', 'Prostaglandins & leukotrienes', 5, 7, 'immune', 'outcome', { time: 'hours' }),
      N('nfkb', 'NF-κB / AP-1 activity', 3, 8, 'immune', 'tf', { why: 'Master pro-inflammatory transcription factors.' }),
      N('cyto', 'IL-1, IL-6, TNF-α, COX-2 genes', 4, 8, 'immune', 'gene'),
      N('o_infl', 'Inflammation & immune activation', 5, 8, 'immune', 'outcome', { time: 'hours–days', why: 'Suppressed — the basis of glucocorticoid therapy, and of infection risk with excess.' }),
      N('ob', 'Osteoblast function', 3, 10, 'other', 'process', { why: 'Glucocorticoids suppress osteoblast differentiation and activity.' }),
      N('o_bone', 'Bone formation', 5, 10, 'other', 'outcome', { time: 'weeks', why: 'Glucocorticoid-induced osteoporosis; also growth suppression in children.' }),
      N('adr', 'Vascular adrenergic receptor expression', 3, 11, 'other', 'process', { why: 'Glucocorticoids maintain vascular responsiveness to catecholamines (Kovacs Ch13).' }),
      N('o_bp', 'Vascular tone & blood pressure', 5, 11, 'other', 'outcome', { time: 'hours', why: 'Without cortisol, vasodilation and hypotension occur even without fluid loss.' }),
      N('mr', 'Renal MR occupied by cortisol', 3, 12, 'other', 'receptor', { ent: 'mr', why: 'Cortisol binds MR as avidly as aldosterone; 11β-HSD2 normally prevents this in the kidney.' }),
      N('o_na', 'Na⁺ retention, K⁺ loss', 5, 12, 'other', 'outcome', { time: 'hours', why: 'Mineralocorticoid effect — appears when 11β-HSD2 is inhibited or overwhelmed.' }),
      N('pomc', 'CRH & POMC transcription', 3, 13, 'other', 'gene', { ent: 'pomc' }),
      N('o_acth', 'ACTH secretion', 5, 13, 'other', 'outcome', { time: 'hours', ent: 'acth', why: 'Negative feedback (genomic, slow); a fast non-genomic component also exists.' }),
    ],
    links: [
      ['R', 'gr', '+', 'Free cortisol binds GR.'], ['hsd1', 'gr', '+', '11β-HSD1 regenerates cortisol locally.', { w: 0.5 }],
      ['R', 'mr', '+', '11β-HSD2 normally converts cortisol to cortisone before it reaches the MR.', { w: 0.08 }],
      ['gr', 'ta', '+'], ['gr', 'tr', '+'], ['gr', 'ngre', '+'],
      ['ta', 'pepck', '+'], ['pepck', 'o_gng', '+'], ['ta', 'gys', '+'], ['gys', 'o_glycogen', '+'], ['ta', 'perm', '+'], ['perm', 'o_perm', '+'],
      ['ta', 'redd1', '+'], ['redd1', 'mtor', '-', 'REDD1 activates TSC2 and inhibits mTORC1.'], ['mtor', 'o_psyn', '+'], ['redd1', 'atro', '+', 'KLF15 induces atrogin-1 and MuRF1.'], ['atro', 'o_prot', '+'],
      ['ta', 'o_glut4', '-', 'Glucocorticoids impair insulin signaling and GLUT4 translocation.'], ['ta', 'lip', '+'], ['lip', 'o_lipol', '+'], ['o_prot', 'o_gng', '+', 'Amino acids → hepatic gluconeogenesis.', { w: 0.4 }],
      ['ta', 'anx', '+'], ['anx', 'pla2', '-', 'Lipocortin-1 inhibits PLA₂.'], ['pla2', 'o_eic', '+'],
      ['tr', 'nfkb', '-', 'Tethering transrepression.'], ['nfkb', 'cyto', '+'], ['cyto', 'o_infl', '+'], ['o_eic', 'o_infl', '+', { w: 0.5 }],
      ['ta', 'ob', '-'], ['ob', 'o_bone', '+'], ['ta', 'adr', '+'], ['adr', 'o_bp', '+'], ['mr', 'o_na', '+'],
      ['ngre', 'pomc', '-'], ['pomc', 'o_acth', '+'],
    ],
    knock: [
      { id: 'mife', label: 'Mifepristone (GR antagonist)', force: { gr: 0 }, desc: 'GR is occupied but not activated: no gene induction or repression. ACTH rises (feedback lost).' },
      { id: 'licorice', label: 'Licorice / apparent mineralocorticoid excess', force: { mr: 1 }, desc: 'Glycyrrhetinic acid inhibits (or a mutation inactivates) **11β-HSD2**, so cortisol occupies the renal MR → hypertension, hypokalemia, with **low renin and low aldosterone** (Kovacs Ch13).' },
      { id: 'grres', label: 'Generalized glucocorticoid resistance (GR defect)', force: { gr: 0.3 }, desc: 'Every GR output is blunted. Feedback is weak, so ACTH and cortisol rise; the excess cortisol can act on the MR and ACTH drives adrenal androgens.' },
      { id: 'hsd1i', label: '11β-HSD1 inhibitor (liver/adipose)', force: { hsd1: -0.6 }, desc: 'Less local cortisol regeneration in liver and fat; GR outputs fall modestly.' },
    ],
    steps: [
      { n: ['R', 'hsd1', 'gr'], t: '**1. Delivery & binding.** Free cortisol enters the cell; 11β-HSD1 can regenerate more. Binding releases HSP90 and GR moves to the nucleus.' },
      { n: ['gr', 'ta', 'pepck', 'o_gng', 'gys', 'o_glycogen', 'perm', 'o_perm'], t: '**2. Liver (transactivation).** Gluconeogenic genes on, glycogen stored, permissive for glucagon and epinephrine.' },
      { n: ['ta', 'redd1', 'mtor', 'o_psyn', 'atro', 'o_prot', 'o_glut4', 'lip', 'o_lipol'], t: '**3. Muscle & fat.** REDD1/KLF15 inhibit mTORC1 and induce atrogenes → amino acids flow to the liver; insulin action falls; lipolysis is permitted.' },
      { n: ['gr', 'ta', 'tr', 'anx', 'pla2', 'o_eic', 'nfkb', 'cyto', 'o_infl'], t: '**4. Immune.** Anti-inflammatory genes on (transactivation) and NF-κB/AP-1 blocked (transrepression).' },
      { n: ['ta', 'ob', 'o_bone', 'adr', 'o_bp', 'R', 'mr', 'o_na'], t: '**5. Bone, vessels, kidney.** Bone formation falls, vascular tone is maintained, and 11β-HSD2 keeps cortisol off the MR.' },
      { n: ['gr', 'ngre', 'pomc', 'o_acth'], t: '**6. Feedback.** Negative GREs repress POMC and CRH.' },
    ],
    refs: ['oakley2013', 'shimizu2011', 'kovacs13', 'kovacs3', 'molina6', 'molina10'],
  };

  // =====================================================================
  // EPINEPHRINE (adrenergic receptors)
  // =====================================================================
  C.epinephrine = {
    id: 'epinephrine', title: 'Epinephrine: one hormone, five receptor routes', ligand: 'Epinephrine',
    receptor: { label: 'Adrenergic receptors (α1, α2, β1, β2, β3)', short: 'AR', ent: 'b2ar', why: 'The response depends on which receptor subtype a tissue expresses: β → Gs → cAMP; α1 → Gq → IP₃/Ca²⁺; α2 → Gi ⊣ cAMP (Molina Ch6).' },
    cols: ['Receptor subtype', 'G protein', 'Messenger', 'Kinase / channel', 'Tissue effect', 'Result'],
    branches: [
      BR('b1', 'β1: heart, kidney', 0, 'β1 → Gs → cAMP → PKA → L-type Ca²⁺ channels, phospholamban, troponin I: ↑ rate and force. In juxtaglomerular cells: ↑ renin.'),
      BR('b2', 'β2: liver, muscle, smooth muscle', 1, 'β2 → Gs → cAMP: hepatic glycogenolysis and gluconeogenesis, muscle glycogenolysis and K⁺ uptake (Na⁺/K⁺-ATPase), and relaxation of bronchial and some vascular smooth muscle.'),
      BR('b3', 'β adipose (β1/β2/β3)', 2, 'β-receptors on adipocytes → PKA → HSL and perilipin phosphorylation → lipolysis.'),
      BR('a1', 'α1: vascular smooth muscle', 3, 'α1 → Gq → PLC → IP₃/DAG → Ca²⁺ and PKC → vasoconstriction.'),
      BR('a2', 'α2: β-cell, nerve terminal', 4, 'α2 → Gi → ↓ cAMP and Gβγ-gated K⁺ channels → **inhibits insulin secretion** and presynaptic norepinephrine release.'),
    ],
    nodes: [
      N('b1', 'β1 receptor', 0, 0, 'b1', 'receptor'), N('g1', 'Gαs', 1, 0, 'b1', 'messenger'), N('c1', 'cAMP', 2, 0, 'b1', 'messenger', { ent: 'camp' }), N('k1', 'PKA → L-type Ca²⁺ channel, phospholamban', 3, 0, 'b1', 'kinase', { ent: 'pka' }),
      N('o_hr', 'Heart rate & contractility', 5, 0, 'b1', 'outcome', { time: 'seconds' }),
      N('jg', 'Juxtaglomerular cells', 4, 1, 'b1', 'process'), N('o_renin', 'Renin release', 5, 1, 'b1', 'outcome', { time: 'minutes', ent: 'renin' }),
      N('b2', 'β2 receptor', 0, 3, 'b2', 'receptor', { ent: 'b2ar' }), N('g2', 'Gαs', 1, 3, 'b2', 'messenger'), N('c2', 'cAMP', 2, 3, 'b2', 'messenger', { ent: 'camp' }), N('k2', 'PKA', 3, 3, 'b2', 'kinase', { ent: 'pka' }),
      N('liv', 'Liver: phosphorylase, gluconeogenic enzymes', 4, 2, 'b2', 'enzyme', { ent: 'gp' }), N('o_hgo', 'Hepatic glucose output', 5, 2, 'b2', 'outcome', { time: 'seconds–min' }),
      N('mus', 'Muscle: phosphorylase, Na⁺/K⁺-ATPase', 4, 3, 'b2', 'enzyme'), N('o_mus', 'Muscle glycogenolysis & K⁺ uptake', 5, 3, 'b2', 'outcome', { time: 'seconds–min', why: 'Muscle glycogen → lactate (no G6Pase); K⁺ shifts into cells.' }),
      N('sm', 'Smooth muscle: MLCK inhibited', 4, 4, 'b2', 'enzyme'), N('o_bronch', 'Bronchodilation, vasodilation (muscle beds)', 5, 4, 'b2', 'outcome', { time: 'seconds' }),
      N('b3', 'β receptors (adipocyte)', 0, 5, 'b3', 'receptor', { ent: 'b3ar' }), N('g3', 'Gαs', 1, 5, 'b3', 'messenger'), N('c3', 'cAMP', 2, 5, 'b3', 'messenger', { ent: 'camp' }), N('k3', 'PKA → HSL, perilipin-1', 3, 5, 'b3', 'kinase', { ent: 'hsl' }),
      N('o_lip', 'Lipolysis → FFA, glycerol', 5, 5, 'b3', 'outcome', { time: 'minutes', ent: 'lipolysis' }),
      N('a1', 'α1 receptor', 0, 6, 'a1', 'receptor'), N('gq', 'Gαq → PLC', 1, 6, 'a1', 'messenger', { ent: 'gq' }), N('ip3', 'IP₃ / DAG', 2, 6, 'a1', 'messenger', { ent: 'ip3' }), N('ca', 'Ca²⁺, PKC', 3, 6, 'a1', 'ion', { ent: 'ca' }),
      N('o_vc', 'Vasoconstriction (skin, splanchnic)', 5, 6, 'a1', 'outcome', { time: 'seconds' }),
      N('a2', 'α2 receptor', 0, 8, 'a2', 'receptor', { ent: 'a2ar' }), N('gi', 'Gαi / Gβγ', 1, 8, 'a2', 'messenger', { ent: 'gi' }), N('c4', 'cAMP', 2, 8, 'a2', 'messenger', { ent: 'camp' }), N('kch', 'Gβγ → K⁺ channels (hyperpolarization)', 3, 9, 'a2', 'transporter'),
      N('o_ins', 'Insulin secretion (β-cell)', 5, 8, 'a2', 'outcome', { time: 'seconds', ent: 'insulin', why: 'Stress suppresses insulin, letting glucose rise.' }),
      N('o_ne', 'Norepinephrine release (presynaptic)', 5, 9, 'a2', 'outcome', { time: 'seconds' }),
    ],
    links: [
      ['R', 'b1', '+'], ['R', 'b2', '+'], ['R', 'b3', '+'], ['R', 'a1', '+'], ['R', 'a2', '+'],
      ['b1', 'g1', '+'], ['g1', 'c1', '+'], ['c1', 'k1', '+'], ['k1', 'o_hr', '+'], ['k1', 'jg', '+'], ['jg', 'o_renin', '+'],
      ['b2', 'g2', '+'], ['g2', 'c2', '+'], ['c2', 'k2', '+'], ['k2', 'liv', '+'], ['liv', 'o_hgo', '+'], ['k2', 'mus', '+'], ['mus', 'o_mus', '+'], ['k2', 'sm', '+'], ['sm', 'o_bronch', '+'],
      ['b3', 'g3', '+'], ['g3', 'c3', '+'], ['c3', 'k3', '+'], ['k3', 'o_lip', '+'],
      ['a1', 'gq', '+'], ['gq', 'ip3', '+'], ['ip3', 'ca', '+'], ['ca', 'o_vc', '+'], ['ca', 'o_hgo', '+', 'α1/Ca²⁺ also activates hepatic phosphorylase kinase.', { w: 0.4 }],
      ['a2', 'gi', '+'], ['gi', 'c4', '-', 'Gαi inhibits adenylyl cyclase.'], ['gi', 'kch', '+'], ['c4', 'o_ins', '+', 'cAMP normally amplifies insulin exocytosis.'], ['kch', 'o_ins', '-'], ['c4', 'o_ne', '+', { w: 0.6 }], ['kch', 'o_ne', '-'],
    ],
    knock: [
      { id: 'prop', label: 'Non-selective β-blocker (propranolol)', force: { b1: 0, b2: 0, b3: 0 }, desc: 'Removes tachycardia, tremor, K⁺ uptake and β-glycogenolysis. Can mask the warning symptoms of hypoglycemia in insulin-treated patients.' },
      { id: 'b1sel', label: 'β1-selective blocker (metoprolol)', force: { b1: 0 }, desc: 'Heart rate and renin fall; β2 metabolic and bronchial effects largely preserved.' },
      { id: 'prazosin', label: 'α1 blocker (prazosin)', force: { a1: 0 }, desc: 'Vasoconstriction blocked; with unopposed β2, epinephrine can lower BP ("epinephrine reversal").' },
      { id: 'desens', label: 'Chronic β-agonist exposure (desensitization)', force: { b2: 0.3 }, desc: 'GRK phosphorylation → β-arrestin binding uncouples the receptor; with time receptors are internalized and degraded (homologous desensitization, Kovacs Ch3).' },
      { id: 'pheo', label: 'Pheochromocytoma (sustained excess)', force: { R: 1 }, desc: 'Catecholamine excess at all times: hypertension, tachycardia, hyperglycemia (α2 ⊣ insulin, β2 glycogenolysis), weight loss.' },
    ],
    steps: [
      { n: ['R', 'b1', 'g1', 'c1', 'k1', 'o_hr', 'jg', 'o_renin'], t: '**β1:** heart and JG cells via Gs/cAMP.' },
      { n: ['R', 'b2', 'g2', 'c2', 'k2', 'liv', 'o_hgo', 'mus', 'o_mus', 'sm', 'o_bronch'], t: '**β2:** fuel mobilization and smooth-muscle relaxation via Gs/cAMP.' },
      { n: ['R', 'b3', 'g3', 'c3', 'k3', 'o_lip'], t: '**β (adipose):** lipolysis.' },
      { n: ['R', 'a1', 'gq', 'ip3', 'ca', 'o_vc', 'o_hgo'], t: '**α1:** Gq → Ca²⁺ → vasoconstriction (and hepatic glycogenolysis).' },
      { n: ['R', 'a2', 'gi', 'c4', 'kch', 'o_ins', 'o_ne'], t: '**α2:** Gi → less cAMP and hyperpolarization → insulin secretion falls. Stress hyperglycemia needs this.' },
    ],
    refs: ['molina6', 'kovacs13', 'kovacs3'],
  };

  // =====================================================================
  // GROWTH HORMONE
  // =====================================================================
  C.gh = {
    id: 'gh', title: 'Growth hormone signaling (JAK2–STAT5)', ligand: 'GH',
    receptor: { label: 'GH receptor (preformed dimer, class I cytokine receptor)', short: 'GHR', ent: 'ghr', why: 'GH binding rotates the preformed GHR dimer, juxtaposing the associated **JAK2** kinases, which transphosphorylate and then phosphorylate receptor tyrosines (Brooks & Waters 2010).' },
    cols: ['Kinase', 'Docking / STAT', 'Signal', 'Target genes / proteins', 'Mediator', 'Result'],
    branches: [
      BR('stat', 'JAK2–STAT5: the IGF-1 axis', 1, 'STAT5b drives **IGF-1**, ALS and IGFBP-3 in the liver (endocrine IGF-1) and local IGF-1 in tissues. **SOCS** proteins switch the signal off. Malnutrition and liver disease blunt this arm (acquired GH resistance).'),
      BR('met', 'Direct metabolic actions', 2, 'Independent of IGF-1: GH stimulates lipolysis and antagonizes insulin action (diabetogenic), raising hepatic glucose output (Kovacs Ch5, Ch11).'),
      BR('prol', 'MAPK & PI3K: proliferation', 4, 'GHR/JAK2 also engage Shc → Ras → MAPK and IRS → PI3K, supporting cell proliferation and protein synthesis.'),
    ],
    nodes: [
      N('jak2', 'JAK2', 0, 3, null, 'kinase', { ent: 'jak2' }),
      N('stat5', 'STAT5b (dimer → nucleus)', 1, 1, 'stat', 'tf', { ent: 'stat5' }),
      N('igfg', 'IGF-1, ALS, IGFBP-3 genes', 3, 0, 'stat', 'gene', { ent: 'igf1' }),
      N('igfr', 'IGF-1 → IGF-1 receptor (PI3K / MAPK)', 4, 0, 'stat', 'receptor', { ent: 'igf1' }),
      N('o_growth', 'Linear growth (chondrocytes) & protein anabolism', 5, 0, 'stat', 'outcome', { time: 'weeks' }),
      N('o_igf', 'Circulating IGF-1 (feedback on GH)', 5, 1, 'stat', 'outcome', { time: 'hours' }),
      N('socs', 'SOCS2 / CIS', 3, 2, 'stat', 'gene', { ent: 'socs', why: 'Induced by STAT5; inhibit JAK2/receptor signaling.' }),
      N('lip', 'Adipocyte lipolysis machinery', 3, 3, 'met', 'enzyme', { ent: 'hsl' }), N('o_lip', 'Lipolysis → FFA', 5, 3, 'met', 'outcome', { time: 'hours', ent: 'lipolysis' }),
      N('ir', 'Post-receptor insulin antagonism (↑ FFA, p85)', 3, 4, 'met', 'process'),
      N('o_ins', 'Insulin action in liver & muscle', 5, 4, 'met', 'outcome', { time: 'hours' }), N('o_hgo', 'Hepatic glucose output', 5, 5, 'met', 'outcome', { time: 'hours' }),
      N('shc', 'Shc / IRS', 1, 6, 'prol', 'kinase'), N('mapk', 'Ras → MAPK', 2, 6, 'prol', 'kinase', { ent: 'mapk' }), N('pi3k', 'PI3K → Akt', 2, 7, 'prol', 'kinase', { ent: 'pi3k' }),
      N('o_prol', 'Cell proliferation', 5, 6, 'prol', 'outcome', { time: 'days' }), N('o_psyn', 'Protein synthesis', 5, 7, 'prol', 'outcome', { time: 'hours' }),
    ],
    links: [
      ['R', 'jak2', '+'], ['jak2', 'stat5', '+'], ['stat5', 'igfg', '+'], ['igfg', 'igfr', '+'], ['igfr', 'o_growth', '+'], ['igfg', 'o_igf', '+'],
      ['stat5', 'socs', '+'], ['socs', 'jak2', '-', 'SOCS feedback terminates GHR signaling.', { fb: true }],
      ['jak2', 'lip', '+'], ['lip', 'o_lip', '+'], ['jak2', 'ir', '+'], ['ir', 'o_ins', '-'], ['ir', 'o_hgo', '+'], ['o_lip', 'ir', '+', { w: 0.3 }],
      ['jak2', 'shc', '+'], ['shc', 'mapk', '+'], ['shc', 'pi3k', '+'], ['mapk', 'o_prol', '+'], ['pi3k', 'o_psyn', '+'], ['igfr', 'o_psyn', '+', { w: 0.5 }],
    ],
    knock: [
      { id: 'laron', label: 'GH receptor defect (Laron syndrome)', force: { R: 0 }, desc: 'GH is high but cannot signal: IGF-1 is low and growth fails. IGF-1 therapy restores much growth but not the direct GH actions (Brooks & Waters 2010).' },
      { id: 'acro', label: 'GH excess (acromegaly)', force: { R: 1 }, desc: 'Persistently high GH/IGF-1: acral growth, insulin resistance and diabetes, cardiomyopathy.' },
      { id: 'malnut', label: 'Malnutrition / liver disease (acquired GH resistance)', force: { stat5: 0.25 }, desc: 'GH rises but hepatic IGF-1 output falls; direct metabolic actions (lipolysis) persist — useful in fasting.' },
    ],
    steps: [
      { n: ['R', 'jak2', 'stat5', 'igfg', 'igfr', 'o_growth', 'o_igf'], t: '**JAK2 → STAT5 → IGF-1.** Most growth effects are mediated by IGF-1.' },
      { n: ['stat5', 'socs', 'jak2'], t: '**SOCS feedback** limits signaling.' },
      { n: ['jak2', 'lip', 'o_lip', 'ir', 'o_ins', 'o_hgo'], t: '**Direct metabolic actions**: lipolysis and insulin antagonism.' },
      { n: ['jak2', 'shc', 'mapk', 'pi3k', 'o_prol', 'o_psyn'], t: '**MAPK/PI3K** support proliferation and protein synthesis.' },
    ],
    refs: ['brooks2010', 'kovacs5', 'kovacs11', 'molina3'],
  };

  // =====================================================================
  // TSH (thyroid follicular cell)
  // =====================================================================
  C.tsh = {
    id: 'tsh', title: 'TSH signaling in the thyroid follicular cell', ligand: 'TSH',
    receptor: { label: 'TSH receptor (Gs, and Gq)', short: 'TSHR', ent: 'tshr', why: 'A GPCR coupling mainly to Gs → cAMP, which controls nearly every step of thyroid hormone synthesis and thyrocyte growth; Gq → Ca²⁺/DAG supports H₂O₂ generation and iodination (Kovacs Ch12).' },
    cols: STD,
    branches: [
      BR('gs', 'Gs → cAMP: uptake, synthesis, release, growth', 1, 'cAMP/PKA increases NIS, thyroglobulin and TPO expression, stimulates endocytosis of colloid and thyroglobulin proteolysis, and drives thyrocyte growth (goiter with chronic stimulation).'),
      BR('gq', 'Gq → Ca²⁺/DAG: iodination', 3, 'PLC → Ca²⁺ and DAG/PKC activate DUOX → H₂O₂, the oxidant TPO needs for organification and coupling.'),
    ],
    nodes: [
      N('gs', 'Gαs', 0, 2, 'gs', 'messenger'), N('camp', 'cAMP', 1, 2, 'gs', 'messenger', { ent: 'camp' }), N('pka', 'PKA / CREB', 2, 2, 'gs', 'kinase', { ent: 'pka' }),
      N('nis', 'NIS expression & activity', 3, 0, 'gs', 'transporter', { ent: 'nis' }), N('o_i', 'Iodide trapping', 5, 0, 'gs', 'outcome', { time: 'hours' }),
      N('tg', 'Thyroglobulin, TPO genes', 3, 1, 'gs', 'gene', { ent: 'tpo' }), N('o_syn', 'Synthetic capacity', 5, 1, 'gs', 'outcome', { time: 'hours–days' }),
      N('endo', 'Colloid endocytosis', 3, 2, 'gs', 'process'), N('prot', 'Lysosomal Tg proteolysis', 4, 2, 'gs', 'enzyme'), N('o_rel', 'T4 / T3 release', 5, 2, 'gs', 'outcome', { time: 'minutes–hours', ent: 't4' }),
      N('grow', 'Growth genes', 3, 3, 'gs', 'gene'), N('o_gr', 'Thyrocyte growth (goiter)', 5, 3, 'gs', 'outcome', { time: 'weeks' }),
      N('gq', 'Gαq → PLC', 0, 5, 'gq', 'messenger', { ent: 'gq' }), N('ca', 'Ca²⁺, DAG / PKC', 1, 5, 'gq', 'ion', { ent: 'ca' }), N('duox', 'DUOX → H₂O₂', 2, 5, 'gq', 'enzyme', { ent: 'duox' }),
      N('tpo', 'TPO: organification & coupling', 3, 5, 'gq', 'enzyme', { ent: 'tpo' }), N('o_org', 'Iodinated thyroglobulin (MIT, DIT → T4, T3)', 5, 5, 'gq', 'outcome', { time: 'minutes–hours' }),
    ],
    links: [
      ['R', 'gs', '+'], ['R', 'gq', '+', { w: 0.6 }], ['gs', 'camp', '+'], ['camp', 'pka', '+'],
      ['pka', 'nis', '+'], ['nis', 'o_i', '+'], ['pka', 'tg', '+'], ['tg', 'o_syn', '+'], ['pka', 'endo', '+'], ['endo', 'prot', '+'], ['prot', 'o_rel', '+'], ['pka', 'grow', '+'], ['grow', 'o_gr', '+'],
      ['gq', 'ca', '+'], ['ca', 'duox', '+'], ['duox', 'tpo', '+'], ['tpo', 'o_org', '+'], ['tg', 'tpo', '+', { w: 0.4 }],
    ],
    knock: [
      { id: 'graves', label: 'Graves disease (TSHR-stimulating antibodies)', force: { R: 1 }, desc: 'Antibodies mimic TSH and escape negative feedback, so the gland is stimulated continuously → hyperthyroidism with diffuse goiter (Kovacs Ch3, Ch12). TSH itself is suppressed.' },
      { id: 'mas', label: 'McCune–Albright (activating Gαs)', force: { gs: 1 }, desc: 'Gαs (Arg201) with low GTPase activity → constitutive cAMP → hyperthyroidism and nodules without TSH (Kovacs Ch3).' },
      { id: 'php', label: 'Pseudohypoparathyroidism 1a (Gαs ~50%)', force: { gs: 0.5 }, desc: 'Loss-of-function Gαs → resistance to TSH, PTH and other Gs-coupled hormones (Kovacs Ch3).' },
      { id: 'mmi', label: 'Methimazole / PTU', force: { tpo: 0 }, desc: 'Thionamides inhibit TPO: organification and coupling stop, while uptake and growth signals continue.' },
    ],
    steps: [
      { n: ['R', 'gs', 'camp', 'pka', 'nis', 'o_i', 'tg', 'o_syn'], t: '**Gs/cAMP:** iodide trapping and synthetic machinery.' },
      { n: ['R', 'gq', 'ca', 'duox', 'tpo', 'o_org'], t: '**Gq/Ca²⁺:** H₂O₂ for TPO → iodination and coupling.' },
      { n: ['pka', 'endo', 'prot', 'o_rel', 'grow', 'o_gr'], t: '**Release & growth:** colloid endocytosis, Tg proteolysis, and thyrocyte growth.' },
    ],
    refs: ['kovacs12', 'kovacs3', 'molina4'],
  };

  // =====================================================================
  // THYROID HORMONE (nuclear)
  // =====================================================================
  C.t3 = {
    id: 't3', title: 'Thyroid hormone action (T3 → TR)', ligand: 'Free T4/T3',
    receptor: { label: 'Free T4/T3 (transported into the cell)', short: 'T4/T3', ent: 't3', why: 'T4 and T3 enter cells on transporters (MCT8, OATPs). Most T3 action comes from intracellular T4 → T3 conversion by **D2** in many tissues, or from plasma T3 (mostly made by D1/D2 elsewhere) (Bianco 2002).' },
    cols: ['Uptake', 'Activation', 'Receptor', 'Target genes', 'Mediator', 'Result'],
    branches: [
      BR('heart', 'Heart', 0, 'T3 induces α-MHC, SERCA2 and β1-adrenergic receptors and represses β-MHC and phospholamban → faster, stronger contraction and faster relaxation (Molina Ch4).'),
      BR('met', 'Metabolism', 1, 'Na⁺/K⁺-ATPase, uncoupling and substrate cycling raise O₂ consumption and heat production; hepatic LDL receptors rise (LDL falls).'),
      BR('dev', 'Development & growth', 2, 'Essential for brain development (fetal/neonatal) and linear growth (with GH) (Kovacs Ch11, Ch12).'),
      BR('fb', 'Feedback', 3, 'Liganded TR represses TSHβ and TRH genes (negative TREs).'),
    ],
    nodes: [
      N('mct8', 'MCT8 / OATP transporters', 0, 3, null, 'transporter', { ent: 'mct8' }),
      N('d2', 'D2: T4 → T3', 1, 2, null, 'enzyme', { ent: 'd2' }), N('d3', 'D3: inactivation (→ rT3, T2)', 1, 4, null, 'enzyme', { ent: 'd3' }),
      N('tr', 'TR–RXR on TREs', 2, 3, null, 'tf', { ent: 'tr' }),
      N('mhc', 'α-MHC, SERCA2, β1-AR genes', 3, 0, 'heart', 'gene'), N('plb', 'β-MHC, phospholamban genes', 3, 1, 'heart', 'gene'),
      N('o_hr', 'Heart rate & contractility', 5, 0, 'heart', 'outcome', { time: 'hours–days' }), N('o_relax', 'Diastolic relaxation', 5, 1, 'heart', 'outcome', { time: 'hours–days' }),
      N('nak', 'Na⁺/K⁺-ATPase', 3, 2, 'met', 'transporter'), N('o_bmr', 'O₂ consumption, metabolic rate', 5, 2, 'met', 'outcome', { time: 'days' }),
      N('ucp', 'UCP1 (brown fat)', 3, 3, 'met', 'gene'), N('o_therm', 'Thermogenesis', 5, 3, 'met', 'outcome', { time: 'days' }),
      N('ldlr', 'LDL receptor (liver)', 3, 4, 'met', 'gene'), N('o_ldl', 'LDL clearance', 5, 4, 'met', 'outcome', { time: 'days' }),
      N('neuro', 'Neuronal maturation genes', 3, 5, 'dev', 'gene'), N('o_brain', 'Brain development', 5, 5, 'dev', 'outcome', { time: 'weeks–months' }),
      N('ghg', 'GH gene, growth-plate genes', 3, 6, 'dev', 'gene'), N('o_growth', 'Linear growth', 5, 6, 'dev', 'outcome', { time: 'months' }),
      N('tshb', 'TSHβ, TRH genes (negative TREs)', 3, 7, 'fb', 'gene'), N('o_tsh', 'TSH secretion', 5, 7, 'fb', 'outcome', { time: 'hours', ent: 'tsh' }),
    ],
    links: [
      ['R', 'mct8', '+'], ['mct8', 'd2', '+'], ['mct8', 'tr', '+', 'Plasma T3 also reaches TR directly.', { w: 0.5 }], ['d2', 'tr', '+', { w: 0.7 }], ['d3', 'tr', '-'],
      ['tr', 'mhc', '+'], ['tr', 'plb', '-'], ['mhc', 'o_hr', '+'], ['plb', 'o_relax', '-', 'Phospholamban slows SERCA2.'], ['mhc', 'o_relax', '+', { w: 0.5 }],
      ['tr', 'nak', '+'], ['nak', 'o_bmr', '+'], ['tr', 'ucp', '+'], ['ucp', 'o_therm', '+'], ['tr', 'ldlr', '+'], ['ldlr', 'o_ldl', '+'],
      ['tr', 'neuro', '+'], ['neuro', 'o_brain', '+'], ['tr', 'ghg', '+'], ['ghg', 'o_growth', '+'], ['tr', 'tshb', '-'], ['tshb', 'o_tsh', '+'],
    ],
    knock: [
      { id: 'rth', label: 'Resistance to thyroid hormone (TRβ mutation)', force: { tr: 0.3 }, desc: 'Blunted TR responses including feedback, so TSH is **not suppressed** despite high T4/T3. Tissues relying on TRα (heart) may still show thyrotoxic features.' },
      { id: 'mct8', label: 'MCT8 deficiency', force: { mct8: 0.2 }, desc: 'T3 cannot enter neurons efficiently → severe neurodevelopmental disease; peripheral tissues see high T3.' },
      { id: 'd3', label: 'D3 induction (critical illness)', force: { d3: 1 }, desc: 'More inactivation → low T3, high rT3 with normal TSH (euthyroid sick pattern) (Bianco 2002).' },
    ],
    steps: [
      { n: ['R', 'mct8', 'd2', 'd3', 'tr'], t: '**Uptake and activation** decide how much T3 reaches TR in each tissue.' },
      { n: ['tr', 'mhc', 'plb', 'o_hr', 'o_relax'], t: '**Heart.**' }, { n: ['tr', 'nak', 'o_bmr', 'ucp', 'o_therm', 'ldlr', 'o_ldl'], t: '**Metabolism.**' },
      { n: ['tr', 'neuro', 'o_brain', 'ghg', 'o_growth'], t: '**Development & growth.**' }, { n: ['tr', 'tshb', 'o_tsh'], t: '**Feedback** on TSH and TRH.' },
    ],
    refs: ['brent2012', 'bianco2002', 'kovacs12', 'molina4'],
  };

  // =====================================================================
  // PTH
  // =====================================================================
  C.pth = {
    id: 'pth', title: 'PTH signaling in kidney and bone', ligand: 'PTH',
    receptor: { label: 'PTH1R (Gs and Gq)', short: 'PTH1R', ent: 'pth1r', why: 'The same receptor binds PTH and PTHrP. It couples to Gs → cAMP/PKA and Gq → PLC/PKC (Kovacs Ch14, Molina Ch5).' },
    cols: STD,
    branches: [
      BR('pt', 'Kidney: proximal tubule', 1, 'PTH causes endocytosis of NaPi-IIa/IIc (phosphaturia) and induces **CYP27B1** → calcitriol → intestinal Ca²⁺ and phosphate absorption.'),
      BR('dct', 'Kidney: distal tubule', 2, 'PTH increases Ca²⁺ reabsorption through TRPV5 and basolateral NCX1/PMCA.'),
      BR('bone', 'Bone: osteoblast / osteocyte', 3, 'PTH raises RANKL and lowers OPG on osteoblast-lineage cells → osteoclastogenesis → resorption. **Intermittent** PTH is anabolic (teriparatide).'),
    ],
    nodes: [
      N('gs', 'Gαs', 0, 1, null, 'messenger'), N('camp', 'cAMP', 1, 1, null, 'messenger', { ent: 'camp' }), N('pka', 'PKA', 2, 1, null, 'kinase', { ent: 'pka' }),
      N('gq', 'Gαq → PLC', 0, 4, null, 'messenger', { ent: 'gq' }), N('pkc', 'Ca²⁺ / PKC', 1, 4, null, 'kinase', { ent: 'pkc' }),
      N('npt', 'NaPi-IIa / IIc endocytosis', 3, 0, 'pt', 'transporter', { ent: 'napi' }), N('o_phos', 'Phosphate excretion', 5, 0, 'pt', 'outcome', { time: 'minutes' }),
      N('cyp', 'CYP27B1 (1α-hydroxylase)', 3, 1, 'pt', 'enzyme', { ent: 'cyp27b1' }), N('cal', '1,25-(OH)₂D', 4, 1, 'pt', 'hormone', { ent: 'calcitriol' }), N('o_gut', 'Intestinal Ca²⁺ & phosphate absorption', 5, 1, 'pt', 'outcome', { time: 'hours–days' }),
      N('trpv5', 'TRPV5, NCX1, PMCA', 3, 2, 'dct', 'transporter', { ent: 'trpv5' }), N('o_ca', 'Renal Ca²⁺ reabsorption', 5, 2, 'dct', 'outcome', { time: 'minutes' }),
      N('rankl', 'RANKL ↑, OPG ↓ (osteoblast lineage)', 3, 3, 'bone', 'gene', { ent: 'rankl' }), N('ocl', 'Osteoclast differentiation & activity', 4, 3, 'bone', 'process'), N('o_res', 'Bone resorption → Ca²⁺, phosphate', 5, 3, 'bone', 'outcome', { time: 'hours–days' }),
      N('o_form', 'Bone formation (coupled; anabolic if intermittent)', 5, 4, 'bone', 'outcome', { time: 'weeks' }),
    ],
    links: [
      ['R', 'gs', '+'], ['R', 'gq', '+', { w: 0.6 }], ['gs', 'camp', '+'], ['camp', 'pka', '+'], ['gq', 'pkc', '+'],
      ['pka', 'npt', '+'], ['pkc', 'npt', '+', { w: 0.5 }], ['npt', 'o_phos', '+'], ['pka', 'cyp', '+'], ['cyp', 'cal', '+'], ['cal', 'o_gut', '+'],
      ['pka', 'trpv5', '+'], ['pkc', 'trpv5', '+', { w: 0.4 }], ['trpv5', 'o_ca', '+'],
      ['pka', 'rankl', '+'], ['rankl', 'ocl', '+'], ['ocl', 'o_res', '+'], ['ocl', 'o_form', '+', 'Resorption and formation are coupled.', { w: 0.5 }],
    ],
    knock: [
      { id: 'php', label: 'Pseudohypoparathyroidism 1a (Gαs ~50%)', force: { gs: 0.5 }, desc: 'Renal PTH resistance → hypocalcemia, hyperphosphatemia with **high PTH**; often TSH resistance too (Kovacs Ch3, Ch14).' },
      { id: 'phpt', label: 'Primary hyperparathyroidism', force: { R: 1 }, desc: 'PTH high regardless of calcium: hypercalcemia, phosphaturia, high calcitriol, bone resorption.' },
      { id: 'ckd', label: 'Chronic kidney disease (↓ CYP27B1)', force: { cyp: 0.2 }, desc: 'Calcitriol cannot rise: Ca²⁺ absorption falls, which drives secondary hyperparathyroidism.' },
    ],
    steps: [
      { n: ['R', 'gs', 'camp', 'pka', 'gq', 'pkc'], t: '**Two G proteins** from one receptor.' },
      { n: ['pka', 'npt', 'o_phos', 'cyp', 'cal', 'o_gut'], t: '**Proximal tubule:** phosphaturia and calcitriol synthesis.' },
      { n: ['pka', 'pkc', 'trpv5', 'o_ca'], t: '**Distal tubule:** Ca²⁺ reabsorption.' },
      { n: ['pka', 'rankl', 'ocl', 'o_res', 'o_form'], t: '**Bone:** RANKL/OPG → resorption (and coupled formation).' },
    ],
    refs: ['kovacs14', 'molina5', 'kovacs3', 'boyle2003'],
  };

  // =====================================================================
  // ADH / vasopressin
  // =====================================================================
  C.adh = {
    id: 'adh', title: 'Vasopressin (ADH) receptor signaling', ligand: 'ADH',
    receptor: { label: 'Vasopressin receptors (V2, V1a, V1b)', short: 'AVPR', ent: 'v2r', why: 'V2 (collecting duct) → Gs/cAMP; V1a (vascular smooth muscle) and V1b (corticotroph) → Gq (Molina Ch2, Kovacs Ch6).' },
    cols: ['Receptor', 'G protein', 'Messenger', 'Kinase', 'Target', 'Result'],
    branches: [
      BR('v2', 'V2: collecting duct principal cell', 1, 'PKA phosphorylates AQP2 → insertion into the apical membrane (minutes); CREB increases AQP2 transcription (hours). ADH also increases urea permeability of the inner medullary collecting duct and NaCl transport in the thick ascending limb (NKCC2), building the medullary gradient.'),
      BR('v1a', 'V1a: vascular smooth muscle', 3, 'Gq → IP₃ → Ca²⁺ → contraction. Matters most when ADH is very high (hemorrhage, hypotension).'),
      BR('v1b', 'V1b: corticotroph', 2, 'Gq signaling synergizes with CRH (Gs) to release ACTH.'),
    ],
    nodes: [
      N('v2', 'V2 receptor', 0, 1, 'v2', 'receptor', { ent: 'v2r' }), N('gs', 'Gαs', 1, 1, 'v2', 'messenger'), N('camp', 'cAMP', 2, 1, 'v2', 'messenger', { ent: 'camp' }), N('pka', 'PKA / CREB', 3, 1, 'v2', 'kinase', { ent: 'pka' }),
      N('aqp', 'AQP2 phosphorylation → apical insertion', 4, 0, 'v2', 'transporter', { ent: 'aqp2' }), N('o_water', 'Water reabsorption (concentrated urine)', 5, 0, 'v2', 'outcome', { time: 'minutes' }),
      N('aqptx', 'AQP2 gene transcription', 4, 1, 'v2', 'gene', { ent: 'aqp2' }), N('o_cap', 'Sustained concentrating capacity', 5, 1, 'v2', 'outcome', { time: 'hours–days' }),
      N('ut', 'Urea permeability (inner medulla)', 4, 2, 'v2', 'transporter'), N('nkcc', 'NKCC2 (thick ascending limb)', 4, 3, 'v2', 'transporter'),
      N('o_grad', 'Medullary osmotic gradient', 5, 2, 'v2', 'outcome', { time: 'hours' }),
      N('v1a', 'V1a receptor', 0, 4, 'v1a', 'receptor'), N('gq', 'Gαq → PLC', 1, 4, 'v1a', 'messenger', { ent: 'gq' }), N('ca', 'IP₃ → Ca²⁺', 2, 4, 'v1a', 'ion', { ent: 'ca' }), N('mlck', 'MLCK → contraction', 3, 4, 'v1a', 'kinase'),
      N('o_vc', 'Vasoconstriction', 5, 4, 'v1a', 'outcome', { time: 'seconds' }),
      N('v1b', 'V1b receptor', 0, 5, 'v1b', 'receptor'), N('gqb', 'Gαq → PLC', 1, 5, 'v1b', 'messenger', { ent: 'gq' }), N('pkc', 'Ca²⁺ / PKC', 2, 5, 'v1b', 'kinase', { ent: 'pkc' }),
      N('o_acth', 'ACTH release (synergy with CRH)', 5, 5, 'v1b', 'outcome', { time: 'minutes', ent: 'acth' }),
    ],
    links: [
      ['R', 'v2', '+'], ['R', 'v1a', '+'], ['R', 'v1b', '+'],
      ['v2', 'gs', '+'], ['gs', 'camp', '+'], ['camp', 'pka', '+'], ['pka', 'aqp', '+'], ['aqp', 'o_water', '+'], ['pka', 'aqptx', '+'], ['aqptx', 'o_cap', '+'], ['pka', 'ut', '+'], ['pka', 'nkcc', '+'], ['ut', 'o_grad', '+'], ['nkcc', 'o_grad', '+'], ['o_grad', 'o_water', '+', { w: 0.4 }],
      ['v1a', 'gq', '+'], ['gq', 'ca', '+'], ['ca', 'mlck', '+'], ['mlck', 'o_vc', '+'],
      ['v1b', 'gqb', '+'], ['gqb', 'pkc', '+'], ['pkc', 'o_acth', '+'],
    ],
    knock: [
      { id: 'ndi', label: 'Nephrogenic DI (V2R/AQP2 defect, lithium)', force: { v2: 0 }, desc: 'ADH is high but the collecting duct cannot respond → dilute polyuria; desmopressin does not help. V1 effects persist.' },
      { id: 'cdi', label: 'Central DI (no ADH)', force: { R: -1 }, desc: 'Loss of ADH: water reabsorption falls on every branch. Desmopressin restores V2 signaling.' },
      { id: 'siadh', label: 'SIADH', force: { R: 1 }, desc: 'Persistent ADH despite low osmolality → water retention and hyponatremia.' },
      { id: 'dda', label: 'Desmopressin (V2-selective)', force: { v2: 1, v1a: 0, v1b: 0 }, desc: 'Antidiuresis without vasoconstriction.' },
      { id: 'tolv', label: 'Tolvaptan (V2 antagonist)', force: { v2: 0 }, desc: 'Aquaresis — free-water excretion; used for SIADH-related hyponatremia.' },
    ],
    steps: [
      { n: ['R', 'v2', 'gs', 'camp', 'pka', 'aqp', 'o_water'], t: '**V2 → cAMP → AQP2 insertion** (minutes).' },
      { n: ['pka', 'aqptx', 'o_cap', 'ut', 'nkcc', 'o_grad'], t: '**Longer term:** more AQP2, urea and NaCl transport build the gradient.' },
      { n: ['R', 'v1a', 'gq', 'ca', 'mlck', 'o_vc'], t: '**V1a:** vasoconstriction.' }, { n: ['R', 'v1b', 'gqb', 'pkc', 'o_acth'], t: '**V1b:** ACTH release.' },
    ],
    refs: ['kovacs6', 'molina2', 'molina10'],
  };

  // =====================================================================
  // ALDOSTERONE
  // =====================================================================
  C.aldo = {
    id: 'aldo', title: 'Aldosterone signaling in the collecting duct', ligand: 'Aldosterone',
    receptor: { label: 'Aldosterone (lipophilic, enters the cell)', short: 'Aldo', ent: 'aldosterone', why: 'Aldosterone binds the cytosolic mineralocorticoid receptor (MR). In aldosterone-target epithelia, 11β-HSD2 converts cortisol to cortisone so cortisol cannot occupy MR (Kovacs Ch13).' },
    cols: ['Pre-receptor', 'Receptor', 'Early gene', 'Regulator', 'Effector', 'Result'],
    branches: [
      BR('na', 'Principal cell: Na⁺ reabsorption', 1, 'MR induces **SGK1**, which phosphorylates the ubiquitin ligase **Nedd4-2**, so less ENaC is ubiquitylated and removed → more ENaC at the apical membrane (Debonneville 2001). MR also increases ENaC subunit and Na⁺/K⁺-ATPase expression.'),
      BR('k', 'K⁺ and H⁺ secretion', 3, 'Na⁺ entry through ENaC makes the lumen negative, driving K⁺ secretion through ROMK/BK; aldosterone also stimulates H⁺ secretion by α-intercalated cells (metabolic alkalosis with excess).'),
      BR('ne', 'Non-epithelial MR', 4, 'MR in heart and vessels: with aldosterone excess, inflammation and fibrosis.'),
    ],
    nodes: [
      N('cortmr', 'Cortisol on MR (11β-HSD2 bypassed)', 0, 4, null, 'hormone', { ent: 'cortisol', why: 'Normally ~0: 11β-HSD2 inactivates cortisol. Rises with licorice or AME.' }),
      N('mr', 'MR–aldosterone → nucleus', 1, 2, null, 'receptor', { ent: 'mr' }),
      N('sgk1', 'SGK1', 2, 0, 'na', 'kinase', { why: 'Serum/glucocorticoid-regulated kinase 1, induced within ~1 h.' }),
      N('nedd', 'Nedd4-2 (ubiquitin ligase)', 3, 0, 'na', 'enzyme', { why: 'Ubiquitylates ENaC for removal; SGK1 phosphorylation inhibits it.' }),
      N('engene', 'ENaC subunit & Na⁺/K⁺-ATPase genes', 2, 1, 'na', 'gene'),
      N('enac', 'ENaC at the apical membrane', 4, 0, 'na', 'transporter', { ent: 'enac' }), N('nak', 'Na⁺/K⁺-ATPase (basolateral)', 4, 1, 'na', 'transporter'),
      N('o_na', 'Na⁺ reabsorption → ECF volume, BP', 5, 0, 'na', 'outcome', { time: 'hours' }),
      N('romk', 'ROMK / BK channels', 4, 2, 'k', 'transporter'), N('o_k', 'K⁺ secretion', 5, 2, 'k', 'outcome', { time: 'hours' }),
      N('hatp', 'H⁺-ATPase (α-intercalated cell)', 4, 3, 'k', 'transporter'), N('o_h', 'H⁺ secretion', 5, 3, 'k', 'outcome', { time: 'hours' }),
      N('fib', 'MR in heart & vessels', 4, 4, 'ne', 'receptor'), N('o_fib', 'Fibrosis & remodeling (excess)', 5, 4, 'ne', 'outcome', { time: 'weeks' }),
    ],
    links: [
      ['R', 'mr', '+'], ['cortmr', 'mr', '+'],
      ['mr', 'sgk1', '+'], ['sgk1', 'nedd', '-', 'SGK1 phosphorylates Nedd4-2 (Ser444).'], ['nedd', 'enac', '-', 'Nedd4-2 removes ENaC from the membrane.'],
      ['mr', 'engene', '+'], ['engene', 'enac', '+', { w: 0.5 }], ['engene', 'nak', '+'], ['enac', 'o_na', '+'], ['nak', 'o_na', '+', { w: 0.5 }],
      ['enac', 'romk', '+', 'Lumen-negative potential drives K⁺ out.', { w: 0.8 }], ['mr', 'romk', '+', { w: 0.3 }], ['romk', 'o_k', '+'], ['mr', 'hatp', '+'], ['hatp', 'o_h', '+'],
      ['mr', 'fib', '+'], ['fib', 'o_fib', '+'],
    ],
    knock: [
      { id: 'spiro', label: 'Spironolactone / eplerenone', force: { mr: 0 }, desc: 'MR blockade: natriuresis and K⁺ retention (risk of hyperkalemia).' },
      { id: 'amil', label: 'Amiloride (ENaC blocker)', force: { enac: 0 }, desc: 'Na⁺ entry blocked, so the lumen-negative drive for K⁺ secretion disappears (K⁺-sparing).' },
      { id: 'liddle', label: 'Liddle syndrome (ENaC escapes Nedd4-2)', force: { enac: 1 }, desc: 'Gain-of-function ENaC mutations remove the PY motif that Nedd4-2 recognizes → ENaC stays at the surface: hypertension and hypokalemia with **low renin and low aldosterone**. Responds to amiloride, not spironolactone.' },
      { id: 'ame', label: 'Licorice / AME (11β-HSD2 loss)', force: { cortmr: 1 }, desc: 'Cortisol occupies MR → mineralocorticoid excess with low renin and aldosterone (Kovacs Ch13).' },
    ],
    steps: [
      { n: ['R', 'mr', 'cortmr'], t: '**MR activation** — guarded by 11β-HSD2.' },
      { n: ['mr', 'sgk1', 'nedd', 'enac', 'o_na', 'engene', 'nak'], t: '**SGK1 ⊣ Nedd4-2 → more ENaC** at the apical membrane; more Na⁺/K⁺-ATPase.' },
      { n: ['enac', 'romk', 'o_k', 'mr', 'hatp', 'o_h'], t: '**K⁺ and H⁺ secretion** follow Na⁺ reabsorption.' }, { n: ['mr', 'fib', 'o_fib'], t: '**Non-epithelial MR.**' },
    ],
    refs: ['debonneville2001', 'kovacs13', 'molina6', 'molina10'],
  };

  // =====================================================================
  // ANP
  // =====================================================================
  C.anp = {
    id: 'anp', title: 'Natriuretic peptide signaling (guanylyl cyclase receptor)', ligand: 'ANP / BNP',
    receptor: { label: 'NPR-A (transmembrane guanylyl cyclase)', short: 'NPR-A', why: 'Natriuretic peptide receptors are transmembrane guanylyl cyclases: ligand binding activates the intracellular cyclase domain directly → cGMP (Kovacs Ch3, Ch6).' },
    cols: STD,
    branches: [
      BR('kid', 'Kidney: natriuresis', 0, 'Raises GFR (afferent dilation, efferent constriction) and inhibits Na⁺ reabsorption in the collecting duct.'),
      BR('hor', 'Opposes RAAS (and ADH)', 1, 'Inhibits renin release and aldosterone synthesis.'),
      BR('ves', 'Vessels', 2, 'cGMP/PKG relax vascular smooth muscle; capillary permeability rises, shifting fluid to the interstitium.'),
    ],
    nodes: [
      N('cg', 'cGMP', 1, 2, null, 'messenger'), N('pkg', 'PKG', 2, 2, null, 'kinase'),
      N('gfr', 'Afferent dilation / efferent constriction', 3, 0, 'kid', 'process'), N('o_gfr', 'GFR', 5, 0, 'kid', 'outcome', { time: 'minutes' }),
      N('cd', 'Collecting-duct Na⁺ channels', 3, 1, 'kid', 'transporter'), N('o_nat', 'Natriuresis & diuresis', 5, 1, 'kid', 'outcome', { time: 'minutes' }),
      N('ren', 'Renin release (JG cells)', 3, 2, 'hor', 'process', { ent: 'renin' }), N('o_ang', 'Angiotensin II', 5, 2, 'hor', 'outcome', { time: 'minutes', ent: 'angii' }),
      N('zg', 'Aldosterone synthesis (zona glomerulosa)', 3, 3, 'hor', 'process', { ent: 'aldosterone' }), N('o_aldo', 'Aldosterone', 5, 3, 'hor', 'outcome', { time: 'minutes–hours' }),
      N('vsm', 'Smooth-muscle relaxation', 3, 4, 'ves', 'process'), N('o_bp', 'Vasodilation, ↓ BP', 5, 4, 'ves', 'outcome', { time: 'minutes' }),
      N('perm', 'Capillary permeability', 3, 5, 'ves', 'process'), N('o_shift', 'Plasma → interstitial fluid shift', 5, 5, 'ves', 'outcome', { time: 'minutes' }),
    ],
    links: [
      ['R', 'cg', '+', 'Intrinsic guanylyl cyclase.'], ['cg', 'pkg', '+'],
      ['pkg', 'gfr', '+'], ['gfr', 'o_gfr', '+'], ['pkg', 'cd', '-'], ['cd', 'o_nat', '-'], ['o_gfr', 'o_nat', '+', { w: 0.5 }],
      ['pkg', 'ren', '-'], ['ren', 'o_ang', '+'], ['pkg', 'zg', '-'], ['zg', 'o_aldo', '+'], ['o_ang', 'o_aldo', '+', { w: 0.5 }],
      ['pkg', 'vsm', '+'], ['vsm', 'o_bp', '+'], ['pkg', 'perm', '+'], ['perm', 'o_shift', '+'],
    ],
    knock: [
      { id: 'nep', label: 'Neprilysin inhibitor (sacubitril, basal ANP)', force: { R: 0.6 }, desc: 'Neprilysin (neutral endopeptidase) degrades natriuretic peptides; blocking it raises their levels — used in heart failure.' },
      { id: 'npra', label: 'NPR-A loss', force: { cg: 0 }, desc: 'No cGMP response — salt-sensitive hypertension in animal models.' },
    ],
    steps: [{ n: ['R', 'cg', 'pkg'], t: '**Receptor = enzyme:** cGMP → PKG.' }, { n: ['pkg', 'gfr', 'o_gfr', 'cd', 'o_nat'], t: '**Kidney:** natriuresis.' }, { n: ['pkg', 'ren', 'o_ang', 'zg', 'o_aldo'], t: '**Hormones:** RAAS suppressed.' }, { n: ['pkg', 'vsm', 'o_bp', 'perm', 'o_shift'], t: '**Vessels.**' }],
    refs: ['kovacs6', 'kovacs3', 'molina10'],
  };

  // =====================================================================
  // LEPTIN
  // =====================================================================
  C.leptin = {
    id: 'leptin', title: 'Leptin signaling in the arcuate nucleus', ligand: 'Leptin',
    receptor: { label: 'Leptin receptor LRb (class I cytokine receptor)', short: 'LRb', ent: 'leptin', why: 'Adipose-derived leptin acts mainly on arcuate neurons via LRb → JAK2 → STAT3 (Myers 2008). It signals energy **sufficiency**; falling leptin in fasting is the stronger physiological signal (Molina Ch10).' },
    cols: ['Kinase', 'STAT / adaptor', 'Neuron', 'Neuropeptide', 'Downstream', 'Result'],
    branches: [
      BR('pomc', 'POMC/CART neurons: satiety', 1, 'STAT3 activates POMC neurons → α-MSH → **MC4R** in the paraventricular nucleus → less food intake, more sympathetic energy expenditure (Kovacs Ch5, Molina Ch10).'),
      BR('agrp', 'NPY/AgRP neurons: hunger', 3, 'Leptin inhibits NPY/AgRP neurons. AgRP is an endogenous MC4R antagonist; NPY stimulates feeding.'),
      BR('neuro', 'Neuroendocrine', 2, 'Leptin is permissive for the reproductive axis (kisspeptin/GnRH; puberty) and supports TRH. Low leptin in starvation suppresses both.'),
    ],
    nodes: [
      N('jak2', 'JAK2', 0, 2, null, 'kinase', { ent: 'jak2' }), N('stat3', 'STAT3', 1, 1, null, 'tf'),
      N('socs3', 'SOCS3 (feedback)', 1, 3, null, 'gene', { ent: 'socs', why: 'STAT3-induced SOCS3 inhibits LRb/JAK2 signaling — one mechanism of leptin resistance (Myers 2008).' }),
      N('pomc', 'POMC neuron', 2, 0, 'pomc', 'process', { ent: 'pomc' }), N('msh', 'α-MSH', 3, 0, 'pomc', 'hormone'),
      N('mc4r', 'MC4R (paraventricular nucleus)', 4, 0, 'pomc', 'receptor'),
      N('o_food', 'Food intake', 5, 0, 'pomc', 'outcome', { time: 'hours' }), N('o_ee', 'Energy expenditure (sympathetic)', 5, 1, 'pomc', 'outcome', { time: 'hours–days' }),
      N('agrp', 'NPY/AgRP neuron', 2, 2, 'agrp', 'process'), N('npy', 'AgRP (MC4R antagonist), NPY', 3, 2, 'agrp', 'hormone'),
      N('kiss', 'Kisspeptin → GnRH', 3, 4, 'neuro', 'process', { ent: 'kisspeptin' }), N('o_repro', 'Reproductive axis (permissive)', 5, 4, 'neuro', 'outcome', { time: 'days' }),
      N('trh', 'TRH (PVN)', 3, 5, 'neuro', 'hormone', { ent: 'trh' }), N('o_thy', 'Thyroid axis', 5, 5, 'neuro', 'outcome', { time: 'days' }),
    ],
    links: [
      ['R', 'jak2', '+'], ['jak2', 'stat3', '+'], ['stat3', 'socs3', '+'], ['socs3', 'jak2', '-', { fb: true }],
      ['stat3', 'pomc', '+'], ['pomc', 'msh', '+'], ['msh', 'mc4r', '+'], ['mc4r', 'o_food', '-'], ['mc4r', 'o_ee', '+'],
      ['stat3', 'agrp', '-'], ['agrp', 'npy', '+'], ['npy', 'mc4r', '-', 'AgRP antagonizes MC4R.'], ['npy', 'o_food', '+', 'NPY stimulates feeding.', { w: 0.6 }],
      ['jak2', 'kiss', '+', { w: 0.6 }], ['kiss', 'o_repro', '+'], ['jak2', 'trh', '+', { w: 0.6 }], ['trh', 'o_thy', '+'],
    ],
    knock: [
      { id: 'ob', label: 'Congenital leptin deficiency', force: { R: -1 }, desc: 'The brain perceives starvation: hyperphagia, obesity, hypogonadotropic hypogonadism. Leptin replacement reverses it.' },
      { id: 'res', label: 'Obesity-associated leptin resistance', force: { jak2: 0.3 }, desc: 'High leptin but blunted signaling (SOCS3, Tyr985 and other mechanisms) (Myers 2008).' },
      { id: 'mc4r', label: 'MC4R loss-of-function', force: { mc4r: 0 }, desc: 'The most common monogenic obesity: leptin signaling upstream is intact but the melanocortin output is lost.' },
    ],
    steps: [{ n: ['R', 'jak2', 'stat3', 'socs3'], t: '**LRb → JAK2 → STAT3**, with SOCS3 feedback.' }, { n: ['stat3', 'pomc', 'msh', 'mc4r', 'o_food', 'o_ee'], t: '**POMC → α-MSH → MC4R:** satiety.' }, { n: ['stat3', 'agrp', 'npy', 'mc4r', 'o_food'], t: '**NPY/AgRP inhibited.**' }, { n: ['jak2', 'kiss', 'o_repro', 'trh', 'o_thy'], t: '**Neuroendocrine permissive effects.**' }],
    refs: ['myers2008', 'molina10', 'kovacs5'],
  };

  // =====================================================================
  // LH (Leydig / theca)
  // =====================================================================
  C.lh = {
    id: 'lh', title: 'LH signaling in the Leydig (and theca) cell', ligand: 'LH (or hCG)',
    receptor: { label: 'LH/hCG receptor (LHCGR, Gs)', short: 'LHCGR', ent: 'lhr', why: 'hCG binds the same receptor — the basis of fetal testosterone production and of the corpus luteum rescue in pregnancy (Kovacs Ch3, Ch9).' },
    cols: STD,
    branches: [
      BR('acute', 'Acute: cholesterol delivery (minutes)', 1, 'PKA mobilizes cholesterol and activates **StAR**, which moves cholesterol to the inner mitochondrial membrane for CYP11A1 — the acute rate-limiting step.'),
      BR('chronic', 'Chronic: enzyme expression (hours)', 3, 'cAMP/CREB and SF-1 increase CYP11A1, CYP17A1, 3β-HSD and 17β-HSD3 and LDL-receptor/HMG-CoA reductase expression.'),
    ],
    nodes: [
      N('gs', 'Gαs', 0, 1, null, 'messenger'), N('camp', 'cAMP', 1, 1, null, 'messenger', { ent: 'camp' }), N('pka', 'PKA / CREB', 2, 1, null, 'kinase', { ent: 'pka' }),
      N('star', 'StAR: cholesterol into mitochondria', 3, 0, 'acute', 'transporter', { ent: 'star' }), N('o_preg', 'Pregnenolone formation', 5, 0, 'acute', 'outcome', { time: 'minutes', ent: 'pregnenolone' }),
      N('genes', 'CYP11A1, CYP17A1, HSD3B2, HSD17B3', 3, 2, 'chronic', 'gene', { ent: 'cyp17' }), N('o_t', 'Testosterone (Leydig) / androgens (theca)', 5, 2, 'chronic', 'outcome', { time: 'hours', ent: 'testosterone' }),
      N('ldlr', 'LDL receptor, HMG-CoA reductase', 3, 3, 'chronic', 'gene', { ent: 'hmgcr' }), N('o_chol', 'Cholesterol supply', 5, 3, 'chronic', 'outcome', { time: 'hours', ent: 'cholesterol' }),
    ],
    links: [['R', 'gs', '+'], ['gs', 'camp', '+'], ['camp', 'pka', '+'], ['pka', 'star', '+'], ['star', 'o_preg', '+'], ['o_preg', 'o_t', '+', { w: 0.6 }], ['pka', 'genes', '+'], ['genes', 'o_t', '+'], ['pka', 'ldlr', '+'], ['ldlr', 'o_chol', '+'], ['o_chol', 'o_preg', '+', { w: 0.4 }]],
    knock: [
      { id: 'lch', label: 'Leydig cell hypoplasia (inactive LHCGR)', force: { R: 0 }, desc: 'No fetal testosterone despite hCG/LH → undervirilized 46,XY (Kovacs Ch4, Ch7).' },
      { id: 'testo', label: 'Testotoxicosis (constitutively active LHCGR)', force: { R: 1 }, desc: 'Familial male-limited precocious puberty: testosterone production without LH (Kovacs Ch4).' },
      { id: 'mas', label: 'McCune–Albright (activating Gαs)', force: { gs: 1 }, desc: 'Gonadotropin-independent precocious puberty (Kovacs Ch3).' },
    ],
    steps: [{ n: ['R', 'gs', 'camp', 'pka', 'star', 'o_preg'], t: '**Minutes:** StAR delivers cholesterol.' }, { n: ['pka', 'genes', 'o_t', 'ldlr', 'o_chol'], t: '**Hours:** enzyme and cholesterol-supply genes.' }],
    refs: ['kovacs9', 'kovacs4', 'kovacs3', 'molina8', 'miller2011'],
  };

  // =====================================================================
  // GnRH
  // =====================================================================
  C.gnrh = {
    id: 'gnrh', title: 'GnRH signaling in the gonadotroph', ligand: 'GnRH (pulses)',
    receptor: { label: 'GnRH receptor (Gq; lacks a C-terminal tail)', short: 'GnRHR', ent: 'gnrh', why: 'The type I GnRH receptor lacks the C-terminal tail that most GPCRs use for rapid desensitization. Continuous agonist exposure nevertheless **down-regulates** receptors and suppresses LH/FSH — the basis of GnRH-agonist therapy (Kovacs Ch5).' },
    cols: STD,
    branches: [
      BR('rel', 'Release', 1, 'IP₃ → Ca²⁺ → exocytosis of LH (and FSH) granules within minutes.'),
      BR('syn', 'Synthesis', 2, 'DAG/PKC → MAPK → transcription of LHβ, FSHβ and the common α subunit. **Pulse frequency** biases toward LH (fast) or FSH (slow).'),
    ],
    nodes: [
      N('gq', 'Gαq → PLC', 0, 1, null, 'messenger', { ent: 'gq' }),
      N('ip3', 'IP₃', 1, 0, 'rel', 'messenger', { ent: 'ip3' }), N('ca', 'Ca²⁺', 2, 0, 'rel', 'ion', { ent: 'ca' }), N('exo', 'Granule exocytosis', 3, 0, 'rel', 'process'),
      N('o_rel', 'LH / FSH release', 5, 0, 'rel', 'outcome', { time: 'minutes', ent: 'lh' }),
      N('dag', 'DAG → PKC', 1, 2, 'syn', 'kinase', { ent: 'pkc' }), N('mapk', 'MAPK (ERK)', 2, 2, 'syn', 'kinase', { ent: 'mapk' }), N('genes', 'LHβ, FSHβ, αGSU transcription', 3, 2, 'syn', 'gene'),
      N('o_syn', 'LH / FSH synthesis', 5, 2, 'syn', 'outcome', { time: 'hours', ent: 'fsh' }),
    ],
    links: [['R', 'gq', '+'], ['gq', 'ip3', '+'], ['ip3', 'ca', '+'], ['ca', 'exo', '+'], ['exo', 'o_rel', '+'], ['gq', 'dag', '+'], ['dag', 'mapk', '+'], ['mapk', 'genes', '+'], ['genes', 'o_syn', '+'], ['ca', 'genes', '+', { w: 0.4 }]],
    knock: [
      { id: 'cont', label: 'Continuous GnRH agonist (e.g., leuprolide)', force: { R: 0.1 }, desc: 'After an initial flare, receptor down-regulation suppresses LH/FSH → medical castration (prostate cancer, endometriosis, precocious puberty).' },
      { id: 'kall', label: 'GnRH deficiency (e.g., Kallmann)', force: { R: -1 }, desc: 'Hypogonadotropic hypogonadism; restored by **pulsatile** GnRH.' },
    ],
    steps: [{ n: ['R', 'gq', 'ip3', 'ca', 'exo', 'o_rel'], t: '**Release:** IP₃/Ca²⁺.' }, { n: ['gq', 'dag', 'mapk', 'genes', 'o_syn'], t: '**Synthesis:** PKC/MAPK.' }],
    refs: ['kovacs5', 'kovacs8', 'molina3'],
  };

  window.EP.cascadeOrder = [
    ['insulin', 'Insulin'], ['glucagon', 'Glucagon'], ['cortisol', 'Cortisol'], ['epinephrine', 'Epinephrine'], ['gh', 'Growth hormone'], ['tsh', 'TSH'], ['t3', 'Thyroid hormone'],
    ['pth', 'PTH'], ['adh', 'ADH'], ['aldo', 'Aldosterone'], ['anp', 'ANP'], ['leptin', 'Leptin'], ['lh', 'LH / hCG'], ['gnrh', 'GnRH'],
  ];
})();
