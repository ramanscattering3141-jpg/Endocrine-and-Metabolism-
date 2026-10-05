/* Sexual differentiation simulator (Kovacs Ch7): chromosomal sex → gonadal sex → hormones
 * (AMH, testosterone, DHT) → internal ducts and external genitalia (Jost paradigm). */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;
  const V = (EP.views = EP.views || {});

  const KARYO = { xx: '46,XX', xy: '46,XY', x0: '45,X (Turner)', xxy: '47,XXY (Klinefelter)', xxsry: '46,XX with SRY on an X' };
  const TSYN = {
    normal: { label: 'Normal', t: 1 },
    hsd17b3: { label: '17β-HSD3 deficiency (testis only)', t: 0.35, note: 'Testosterone synthesis fails only in the testis; adrenal function is normal. Phenotype and pubertal virilization resemble 5α-reductase deficiency.' },
    cyp17: { label: 'CYP17A1 (17α-hydroxylase/17,20-lyase) deficiency', t: 0, adrenal: 'No cortisol or androgens; ACTH drives mineralocorticoid precursors → **hypertension**, hypokalemia; sexual infantilism.' },
    hsd3b2: { label: '3β-HSD2 deficiency', t: 0.25, xx: 0.35, adrenal: 'Adrenal insufficiency (cortisol and aldosterone deficient). DHEA excess can mildly virilize 46,XX fetuses.' },
    star: { label: 'StAR / CYP11A1 (congenital lipoid adrenal hyperplasia)', t: 0, adrenal: 'All steroid classes deficient → severe adrenal insufficiency with salt wasting.' },
  };
  const CAH = { none: 'None', cyp21: '21-hydroxylase deficiency', cyp11b1: '11β-hydroxylase deficiency' };
  const AR = { full: 'Normal', partial: 'Partial loss (PAIS)', none: 'Absent (CAIS)' };

  const PRESETS = [
    ['Typical 46,XX', { k: 'xx' }], ['Typical 46,XY', { k: 'xy' }],
    ['Turner (45,X)', { k: 'x0' }], ['Klinefelter (47,XXY)', { k: 'xxy' }],
    ['Swyer: 46,XY, SRY mutation', { k: 'xy', sry: false }], ['46,XX male (SRY translocation)', { k: 'xxsry' }],
    ['46,XY gonadal dysgenesis (SF-1/SOX9/WT1)', { k: 'xy', det: false }],
    ['Complete androgen insensitivity', { k: 'xy', ar: 'none' }], ['Partial androgen insensitivity', { k: 'xy', ar: 'partial' }],
    ['5α-reductase 2 deficiency', { k: 'xy', srd: false }], ['17β-HSD3 deficiency', { k: 'xy', tsyn: 'hsd17b3' }],
    ['Leydig cell hypoplasia (LH receptor)', { k: 'xy', lhr: false }], ['Persistent Müllerian duct syndrome', { k: 'xy', amh: false }],
    ['46,XX CAH (21-hydroxylase)', { k: 'xx', cah: 'cyp21' }], ['46,XY CAH (21-hydroxylase)', { k: 'xy', cah: 'cyp21' }],
    ['Placental aromatase deficiency (46,XX)', { k: 'xx', arom: false }], ['Lipoid CAH (StAR), 46,XY', { k: 'xy', tsyn: 'star' }],
    ['CYP17A1 deficiency, 46,XY', { k: 'xy', tsyn: 'cyp17' }],
  ];
  const DEF = { k: 'xy', sry: true, det: true, amh: true, amhr: true, lhr: true, tsyn: 'normal', srd: true, ar: 'full', cah: 'none', arom: true };

  function compute(o) {
    const r = { notes: [] };
    const hasY = o.k === 'xy' || o.k === 'xxy';
    const sryOn = (hasY && o.sry) || o.k === 'xxsry';
    if (o.k === 'x0') { r.gonad = 'streak'; r.notes.push('**45,X:** germ cells reach the gonad, but oocytes undergo accelerated atresia → streak gonads, primary ovarian failure. Short stature (SHOX haploinsufficiency) is the only universal feature (Kovacs Ch7).'); }
    else if (sryOn && o.det) r.gonad = 'testis';
    else if (sryOn && !o.det) { r.gonad = 'streak'; r.notes.push('**SF-1, SOX9 or WT1 defect:** SRY is present but the testis program fails → gonadal dysgenesis. SF-1 loss can also cause adrenal insufficiency; SOX9 loss causes campomelic dysplasia.'); }
    else if (hasY && !o.sry) { r.gonad = 'streak'; r.notes.push('**SRY mutation (Swyer syndrome):** without SRY the gonad does not become a testis — streak gonads, female phenotype, and an increased risk of gonadoblastoma.'); }
    else r.gonad = 'ovary';
    if (o.k === 'xxy') r.notes.push('**47,XXY:** one Y is enough for testis and male development, but the testes are small and azoospermic; FSH is high and gynecomastia is common after puberty.');
    if (o.k === 'xxsry') r.notes.push('**SRY translocated onto an X** (X–Y recombination near the pseudoautosomal region) → 46,XX male.');
    const testis = r.gonad === 'testis';
    // AMH
    r.amh = testis && o.amh ? 1 : 0;
    r.mull = r.amh && o.amhr ? 'regressed' : 'present';
    if (testis && (!o.amh || !o.amhr)) r.notes.push('**AMH or AMH-receptor defect:** müllerian ducts persist (uterus and tubes) in an otherwise virilized male — persistent müllerian duct syndrome.');
    // testosterone from testis
    const ts = TSYN[o.tsyn];
    let t = 0;
    if (testis) { t = o.lhr ? ts.t : 0.21; if (!o.lhr) r.notes.push('**LH-receptor inactivation (Leydig cell hypoplasia):** fetal testosterone production depends on hCG/LH acting on Leydig cells; without the receptor, virilization fails. AMH is normal, so müllerian ducts regress.'); }
    if (ts.note && testis) r.notes.push(ts.note);
    r.t = t;
    // adrenal / placental androgens
    let adr = 0;
    if (o.cah !== 'none') { adr = 0.65; r.notes.push(`**${CAH[o.cah]}:** cortisol synthesis is impaired, ACTH rises, and precursors are diverted to adrenal androgens${o.cah === 'cyp11b1' ? '; 11-deoxycorticosterone excess causes hypertension' : ''}. ${o.k === 'xx' || o.k === 'x0' ? 'In a 46,XX fetus this virilizes the external genitalia; internal female structures are unaltered and wolffian derivatives do not form.' : 'In a 46,XY infant genitalia are male; the risk is adrenal crisis (salt wasting in classic 21-hydroxylase deficiency).'}`); }
    if (!o.arom) { adr = Math.max(adr, 0.55); r.notes.push('**Placental aromatase deficiency:** the placenta cannot convert fetal/maternal androgen precursors to estrogens, so a 46,XX fetus (and the mother) are virilized. At puberty: hypergonadotropic hypogonadism, polycystic ovaries and progressive virilization (Kovacs Ch7).'); }
    if (ts.xx && !testis) adr = Math.max(adr, ts.xx * 0.6);
    r.adr = adr;
    const arv = { full: 1, partial: 0.5, none: 0 }[o.ar];
    // Wolffian: needs local testicular testosterone (adrenal androgens do not stabilize them)
    const w = t * arv;
    r.wolff = w >= 0.6 ? 'developed' : w > 0.2 ? 'partial' : 'regressed';
    // External: DHT
    const andro = t + adr;
    r.dht = (o.srd ? 1 : 0.15) * Math.min(1, andro);
    const ext = r.dht * arv;
    r.ext = ext >= 0.75 ? 'male' : ext >= 0.22 ? 'ambiguous' : 'female';
    if (!o.srd && testis && t > 0.5) { r.ext = 'ambiguous'; r.extNote = 'predominantly female at birth (small phallus, urogenital sinus); wolffian ducts are normal'; r.notes.push('**5α-reductase 2 deficiency:** testosterone itself virilizes the wolffian ducts, but DHT is required for the external genitalia and prostate. At puberty, virilization progresses (Kovacs Ch7).'); }
    if (o.ar === 'none' && testis) r.notes.push('**Complete androgen insensitivity:** testosterone is high, but no tissue responds. Wolffian ducts regress (no androgen action) and müllerian ducts regress (AMH acts) → **neither duct system**; female external genitalia with a short blind vagina; testes in abdomen, inguinal canal or labia.');
    if (o.ar === 'partial' && testis) r.notes.push('**Partial androgen insensitivity:** a spectrum from ambiguous genitalia to undervirilized male (hypospadias).');
    // adrenal status
    r.adrenal = 'normal';
    if (ts.adrenal && (testis || o.tsyn === 'star' || o.tsyn === 'cyp17' || o.tsyn === 'hsd3b2')) { r.adrenal = 'affected'; r.notes.push('**Adrenal:** ' + ts.adrenal); }
    if (o.cah !== 'none') r.adrenal = 'affected';
    if (!o.det && sryOn) r.adrenal = r.adrenal === 'affected' ? 'affected' : 'possible';
    // puberty
    let pub;
    if (r.gonad === 'streak') pub = 'No spontaneous puberty (sexual infantilism) — estrogen replacement needed.' + (o.k === 'x0' ? ' Short stature.' : '');
    else if (testis && o.ar === 'none') pub = 'Female secondary characteristics: breast development from estrogen (testicular estrogen and aromatized testosterone; LH and testosterone are high). Primary amenorrhea; scant axillary/pubic hair.';
    else if (testis && (!o.srd || o.tsyn === 'hsd17b3')) pub = 'Substantial **virilization at puberty** (more testicular steroidogenesis; 5α-reductase 1 can contribute).';
    else if (testis && o.k === 'xxy') pub = 'Incomplete virilization, gynecomastia, small firm testes, azoospermia; high FSH.';
    else if (testis && r.t < 0.3) pub = 'Little or no pubertal virilization.';
    else if (testis) pub = 'Male puberty.';
    else if (!o.arom) pub = 'Hypergonadotropic hypogonadism, polycystic ovaries, progressive virilization.';
    else if (o.cah !== 'none') pub = 'Ovaries and uterus normal; with glucocorticoid treatment, female puberty and fertility are possible. Untreated, androgen excess continues.';
    else pub = 'Female puberty.';
    r.puberty = pub;
    return r;
  }

  V.sexdiff = function (el, params) {
    el.appendChild(EP.pageHeader('Sexual differentiation', 'Chromosomal sex → gonadal sex → phenotypic sex: which signal decides each step, and what happens when one fails?', {
      section: 'Reproductive',
      lede: 'Jost\'s paradigm: the embryo follows the female pathway unless a **testis** forms (SRY) and secretes **AMH** (Sertoli cells: müllerian regression) and **testosterone** (Leydig cells: wolffian ducts; converted to **DHT** for external genitalia and prostate). Female differentiation does not require ovarian hormones (Kovacs Ch7).' }));
    const o = Object.assign({}, DEF);
    const presets = h('div.statebar', PRESETS.map(([l, p]) => h('button.chip', { onclick: (ev) => { Object.assign(o, DEF, p); presets.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', b === ev.target)); syncCtl(); upd(); } }, l)));
    const sel = (key, opts, label) => { const x = h('select.btn', { onchange: () => { o[key] = x.value; upd(); } }, Object.entries(opts).map(([v, t]) => h('option', { value: v }, t))); x.__k = key; return h('label.sd-ctl', h('span', label), x); };
    const chk = (key, label) => { const x = h('input', { type: 'checkbox', onchange: () => { o[key] = x.checked; upd(); } }); x.__k = key; return h('label.chk.sd-chk', x, ' ' + label); };
    const ctl = h('div.card.sd-controls',
      h('div.sd-row', sel('k', KARYO, 'Karyotype'), sel('tsyn', Object.fromEntries(Object.entries(TSYN).map(([k, v]) => [k, v.label])), 'Testicular steroidogenesis'), sel('ar', AR, 'Androgen receptor'), sel('cah', CAH, 'Fetal adrenal (CAH)')),
      h('div.sd-row', chk('sry', 'SRY functional'), chk('det', 'SF-1 / SOX9 / WT1'), chk('amh', 'AMH'), chk('amhr', 'AMH receptor'), chk('lhr', 'LH/hCG receptor'), chk('srd', '5α-reductase 2'), chk('arom', 'Placental aromatase')));
    function syncCtl() { ctl.querySelectorAll('select, input').forEach((x) => { if (x.type === 'checkbox') x.checked = !!o[x.__k]; else x.value = o[x.__k]; }); }
    const W = 1100, H = 390;
    const svg = s('svg', { class: 'sd-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Sexual differentiation pathway' });
    svg.appendChild(EP.svgDefs());
    const gL = s('g'), gN = s('g'), gD = s('g'); svg.append(gL, gN, gD);
    const box = (id, x, y, w, hh, title) => { const g = s('g', { class: 'sd-box' }); g.append(s('rect', { x, y, width: w, height: hh, rx: 12 }), s('text', { x: x + w / 2, y: y + 18, class: 'sd-title', 'text-anchor': 'middle' }, title)); const v = s('text', { x: x + w / 2, y: y + 40, class: 'sd-val', 'text-anchor': 'middle' }, ''); const v2 = s('text', { x: x + w / 2, y: y + 57, class: 'sd-sub', 'text-anchor': 'middle' }, ''); g.append(v, v2); gN.appendChild(g); return { g, v, v2, x, y, w, h: hh }; };
    const B = {
      chrom: box('chrom', 15, 155, 160, 72, 'Chromosomes'),
      gonad: box('gonad', 225, 155, 170, 72, 'Gonad'),
      amh: box('amh', 465, 30, 200, 72, 'AMH (Sertoli)'),
      t: box('t', 465, 155, 200, 72, 'Testosterone (Leydig)'),
      adr: box('adr', 465, 285, 200, 72, 'Other androgens'),
      dht: box('dht', 715, 285, 160, 72, 'DHT (5α-reductase)'),
      mull: box('mull', 915, 30, 175, 72, 'Müllerian ducts'),
      wolff: box('wolff', 915, 155, 175, 72, 'Wolffian ducts'),
      ext: box('ext', 915, 285, 175, 72, 'External genitalia'),
    };
    const link = (a, b, cls, label) => {
      const A = B[a], Bb = B[b];
      const x1 = A.x + A.w, y1 = A.y + A.h / 2, x2 = Bb.x, y2 = Bb.y + Bb.h / 2, mx = (x1 + x2) / 2;
      const p = s('path', { d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`, class: 'sd-link ' + (cls || ''), 'marker-end': cls === 'neg' ? 'url(#m-inhib)' : 'url(#m-stim)' });
      gL.appendChild(p);
      if (label) gL.appendChild(s('text', { x: mx, y: (y1 + y2) / 2 - 6, class: 'sd-llab', 'text-anchor': 'middle' }, label));
      p.__len = p.getTotalLength(); return p;
    };
    const L = {
      cg: link('chrom', 'gonad', '', 'SRY'), ga: link('gonad', 'amh'), gt: link('gonad', 't', '', 'hCG/LH'),
      am: link('amh', 'mull', 'neg', 'regression'), tw: link('t', 'wolff', '', 'T + AR'), td: link('t', 'dht'), ad: link('adr', 'dht'), de: link('dht', 'ext'),
    };
    const out = h('div.sd-out');
    el.append(presets, ctl, h('div.card.sd-wrap', h('div.anim-bar', EP.animSwitch(svg)), svg, EP.colorKey([
      ['Box colour', [{ fill: 'color-mix(in srgb, var(--c-stim) 14%, var(--panel))', stroke: 'var(--c-stim)', rx: 6, label: 'Hormone made / signal present' }, { fill: 'color-mix(in srgb, #f4c430 18%, var(--panel))', stroke: '#d4a017', rx: 6, label: 'Partial / low' }, { fill: 'var(--panel)', stroke: 'var(--faint)', dash: '5 3', rx: 6, label: 'Absent / regressed' }, { fill: 'color-mix(in srgb, var(--c-drug) 12%, var(--panel))', stroke: 'var(--c-drug)', rx: 6, label: 'Abnormal androgen excess' }, { fill: 'color-mix(in srgb, var(--c-inhib) 12%, var(--panel))', stroke: 'var(--c-inhib)', rx: 6, label: 'Gonadal failure (streak)' }]],
      ['Structures', [{ fill: 'color-mix(in srgb, var(--tr1) 14%, var(--panel))', stroke: 'var(--tr1)', rx: 6, label: 'Male-type structure present' }, { fill: 'color-mix(in srgb, var(--tr3) 14%, var(--panel))', stroke: 'var(--tr3)', rx: 6, label: 'Female-type structure present' }]],
      ['Arrows', [{ line: 'var(--c-stim)', marker: 'stim', label: 'Active signal' }, { line: 'var(--c-inhib)', marker: 'inhib', label: 'AMH causes regression' }, { line: 'var(--faint)', dash: '4 4', label: 'No signal' }, { dot: 'var(--c-hormone)', label: 'Hormone travelling' }]],
    ])), out);
    const dots = [];
    function setBox(b, val, sub, cls) { b.v.textContent = val; b.v2.textContent = sub || ''; b.g.setAttribute('class', 'sd-box ' + (cls || '')); }
    let R;
    function upd() {
      R = compute(o);
      setBox(B.chrom, KARYO[o.k].split(' ')[0], o.k === 'xxsry' ? 'SRY on X' : o.k === 'xy' || o.k === 'xxy' ? (o.sry ? 'SRY present' : 'SRY mutated') : 'no SRY', 'neutral');
      setBox(B.gonad, { testis: 'Testis', ovary: 'Ovary', streak: 'Streak gonad' }[R.gonad], R.gonad === 'testis' ? (o.k === 'xxy' ? 'small; azoospermic later' : 'Sertoli + Leydig cells') : R.gonad === 'ovary' ? 'no hormones needed' : 'dysgenetic', R.gonad === 'streak' ? 'bad' : 'neutral');
      setBox(B.amh, R.amh ? 'Secreted' : 'None', R.amh && !o.amhr ? 'receptor defective' : '', R.amh ? 'on' : 'off');
      setBox(B.t, R.t >= 0.6 ? 'Normal' : R.t > 0.1 ? 'Low' : 'None', R.gonad !== 'testis' ? 'no testis' : !o.lhr ? 'no LH/hCG signal' : o.tsyn !== 'normal' ? 'synthesis defect' : '', R.t >= 0.6 ? 'on' : R.t > 0.1 ? 'part' : 'off');
      setBox(B.adr, R.adr > 0.1 ? 'Excess' : 'Normal (low)', o.cah !== 'none' ? 'adrenal (CAH)' : !o.arom ? 'placental aromatase lost' : 'adrenal, placental', R.adr > 0.1 ? 'warn' : 'off');
      setBox(B.dht, R.dht >= 0.6 ? 'Normal' : R.dht > 0.1 ? 'Low' : 'None', !o.srd ? 'enzyme deficient' : '', R.dht >= 0.6 ? 'on' : R.dht > 0.1 ? 'part' : 'off');
      setBox(B.mull, R.mull === 'present' ? 'Present' : 'Regressed', R.mull === 'present' ? 'uterus, tubes, upper vagina' : 'AMH → apoptosis', R.mull === 'present' ? 'f' : 'off');
      setBox(B.wolff, { developed: 'Developed', partial: 'Partial', regressed: 'Regressed' }[R.wolff], R.wolff !== 'regressed' ? 'epididymis, vas deferens' : 'no local androgen action', R.wolff === 'developed' ? 'm' : R.wolff === 'partial' ? 'part' : 'off');
      setBox(B.ext, { male: 'Male', ambiguous: 'Ambiguous', female: 'Female' }[R.ext], R.ext === 'male' ? 'penis, scrotum, prostate' : R.ext === 'female' ? 'clitoris, labia, lower vagina' : (R.extNote ? 'predominantly female at birth' : 'partial virilization'), R.ext === 'male' ? 'm' : R.ext === 'female' ? 'f' : 'part');
      const act = { cg: R.gonad === 'testis', ga: R.amh > 0, gt: R.t > 0.1, am: R.amh > 0 && o.amhr, tw: R.t * ({ full: 1, partial: 0.5, none: 0 }[o.ar]) > 0.2, td: R.t > 0.1, ad: R.adr > 0.1, de: R.dht * ({ full: 1, partial: 0.5, none: 0 }[o.ar]) > 0.2 };
      Object.entries(L).forEach(([k, p]) => p.classList.toggle('on', !!act[k]));
      out.innerHTML = `<div class="grid2"><div class="card"><h3>Phenotype</h3><table class="cmp-table small">
        <tr><td>Gonad</td><td><b>${{ testis: 'Testes', ovary: 'Ovaries', streak: 'Streak gonads' }[R.gonad]}</b></td></tr>
        <tr><td>Internal (müllerian)</td><td>${R.mull === 'present' ? 'Uterus, fallopian tubes, upper vagina' : 'Absent'}</td></tr>
        <tr><td>Internal (wolffian)</td><td>${R.wolff === 'developed' ? 'Epididymis, vas deferens, seminal vesicles' : R.wolff === 'partial' ? 'Partially developed' : 'Absent'}</td></tr>
        <tr><td>External genitalia</td><td><b>${{ male: 'Male', ambiguous: 'Ambiguous', female: 'Female' }[R.ext]}</b>${R.extNote ? ` — ${R.extNote}` : ''}</td></tr>
        <tr><td>Adrenal</td><td>${R.adrenal === 'affected' ? '<span class="bad">Affected — see note</span>' : R.adrenal === 'possible' ? 'Possible insufficiency (SF-1)' : 'Normal'}</td></tr>
        <tr><td>Puberty</td><td>${EP.md(R.puberty)}</td></tr></table></div>
        <div class="card"><h3>Why</h3><ul class="keypoints">${R.notes.length ? R.notes.map((n) => `<li>${EP.md(n)}</li>`).join('') : '<li>Typical development: every step proceeds as expected for this karyotype.</li>'}</ul></div></div>`;
    }
    const stop = EP.loop((dt) => {
      Object.values(L).forEach((p) => {
        if (!p.classList.contains('on')) { if (p.__dot) { p.__dot.remove(); p.__dot = null; } return; }
        if (!p.__dot) { p.__dot = s('circle', { r: 4, class: 'sd-dot' }); gD.appendChild(p.__dot); p.__t = Math.random(); }
        p.__t = (p.__t + dt * 0.45) % 1; const pt = p.getPointAtLength(p.__t * p.__len); p.__dot.setAttribute('cx', pt.x); p.__dot.setAttribute('cy', pt.y);
      });
    }, { scope: svg });
    EP.onTeardown(stop);
    syncCtl(); upd();
    if (params.p) { const i = PRESETS.findIndex(([l]) => l.toLowerCase().includes(params.p.toLowerCase())); if (i >= 0) presets.children[i].click(); }
    el.appendChild(EP.sources(['kovacs7', 'kovacs3', 'molina8', 'molina9', 'speiser2018'].filter((r) => EP.data.refs[r])));
  };
})();
