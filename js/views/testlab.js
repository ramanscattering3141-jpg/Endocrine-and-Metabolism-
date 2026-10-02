/* Endocrine testing lab: order static and dynamic tests on a patient and reach a diagnosis.
 * Logic follows Kovacs Ch4 (stimulation/suppression principles), Molina Ch2 (water deprivation),
 * Molina Ch6 (dexamethasone, metyrapone, CRH tests), Kovacs Ch3/14 (PTH infusion in PHP).
 * Results are qualitative — no invented reference values. */
(function () {
  'use strict';
  const EP = window.EP;
  const { h } = EP;
  const V = (EP.views = EP.views || {});

  const DX = {
    normal: 'No endocrine disease', addison: 'Primary adrenal insufficiency (Addison)', secai: 'Secondary adrenal insufficiency (ACTH deficiency)',
    cushpit: 'Cushing disease (pituitary ACTH adenoma)', ectopic: 'Ectopic ACTH syndrome', adenoma: 'Cortisol-secreting adrenal adenoma',
    conn: 'Primary hyperaldosteronism', acro: 'Acromegaly (GH-secreting adenoma)', ghd: 'GH deficiency',
    cdi: 'Central diabetes insipidus', ndi: 'Nephrogenic diabetes insipidus', polyd: 'Primary polydipsia',
    hypopara: 'Hypoparathyroidism', php: 'Pseudohypoparathyroidism (PTH resistance)',
    hypo1: 'Primary hypothyroidism', hypo2: 'Central (secondary) hypothyroidism', graves: 'Graves disease',
  };
  const CASES = [
    { id: 'c1', dx: 'addison', stem: 'A 34-year-old has months of fatigue, weight loss, salt craving and darkening of the skin creases. Blood pressure is low on standing.' },
    { id: 'c2', dx: 'secai', stem: 'A 60-year-old stopped long-term high-dose prednisone two weeks ago and now has fatigue, nausea and hypotension. Skin is not hyperpigmented.' },
    { id: 'c3', dx: 'cushpit', stem: 'A 38-year-old woman has gradual central weight gain, wide purple striae, easy bruising and proximal muscle weakness over two years.' },
    { id: 'c4', dx: 'ectopic', stem: 'A 66-year-old smoker develops, over weeks, severe weakness, edema, hypertension and marked hypokalemia. A lung mass is seen.' },
    { id: 'c5', dx: 'adenoma', stem: 'A 45-year-old with new diabetes and hypertension has cushingoid features; imaging done for back pain showed an adrenal mass.' },
    { id: 'c6', dx: 'conn', stem: 'A 42-year-old has hypertension resistant to three drugs, with spontaneous hypokalemia and muscle cramps.' },
    { id: 'c7', dx: 'acro', stem: 'A 50-year-old notices rings and shoes no longer fit, coarsening of the face, sweating and snoring.' },
    { id: 'c8', dx: 'ghd', stem: 'An 8-year-old is far below the growth curve with slow growth velocity, normal proportions and delayed bone age. Thyroid tests are normal.' },
    { id: 'c9', dx: 'cdi', stem: 'After a head injury, a 28-year-old passes large volumes of dilute urine and is constantly thirsty, preferring ice water.' },
    { id: 'c10', dx: 'ndi', stem: 'A 55-year-old who has taken lithium for years has polyuria and nocturia with dilute urine.' },
    { id: 'c11', dx: 'polyd', stem: 'A 30-year-old drinks several litres of water daily "to stay healthy" and has polyuria. Plasma sodium is low-normal.' },
    { id: 'c12', dx: 'hypopara', stem: 'Two days after total thyroidectomy, a patient has perioral tingling and carpopedal spasm.' },
    { id: 'c13', dx: 'php', stem: 'A teenager with short stature, round face and short fourth metacarpals has hypocalcemia and hyperphosphatemia.' },
    { id: 'c14', dx: 'hypo1', stem: 'A 52-year-old woman has fatigue, cold intolerance, constipation, weight gain and dry skin; there is a firm goiter.' },
    { id: 'c15', dx: 'hypo2', stem: 'After pituitary surgery for a macroadenoma, a patient is fatigued and cold-intolerant.' },
    { id: 'c16', dx: 'graves', stem: 'A 29-year-old has weight loss, heat intolerance, tremor, a diffuse goiter and prominent eyes.' },
    { id: 'c0', dx: 'normal', stem: 'A 40-year-old with nonspecific fatigue asks to be "tested for hormone problems". Examination is normal.' },
  ];
  // Each test returns [result, interpretation, abnormal?]
  const R = (res, why, ab) => [res, why, !!ab];
  const TESTS = [
    { group: 'Adrenal', id: 'amcort', name: 'Morning cortisol + ACTH', run: (d) => ({
      addison: R('Cortisol low · ACTH high', 'Low cortisol with high ACTH localizes the problem to the adrenal (loss of feedback raises ACTH; POMC excess darkens skin).', 1),
      secai: R('Cortisol low · ACTH low or inappropriately normal', 'Low cortisol without an ACTH rise points to the pituitary/hypothalamus (or recent exogenous glucocorticoid).', 1),
      cushpit: R('Cortisol high-normal/high · ACTH normal to high', 'ACTH-dependent hypercortisolism; a random cortisol is hard to interpret because of pulsatility and circadian rhythm (Molina Ch6).', 1),
      ectopic: R('Cortisol high · ACTH very high', 'Strongly ACTH-dependent.', 1),
      adenoma: R('Cortisol high · ACTH suppressed', 'ACTH-independent: the adrenal is autonomous and feedback suppresses ACTH.', 1),
    }[d] || R('Both normal', 'A single value is not diagnostic: cortisol is pulsatile and circadian.')) },
    { group: 'Adrenal', id: 'ufc', name: '24-hour urinary free cortisol', run: (d) => (['cushpit', 'ectopic', 'adenoma'].includes(d) ? R('Elevated', 'Integrates cortisol secretion over 24 h — the preferred way to confirm hypercortisolism (Molina Ch6).', 1) : ['addison', 'secai'].includes(d) ? R('Low', 'Low total daily cortisol production.', 1) : R('Normal', 'No hypercortisolism.')) },
    { group: 'Adrenal', id: 'lddst', name: 'Low-dose dexamethasone suppression', run: (d) => (['cushpit', 'ectopic', 'adenoma'].includes(d) ? R('Cortisol NOT suppressed', 'Failure to suppress = autonomous secretion of cortisol or ACTH (Kovacs Ch4).', 1) : ['addison', 'secai'].includes(d) ? R('Not informative', 'Cortisol is already low; suppression tests are for suspected excess.') : R('Cortisol suppressed', 'Intact negative feedback.')) },
    { group: 'Adrenal', id: 'hddst', name: 'High-dose dexamethasone suppression', run: (d) => ({
      cushpit: R('Cortisol partly suppressed', 'Most corticotroph adenomas retain some responsiveness to glucocorticoid feedback (Molina Ch6).', 1),
      ectopic: R('NOT suppressed', 'Ectopic ACTH-producing tumors do not respond to glucocorticoid feedback (Molina Ch6).', 1),
      adenoma: R('NOT suppressed', 'Cortisol is independent of ACTH, which is already suppressed.', 1),
    }[d] || R('Not indicated', 'Used only to localize established ACTH-dependent hypercortisolism.')) },
    { group: 'Adrenal', id: 'crh', name: 'CRH stimulation', run: (d) => ({
      cushpit: R('Exaggerated ACTH & cortisol rise (~2-fold)', 'Pituitary corticotroph adenomas respond to CRH; ectopic sources rarely do (Molina Ch6).', 1),
      ectopic: R('No ACTH response', 'Ectopic tumors rarely respond to CRH.', 1),
      adenoma: R('No ACTH response', 'Corticotrophs are suppressed by autonomous cortisol.', 1),
      addison: R('ACTH (already high) rises; cortisol does not', 'Pituitary intact, adrenal failed.', 1),
      secai: R('Little or no ACTH rise', 'Pituitary ACTH reserve is deficient (a hypothalamic cause would show an ACTH rise).', 1),
    }[d] || R('ACTH and cortisol rise', 'Intact pituitary–adrenal axis.')) },
    { group: 'Adrenal', id: 'cosyn', name: 'Cosyntropin (ACTH) stimulation', run: (d) => ({
      addison: R('No cortisol rise', 'The adrenal cannot respond — primary failure.', 1),
      secai: R('Blunted cortisol rise', 'Chronic ACTH lack causes adrenal atrophy, so the adrenal under-responds to a supraphysiological ACTH dose. (Very recent ACTH deficiency may still give a normal result.)', 1),
      cushpit: R('Cortisol rises (often exaggerated)', 'Not a test for excess.'), ectopic: R('Cortisol rises', 'Not a test for excess.'),
    }[d] || R('Normal cortisol rise', 'Adrenal reserve intact. Cosyntropin tests only the adrenal, with a supraphysiological stimulus (Kovacs Ch4).')) },
    { group: 'Adrenal', id: 'mety', name: 'Metyrapone (11β-hydroxylase block)', run: (d) => ({
      addison: R('No rise in 11-deoxycortisol', 'The adrenal cannot respond to the ACTH rise.', 1),
      secai: R('No ACTH or 11-deoxycortisol rise', 'The pituitary cannot increase ACTH when cortisol falls (Molina Ch6).', 1),
    }[d] || R('ACTH and 11-deoxycortisol rise', 'Lower cortisol releases feedback → ACTH ↑ → precursor (11-deoxycortisol) accumulates. Whole axis intact.')) },
    { group: 'Adrenal', id: 'itt', name: 'Insulin tolerance test (hypoglycemia)', run: (d) => ({
      addison: R('ACTH rises; cortisol does not; GH rises', 'Adrenal failure.', 1),
      secai: R('No ACTH/cortisol rise; GH may also be blunted', 'Hypothalamic–pituitary ACTH deficiency.', 1),
      ghd: R('GH does not rise; cortisol rises', 'GH deficiency (hypoglycemia is a potent GH stimulus, Kovacs Ch5).', 1),
    }[d] || R('ACTH, cortisol, GH and prolactin all rise', 'Tests hypothalamus, pituitary and adrenal together; cumbersome and risky in older or sick patients (Kovacs Ch4).')) },
    { group: 'Adrenal', id: 'renin', name: 'Renin & aldosterone', run: (d) => ({
      addison: R('Aldosterone low · renin high', 'The whole cortex is destroyed, so mineralocorticoid is lost too (salt wasting, hyperkalemia).', 1),
      secai: R('Aldosterone normal · renin normal', 'Aldosterone is regulated by Ang II and K⁺, not ACTH — preserved in secondary insufficiency.'),
      conn: R('Aldosterone high · renin suppressed', 'Autonomous aldosterone → volume expansion suppresses renin.', 1),
      ectopic: R('Aldosterone low-normal · renin suppressed', 'Massive cortisol overwhelms 11β-HSD2 and acts on MR (hypokalemia, hypertension) without aldosterone excess.', 1),
    }[d] || R('Normal', 'RAAS intact.')) },
    { group: 'Adrenal', id: 'salt', name: 'Salt loading (aldosterone suppression)', run: (d) => (d === 'conn' ? R('Aldosterone NOT suppressed', 'Salt loading should suppress aldosterone; aldosterone-producing tumors keep secreting (Kovacs Ch4).', 1) : R('Aldosterone suppressed', 'Normal RAAS feedback.')) },
    { group: 'GH', id: 'igf1', name: 'IGF-1', run: (d) => (d === 'acro' ? R('Elevated', 'Integrates GH secretion over time.', 1) : d === 'ghd' ? R('Low', 'Consistent with GH deficiency (also low in malnutrition and liver disease).', 1) : R('Normal for age', '')) },
    { group: 'GH', id: 'ogtt', name: 'Oral glucose → GH (suppression)', run: (d) => (d === 'acro' ? R('GH NOT suppressed', 'Oral glucose suppresses GH normally but not in GH-secreting tumors (Kovacs Ch4).', 1) : R('GH suppressed', 'Normal glucose feedback on GH.')) },
    { group: 'Water', id: 'wd', name: 'Water deprivation → desmopressin', run: (d) => ({
      cdi: R('Urine stays dilute; concentrates after desmopressin · plasma ADH low', 'No ADH, but the kidney responds to it — central DI.', 1),
      ndi: R('Urine stays dilute; no response to desmopressin · plasma ADH high', 'ADH present, kidney resistant — nephrogenic DI (e.g., lithium).', 1),
      polyd: R('Urine concentrates (may be submaximal); starts with low-normal plasma osmolality', 'ADH secretion and action are intact; chronic overdrinking can wash out the medullary gradient.', 1),
    }[d] || R('Urine concentrates; little extra response to desmopressin', 'If urine concentrates maximally, osmosensing, ADH secretion, V2 receptors and post-receptor events are all intact (Kovacs Ch4).')) },
    { group: 'Calcium', id: 'capth', name: 'Calcium, phosphate, PTH', run: (d) => ({
      hypopara: R('Ca²⁺ low · phosphate high · PTH low', 'Lack of PTH.', 1),
      php: R('Ca²⁺ low · phosphate high · PTH high', 'PTH is present but cannot act — resistance.', 1),
    }[d] || R('Normal', '')) },
    { group: 'Calcium', id: 'pthinf', name: 'PTH infusion → urinary cAMP & phosphate', run: (d) => (d === 'php' ? R('Blunted or absent cAMP and phosphaturic response', 'Gαs defect (PHP 1a) — the kidney cannot respond (Kovacs Ch3–4).', 1) : d === 'hypopara' ? R('Normal rise in urinary cAMP and phosphate', 'The kidney responds; the problem is PTH deficiency (Kovacs Ch4).', 1) : R('Normal rise', '')) },
    { group: 'Thyroid', id: 'tft', name: 'TSH + free T4', run: (d) => ({
      hypo1: R('TSH high · free T4 low', 'Primary thyroid failure with intact pituitary feedback.', 1),
      hypo2: R('TSH low or inappropriately normal · free T4 low', 'TSH cannot be used alone in pituitary disease (Kovacs Ch5, Ch12).', 1),
      graves: R('TSH suppressed · free T4 high', 'Primary hyperthyroidism.', 1),
      secai: R('Normal (check other pituitary axes)', ''),
    }[d] || R('Normal', '')) },
    { group: 'Thyroid', id: 'trab', name: 'TSH-receptor antibodies', run: (d) => (d === 'graves' ? R('Positive', 'Stimulating antibodies mimic TSH and escape feedback (Kovacs Ch3).', 1) : R('Negative', '')) },
    { group: 'Thyroid', id: 'trh', name: 'TRH stimulation (classic)', run: (d) => ({
      hypo1: R('Exaggerated TSH rise', 'Thyrotrophs released from feedback.', 1), hypo2: R('Blunted TSH rise', 'Pituitary thyrotroph deficiency.', 1), graves: R('No TSH rise', 'Thyrotrophs suppressed by excess thyroid hormone.', 1),
    }[d] || R('Normal TSH (and prolactin) rise', 'TRH is a releasing-hormone stimulation test (Kovacs Ch4).')) },
  ];

  V.testlab = function (el, params) {
    el.appendChild(EP.pageHeader('Endocrine testing lab', 'Static levels overlap between health and disease. Which **stimulation** or **suppression** test localizes the problem?', {
      section: 'Endocrine Fundamentals',
      lede: 'Rule from Kovacs Ch4: suspect **deficiency → stimulate**; suspect **excess → suppress**. Failure to rise means insufficiency; failure to suppress means autonomy. Pick a patient, order the fewest tests you need, then commit to a diagnosis.' }));
    const caseBar = h('div.statebar', CASES.map((c, i) => h('button.chip', { 'data-id': c.id, onclick: () => load(c.id) }, 'Patient ' + (i + 1))));
    const stem = h('div.card.tl-stem'); const testsBox = h('div.card.tl-tests'); const log = h('div.tl-log'); const dxBox = h('div.card.tl-dx');
    el.append(caseBar, h('div.tl-grid', h('div', stem, testsBox), h('div', h('h3', 'Results'), log, dxBox)));
    let cur, ordered;
    function load(id) {
      cur = CASES.find((c) => c.id === id); ordered = [];
      caseBar.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
      stem.innerHTML = `<div class="why-head">Patient</div><p>${EP.esc(cur.stem)}</p>`;
      EP.clear(testsBox); EP.clear(log);
      testsBox.appendChild(h('div.why-head', 'Order tests'));
      ['Adrenal', 'GH', 'Water', 'Calcium', 'Thyroid'].forEach((g) => {
        testsBox.appendChild(h('div.tl-gl', g));
        testsBox.appendChild(h('div.tl-btns', TESTS.filter((t) => t.group === g).map((t) => h('button.btn.tl-btn', { 'data-t': t.id, onclick: (ev) => order(t, ev.target) }, t.name))));
      });
      log.appendChild(h('p.muted.small', 'No tests ordered yet.'));
      const sel = h('select.btn', h('option', { value: '' }, 'Choose a diagnosis…'), Object.entries(DX).map(([k, v]) => h('option', { value: k }, v)));
      const fb = h('div');
      dxBox.innerHTML = '';
      dxBox.append(h('div.why-head', 'Your diagnosis'), sel, h('button.btn.primary', { style: { marginLeft: '8px' }, onclick: () => {
        if (!sel.value) return;
        const ok = sel.value === cur.dx;
        fb.innerHTML = `<p class="${ok ? 'ok' : 'bad'}"><b>${ok ? '✓ Correct' : '✗ Not quite'}</b> — ${EP.esc(DX[cur.dx])}. You ordered ${ordered.length} test${ordered.length === 1 ? '' : 's'}.</p><p class="small">${EP.md(KEY[cur.dx] || '')}</p>`;
      } }, 'Check'), fb);
    }
    function order(t, btn) {
      if (ordered.includes(t.id)) return;
      if (!ordered.length) EP.clear(log);
      ordered.push(t.id); btn.classList.add('done');
      const [res, why, ab] = t.run(cur.dx);
      log.appendChild(h('div.tl-res' + (ab ? '.ab' : ''), h('div.tl-rn', t.name), h('div.tl-rv', res), why ? h('div.small.muted', { html: EP.md(why) }) : null));
    }
    const KEY = {
      normal: 'Unnecessary testing can mislead: static values overlap and medications or illness alter dynamic tests (Kovacs Ch4).',
      addison: 'Key: **low cortisol + high ACTH**, no response to cosyntropin, low aldosterone with high renin.',
      secai: 'Key: **low cortisol without high ACTH**, blunted cosyntropin response after chronic ACTH lack, **aldosterone preserved**. Exogenous glucocorticoids are the commonest cause.',
      cushpit: 'Key: hypercortisolism that **fails low-dose** suppression, is **ACTH-dependent**, **partly suppresses with high-dose** dexamethasone and **responds to CRH**.',
      ectopic: 'Key: very high ACTH, **no suppression** with high-dose dexamethasone, **no CRH response**, hypokalemia from cortisol acting on MR.',
      adenoma: 'Key: hypercortisolism with **suppressed ACTH** (ACTH-independent).',
      conn: 'Key: **high aldosterone with suppressed renin**, failing to suppress with salt loading.',
      acro: 'Key: **high IGF-1** and **GH not suppressed by oral glucose**.',
      ghd: 'Key: **low IGF-1** and **no GH rise to a provocative stimulus** (e.g., insulin hypoglycemia).',
      cdi: 'Key: dilute urine during water deprivation that **concentrates after desmopressin**; low ADH.',
      ndi: 'Key: dilute urine that **does not respond to desmopressin**; high ADH.',
      polyd: 'Key: urine **concentrates** with deprivation; plasma osmolality starts low-normal.',
      hypopara: 'Key: low Ca²⁺, high phosphate, **low PTH**; normal response to infused PTH.',
      php: 'Key: low Ca²⁺, high phosphate, **high PTH**, and a **blunted urinary cAMP/phosphate response** to PTH (Gαs defect).',
      hypo1: 'Key: **high TSH, low free T4**; exaggerated TSH response to TRH.',
      hypo2: 'Key: **low free T4 with low/normal TSH** — TSH alone misleads in pituitary disease.',
      graves: 'Key: **suppressed TSH, high free T4, positive TSH-receptor antibodies**.',
    };
    load(params.c && CASES.find((c) => c.id === params.c) ? params.c : 'c1');
    el.appendChild(EP.sources(['kovacs4', 'kovacs3', 'kovacs5', 'kovacs12', 'kovacs13', 'kovacs14', 'molina1', 'molina2', 'molina6']));
  };
})();
