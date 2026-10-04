/* Insulin action & insulin resistance — a readable physiology chapter built from
 * Petersen MC & Shulman GI, Mechanisms of insulin action and insulin resistance, Physiol Rev 2018;98:2133–2223.
 * Prose first: each section explains the physiology in the order the review builds it (normal action →
 * indirect action → what resistance is → where it is → why it happens → the integrated model).
 * Diagrams are static schematics redrawn from the review's figures; numbers are the ones the review quotes. */
(function () {
  'use strict';
  const EP = window.EP;
  const { h } = EP;

  // ------------------------------------------------------------------ diagram helpers (static SVG strings)
  let figN = 0;
  const COL = { hormone: 'var(--c-hormone)', receptor: 'var(--c-receptor)', kinase: 'var(--c-kinase)', enzyme: 'var(--c-enzyme)', tf: 'var(--c-tf)', met: 'var(--c-metabolite)', tr: 'var(--c-transporter)', proc: 'var(--c-process)', bad: 'var(--c-inhib)', mute: 'var(--faint)', organ: 'var(--c-organ)' };
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /** nodes: [id, cx, cy, w, 'line1|line2', colorKey]; edges: [from, to, 'act'|'inh'|'flow', label, color, fromSide, toSide]; panels: [x, y, w, h, title] */
  function flow(W, H, nodes, edges, panels) {
    const id = 'rdf' + (++figN);
    const N = {};
    nodes.forEach(([k, x, y, w, label, c]) => { const lines = label.split('|'); N[k] = { x, y, w, h: 16 * lines.length + 12, lines, c: COL[c] || c }; });
    const side = (n, sd) => sd === 't' ? [n.x, n.y - n.h / 2] : sd === 'b' ? [n.x, n.y + n.h / 2] : sd === 'l' ? [n.x - n.w / 2, n.y] : [n.x + n.w / 2, n.y];
    const auto = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y; return Math.abs(dy) * 2.2 > Math.abs(dx) ? (dy > 0 ? ['b', 't'] : ['t', 'b']) : (dx > 0 ? ['r', 'l'] : ['l', 'r']); };
    let out = `<svg viewBox="0 0 ${W} ${H}" class="rd-svg rd-flow" role="img"><defs>
      <marker id="${id}a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker>
      <marker id="${id}i" viewBox="0 0 4 14" refX="2" refY="7" markerWidth="4" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto"><path d="M2,0 L2,14" stroke="context-stroke" stroke-width="3"/></marker></defs>`;
    (panels || []).forEach(([x, y, w, hh, t]) => { out += `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="14" class="rd-panel"/><text x="${x + 12}" y="${y + 18}" class="rd-ptitle">${esc(t)}</text>`; });
    edges.forEach(([f, t, kind, label, color, fs, ts]) => {
      const a = N[f], b = N[t]; const [s1, s2] = auto(a, b);
      const p = side(a, fs || s1), q = side(b, ts || s2);
      const c = color || (kind === 'inh' ? 'var(--c-inhib)' : kind === 'act' ? 'var(--c-stim)' : 'var(--muted)');
      const mk = kind === 'inh' ? `url(#${id}i)` : `url(#${id}a)`;
      // stop the line a few px short so the marker sits on the box edge
      const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, k = kind === 'inh' ? 3 : 2;
      out += `<line x1="${p[0]}" y1="${p[1]}" x2="${(q[0] - dx / L * k).toFixed(1)}" y2="${(q[1] - dy / L * k).toFixed(1)}" stroke="${c}" stroke-width="2" marker-end="${mk}"${kind === 'flow' ? ' stroke-dasharray="5 4"' : ''}/>`;
      if (label) {
        const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, horiz = Math.abs(dx) > Math.abs(dy);
        out += `<text x="${mx + (horiz ? 0 : 7)}" y="${my + (horiz ? -6 : 4)}" class="rd-elab" text-anchor="${horiz ? 'middle' : 'start'}" style="fill:${c}">${esc(label)}</text>`;
      }
    });
    Object.values(N).forEach((n) => {
      out += `<rect x="${n.x - n.w / 2}" y="${n.y - n.h / 2}" width="${n.w}" height="${n.h}" rx="9" style="fill:color-mix(in srgb, ${n.c} 15%, var(--panel));stroke:${n.c}" stroke-width="1.5"/>`;
      n.lines.forEach((l, i) => { out += `<text x="${n.x}" y="${n.y - n.h / 2 + 20 + i * 16}" text-anchor="middle" class="${i ? 'rd-nsub' : 'rd-ntxt'}">${esc(l)}</text>`; });
    });
    return out + '</svg>';
  }

  // Hill-curve chart for the dose–response figures
  function doseChart(curves, opts) {
    const W = 460, H = 270, l = 50, r = 14, t = 14, b = 44, iw = W - l - r, ih = H - t - b;
    const X = (i) => l + (Math.log10(i) - 0) / 3 * iw, Y = (v) => t + (1 - v) * ih;
    let o = `<svg viewBox="0 0 ${W} ${H}" class="rd-svg" role="img">`;
    if (opts.band) o += `<rect x="${X(opts.band[0])}" y="${t}" width="${X(opts.band[1]) - X(opts.band[0])}" height="${ih}" style="fill:color-mix(in srgb, var(--accent) 10%, transparent)"/><text x="${(X(opts.band[0]) + X(opts.band[1])) / 2}" y="${t + 14}" text-anchor="middle" class="rd-elab" style="fill:var(--accent)">${esc(opts.bandLabel)}</text>`;
    [1, 10, 100, 1000].forEach((v) => { o += `<line x1="${X(v)}" x2="${X(v)}" y1="${t}" y2="${t + ih}" stroke="var(--grid)"/><text x="${X(v)}" y="${t + ih + 15}" text-anchor="middle" class="rd-axis">${v}</text>`; });
    [0, 0.5, 1].forEach((v) => { o += `<line x1="${l}" x2="${l + iw}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--grid)"/><text x="${l - 6}" y="${Y(v) + 4}" text-anchor="end" class="rd-axis">${v * 100}%</text>`; });
    o += `<rect x="${l}" y="${t}" width="${iw}" height="${ih}" fill="none" stroke="var(--line)"/>`;
    o += `<text x="${l + iw / 2}" y="${H - 6}" text-anchor="middle" class="rd-axis" style="font-weight:600">${esc(opts.x)}</text>`;
    o += `<text transform="translate(13,${t + ih / 2}) rotate(-90)" text-anchor="middle" class="rd-axis" style="font-weight:600">${esc(opts.y)}</text>`;
    curves.forEach((c) => {
      let d = '';
      for (let i = 0; i <= 120; i++) { const x = Math.pow(10, i / 40), v = c.max * Math.pow(x, c.n) / (Math.pow(c.ec, c.n) + Math.pow(x, c.n)); d += (i ? 'L' : 'M') + X(x).toFixed(1) + ',' + Y(v).toFixed(1); }
      o += `<path d="${d}" fill="none" stroke="${c.c}" stroke-width="2.6"${c.dash ? ' stroke-dasharray="6 4"' : ''}/>`;
      if (c.mark) o += `<line x1="${X(c.ec)}" x2="${X(c.ec)}" y1="${Y(c.max / 2)}" y2="${t + ih}" stroke="${c.c}" stroke-dasharray="3 3"/><circle cx="${X(c.ec)}" cy="${Y(c.max / 2)}" r="4" fill="${c.c}"/>`;
    });
    o += '</svg>';
    const key = h('div.rd-legend', curves.map((c) => h('span', h('i', { style: { background: c.c } }), c.label)));
    return h('div', h('div', { html: o }), key);
  }

  // ------------------------------------------------------------------ the figures
  const FIG = {
    proximal: () => flow(820, 470, [
      ['ins', 410, 26, 120, 'Insulin', 'hormone'],
      ['insr', 410, 92, 330, 'Insulin receptor (α₂β₂ tyrosine kinase)|trans-autophosphorylates Tyr1162, 1158, 1163', 'receptor'],
      ['irs', 410, 172, 230, 'IRS1 / IRS2|scaffold, phospho-Tyr docks PI3K', 'kinase'],
      ['shc', 690, 172, 150, 'SHC / GRB2|(binds pTyr972)', 'mute'],
      ['mapk', 690, 252, 150, 'MAPK|growth: mitogenic arm', 'mute'],
      ['pi3k', 410, 252, 210, 'PI3K (p85 + p110)|PIP₂ → PIP₃ at membrane', 'kinase'],
      ['pten', 140, 252, 150, 'PTEN|PIP₃ → PIP₂ (insulin ⊣)', 'bad'],
      ['akt', 410, 332, 290, 'AKT2|Thr308 by PDK1 · Ser473 by mTORC2', 'kinase'],
      ['as', 85, 428, 150, 'AS160/TBC1D4 ⊣|GLUT4 to membrane', 'tr'],
      ['gsk', 248, 428, 150, 'GSK3 ⊣, PP1|glycogen synthase', 'enzyme'],
      ['foxo', 410, 428, 150, 'FOXO1 ⊣ (exported)|↓ G6pc, Pck1 · ↑ Gck', 'tf'],
      ['mtor', 572, 428, 150, 'mTORC1|SREBP-1c, protein', 'kinase'],
      ['pde', 735, 428, 150, 'PDE3B|↓ cAMP → ↓ lipolysis', 'enzyme'],
    ], [
      ['ins', 'insr', 'act'], ['insr', 'irs', 'act'], ['insr', 'shc', 'flow', '', null, 'r', 't'], ['shc', 'mapk', 'flow'],
      ['irs', 'pi3k', 'act'], ['pten', 'pi3k', 'inh'], ['pi3k', 'akt', 'act'],
      ['akt', 'as', 'act'], ['akt', 'gsk', 'act'], ['akt', 'foxo', 'act'], ['akt', 'mtor', 'act'], ['akt', 'pde', 'act'],
      ['mtor', 'irs', 'inh', 'S6K1 → IRS1 Ser-P (feedback)', null, 't', 'r'],
    ]),
    axis: () => flow(960, 380, [
      ['i1', 135, 32, 170, 'Insulin|indirect route', 'hormone'],
      ['lip', 135, 140, 200, 'Lipolysis|TG → NEFA + glycerol', 'proc'],
      ['gly', 135, 300, 130, 'Glycerol', 'met'],
      ['box', 400, 140, 150, 'β-oxidation', 'enzyme'],
      ['aco', 400, 225, 160, 'Mitochondrial|acetyl-CoA', 'met'],
      ['pyr', 640, 140, 170, 'Pyruvate|(lactate, alanine)', 'met'],
      ['pc', 640, 225, 160, 'Pyruvate|carboxylase', 'enzyme'],
      ['gng', 640, 300, 170, 'Gluconeogenesis', 'proc'],
      ['i2', 850, 32, 170, 'Insulin (portal)|direct route', 'hormone'],
      ['gls', 850, 140, 170, 'Net glycogenolysis', 'proc'],
      ['hgp', 850, 300, 170, 'Hepatic glucose|production', 'organ'],
    ], [
      ['i1', 'lip', 'inh', '', 'var(--tr0)'], ['lip', 'box', 'act', 'NEFA', 'var(--tr0)'], ['lip', 'gly', 'act', '', 'var(--tr0)'],
      ['box', 'aco', 'act', '', 'var(--tr0)'], ['aco', 'pc', 'act', '+ allosteric', 'var(--tr0)'], ['pyr', 'pc', 'act'], ['pc', 'gng', 'act', '', 'var(--tr0)'],
      ['gly', 'gng', 'act', 'glycerol = substrate', 'var(--tr0)'], ['gng', 'hgp', 'act'], ['gls', 'hgp', 'act'],
      ['i2', 'gls', 'inh', '', 'var(--tr1)'],
    ], [[20, 80, 235, 290, 'White adipose tissue'], [300, 80, 650, 290, 'Liver']]),
    dag: () => flow(900, 320, [
      ['g3p', 70, 50, 110, 'Glycerol-3-P', 'met'],
      ['lpa', 215, 50, 100, 'Lyso-PA', 'met'],
      ['pa', 380, 50, 150, 'Phosphatidic acid', 'met'],
      ['dag', 560, 50, 120, 'sn-1,2-DAG', 'bad'],
      ['tag', 760, 50, 130, 'Triglyceride', 'met'],
      ['atgl', 790, 150, 190, 'ATGL lipolysis → sn-1,3|does not activate PKC', 'mute'],
      ['pkc', 560, 150, 220, 'Novel PKC translocates|PKCε (liver) · PKCθ (muscle)', 'kinase'],
      ['insr', 560, 255, 270, 'Liver: INSR pThr1160|activation loop → kinase inhibited', 'receptor'],
      ['irs', 200, 255, 300, 'Muscle: IRS1 Ser1101, GIV Ser1689|→ ↓ PI3K–AKT → ↓ GLUT4', 'receptor'],
    ], [
      ['g3p', 'lpa', 'act', 'GPAT'], ['lpa', 'pa', 'act', 'AGPAT'], ['pa', 'dag', 'act', 'lipin'], ['dag', 'tag', 'act', 'DGAT'],
      ['tag', 'atgl', 'flow', '', 'var(--faint)', 'b', 't'],
      ['dag', 'pkc', 'act'], ['pkc', 'insr', 'inh'], ['pkc', 'irs', 'inh', '', null, 'l', 't'],
    ]),
    model: () => flow(960, 440, [
      ['over', 480, 28, 220, 'Chronic overnutrition', 'bad'],
      ['stress', 480, 112, 250, 'Adipocyte nutrient stress|adipose insulin resistance, cell death', 'organ'],
      ['mac', 300, 150, 150, 'Macrophages|TNFα, IL-1β', 'tf'],
      ['lip', 480, 290, 200, 'Lipolysis ↑|NEFA + glycerol flux', 'proc'],
      ['imcl', 120, 192, 200, 'Muscle lipid (IMCL)|→ DAG → PKCθ', 'met'],
      ['upt', 120, 300, 200, 'Muscle GLUT4|glucose uptake ↓', 'tr'],
      ['ihtg', 720, 192, 230, 'Liver fat (IHTG) → DAG → PKCε|↓ insulin-driven glycogen synthesis', 'met'],
      ['aco', 850, 300, 190, 'Acetyl-CoA → PC ↑|glycerol → glucose', 'enzyme'],
      ['hgp', 680, 395, 200, 'Hepatic glucose output ↑|(gluconeogenesis)', 'organ'],
      ['glc', 400, 395, 160, 'Plasma glucose ↑', 'hormone'],
      ['beta', 130, 395, 220, 'β-cell compensates|(hyperinsulinemia) → fails → T2D', 'kinase'],
    ], [
      ['over', 'stress', 'act'], ['over', 'imcl', 'act', '', null, 'l', 't'], ['over', 'ihtg', 'act', '', null, 'r', 't'],
      ['stress', 'mac', 'act', '', null, 'l', 'r'], ['mac', 'lip', 'act', '', null, 'b', 'l'], ['stress', 'lip', 'act', 'adipose IR'],
      ['lip', 'imcl', 'act', 'NEFA', null, 'l', 'r'], ['lip', 'ihtg', 'act', 'NEFA', null, 'r', 'b'], ['lip', 'aco', 'act', 'NEFA, glycerol', null, 'r', 'l'],
      ['imcl', 'upt', 'inh'], ['ihtg', 'hgp', 'act', '', null, 'b', 't'], ['aco', 'hgp', 'act', '', null, 'b', 'r'],
      ['hgp', 'glc', 'act'], ['upt', 'glc', 'act', 'less disposal', null, 'b', 't'], ['glc', 'beta', 'act'],
    ]),
  };

  // ------------------------------------------------------------------ content building blocks
  const P = (html) => h('p', { html });
  const H3 = (t) => h('h3.rd-h3', t);
  const UL = (items) => h('ul.rd-ul', items.map((x) => h('li', { html: x })));
  const box = (kind, title, html) => h('div.rd-box.rd-' + kind, h('div.rd-boxt', title), typeof html === 'string' ? h('div', { html }) : html);
  const KEY = (html) => box('key', 'Key idea', html);
  const HOW = (html) => box('how', 'How we know', html);
  const MYTH = (html) => box('myth', 'Common misconception', html);
  const FIGURE = (svgHtml, cap) => h('figure.rd-fig', typeof svgHtml === 'string' ? h('div.rd-scroll', { html: svgHtml }) : svgHtml, h('figcaption', { html: cap }));
  const CHECK = (qs) => h('div.rd-check', h('div.rd-boxt', 'Check yourself'), qs.map(([q, a]) => h('details', h('summary', { html: q }), h('p', { html: a }))));

  // ------------------------------------------------------------------ chapters
  const CH = [
    {
      id: 'overview', t: 'The big picture', sub: 'What insulin is for, and the two ways it acts',
      body: () => [
        P('Insulin is the body\'s <b>fed-state signal</b>. When it rises after a meal, three target tissues each do a different job, and together they produce one integrated, glucose-lowering, energy-storing response:'),
        h('div.rd-tri',
          h('div', { html: '<b>Skeletal muscle</b><br>Takes glucose up (GLUT4) and stores it as glycogen. Muscle keeps its glycogen for its own use.' }),
          h('div', { html: '<b>Liver</b><br>Stops releasing glucose, stores glycogen, and over hours turns on fat and protein synthesis and turns down gluconeogenic genes.' }),
          h('div', { html: '<b>White adipose tissue</b><br>Stops lipolysis, which is its most important job, takes up some glucose and stores fat.' })),
        P('The striking thing is that the <b>first steps of signaling are the same in all three cells</b>: receptor → IRS → PI3K → AKT. The different outcomes come from <i>distal</i> effectors that each tissue expresses.'),
        P('The second big idea of the review is that insulin acts in two ways:'),
        UL([
          '<b>Direct (cell-autonomous) action</b>: insulin binds a receptor on the cell and changes what <i>that</i> cell does, for example muscle GLUT4 translocation or hepatic glycogen synthesis.',
          '<b>Indirect action</b>: insulin acts on one tissue, and that changes what reaches another. The most important example is that insulin stops <b>adipose lipolysis</b>, which takes fatty acids and glycerol away from the liver and so <b>shuts down hepatic gluconeogenesis</b>. Insulin also suppresses glucagon inside the islet.',
        ]),
        KEY('To understand insulin resistance you have to keep asking two questions: <b>which action</b> has become resistant (glucose uptake? glycogen synthesis? lipolysis?), and is that action <b>direct or indirect</b>? A lot of apparent paradoxes in the field go away once those two questions are answered.'),
      ],
    },
    {
      id: 'proximal', t: 'Proximal signaling: receptor to AKT', sub: 'The common trunk shared by every insulin-responsive cell',
      body: () => [
        H3('The receptor'),
        P('The insulin receptor (INSR) is a <b>receptor tyrosine kinase</b> made of two extracellular α subunits, which bind insulin, and two membrane-spanning β subunits, which carry the tyrosine kinase. The <b>B isoform</b> is the metabolic one in adult liver, muscle and fat. The A isoform lacks exon 11, binds IGF-2 well and predominates in the fetus.'),
        P('Although it has two binding sites, the receptor shows <b>negative cooperativity</b>: binding at one site lowers affinity at the other, so at physiological concentrations <b>one insulin molecule activates one receptor</b>. Binding changes the shape of the β subunits, relieves autoinhibition and lets each β subunit phosphorylate the other\'s activation loop on <b>Tyr1162, Tyr1158 and Tyr1163</b>, in that order. Further phosphorylation, for example on juxtamembrane Tyr972, creates docking sites.'),
        H3('Scaffolds, not direct targets'),
        P('Unlike many receptor tyrosine kinases, INSR mostly does not phosphorylate enzymes itself. It recruits <b>phosphotyrosine-binding scaffold proteins</b>, which lets the signal branch early:'),
        UL([
          '<b>IRS1 and IRS2</b> drive the metabolic arm. Knocking out both in muscle or liver looks like knocking out the receptor itself. IRS proteins also carry more than 70 serine/threonine sites that tune or inhibit them, and that is where many causes of insulin resistance are thought to act.',
          '<b>SHC and GRB2</b> drive the mitogenic (MAPK) arm. Metabolic responses need <i>less</i> insulin than mitogenic ones. For the IGF-1 receptor it is the other way round.',
        ]),
        H3('PI3K → PIP₃ → AKT'),
        P('Tyrosine-phosphorylated IRS (YXXM motifs) recruits <b>PI3K</b> through its p85 regulatory subunit. The p110 catalytic subunit converts PIP₂ to <b>PIP₃</b> in the membrane, while insulin also restrains <b>PTEN</b>, which runs the reaction backwards. PIP₃ brings PDK1 and <b>AKT</b> together: PDK1 phosphorylates AKT <b>Thr308</b> and mTORC2 phosphorylates <b>Ser473</b>. AKT is the main point where the signal fans out to its many substrates.'),
        P('<b>AKT2</b> is the metabolic isoform. Akt2-knockout mice are severely glucose intolerant, and a partial loss-of-function <i>AKT2</i> variant carried by about 1% of Finns lowers insulin-stimulated glucose uptake and raises glucose production.'),
        FIGURE(FIG.proximal(), '<b>Figure 1. The shared trunk and the tissue-specific branches</b> (after Figs. 1, 2, 4, 5). Green arrows activate and red bars inhibit. "⊣" inside a box means AKT <i>inhibits</i> that protein: AS160, GSK3 and FOXO1 are all switched <i>off</i> by AKT phosphorylation. The dashed grey arm is mitogenic signaling.'),
        H3('Built-in brakes and accelerators'),
        UL([
          '<b>Negative feedback:</b> mTORC1 (switched on by insulin) activates <b>S6K1</b>, which phosphorylates IRS1 on serines. mTORC1 also stabilizes <b>GRB10</b>, which binds and inhibits the receptor. The receptor is later internalized (CEACAM1) and dephosphorylated by <b>PTP1B</b>.',
          '<b>Feed-forward:</b> immediately after activation, the receptor makes NOX4 produce H₂O₂, which <i>inhibits</i> PTP1B and amplifies the early signal. GIV/Girdin also boosts PI3K–AKT.',
        ]),
        MYTH('"AKT Ser473 phosphorylation = insulin action." Ser473 is the most common readout, but it has many inputs besides insulin (mTORC2 is partly IRS-independent and nutrient-sensitive). It is a convenient marker, not a measure of a physiological effect.'),
        CHECK([
          ['Why is insulin\'s metabolic signaling more sensitive than its growth signaling?', 'The receptor\'s metabolic arm (IRS → PI3K → AKT) responds at lower insulin concentrations than the mitogenic (SHC/GRB2 → MAPK) arm. Note, though, that in obese and T2D muscle the <b>MAPK arm stays insulin-sensitive</b> while the metabolic arm becomes resistant.'],
          ['Name one negative-feedback loop that insulin itself switches on.', 'Insulin → AKT → mTORC1 → S6K1 → serine phosphorylation of IRS1, which reduces its tyrosine phosphorylation. Another is mTORC1 stabilizing GRB10, which inhibits the receptor.'],
        ]),
      ],
    },
    {
      id: 'muscle', t: 'Skeletal muscle: get glucose in, store it', sub: 'GLUT4 translocation and glycogen synthesis',
      body: () => [
        P('Muscle uses energy. It is not an exporter of glucose; what it stores it keeps, apart from the lactate and alanine it releases, which mostly go back to the liver. For muscle, insulin means <i>"glucose is plentiful: take it in and store it."</i> Muscle needs its own insulin receptor for this: muscle-specific INSR-knockout mice have impaired insulin-stimulated uptake and glycogen synthesis. The main scaffold in muscle is <b>IRS1</b> and the key kinase is <b>AKT2</b>.'),
        H3('Glucose uptake: "releasing the brakes" on GLUT4'),
        P('GLUT4 sits inside the cell in <b>GLUT4 storage vesicles (GSVs)</b>. Two PI3K-dependent routes move it to the surface:'),
        UL([
          '<b>AKT → TBC1D4 (AS160) and TBC1D1.</b> These are GTPase-activating proteins (GAPs) that keep Rab GTPases (RAB8, 10, 14) in their inactive GDP state. AKT phosphorylation (TBC1D4 <b>Thr649</b>) inactivates the GAPs, so Rabs stay GTP-bound and vesicles move and fuse. This is insulin <b>releasing the brakes</b>. A Thr649Ala knock-in mouse is glucose intolerant, a family with a truncating <i>TBC1D4</i> mutation is severely insulin resistant, and deleting both TBC1D1 and TBC1D4 abolishes insulin-stimulated muscle glucose uptake.',
          '<b>RAC1 → cortical actin remodeling.</b> Muscle RAC1 knockout severely impairs uptake even though AKT is activated normally, and constitutively active RAC1 moves GLUT4 without insulin.',
        ]),
        H3('Where the glucose goes'),
        P('About <b>75%</b> of insulin-stimulated glucose disposal in human muscle goes to <b>glycogen</b>, in both healthy and type 2 diabetic people. Oxidation also rises: insulin shifts fasting rat soleus from about 5% to about 60% of TCA flux coming from glucose. Insulin increases <b>hexokinase II</b> transcription, which slowly raises glycolytic capacity.'),
        H3('Glycogen synthase: allostery beats phosphorylation'),
        P('The textbook story is that AKT phosphorylates and <b>inactivates GSK3</b> (Ser21/Ser9) while insulin activates <b>PP1</b> (targeted to glycogen by its G<sub>M</sub> subunit), so glycogen synthase (GS) becomes dephosphorylated and active. The genetic experiments tell a more interesting story:'),
        HOW('Mice whose GSK3 cannot be phosphorylated by insulin (Ser21/9→Ala) have <b>normal</b> insulin-stimulated glycogen synthesis. Mice whose GS cannot be activated by <b>glucose-6-phosphate</b> have <b>severely impaired</b> synthesis and less glycogen.'),
        P('So the main acute control of GS is <b>allosteric activation by G6P</b>. Phosphorylation mostly sets how sensitive GS is to G6P. The consequence matters: <b>glycogen synthesis is coupled to glucose transport</b>. Get more glucose in, make more G6P, make more glycogen.'),
        P('Net glycogen gain also needs <b>glycogen phosphorylase switched off</b>, otherwise glycogen just cycles. Insulin dephosphorylates phosphorylase kinase and phosphorylase itself (Ser15, via PP1), and G6P inhibits phosphorylase allosterically.'),
        KEY('In muscle, almost everything downstream follows substrate. <b>The glucose transport step (GLUT4) is the control point</b>, which is why it is also where muscle insulin resistance shows up (chapter 7).'),
        CHECK([
          ['If GSK3 regulation is dispensable, why does insulin still stimulate muscle glycogen synthesis?', 'Because insulin increases glucose transport, which raises G6P, and G6P allosterically activates glycogen synthase (and inhibits phosphorylase). Dephosphorylation makes GS more sensitive to G6P but is not the main switch.'],
        ]),
      ],
    },
    {
      id: 'liver', t: 'Liver: glycogen, genes and fat', sub: 'Direct hepatocellular actions, fast and slow',
      body: () => [
        P('Insulin is secreted into the portal vein, so the liver sees <b>2–3 times</b> the insulin concentration of the general circulation. In the hepatocyte, insulin promotes synthesis of all three macromolecules (glycogen, lipid and protein) and rapidly lowers <b>hepatic glucose production (HGP)</b>. IRS1 and IRS2 are largely redundant here (both must go to cause a severe phenotype), p110α is the key PI3K, and branching happens <b>after AKT</b>: GSK3 (glycogen), FOXO1 (gluconeogenic genes) and mTORC1 (lipogenesis and protein synthesis).'),
        H3('1 · Glycogen: insulin permits, glucose drives'),
        P('Hepatocyte glucose entry is <b>not</b> insulin-regulated: GLUT2 equilibrates glucose across the membrane. So <b>glucose itself is a major regulator</b>:'),
        UL([
          'Glucose binds and <b>inhibits liver glycogen phosphorylase</b> allosterically. Unlike the muscle enzyme, liver phosphorylase hardly responds to AMP or G6P; its key allosteric inhibitor is glucose.',
          'Hyperglycemia moves <b>glucokinase</b> from the nucleus to the cytoplasm, increasing glucose → G6P flux.',
        ]),
        P('Insulin\'s contributions: it <b>induces glucokinase (Gck) transcription</b> rapidly and potently, helps glucokinase translocate, raises G6P activation of glycogen synthase (GYS2), dephosphorylates GYS2 Ser7 via PP1, inhibits GSK3, and inactivates phosphorylase (phosphorylase kinase ⊣, PP1 →). AKT is essential: liver Akt1/Akt2 knockouts make no net glycogen on refeeding even though GSK3 is still phosphorylated, and their glucokinase is minimal. Glucokinase expression has a large share of control over glycogen synthetic flux, and people with T2D have reduced hepatic glucokinase.'),
        KEY('The physiological rule: <b>hyperinsulinemia increases glycogen synthetic flux; hyperglycemia suppresses glycogenolysis; you need both for net hepatic glycogen synthesis.</b> Half-maximal net synthesis needs portal insulin of about <b>20–25 µU/mL</b> under hyperglycemic, low-glucagon conditions. Insulin is permissive; <b>portal glucose is the driver</b>.'),
        H3('2 · Gluconeogenic genes: slow transcriptional control'),
        P('AKT phosphorylates <b>FOXO1</b> (Thr24, Ser256, Ser319), which excludes it from the nucleus. When active and nuclear, FOXO1 and its coactivator PGC1α turn on <b>G6pc</b> (glucose-6-phosphatase) and <b>Pck1</b> (PEPCK), and FOXO1 with SIN3A <i>represses</i> glucokinase. A second module, <b>CREB/CBP/CRTC2</b>, dominates gluconeogenic gene expression in the first hours of a fast; FOXO1/PGC1α takes over in longer fasts. Insulin also shuts CRTC2 down: SIK2 phosphorylates it on Ser171, it leaves the nucleus and is degraded.'),
        P('These programs are powerful when fully unrestrained (hepatic FOXO1 deletion rescues the hyperglycemia of liver insulin-receptor knockout mice). But they are <b>slow</b>: two hours of insulin does not detectably lower G6pc protein. They cannot explain why insulin suppresses gluconeogenesis <b>within minutes</b>. That fast effect is mostly indirect (chapter 5).'),
        P('One fast, direct, non-transcriptional mechanism does exist. Glucagon/cAMP phosphorylates the bifunctional enzyme PFK-2/FBPase-2, lowering fructose-2,6-bisphosphate and releasing the brake on FBPase-1. Insulin counteracts that phosphorylation. It probably matters most when glucagon or catecholamine tone is high.'),
        H3('Where fasting glucose comes from'),
        P('Liver glycogen falls roughly <b>exponentially</b> during a fast: it is nearly gone by about 12 h in rats and about 48 h in humans. <b>Gluconeogenesis stays roughly constant</b> for the first ~48 h, until lactate and alanine supply runs short. In humans, glycogenolysis supplies about 40% of HGP over the first 22 h of a fast. In overnight-fasted rodents, gluconeogenesis supplies almost all of it. A nice consequence is that during a fast, <b>plasma glucose (and insulin) report how much glycogen the liver has left</b>.'),
        H3('3 · Lipid: SREBP-1c and ACC'),
        P('Insulin increases <b>SREBP-1c</b> transcription and promotes its cleavage and nuclear entry (through PI3K → AKT → mTORC1; S6K is needed for processing). SREBP-1c drives <b>ACC1 (Acaca), fatty acid synthase (Fasn) and GPAT1 (Gpam)</b>, the de novo lipogenesis (DNL) program. It is <b>slow</b>: nuclear SREBP-1 appears about 8 h after insulin in hepatocytes. Faster effects are glucokinase induction (more substrate) and acute <b>ACC activation</b> by dephosphorylation of Ser79/Ser212, probably through AMPK inhibition. Insulin also lowers plasma triglyceride within 15 min (less VLDL export, more clearance).'),
        P('Keep the size of these fluxes in mind. Hepatic triglyceride comes about <b>60% from re-esterification of circulating fatty acids</b>, about 25% from DNL and about 15% from dietary fat. This becomes important for understanding fatty liver.'),
        H3('4 · Protein: mTORC1'),
        P('AKT relieves TSC2 and PRAS40 inhibition of <b>mTORC1</b>, which phosphorylates S6K and 4E-BP1/2 to increase translation. mTORC1 also integrates amino-acid availability, feeds back on IRS1 and the receptor, and supports VLDL secretion (phosphatidylcholine synthesis).'),
        CHECK([
          ['Why can hyperglycemia alone suppress hepatic glycogenolysis, but not drive net glycogen synthesis?', 'Glucose allosterically inhibits liver phosphorylase (and GLUT2 lets glucose equilibrate without insulin), so glycogen breakdown stops. Increasing synthesis also needs insulin\'s effects: glucokinase induction and translocation, GYS2 activation, and the AKT-dependent program.'],
          ['Why can\'t FOXO1 explain insulin\'s suppression of gluconeogenesis after a meal?', 'Insulin suppresses gluconeogenic flux within minutes, but FOXO1-driven changes in enzyme protein take many hours. The acute effect is mainly indirect, through adipose lipolysis.'],
        ]),
      ],
    },
    {
      id: 'adipose', t: 'White adipose tissue: the lipolysis brake', sub: 'The most insulin-sensitive action in the body',
      body: () => [
        P('The adipocyte is <b>exquisitely sensitive</b> to insulin. Suppression of lipolysis has an ED50 of about <b>20 µU/mL</b>, and healthy plasma insulin runs from about 5 to 60 µU/mL, so lipolysis uses most of its range within normal life. Whole-body glucose uptake, by contrast, has an ED50 of about 60 µU/mL and is maximal only above 200 µU/mL. The response is also fast: raising insulin to postprandial levels suppresses plasma NEFA by about <b>90% within 5 min</b> in rats, which is possible because plasma NEFA have a half-life of only <b>2–4 min</b>.'),
        FIGURE(doseChart([
          { label: 'Suppression of adipose lipolysis (ED50 ≈ 20)', ec: 20, n: 2, max: 1, c: 'var(--tr0)', mark: true },
          { label: 'Whole-body glucose uptake (ED50 ≈ 60, max > 200)', ec: 60, n: 1.6, max: 1, c: 'var(--tr1)', mark: true },
        ], { x: 'Plasma insulin, µU/mL (log scale)', y: 'Fraction of maximal effect', band: [5, 60], bandLabel: 'normal daily range' }), '<b>Figure 2. Lipolysis is the most insulin-sensitive action.</b> Schematic curves anchored to the ED50 values the review quotes. Within the normal daily range of insulin, lipolysis swings across most of its range while glucose uptake uses only part of its range. This is why even mild adipose insulin resistance changes fatty-acid delivery a lot.'),
        H3('How lipolysis is switched on'),
        P('Catecholamines → β-adrenergic receptors → cAMP → <b>PKA</b>, which phosphorylates two proteins:'),
        UL([
          '<b>Perilipin 1 (PLIN1)</b> coats the lipid droplet. When phosphorylated it releases <b>CGI-58</b>, which binds and activates <b>ATGL</b> about 20-fold. ATGL performs the first step (TAG → DAG).',
          '<b>Hormone-sensitive lipase (HSL)</b> is phosphorylated (Ser563, 659, 660) and moves to the droplet surface, where it acts mostly as a <b>DAG lipase</b>. Full HSL activation also needs phosphorylated perilipin.',
        ]),
        H3('How insulin switches it off'),
        UL([
          '<b>PDE3B</b> degrades cAMP, which reduces PKA signaling to HSL and perilipin. AKT can phosphorylate PDE3B (Ser273), but AKT is not strictly required: Akt2-knockout mice still suppress lipolysis normally. Adipocytes lacking PDE3B do not suppress stimulated lipolysis.',
          '<b>Protein phosphatase 1</b>, the main perilipin phosphatase, is activated by insulin and actively removes the phosphates.',
        ]),
        P('So insulin both <b>turns down the kinase</b> and <b>turns up the phosphatase</b>.'),
        H3('Net lipolysis = lipolysis − re-esterification'),
        P('Like hepatic glycogen, fat balance is a net of two opposing fluxes. Released fatty acids can be re-esterified, and that needs <b>glycerol-3-phosphate</b>, which comes largely from glucose taken up and run through glycolysis. Insulin also activates adipose <b>lipoprotein lipase</b>. Re-esterification seems to depend more on substrate supply than on a direct insulin switch. Insulin also activates SREBP-1c in fat, but adipocyte DNL is a minor source of stored fat; esterification of preformed fatty acids dominates.'),
        H3('Glucose uptake into fat: small flux, big consequences'),
        P('GLUT4 translocation in fat uses AKT → AS160 → RAB10, plus AKT-independent routes (TC10 and TUG cleavage, which releases vesicles held at the Golgi). Fat takes up <b>less than 5%</b> of an oral glucose load, yet deleting GLUT4 only in adipose tissue makes <b>liver and muscle</b> insulin resistant. Adipocyte glucose uptake supplies glycerol-3-phosphate for storing fat and activates ChREBP lipogenic genes, which lets fat act as a <b>nutrient sink</b> that keeps lipid away from other organs.'),
        KEY('Adipose tissue is not an inert store. It may be the <b>linchpin of whole-body insulin sensitivity</b>: lipodystrophy (too little fat) causes extreme, reversible insulin resistance.'),
      ],
    },
    {
      id: 'indirect', t: 'Indirect action: the adipose → liver axis', sub: 'How insulin really shuts off gluconeogenesis',
      body: () => [
        P('This is the central physiological idea of the review, and it is underappreciated.'),
        H3('The fasting state'),
        P('Adipocytes release <b>NEFA</b> and <b>glycerol</b>. In the hepatocyte, NEFA are β-oxidized to <b>mitochondrial acetyl-CoA</b>, an <b>allosteric activator of pyruvate carboxylase (PC)</b>, the first committed step of gluconeogenesis from pyruvate (lactate, alanine). Glycerol is a gluconeogenic substrate in its own right; its conversion to glucose is mostly <b>substrate-driven</b>. So adipose lipolysis powers hepatic gluconeogenesis twice over: by activating PC and by supplying carbon.'),
        H3('After insulin'),
        P('Insulin suppresses lipolysis → plasma NEFA and glycerol turnover fall → hepatic acetyl-CoA falls → <b>PC flux falls</b> → gluconeogenesis falls, all within minutes. At the same time, insulin acts <b>directly</b> on the hepatocyte to stop net glycogenolysis and start glycogen synthesis.'),
        FIGURE(FIG.axis(), '<b>Figure 3. Two routes to lower hepatic glucose production</b> (after Fig. 6). Orange is the <b>indirect</b> route: insulin acts on fat, and less NEFA and glycerol reach the liver. Blue is the <b>direct</b> route: portal insulin acts on the hepatocyte\'s glycogen metabolism.'),
        HOW('<ul class="rd-ul"><li>Pancreatectomized dogs (1966): blocking lipolysis with nicotinic acid lowered both NEFA and glucose production.</li><li>A low-dose peripheral insulin infusion that did not change portal insulin or glucagon still suppressed HGP in humans.</li><li>In fasted dogs, infusing lipid during a clamp completely prevented insulin from suppressing NEFA <i>and</i> HGP.</li><li>Clamped rats (Perry 2015): lipolysis, hepatic acetyl-CoA, PC flux and HGP fell together. Infusing <b>acetate</b> (to keep acetyl-CoA up) plus <b>glycerol</b> abolished insulin\'s suppression of PC flux and HGP.</li><li>Mice lacking hepatic Akt1, Akt2 <i>and</i> Foxo1 still suppress HGP normally, but not when acetate and glycerol are infused.</li><li>Rats with the insulin receptor knocked down in liver and fat could not suppress HGP until lipolysis was blocked with the ATGL inhibitor <b>atglistatin</b>.</li></ul>'),
        KEY('A useful simplification: <b>insulin controls glycogenolysis directly and gluconeogenesis indirectly (via fat)</b>. So the <b>direct</b> effect dominates in a glycogen-full (fed) liver, and the <b>indirect</b> effect dominates in a glycogen-depleted (fasted) liver. Humans and dogs keep hepatic glycogen overnight; rats and mice do not. That species difference explains much of the conflicting literature.'),
        P('This matters for disease: the extra glucose output in poorly controlled type 2 diabetes is due <b>entirely to increased gluconeogenesis</b>, not to glycogenolysis.'),
        H3('Other indirect actions'),
        UL([
          '<b>Glucagon suppression:</b> insulin acts on neighbouring α-cells (via PI3K and phosphodiesterase lowering cAMP) to suppress glucagon. Mice lacking α-cell insulin receptors are hyperglucagonemic. Mice without glucagon receptors do not become diabetic when their β-cells are destroyed, which shows how much glucagon contributes to the hyperglycemia of insulin deficiency.',
          '<b>Brain:</b> insulin suppresses appetite. Brain insulin can lower HGP in rodents, but in dogs with the normal portal–peripheral gradient preserved, blocking brain insulin signaling did not change suppression of HGP. Its role in normal physiology remains uncertain.',
          '<b>Leptin:</b> low leptin in starvation and DKA activates the HPA axis, which drives lipolysis and gluconeogenesis. Leptin replacement reverses this, and leptin also suppresses glucagon.',
        ]),
        CHECK([
          ['A mouse has no hepatic insulin signaling but normal adipose insulin action. During a clamp after an overnight fast, does insulin suppress its glucose production?', 'Yes, largely. In a glycogen-depleted rodent liver, HGP is almost all gluconeogenesis, which insulin controls indirectly by suppressing lipolysis. This is the result in the Akt1/Akt2/Foxo1 triple-knockout mice.'],
          ['Two routes link lipolysis to gluconeogenesis. What are they?', '(1) NEFA → hepatic β-oxidation → acetyl-CoA → allosteric activation of pyruvate carboxylase; (2) glycerol → gluconeogenic substrate.'],
        ]),
      ],
    },
    {
      id: 'what', t: 'What insulin resistance is', sub: 'A shifted dose–response curve, not an off switch',
      body: () => [
        P('A person is <b>insulin resistant</b> when it takes <b>more insulin</b> to produce the normal integrated response: suppressing glucose production, suppressing lipolysis, taking up glucose and making glycogen. The β-cell compensates by secreting more, so <b>fasting insulin rises</b>. Insulin resistance is the best predictor of future type 2 diabetes, but diabetes itself needs a <b>β-cell defect as well</b>. Overnutrition plus insulin resistance drives a cycle of hyperinsulinemia and worsening resistance until the β-cell fails, likely through glucose and lipid toxicity. Weight loss and calorie restriction reverse the tissue defects, even in people with T2D.'),
        FIGURE(doseChart([
          { label: 'Normal', ec: 30, n: 1.6, max: 1, c: 'var(--tr2)', mark: true },
          { label: 'Fewer receptors: right shift only', ec: 100, n: 1.6, max: 1, c: 'var(--tr1)', dash: true },
          { label: 'Signaling defect: right shift + lower max', ec: 100, n: 1.6, max: 0.62, c: 'var(--tr3)', mark: true },
        ], { x: 'Insulin (log scale)', y: 'Biological response' }), '<b>Figure 4. Two shapes of insulin resistance</b> (after Fig. 7). Because cells have <b>spare receptors</b>, losing receptors only shifts the curve right; the maximum falls only when fewer than about 5–10% of receptors remain. A defect in signal transduction lowers the maximum as well. Human obesity-associated insulin resistance in muscle, liver and fat looks like the pink curve.'),
        P('Early work argued over "receptor" versus "post-receptor" defects. Both are present: surface receptor number is reduced (partly down-regulation by chronic hyperinsulinemia, partly active removal, for example MARCH1 ubiquitinating the receptor), and receptor <b>kinase activity</b> is reduced, so even the "post-receptor" defect begins at the receptor itself. The field now simply calls a higher EC50, with or without a lower maximum, "insulin resistance".'),
        KEY('Because insulin resistance is a <b>shift</b>, not an on/off switch, <b>hyperinsulinemia can largely overcome it</b> in mild-to-moderate disease. Keep this in mind for "selective" hepatic insulin resistance in the next chapter.'),
      ],
    },
    {
      id: 'tissues', t: 'Where it is: resistance in each tissue', sub: 'Which actions fail in muscle, liver and fat',
      body: () => [
        H3('Muscle: the transport step fails'),
        P('Muscle takes up <b>70–80%</b> of glucose during a hyperinsulinemic clamp, but only about 25–30% after a real meal. Insulin-stimulated muscle glycogen synthesis is about <b>50% lower</b> in T2D and in <b>lean, healthy, insulin-resistant offspring</b> of people with T2D. But a low flux at the end of a pathway doesn\'t tell you where the block is.'),
        HOW('¹³C and ³¹P magnetic resonance spectroscopy measured intracellular <b>glucose and G6P</b>. If the block were at hexokinase or glycogen synthase, those metabolites would pile up. Instead they were <b>low</b>, so the rate-controlling defect is <b>glucose transport (GLUT4 translocation)</b>.'),
        P('The signaling defects are <b>proximal</b>: reduced receptor kinase activity, IRS1 tyrosine phosphorylation, IRS1-associated PI3K activity and AKT activation. MAPK (mitogenic) signaling stays normal. Proximal defects may be enough to explain the whole uptake defect.'),
        H3('Liver: an altered glycogen cycle, metabolite-driven gluconeogenesis'),
        UL([
          '<b>Gluconeogenesis is increased</b> in T2D and is the proximate cause of fasting hyperglycemia. But does it come from loss of FOXO1 control? Probably not in typical human disease: human T2D liver shows <b>no increase in G6pc or Pck1</b>, fat-fed rats become hepatically insulin resistant without any change in gluconeogenic enzymes, and cutting Pck1 by more than 90% lowers gluconeogenic flux by only about 40%. The excess is better explained as <b>metabolite-driven</b> (NEFA → acetyl-CoA → PC; glycerol).',
          '<b>Glycogen:</b> T2D livers make less glycogen after meals, have less fasting glycogen, and break it down less and suppress breakdown less. The daily glycogen swing is <b>damped</b>: glycogen stays relatively static instead of rising with meals and falling with fasts.',
          '<b>Reading HGP:</b> because acute suppression of gluconeogenesis is mainly indirect, impaired suppression of HGP in a fasted subject may reflect <b>adipose</b> insulin resistance as much as hepatic. True hepatic insulin resistance should impair insulin-stimulated <b>glycogen synthesis</b>.',
          '<b>Insulin clearance falls:</b> fewer surface receptors (CEACAM1, MARCH1 and other regulators) mean the liver clears less insulin, which adds to hyperinsulinemia.',
        ]),
        H3('The "selective hepatic insulin resistance" paradox'),
        P('If insulin promotes lipogenesis, an insulin-resistant liver should make <b>less</b> fat. Total genetic hepatic insulin resistance (no receptor) does: DNL and plasma triglyceride fall. Yet ordinary insulin-resistant livers are <b>fatty</b>. The usual explanation is that the FOXO1 (glucose) arm becomes resistant while the SREBP-1c (lipid) arm stays sensitive.'),
        P('The review offers a simpler explanation: <b>hepatic insulin resistance is not selective; fat accumulates through routes that do not need insulin</b>.'),
        UL([
          '<b>Substrate push:</b> re-esterification of circulating fatty acids, the largest source of liver triglyceride, increases simply because more NEFA arrive, partly <i>because of</i> adipose insulin resistance. Raising plasma fatty acids is enough to build hepatic triglyceride without hepatic insulin signaling.',
          '<b>Insulin-independent DNL drivers:</b> ChREBP (glucose), mTORC1 → SREBP-1c (amino acids), and <b>fructose</b>, which acts as substrate acutely and activates both ChREBP and SREBP-1c chronically. These explain the high DNL seen in human NAFLD.',
          '<b>Hyperinsulinemia:</b> the SREBP-1c arm is intrinsically more insulin-sensitive (about 4× more receptor inhibitor is needed to block it than to block FOXO1 inactivation), so high portal insulin can still drive it along a right-shifted curve.',
        ]),
        P('A supporting observation: in <b>high-fat-fed</b> rats, which get few of these nutrient signals, DNL actually <b>falls</b>, as you would expect from a resistant pathway. And the signaling defect in fatty, resistant livers is at the <b>receptor kinase</b>, the most proximal point, which should affect every arm.'),
        H3('Adipose: lipolysis escapes control'),
        UL([
          'Adipose receptor kinase activity and receptor number fall in T2D; both recover with weight loss.',
          'Plasma NEFA are high in poorly controlled T2D, but the bigger change is in <b>flux</b>: NEFA and glycerol <b>turnover</b> rise much more than concentration, and so does gluconeogenesis from glycerol. Insulin suppression of glycerol turnover is impaired in obese adolescents, people with T2D and their first-degree relatives.',
          'Obesity alone does not predict plasma NEFA, so this is a <b>functional</b> defect, not just more fat mass. An adipose IR index (fasting insulin × fasting NEFA) rises steadily from normal tolerance through IGT to T2D.',
          'The fat "amplitude" is damped too: less release when fasting and <b>less storage after meals</b>, so ingested fat ends up in other tissues.',
          'In rats it appears after <b>3 days</b> of high-fat feeding, before any inflammation. One mechanism: if insulin-stimulated glucose uptake fails, there is less glycerol-3-phosphate to re-esterify fatty acids.',
        ]),
        KEY('Because the lipolysis curve is so steep, even <b>modest adipose insulin resistance</b> substantially increases fatty-acid delivery to liver and muscle. That drives both hepatic gluconeogenesis (via acetyl-CoA) and ectopic lipid (chapter 8). Adipose sensitivity is a double-edged sword: it lets fat be the first responder to excess nutrients, and makes it the first to be stressed.'),
        CHECK([
          ['In muscle, why do low intracellular glucose and G6P point to transport as the defect?', 'If transport were normal but a downstream step were blocked, glucose and G6P would accumulate behind the block. Low levels mean not enough glucose is getting in.'],
          ['Give three insulin-independent reasons a resistant liver can still become fatty.', 'Re-esterification of excess circulating fatty acids (substrate push, partly from adipose IR); nutrient-driven DNL through ChREBP, mTORC1/SREBP-1c and fructose; and hyperinsulinemia acting on the more sensitive SREBP-1c arm.'],
        ]),
      ],
    },
    {
      id: 'lipid', t: 'Why: lipid-induced insulin resistance', sub: 'Randle, ectopic lipid, DAG–PKC, ceramides',
      body: () => [
        H3('The Randle cycle, and why it is not the answer'),
        P('In the 1960s Randle proposed the <b>glucose–fatty acid cycle</b>. Oxidizing more fat raises mitochondrial acetyl-CoA/CoA and NADH/NAD⁺, which <b>inhibits PDH</b>. Citrate inhibits <b>PFK-1</b>, G6P accumulates and inhibits <b>hexokinase</b>, and glucose builds up in the cell.'),
        HOW('MRS during lipid infusions in humans found that intramyocellular <b>G6P and glucose fell</b> instead of rising. Glycolysis and glycogen synthesis fell because of <b>impaired glucose transport</b>, not Randle allostery. Lipid-induced muscle resistance also takes <b>3–5 h</b> to appear. Mice with constitutively active muscle PDH (Pdk2/4 knockout), in which the Randle cycle cannot operate, still develop lipid-induced muscle insulin resistance.'),
        P('Randle\'s cycle is still real physiology for <b>choosing between fuels</b>. It operates in the first ~3 h of a lipid infusion, and its mirror image (glucose → malonyl-CoA ⊣ CPT-1) restrains fat oxidation in the fed state. But it does not explain insulin resistance. Any mechanism has to explain how lipid <b>impairs insulin signaling</b> to GLUT4.'),
        H3('The ectopic lipid hypothesis'),
        P('Storing fat in <b>adipose tissue</b>, especially subcutaneous, is appropriate. Fat stored in <b>liver and muscle</b> ("ectopic") is associated with insulin resistance in those tissues.'),
        UL([
          '<b>Liver:</b> intrahepatic triglyceride (IHTG) is one of the strongest predictors of hepatic insulin resistance. About two-thirds of obese people, and nearly all obese people with T2D, have NAFLD. In T2D, <b>modest weight loss</b> that lowers IHTG normalizes suppression of HGP and fasting glucose. Removing omental fat without lowering IHTG does not help; visceral fat is more a marker of liver fat than a cause.',
          '<b>Redistribution experiments:</b> lipodystrophy (no fat depots) gives massive IHTG and severe insulin resistance, reversed by fat transplantation or leptin. <b>Adiponectin-transgenic ob/ob mice</b> weigh up to twice as much as ob/ob mice but store the fat in adipose tissue, have less liver fat and normal insulin sensitivity. The 2,4-dinitrophenol uncoupler lowers IHTG and restores hepatic insulin action.',
          '<b>Muscle:</b> intramyocellular lipid (IMCL) strongly predicts insulin resistance in normal-weight people, but endurance athletes have high IMCL and are very insulin sensitive (the <b>athlete\'s paradox</b>). So stored triglyceride itself is not the culprit.',
        ]),
        KEY('"If all excess energy could be stored in white adipose tissue, ectopic lipid-induced insulin resistance could not develop." The question then becomes: <b>which lipid intermediate</b>, in <b>which compartment</b>, interferes with signaling?'),
        H3('The DAG–novel PKC axis'),
        P('<b>Diacylglycerol (DAG)</b> is the second-to-last intermediate in triglyceride synthesis (Kennedy pathway) and a classic signaling lipid that activates PKC. Of the three PKC families, <b>novel PKCs (δ, ε, θ, η)</b> need DAG but not Ca²⁺, bind DAG with about twice the affinity of conventional PKCs, and stay activated slowly and persistently. That makes them suited to sense chronic lipid accumulation.'),
        FIGURE(FIG.dag(), '<b>Figure 5. From lipid oversupply to a blocked insulin receptor</b> (after Figs. 14–17). Lipogenic <b>sn-1,2-DAG</b>, made on the ER and probably acting at the Golgi and plasma membrane, activates novel PKCs. DAG made by lipolysis on the lipid droplet (ATGL) is <b>sn-1,3</b> and does not activate PKC.'),
        UL([
          '<b>Liver → PKCε.</b> In 3-day fat-fed rats, PKCε was the only liver PKC isoform that translocated, and in human liver biopsies PKCε translocation tracks DAG content and HOMA-IR. PKCε phosphorylates the insulin receptor on <b>Thr1160</b> in the kinase activation loop. A phosphomimetic (Thr→Glu) receptor is nearly kinase-dead, and knock-in mice with an un-phosphorylatable residue are <b>protected</b> from high-fat-diet hepatic insulin resistance. Knocking down PKCε also protects. This is the one fully defined chain from a specific lipid to impaired hepatic insulin signaling.',
          '<b>Muscle → PKCθ</b> (and ε). PKCθ translocation rises with muscle DAG in fat-fed rats, during lipid infusion in humans, and in T2D. Proposed targets include IRS1 Ser1101, PDK1 and GIV Ser1689, all of which weaken PI3K–AKT signaling. PKCθ-knockout mice are fully protected from lipid-infusion insulin resistance.',
        ]),
        P('<b>Location and stereochemistry matter.</b> Many apparent exceptions (fatty livers with high DAG but normal insulin action, for example CGI-58 knockdown) involve DAG on the <b>lipid droplet</b> or sn-1,3-DAG, and PKCε moving to the droplet instead of the membrane. In human muscle, T2D raised sn-1,2-DAG specifically in the <b>sarcolemmal</b> (plasma-membrane) fraction, and athletes show less PKCθ translocation than obese people despite similar total DAG. The working model is that <b>lipogenic sn-1,2-DAG in membranes</b>, not stored fat, is the signal.'),
        H3('Ceramides'),
        P('Ceramides (serine + palmitoyl-CoA → sphingolipids) are proposed to inhibit <b>AKT</b>, via PP2A dephosphorylation and atypical PKCζ blocking AKT translocation. Evidence is <b>strongest in muscle</b> (C18:0 ceramides correlate with clamp insulin resistance in several human studies). But ceramides <b>are not necessary</b>: oleate causes as much functional resistance as palmitate without raising ceramide, many models are insulin resistant without more ceramide, and hepatic ceramide did not correlate with insulin resistance in 3 of 4 human studies. A pure AKT-level defect would also be expected to <i>increase</i> proximal signaling (loss of feedback), but proximal defects are what is observed. Adiponectin receptors have <b>ceramidase</b> activity, and liver acid-ceramidase overexpression protects against hepatic insulin resistance, so ceramides may still contribute.'),
        H3('Acylcarnitines and metabolic inflexibility'),
        P('Fat-fed muscle oxidizes more fatty acid but <b>incompletely</b>, accumulating acylcarnitines. The review interprets this mainly as <b>metabolic inflexibility</b>: insulin-resistant muscle cannot switch to glucose after a meal because GLUT4 translocation is impaired while fat supply is high. So acylcarnitines are more likely a <b>consequence</b> than a cause. Plasma acylcarnitines mostly reflect the liver and do not reliably report muscle.'),
        MYTH('"Insulin resistance is caused by fat stores." What seems to matter is <b>where</b> lipid is (ectopic vs adipose), <b>which</b> species (sn-1,2-DAG) and <b>which compartment</b> (membranes vs droplet), not total fat mass. Athletes and adiponectin-transgenic mice show that a lot of stored fat can coexist with normal insulin action.'),
        CHECK([
          ['What MRS finding ruled out the Randle cycle as the cause of lipid-induced muscle insulin resistance?', 'Intramyocellular G6P and free glucose fell rather than rose, which places the defect at glucose transport, upstream of the steps Randle proposed.'],
          ['How does PKCε make the liver insulin resistant?', 'Membrane sn-1,2-DAG activates PKCε, which phosphorylates INSR Thr1160 in the activation loop and inhibits the receptor\'s tyrosine kinase, reducing signaling to every downstream arm.'],
        ]),
      ],
    },
    {
      id: 'stress', t: 'Why: nutrient stress in organelles', sub: 'ER stress and mitochondria',
      body: () => [
        H3('ER stress / unfolded protein response'),
        P('Overnutrition activates the UPR (PERK, IRE1, ATF6). The original model: ER stress → <b>JNK</b> → inhibitory IRS1 Ser307 phosphorylation. Several findings argue against that as the main route: IRS1 Ser307Ala mice are <i>more</i> insulin resistant; liver-specific JNK knockout <i>worsens</i> steatosis; and liver-specific <b>XBP1</b> knockout mice have <b>more ER stress but less hepatic lipogenesis and better insulin sensitivity</b>.'),
        P('A better explanation is that ER stress works <b>through lipid</b>. XBP1s turns on DNL, and ER stress induces lipin-2, which makes DAG and activates PKCε. In fat, ER stress may increase lipolysis through PKA and perilipin, a functional insulin resistance even when insulin signaling is intact. In muscle, the evidence for ER stress is weak.'),
        H3('Mitochondria and oxidative stress'),
        UL([
          '<b>Lower mitochondrial ATP synthesis</b> (³¹P-MRS) is seen in the elderly, prediabetic people and lean insulin-resistant offspring of people with T2D. Less oxidation favors <b>lipid storage → IMCL → DAG/PKCθ</b>. Risk genes fit this picture: <i>SLC16A11</i> variants (about 30% allele frequency in people of Mexican descent, accounting for roughly 20% of their excess T2D risk) reduce fatty-acid oxidation in liver cells, which then accumulate acylcarnitines, DAG and TAG.',
          'But <b>mitochondrial flux is set by ATP demand, not supply</b>. Fat feeding raises oxidative capacity, yet IMCL still builds up, and even forcing fatty-acid oxidation (AMPK activators, ACC2 deletion) does not prevent fat-fed muscle insulin resistance.',
          'When substrate oxidation exceeds ATP demand, mitochondria release <b>H₂O₂</b>. Within 3 days of high-fat feeding the cell becomes more oxidized (lower GSH/GSSG). Mice expressing mitochondria-targeted catalase are protected from diet- and age-related muscle insulin resistance, with less DAG/PKCθ activation. But 78 randomized antioxidant trials showed no mortality benefit.',
          'Severe mitochondrial knockouts (Tfam, Aif) actually <i>increase</i> glucose uptake (more glycolysis, AMPK). The lipid-storage mechanism probably applies to <b>mild</b> (<40%) reductions in oxidative capacity.',
        ]),
        KEY('Both organelle stresses seem to <b>feed into the lipid pathway</b>: ER stress drives lipogenesis, and limited mitochondrial ATP demand favors lipid storage and ROS. That makes them amplifiers rather than independent causes.'),
      ],
    },
    {
      id: 'systemic', t: 'Why: inflammation and circulating factors', sub: 'Macrophages, BCAAs, adipokines and hepatokines',
      body: () => [
        H3('Adipose inflammation'),
        P('Expanding fat is stressed. Adipocytes die, <b>macrophages</b> gather in "crown-like structures" around dead cells, and neutrophils, NK cells and B cells join in. The "two-hit" model is that activated macrophages release <b>TNFα, IL-1β</b> and others, which impair insulin signaling in target cells, and JNK links cytokines to IRS1. Acute inflammation is actually <i>needed</i> for healthy fat remodeling, and blocking it increases ectopic fat; it is <b>chronic</b> inflammation that is maladaptive.'),
        P('The review\'s view is that inflammation acts mainly <b>through lipolysis</b>. TNFα lowers perilipin and FSP27 and so increases lipolysis, and dead adipocytes spill fatty acids. In fat-fed mice lacking macrophage JNK, lipolysis fell and HGP suppression improved. More NEFA then means <b>more ectopic lipid and more acetyl-CoA-driven gluconeogenesis</b>, which joins the inflammatory and lipid models.'),
        HOW('Inflammation is probably <b>not the primary insult</b>. Adipose insulin resistance appears after 1 week of high-fat feeding, but macrophage infiltration becomes prominent only around 12 weeks. T2D risk variants are not enriched in immune-cell regulatory DNA, unlike autoimmune diseases. Lipodystrophy causes severe insulin resistance without much fat inflammation. Anti-TNF drugs have not consistently improved insulin sensitivity in humans.'),
        H3('Branched-chain amino acids'),
        P('Leucine, isoleucine and valine are higher in obesity and predict T2D, partly because adipose BCAA breakdown falls. Proposed mechanisms: chronic <b>mTORC1/S6K1</b> feedback on IRS1, and the valine product <b>3-hydroxyisobutyrate</b>, which increases muscle fatty-acid uptake and DAG/PKCθ activation (another route back to lipid). Genetic data suggest BCAAs may be more a <b>consequence</b> of insulin resistance than a cause.'),
        H3('Adipokines and hepatokines'),
        UL([
          '<b>RBP4</b> rises with obesity and correlates with insulin resistance; it may act by activating adipose macrophages, which again leads to lipolysis.',
          '<b>Adiponectin</b> is modestly lower in obesity. Its receptors have ceramidase activity, and acutely deleting adiponectin causes hepatic insulin resistance within 2 weeks. Lean insulin-resistant offspring have normal levels, so it is not the starting defect.',
          '<b>Fetuin-A</b> (from the liver) directly inhibits the insulin receptor kinase and may present saturated fatty acids to TLR4.',
          '<b>FGF21</b>, also from the liver, improves insulin sensitivity at pharmacological doses (largely by reducing ectopic lipid), but levels are paradoxically high in obesity, suggesting FGF21 resistance. Bone loss limits its use.',
        ]),
      ],
    },
    {
      id: 'model', t: 'The integrated model', sub: 'Everything converges on two final common pathways',
      body: () => [
        P('Every proposed mediator is a response to <b>nutrient oversupply</b>. Some are nutrient-derived toxic metabolites (DAG, ceramide, acylcarnitine, BCAA catabolites), some come from overdriving nutrient-processing machinery (ER and oxidative stress), and some are responses to nutrient-stress damage (inflammation). They converge on <b>two final common pathways</b>:'),
        h('ol.rd-ol', h('li', { html: '<b>Ectopic lipid → sn-1,2-DAG → novel PKC</b> → impaired insulin signaling in <b>liver</b> (PKCε → INSR) and <b>muscle</b> (PKCθ → IRS1/PI3K → GLUT4).' }), h('li', { html: '<b>Metabolite-driven hepatic gluconeogenesis</b>: excess adipose lipolysis delivers NEFA (→ acetyl-CoA → pyruvate carboxylase) and glycerol (→ substrate) to the liver.' })),
        FIGURE(FIG.model(), '<b>Figure 6. An integrated view</b> (after Fig. 19). Overnutrition puts lipid directly into muscle and liver and stresses adipocytes. Adipose insulin resistance and inflammation increase lipolysis, which supplies more NEFA for ectopic lipid and more acetyl-CoA and glycerol for gluconeogenesis. Muscle resistance means ingested glucose is diverted to the liver, where it feeds DNL and liver fat. Rising glucose output and falling disposal raise plasma glucose. The β-cell compensates until it fails.'),
        H3('A test: three days of severe calorie restriction'),
        P('In a rat model of T2D, a <b>3-day very-low-calorie diet</b> (25% of usual intake) nearly normalized glucose and insulin <b>without meaningful weight loss</b>. What changed: liver fat, hepatic acetyl-CoA, membrane DAG and PKCε activation all fell. What did <b>not</b> change: ceramides, glucagon, inflammatory cytokines, FGF21, BCAAs and ER-stress markers. Both components of hepatic insulin action improved. Infusing acetate (to keep acetyl-CoA high) abolished the improvement in glucose output, and a glycogen phosphorylase inhibitor reproduced the glycogen part. This points to <b>DAG–PKCε and metabolite-driven gluconeogenesis</b> as drivers, and the other factors as secondary or amplifying.'),
        H3('The order of events differs between rodents and humans'),
        UL([
          '<b>Rodents:</b> a few days of high-fat feeding causes fatty liver and hepatic insulin resistance first; muscle resistance takes weeks; fat later becomes inflamed and lipolytic.',
          '<b>Humans:</b> <b>muscle insulin resistance comes first</b>. Lean, healthy offspring of people with T2D have muscle insulin resistance but normal liver fat and hepatic insulin action. Muscle resistance then diverts meal glucose to the liver, increasing hepatic lipogenesis, and NAFLD and hepatic insulin resistance follow. Where adipose resistance fits in humans is still an open question.',
        ]),
        H3('Why would insulin resistance exist at all?'),
        P('Possible explanations: (1) it is an <b>accident</b>, with pathologically activated kinases such as nPKCs co-opting normal negative-feedback sites, in an evolutionary history where permanent surplus was rare; (2) it is a <b>cell-protective</b> brake on anabolism when the cell is already overloaded; (3) it is an <b>adaptation to fasting</b>. Fasting raises muscle and liver lipid and causes insulin resistance, which spares glucose for the brain. Cave-dwelling Mexican tetra fish, adapted to scarce food, carry an insulin-receptor mutation and are insulin resistant. Whatever its origin, in chronic overnutrition it is <b>maladaptive</b>.'),
        KEY('<b>One-paragraph summary.</b> Insulin acts directly on muscle (GLUT4 → glycogen), liver (glycogen synthesis; slow transcriptional control of gluconeogenesis, lipogenesis and protein synthesis) and fat (anti-lipolysis via PDE3B and PP1), and indirectly: suppressing lipolysis removes the acetyl-CoA and glycerol that drive hepatic gluconeogenesis. Insulin resistance is a right-shifted, often lowered dose–response curve, which hyperinsulinemia can partly overcome. Its main cause is chronic overnutrition. Lipid that cannot be stored safely in adipose tissue accumulates in muscle and liver as membrane sn-1,2-DAG, which activates PKCθ (muscle: less GLUT4 translocation) and PKCε (liver: INSR Thr1160 inhibition, less glycogen synthesis). At the same time, insulin-resistant, inflamed fat releases excess NEFA and glycerol that drive gluconeogenesis. Fasting hyperglycemia follows when the β-cell can no longer compensate.'),
      ],
    },
  ];

  const NUMBERS = [
    ['2–3×', 'portal vs peripheral insulin seen by the liver'],
    ['≈ 20 µU/mL', 'ED50 for suppression of adipose lipolysis'],
    ['≈ 60 µU/mL', 'ED50 for whole-body glucose uptake (max > 200)'],
    ['5–60 µU/mL', 'normal daily plasma insulin range'],
    ['2–4 min', 'half-life of plasma NEFA'],
    ['≈ 75%', 'insulin-stimulated muscle glucose going to glycogen'],
    ['70–80% / 25–30%', 'muscle share of disposal: clamp / after a meal'],
    ['< 5%', 'adipose share of an oral glucose load'],
    ['20–25 µU/mL', 'portal insulin for half-max net hepatic glycogen synthesis'],
    ['≈ 40%', 'glycogenolysis share of HGP over the first 22 h of a human fast'],
    ['≈ 60 / 25 / 15%', 'liver TG from re-esterified FA / DNL / diet'],
    ['≈ 50%', 'lower muscle glycogen synthesis in T2D and lean insulin-resistant offspring'],
    ['< 5–10%', 'receptors left before maximal response falls (spare receptors)'],
    ['3–5 h', 'delay before lipid infusion causes muscle insulin resistance'],
  ];

  const MYTHS = [
    ['Insulin suppresses gluconeogenesis mainly through FOXO1.', 'The fast, after-meal suppression is mostly <b>indirect</b>, through lower adipose lipolysis (acetyl-CoA and glycerol). FOXO1 transcription is slow and mostly matters over hours.'],
    ['Insulin drives hepatic glycogen synthesis.', 'Insulin is <b>permissive</b>. Portal <b>glucose</b> is the driver: it inhibits phosphorylase and moves glucokinase, and you need both insulin and glucose for net synthesis.'],
    ['Impaired HGP suppression equals hepatic insulin resistance.', 'In the fasted state it can reflect <b>adipose</b> insulin resistance. Insulin-stimulated glycogen synthesis is a purer hepatic readout.'],
    ['The insulin-resistant liver is "selectively" resistant.', 'Probably not needed: substrate push, nutrient-driven DNL and hyperinsulinemia explain the fatty liver.'],
    ['The Randle cycle explains lipid-induced muscle insulin resistance.', 'MRS showed low G6P and glucose, so the defect is <b>GLUT4 transport</b> caused by impaired signaling.'],
    ['Visceral fat causes hepatic insulin resistance.', 'Visceral fat is mainly a marker of <b>liver fat</b>; omentectomy without lower IHTG does not help.'],
    ['Inflammation is the root cause.', 'Adipose insulin resistance comes before inflammation. Inflammation probably <b>amplifies</b> it by increasing lipolysis.'],
  ];

  // ------------------------------------------------------------------ page
  EP.views.irphys = function (el) {
    el.appendChild(EP.pageHeader('Insulin action & resistance: the physiology', 'What does insulin actually do in muscle, liver and fat, what goes wrong in insulin resistance, and why?', {
      section: 'Pancreas & Glucose',
      lede: 'A study chapter that follows Petersen & Shulman, *Physiol Rev* 2018, section by section: normal insulin action, then indirect action, then what, where and why of insulin resistance. Read it top to bottom; the diagrams are redrawn from the review\'s figures and the numbers are the ones it quotes.',
    }));

    const toc = h('nav.rd-toc', h('div.rd-toct', 'Contents'));
    const body = h('div.rd-body');
    const go = (id) => { const t = body.querySelector('#rd-' + id); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    CH.forEach((c, i) => toc.appendChild(h('button.rd-tocl', { onclick: () => go(c.id) }, h('span', String(i + 1)), c.t)));
    toc.appendChild(h('button.rd-tocl', { onclick: () => go('numbers') }, h('span', '★'), 'Numbers to know'));
    toc.appendChild(h('button.rd-tocl', { onclick: () => go('myths') }, h('span', '★'), 'Misconceptions'));
    toc.appendChild(h('a.rd-toclab', { href: '#/irlab' }, 'Try the experiments in the Insulin resistance lab →'));

    CH.forEach((c, i) => {
      body.appendChild(h('section.rd-ch#rd-' + c.id,
        h('div.rd-chh', h('span.rd-chn', String(i + 1)), h('div', h('h2', c.t), h('p.rd-sub', c.sub))),
        c.body()));
    });
    body.appendChild(h('section.rd-ch#rd-numbers', h('div.rd-chh', h('span.rd-chn', '★'), h('div', h('h2', 'Numbers to know'), h('p.rd-sub', 'All quoted in the review'))),
      h('div.rd-nums', NUMBERS.map(([n, t]) => h('div', h('b', n), h('span', t))))));
    body.appendChild(h('section.rd-ch#rd-myths', h('div.rd-chh', h('span.rd-chn', '★'), h('div', h('h2', 'Common misconceptions'), h('p.rd-sub', 'and what the review argues instead'))),
      h('div.rd-myths', MYTHS.map(([m, f]) => h('div', h('p.rd-m', m), h('p', { html: f }))))));
    body.appendChild(EP.sources(['petersen2018', 'rothman1991', 'perry2015', 'petersen2007', 'petersen2005', 'shulman1990', 'zechner2012', 'saxton2017', 'kahn2006'], 'Everything on this page is taken from Petersen & Shulman 2018 unless another source is named; the other references are primary studies the review relies on.'));

    el.appendChild(h('div.rd-wrap', toc, body));
  };
})();
