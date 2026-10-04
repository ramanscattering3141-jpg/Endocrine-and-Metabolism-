/* Visual guide to Petersen & Shulman 2018 — Sections V–VIII (why insulin resistance happens → unified model). */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;
  const IRV = EP.irv;
  const N = (id, x, y, label, k, o) => Object.assign({ id, x, y, label, k: k || 'kinase' }, o || {});
  const E = (f, t, k, label, o) => Object.assign({ f, t, k: k || 'act', label }, o || {});

  // ================================================================== V. LIPID-INDUCED INSULIN RESISTANCE
  IRV.chapter({
    rn: 'V', id: 'lipid', col: 'var(--m-fat)', title: 'Lipid-induced insulin resistance', tile: 'Randle, ectopic fat, DAG–PKC, ceramide',
    sub: 'Fat in the wrong place (liver, muscle) and the lipid messengers that block insulin signaling (Figs. 12–17).',
    build(b) {
      // ---- Randle (Fig. 12)
      b.appendChild(IRV.fig('Fig. 12 · V-A', 'The Randle cycle: right about fuel choice, wrong about insulin resistance', 'Randle predicted fat oxidation would **back glucose up** inside muscle. MRS showed glucose and G6P **fall** → the block is at **glucose transport**.',
        EP.flow({
          w: 920, h: 310,
          zones: [{ x: 120, y: 95, w: 790, h: 205, label: 'Myocyte', lx: 900, ly: 290, anchor: 'end' }],
          nodes: [
            N('glcO', 60, 150, 'Glucose', 'glc'), N('glut4', 175, 150, 'GLUT4', 'transporter'), N('glcIn', 290, 150, 'Free glucose', 'glc'),
            N('g6p', 475, 150, 'G6P', 'glc'), N('pfk', 600, 150, 'PFK · glycolysis', 'enzyme'), N('pdh', 790, 150, 'PDH → glucose oxidation', 'enzyme'),
            N('glycogen', 475, 245, 'Glycogen', 'glc'), N('cit', 640, 245, 'Citrate', 'metab'),
            N('fa', 455, 45, 'Fatty acids (lipid infusion)', 'lipid'), N('acoa', 760, 45, 'Acetyl-CoA/CoA · NADH/NAD⁺', 'metab'),
            N('dag', 220, 245, 'sn-1,2-DAG → PKCθ', 'bad', { info: 'Peaks at 3–5 h of lipid infusion together with long-chain acyl-CoA and PKCθ activation (not ceramide or TAG), exactly when insulin resistance appears.' }),
          ],
          edges: [
            E('glcO', 'glut4', 'flow', null, { anim: true }), E('glut4', 'glcIn', 'flow', null, { anim: true }), E('glcIn', 'g6p', 'flow', 'hexokinase', { lo: [0, -8] }), E('g6p', 'pfk', 'flow'), E('pfk', 'pdh', 'flow'), E('g6p', 'glycogen', 'flow'),
            E('fa', 'acoa', 'flow', 'β-oxidation'), E('acoa', 'pdh', 'inh'), E('acoa', 'cit', 'flow', null, { via: [[870, 45], [870, 245]] }), E('cit', 'pfk', 'inh'),
            E('g6p', 'glcIn', 'inh', 'G6P ⊣ HK', { bend: -40, lo: [0, 14] }),
            E('fa', 'dag', 'flow', null, { via: [[220, 45]] }), E('dag', 'glut4', 'inh', 'IRS1 / GIV Ser-P'),
          ],
          states: [
            { id: 'r', label: '💭 Randle prediction', n: { dag: { c: 'off' }, acoa: { b: '↑' }, pdh: { b: '↓' }, cit: { b: '↑' }, pfk: { b: '↓' }, g6p: { b: '↑' }, glcIn: { b: '↑' }, glut4: { b: '↔' } }, e: { 'fa>dag': 'off', 'dag>glut4': 'off', 'acoa>pdh': 'thick', 'cit>pfk': 'thick', 'g6p>glcIn': 'thick' }, cap: '**Prediction:** fat oxidation ⊣ PDH and (via citrate) PFK → G6P piles up → inhibits hexokinase → free glucose rises → uptake slows.' },
            { id: 'o', label: '🔬 Measured (3–5 h, MRS)', n: { dag: { b: '↑' }, glut4: { c: 'bad', b: '↓' }, glcIn: { b: '↓' }, g6p: { b: '↓' }, glycogen: { b: '↓' }, pdh: { b: '↓' } }, e: { 'g6p>glcIn': 'off', 'cit>pfk': 'weak', 'glcO>glut4': 'weak', 'glut4>glcIn': 'weak', 'dag>glut4': 'thick' }, cap: '**Observed:** glucose **and** G6P fall → transport is blocked upstream. Pdk2/4-knockout mice (no Randle cycle) still get lipid-induced muscle IR.' },
          ],
        }),
        IRV.lipidInfusion(),
        IRV.pts([['⚖️', 'Randle **does** operate in the first ~3 h (G6P ↑, glycolysis ↓) and governs fuel choice. Glucose returns the favour via **malonyl-CoA ⊣ CPT-1**.'], ['📈', 'Even high-physiological NEFA (0.75 mM) causes muscle IR — but only after **several hours**.']]),
        IRV.cards([
          { t: '💉 Acute lipid–heparin infusion', p: 'Full control of dose and timing; no obesity, inflammation or hyperinsulinemia confounders. But acute, IV, static and often supraphysiological.', v: ['m', 'mechanism studies'] },
          { t: '🧈 High-fat-fed rodent', p: 'Starts metabolically normal → can catch the **earliest** defects. Rodents get liver IR in days, muscle IR only after weeks (humans: muscle first).', v: ['y', 'best for "first hit"'] },
          { t: '🐭 ob/ob · db/db · fa/fa', p: 'Leptin-axis mutants: hyperphagic, studied when morbidly obese. Leptin does much more than satiety.', v: ['n', 'late-stage only'] },
        ])));

      // ---- ectopic lipid (Fig. 13)
      b.appendChild(IRV.fig('Fig. 13 · V-A', 'The ectopic lipid hypothesis', 'Fat stored **under the skin** is fine. Fat in **liver and muscle** goes with insulin resistance — whatever the body weight.',
        ectopicTiles(),
        IRV.ev('Liver fat (IHTG) causes hepatic IR', [
          ['y', 'Humans', '~⅔ of obese and nearly all obese T2D have NAFLD; IHTG strongly predicts IR'],
          ['y', 'Modest weight loss in T2D', 'IHTG ↓ → HGP suppression and fasting glucose normalize (no muscle change)'],
          ['y', 'Single oral fat bolus (humans)', 'IHTG ↑ and hepatic insulin sensitivity ↓'],
          ['n', 'Visceral fat?', 'Omentectomy without IHTG change does not fix hepatic IR; visceral fat is a small FA source'],
          ['y', 'DNP (mitochondrial uncoupler)', 'Fast IHTG ↓ normalizes hepatic insulin action (fat-fed, STZ, ZDF, lipodystrophic, NASH rats)'],
          ['y', 'LpL / ANGPTL / APOC3 / APOA5', 'Liver LpL ↑ → liver IR; Angptl8 ASO, adipose Angptl4 KO, Apoa5 ASO protect; APOC3 variant in South Asian men → IHTG + IR'],
          ['y', 'Liver SREBP-1c, MCD, CES2, estrogen, FGF21', 'Liver fat tracks liver IR in each'],
          ['m', 'PNPLA3 I148M, liver Scap KO, FAO-defect mice', 'Fat without (clear) IR — but confounders (gluconeogenesis needs FAO; adipose IR persists)'],
        ]),
        IRV.ev('Redistribute fat to WAT → insulin sensitivity returns', [
          ['y', 'A-ZIP/F-1 lipodystrophic mice + fat transplant', 'Liver & muscle lipid ↓, insulin action normal'],
          ['y', 'Leptin in lipodystrophy (mice & humans)', 'Massive IHTG ↓, hepatic insulin action normal'],
          ['y', 'Adipocyte Pten deletion', 'Fat goes to WAT, not liver → protected on HFD'],
          ['y', 'Adipose PEPCK overexpression', 'Glyceroneogenesis → re-esterification → obese but insulin-sensitive'],
          ['y', 'Thiazolidinediones (PPARγ)', 'Proposed to work by moving fat into adipocytes'],
          ['y', 'Adiponectin-transgenic ob/ob', 'Up to 2× heavier than ob/ob, less IHTG, normal insulin sensitivity'],
          ['y', 'Reverse: db/db + adipose LepR', 'Less obesity, more IHTG → diabetes at 4 wk instead of 14'],
          ['y', 'Human genetics', 'Variants limiting peripheral fat storage → insulin resistance'],
        ]),
        IRV.ev('Muscle fat (IMCL) — more complicated', [
          ['y', '¹H-MRS in lean non-diabetics', 'IMCL is a stronger predictor of IR than plasma NEFA'],
          ['y', 'Pima Indians', 'Muscle TG, not BMI, tracks glucose uptake'],
          ['y', 'Muscle LpL KO / OE', 'KO protected; overexpression → IMCL ↑ and muscle IR'],
          ['n', 'Athlete\'s paradox', 'Endurance athletes have T2D-level IMCL yet are very insulin-sensitive → stored TG itself is not the culprit'],
        ])));

      // ---- Kennedy pathway (Fig. 14)
      const K = (o) => o;
      b.appendChild(IRV.fig('Fig. 14 · V-B', 'Testing the DAG idea with mouse genetics', 'DAG is the step just before triglyceride. Pick a mouse model to see what happened to DAG, PKCε and hepatic insulin action.',
        EP.flow({
          w: 940, h: 330,
          nodes: [
            N('g3p', 80, 60, 'Glycerol-3-P', 'glc'), N('lpa', 290, 60, 'Lysophosphatidic acid', 'lipid'), N('pa', 505, 60, 'Phosphatidic acid', 'lipid'), N('dag', 710, 60, 'sn-1,2-DAG', 'lipid'),
            N('mgat', 870, 60, 'MGAT', 'enzyme', { info: 'Monoacylglycerol → DAG (PPARγ-regulated). MGAT1 knockdown improved glucose tolerance; in one study total DAG rose but membrane PKCε fell — the **pool** matters.' }),
            N('gpat', 185, 135, 'GPAT (mtGPAT)', 'enzyme'), N('agpat', 395, 135, 'AGPAT', 'enzyme', { info: 'AGPAT2 loss → lipodystrophy (mice & humans) — confounds the test.' }), N('lipin', 605, 135, 'Lipin (PAP)', 'enzyme', { info: 'Lipin-1 KO → lipodystrophy; lipin-2 KO compensated by lipin-1. Acute knockdowns are cleaner.' }),
            N('dgat', 880, 140, 'DGAT1/2', 'enzyme'), N('tag', 850, 230, 'Triglyceride', 'lipid'),
            N('pkce', 650, 290, 'PKCε → membrane', 'kinase'),
            N('ins', 330, 290, 'INSR pThr1160 → hepatic insulin action', 'receptor'),
          ],
          edges: [
            E('g3p', 'lpa', 'flow'), E('lpa', 'pa', 'flow'), E('pa', 'dag', 'flow'), E('dag', 'tag', 'flow'), E('dag', 'pa', 'flow', 'DAGK', { bend: 34, col: 'var(--faint)' }),
            E('gpat', 'lpa', 'act'), E('agpat', 'pa', 'act'), E('lipin', 'dag', 'act'), E('dgat', 'tag', 'act'), E('mgat', 'dag', 'act'),
            E('dag', 'pkce', 'act'), E('pkce', 'ins', 'inh', 'phosphorylates'),
          ],
          states: [
            K({ id: 'base', label: 'Pathway', cap: 'Kennedy pathway (ER): G3P → LPA → PA → **sn-1,2-DAG** → TAG. DAG activates PKCε, which inhibits INSR.' }),
            K({ id: 'gko', label: 'mtGPAT KO', n: { gpat: { c: 'bad', b: '✕' }, dag: { b: '↓' }, tag: { b: '↓' }, pkce: { b: '↓' }, ins: { c: 'good', b: '✓' } }, cap: 'Fat-fed mtGPAT⁻/⁻: acyl-CoA ↑ but DAG/TAG ↓, PKCε ↓ → **protected** (better HGP suppression, IRS2-PI3K, AKT).' }),
            K({ id: 'goe', label: 'mtGPAT ↑', n: { gpat: { b: '↑' }, dag: { b: '↑' }, tag: { b: '↑' }, pkce: { b: '↑' }, ins: { c: 'bad', b: '↓' } }, cap: 'Adenoviral liver mtGPAT: LPA, DAG, TAG ↑, PKCε ↑ → hepatic IR even on chow.' }),
            K({ id: 'lkd', label: 'Lipin knockdown', n: { lipin: { c: 'bad', b: '↓' }, dag: { b: '↓' }, tag: { b: '↓' }, pkce: { b: '↓' }, ins: { c: 'good', b: '✓' } }, cap: 'Lipin-1 or lipin-2 shRNA (db/db, HFD): DAG ↓, PKCε ↓ → better glucose tolerance.' }),
            K({ id: 'loe', label: 'Lipin-2 ↑', n: { lipin: { b: '↑' }, dag: { b: '↑' }, tag: { b: '↑' }, pkce: { b: '↑' }, ins: { c: 'bad', b: '↓' } }, cap: 'Liver lipin-2 overexpression: DAG/TAG ↑, PKCε ↑ → worse glucose tolerance.' }),
            K({ id: 'doe', label: 'DGAT2 ↑ (liver)', n: { dgat: { b: '↑' }, tag: { b: '↑' }, dag: { b: '↑' }, pkce: { b: '↑' }, ins: { c: 'bad', b: '↓' } }, cap: 'Unexpectedly DAG rose too → PKCε ↑ → severe hepatic IR.' }),
            K({ id: 'dko', label: 'DGAT2 ASO', n: { dgat: { c: 'bad', b: '↓' }, dag: { b: '↓' }, pkce: { b: '↓' }, ins: { c: 'good', b: '✓' } }, cap: 'Fat-fed rats: DAG ↓, PKCε ↓ → improved hepatic insulin sensitivity.' }),
            K({ id: 'm1', label: 'Muscle DGAT1 ↑', n: { dgat: { b: '↑' }, dag: { b: '↓' }, tag: { b: '↑' }, ins: { c: 'good', b: '✓' } }, cap: 'In muscle: TAG ↑ but DAG ↓ → protected from HFD insulin resistance (TAG itself is harmless).' }),
          ],
        }),
        IRV.pts([['🧮', '≥ 24 rodent studies: hepatic DAG content moves **inversely** with hepatic insulin sensitivity.'], ['🧑‍⚕️', '5 human studies: hepatic DAG correlates with hepatic IR (HOMA-IR or clamp).'], ['⚠️', 'Compensations complicate many models (Dgat1⁻/⁻ burn more energy; DAGK isoforms conflict; Elovl6⁻/⁻ fatty but protected — no DAG/PKCε rise).']])));

      // ---- DAG compartments & stereoisomers (Fig. 15)
      b.appendChild(IRV.fig('Fig. 15 · V-B', 'Not all DAG is equal: where and which isomer', 'Only **sn-1,2-DAG** activates PKC. Lipolysis by ATGL makes **sn-1,3-DAG**. Lipogenic DAG may act at the **Golgi**, where PKCε\'s anchor RACK2 sits.',
        EP.flow({
          w: 940, h: 340,
          zones: [
            { x: 10, y: 10, w: 920, h: 66, kind: 'membrane', label: 'Plasma membrane', lx: 920, ly: 28, anchor: 'end' },
            { x: 20, y: 100, w: 270, h: 225, label: 'Endoplasmic reticulum', col: 'var(--c-enzyme)' },
            { x: 310, y: 100, w: 300, h: 225, label: 'Golgi', col: 'var(--c-kinase)' },
            { x: 630, y: 100, w: 300, h: 225, label: 'Lipid droplet', col: 'var(--m-fat)' },
          ],
          nodes: [
            N('plc', 130, 45, 'PLC: PIP2 → sn-1,2-DAG', 'lipid'), N('cpkc', 370, 45, 'Classical PKC (+ Ca²⁺)', 'kinase', { info: 'cPKCs need Ca²⁺ **and** DAG — fast spikes from PLC signaling. nPKCs need DAG only, bind it 2× more tightly and stay active → suited to chronic lipid excess. aPKCs need neither.' }),
            N('insr', 700, 45, 'INSR', 'receptor'),
            N('ken', 155, 160, 'Kennedy pathway', 'enzyme'), N('erdag', 155, 240, 'sn-1,2-DAG', 'lipid'),
            N('gdag', 400, 160, 'sn-1,2-DAG', 'lipid'), N('rack2', 530, 160, 'RACK2', 'kinase', { info: 'PKCε anchor; also part of the COPI coat that moves vesicles between ER and Golgi.' }),
            N('npkc', 460, 250, 'PKCε (novel PKC)', 'kinase'),
            N('tag', 700, 160, 'TAG', 'lipid'), N('atgl', 845, 160, 'ATGL + CGI-58', 'enzyme'), N('d13', 780, 250, 'sn-1,3-DAG → no PKC', 'lipid'),
            N('pkcld', 780, 300, 'PKCε stuck at droplet', 'kinase'),
          ],
          edges: [
            E('plc', 'cpkc', 'act'), E('ken', 'erdag', 'flow'), E('erdag', 'gdag', 'move', 'vesicle traffic', { lo: [0, 18] }), E('gdag', 'npkc', 'act'), E('rack2', 'npkc', 'act', 'anchors'),
            E('npkc', 'insr', 'inh', 'Thr1160', { via: [[620, 250], [620, 90]] }), E('tag', 'd13', 'flow'), E('atgl', 'd13', 'act'),
          ],
          states: [
            { id: 'ir', label: 'Lipogenic DAG (typical IR)', n: { pkcld: { c: 'off' }, gdag: { b: '↑' }, npkc: { b: '↑' }, insr: { c: 'bad', b: '↓' } }, cap: 'Lipogenic sn-1,2-DAG reaches Golgi/membranes → PKCε → INSR inhibited. (Golgi role is plausible but not yet tested directly.)' },
            { id: 'cgi', label: 'CGI-58 knockdown', n: { tag: { b: '↑↑' }, d13: { b: '↑' }, npkc: { c: 'off' }, pkcld: { b: '!' }, insr: { c: 'good', b: '✓' } }, e: { 'npkc>insr': 'off' }, cap: 'CGI-58 ASO: huge liver fat and DAG, yet normal insulin action — PKCε moved to the **lipid droplet**, away from INSR.' },
          ],
        }),
        IRV.ev('Models that seem to break the DAG link — and why', [
          ['m', 'CGI-58 ASO', 'DAG ↑, normal insulin action → PKCε sequestered at lipid droplet'],
          ['m', 'Perilipin-5 overexpression', 'TAG & DAG ↑, normal sensitivity (similar mechanism?)'],
          ['m', 'ChREBP overexpression', 'Lipogenic DAG ↑ but protected (PKCε not measured)'],
          ['m', 'Liver Mttp KO (no VLDL export)', 'Lipid ↑, normal clamp — adipose still suppresses lipolysis normally'],
          ['y', 'Liver Hdac3 KO', 'DAG ↑ several-fold but **no PKCε activation** → insulin-sensitive'],
          ['y', 'HSL KO muscle', 'sn-1,3-DAG ↑, sn-1,2 unchanged → better uptake'],
          ['y', 'Human muscle by isomer & compartment', 'T2D: sn-1,2-DAG ↑ in sarcolemma; athletes: less PKCθ translocation'],
        ])));

      // ---- DAG/PKCε/INSR and PKCθ (Fig. 16)
      b.appendChild(IRV.fig('Fig. 16 · V-B', 'DAG → novel PKC → insulin signaling blocked', 'Liver: PKCε phosphorylates the insulin receptor (**Thr1160**). Muscle: PKCθ hits IRS1, PDK1 and GIV.',
        EP.flow({
          w: 940, h: 320,
          zones: [{ x: 10, y: 20, w: 920, h: 110, label: 'Liver', col: 'var(--tr0)' }, { x: 10, y: 145, w: 920, h: 165, label: 'Skeletal muscle', col: 'var(--tr3)' }],
          nodes: [
            N('over', 95, 75, 'Overnutrition', 'bad'), N('hdag', 255, 75, 'Liver sn-1,2-DAG ↑', 'lipid'), N('pkce', 430, 75, 'PKCε → membrane', 'kinase'),
            N('t1160', 630, 75, 'INSR pThr1160\n(activation loop)', 'receptor', { info: 'Thr1160Glu (phosphomimetic) INSR is nearly kinase-dead; Thr1160Ala blocks PKCε inhibition. **InsrT1150A** knock-in mice (mouse numbering) are protected from HFD hepatic IR.' }),
            N('hout', 835, 75, 'INSR kinase ↓ →\nall hepatic actions ↓', 'bad'),
            N('lip', 95, 225, 'Lipid oversupply', 'bad'), N('mdag', 255, 225, 'Muscle sn-1,2-DAG ↑', 'lipid'), N('pkct', 430, 225, 'PKCθ → membrane', 'kinase'),
            N('irs1', 630, 175, 'IRS1 Ser1101', 'kinase', { info: 'Phosphorylated within 15 min; ↑ in lipid-infused humans. But many kinases hit it (S6K1, TNF-α, PMA…).' }),
            N('pdk1', 630, 225, 'PDK1 Ser504/532', 'kinase'), N('giv', 630, 275, 'GIV Ser1689', 'kinase', { info: 'GIV is needed for palmitate-induced IR in myotubes; phosphomimetic Ser1689Asp abolishes uptake; pioglitazone ↓ it in PCOS.' }),
            N('mout', 835, 225, 'PI3K–AKT ↓ →\nGLUT4 ↓', 'bad'),
          ],
          edges: [E('over', 'hdag', 'bad'), E('hdag', 'pkce'), E('pkce', 't1160', 'act', 'P'), E('t1160', 'hout', 'bad'),
            E('lip', 'mdag', 'bad'), E('mdag', 'pkct'), E('pkct', 'irs1', 'act', 'P'), E('pkct', 'pdk1', 'act'), E('pkct', 'giv', 'act'), E('irs1', 'mout', 'bad'), E('pdk1', 'mout', 'bad'), E('giv', 'mout', 'bad')],
          steps: [
            { n: ['over', 'hdag'], cap: 'Overnutrition → liver fat; DAG (penultimate step to TAG) rises with it.' },
            { n: ['hdag', 'pkce'], cap: 'DAG recruits **PKCε** to membranes — the only one of the liver PKCs that translocates in 3-day fat-fed rats and obese humans.' },
            { n: ['pkce', 't1160', 'hout'], cap: 'PKCε phosphorylates INSR **Thr1160** in the kinase activation loop → receptor kinase inhibited → every downstream arm weakened.' },
            { n: ['lip', 'mdag', 'pkct'], cap: 'In muscle the novel PKC is **PKCθ** (peaks with DAG at 3–5 h of lipid infusion).' },
            { n: ['pkct', 'irs1', 'pdk1', 'giv', 'mout'], cap: 'PKCθ targets: IRS1 Ser1101, PDK1, GIV → less PI3K–AKT → less GLUT4.' },
          ],
        }),
        IRV.pts([['📉', 'A receptor-level but **post-receptor** defect: curve shifts right **and** down — yet portal hyperinsulinemia can still overcome much of it (Fig. 7).'], ['🧬', 'Phorbol-ester-era INSR sites (Ser1327, Thr1348…) never held up in vivo; Ser994 (↑ in obese mouse liver) is unexplained.']]),
        IRV.ev('Key tests of the DAG–nPKC hypothesis', [
          ['y', 'PKCε ASO (liver + fat), 3-day HFD rats', 'Protected from hepatic IR; IRK activity preserved'],
          ['y', 'PKCε knockout mice, 1-wk HFD', 'Protected despite more liver DAG/TAG'],
          ['y', 'Insr T1150A knock-in mice', 'Protected from HFD hepatic IR'],
          ['y', 'PKCθ KO + lipid infusion', 'Completely protected from muscle IR'],
          ['m', 'PKCθ KO / dominant-negative on HFD', 'Fatter and more IR (less activity) → PKCθ may also have normal roles'],
          ['m', 'PKCδ', 'KO improves liver signaling, but not activated in human NAFLD or 3-day HFD rats'],
          ['y', 'Interventions (rosiglitazone, low-fat meal, intermittent fasting)', 'DAG and nPKC activation fall as insulin sensitivity returns'],
          ['y', 'Obese human liver', 'PKCε translocation correlates with DAG and HOMA-IR — only 1 of 6 isoforms'],
        ])));

      // ---- ceramide & acylcarnitine (Fig. 17)
      b.appendChild(IRV.fig('Fig. 17 · V-C/D', 'Three proposed lipid mechanisms in muscle', 'DAG acts at the **top** of the cascade; ceramides at **AKT**; acylcarnitines/ROS are vaguer. Typical IR shows **proximal** defects — which favours DAG.',
        EP.flow({
          w: 940, h: 360,
          zones: [{ x: 10, y: 10, w: 300, h: 340, label: 'A · DAG / PKCθ', col: 'var(--tr3)' }, { x: 320, y: 10, w: 300, h: 340, label: 'B · Ceramide / AKT', col: 'var(--tr4)' }, { x: 630, y: 10, w: 300, h: 340, label: 'C · Acylcarnitine / ROS', col: 'var(--tr5)' }],
          nodes: [
            N('fa1', 160, 55, 'Fatty acid flux', 'lipid'), N('dagA', 160, 125, 'sn-1,2-DAG', 'lipid'), N('pkct', 160, 195, 'PKCθ translocation', 'kinase'),
            N('irsA', 160, 255, 'IRS1 / GIV Ser-P', 'kinase'), N('outA', 160, 315, '↓ IRS1 pTyr · ↓ PI3K', 'bad'),
            N('palm', 470, 55, 'Palmitate (saturated)', 'lipid'), N('cer', 470, 125, 'Ceramide', 'lipid'),
            N('pp2a', 400, 195, 'PP2A', 'enzyme'), N('pkcz', 545, 195, 'PKCζ', 'kinase'), N('akt', 470, 255, 'AKT', 'kinase'), N('outB', 470, 315, '↓ AKT-P / translocation', 'bad'),
            N('fa3', 780, 55, 'Fatty acid flux', 'lipid'), N('inc', 780, 125, 'Incomplete β-oxidation', 'process'),
            N('acyl', 705, 195, 'Long-chain\nacylcarnitines', 'lipid'), N('ros', 860, 195, 'ROS (H₂O₂)', 'bad'), N('outC', 780, 290, '? kinase/phosphatase tone\n? mitochondrial function', 'bad'),
          ],
          edges: [E('fa1', 'dagA', 'flow'), E('dagA', 'pkct'), E('pkct', 'irsA', 'act', 'P'), E('irsA', 'outA', 'bad'),
            E('palm', 'cer', 'flow', 'SPT (myriocin ⊣)', { lo: [50, 4] }), E('cer', 'pp2a'), E('cer', 'pkcz'), E('pp2a', 'akt', 'inh', 'dephos'), E('pkcz', 'akt', 'inh', 'translocation'), E('akt', 'outB', 'bad'),
            E('fa3', 'inc', 'flow'), E('inc', 'acyl', 'flow'), E('inc', 'ros', 'flow'), E('acyl', 'outC', 'bad', '?'), E('ros', 'outC', 'bad', '?')],
        }),
        h('div.irv-two',
          IRV.ev('Ceramides', [
            ['y', 'Myriocin (blocks synthesis)', 'Partly prevents lard-oil IR; fully prevents palmitate (not linoleate) IR in myotubes'],
            ['y', 'Liver acid ceramidase ↑ (Alb-AC)', 'Protected from HFD hepatic IR (but liver TAG also 3× lower)'],
            ['y', 'Muscle C18:0 ceramide (3 human studies)', 'Inversely tracks clamp sensitivity; first to rise on HFD'],
            ['n', 'Unsaturated fatty acids', 'Cause equal functional IR **without** raising ceramide'],
            ['n', 'Many IR models', 'Normal ceramides: 8-wk HFD mice, lipid infusion, Pdk2/4⁻/⁻, 3-day HFD rats; 3 of 4 human liver studies'],
            ['n', 'Site of block', 'Typical IR has proximal (INSR/IRS) defects; an AKT-only block should **enhance** proximal signaling'],
            ['n', 'Acute PP2A inhibition', '↑ AKT-P but no rescue (worse muscle IR)'],
          ]),
          IRV.ev('Acylcarnitines / metabolic inflexibility', [
            ['m', 'HFD muscle', 'FAO ↑ but incomplete; long-chain acylcarnitines ↑ (ZDF rats)'],
            ['n', 'Muscle PGC-1α overexpression', 'More complete FAO yet muscle IR (DAG/PKCθ ↑)'],
            ['n', 'Myotubes + acylcarnitines', 'Only 20–30% ↓ AKT Ser473, not dose-dependent'],
            ['n', 'Plasma levels', 'Reflect liver more than muscle (Pdk2/4⁻/⁻: muscle ↓, plasma unchanged)'],
            ['n', 'Fasted chow rats', 'Same acylcarnitines as HFD rats, yet insulin-sensitive'],
            ['y', 'Best explanation', 'A marker of **metabolic inflexibility** — a consequence of lipid-induced IR'],
          ]))));
    },
  });

  function ectopicTiles() {
    const T = [
      ['Lean, insulin-sensitive', 'Chow-fed mouse', 0.5, 0.15, 0.15, true],
      ['Lean, insulin-resistant', 'Muscle/liver LpL-Tg mice', 0.5, 0.75, 0.75, false],
      ['Obese, insulin-resistant', 'Fat-fed mouse', 1.0, 0.8, 0.7, false],
      ['Obese, insulin-sensitive', 'TZD Rx · Ad-Tg ob/ob · adipose Pten KO', 1.0, 0.18, 0.18, true],
      ['Lipodystrophic, insulin-resistant', 'A-ZIP mouse · aP2-nSREBP1c mouse', 0.06, 0.95, 0.85, false],
      ['Lipodystrophic + leptin, sensitive', 'aP2-nSREBP1c mouse + leptin', 0.06, 0.25, 0.2, true],
    ];
    const tile = ([t, mice, sub, liv, mus, ok]) => {
      const svg = s('svg', { class: 'irv-mini', viewBox: '0 0 120 150', style: 'max-width:120px;margin:0 auto' });
      const fw = 14 + sub * 26;
      svg.appendChild(s('circle', { cx: 60, cy: 22, r: 14, style: 'fill:var(--panel2);stroke:var(--muted);stroke-width:1.5' }));
      svg.appendChild(s('rect', { x: 60 - fw - 10, y: 40, width: 2 * (fw + 10), height: 72, rx: 18 + sub * 10, style: `fill:color-mix(in srgb, var(--m-fat) ${15 + sub * 45}%, var(--panel2));stroke:var(--m-fat);stroke-width:1.5` }));
      svg.appendChild(s('rect', { x: 42, y: 44, width: 36, height: 64, rx: 12, style: 'fill:var(--panel);stroke:var(--line)' }));
      svg.appendChild(s('ellipse', { cx: 54, cy: 64, rx: 11, ry: 8, style: `fill:var(--tr0);fill-opacity:${0.08 + liv * 0.92};stroke:var(--tr0)` }));
      for (let i = 0; i < 3; i++) svg.appendChild(s('rect', { x: 64 + i * 4, y: 80, width: 3, height: 24, rx: 1.5, style: `fill:var(--tr3);fill-opacity:${0.12 + mus * 0.88}` }));
      svg.appendChild(s('rect', { x: 46, y: 112, width: 10, height: 34, rx: 5, style: 'fill:var(--panel2);stroke:var(--muted)' }));
      svg.appendChild(s('rect', { x: 64, y: 112, width: 10, height: 34, rx: 5, style: 'fill:var(--panel2);stroke:var(--muted)' }));
      return h('div.irv-card', { style: { textAlign: 'center' } }, svg, h('h4', { style: { justifyContent: 'center' } }, t), h('p', mice), h('span.irv-verdict.' + (ok ? 'y' : 'n'), ok ? 'Insulin-sensitive' : 'Insulin-resistant'));
    };
    return h('div', h('div.irv-cards', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' } }, T.map(tile)),
      EP.colorKey([['Silhouettes', [{ fill: 'color-mix(in srgb, var(--m-fat) 50%, var(--panel2))', stroke: 'var(--m-fat)', label: 'Subcutaneous fat (body width)' }, { fill: 'color-mix(in srgb, var(--tr0) 70%, var(--panel))', stroke: 'var(--tr0)', label: 'Liver fat (darker = more)' }, { fill: 'color-mix(in srgb, var(--tr3) 70%, var(--panel))', label: 'Muscle fat (darker = more)' }]]], { compact: true }));
  }

  // ================================================================== VI. CELLULAR NUTRIENT STRESS
  IRV.chapter({
    rn: 'VI', id: 'stress', col: 'var(--c-enzyme)', title: 'Organelle nutrient stress', tile: 'ER stress, mitochondria, ROS',
    sub: 'Too many nutrients strain the ER and mitochondria — mostly acting through ectopic lipid (Fig. 18).',
    build(b) {
      b.appendChild(IRV.fig('Fig. 18A · VI-A', 'ER stress and the unfolded protein response', 'ER stress is real in obese liver and fat, but in liver it seems to need **lipogenesis → DAG** to cause insulin resistance.',
        EP.flow({
          w: 940, h: 360,
          zones: [{ x: 230, y: 20, w: 560, h: 150, label: 'Endoplasmic reticulum', col: 'var(--c-enzyme)' }],
          nodes: [
            N('over', 100, 60, 'Overnutrition\n(saturated FA)', 'bad'), N('mis', 340, 60, 'Misfolded proteins', 'process'), N('bip', 560, 60, 'BiP/GRP78 lets go', 'kinase'),
            N('perk', 360, 135, 'PERK (eIF2α-P)', 'kinase'), N('ire1', 540, 135, 'IRE1', 'kinase'), N('atf6', 710, 135, 'ATF6', 'tf'),
            N('jnk', 300, 230, 'JNK', 'kinase', { info: 'Proposed to phosphorylate IRS1 (Ser307). But liver Jnk⁻/⁻ mice get **more** steatosis and IR, and IRS1 Ser307Ala mice are **more** insulin-resistant.' }),
            N('xbp1', 540, 230, 'XBP1s', 'tf', { info: 'Spliced XBP1 switches on the de novo lipogenic programme.' }),
            N('lipin', 750, 230, 'Lipin-2 ↑', 'enzyme'),
            N('dnl', 540, 300, 'De novo lipogenesis', 'process'), N('dag', 750, 300, 'DAG → PKCε', 'lipid'), N('insr', 880, 230, 'INSR', 'bad'),
          ],
          edges: [E('over', 'mis', 'bad'), E('mis', 'bip'), E('bip', 'perk'), E('bip', 'ire1'), E('bip', 'atf6'),
            E('perk', 'jnk'), E('ire1', 'jnk'), E('ire1', 'xbp1'), E('xbp1', 'dnl'), E('dnl', 'dag', 'flow'), E('atf6', 'lipin', 'act', 'ER stress'), E('lipin', 'dag', 'flow'), E('dag', 'insr', 'inh'),
            E('jnk', 'insr', 'inh', '? IRS1 Ser-P (disputed)', { via: [[300, 345], [880, 345]], col: 'var(--faint)', lo: [0, 14] })],
          states: [
            { id: 'typ', label: 'Obese liver', n: { mis: { b: '↑' }, jnk: { b: '↑' }, xbp1: { b: '↑' }, dnl: { b: '↑' }, dag: { b: '↑' }, insr: { b: '↓' } }, cap: 'UPR markers ↑ in obese mouse and human liver; XBP1s ↑ lipogenesis → DAG/PKCε.' },
            { id: 'xko', label: '🧪 Liver Xbp1 KO (fructose)', n: { xbp1: { c: 'bad', b: '✕' }, ire1: { b: '↑' }, jnk: { b: '↑' }, dnl: { b: '↓' }, dag: { b: '↓' }, insr: { c: 'good', b: '✓' } }, e: { 'xbp1>dnl': 'off' }, cap: '**More** ER stress (IRE1, JNK, BiP, eIF2α-P) but **less** lipid → **more** insulin-sensitive. ER stress + JNK alone are not enough.' },
            { id: 'bip', label: '🧪 BiP overexpression (ob/ob)', n: { bip: { c: 'good', b: '↑' }, mis: { b: '↓' }, dnl: { b: '↓' }, dag: { b: '↓' }, insr: { c: 'good', b: '✓' } }, cap: 'Relieving ER stress cut steatosis and improved hepatic insulin sensitivity → ER stress can **exacerbate** lipid-driven IR.' },
          ],
        }),
        IRV.pts([['🫙', '**Fat:** ER stress (e.g. adipose Dgat1 KO) → PKA → perilipin-P → lipolysis = functional IR even if signaling is intact.'], ['💪', '**Muscle:** little or no ER stress in HFD mice or 6-wk HFD humans; muscle JNK on/off doesn\'t change insulin action.'], ['🧑', 'Human liver: eIF2α-P and CHOP track IR, but XBP1 splicing and JNK-P do not.'], ['🔄', 'Both XBP1 deletion **and** overexpression improved hepatic insulin action — not yet reconciled.']])));
      b.appendChild(IRV.fig('Fig. 18B · VI-B', 'Mitochondria: a vicious cycle in muscle', 'Lipid supply rises but **ATP demand doesn\'t** → fat is stored (IMCL) or burned incompletely → ROS damage mitochondria → even less burned.',
        EP.flow({
          w: 940, h: 360,
          nodes: [
            N('over', 120, 60, 'Chronic lipid oversupply', 'bad'),
            N('fao', 420, 60, '↑ FAO capacity (adaptive)\nbut ATP demand fixed', 'process', { info: 'Weeks of HFD raise muscle FAO capacity. Even forcing FAO (AMPK activators, ACC2 KO) does not prevent HFD muscle IR — ATP demand, not substrate, sets oxidation.' }),
            N('inc', 740, 60, 'Incomplete oxidation →\nacylcarnitines + H₂O₂', 'bad', { info: 'H₂O₂ production rises within 3 days of HFD; GSH/GSSG falls (also in obese human muscle). Oxidised cysteines may favour inhibitory Ser/Thr phosphorylation.' }),
            N('dmg', 820, 190, 'Mitochondrial\ndamage', 'bad'),
            N('atp', 600, 300, '↓ Mitochondrial ATP synthesis', 'process', { info: '³¹P-MRS: ↓ ATP synthesis in the elderly, lean insulin-resistant offspring of T2D parents and prediabetics.' }),
            N('imcl', 330, 300, 'IMCL ↑ → DAG/PKCθ', 'lipid'), N('ir', 100, 300, 'Muscle insulin\nresistance', 'bad'),
            N('gen', 580, 190, 'Aging · genetics (lean T2D offspring)\nSLC16A11 · NAT2', 'gene', { info: '**SLC16A11** risk haplotype (~30% in Mexican ancestry; ~20% of excess T2D risk): ↓ transporter → hepatocyte acylcarnitine, DAG, TAG ↑. **NAT2** (mouse Nat1 KO): ↓ energy expenditure, mitochondrial dysfunction → DAG/PKCε/θ on HFD.' }),
            N('mcat', 870, 300, 'Mito catalase\n(MCAT)', 'good', { info: 'Scavenging mitochondrial H₂O₂ protects against diet- and age-induced muscle IR (less DAG/PKCθ). But 78 antioxidant trials: no mortality benefit.' }),
          ],
          edges: [E('over', 'fao', 'bad'), E('fao', 'inc', 'bad'), E('inc', 'dmg', 'bad'), E('dmg', 'atp', 'bad'), E('atp', 'imcl', 'bad', 'less fat burned'), E('fao', 'imcl', 'flow', 'excess stored', { lo: [-48, 0] }), E('imcl', 'ir', 'bad'),
            E('gen', 'atp', 'bad'), E('mcat', 'dmg', 'inh'), E('inc', 'ir', 'bad', '? ROS / acylcarnitines', { via: [[740, 140], [100, 140]], col: 'var(--faint)' })],
          steps: [
            { n: ['over', 'fao'], cap: 'Lipid oversupply: muscle raises its capacity to oxidise fat, but can\'t raise **ATP demand**.' },
            { n: ['fao', 'imcl', 'ir'], cap: 'Unburned fat is stored: IMCL ↑ → DAG/PKCθ → insulin resistance.' },
            { n: ['fao', 'inc', 'dmg'], cap: 'Oxidation outpaces demand → incomplete oxidation, **H₂O₂** (the electron "release valve") → mitochondrial damage.' },
            { n: ['dmg', 'atp', 'imcl'], cap: '↓ ATP synthesis → even less fat burned → more IMCL. **Vicious cycle.**' },
            { n: ['gen', 'atp'], cap: 'In humans, ↓ mitochondrial activity is already present in the elderly and lean T2D offspring.' },
            { n: ['mcat', 'dmg'], cap: 'Blocking mitochondrial H₂O₂ (MCAT mice) breaks the cycle in mice.' },
          ],
        }),
        IRV.pts([['🤔', 'Paradox: **severe** mitochondrial loss (Tfam, Aif, PGC-1α/β KO) *improves* uptake — more glycolysis and AMPK. The cycle may apply to mild (< 40%) deficits.'], ['🧪', 'Glutathione peroxidase-1 KO mice are **protected** — some H₂O₂ (from NOX4) helps insulin signaling.'], ['🔀', 'Blocking β-oxidation sometimes improves muscle insulin sensitivity despite more IMCL; Pdk2/4⁻/⁻ show FAO is not necessary for IR.']])));
    },
  });

  // ================================================================== VII. INTEGRATED / NON-CELL-AUTONOMOUS
  IRV.chapter({
    rn: 'VII', id: 'crosstalk', col: 'var(--tr3)', title: 'Inflammation, BCAAs, adipokines', tile: 'Macrophages, amino acids, RBP4, adiponectin…',
    sub: 'Signals passed between tissues — they mostly work by increasing lipolysis and ectopic fat.',
    build(b) {
      b.appendChild(IRV.fig('VII-A', 'Macrophages and fat cells: a "two-hit" model', 'Inflammation mainly worsens IR by **driving lipolysis** — fatty acids and glycerol then act on liver and muscle. It is probably not the first hit.',
        EP.flow({
          w: 940, h: 360,
          zones: [{ x: 10, y: 15, w: 680, h: 335, label: 'White adipose tissue', col: 'var(--m-fat)' }],
          nodes: [
            N('over', 90, 60, 'Overnutrition', 'bad'), N('stress', 270, 60, 'Adipocyte stress & death', 'bad'),
            N('rec', 550, 60, 'Neutrophils (first) · NK (IFN-γ)\nB2 cells · MCP-1/CCR2', 'immune'),
            N('atm', 550, 150, 'Macrophages (ATMs)\ncrown-like structures', 'immune', { info: 'Metabolically activated ATMs are neither M1 nor M2 (mimicked by palmitate). They also do good: clear dead adipocytes (lysosomal exocytosis) and buffer fatty acids (PPARγ). Acute inflammation is needed for healthy fat expansion.' }),
            N('cyto', 550, 235, 'JNK → TNF-α · IL-1β', 'immune', { info: 'TNF-α only inhibits INSR kinase directly at doses far above plasma levels; paracrine effects are hard to measure.' }),
            N('lipo', 300, 235, 'Lipolysis ↑\n(↓ perilipin, FSP27)', 'process'), N('spill', 120, 235, 'FA spill from\ndead adipocytes', 'lipid'),
            N('nefa', 300, 315, 'NEFA + glycerol turnover ↑', 'lipid'),
            N('liv', 815, 250, 'Liver: acetyl-CoA → PC →\ngluconeogenesis; DAG/PKCε', 'process'), N('mus', 815, 320, 'Muscle: IMCL → DAG/PKCθ', 'process'),
          ],
          edges: [E('over', 'stress', 'bad'), E('stress', 'rec', 'act', 'chemokines', { lo: [0, 22] }), E('rec', 'atm'), E('atm', 'cyto'), E('cyto', 'lipo', 'act', '2nd hit'), E('stress', 'spill', 'flow'), E('lipo', 'nefa', 'flow', null, { anim: true }), E('spill', 'nefa', 'flow', null, { anim: true }),
            E('nefa', 'liv', 'flow', null, { anim: true }), E('nefa', 'mus', 'flow', null, { anim: true })],
          steps: [
            { n: ['over', 'stress'], cap: 'Expanding fat is stressed; some adipocytes die.' },
            { n: ['stress', 'rec', 'atm'], cap: '**Hit 1:** immune cells arrive — neutrophils first, NK and B2 cells help — and macrophages ring dead cells.' },
            { n: ['atm', 'cyto', 'lipo'], cap: '**Hit 2:** cytokines (TNF-α, IL-1β) via JNK → more lipolysis.' },
            { n: ['stress', 'spill', 'lipo', 'nefa'], cap: 'Plus fatty acids leaking from dead adipocytes → NEFA/glycerol flux ↑.' },
            { n: ['nefa', 'liv', 'mus'], cap: 'Liver: acetyl-CoA drives gluconeogenesis, DAG/PKCε; muscle: IMCL → DAG/PKCθ. **Inflammation unified with lipid-induced IR.**' },
          ],
        }),
        h('h4', 'Timing in high-fat-fed rodents'), hfdTimeline(),
        IRV.ev('Is inflammation the cause?', [
          ['y', 'TNF-α neutralization (fa/fa rats); Tnfa⁻/⁻ mice', 'Better insulin sensitivity'],
          ['n', 'Local TNF-α inhibition', 'Worse glucose tolerance'],
          ['y', 'Macrophage Jnk1/2 KO (ΦKO)', 'Less ATM infiltration, less lipolysis, better HGP suppression — but improved on chow too'],
          ['m', 'Adipocyte JNK KO / liver JNK KO / muscle JNK', 'Protects liver (less liver fat) / **worse** steatosis / no effect'],
          ['n', 'IRS1 Ser307Ala mice', 'More, not less, insulin-resistant'],
          ['y', 'Nox2⁻/⁻ (no functional ATMs)', 'Dead adipocytes accumulate → worse steatosis and IR'],
          ['n', 'Lipodystrophy; Fsp27⁻/⁻', 'Severe IR with little or no adipose inflammation'],
          ['n', 'Adipose Rictor KO', 'Adipose IR **causes** inflammation (MCP-1, macrophages)'],
          ['n', 'T2D genetics', 'Risk variants not enriched in immune cells (unlike autoimmune diseases)'],
          ['n', 'TNF-α blockers in humans', 'No consistent insulin sensitization'],
          ['m', 'Salsalate · amlexanox', 'Modest glucose lowering — via AMPK/uncoupling or energy expenditure & ↓ IHTG'],
        ])));
      b.appendChild(IRV.fig('VII-B', 'Branched-chain amino acids: cause or marker?', 'High plasma BCAAs predict T2D. Three ideas — switch between them.',
        EP.flow({
          w: 940, h: 300,
          nodes: [
            N('bcaa', 140, 60, 'Plasma BCAA ↑\n(Val · Leu · Ile)', 'metab'), N('mtor', 400, 60, 'Leucine → mTORC1 → S6K1', 'kinase'), N('irs', 650, 60, 'IRS1 Ser-P', 'kinase'),
            N('hib', 400, 145, 'Valine → 3-HIB', 'metab', { info: '3-hydroxyisobutyrate is secreted by muscle and drives trans-endothelial fatty-acid transport. 3-HIB in drinking water → muscle DAG/PKCθ and glucose intolerance; ↑ in db/db and T2D muscle.' }),
            N('fau', 650, 145, 'Muscle FA uptake ↑ → DAG/PKCθ', 'lipid'), N('ir', 860, 145, 'Insulin\nresistance', 'bad'),
            N('enz', 140, 235, 'Adipose BCAA catabolic\nenzymes ↓', 'enzyme'), N('store', 420, 235, 'Less adipose lipogenesis\n(BCAA ≈ 30% of acetyl-CoA)', 'process'), N('ect', 680, 235, 'Ectopic lipid', 'lipid'),
          ],
          edges: [E('bcaa', 'mtor'), E('mtor', 'irs', 'act', 'feedback'), E('irs', 'ir', 'bad'), E('bcaa', 'hib', 'act', null, { via: [[260, 145]] }), E('hib', 'fau'), E('fau', 'ir', 'bad'),
            E('enz', 'bcaa', 'act', 'less breakdown'), E('enz', 'store', 'bad'), E('store', 'ect', 'bad'), E('ect', 'ir', 'bad'), E('ir', 'enz', 'fb', 'consequence?', { via: [[900, 290], [140, 290]] })],
          states: [
            { id: 'a', label: '① mTORC1 feedback', n: { hib: { c: 'off' }, fau: { c: 'off' }, enz: { c: 'off' }, store: { c: 'off' }, ect: { c: 'off' } }, e: { 'ir>enz': 'off' }, cap: 'Leucine → mTORC1/S6K1 → IRS1 Ser-P. Rapamycin reversed IR in HFD + BCAA rats. But BCAA alone don\'t cause IR on chow, and **BCATm⁻/⁻** mice (very high BCAA) are protected.' },
            { id: 'b', label: '② 3-HIB → muscle fat', n: { mtor: { c: 'off' }, irs: { c: 'off' }, enz: { c: 'off' }, store: { c: 'off' }, ect: { c: 'off' } }, e: { 'ir>enz': 'off' }, cap: 'A valine catabolite pushes fatty acids into muscle → DAG/PKCθ: links BCAAs to lipid-induced IR.' },
            { id: 'c', label: '③ A consequence of IR', n: { mtor: { c: 'off' }, irs: { c: 'off' }, hib: { c: 'off' }, fau: { c: 'off' } }, cap: 'Genetics: IR risk alleles raise BCAA, but BCAA-raising alleles don\'t raise HOMA-IR. Adipose BCAA catabolism falls in obesity → less fat storage → ectopic lipid (attractive, untested).' },
          ],
        })));
      b.appendChild(IRV.fig('VII-C', 'Adipokines and hepatokines', 'Four hormones with real human relevance. Most act by shifting lipid around.',
        EP.flow({
          w: 940, h: 300,
          nodes: [
            N('wat', 80, 90, 'White adipose', 'organ'), N('liv', 80, 230, 'Liver', 'organ'),
            N('rbp4', 300, 40, 'RBP4 ↑', 'hormone'), N('adipo', 300, 110, 'Adiponectin ↓ (mildly)', 'hormone'), N('feta', 300, 190, 'Fetuin-A ↑', 'hormone'), N('fgf', 300, 260, 'FGF21 ↑ (resistance)', 'hormone'),
            N('e1', 680, 40, 'Activates ATMs; liver lipogenesis', 'process'), N('e2', 680, 110, 'Normally: AdipoR1/2 ceramidase → ceramide ↓, less liver fat', 'process'),
            N('e3', 680, 190, 'Inhibits INSR kinase; carries SFA → TLR4 → cytokines', 'process'), N('e4', 680, 260, 'Drug doses: ↑ fat oxidation & energy use; plasma lipid ↓', 'process'),
          ],
          edges: [E('wat', 'rbp4', 'endo'), E('liv', 'rbp4', 'endo', null, { col: 'var(--faint)' }), E('wat', 'adipo', 'endo'), E('liv', 'feta', 'endo'), E('liv', 'fgf', 'endo'), E('rbp4', 'e1'), E('adipo', 'e2'), E('feta', 'e3'), E('fgf', 'e4')],
        }),
        IRV.cards([
          { t: 'RBP4', p: 'Found via adipose GLUT4 models. ~2× higher in obesity; tracks clamp IR in 3 cohorts and falls with exercise. Mouse plasma RBP4 is mostly from liver.', v: ['m', 'likely acts via inflammation → lipolysis'] },
          { t: 'Adiponectin', p: 'Ad-Tg ob/ob mice: 2× heavier, normal sensitivity; acute deletion → hepatic IR in 2 wk. But lean T2D offspring have normal levels; AMPK not required.', v: ['m', 'good biomarker; AdipoR agonists promising'] },
          { t: 'Fetuin-A', p: 'Fetuin-A KO mice protected. Interacts with NEFA to predict IGT. Tlr4⁻/⁻ results mixed (protected only in some studies).', v: ['m', 'direct INSR inhibition may suffice'] },
          { t: 'FGF21', p: 'Drugs improve sensitivity (less ectopic fat). Humans raise FGF21 only after ~10 days of fasting; obesity is FGF21-resistant. Osteopenia limits use.', v: ['m', 'pharmacology > physiology'] },
        ])));
    },
  });
  function hfdTimeline() {
    const W = 880, svg = s('svg', { class: 'irv-mini', viewBox: `0 0 ${W} 120` });
    const X = (d) => 110 + Math.log(d / 3) / Math.log(84 / 3) * (W - 220);
    svg.appendChild(s('line', { x1: 40, x2: W - 40, y1: 60, y2: 60, style: 'stroke:var(--line);stroke-width:3' }));
    const ev = [[3, 'Liver + adipose IR (rats)', 'var(--dn)', -1], [7, 'Adipose IR (mice)', 'var(--dn)', 1], [28, 'Macrophages still minimal', 'var(--muted)', -1], [84, 'Macrophage infiltration prominent', 'var(--tr3)', 1]];
    ev.forEach(([d, l, c, up]) => {
      svg.appendChild(s('circle', { cx: X(d), cy: 60, r: 7, style: `fill:${c}` }));
      svg.appendChild(s('text', { x: X(d), y: up < 0 ? 36 : 92, 'text-anchor': 'middle', style: `font-size:12px;font-weight:700;fill:${c}` }, l));
      svg.appendChild(s('text', { x: X(d), y: up < 0 ? 20 : 108, 'text-anchor': 'middle', style: 'font-size:11px;fill:var(--muted)' }, d < 7 ? d + ' days' : d === 7 ? '1 week' : Math.round(d / 7) + ' weeks'));
    });
    return h('div', svg, IRV.cap('Adipose insulin resistance comes **weeks before** macrophages pile up → inflammation is an amplifier, not the trigger.'));
  }

  // ================================================================== VIII. SUMMARY
  IRV.chapter({
    rn: 'VIII', id: 'summary', col: 'var(--accent2)', title: 'The unified model', tile: 'Everything converges on ectopic lipid',
    sub: 'Nutrient excess → fat-cell IR and lipolysis → ectopic lipid + metabolite-driven gluconeogenesis (Fig. 19).',
    build(b) {
      b.appendChild(IRV.fig('Fig. 19', 'An integrated picture of insulin resistance', 'Chronic overnutrition acts **inside** cells (ectopic lipid → DAG/nPKC) and **between** tissues (fat → liver via NEFA, glycerol and acetyl-CoA).',
        EP.flow({
          w: 940, h: 480,
          zones: [{ x: 10, y: 50, w: 300, h: 420, label: 'White adipose', col: 'var(--m-fat)' }, { x: 325, y: 50, w: 605, h: 205, label: 'Liver', col: 'var(--tr0)' }, { x: 325, y: 270, w: 605, h: 200, label: 'Skeletal muscle', col: 'var(--tr3)' }],
          nodes: [
            N('over', 160, 22, 'Chronic overnutrition', 'bad'),
            N('stress', 160, 95, 'Nutrient stress →\nadipose IR', 'bad'), N('death', 90, 170, 'Adipocyte death', 'bad'), N('rbp4', 235, 170, 'RBP4', 'hormone'),
            N('mac', 160, 235, 'Macrophage infiltration', 'immune'), N('jnk', 160, 300, 'JNK → TNF-α, IL-1β', 'immune'),
            N('lipo', 160, 365, 'Lipolysis ↑', 'process'), N('out', 160, 435, 'NEFA + glycerol', 'lipid'),
            N('box', 420, 95, 'β-oxidation →\nacetyl-CoA', 'metab'), N('pc', 600, 95, 'Pyruvate carboxylase', 'enzyme'), N('gng', 790, 95, 'Gluconeogenesis ↑', 'process'),
            N('gly', 600, 160, 'Glycerol → glucose', 'glc'),
            N('ihtg', 420, 220, 'IHTG → DAG/PKCε', 'lipid'), N('hir', 630, 220, 'Hepatic IR: glycogen synthesis ↓', 'bad'), N('hgp', 850, 175, 'HGP ↑', 'glc'),
            N('pg', 860, 262, 'Plasma glucose ↑', 'glc'),
            N('imcl', 420, 330, 'IMCL → DAG/PKCθ', 'lipid'), N('mir', 660, 330, 'Muscle IR: glucose transport ↓,\nglycogen synthesis ↓', 'bad'),
            N('dnl', 660, 425, 'Glucose diverted to liver → DNL', 'process'),
          ],
          edges: [
            E('over', 'stress', 'bad'), E('stress', 'death', 'bad'), E('death', 'mac'), E('rbp4', 'mac'), E('mac', 'jnk'), E('jnk', 'lipo'), E('stress', 'lipo', 'act', null, { via: [[290, 95], [290, 365]] }), E('lipo', 'out', 'flow'),
            E('out', 'box', 'flow', null, { anim: true, via: [[320, 435], [320, 95]] }), E('out', 'gly', 'flow', null, { anim: true, via: [[320, 435], [320, 160]] }), E('out', 'ihtg', 'flow', null, { anim: true, via: [[320, 435], [320, 220]] }), E('out', 'imcl', 'flow', null, { anim: true, via: [[320, 435], [320, 330]] }),
            E('box', 'pc', 'act', '+'), E('pc', 'gng'), E('gly', 'gng', 'flow'), E('gng', 'hgp', 'flow'), E('ihtg', 'hir', 'bad'), E('hir', 'hgp', 'bad'), E('hgp', 'pg', 'flow'),
            E('imcl', 'mir', 'bad'), E('mir', 'pg', 'bad', 'less disposal', { lo: [-56, 6] }), E('mir', 'dnl', 'flow'), E('dnl', 'ihtg', 'flow', null, { via: [[505, 425], [505, 250]] }),
          ],
          steps: [
            { n: ['over', 'stress', 'lipo'], cap: 'Overnutrition stresses adipocytes → **adipose IR** → lipolysis not suppressed.' },
            { n: ['stress', 'death', 'rbp4', 'mac', 'jnk', 'lipo'], cap: 'Later: dead adipocytes, RBP4 → macrophages → JNK, TNF-α, IL-1β → **even more lipolysis**.' },
            { n: ['lipo', 'out', 'box', 'pc', 'gng', 'gly', 'hgp'], cap: 'NEFA → hepatic **acetyl-CoA → pyruvate carboxylase**; glycerol → glucose: gluconeogenesis ↑ (indirect).' },
            { n: ['out', 'ihtg', 'hir', 'hgp', 'pg'], cap: 'Liver fat → DAG/PKCε → **hepatic IR** (less glycogen synthesis) → glucose output ↑.' },
            { n: ['out', 'imcl', 'mir', 'pg'], cap: 'Muscle fat → DAG/PKCθ → **muscle IR** → less glucose disposal.' },
            { n: ['mir', 'dnl', 'ihtg'], cap: 'Glucose not taken up by muscle goes to the liver → **DNL** → more liver fat. A loop.' },
          ],
          states: [
            { id: 'all', label: 'Whole model' },
            { id: 'hum', label: '🧑 Order in humans', n: { mir: { b: '1st' }, dnl: { b: '2nd' }, ihtg: { b: '3rd' }, hir: { b: '3rd' }, stress: { b: '?' } }, cap: '**Humans:** muscle IR comes first — lean, young offspring of T2D parents have muscle IR with normal liver fat. Liver follows via diverted glucose → DNL. Where adipose IR fits is uncertain.' },
            { id: 'rod', label: '🐀 Order in rodents', n: { hir: { b: '1st' }, ihtg: { b: '1st' }, stress: { b: '1st' }, mac: { b: '2nd' }, mir: { b: '3rd' } }, cap: '**Rodents:** a few days of HFD → fatty liver & hepatic IR (adipose IR too); fat inflames over weeks; muscle IR needs weeks.' },
          ],
        })));
      b.appendChild(IRV.fig('VIII', 'Every proposed cause traces back to nutrient excess', 'They either make toxic metabolites, overload organelles, or respond to nutrient damage — and converge on two final paths.',
        EP.flow({
          w: 940, h: 300,
          nodes: [
            N('m1', 190, 30, 'Bioactive lipids: DAG · ceramide · acylcarnitine', 'lipid'), N('m2', 190, 80, 'BCAA catabolites', 'metab'), N('m3', 190, 130, 'ER stress', 'enzyme'),
            N('m4', 190, 180, 'Mitochondrial / oxidative stress', 'enzyme'), N('m5', 190, 230, 'Inflammation', 'immune'), N('m6', 190, 280, 'Adipokines / hepatokines', 'hormone'),
            N('p1', 540, 90, 'Ectopic lipid in liver & muscle\n(DAG → nPKC)', 'lipid'), N('p2', 540, 220, 'Metabolite-driven gluconeogenesis\n(acetyl-CoA · glycerol)', 'process'),
            N('out', 830, 155, 'Insulin resistance\n+ hyperglycemia', 'bad'),
          ],
          edges: [E('m1', 'p1'), E('m2', 'p1', 'act', null, { col: 'var(--faint)' }), E('m3', 'p1', 'act', 'lipogenesis', { lo: [-30, 0] }), E('m4', 'p1', 'act', 'storage', { lo: [-30, 20] }), E('m5', 'p2', 'act', 'lipolysis', { lo: [-10, 14] }), E('m5', 'p1', 'act', null, { col: 'var(--faint)' }), E('m6', 'p1', 'act', null, { col: 'var(--faint)' }), E('p1', 'out', 'bad'), E('p2', 'out', 'bad')],
        }),
        IRV.evidence()));
      b.appendChild(IRV.fig('VIII', 'Test case: 3 days of very-low-calorie diet', 'In T2D rats, 25% of normal calories for 3 days nearly normalized glucose and insulin **without weight loss**. What changed tells us what matters.',
        h('div.irv-two',
          h('div', h('h4', 'Changed'), IRV.chipRow([['y', 'Liver fat ↓'], ['y', 'Hepatic acetyl-CoA ↓'], ['y', 'Membrane DAG ↓'], ['y', 'PKCε activation ↓'], ['y', 'AKT activation ↑'], ['y', 'HGP suppression ↑']])),
          h('div', h('h4', 'Did not change'), IRV.chipRow([['n', 'Ceramides'], ['n', 'Glucagon'], ['n', 'Inflammatory cytokines'], ['n', 'FGF21'], ['n', 'BCAAs'], ['n', 'ER stress markers']]))),
        IRV.pts([['💉', 'Acetate infusion (keeps acetyl-CoA up) **abolished** the benefit → indirect, metabolite-driven gluconeogenesis.'], ['💊', 'A glycogen phosphorylase inhibitor **recapitulated** it → direct, glycogen arm.'], ['🎯', 'Incriminates **DAG–PKCε** and **acetyl-CoA-driven gluconeogenesis**.']])));
      b.appendChild(IRV.fig('VIII', 'Why would insulin resistance exist at all?', 'Possibly an adaptation; maladaptive only under constant overnutrition.',
        IRV.cards([
          { t: '🛡️ Cell self-protection', p: 'Limit glucose use and anabolism when the cell is already overloaded (like the ER stress response).' },
          { t: '🏦 Send fuel to fat', p: 'Shut storage in muscle/liver so calories go to WAT. Flaw: WAT becomes insulin-resistant too.' },
          { t: '🌙 Fasting adaptation', p: 'Fasting → liver & muscle lipid ↑ → IR saves glucose for the brain. Starved rat liver: DAG ↑, PKC on, IRK ↓. Fasting causes muscle IR in humans.' },
          { t: '🐟 Cavefish', p: 'Nutrient-poor cave populations of Mexican tetra carry an INSR loss-of-function variant: insulin-resistant, fatter, survive starvation better.' },
          { t: '⚙️ Hijacked feedback', p: 'Pathological kinases (nPKCs) may co-opt normal negative-feedback sites (like S6K1\'s) — never selected against because constant surplus was rare.' },
        ])));
    },
  });
})();
