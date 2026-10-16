/* Exogenous androgens (testosterone replacement, anabolic–androgenic steroids) and other hormones that
 * act on the male HPG axis. Rendered on the "Testis & androgens" page by EP.views.testisPage.
 * Directions of change follow Kovacs Ch9 / Molina Ch8 and the sources cited in each block. */
(function () {
  'use strict';
  const EP = window.EP;
  const { h } = EP;

  // ------------------------------------------------------------------ diagram
  // Left: the axis that exogenous androgen switches off. Right: what the extra androgen does in the body.
  const DIAGRAM = {
    w: 1060, h: 600, minW: 760, label: 'What exogenous androgen does to the HPG axis and to the body',
    zones: [
      { x: 10, y: 10, w: 470, h: 580, label: 'Hypothalamic–pituitary–testicular axis', kind: 'cell' },
      { x: 500, y: 10, w: 550, h: 580, label: 'Rest of the body', kind: 'cell' },
    ],
    nodes: [
      { id: 'gnrh', x: 140, y: 80, label: 'Hypothalamus:\nGnRH pulses', k: 'hormone', info: 'Kisspeptin neurons drive GnRH pulses. Androgen (via AR) and estradiol (aromatized from it) slow the pulses — the main brake exogenous androgen uses.' },
      { id: 'lhfsh', x: 140, y: 200, label: 'Pituitary:\nLH + FSH', k: 'hormone', info: 'LH drives Leydig cells; FSH drives Sertoli cells. Both fall to low or undetectable levels on exogenous androgen.' },
      { id: 'leydig', x: 110, y: 340, label: 'Leydig cells:\nintratesticular T', k: 'organ', info: 'Testosterone inside the testis is normally far higher than in blood. Spermatogenesis needs this local level; injected testosterone cannot recreate it because it arrives from blood at serum concentration.' },
      { id: 'sertoli', x: 330, y: 340, label: 'Sertoli cells:\nspermatogenesis', k: 'organ', info: 'Needs FSH plus high intratesticular testosterone. Without them sperm output falls, often to azoospermia, and the testes shrink (germ cells make up most of their volume).' },
      { id: 'inhibin', x: 330, y: 460, label: 'Inhibin B', k: 'hormone', info: 'Sertoli-cell product that restrains FSH. Falls when spermatogenesis is suppressed.' },
      { id: 'testes', x: 110, y: 460, label: 'Testis size\n& sperm count', k: 'process', info: 'Testicular atrophy and oligo- or azoospermia are the classic signs of androgen use.' },
      { id: 'exo', x: 610, y: 80, label: 'Exogenous androgen\n(TRT or AAS)', k: 'drug', info: '**TRT**: testosterone replacement aimed at the mid-normal range in men with proven hypogonadism. **AAS**: anabolic–androgenic steroids taken without prescription, usually at doses several to many times replacement, often stacked.' },
      { id: 'serum', x: 610, y: 240, label: 'Serum androgen', k: 'hormone', info: 'With testosterone itself the assay shows normal (TRT) or high (AAS) testosterone. With non-testosterone AAS (nandrolone, oxandrolone, stanozolol…) measured testosterone is **low**, because the drug is not detected but still suppresses LH.' },
      { id: 'e2', x: 610, y: 390, label: 'Aromatase →\nestradiol', k: 'enzyme', info: 'Aromatizable androgens (testosterone) raise estradiol, which adds to LH suppression and drives gynecomastia.' },
      { id: 'dht', x: 610, y: 520, label: '5α-reductase →\nDHT', k: 'enzyme', info: 'DHT drives acne, male-pattern hair loss and prostate growth (PSA rises).' },
      { id: 'muscle', x: 920, y: 60, label: 'Muscle: ↑ mass\n& strength', k: 'good', info: 'Supraphysiologic testosterone increases fat-free mass, muscle size and strength, more so with resistance training {{ref:bhasin1996}}.' },
      { id: 'blood', x: 920, y: 145, label: 'Bone marrow:\n↑ hematocrit', k: 'bad', info: 'Testosterone raises erythropoietin and suppresses hepcidin → erythrocytosis; hematocrit is monitored on TRT {{ref:bhasin2018}}.' },
      { id: 'liver', x: 920, y: 230, label: 'Liver: ↓ SHBG, ↓ HDL;\noral AAS hepatotoxic', k: 'bad', info: 'Androgens lower SHBG and HDL and raise LDL (oral 17α-alkylated AAS most). Oral 17α-alkylated AAS can cause cholestasis, peliosis hepatis and hepatic adenomas {{ref:pope2014}}.' },
      { id: 'heart', x: 920, y: 315, label: 'Heart: LV hypertrophy,\n↓ function, ↑ BP', k: 'bad', info: 'Long-term high-dose AAS use is linked to LV hypertrophy, reduced systolic and diastolic function, atherosclerosis and premature death {{ref:pope2014}} {{ref:basaria2010}}.' },
      { id: 'brain', x: 920, y: 400, label: 'Brain: mood, libido,\ndependence', k: 'process', info: 'Libido rises. At high doses a minority develop hypomania or aggression; dependence occurs, and stopping can bring depression and low libido (withdrawal) {{ref:pope2014}}.' },
      { id: 'breast', x: 920, y: 485, label: 'Breast:\ngynecomastia', k: 'bad', info: 'Estradiol from aromatization (and lost androgen–estrogen balance after stopping) stimulates breast glandular tissue.' },
      { id: 'skin', x: 920, y: 560, label: 'Skin & prostate: acne,\nhair loss, ↑ PSA', k: 'bad', info: 'DHT-mediated effects on the sebaceous gland, scalp follicle and prostate.' },
    ],
    edges: [
      { f: 'gnrh', t: 'lhfsh', k: 'act' },
      { f: 'lhfsh', t: 'leydig', k: 'act', label: 'LH' },
      { f: 'lhfsh', t: 'sertoli', k: 'act', label: 'FSH' },
      { f: 'leydig', t: 'sertoli', k: 'act', label: 'local T' },
      { f: 'sertoli', t: 'inhibin', k: 'act' },
      { f: 'sertoli', t: 'testes', k: 'act' },
      { f: 'leydig', t: 'serum', k: 'flow', via: [[230, 270], [470, 270], [470, 240]], label: 'own T' },
      { f: 'exo', t: 'serum', k: 'flow', anim: true },
      { f: 'serum', t: 'gnrh', k: 'fb', via: [[522, 240], [522, 70]], label: 'androgen feedback' },
      { f: 'e2', t: 'gnrh', k: 'fb', via: [[500, 390], [500, 92]], label: 'estradiol feedback' },
      { f: 'serum', t: 'e2', k: 'flow' },
      { f: 'serum', t: 'dht', k: 'flow', via: [[690, 240], [690, 520]] },
      { f: 'serum', t: 'muscle', k: 'act' },
      { f: 'serum', t: 'blood', k: 'act' },
      { f: 'serum', t: 'liver', k: 'act' },
      { f: 'serum', t: 'heart', k: 'act' },
      { f: 'serum', t: 'brain', k: 'act' },
      { f: 'e2', t: 'breast', k: 'act' },
      { f: 'dht', t: 'skin', k: 'act' },
    ],
    states: [
      { id: 'normal', label: 'Normal man', n: {}, e: { 'exo>serum': 'off' }, cap: 'Normal axis: GnRH pulses → LH and FSH → high **intratesticular** testosterone drives spermatogenesis, and the testosterone that reaches blood feeds back to keep LH in range.' },
      { id: 'trt', label: 'Testosterone replacement (TRT)', n: { exo: { b: 'on' }, serum: { b: '↔' }, gnrh: { b: '↓', c: 'bad' }, lhfsh: { b: '↓↓', c: 'bad' }, leydig: { b: '↓↓', c: 'bad' }, sertoli: { b: '↓↓', c: 'bad' }, inhibin: { b: '↓' }, testes: { b: '↓', c: 'bad' }, blood: { b: '↑' }, e2: { b: '↔' }, dht: { b: '↔' }, muscle: { b: '↔/↑' }, liver: { b: '↔' }, heart: { b: '↔' }, brain: { b: '↔' }, breast: { b: '↔' }, skin: { b: '↔' } }, e: { 'serum>gnrh': 'thick', 'leydig>serum': 'weak', 'lhfsh>leydig': 'weak', 'lhfsh>sertoli': 'weak', 'leydig>sertoli': 'weak' }, cap: 'Replacement in a hypogonadal man brings **serum** testosterone to the normal range and relieves symptoms — but the extra feedback still switches off LH and FSH, so sperm production falls. TRT is therefore not used in men who want fertility soon; hematocrit and prostate are monitored {{ref:bhasin2018}}.' },
      { id: 'aas', label: 'Supraphysiologic AAS', n: { exo: { b: '↑↑' }, serum: { b: '↑↑*' }, gnrh: { b: '↓↓', c: 'bad' }, lhfsh: { b: '↓↓', c: 'bad' }, leydig: { b: '↓↓', c: 'off' }, sertoli: { b: '↓↓', c: 'bad' }, inhibin: { b: '↓↓', c: 'bad' }, testes: { b: '↓↓', c: 'bad' }, e2: { b: '↑' }, dht: { b: '↑' }, muscle: { b: '↑↑', c: 'good' }, blood: { b: '↑↑', c: 'bad' }, liver: { b: '↑', c: 'bad' }, heart: { b: '↑', c: 'bad' }, brain: { b: '↑' }, breast: { b: '↑', c: 'bad' }, skin: { b: '↑', c: 'bad' } }, e: { 'serum>gnrh': 'thick', 'e2>gnrh': 'thick', 'exo>serum': 'thick', 'serum>muscle': 'thick', 'serum>blood': 'thick', 'serum>liver': 'thick', 'serum>heart': 'thick' }, cap: 'Doses several to many times replacement: muscle grows, but LH and FSH become undetectable → **testicular atrophy and oligo/azoospermia**; ↑ hematocrit, ↓ HDL, ↓ SHBG, gynecomastia, acne. *If only non-testosterone AAS are used, the testosterone assay reads **low** {{ref:pope2014}} {{ref:basaria2010}}.' },
      { id: 'stop', label: 'After stopping AAS', n: { exo: { c: 'off' }, serum: { b: '↓↓', c: 'bad' }, gnrh: { b: '↓', c: 'bad' }, lhfsh: { b: '↓→↑' }, leydig: { b: '↓', c: 'bad' }, sertoli: { b: '↓', c: 'bad' }, inhibin: { b: '↓' }, testes: { b: '↓', c: 'bad' }, e2: { b: '↓' }, muscle: { b: '↓' }, brain: { b: '↓', c: 'bad' }, blood: { b: '↓' } }, e: { 'serum>gnrh': 'weak' }, cap: '**Anabolic steroid–induced hypogonadism**: the drug is gone but the axis is still suppressed, so serum testosterone is low while LH is low or inappropriately normal — fatigue, low libido, erectile dysfunction, low mood. Recovery takes months and depends on dose, type and duration; hCG or a SERM is sometimes used to speed it {{ref:rahnema2014}}. In hormonal-contraception trials sperm counts recovered to ≥20 million/mL in 67% of men by 6 months, 90% by 12 and all by 24 months {{ref:liu2006}}.' },
    ],
    steps: [
      { n: ['exo', 'serum'], cap: 'Androgen enters from outside, adding to (and then replacing) the testes\' own output.' },
      { n: ['serum', 'e2', 'gnrh', 'lhfsh'], e: ['serum>gnrh', 'e2>gnrh'], cap: 'The hypothalamus and pituitary only see **serum** androgen and estradiol, so they read "too much" and cut GnRH, LH and FSH.' },
      { n: ['lhfsh', 'leydig', 'sertoli', 'inhibin', 'testes'], cap: 'Without LH, Leydig cells stop making testosterone, so **intratesticular** testosterone collapses; without FSH and local testosterone, spermatogenesis and inhibin B fall and the testes shrink.' },
      { n: ['serum', 'muscle', 'blood', 'liver', 'heart', 'brain'], cap: 'Meanwhile the extra serum androgen acts on muscle, marrow, liver, heart and brain.' },
      { n: ['serum', 'e2', 'dht', 'breast', 'skin'], cap: 'Conversion to **estradiol** (gynecomastia) and **DHT** (acne, hair loss, prostate) adds a second set of effects.' },
    ],
  };

  // ------------------------------------------------------------------ tables
  const LABS = [
    // condition, total T, LH/FSH, other clues
    ['Normal man', '↔', '↔', 'Normal testes (15–25 mL), normal semen.'],
    ['Primary hypogonadism (e.g. Klinefelter)', '↓', '↑ / ↑↑ (FSH most)', 'Small firm testes; inhibin B ↓.'],
    ['Secondary hypogonadism (pituitary/hypothalamic)', '↓', '↓ or inappropriately normal', 'Look for prolactinoma, other pituitary deficits, opioids, glucocorticoids.'],
    ['Testosterone use (TRT or AAS)', '↔ (TRT) or ↑↑ (AAS)', '↓↓ (often undetectable)', 'Small testes, low sperm count, inhibin B ↓, hematocrit ↑, HDL ↓, SHBG ↓.'],
    ['Non-testosterone AAS only (nandrolone, oxandrolone, stanozolol…)', '↓ (drug not measured)', '↓↓', 'Mimics secondary hypogonadism; clues are very low SHBG and HDL, high hematocrit, muscle bulk, history.'],
    ['After stopping AAS (steroid-induced hypogonadism)', '↓', '↓ or normal, recovering', 'Months to recover; symptoms of low testosterone {{ref:rahnema2014}}.'],
  ];
  const OTHERS = [
    // agent, how it acts on the axis, LH/FSH, serum T, intratesticular T / sperm, note
    ['hCG', 'LH-receptor agonist acting directly on Leydig cells', '↓ (own LH)', '↑', 'Maintained ↑ — spermatogenesis preserved', 'Used with or instead of testosterone to keep fertility, and to restart the testes after AAS {{ref:rahnema2014}}.'],
    ['Continuous GnRH agonist (leuprolide)', 'Initial flare, then GnRH-receptor down-regulation', '↑ then ↓↓', 'Flare, then castrate level in ~2–4 weeks', '↓↓', 'Continuous (not pulsatile) GnRH switches the axis off — prostate cancer, central precocious puberty.'],
    ['GnRH antagonist (degarelix, relugolix)', 'Blocks the GnRH receptor immediately', '↓↓ (hours–days)', 'Castrate level within days, no flare', '↓↓', 'No flare, so no need for antiandrogen cover.'],
    ['Clomiphene / enclomiphene (SERM)', 'Blocks estradiol feedback at the hypothalamus', '↑', '↑', 'Preserved', 'Raises the man\'s own testosterone without suppressing sperm (off-label in secondary hypogonadism).'],
    ['Aromatase inhibitor (anastrozole, letrozole)', 'Less estradiol feedback', '↑', '↑', 'Preserved', 'Estradiol falls — bone loss risk; estradiol is needed for male bone.'],
    ['Exogenous estrogen', 'Strong negative feedback', '↓↓', '↓↓', '↓↓', 'Gynecomastia; used in gender-affirming care and formerly for prostate cancer; VTE risk with oral forms.'],
    ['5α-reductase inhibitor (finasteride, dutasteride)', 'Blocks testosterone → DHT (not a feedback signal)', '↔', '↔ or slightly ↑', '↔', 'DHT ↓ → smaller prostate, PSA roughly halves, less scalp hair loss.'],
    ['High-dose glucocorticoids', 'Suppress GnRH and Leydig function', '↓', '↓', '↓', 'Another common cause of secondary hypogonadism.'],
  ];
  const cell = (x) => h('td', { html: EP.md(x) });
  const table = (head, rows) => h('div.cmp-wrap', h('table.cmp-table', h('thead', h('tr', head.map((x) => h('th', x)))), h('tbody', rows.map((r) => h('tr', r.map(cell))))));

  EP.exoAndrogen = function (el) {
    el.appendChild(h('h2', { id: 'exogenous' }, 'Exogenous androgens: replacement, abuse and recovery'));
    el.appendChild(h('p.lede', { html: EP.md('The hypothalamus and pituitary cannot tell injected testosterone from the testes\' own: they see **more androgen in blood** and switch LH and FSH off. Serum androgen is therefore normal or high while the testes — which depend on LH, FSH and their own **local** testosterone — shut down. Pick a state below or walk through it.') }));
    el.appendChild(h('div.card', EP.flow(DIAGRAM, { label: DIAGRAM.label })));

    el.appendChild(h('h3', 'Reading the labs'));
    el.appendChild(table(['Situation', 'Total testosterone', 'LH / FSH', 'Other clues'], LABS));

    el.appendChild(h('h3', 'Who else is affected'));
    el.appendChild(h('div.grid2',
      h('div.card', h('h4', 'Women'), h('ul.keypoints', { html: [
        'Androgen excess suppresses LH/FSH → **irregular periods or amenorrhea**, anovulation.',
        '**Virilization**: hirsutism, acne, clitoral enlargement, deepened voice, male-pattern hair loss. Voice and clitoral changes are often **permanent**.',
        'Same metabolic effects as in men: ↓ HDL, ↑ hematocrit, liver toxicity with oral AAS {{ref:pope2014}}.',
      ].map((x) => `<li>${EP.md(x)}</li>`).join('') })),
      h('div.card', h('h4', 'Children and adolescents'), h('ul.keypoints', { html: [
        'Androgen is aromatized to **estradiol**, which closes the growth plates → **early epiphyseal fusion and shorter adult height**.',
        'Precocious virilization (pubic hair, penile/clitoral growth, deep voice) with **suppressed** gonadotropins and small testes — a peripheral (gonadotropin-independent) pattern.',
        'Accidental exposure to a parent\'s testosterone gel can cause this in young children.',
      ].map((x) => `<li>${EP.md(x)}</li>`).join('') }))));

    el.appendChild(h('h3', 'Other hormones and drugs that act on the male axis'));
    el.appendChild(table(['Agent', 'What it does to the axis', 'LH / FSH', 'Serum T', 'Intratesticular T / sperm', 'Note'], OTHERS));

    el.appendChild(h('p.small.muted', 'Try it live: the ', h('a', { href: '#/hpgm?preset=exoT' }, 'HPG axis (male) simulator'), ' has an “Exogenous testosterone / anabolic steroids” preset and an exogenous-testosterone slider.'));
    el.appendChild(EP.sources(['bhasin2018', 'pope2014', 'basaria2010', 'rahnema2014', 'liu2006', 'bhasin1996', 'kovacs9', 'molina8']));
  };
})();
