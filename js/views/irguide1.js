/* Visual guide to Petersen & Shulman 2018 — Sections I–IV (normal insulin action → what fails).
 * Diagrams are EP.flow specs; numbers and claims follow the review (figure numbers in the tags). */
(function () {
  'use strict';
  const EP = window.EP;
  const { h } = EP;
  const IRV = EP.irv;
  const N = (id, x, y, label, k, o) => Object.assign({ id, x, y, label, k: k || 'kinase' }, o || {});
  const E = (f, t, k, label, o) => Object.assign({ f, t, k: k || 'act', label }, o || {});

  // ================================================================== I. INTRODUCTION
  IRV.chapter({
    rn: 'I', id: 'intro', col: 'var(--tr5)', title: 'The big picture', tile: 'Three target tissues, direct vs indirect action',
    sub: 'What insulin does in muscle, liver and fat, and how the review is organised.',
    build(b) {
      b.appendChild(IRV.fig('Overview', 'One hormone, three tissues, two ways of acting',
        'Insulin acts **directly** on muscle, liver and fat, and **indirectly** through cross-talk between them, mainly fat → liver.',
        EP.flow({
          w: 920, h: 384,
          zones: [
            { x: 20, y: 118, w: 280, h: 256, label: 'Skeletal muscle', col: 'var(--tr3)' },
            { x: 320, y: 118, w: 280, h: 256, label: 'Liver', col: 'var(--tr0)' },
            { x: 620, y: 118, w: 280, h: 256, label: 'White adipose tissue', col: 'var(--m-fat)' },
          ],
          nodes: [
            N('alpha', 120, 38, 'α-cell: glucagon ↓', 'organ', { info: 'Insulin from β-cells suppresses glucagon release next door in the islet (paracrine). See Section III.' }),
            N('beta', 300, 38, 'β-cell', 'organ'),
            N('ins', 460, 38, 'Insulin', 'hormone', { info: 'Secreted into the portal vein, so the liver sees 2–3× the insulin level measured in a peripheral vein.' }),
            N('brain', 740, 38, 'Brain: appetite ↓ (liver? debated)', 'organ', { info: 'Insulin crosses the blood–brain barrier by transcytosis and suppresses appetite. Effects of brain insulin on liver glucose output are seen in rodents but not in dogs with physiological insulin (Section III-D).' }),
            N('rm', 160, 152, 'INSR', 'receptor'), N('rl', 460, 152, 'INSR', 'receptor'), N('rw', 760, 152, 'INSR', 'receptor'),
            N('m1', 160, 200, 'GLUT4 → glucose uptake', 'process'), N('m2', 160, 240, 'Net glycogen synthesis', 'process'), N('m3', 160, 280, 'Glycolysis / oxidation', 'process'),
            N('m4', 160, 322, 'lactate & alanine → liver', 'note'),
            N('l1', 460, 200, 'Net glycogen synthesis', 'process'), N('l3', 460, 240, '↓ G6PC/PCK1 genes (slow)', 'process'), N('l4', 460, 280, '↑ Lipogenesis — DNL (slow)', 'process', { info: 'Insulin switches on the lipogenic genes, but **de novo lipogenesis is a small source of liver fat** (~10% of liver TG output in healthy people, ~25% in NAFLD). Most liver fat comes from re-esterified plasma fatty acids.' }),
            N('l2', 460, 322, '↓ Gluconeogenesis (fast)', 'process', { info: 'The fast fall in gluconeogenesis is mostly an **indirect** effect, routed through fat (Section III).' }),
            N('w2', 760, 200, 'Glucose uptake', 'process'), N('w3', 760, 240, 'Fat storage (esterification)', 'process'), N('w4', 760, 280, 'Adipogenesis (PPARγ)', 'process'),
            N('w1', 760, 322, '⊣ Lipolysis — most sensitive', 'process', { info: 'Half-maximal suppression of lipolysis at ~20 µU/mL insulin vs ~60 µU/mL for whole-body glucose uptake.' }),
          ],
          edges: [
            E('beta', 'ins', 'act', 'secretes'), E('ins', 'alpha', 'inh', 'paracrine', { fp: [440, 25], via: [[440, 14], [120, 14]], lo: [0, -3] }), E('ins', 'brain', 'move', 'crosses BBB'),
            E('ins', 'rm', 'endo'), E('ins', 'rl', 'endo', 'portal: 2–3× higher', { lo: [58, 0] }), E('ins', 'rw', 'endo'),
            E('w1', 'l2', 'flow', 'less NEFA + glycerol = INDIRECT', { anim: true, lo: [0, 26] }),
          ],
          steps: [
            { n: ['beta', 'ins', 'rl'], cap: 'β-cells release insulin into the **portal vein** — the liver sees 2–3× more than other tissues.' },
            { n: ['ins', 'rm', 'm1', 'm2', 'm3', 'm4'], e: ['ins>rm'], cap: '**Muscle:** take up glucose (GLUT4) and store it as glycogen.' },
            { n: ['ins', 'rl', 'l1', 'l3', 'l4'], e: ['ins>rl'], cap: '**Liver:** switch from glucose output to storage; slower gene changes (gluconeogenic ↓, lipogenic ↑).' },
            { n: ['ins', 'rw', 'w1', 'w2', 'w3', 'w4'], e: ['ins>rw'], cap: '**Fat:** stop lipolysis (its most sensitive action) and store fat.' },
            { n: ['w1', 'l2'], cap: '**Indirect action:** less lipolysis → less fatty acid & glycerol reach liver → gluconeogenesis falls.' },
            { n: ['ins', 'alpha', 'brain'], cap: 'Other indirect routes: islet α-cells (glucagon ↓) and the brain.' },
          ],
        }),
        IRV.pts([
          ['📈', '**Insulin resistance** = more insulin needed for the same effect. It is the **best predictor** of future T2D.'],
          ['🧬', 'Insulin controls **metabolic flux**; IGF-1/2 drive **growth**. Their receptors are similar and form hybrids (hyperinsulinemia ↔ cancer link).'],
          ['🩺', 'High fasting insulin accompanies prediabetes, lipodystrophy, PCOS and NAFLD.'],
          ['🍔', 'Driver: cheap, dense, palatable food → obesity. US diabetes + prediabetes > 50%.'],
        ])));
      b.appendChild(IRV.fig('Roadmap', 'How the review builds its argument', 'First normal insulin action, then what fails, then candidate causes, then one unifying model.',
        EP.flow({
          w: 920, h: 170, minW: 640,
          nodes: [
            N('a', 90, 50, 'II · Direct action\n(cell-autonomous)', 'process'), N('b', 90, 124, 'III · Indirect action\n(tissue cross-talk)', 'process'),
            N('c', 300, 87, 'IV · What fails in\ninsulin resistance', 'bad'),
            N('d', 520, 34, 'V · Bioactive lipids\nDAG · ceramide · acylcarnitine', 'lipid'), N('e', 520, 87, 'VI · Organelle stress\nER · mitochondria', 'enzyme'), N('f', 520, 140, 'VII · Cross-talk\ninflammation · BCAA · adipokines', 'immune'),
            N('g', 760, 87, 'VIII · Unified model:\nnutrient excess → ectopic lipid\n+ metabolite-driven gluconeogenesis', 'hormone'),
          ],
          edges: [E('a', 'c', 'plain'), E('b', 'c', 'plain'), E('c', 'd', 'plain'), E('c', 'e', 'plain'), E('c', 'f', 'plain'), E('d', 'g', 'plain'), E('e', 'g', 'plain'), E('f', 'g', 'plain')],
        })));
    },
  });

  // ================================================================== II. DIRECT INSULIN ACTION
  IRV.chapter({
    rn: 'II', id: 'direct', col: 'var(--tr1)', title: 'Direct insulin action', tile: 'Receptor → AKT, then muscle, liver and fat',
    sub: 'Shared receptor machinery, then different downstream effectors in each tissue (Figs. 1–5).',
    build(b) {
      // ---------- A. proximal signaling (Fig. 1)
      b.appendChild(IRV.fig('Fig. 1 · II-A', 'Proximal signaling: the receptor and its scaffolds',
        'Same in every cell: INSR → IRS → PI3K → PIP3 → AKT. The tissue differences come **after** AKT.',
        EP.flow({
          w: 920, h: 520,
          zones: [
            { x: 10, y: 62, w: 900, h: 50, kind: 'membrane', label: 'Membrane', lx: 18, ly: 106 },
            { x: 10, y: 118, w: 900, h: 394, label: 'Cytosol' },
          ],
          groups: { mito: { label: 'Mitogenic arm', open: false, x: 790, y: 210 }, fb: { label: 'Feedback loops', open: false, x: 680, y: 300 } },
          nodes: [
            N('ins', 460, 30, 'Insulin', 'hormone', { info: 'At physiological levels **one insulin binds one receptor** — binding at one site lowers affinity at the other (negative cooperativity).' }),
            N('insr', 460, 87, 'INSR (α₂β₂) · pTyr1162 → 1158 → 1163', 'receptor', { info: 'Binding relieves autoinhibition; β-subunits trans-autophosphorylate the activation loop (Tyr1162, 1158, 1163 in that order), then Tyr972, which docks substrates. **INSR-B** (liver, muscle, fat) does the metabolic work; **INSR-A** (exon 11 spliced out) dominates in the fetus and binds IGF-2.' }),
            N('cea', 190, 87, 'CEACAM1', 'kinase', { g: 'fb', info: 'An INSR substrate that drives receptor **internalization** — slow attenuation.' }),
            N('grb10', 745, 87, 'GRB10', 'kinase', { g: 'fb', info: 'Binds the phosphorylated activation loop and **inhibits INSR**. mTORC1 stabilises it → negative feedback. Muscle Grb10 knockout → more insulin-sensitive, larger muscles.' }),
            N('aps', 170, 165, 'SH2B2 / APS', 'kinase', { info: 'Helps start the metabolic response in some cells (e.g. the PI3K-independent TC10 route in adipocytes, Fig. 5).' }),
            N('irs', 345, 165, 'IRS1 / IRS2', 'kinase', { info: 'Dock on INSR pTyr972 (PTB domain) and get tyrosine-phosphorylated. >70 Ser/Thr sites tune them — the target of feedback and of many proposed IR mechanisms. Losing **both** IRS1 and IRS2 in muscle or liver = losing INSR.' }),
            N('giv', 530, 165, 'GIV / Girdin', 'kinase', { info: 'INSR tyrosine-phosphorylates GIV, which **amplifies** PI3K–AKT (feed-forward). PKCθ can switch it off (Ser1689; Section V).' }),
            N('shc', 790, 165, 'SHC · GRB2', 'kinase', { g: 'mito' }),
            N('mapk', 790, 250, 'Ras → MAPK\ngrowth / mitogenic', 'process', { g: 'mito', info: 'Needs **higher** insulin than the metabolic arm (the reverse of IGF-1R). Stays normal in obese/T2D muscle.' }),
            N('nox4', 85, 250, 'NOX4 → H₂O₂', 'enzyme', { g: 'fb', info: 'INSR activates NOX4; the local H₂O₂ inhibits PTP1B and PTEN → **feed-forward** boost early in signaling.' }),
            N('ptp1b', 215, 250, 'PTP1B', 'enzyme', { g: 'fb', info: 'Tyrosine phosphatase that dephosphorylates INSR — mostly later, after internalization.' }),
            N('pi3k', 345, 250, 'PI3K (p85 · p110)', 'kinase', { info: 'IRS pYXXM motifs recruit the p85 regulatory subunit. Essential: PI3K inhibition abolishes insulin-stimulated glucose transport.' }),
            N('pten', 150, 330, 'PTEN', 'enzyme', { info: 'Turns PIP3 back into PIP2. Insulin inhibits PTEN, so PIP3 builds up. Deleting PTEN in adipocytes → profound insulin sensitivity.' }),
            N('pip3', 345, 330, 'PIP2 → PIP3', 'metab'),
            N('pdk1', 230, 410, 'PDK1', 'kinase'), N('mtorc2', 460, 410, 'mTORC2', 'kinase'),
            N('akt', 345, 482, 'AKT · pThr308 + pSer473', 'kinase', { info: 'Hub kinase. **Ser473** is the most popular readout, yet how insulin drives it is unclear (partly IRS-independent) and many nutrients feed into it. A partial loss-of-function AKT2 variant (~1% of Finns) causes insulin resistance.' }),
            N('out', 720, 482, 'Tissue-specific effects →', 'process'),
            N('mtorc1', 640, 445, 'mTORC1 → S6K1', 'kinase', { g: 'fb', info: 'Downstream of AKT (and amino acids). **S6K1 phosphorylates IRS1** on Ser (↓ activity, ↑ degradation) and mTORC1 **stabilises GRB10** → negative feedback.' }),
          ],
          edges: [
            E('ins', 'insr', 'act', 'binds'), E('insr', 'irs', 'act', 'pTyr972', { lo: [-18, -2] }), E('insr', 'aps', 'act'), E('insr', 'giv', 'act'),
            E('insr', 'shc', 'act', null, { g: 'mito' }), E('shc', 'mapk', 'act', null, { g: 'mito' }),
            E('irs', 'pi3k', 'act', 'pYXXM', { lo: [26, 4] }), E('giv', 'pi3k', 'fbpos', 'amplifies'),
            E('pi3k', 'pip3', 'act'), E('pten', 'pip3', 'inh'), E('pip3', 'pdk1', 'act'), E('pip3', 'akt', 'act', 'recruits', { lo: [26, 30] }),
            E('pdk1', 'akt', 'act', 'Thr308', { lo: [-26, 0] }), E('mtorc2', 'akt', 'act', 'Ser473', { lo: [26, 0] }), E('akt', 'out', 'act'),
            E('insr', 'nox4', 'act', null, { g: 'fb' }), E('nox4', 'ptp1b', 'inh', null, { g: 'fb' }), E('ptp1b', 'insr', 'fb', 'dephos', { g: 'fb', via: [[250, 128]] }),
            E('cea', 'insr', 'fb', 'internalize', { g: 'fb' }), E('grb10', 'insr', 'fb', null, { g: 'fb' }),
            E('akt', 'mtorc1', 'act', null, { g: 'fb' }), E('mtorc1', 'irs', 'fb', 'S6K1 Ser-P', { g: 'fb', via: [[640, 208], [420, 208]] }), E('mtorc1', 'grb10', 'act', 'stabilises', { g: 'fb', lo: [-44, 60] }),
          ],
          steps: [
            { n: ['ins', 'insr'], cap: 'Insulin binds INSR — **one insulin per receptor**.' },
            { n: ['insr'], cap: 'Trans-autophosphorylation: **Tyr1162 → 1158 → 1163**, then Tyr972 for docking.' },
            { n: ['insr', 'irs', 'aps', 'giv', 'shc'], open: ['mito'], cap: 'INSR recruits **scaffolds** (it does not phosphorylate effectors directly) → early branching.' },
            { n: ['irs', 'pi3k', 'pip3', 'pten'], cap: 'IRS → PI3K makes **PIP3**; PTEN removes it (insulin inhibits PTEN).' },
            { n: ['pip3', 'pdk1', 'mtorc2', 'akt'], cap: 'PIP3 recruits PDK1 and AKT: **Thr308** (PDK1) + **Ser473** (mTORC2) activate AKT.' },
            { n: ['akt', 'out'], cap: 'AKT is the hub; tissue-specific effectors sit downstream.' },
            { n: ['mtorc1', 'grb10', 'cea', 'ptp1b', 'irs', 'insr', 'akt'], open: ['fb'], cap: '**Brakes:** S6K1 → IRS1 Ser-P, GRB10, internalization, PTP1B.' },
            { n: ['nox4', 'ptp1b', 'giv', 'pi3k', 'insr'], open: ['fb'], cap: '**Boosters:** NOX4-H₂O₂ inhibits PTP1B; GIV amplifies PI3K.' },
            { n: ['shc', 'mapk', 'insr'], open: ['mito'], cap: 'Mitogenic arm (SHC/GRB2 → MAPK) needs **more insulin** than the metabolic arm.' },
          ],
        })));

      // ---------- B. muscle (Fig. 2)
      b.appendChild(IRV.fig('Fig. 2 · II-B', 'Skeletal muscle: get glucose in, store it as glycogen',
        'Insulin **releases the brakes** on GLUT4 vesicles; glucose-6-phosphate then **switches on** glycogen synthase.',
        EP.flow({
          w: 930, h: 500,
          zones: [
            { x: 10, y: 60, w: 910, h: 38, kind: 'membrane', label: 'Sarcolemma', lx: 470, ly: 84, anchor: 'middle' },
            { x: 10, y: 102, w: 910, h: 390, label: 'Myocyte' },
          ],
          groups: { glut: { label: 'GLUT4 translocation', x: 470, y: 185 }, glyc: { label: 'Glycogen synthesis', x: 520, y: 395 } },
          nodes: [
            N('ins', 110, 28, 'Insulin', 'hormone'), N('insr', 110, 79, 'INSR', 'receptor', { info: 'Muscle INSR knockout (MIRKO) mice lose insulin-stimulated glucose uptake and glycogen synthesis.' }),
            N('irs1', 110, 140, 'IRS1', 'kinase', { info: 'IRS1 (not IRS2) is the main substrate in muscle: knocking down IRS1, not IRS2, blocks glucose transport.' }),
            N('pi3k', 110, 205, 'PI3K', 'kinase', { info: 'Wortmannin abolishes insulin-stimulated uptake; deleting p85 subunits impairs (but does not abolish) it.' }),
            N('akt2', 110, 275, 'AKT2', 'kinase', { info: 'AKT2, not AKT1: Akt2⁻/⁻ mice are severely glucose-intolerant; AKT2 knockdown abolishes uptake in human myotubes.' }),
            N('rac1', 290, 150, 'RAC1 → PAK', 'kinase', { g: 'glut', info: 'Second PI3K route: RAC1-GTP → PAK → **cortical actin remodelling**. Muscle RAC1 knockout blocks uptake even with normal AKT; active RAC1 moves GLUT4 without insulin.' }),
            N('actin', 470, 150, 'Cortical actin\nremodelling', 'process', { g: 'glut' }),
            N('as160', 290, 220, 'AS160 / TBC1D4\n(+ TBC1D1)', 'kinase', { g: 'glut', info: 'A Rab-GAP that keeps Rabs OFF. AKT phosphorylation (**Thr649**) stops it — insulin "releases the brake". Thr649Ala knock-in mice are glucose-intolerant; a human TBC1D4 truncation causes severe IR; Tbc1d1/Tbc1d4 double KO abolishes uptake.' }),
            N('rab', 470, 220, 'Rab-GTP\n(RAB8 · 10 · 14)', 'kinase', { g: 'glut' }),
            N('gsv', 640, 185, 'GLUT4 vesicle (GSV)', 'transporter', { g: 'glut' }),
            N('glcO', 660, 28, 'Glucose', 'glc'), N('glut4', 790, 79, 'GLUT4', 'transporter'),
            N('g6p', 790, 290, 'Glucose-6-P', 'glc', { info: 'Hexokinase II (transcription slowly ↑ by insulin) traps glucose as G6P. G6P is the key **allosteric** switch for glycogen metabolism.' }),
            N('glycol', 870, 205, 'Glycolysis\n~25%', 'process', { g: 'glyc', info: 'In fasted rat soleus, insulin raises the share of oxidation from glucose from ~5% to ~60%.' }),
            N('gsk3', 290, 320, 'GSK3α/β', 'kinase', { g: 'glyc', info: 'AKT inactivates GSK3 (Ser21/9). But knock-in mice with insulin-insensitive GSK3 store glycogen normally → GSK3 is **not** the main switch.' }),
            N('pp1', 290, 385, 'PP1 · G_M', 'enzyme', { g: 'glyc', info: 'Glycogen-targeted protein phosphatase-1 (muscle G_M subunit) dephosphorylates GS (activates) and phosphorylase (inactivates). Mechanism of insulin activation unclear.' }),
            N('phk', 290, 452, 'Phosphorylase kinase', 'kinase', { g: 'glyc' }),
            N('gs', 540, 345, 'Glycogen synthase', 'enzyme', { g: 'glyc', info: 'Mice with GS that **cannot sense G6P** have badly impaired insulin-stimulated glycogen synthesis → **allostery dominates**. Dephosphorylation mostly raises GS sensitivity to G6P.' }),
            N('gp', 540, 440, 'Glycogen phosphorylase', 'enzyme', { g: 'glyc' }),
            N('glycogen', 790, 400, 'Glycogen  ~75%', 'glc', { g: 'glyc', info: 'Glycogen synthesis takes ~75% of insulin-stimulated glucose in both healthy and T2D muscle (¹³C-MRS).' }),
          ],
          edges: [
            E('ins', 'insr'), E('insr', 'irs1'), E('irs1', 'pi3k'), E('pi3k', 'akt2'),
            E('pi3k', 'rac1', 'act', null, { g: 'glut' }), E('rac1', 'actin', 'act', null, { g: 'glut' }), E('actin', 'gsv', 'act', null, { g: 'glut' }),
            E('akt2', 'as160', 'inh', 'pThr649', { g: 'glut', via: [[195, 275], [195, 220]] }), E('as160', 'rab', 'inh', 'GAP', { g: 'glut' }), E('rab', 'gsv', 'act', null, { g: 'glut' }),
            E('gsv', 'glut4', 'move', 'translocate + fuse', { lo: [52, 0] }), E('glcO', 'glut4', 'flow', null, { anim: true }), E('glut4', 'g6p', 'flow', 'hexokinase II', { anim: true, lo: [44, 0] }),
            E('g6p', 'glycol', 'flow', null, { g: 'glyc' }),
            E('akt2', 'gsk3', 'inh', 'Ser21/9', { g: 'glyc', via: [[195, 275], [195, 320]] }), E('gsk3', 'gs', 'inh', null, { g: 'glyc' }), E('akt2', 'pp1', 'act', null, { g: 'glyc', via: [[195, 275], [195, 385]] }),
            E('pp1', 'gs', 'act', 'dephos', { g: 'glyc' }), E('pp1', 'gp', 'inh', 'dephos', { g: 'glyc', lo: [0, 14] }), E('akt2', 'phk', 'inh', null, { g: 'glyc', via: [[195, 275], [195, 452]] }), E('phk', 'gp', 'act', 'Ser15-P', { g: 'glyc' }),
            E('g6p', 'gs', 'act', 'allostery ★', { g: 'glyc', w: 3 }), E('g6p', 'gp', 'inh', 'allostery', { g: 'glyc', lo: [-40, 26] }),
            E('g6p', 'glycogen', 'flow', null, { g: 'glyc', anim: true }), E('gs', 'glycogen', 'act', 'builds', { g: 'glyc', lo: [-30, 12] }), E('gp', 'glycogen', 'inh', 'breaks down', { g: 'glyc' }),
          ],
          steps: [
            { n: ['ins', 'insr', 'irs1', 'pi3k', 'akt2'], cap: 'INSR → **IRS1** → PI3K → **AKT2** (the muscle isoforms that matter).' },
            { n: ['akt2', 'as160', 'rab', 'gsv'], open: ['glut'], cap: 'AKT2 phosphorylates **AS160 (Thr649)** → its GAP turns off → **Rab-GTP** rises → vesicles move.' },
            { n: ['pi3k', 'rac1', 'actin', 'gsv'], open: ['glut'], cap: 'Parallel route: **RAC1 → actin remodelling** helps vesicles reach the membrane.' },
            { n: ['gsv', 'glut4', 'glcO', 'g6p'], cap: 'GLUT4 fuses into the membrane → glucose enters → **G6P**.' },
            { n: ['g6p', 'gs', 'gp', 'glycogen'], open: ['glyc'], cap: '**G6P is the main switch:** activates glycogen synthase, inhibits phosphorylase.' },
            { n: ['akt2', 'gsk3', 'pp1', 'phk', 'gs', 'gp'], open: ['glyc'], cap: 'Insulin also dephosphorylates GS & phosphorylase (PP1, ⊣ phosphorylase kinase, ⊣ GSK3) → **net** synthesis.' },
          ],
        }),
        IRV.ev('Key experiments — muscle', [
          ['y', 'MIRKO mice', 'No insulin-stimulated glucose uptake or glycogen synthesis'],
          ['y', 'IRS1 vs IRS2 knockdown', 'Only IRS1 loss blocks transport (Irs2⁻/⁻ soleus normal)'],
          ['y', 'Akt2⁻/⁻ vs Akt1⁻/⁻', 'Akt2⁻/⁻ severely intolerant; Akt1⁻/⁻ normal tolerance'],
          ['y', 'TBC1D4 Thr649Ala knock-in', 'Impaired GLUT4 translocation, glucose intolerance'],
          ['y', 'Human TBC1D4 truncation', 'Profound insulin resistance in a family'],
          ['y', 'Tbc1d1 + Tbc1d4 double KO', 'Insulin-stimulated uptake abolished'],
          ['y', 'RAC1 muscle KO / active RAC1', 'KO blocks uptake despite normal AKT; active RAC1 translocates GLUT4 without insulin'],
          ['n', 'GSK3 Ser21/9Ala knock-in', 'Normal glycogen synthesis → GSK3 phosphorylation not essential'],
          ['y', 'G6P-insensitive glycogen synthase', 'Severely impaired glycogen synthesis → allostery is key'],
        ])));

      // ---------- C. liver (Fig. 4) + Fig. 3
      b.appendChild(IRV.fig('Fig. 4 · II-C', 'Liver: glycogen fast, genes slow',
        'Branching happens **after AKT**. Fast: glycogen. Slow (hours): FOXO1 gluconeogenic genes ↓, SREBP-1c lipogenic genes ↑, protein synthesis.',
        EP.flow({
          w: 950, h: 664,
          zones: [
            { x: 10, y: 60, w: 930, h: 38, kind: 'membrane', label: 'Membrane', lx: 160, ly: 84 },
            { x: 10, y: 102, w: 930, h: 554, label: 'Hepatocyte', lx: 22, ly: 644 },
            { x: 220, y: 118, w: 710, h: 134, kind: 'soft', label: '⚡ Fast — glycogen', g: 'gly', lx: 230, ly: 134 },
            { x: 220, y: 318, w: 710, h: 74, kind: 'soft', label: '🐢 Slow — lipogenesis', g: 'dnl', lx: 920, ly: 386, anchor: 'end' },
            { x: 220, y: 460, w: 710, h: 130, kind: 'nucleus', label: 'Nucleus — 🐢 slow gene control', g: 'foxo', lx: 230, ly: 476 },
          ],
          groups: { gly: { label: 'Glycogen (fast)', x: 600, y: 180 }, dnl: { label: 'Lipogenesis (slow)', x: 600, y: 355 }, prot: { label: 'Protein synthesis', x: 330, y: 425 }, foxo: { label: 'Gluconeogenic genes (slow)', x: 600, y: 520 } },
          nodes: [
            N('ins', 95, 30, 'Insulin (portal)', 'hormone', { info: 'Portal insulin is 2–3× peripheral. Half-maximal net glycogen synthesis in humans at portal ~20–25 µU/mL (with high glucose, low glucagon).' }),
            N('insr', 95, 79, 'INSR', 'receptor'), N('irs', 95, 150, 'IRS1 / IRS2', 'kinase', { info: 'Largely **redundant** in liver: only deleting both causes severe hyperglycemia and blunted PI3K/AKT.' }),
            N('pi3k', 95, 215, 'PI3K (p110α)', 'kinase', { info: 'p110α is the key catalytic subunit; liver deletion blocks PIP3, AKT and suppression of glucose production.' }),
            N('akt', 95, 290, 'AKT', 'kinase', { info: 'Liver Akt1/Akt2 double KO: no glycogen synthesis on refeeding even though GSK3 is still phosphorylated → AKT needed, GSK3-P not enough.' }),
            N('note', 700, 622, 'Fast ↓ of gluconeogenesis is mostly INDIRECT → Section III', 'note'),
            N('glc', 520, 30, 'Glucose', 'glc'), N('glut2', 520, 79, 'GLUT2 (not insulin-regulated)', 'transporter'),
            N('gck', 320, 165, 'Glucokinase (GCK)', 'enzyme', { g: 'gly', info: 'Insulin rapidly ↑ GCK transcription and its exit from the nucleus. GCK is a major control point for glycogen synthesis **and** feeds DNL by substrate push. GCK expression is low in human T2D.' }),
            N('g6p', 520, 165, 'G6P', 'glc', { g: 'gly' }),
            N('gys2', 700, 165, 'Glycogen synthase (GYS2)', 'enzyme', { g: 'gly', info: 'Needs Arg582 to sense G6P (R582A mice store less glycogen). PP1 dephosphorylates Ser7; S7A/S644A mice have more glycogen.' }),
            N('glycogen', 870, 165, 'Glycogen', 'glc', { g: 'gly' }),
            N('gsk3', 320, 225, 'GSK3', 'kinase', { g: 'gly' }), N('pp1', 700, 225, 'PP1 · G_L', 'enzyme', { g: 'gly', info: 'Active phosphorylase binds and inhibits G_L — a safeguard against making and breaking glycogen at once.' }),
            N('gp', 870, 225, 'Phosphorylase', 'enzyme', { g: 'gly', info: 'Liver phosphorylase ignores AMP/G6P; **glucose itself** is its main allosteric inhibitor — fitting, since glucose crosses freely via GLUT2.' }),
            N('mtorc1', 320, 355, 'mTORC1 → S6K', 'kinase', { g: 'dnl', info: 'AKT activates mTORC1 by inhibiting TSC2 / PRAS40. S6K is required for SREBP-1c processing. mTORC1 also integrates amino acids.' }),
            N('srebp', 500, 355, 'SREBP-1c', 'tf', { g: 'dnl', info: 'Master lipogenic TF. Insulin ↑ its transcription and cleavage. Slow: nuclear SREBP-1 appears ~8 h after insulin. Liver SREBP-1c overexpression → steatosis; liver Akt2⁻/⁻ ob/ob mice get no steatosis.' }),
            N('dnlg', 680, 355, 'ACC · FAS · GPAT1', 'enzyme', { g: 'dnl', info: 'Acute too: insulin dephosphorylates **ACC Ser79** (maybe via ⊣ AMPK) within minutes. ACC Ser79/212Ala knock-in → constitutive lipogenesis.' }),
            N('dnl', 860, 355, 'De novo\nlipogenesis', 'process', { g: 'dnl', info: 'A **minor** source of liver fat: ~10% of fasting liver TG output in healthy people, ~25% in NAFLD (vs ~60% re-esterified plasma fatty acid, ~15% diet). Rises with carbohydrate/fructose intake and hyperinsulinemia.' }),
            N('prot', 320, 425, 'Protein synthesis\n(S6K · 4E-BP1/2)', 'process', { g: 'prot', info: 'mTORC1 drives translation of 5′-TOP mRNAs and phosphatidylcholine for VLDL.' }),
            N('foxo1', 330, 520, 'FOXO1 (+ PGC1α)', 'tf', { g: 'foxo', info: 'AKT phosphorylates Thr24, Ser256, Ser319 → nuclear exclusion. Liver FOXO1 KO → fasting hypoglycemia. Deleting Foxo1 **rescues** HGP in liver INSR, IRS1/2 or AKT1/2 knockouts.' }),
            N('genes', 700, 520, 'G6PC · PCK1\n(gluconeogenic capacity)', 'gene', { g: 'foxo', info: 'Slow: 2 h of insulin does not change G6pc protein. Control analysis suggests non-transcriptional mechanisms dominate day-to-day.' }),
            N('crtc2', 330, 570, 'CREB · CRTC2', 'tf', { g: 'foxo', info: 'Drives the **early-fasting** gene programme (FOXO1/PGC1α takes over later). Insulin → SIK2 → CRTC2 Ser171-P → exported & degraded. CRTC2 KO → fasting hypoglycemia.' }),
            N('sik2', 95, 570, 'SIK2', 'kinase', { g: 'foxo' }),
          ],
          edges: [
            E('ins', 'insr'), E('insr', 'irs'), E('irs', 'pi3k'), E('pi3k', 'akt'),
            E('glc', 'glut2', 'flow', null, { anim: true }), E('glut2', 'g6p', 'flow', null, { g: 'gly', anim: true }),
            E('akt', 'gck', 'act', '↑ GCK', { g: 'gly', via: [[205, 290], [205, 165]] }), E('gck', 'g6p', 'act', null, { g: 'gly' }), E('g6p', 'gys2', 'act', 'allostery', { g: 'gly' }), E('gys2', 'glycogen', 'act', null, { g: 'gly' }),
            E('akt', 'gsk3', 'inh', null, { g: 'gly', via: [[205, 290], [205, 225]] }), E('gsk3', 'gys2', 'inh', null, { g: 'gly' }), E('pp1', 'gys2', 'act', null, { g: 'gly' }), E('pp1', 'gp', 'inh', null, { g: 'gly' }), E('gp', 'glycogen', 'inh', null, { g: 'gly' }),
            E('glut2', 'gp', 'inh', 'glucose ⊣', { g: 'gly', via: [[925, 79], [925, 225]], lp: [918, 128], la: 'end' }), E('akt', 'pp1', 'act', null, { g: 'gly', via: [[205, 290], [205, 268], [700, 268]] }),
            E('akt', 'mtorc1', 'act', '⊣ TSC2', { g: 'dnl', via: [[205, 290], [205, 355]] }), E('mtorc1', 'srebp', 'act', 'cleavage', { g: 'dnl' }), E('akt', 'srebp', 'act', '↑ transcription', { g: 'dnl', via: [[205, 290], [205, 400], [500, 400]] }),
            E('srebp', 'dnlg', 'act', null, { g: 'dnl' }), E('dnlg', 'dnl', 'act', null, { g: 'dnl' }), E('g6p', 'dnl', 'flow', 'substrate push', { g: 'dnl' }),
            E('mtorc1', 'prot', 'act', null, { g: 'prot' }),
            E('akt', 'foxo1', 'inh', 'P → nuclear exit', { g: 'foxo', via: [[205, 290], [205, 520]] }), E('foxo1', 'genes', 'act', null, { g: 'foxo' }), E('foxo1', 'gck', 'inh', '+SIN3A', { g: 'foxo', via: [[230, 520], [230, 165]], lp: [236, 292], la: 'start' }),
            E('akt', 'sik2', 'act', null, { g: 'foxo' }), E('sik2', 'crtc2', 'inh', 'Ser171', { g: 'foxo' }), E('crtc2', 'genes', 'act', 'early fast', { g: 'foxo' }),
          ],
          steps: [
            { n: ['ins', 'insr', 'irs', 'pi3k', 'akt'], cap: 'Portal insulin → INSR → IRS1/2 (redundant) → PI3K p110α → **AKT**. Branching happens after AKT.' },
            { n: ['glc', 'glut2', 'gck', 'g6p', 'gys2', 'glycogen', 'akt'], open: ['gly'], cap: '**Fast:** insulin ↑ glucokinase; G6P allosterically turns on **GYS2**.' },
            { n: ['pp1', 'gp', 'gys2', 'glycogen', 'glut2', 'gsk3', 'akt'], open: ['gly'], cap: 'PP1 flips GS on / phosphorylase off; **glucose itself** inhibits phosphorylase.' },
            { n: ['akt', 'foxo1', 'genes', 'gck'], open: ['foxo'], cap: '**Slow:** AKT expels FOXO1 from the nucleus → ↓ G6PC/PCK1, ↑ GCK.' },
            { n: ['akt', 'sik2', 'crtc2', 'genes'], open: ['foxo'], cap: 'CRTC2 runs the early-fasting programme; insulin → SIK2 shuts it off.' },
            { n: ['akt', 'mtorc1', 'srebp', 'dnlg', 'dnl', 'g6p'], open: ['dnl'], cap: '**Slow:** AKT + mTORC1 → **SREBP-1c** → ACC/FAS/GPAT1 → de novo lipogenesis (GCK adds substrate push).' },
            { n: ['mtorc1', 'prot'], open: ['prot'], cap: 'mTORC1 also drives protein synthesis — and feeds back on IRS1/INSR (Fig. 1).' },
            { n: ['note'], cap: 'But the **fast** drop in gluconeogenesis is mostly **indirect**, via fat (Section III).' },
          ],
        }),
        h('div.irv-two',
          h('div', h('h4', 'Who controls net hepatic glycogen?'),
            h('div.irv-rule', h('div.hd', ''), h('div.hd', '↑ Glycogen synthesis'), h('div.hd', '⊣ Glycogenolysis'),
              h('div.hd', '↑ Insulin'), h('div.y', 'Necessary & sufficient'), h('div.n', 'helps'),
              h('div.hd', '↑ Glucose'), h('div.n', 'helps'), h('div.y', 'Necessary & sufficient')),
            IRV.cap('**Net** glycogen storage needs **both** high insulin and high glucose. Insulin is permissive; portal glucose is the driver.')),
          h('div', h('h4', 'Where liver triglyceride comes from'), lipidSources(),
            IRV.cap('**DNL is a minor route.** ~10% of liver TG output in healthy fasting people (Lambert 2014), ~25% in NAFLD (Donnelly 2005); it roughly doubles after carbohydrate meals in insulin-resistant people (Petersen 2007). Most liver fat is **re-esterified plasma fatty acid**. Insulin also lowers plasma TG within 15 min.'))),
        IRV.fig('Fig. 3', 'Where glucose output comes from during a fast', 'Glycogenolysis decays exponentially; gluconeogenesis stays flat for ~48 h. Plasma glucose during a fast signals how much liver glycogen is left.',
          h('div.irv-31', IRV.mini({
            w: 520, h: 230, x: [4, 48], y: [0, 14], xt: [[4, '4'], [12, '12'], [24, '24'], [36, '36'], [48, '48 h']], yt: [[0, '0'], [5, '5'], [10, '10']], xl: 'Fasting duration (h)', yl: 'HGP (µmol/kg/min)',
            series: [{ f: (t) => 6.5 * (t < 44 ? 1 : 1 - 0.3 * (t - 44) / 20), col: 'var(--tr1)', label: 'Gluconeogenesis', lx: 26, ly: 7.6 }, { f: (t) => 6.0 * Math.exp(-0.065 * (t - 4)), col: 'var(--tr0)', label: 'Glycogenolysis', lx: 10, ly: 5.8 }],
          }), IRV.pts([['🧑', 'Humans: glycogenolysis ≈ 40% of HGP over the first 22 h; nearly gone by 48 h.'], ['🐀', 'Rats: glycogen is gone after ~12 h — overnight-fasted rodent clamps measure almost pure gluconeogenesis.']])))));

      // ---------- D. adipocyte (Fig. 5)
      b.appendChild(IRV.fig('Fig. 5 · II-D', 'White adipocyte: stop lipolysis, take up glucose',
        'Insulin turns lipolysis off mainly by **destroying cAMP (PDE3B)** and **dephosphorylating** HSL and perilipin. Glucose uptake uses AKT routes and a PI3K-independent TC10 route.',
        EP.flow({
          w: 950, h: 580,
          zones: [
            { x: 10, y: 58, w: 930, h: 38, kind: 'membrane', label: 'Membrane', lx: 470, ly: 72, anchor: 'middle' },
            { x: 10, y: 100, w: 930, h: 432, label: 'White adipocyte', lx: 22, ly: 520 },
            { x: 30, y: 372, w: 420, h: 128, kind: 'soft', label: 'Lipid droplet', g: 'lip', lx: 440, ly: 390, anchor: 'end' },
            { x: 690, y: 240, w: 240, h: 92, kind: 'soft', label: 'Golgi / GSV pool', g: 'glu', lx: 920, ly: 326, anchor: 'end' },
          ],
          groups: { lip: { label: 'Lipolysis control', x: 230, y: 300 }, glu: { label: 'Glucose uptake', x: 700, y: 300 }, store: { label: 'Fat storage', x: 470, y: 548 } },
          nodes: [
            N('cat', 95, 28, 'Catecholamines', 'hormone', { g: 'lip' }), N('bar', 95, 77, 'β-adrenergic R', 'receptor', { g: 'lip' }),
            N('camp', 95, 150, 'cAMP', 'messenger', { g: 'lip' }), N('pka', 95, 225, 'PKA', 'kinase', { g: 'lip' }),
            N('ins', 470, 28, 'Insulin', 'hormone', { info: 'Most potent antilipolytic hormone: rat plasma NEFA falls ~90% within 5 min (NEFA half-life 2–4 min).' }),
            N('insr', 400, 77, 'INSR', 'receptor'), N('insr2', 800, 77, 'INSR', 'receptor'),
            N('pde', 260, 150, 'PDE3B', 'enzyme', { g: 'lip', info: 'Degrades cAMP. Pde3b⁻/⁻ adipocytes cannot suppress lipolysis. Activation is via a **signalosome**: AKT is **not** required (Akt2⁻/⁻ mice suppress lipolysis; the AKT site Ser273 is dispensable).' }),
            N('pp2a', 400, 225, 'PP2A', 'enzyme', { g: 'lip', info: 'Insulin dephosphorylates HSL even without PKA activity — PP2A is the main HSL phosphatase.' }),
            N('pp1', 400, 300, 'PP1', 'enzyme', { g: 'lip', info: 'Main perilipin phosphatase; insulin ↑ its regulatory-subunit phosphorylation and activity (PI3K-dependent, AKT-independent).' }),
            N('plin', 200, 300, 'PLIN1 (perilipin)', 'kinase', { g: 'lip', info: 'PKA-phosphorylated PLIN1 releases **CGI-58**, helps activate HSL, and (slowly) increases droplet surface. Plin1⁻/⁻: high basal lipolysis that adrenaline cannot raise.' }),
            N('hsl', 330, 410, 'HSL', 'enzyme', { g: 'lip', info: 'PKA phosphorylation (Ser563/659/660) moves HSL to the droplet. Mainly a **DAG lipase**. Humans lacking HSL cannot control lipolysis.' }),
            N('atgl', 160, 410, 'ATGL + CGI-58', 'enzyme', { g: 'lip', info: 'ATGL does the first step (TAG → DAG, mostly sn-1,3-DAG). CGI-58 boosts it ~20-fold.' }),
            N('tag', 80, 470, 'TAG', 'lipid', { g: 'lip' }), N('dag', 245, 470, 'DAG → MAG', 'lipid', { g: 'lip' }), N('nefa', 400, 470, 'NEFA + glycerol', 'lipid', { g: 'lip' }),
            N('irs1', 560, 150, 'IRS1 · PI3K', 'kinase', { g: 'glu', info: 'IRS1 knockdown blocks uptake in rat adipocytes. Adipocyte PTEN deletion → super insulin-sensitive mice.' }),
            N('akt2', 560, 225, 'AKT2', 'kinase', { g: 'glu' }),
            N('as160', 545, 300, 'AS160 ⊣ RAB10\nRGC2 ⊣ RalA', 'kinase', { g: 'glu', info: 'AKT phosphorylates the Rab-GAP **AS160** (Tbc1d4⁻/⁻ abolishes adipocyte uptake; TBC1D1 matters little in fat) and the RalA-GAP **RGC2**.' }),
            N('fus', 560, 380, 'SYNIP · CDP138 · Myo5A\n(docking & fusion)', 'kinase', { g: 'glu', info: 'AKT substrates for the last steps: SYNIP releases syntaxin-4; CDP138 aids fusion; myosin 5A moves vesicles through cortical actin.' }),
            N('tc10', 800, 150, 'TC10α', 'kinase', { g: 'glu', info: 'PI3K-**independent** Rho GTPase (knockdown impairs uptake). Binds EXO70 to tether vesicles; acts via PIST to cleave TUG.' }),
            N('exo', 900, 215, 'EXO70', 'kinase', { g: 'glu' }),
            N('tug', 780, 290, 'PIST → TUG cleaved', 'kinase', { g: 'glu', info: 'TUG tethers GLUT4 vesicles at the Golgi; cleaving it releases them. Works in muscle too.' }),
            N('munc', 690, 150, 'MUNC18c', 'kinase', { g: 'glu', info: 'INSR tyrosine-phosphorylates MUNC18c directly, tuning SNARE-mediated fusion.' }),
            N('gsv', 720, 440, 'GLUT4 vesicles', 'transporter', { g: 'glu' }),
            N('glut', 720, 532, 'GLUT4', 'transporter'), N('glcO', 880, 560, 'Glucose', 'glc'),
            N('g3p', 500, 548, 'Glucose → glycerol-3-P', 'glc', { g: 'store', info: 'Glucose supplies the glycerol backbone for **re-esterifying** fatty acids. Esterification depends mostly on substrate supply, not on a direct insulin switch.' }),
            N('reest', 220, 548, 'Re-esterification = fat storage', 'process', { g: 'store', info: 'Insulin activates endothelial LPL, moves FATP1/4, induces SREBP-1c and adipogenesis (PPARγ). DNL is a tiny part of fat-cell lipogenesis.' }),
          ],
          edges: [
            E('cat', 'bar', 'act', null, { g: 'lip' }), E('bar', 'camp', 'act', null, { g: 'lip' }), E('camp', 'pka', 'act', null, { g: 'lip' }),
            E('pka', 'plin', 'act', 'P', { g: 'lip' }), E('pka', 'hsl', 'move', 'P → to droplet', { g: 'lip', via: [[95, 340], [300, 380]], lo: [10, -10] }),
            E('plin', 'atgl', 'act', 'frees CGI-58', { g: 'lip', lo: [46, 6] }), E('atgl', 'dag', 'act', null, { g: 'lip' }), E('hsl', 'dag', 'act', null, { g: 'lip' }),
            E('tag', 'dag', 'flow', null, { g: 'lip', anim: true }), E('dag', 'nefa', 'flow', null, { g: 'lip', anim: true }),
            E('ins', 'insr'), E('ins', 'insr2'),
            E('insr', 'pde', 'act', 'signalosome', { g: 'lip', lo: [-20, -4] }), E('pde', 'camp', 'inh', 'degrades', { g: 'lip' }),
            E('insr', 'pp2a', 'act', null, { g: 'lip' }), E('pp2a', 'hsl', 'inh', 'dephos', { g: 'lip', lo: [30, 44] }), E('insr', 'pp1', 'act', null, { g: 'lip', via: [[460, 150], [460, 300]] }), E('pp1', 'plin', 'inh', 'dephos', { g: 'lip' }),
            E('insr', 'irs1', 'act', null, { g: 'glu' }), E('irs1', 'akt2', 'act', null, { g: 'glu' }), E('akt2', 'as160', 'inh', 'P', { g: 'glu' }), E('akt2', 'fus', 'act', null, { g: 'glu', via: [[625, 260], [625, 345]] }),
            E('as160', 'gsv', 'inh', 'GAPs off', { g: 'glu' }), E('fus', 'gsv', 'act', null, { g: 'glu' }),
            E('insr2', 'tc10', 'act', 'PI3K-independent', { g: 'glu', lo: [62, 2] }), E('tc10', 'exo', 'act', null, { g: 'glu' }), E('tc10', 'tug', 'act', null, { g: 'glu' }), E('tug', 'gsv', 'act', 'release', { g: 'glu' }), E('exo', 'gsv', 'act', 'tether', { g: 'glu', via: [[920, 240], [920, 440]], lp: [914, 410], la: 'end' }),
            E('insr2', 'munc', 'act', 'pTyr', { g: 'glu' }), E('munc', 'gsv', 'act', null, { g: 'glu' }),
            E('gsv', 'glut', 'move', null), E('glcO', 'glut', 'flow', null, { anim: true }), E('glut', 'g3p', 'flow', null, { g: 'store', anim: true }), E('g3p', 'reest', 'flow', null, { g: 'store' }), E('nefa', 'reest', 'flow', 're-esterify', { g: 'store', bend: 20 }),
          ],
          steps: [
            { n: ['cat', 'bar', 'camp', 'pka', 'plin', 'hsl', 'atgl', 'tag', 'dag', 'nefa'], open: ['lip'], cap: 'Fasting / stress: catecholamines → cAMP → **PKA** → PLIN1 frees CGI-58 → **ATGL**; HSL moves to the droplet.' },
            { n: ['ins', 'insr', 'pde', 'camp'], open: ['lip'], cap: 'Insulin → **PDE3B** degrades cAMP (no AKT needed).' },
            { n: ['insr', 'pp2a', 'hsl', 'pp1', 'plin'], open: ['lip'], cap: 'Insulin also **dephosphorylates**: PP2A → HSL, PP1 → perilipin.' },
            { n: ['ins', 'insr', 'irs1', 'akt2', 'as160', 'fus', 'gsv', 'glut'], open: ['glu'], cap: 'Uptake, AKT route: AS160/RGC2 GAPs off, plus docking & fusion proteins.' },
            { n: ['ins', 'insr2', 'tc10', 'exo', 'tug', 'munc', 'gsv', 'glut'], open: ['glu'], cap: 'Uptake, PI3K-independent route: **TC10** → EXO70 tether, TUG cleavage; INSR → MUNC18c.' },
            { n: ['glcO', 'glut', 'g3p', 'reest', 'nefa'], open: ['store'], cap: 'Glucose → glycerol-3-P lets fatty acids be **re-esterified** = fat storage.' },
          ],
        }),
        h('div.irv-31',
          IRV.mini({ w: 520, h: 220, logx: true, x: [1, 1000], y: [0, 1], xt: [[1, '1'], [10, '10'], [100, '100'], [1000, '1000']], yt: [[0, '0'], [0.5, '50%'], [1, '100%']], xl: 'Plasma insulin, µU/mL (log)', yl: 'Effect',
            bands: [{ x0: 5, x1: 60, label: 'normal range' }],
            series: [{ f: (x) => Math.pow(x, 2.2) / (Math.pow(x, 2.2) + Math.pow(20, 2.2)), col: 'var(--tr0)', label: '⊣ lipolysis (ED50 ≈ 20)', lx: 1.6, ly: 0.82 }, { f: (x) => Math.pow(x, 1.6) / (Math.pow(x, 1.6) + Math.pow(60, 1.6)), col: 'var(--tr1)', label: 'glucose uptake (ED50 ≈ 60)', lx: 70, ly: 0.32 }] }),
          IRV.pts([['🎯', 'Lipolysis suppression uses **most of its range** inside normal insulin levels (5–60 µU/mL).'], ['🍬', 'Fat takes < 5% of a glucose load, yet its insulin action matters hugely (Section IV-E).']]))));
    },
  });
  function lipidSources() {
    // Healthy: ~10% of fasting VLDL-TG palmitate from DNL (Lambert 2014). NAFLD: 59% plasma NEFA, 26% DNL, 15% diet (Donnelly 2005).
    const W = 470, rows = [['Healthy', [['Plasma fatty acids + diet', 90, 'var(--m-fat)'], ['DNL', 10, 'var(--tr3)']]], ['NAFLD', [['Re-esterified plasma fatty acids', 59, 'var(--m-fat)'], ['DNL', 26, 'var(--tr3)'], ['Diet', 15, 'var(--tr5)']]]];
    const svg = EP.s('svg', { class: 'irv-mini', viewBox: `0 0 ${W} 112` });
    rows.forEach(([name, segs], r) => {
      const y = 4 + r * 56, x0 = 62, bw = W - x0;
      svg.appendChild(EP.s('text', { x: 0, y: y + 19, style: 'font-size:12px;font-weight:700;fill:var(--muted)' }, name));
      let x = x0;
      segs.forEach(([l, p, c]) => {
        const w = bw * p / 100;
        svg.appendChild(EP.s('rect', { x, y, width: w - 2, height: 26, rx: 6, style: `fill:color-mix(in srgb, ${c} 55%, transparent);stroke:${c}` }));
        svg.appendChild(EP.s('text', { x: x + w / 2, y: y + 18, 'text-anchor': 'middle', style: 'font-size:12px;font-weight:800;fill:var(--text)' }, '~' + p + '%'));
        if (p >= 20 || l === 'DNL') svg.appendChild(EP.s('text', { x: x + (p < 20 ? w / 2 : 4), y: y + 41, 'text-anchor': p < 20 ? 'middle' : 'start', style: `font-size:10.5px;font-weight:600;fill:${c}` }, p < 15 && l !== 'DNL' ? '' : l));
        else svg.appendChild(EP.s('text', { x: x + w / 2, y: y + 41, 'text-anchor': 'middle', style: `font-size:10.5px;font-weight:600;fill:${c}` }, l));
        x += w;
      });
    });
    return svg;
  }

  // ================================================================== III. INDIRECT INSULIN ACTION
  IRV.chapter({
    rn: 'III', id: 'indirect', col: 'var(--tr0)', title: 'Indirect insulin action', tile: 'Fat → liver axis, glucagon, brain',
    sub: 'Effects that need tissue cross-talk; often bigger than the direct ones (Fig. 6).',
    build(b) {
      b.appendChild(IRV.fig('Fig. 6 · III-B', 'The adipocyte → hepatocyte axis',
        'Insulin stops fat breakdown → less fatty acid reaches the liver → less **acetyl-CoA** to activate **pyruvate carboxylase**, and less glycerol → gluconeogenesis falls. Meanwhile insulin acts directly on liver glycogen.',
        EP.flow({
          w: 920, h: 410,
          zones: [
            { x: 15, y: 60, w: 300, h: 340, label: 'White adipose tissue', col: 'var(--m-fat)' },
            { x: 330, y: 60, w: 150, h: 340, kind: 'blood', label: 'Blood' },
            { x: 495, y: 60, w: 415, h: 340, label: 'Liver', col: 'var(--tr0)' },
          ],
          nodes: [
            N('insW', 165, 28, 'Insulin', 'hormone'), N('insrW', 165, 100, 'INSR', 'receptor'),
            N('tag', 165, 175, 'Triglyceride', 'lipid'), N('lipo', 165, 245, 'Lipolysis', 'process'),
            N('nefaW', 95, 325, 'NEFA', 'lipid'), N('glyW', 240, 325, 'Glycerol', 'metab'),
            N('nefaB', 405, 265, 'NEFA', 'lipid'), N('glyB', 405, 345, 'Glycerol', 'metab'),
            N('insL', 700, 28, 'Insulin (portal)', 'hormone'), N('insrL', 700, 100, 'INSR', 'receptor'),
            N('glycogen', 700, 175, 'Glycogen', 'glc'), N('box', 575, 265, 'β-oxidation', 'process'),
            N('acoa', 695, 265, 'Acetyl-CoA', 'metab', { info: 'Mitochondrial acetyl-CoA is an **allosteric activator of pyruvate carboxylase** — the link from fat to glucose production. Measured in vivo by LC-MS/MS (Perry 2015).' }),
            N('pc', 830, 265, 'Pyruvate\ncarboxylase', 'enzyme'),
            N('gng', 780, 345, 'Gluconeogenesis', 'process'), N('hgp', 850, 175, 'Glucose output\n(HGP)', 'glc'),
          ],
          edges: [
            E('insW', 'insrW'), E('insrW', 'lipo', 'inh', null, { via: [[260, 100], [260, 245]] }), E('tag', 'lipo', 'flow'), E('lipo', 'nefaW', 'flow', null, { anim: true }), E('lipo', 'glyW', 'flow', null, { anim: true }),
            E('nefaW', 'nefaB', 'flow', null, { anim: true, via: [[95, 380], [330, 380], [340, 265]] }), E('glyW', 'glyB', 'flow', null, { anim: true }),
            E('nefaB', 'box', 'flow', null, { anim: true }), E('box', 'acoa', 'flow'), E('acoa', 'pc', 'act', '+ allostery', { lo: [0, 20] }), E('pc', 'gng', 'act'), E('glyB', 'gng', 'flow', 'substrate', { anim: true }),
            E('gng', 'hgp', 'flow', null, { via: [[900, 345], [900, 175]] }), E('glycogen', 'hgp', 'flow', 'glycogenolysis'),
            E('insL', 'insrL'), E('insrL', 'glycogen', 'act', 'net synthesis', { lo: [-10, -4] }),
          ],
          states: [
            { id: 'fast', label: '🌙 Fasting', n: { insW: { c: 'off' }, insL: { c: 'off' }, insrW: { c: 'off' }, insrL: { c: 'off' }, lipo: { b: '↑' }, acoa: { b: '↑' }, gng: { b: '↑' }, hgp: { b: '↑' } }, e: { 'insW>insrW': 'off', 'insL>insrL': 'off', 'insrW>lipo': 'off', 'insrL>glycogen': 'off', 'nefaB>box': 'thick', 'glyB>gng': 'thick' }, cap: '**Fasting:** low insulin → lipolysis runs → NEFA → acetyl-CoA → **pyruvate carboxylase ON**; glycogen breaks down.' },
            { id: 'fed', label: '🍽 Insulin / fed', n: { lipo: { b: '↓' }, nefaB: { c: 'off' }, glyB: { c: 'off' }, acoa: { b: '↓' }, pc: { b: '↓' }, gng: { b: '↓' }, glycogen: { b: '↑' }, hgp: { b: '↓' } }, e: { 'lipo>nefaW': 'weak', 'lipo>glyW': 'weak', 'nefaW>nefaB': 'weak', 'glyW>glyB': 'weak', 'nefaB>box': 'weak', 'glyB>gng': 'weak', 'glycogen>hgp': 'weak' }, cap: '**Insulin:** fat stops lipolysis (**indirect**) and liver stores glycogen (**direct**) → HGP falls fast.' },
            { id: 'tlko', label: '🧪 Liver signaling knocked out (TLKO)', n: { insrL: { c: 'bad', b: 'AKT ✕' }, glycogen: { b: '✕ synthesis' }, lipo: { b: '↓' }, acoa: { b: '↓' }, pc: { b: '↓' }, gng: { b: '↓' }, hgp: { b: '↓' } }, e: { 'insrL>glycogen': 'off', 'lipo>nefaW': 'weak', 'lipo>glyW': 'weak', 'nefaW>nefaB': 'weak', 'glyW>glyB': 'weak', 'nefaB>box': 'weak', 'glyB>gng': 'weak' }, cap: '**Liver Akt1 + Akt2 + FoxO1 knockout mice (fasted clamp):** the receptor is there but nothing downstream of AKT works, so insulin cannot drive liver glycogen synthesis. Yet glucose output still falls normally — fat still obeys insulin, so acetyl-CoA and glycerol supply drop. Intralipid (keeping NEFA up) abolishes this.' },
            { id: 'acet', label: '🧪 Insulin + acetate & glycerol', n: { lipo: { b: '↓' }, acoa: { c: 'hot', b: 'held' }, glyB: { c: 'hot', b: 'held' }, pc: { b: '↔' }, gng: { b: '↔' }, hgp: { b: '↔ not ↓' } }, e: { 'lipo>nefaW': 'weak', 'nefaW>nefaB': 'weak' }, cap: '**Perry 2015 (fasted, glycogen-depleted rats):** insulin still stops lipolysis, but infusing acetate (keeps hepatic acetyl-CoA up) plus glycerol (replaces lost supply) leaves pyruvate carboxylase flux and glucose output at fasting levels — insulin can no longer suppress them.' },
            { id: 'adir', label: '⚠ Adipose insulin resistance', n: { insrW: { c: 'bad', b: '↓' }, lipo: { b: '↑' }, acoa: { b: '↑' }, gng: { b: '↑' }, hgp: { b: '↑' } }, e: { 'insrW>lipo': 'weak', 'nefaB>box': 'thick' }, cap: '**Adipose IR (badges vs a normal insulin-stimulated state):** insulin fails to stop lipolysis → acetyl-CoA and glycerol stay high → gluconeogenesis is not suppressed. In a glycogen-depleted liver this looks like "hepatic" IR even if hepatocytes respond normally.' },
          ],
        }),
        IRV.pts([['🍗', '**Fed liver** (lots of glycogen) → direct effects dominate. **Fasted liver** (glycogen gone) → indirect effects dominate.'], ['🐀', 'Rodents lose liver glycogen overnight; humans and dogs keep it longer → explains conflicting studies.'], ['🩸', 'In poorly controlled T2D, the extra glucose output is **all gluconeogenesis**.']]),
        IRV.ev('Key experiments — fat controls hepatic gluconeogenesis', [
          ['y', 'Pancreatectomized dogs, 1966', 'Nicotinic acid ↓ lipolysis → ↓ NEFA and HGP'],
          ['y', 'Low-dose insulin in humans, 1986', 'Raised peripheral (not portal) insulin, no glucagon change → HGP still fell'],
          ['y', 'Fasted dogs, NEFA infusion in clamp', 'Insulin could no longer suppress NEFA or HGP'],
          ['y', 'Rats, Perry 2015', 'Lipolysis, acetyl-CoA, PC flux and HGP fall together; acetate + glycerol abolish suppression'],
          ['y', 'TLKO mice (liver Akt1/2 + FoxO1 KO)', 'Normal HGP suppression; vagotomy/glucagon block no effect; Intralipid prevents it'],
          ['y', 'ASO vs INSR in liver + fat, + atglistatin', 'Suppression only returns when lipolysis is blocked'],
          ['y', 'Whole-body Insr KO with liver rescue', 'Liver INSR alone does not restore HGP suppression'],
          ['y', 'Adipose Atgl KO / Pde3b⁻/⁻', 'Less lipolysis → better suppression / more lipolysis → worse'],
        ])));
      b.appendChild(IRV.fig('Figs. 3 & 6 · try it', 'Experiment: who suppresses glucose output?', 'Move the fasting time and switch experiments. Orange = glycogen (direct control), blue = gluconeogenesis (mostly indirect).', IRV.hgp()));
      b.appendChild(IRV.fig('III-C', 'Insulin suppresses glucagon (inside the islet)', 'Insulin and glucagon are secreted reciprocally — one or the other, rarely both.',
        EP.flow({
          w: 920, h: 150, minW: 620,
          zones: [{ x: 15, y: 15, w: 470, h: 120, label: 'Pancreatic islet', col: 'var(--tr4)' }],
          nodes: [N('beta', 90, 75, 'β-cell', 'organ'), N('ins', 230, 75, 'Insulin', 'hormone'), N('alpha', 400, 75, 'α-cell\nPI3K · PDE → cAMP ↓', 'organ'), N('glg', 590, 75, 'Glucagon', 'hormone'), N('liv', 790, 75, 'Liver glucose output', 'process')],
          edges: [E('beta', 'ins'), E('ins', 'alpha', 'inh', 'paracrine'), E('alpha', 'glg'), E('glg', 'liv', 'act')],
        }),
        IRV.ev('Evidence', [
          ['y', 'Insulin-deficient diabetes (1970)', 'Relative hyperglucagonemia, α-cells hyper-respond to arginine'],
          ['y', 'α-cell INSR knockout mice', 'Hyperglucagonemia when fed and during insulin tolerance tests'],
          ['y', 'Humans with T1D', 'Insulin alone suppresses glucagon during eu- and hypoglycemia'],
          ['y', 'Non-diabetic humans', 'Fasting glucagon correlates with insulin resistance'],
          ['y', 'Glucagon-receptor KO mice', 'Do not develop diabetes after β-cell destruction'],
        ])));
      b.appendChild(IRV.fig('III-D', 'Brain, leptin and the gut', 'Brain insulin clearly cuts appetite. Its control of liver glucose output works in rodents but not in more careful dog studies. Leptin acts through the HPA axis.',
        EP.flow({
          w: 920, h: 390,
          zones: [{ x: 600, y: 222, w: 320, h: 160, kind: 'soft', label: 'Gut → brain signals', g: 'gut', lx: 910, ly: 239, anchor: 'end' }],
          groups: { lep: { label: 'Leptin', open: false, x: 140, y: 300 }, gut: { label: 'Gut → brain', open: false, x: 790, y: 310 } },
          nodes: [
            N('ins', 110, 50, 'Insulin\n(transcytosed across BBB)', 'hormone'),
            N('brain', 330, 120, 'Hypothalamus', 'organ', { info: 'Neurons and glia express INSR. Neuron INSR knockout → diet-induced obesity. Neuron-only INSR rescue lets Insr⁻/⁻ mice live weeks, not days, but they stay diabetic.' }),
            N('app', 330, 30, 'Appetite ↓ ✓', 'good'),
            N('auto', 540, 120, 'Vagus · sympathetic · HPA', 'kinase'),
            N('hgp', 800, 40, 'HGP ↓ ?  rodent ✓ · dog ✗', 'process', { info: 'ICV insulin lowers HGP in rodents (after >1 h). In conscious dogs with portal insulin and matched glucagon, blocking brain PI3K had **no** effect on HGP or glucose uptake. Denervated (transplanted) human livers work normally.' }),
            N('mus', 800, 90, 'Muscle uptake ↑ ?  rodent', 'process'), N('lip', 800, 140, 'WAT lipolysis ↓ ?  rodent', 'process'), N('glg', 800, 190, 'Glucagon ↓ ?  rodent', 'process'),
            N('lepL', 110, 250, 'Low leptin\n(starvation, DKA)', 'hormone', { g: 'lep' }), N('hpa', 330, 250, 'HPA axis ↑', 'kinase', { g: 'lep' }), N('cort', 330, 330, 'Corticosterone', 'hormone', { g: 'lep' }),
            N('wl', 560, 330, 'WAT lipolysis → ketogenesis\n+ gluconeogenesis', 'process', { g: 'lep', info: 'Leptin replacement suppresses the HPA axis and prevents this — leptin, not only low insulin, drives the switch from glucose to fat during starvation. High leptin instead drives catecholamine lipolysis (hormesis). Leptin also suppresses glucagon (central or peripheral).' }),
            N('fgf19', 765, 260, 'FGF19 (bile acids) ⊣ HPA', 'hormone', { g: 'gut', info: 'Acts centrally to suppress the HPA axis and improve glucose tolerance in rodents.' }),
            N('ace', 765, 310, 'Microbial acetate → ↑ insulin (rat)', 'hormone', { g: 'gut' }),
            N('duo', 765, 360, 'Duodenal lipid → ↓ HGP (rat ✓ · human ✗)', 'hormone', { g: 'gut' }),
          ],
          edges: [E('ins', 'brain', 'move'), E('brain', 'app', 'act'), E('brain', 'auto', 'act'), E('auto', 'hgp', 'act', null, { col: 'var(--faint)' }), E('auto', 'mus', 'act', null, { col: 'var(--faint)' }), E('auto', 'lip', 'act', null, { col: 'var(--faint)' }), E('auto', 'glg', 'act', null, { col: 'var(--faint)' }),
            E('lepL', 'hpa', 'act', null, { g: 'lep' }), E('hpa', 'cort', 'act', null, { g: 'lep' }), E('cort', 'wl', 'act', null, { g: 'lep' }),
            E('fgf19', 'brain', 'act', 'act via brain', { g: 'gut' })],
        }),
        IRV.pts([['⚠️', 'Caveats in brain studies: unphysiological ICV doses, lost 3:1 portal:peripheral gradient, uncontrolled glucagon, rodent vs large-animal liver.'], ['🔁', 'Either leptin or insulin can reverse florid T1D hyperglycemia → "glucagon excess" view of diabetes.']])));
    },
  });

  // ================================================================== IV. PATHOPHYSIOLOGY
  IRV.chapter({
    rn: 'IV', id: 'patho', col: 'var(--dn)', title: 'What fails in insulin resistance', tile: 'Dose–response, muscle, liver, fat, how to measure',
    sub: 'Which steps and which functions become resistant, tissue by tissue (Figs. 7–11, Table 1).',
    build(b) {
      b.appendChild(IRV.fig('IV-A', 'The vicious cycle', 'Insulin resistance is a **shifted dose–response curve**, not an on/off switch, so extra insulin can compensate — until β-cells fail.',
        EP.flow({
          w: 920, h: 250, minW: 640,
          nodes: [
            N('over', 110, 125, 'Chronic\novernutrition', 'bad'),
            N('ir', 310, 50, 'Insulin resistance\n(muscle · liver · fat)', 'bad', { info: 'At normal insulin, tissues cannot suppress glucose output and lipolysis, take up glucose, or store glycogen.' }),
            N('hyp', 640, 50, 'Compensatory\nhyperinsulinemia', 'hormone', { info: 'Also from ↓ hepatic insulin clearance. Chronic hyperinsulinemia itself worsens IR (e.g. receptor downregulation).' }),
            N('beta', 570, 190, 'β-cell stress\n(glucose & lipid toxicity)', 'bad'),
            N('t2d', 805, 190, 'β-cell failure →\nfasting hyperglycemia = T2D', 'bad'),
            N('wl', 330, 190, 'Weight loss /\nhypocaloric diet', 'good', { info: 'Reverses insulin resistance even in T2D (e.g. ~8 kg loss normalised liver fat and hepatic insulin sensitivity).' }),
          ],
          edges: [E('over', 'ir', 'bad'), E('ir', 'hyp', 'act', 'compensate', { bend: -26 }), E('hyp', 'ir', 'fb', 'worsens', { bend: -26 }), E('hyp', 'beta', 'bad', 'workload', { lo: [34, 0] }), E('beta', 't2d', 'bad'), E('wl', 'ir', 'inh', 'reversible')],
        }),
        IRV.pts([['🧩', '**Both** target-tissue IR **and** β-cell failure are needed for T2D.'], ['🔁', 'Real-time feedback between sensitivity and secretion makes "which came first" hard.']])));
      b.appendChild(IRV.fig('Fig. 7', 'Receptor defect vs signaling defect', 'Fewer receptors → curve shifts **right** only (spare receptors; max drops only below ~5–10%). Signaling ("post-receptor") defect → **right and down** — the pattern seen in obesity.', IRV.doseResponse(),
        IRV.pts([['📉', 'Receptors are lost in obesity (hyperinsulinemia; **MARCH1** ubiquitin ligase, ↑ via FOXO1).'], ['🔍', 'But typical IR is mainly a **signaling** defect, and it involves the receptor kinase itself.'], ['📏', 'In this review: IR = ↑ EC50, with or without ↓ maximum.']])));

      // muscle (Fig. 8)
      b.appendChild(IRV.fig('Fig. 8 · IV-B', 'Muscle insulin resistance', 'Defects sit at the **top** of the cascade (INSR kinase, IRS1, PI3K, AKT) → less GLUT4 translocation → ~50% less glycogen synthesis. MAPK signaling stays normal.',
        EP.flow({
          w: 920, h: 240, minW: 680,
          zones: [{ x: 15, y: 50, w: 890, h: 180, label: 'Myocyte', lx: 895, ly: 68, anchor: 'end' }],
          nodes: [
            N('ins', 80, 22, 'Insulin', 'hormone'), N('insr', 80, 95, 'INSR kinase', 'receptor'), N('irs1', 215, 95, 'IRS1 pTyr', 'kinase'), N('pi3k', 345, 95, 'PI3K activity', 'kinase'), N('akt', 465, 95, 'AKT-P', 'kinase'),
            N('glut4', 610, 95, 'GLUT4 translocation', 'transporter'), N('g6p', 800, 95, 'Glucose → G6P', 'glc'), N('gly', 800, 185, 'Glycogen synthesis', 'process'),
            N('mapk', 200, 185, 'MAPK (mitogenic)', 'process'),
          ],
          edges: [E('ins', 'insr'), E('insr', 'irs1'), E('irs1', 'pi3k'), E('pi3k', 'akt'), E('akt', 'glut4'), E('glut4', 'g6p', 'flow', null, { anim: true }), E('g6p', 'gly', 'flow'), E('insr', 'mapk')],
          states: [
            { id: 's', label: '✅ Insulin-sensitive', cap: 'Normal: the IRS1–PI3K–AKT arm drives GLUT4 translocation and glycogen synthesis.' },
            { id: 'r', label: '⚠ Insulin-resistant', n: { insr: { c: 'bad', b: '↓' }, irs1: { c: 'bad', b: '↓' }, pi3k: { c: 'bad', b: '↓' }, akt: { b: '↓' }, glut4: { b: '↓' }, g6p: { b: '↓' }, gly: { b: '↓50%' }, mapk: { c: 'good', b: '↔' } }, e: { 'akt>glut4': 'weak', 'glut4>g6p': 'weak', 'g6p>gly': 'weak' }, cap: 'Obese / T2D / lean offspring of T2D parents: proximal defects; distal defects may just be downstream of them.' },
          ],
        }),
        h('h4', 'Where is the block? Use the MRS logic'), blockQuiz(),
        IRV.pts([['🏋️', 'Muscle takes **70–80%** of glucose in a clamp, but only **25–30%** after a meal.'], ['🧪', 'IR shows in INSR kinase from obese mice, obese/T2D humans, GDM and young lean T2D relatives.']])));

      // liver
      b.appendChild(IRV.fig('IV-C', 'Liver insulin resistance: two different questions', 'Is **glycogen** handling resistant (direct)? Is **gluconeogenesis** not suppressed (mostly indirect, from fat)?',
        h('div.irv-two',
          h('div', h('h4', 'Daily liver glycogen swings'), IRV.mini({ w: 460, h: 210, x: [0, 24], y: [0, 1], xt: [[0, '0'], [7, 'B'], [12, 'L'], [19, 'D'], [24, '24 h']], yt: [[0, 'low'], [1, 'high']], xl: 'Time of day (meals B/L/D)', yl: 'Liver glycogen',
            series: [{ pts: glyDay(1), col: 'var(--tr2)', label: 'Healthy', lx: 20, ly: 0.82 }, { pts: glyDay(0.4), col: 'var(--dn)', label: 'T2D: low & flat', lx: 13.5, ly: 0.2 }] }),
          IRV.cap('T2D: less glycogen after meals **and** during fasting, glycogenolysis lower and poorly suppressed → small, sluggish swings (impaired GCK induction, translocation and GS activation).')),
          h('div', h('h4', 'FOXO1 — does it drive fasting hyperglycemia?'), IRV.ev('FOXO1 evidence', [
            ['y', 'Liver INSR / IRS1+2 / AKT1+2 KO', 'Runaway FOXO1 drives gluconeogenesis; deleting Foxo1 fixes it'],
            ['y', 'FOXO1 ASO in fat-fed mice', 'Improves hepatic insulin action'],
            ['m', 'Human NASH', 'FOXO1 mRNA and nuclear FOXO1 ↑, track HOMA-IR'],
            ['n', 'Fat-fed rats (5 d, 4 wk)', 'Hepatic IR without change in gluconeogenic enzymes'],
            ['n', 'Pck1 −90% in mice', 'Gluconeogenic flux only −40%'],
            ['n', 'Human T2D liver', 'No ↑ G6pc or Pck1 despite fasting hyperglycemia'],
          ], true), IRV.cap('Verdict: total FOXO1 de-repression can drive gluconeogenesis in mice, but there\'s no strong evidence it does in typical human T2D.'))),
        IRV.pts([['🧬', 'Liver INSR knockout (LIRKO): no HGP suppression → rescued by deleting **Foxo1**, not by restoring INSR.'], ['💊', 'INSR ASO (liver + fat): rescued by **atglistatin** (block lipolysis).'], ['📏', 'True hepatic IR should right-shift **glycogen synthesis**, yet may leave gluconeogenesis suppression intact.']])));

      // selective hepatic IR (Fig. 9)
      b.appendChild(IRV.fig('Fig. 9 · IV-D', '"Selective" hepatic insulin resistance — a paradox?', 'Insulin-resistant livers still make lots of fat. The review argues IR is **not selective**: nutrients, fatty acid supply and high insulin drive lipogenesis anyway.',
        EP.flow({
          w: 940, h: 380,
          zones: [{ x: 420, y: 18, w: 510, h: 350, label: 'Hepatocyte', col: 'var(--tr0)', lx: 920, ly: 360, anchor: 'end' }, { x: 15, y: 92, w: 190, h: 86, label: 'White adipose', col: 'var(--m-fat)' }, { x: 225, y: 192, w: 180, h: 176, kind: 'soft', label: 'Nutrients', lx: 235, ly: 360 }],
          nodes: [
            N('ins', 110, 50, 'Portal insulin', 'hormone'),
            N('insr', 480, 50, 'INSR', 'receptor', { info: 'Hepatic IR is traced to the receptor itself (↓ IRK activity in fat-fed rats and human T2D liver; Thr1160 by PKCε) → all arms should be affected.' }),
            N('foxo', 640, 50, 'FOXO1 / glycogen arm', 'tf'), N('glcout', 840, 50, 'Glucose output', 'process'),
            N('srebp', 640, 150, 'SREBP-1c', 'tf'), N('dnl', 840, 150, 'De novo lipogenesis', 'process'),
            N('glc', 315, 220, 'Glucose → ChREBP', 'glc'), N('aa', 315, 275, 'Amino acids → mTORC1', 'metab'), N('fru', 315, 330, 'Fructose', 'glc', { info: 'Potent: substrate push acutely; ChREBP and SREBP-1c activation chronically.' }),
            N('watir', 110, 140, 'Adipose IR\n→ lipolysis ↑', 'bad'), N('nefa', 640, 300, 'Plasma NEFA →\nre-esterification', 'lipid'),
            N('tag', 840, 300, 'Liver TAG (NAFLD)', 'lipid'),
          ],
          edges: [
            E('ins', 'insr'), E('insr', 'foxo'), E('foxo', 'glcout'), E('insr', 'srebp'), E('srebp', 'dnl'), E('dnl', 'tag', 'flow', '~25%', { w: 2.4 }),
            E('glc', 'dnl', 'act', null, { via: [[750, 220], [750, 165]] }), E('aa', 'srebp', 'act', null, { via: [[560, 275], [560, 160]] }), E('fru', 'dnl', 'act'),
            E('watir', 'nefa', 'flow', null, { anim: true, via: [[110, 300]] }), E('nefa', 'tag', 'flow', '~60%', { anim: true, w: 5 }),
          ],
          states: [
            { id: 'norm', label: 'Normal (fed)', n: { glcout: { b: '↓' }, dnl: { b: '↑' }, glc: { c: 'off' }, aa: { c: 'off' }, fru: { c: 'off' }, watir: { c: 'off' } }, e: { 'glc>dnl': 'off', 'aa>srebp': 'off', 'fru>dnl': 'off', 'watir>nefa': 'off' }, cap: 'Normal: insulin → INSR → both arms. Even normally, most liver TG comes from re-esterified plasma fatty acids, not DNL.' },
            { id: 'sel', label: '💭 "Selective IR" hypothesis', n: { insr: { b: '½' }, foxo: { c: 'bad', b: '✕' }, glcout: { b: '↑' }, srebp: { c: 'good', b: '✓' }, dnl: { b: '↑' }, tag: { b: '↑' }, glc: { c: 'off' }, aa: { c: 'off' }, fru: { c: 'off' }, watir: { c: 'off' } }, e: { 'insr>foxo': 'off', 'glc>dnl': 'off', 'aa>srebp': 'off', 'fru>dnl': 'off', 'watir>nefa': 'off' }, cap: 'Hypothesis: a signaling **branch point** after INSR — glucose arm resistant, lipid arm sensitive. No branch point has held up (below).' },
            { id: 'res', label: '✅ Review\'s explanation', n: { insr: { c: 'bad', b: '↓' }, foxo: { b: '↓' }, glcout: { b: '↑' }, srebp: { b: '↔' }, ins: { b: '↑↑' }, dnl: { b: '↑' }, nefa: { b: '↑↑' }, tag: { b: '↑↑' } }, e: { 'nefa>tag': 'thick', 'watir>nefa': 'thick' }, cap: 'All arms are resistant, but **hyperinsulinemia** keeps the very sensitive SREBP-1c arm going, **nutrients** drive lipogenesis without insulin, and **fatty acid re-esterification** (~60% of liver TG) needs no insulin at all.' },
          ],
        }),
        IRV.chipRow([['n', 'IRS1 = glucose / IRS2 = lipid — not corroborated'], ['m', 'AKT pThr308 vs pSer473 substrates — no direct support'], ['y', 'SREBP-1c arm ~4× more insulin-sensitive than FOXO1 arm'], ['y', 'Total hepatic IR (LIRKO) → **less** TG and DNL'], ['y', 'Fat-fed rats: DNL ↓ (resistant)'], ['y', 'Raising plasma FA alone → liver TG']]),
        h('h4', 'Bonus: less insulin is cleared by the liver'),
        EP.flow({ w: 920, h: 90, minW: 640, nodes: [N('a', 165, 45, '↓ Surface INSR\n(CEACAM1 · MARCH1 · CHIP · p31comet)', 'receptor'), N('b', 420, 45, '↓ Hepatic insulin\nclearance', 'bad'), N('c', 620, 45, 'Hyperinsulinemia', 'hormone'), N('d', 810, 45, 'Fasting insulin / HOMA-IR\n(crude liver readout)', 'note')], edges: [E('a', 'b', 'bad'), E('b', 'c', 'bad'), E('c', 'd', 'plain')] })));

      b.appendChild(IRV.fig('Table 1', 'Measuring hepatic insulin resistance', 'Pick readouts with **no indirect component** to make claims about the hepatocyte itself; use several.', IRV.readouts()));

      // adipose IR
      b.appendChild(IRV.fig('IV-E', 'Adipose insulin resistance — the linchpin?', 'Because lipolysis suppression is so steep, even **mild** fat-cell IR floods liver and muscle with fatty acid and glycerol.',
        EP.flow({
          w: 940, h: 300,
          zones: [{ x: 15, y: 15, w: 330, h: 275, label: 'White adipose', col: 'var(--m-fat)' }],
          nodes: [
            N('insr', 180, 55, 'INSR kinase ↓ · surface INSR ↓', 'receptor', { info: 'Both reversed by weight loss. Molecular cause of the adipocyte defect is largely unknown.' }),
            N('lip', 110, 140, 'Lipolysis not\nsuppressed', 'bad'), N('glu', 260, 140, 'Glucose uptake ↓', 'bad'),
            N('g3p', 260, 210, 'Glycerol-3-P ↓\n→ re-esterification ↓', 'lipid'), N('chrebp', 110, 250, 'ChREBP ↓ → less\n"nutrient sink"', 'tf'),
            N('flux', 470, 140, 'NEFA + glycerol\nturnover ↑↑', 'lipid', { info: 'Concentrations rise only modestly in well-controlled T2D, but **flux** (turnover) is much higher. Obesity per se does not raise plasma NEFA → it is a functional defect, not fat mass.' }),
            N('liv', 720, 60, 'Liver: acetyl-CoA → PC →\ngluconeogenesis ↑; glycerol → glucose', 'process'),
            N('ihtg', 720, 140, 'Liver fat (IHTG) →\nhepatic IR', 'lipid'), N('imcl', 720, 220, 'Muscle lipid (IMCL) →\nmuscle IR', 'lipid'),
          ],
          edges: [E('insr', 'lip', 'bad'), E('insr', 'glu', 'bad'), E('glu', 'g3p', 'bad'), E('g3p', 'flux', 'flow'), E('lip', 'flux', 'flow', null, { anim: true, via: [[180, 140], [180, 105], [400, 105]] }), E('glu', 'chrebp', 'bad'),
            E('flux', 'liv', 'flow', null, { anim: true }), E('flux', 'ihtg', 'flow', null, { anim: true }), E('flux', 'imcl', 'flow', null, { anim: true })],
        }),
        h('div.irv-two',
          h('div', h('h4', 'Fat storage swings shrink too'), IRV.mini({ w: 460, h: 200, x: [0, 10], y: [-1, 1], xt: [[0, ''], [3, 'meal'], [7, 'meal']], yt: [[-1, 'release'], [0, '0'], [1, 'storage']], xl: 'Time', yl: 'Net FA flux',
            series: [{ pts: storeDay(1), col: 'var(--tr2)', label: 'Lean', lx: 4.2, ly: 0.92 }, { pts: storeDay(0.45), col: 'var(--dn)', label: 'Abdominal obesity', lx: 5.2, ly: -0.62 }] }),
          IRV.cap('Lean men release more fat when fasting **and** store more after meals; obese men do less of both → ingested fat ends up elsewhere.')),
          h('div', IRV.pts([['🧮', '**Adipo-IR** = fasting insulin × fasting NEFA; rises from normal → IGT → T2D (validated vs clamp).'], ['⏱️', 'Present after only **3 days** of high-fat feeding in rats — before inflammation.'], ['🧪', 'Adipose GLUT4 knockout → liver **and** muscle IR without weight change.'], ['🦴', 'Lipodystrophy (no fat) → extreme, reversible insulin resistance.'], ['❓', 'Debated: more lipolysis, or less fatty-acid storage (↑ FA "escape", ↓ FABP4)?']])))));

      // experimental considerations
      b.appendChild(IRV.fig('Fig. 10 · IV-F', 'Reading a glucose tolerance test', 'A glucose curve alone can\'t separate **secretion** from **action** — you need the insulin curve (Himsworth\'s point).', IRV.gtt()));
      b.appendChild(IRV.fig('Fig. 11', 'Tracer methods: measure flux, not just levels', 'Insulin acts on **fluxes**; concentration changes are only their consequence.',
        clampDiagram(),
        IRV.cards([
          { ico: tracerIcon('var(--tr1)', 'A'), t: 'Glucose output (EGP)', p: '[3-³H]/[6,6-²H]/[¹³C] glucose in a euglycemic clamp. EGP = Rd − infusion rate. Includes some kidney gluconeogenesis.', v: ['n', 'IR: less suppression'] },
          { ico: tracerIcon('var(--tr2)', 'B'), t: 'Whole-body uptake (Rd)', p: 'Same tracers. 70–80% of clamp Rd is muscle.', v: ['n', 'IR: Rd ↓'] },
          { ico: tracerIcon('var(--tr3)', 'C'), t: 'Tissue uptake', p: '2-[¹⁴C]deoxyglucose bolus: trapped as 2-DG-6-P in muscle/fat (not liver).', v: ['n', 'IR: uptake ↓'] },
          { ico: tracerIcon('var(--tr0)', 'D'), t: 'Liver glycogen synthesis', p: '[U-¹³C]glucose (m+6) in a **hyperglycemic** clamp; glucose must be matched.', v: ['n', 'IR: synthesis ↓'] },
          { ico: tracerIcon('var(--tr4)', 'E'), t: 'De novo lipogenesis', p: '²H₂O for days (slow, transcriptional process).', v: ['n', 'IR (fat-fed rodent): DNL ↓'] },
          { ico: tracerIcon('var(--m-fat)', 'F'), t: 'Lipolysis', p: '[U-¹³C]palmitate, [²H₅]glycerol. Glycerol Ra is better (palmitate can be re-esterified).', v: ['n', 'IR: less suppression'] },
        ])));
      b.appendChild(IRV.fig('IV-G', 'From "what" to "why": how to prove a cause', 'Finding something changed in insulin-resistant tissue is not enough.',
        IRV.cards([
          { t: '① Sufficient?', p: 'Does adding/activating it cause IR?' },
          { t: '② Necessary?', p: 'Does removing it prevent IR?' },
          { t: '③ In humans?', p: 'Is it active in typical obesity-associated human IR?' },
          { t: '⏱ Earliest defect', p: 'Study the first days of overnutrition, not end-stage disease. Secondary defects can still be good drug targets.' },
        ])));
    },
  });

  // ---- small helpers for chapter IV
  function glyDay(a) {
    // schematic: healthy liver glycogen rises after each meal and falls between/overnight; T2D = lower and damped
    const meals = [7, 12, 19]; const pts = [];
    let g = 0.5;
    for (let t = 0; t <= 24; t += 0.25) {
      const fed = meals.some((m) => t >= m && t < m + 3);
      g = Math.max(0.28, Math.min(0.92, g + (fed ? 0.045 : -0.012)));
      pts.push([t, a === 1 ? g : 0.14 + 0.4 * (g - 0.28)]);
    }
    return pts;
  }
  function storeDay(a) { const pts = []; for (let t = 0; t <= 10; t += 0.1) { const m = (x) => Math.exp(-Math.pow((t - x - 1.4) / 1.1, 2)); pts.push([t, a * (-0.7 + 1.6 * (m(3) + m(7)))]); } return pts.map(([t, v]) => [t, Math.max(-1, Math.min(1, v))]); }
  function tracerIcon(col, l) { return EP.s('svg', { class: 'irv-ico', viewBox: '0 0 28 28' }, EP.s('circle', { cx: 14, cy: 14, r: 12, style: `fill:color-mix(in srgb, ${col} 25%, transparent);stroke:${col};stroke-width:2` }), EP.s('text', { x: 14, y: 18.5, 'text-anchor': 'middle', style: `font-size:12px;font-weight:800;fill:${col}` }, l)); }
  function clampDiagram() {
    return EP.flow({
      w: 920, h: 150, minW: 640,
      nodes: [N('ins', 110, 40, 'Insulin infusion\n(fixed, high)', 'hormone'), N('glc', 110, 112, 'Glucose infusion\n(adjusted = GIR)', 'glc'), N('p', 380, 75, 'Plasma glucose held at baseline\n(euglycemia)', 'process'),
        N('rd', 640, 40, 'Rd = total uptake\n(~75% muscle)', 'process'), N('egp', 640, 112, 'EGP = Rd − GIR', 'process'), N('si', 840, 75, 'GIR ↓ = insulin\nresistance', 'bad')],
      edges: [E('ins', 'p'), E('glc', 'p', 'flow'), E('p', 'rd', 'plain'), E('p', 'egp', 'plain'), E('rd', 'si', 'plain'), E('egp', 'si', 'plain')],
      cap: 'Hyperinsulinemic-euglycemic clamp (Andres): matches insulin across subjects, so secretion differences drop out.',
    });
  }
  /** "Where is the block?" — the ¹³C/³¹P-MRS argument (sect. IV-B). */
  function blockQuiz() {
    const W = 520, H = 170;
    const svg = EP.s('svg', { class: 'irv-mini', viewBox: `0 0 ${W} ${H}` });
    const res = h('p.irv-res');
    const OPT = {
      gs: { l: 'Glycogen synthase', g: 1.35, p: 1.5, ok: false, why: 'A block at GS would back up **G6P and glucose** — but both were **low**.' },
      hk: { l: 'Hexokinase', g: 1.5, p: 0.7, ok: false, why: 'A hexokinase block would raise free **glucose** inside the cell — it was low.' },
      tr: { l: 'Glucose transport (GLUT4)', g: 0.6, p: 0.65, ok: true, why: '✓ Only a **transport** block lowers both. Matches ¹³C/³¹P-MRS in T2D and their lean offspring.' },
    };
    const meas = { g: 0.6, p: 0.65 };
    function draw(k) {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const base = 120, sc = 60;
      const bar = (x, v, col, lab) => { const hgt = v * sc; svg.appendChild(EP.s('rect', { x, y: base - hgt, width: 46, height: hgt, rx: 4, style: `fill:color-mix(in srgb, ${col} 55%, transparent);stroke:${col}` })); svg.appendChild(EP.s('text', { x: x + 23, y: base + 16, 'text-anchor': 'middle', style: 'font-size:11px;fill:var(--muted)' }, lab)); };
      svg.appendChild(EP.s('line', { x1: 20, x2: W - 10, y1: base - sc, y2: base - sc, style: 'stroke:var(--faint);stroke-dasharray:4 3' }));
      svg.appendChild(EP.s('text', { x: W - 12, y: base - sc - 4, 'text-anchor': 'end', style: 'font-size:10px;fill:var(--muted)' }, 'healthy level'));
      [['Free glucose', 'g', 40], ['G6P', 'p', 290]].forEach(([n, key, x0]) => {
        svg.appendChild(EP.s('text', { x: x0 + 50, y: 16, 'text-anchor': 'middle', style: 'font-size:12px;font-weight:700;fill:var(--text)' }, n + ' in muscle'));
        if (k) bar(x0, OPT[k][key], 'var(--tr0)', 'predicted');
        bar(x0 + 56, meas[key], 'var(--dn)', 'measured');
      });
    }
    draw(null);
    res.innerHTML = '<span class="muted">Insulin-stimulated glycogen synthesis is ~50% lower in T2D. Which step is rate-limiting? Pick a suspect:</span>';
    const btns = h('div.irv-quizrow', Object.entries(OPT).map(([k, o]) => h('button.chip', { onclick: (ev) => { btns.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === ev.target)); draw(k); res.innerHTML = EP.md(o.why); } }, 'Block at ' + o.l)));
    return h('div.irv-31', h('div', svg), h('div', btns, res));
  }
})();
