/* Application shell: page registry, navigation, router, info drawer, search. */
(function () {
  'use strict';
  const EP = window.EP;
  const { h } = EP;
  const V = EP.views;

  // ------------------------------------------------------------------ pages
  // Each page: id, title, section, keywords, pathways/networks it shows (for search + "appears in").
  const PW = (id, opts) => (el, params) => V.pathwayPage(el, id, opts, params);
  EP.sections = [
    { k: 'A', title: 'Endocrine Fundamentals', pages: [
      { id: 'classes', title: 'Hormone classes & life cycle', render: V.classes, pathways: ['peptidelife', 'steroidlife'], kw: 'peptide steroid amine synthesis storage secretion transport binding protein clearance half-life' },
      { id: 'receptors', title: 'Receptors & second messengers', render: V.receptors, pathways: ['gs', 'gi', 'gq', 'rtk', 'jakstat', 'nuclear'], kw: 'GPCR Gs Gi Gq cAMP PKA IP3 DAG calcium receptor tyrosine kinase JAK STAT nuclear receptor amplification desensitization downregulation upregulation' },
      { id: 'cascades', title: 'Signaling cascades ★', render: V.cascades, kw: 'signaling cascade branch PI3K Akt mTOR mTORC1 S6K Ras MAPK ERK Grb2 SOS cAMP PKA CREB CRTC2 PFK-2 fructose-2,6-bisphosphate glucocorticoid receptor GRE NF-kB transrepression SGK1 Nedd4-2 ENaC JAK STAT5 STAT3 guanylyl cyclase cGMP McCune-Albright pseudohypoparathyroidism Graves leptin MC4R adrenergic alpha beta' },
      { id: 'testlab', title: 'Endocrine testing lab ★', render: V.testlab, kw: 'stimulation suppression test dexamethasone cosyntropin metyrapone CRH insulin tolerance water deprivation desmopressin salt loading oral glucose GH PTH infusion TRH diagnosis' },
      { id: 'feedback', title: 'Feedback loops', render: V.feedback, networks: ['motif_neg', 'motif_pos', 'motif_ff'], kw: 'negative positive feedback short loop long loop feed-forward set point' },
      { id: 'secretion', title: 'Pulsatile, circadian & clearance', render: V.secretion, kw: 'pulsatile circadian rhythm half-life clearance GnRH desensitization cortisol rhythm' },
    ] },
    { k: 'B', title: 'Hypothalamus & Pituitary', pages: [
      { id: 'pitmap', title: 'Pituitary integration map ★', render: V.pituitaryMap, kw: 'pituitary integration cross-axis organ systems stress hypothyroidism prolactinoma pregnancy macroadenoma stalk effect anorexia growth' },
      { id: 'hpa', title: 'HPA axis (CRH–ACTH–cortisol)', render: (el, p) => V.axisPage(el, 'hpa', p), networks: ['hpa'], kw: 'CRH ACTH cortisol adrenal insufficiency Addison Cushing exogenous glucocorticoid circadian' },
      { id: 'hpt', title: 'HPT axis (TRH–TSH–T4/T3)', render: (el, p) => V.axisPage(el, 'hpt', p), networks: ['hpt'], kw: 'TRH TSH T4 T3 hypothyroidism hyperthyroidism Graves Hashimoto' },
      { id: 'hpgm', title: 'HPG axis — male', render: (el, p) => V.axisPage(el, 'hpgm', p), networks: ['hpgm'], pathways: ['testis'], kw: 'GnRH LH FSH testosterone inhibin Leydig Sertoli hypogonadism anabolic steroids' },
      { id: 'hpgf', title: 'HPG axis — female', render: (el, p) => V.axisPage(el, 'hpgf', p), networks: ['hpgf'], pathways: ['ovary'], kw: 'GnRH LH FSH estradiol progesterone LH surge positive feedback menopause amenorrhea' },
      { id: 'gh', title: 'GH – IGF-1 axis', render: (el, p) => V.axisPage(el, 'gh', p), networks: ['gh'], pathways: ['jakstat'], kw: 'GHRH somatostatin GH IGF-1 acromegaly Laron growth' },
      { id: 'prl', title: 'Prolactin (dopamine control)', render: (el, p) => V.axisPage(el, 'prl', p), networks: ['prl'], kw: 'prolactin dopamine D2 prolactinoma stalk lactation' },
      { id: 'posterior', title: 'Posterior pituitary: ADH & oxytocin', render: V.posterior, networks: ['adh', 'motif_pos'], pathways: ['adhcd'], kw: 'ADH vasopressin oxytocin osmolality diabetes insipidus SIADH aquaporin' },
    ] },
    { k: 'C', title: 'Thyroid', pages: [
      { id: 'thyroid', title: 'Thyroid hormone synthesis', render: PW('thyroid', { q: 'How does iodide in blood become T4 and T3 — and which step does each drug or disease hit?', more: ['thyroidaction'], net: 'hpt', cascade: ['tsh', 't3'], after: (el, p) => { el.appendChild(EP.h('h2', { style: { marginTop: '18px' } }, 'Thyroid disorders: read the pattern')); EP.mountThyroidStates(el, p); el.appendChild(EP.h('h2', { style: { marginTop: '18px' } }, 'Iodide autoregulation: the Wolff–Chaikoff effect and escape')); EP.mountWolffChaikoff(el); } }), pathways: ['thyroid', 'thyroidaction'], kw: 'iodide NIS pendrin thyroglobulin TPO organification coupling deiodinase D1 D2 D3 TBG T4 T3 reverse T3 thyroiditis Hashimoto subacute Graves toxic nodule Wolff-Chaikoff iodine deficiency radioiodine uptake' },
    ] },
    { k: 'D', title: 'Adrenal', pages: [
      { id: 'steroidogenesis', title: 'Steroidogenesis map ★', render: V.steroid, kw: 'cholesterol pregnenolone 21-hydroxylase 11-beta hydroxylase 17-alpha hydroxylase aldosterone synthase CAH zona glomerulosa fasciculata reticularis DHEA androstenedione 17-OHP' },
      { id: 'cortisol', title: 'Cortisol actions & rhythm', render: PW('cortisolaction', { q: 'Where does cortisol act, and how does it raise glucose?', net: 'hpa', cascade: 'cortisol', anim: 'gr', animTitle: 'Animated cell: cortisol → GR → gene → protein' }), pathways: ['cortisolaction', 'nuclear'], kw: 'cortisol glucocorticoid receptor gluconeogenesis immune circadian' },
      { id: 'raas', title: 'RAAS & aldosterone', render: (el, p) => V.axisPage(el, 'raas', p), networks: ['raas'], kw: 'renin angiotensin aldosterone potassium hyperaldosteronism' },
      { id: 'potassium', title: 'Potassium balance', render: PW('potassium', { q: 'How do insulin, epinephrine and aldosterone keep plasma K⁺ within a narrow range after a K⁺-rich meal?', cascade: 'aldo' }), pathways: ['potassium'], kw: 'potassium hyperkalemia hypokalemia insulin shift Na/K-ATPase aldosterone ENaC ROMK amiloride Liddle' },
      { id: 'medulla', title: 'Adrenal medulla & catecholamines', render: PW('catecholamine', { q: 'How does a sympathetic signal become circulating epinephrine — and why does the medulla need cortisol?', cascade: 'epinephrine' }), pathways: ['catecholamine'], kw: 'epinephrine norepinephrine tyrosine hydroxylase PNMT chromaffin alpha beta adrenergic pheochromocytoma metanephrines' },
    ] },
    { k: 'E', title: 'Pancreas & Glucose', pages: [
      { id: 'insulin', title: 'Insulin signaling ★ (prototype)', render: V.insulin, pathways: ['insulin', 'irmech'], kw: 'insulin receptor IRS PI3K PIP3 Akt AS160 TBC1D4 GLUT4 FOXO1 GSK3 mTOR PDE3B insulin resistance' },
      { id: 'irphys', title: 'Insulin action & resistance: physiology ★', render: V.irphys, kw: 'insulin action insulin resistance physiology Petersen Shulman reading chapter receptor IRS PI3K AKT GLUT4 TBC1D4 glycogen synthase G6P allostery liver glycogen glucokinase FOXO1 CRTC2 SREBP-1c lipolysis PDE3B perilipin ATGL HSL indirect adipose liver acetyl-CoA pyruvate carboxylase glycerol gluconeogenesis spare receptors selective hepatic insulin resistance ectopic lipid DAG PKC epsilon theta Thr1160 ceramide Randle ER stress mitochondria inflammation BCAA adiponectin integrated model' },
      { id: 'irlab', title: 'Insulin resistance lab ★ (Petersen & Shulman)', render: V.irlab, kw: 'insulin resistance dose response EC50 receptor post-receptor selective hepatic insulin resistance SREBP-1c FOXO1 hepatic glucose production glycogenolysis gluconeogenesis indirect adipose lipolysis acetyl-CoA pyruvate carboxylase Rothman Perry acetate atglistatin lipid infusion Randle DAG PKC epsilon theta Thr1160 ceramide acylcarnitine ER stress mitochondria ROS inflammation macrophage TNF BCAA RBP4 adiponectin fetuin FGF21 clamp HOMA Shulman Petersen' },
      { id: 'glut4', title: 'GLUT4: insulin vs exercise ★', render: V.glut4page, kw: 'GLUT4 translocation exercise contraction AMPK insulin vesicle muscle adipocyte' },
      { id: 'glucagon', title: 'Glucagon simulation ★', render: V.glucagonPage, pathways: ['glucagon'], kw: 'glucagon cAMP PKA glycogenolysis gluconeogenesis ketogenesis muscle liver' },
      { id: 'hypoglycemia', title: 'Hypoglycemia counterregulation', render: PW('counterreg', { q: 'As glucose falls, which defenses switch on first — and which are lost in type 1 diabetes?' }), pathways: ['counterreg'], kw: 'hypoglycemia counterregulation glucagon epinephrine cortisol GH symptoms neuroglycopenia autonomic' },
      { id: 'dkahhs', title: 'DKA vs HHS', render: PW('dkahhs', { q: 'Why does absolute insulin deficiency cause ketoacidosis, while a little insulin plus dehydration causes a hyperosmolar state instead?' }), pathways: ['dkahhs'], kw: 'DKA diabetic ketoacidosis HHS hyperosmolar hyperglycemic nonketotic coma osmotic diuresis ketones dehydration' },
      { id: 'betacell', title: 'β-cell & incretins', render: PW('betacell', { q: 'How does a rise in glucose become insulin exocytosis, and how do GLP-1 and epinephrine adjust it?', net: 'motif_ff', anim: 'beta', animTitle: 'Animated β-cell: glucose → K-ATP → Ca²⁺ → exocytosis' }), pathways: ['betacell'], kw: 'beta cell glucokinase KATP sulfonylurea calcium GLP-1 GIP incretin somatostatin' },
    ] },
    { k: 'F', title: 'Calcium, Bone & Mineral', pages: [
      { id: 'calcium', title: 'Ca / PTH / vitamin D / FGF23 ★', render: V.calciumPage, networks: ['calcium'], pathways: ['kidneymineral'], kw: 'calcium PTH vitamin D calcitriol FGF23 phosphate CaSR hyperparathyroidism CKD' },
      { id: 'bone', title: 'Bone remodeling', render: PW('bone', { q: 'What decides whether bone is resorbed or formed?' }), pathways: ['bone'], kw: 'osteoblast osteoclast RANK RANKL OPG estrogen bone remodeling denosumab' },
    ] },
    { k: 'G', title: 'Reproductive', pages: [
      { id: 'sexdiff', title: 'Sexual differentiation ★', render: V.sexdiff, kw: 'sexual differentiation SRY SOX9 SF-1 WT1 AMH müllerian wolffian testosterone DHT 5-alpha reductase androgen insensitivity Turner Klinefelter Swyer CAH aromatase DSD Jost' },
      { id: 'testis', title: 'Testis & androgens', render: V.testisPage, pathways: ['testis', 'androgen'], kw: 'Leydig Sertoli testosterone DHT 5-alpha reductase aromatase spermatogenesis' },
      { id: 'ovary', title: 'Ovary & menstrual cycle', render: V.cycle, pathways: ['ovary', 'pcos'], kw: 'menstrual cycle follicular luteal ovulation LH surge granulosa theca folliculogenesis estradiol progesterone' },
      { id: 'pregnancy', title: 'Pregnancy & puberty', render: V.pregnancy, pathways: ['placenta', 'parturition'], kw: 'pregnancy hCG placenta progesterone estriol puberty kisspeptin GnRH pulse' },
    ] },
    { k: 'H', title: 'Metabolism', pages: [
      { id: 'flux', title: 'Metabolic flux simulator ★', render: V.flux, kw: 'flux fed fasting exercise stress organ glucose lactate ketone fatty acid insulin glucagon knobs' },
      { id: 'hepatocyte', title: 'Liver metabolic map', render: (el, p) => V.boundPathway(el, 'hepatocyte', p, 'Inside one hepatocyte: which pathways run in the fed state, and which in fasting?'), pathways: ['hepatocyte'], kw: 'glycolysis gluconeogenesis glycogen pentose phosphate PDH TCA electron transport oxidative phosphorylation urea cycle cholesterol synthesis' },
      { id: 'acetylcoa', title: 'Acetyl-CoA hub ★', render: (el, p) => V.boundPathway(el, 'acetylcoa', p, 'What happens to acetyl-CoA during fasting — and why can it activate gluconeogenesis without becoming glucose?'), pathways: ['acetylcoa'], kw: 'acetyl-CoA pyruvate carboxylase PDH ketogenesis TCA oxaloacetate bottleneck fatty acid synthesis' },
      { id: 'fattyacid', title: 'Fatty acids & malonyl-CoA', render: (el, p) => V.boundPathway(el, 'fattyacid', p, 'Why does feeding stop fat burning? Follow malonyl-CoA to CPT-1.'), pathways: ['fattyacid'], kw: 'lipolysis HSL ATGL beta oxidation CPT-1 malonyl-CoA ACC fatty acid synthesis triglyceride ketogenesis' },
      { id: 'aminoacid', title: 'Amino acids & urea cycle', render: (el, p) => V.boundPathway(el, 'aminoacid', p, 'Where do the nitrogen and the carbon of an amino acid go?'), pathways: ['aminoacid'], kw: 'amino acids mTOR transamination deamination urea cycle nitrogen alanine glutamine glucagon' },
      { id: 'appetite', title: 'Appetite & energy balance', render: PW('appetite', { q: 'How do ghrelin, CCK, GLP-1, leptin and insulin set hunger, satiety and energy expenditure?', cascade: 'leptin' }), pathways: ['appetite'], kw: 'appetite hunger satiety ghrelin CCK GLP-1 leptin NPY AgRP POMC MC4R obesity energy expenditure' },
      { id: 'lipoprotein', title: 'Lipoproteins & cholesterol', render: PW('lipoprotein', { q: 'How do dietary and hepatic lipids reach tissues, and where does cholesterol go?' }), pathways: ['lipoprotein'], kw: 'chylomicron VLDL LDL HDL lipoprotein lipase cholesterol statin' },
    ] },
    { k: '★', title: 'Explore & Learn', pages: [
      { id: 'whatif', title: 'What happens if…?', render: V.whatif, kw: 'perturbation cascade what if' },
      { id: 'follow', title: 'Follow the molecule / hormone', render: V.follow, kw: 'follow molecule hormone fate glucose fatty acid' },
      { id: 'organmap', title: 'Organ cross-talk map', render: V.organmap, kw: 'organ map cross-talk liver muscle adipose brain kidney pancreas adipokine' },
      { id: 'compare', title: 'Compare', render: V.compare, kw: 'compare fed fasting insulin glucagon primary secondary' },
      { id: 'cases', title: 'Clinical cases', render: V.cases, kw: 'case patient predict' },
      { id: 'sources', title: 'Sources & model notes', render: V.sourcesPage, kw: 'references sources textbook PubMed' },
    ] },
  ];
  EP.pages = {};
  EP.sections.forEach((s) => s.pages.forEach((p) => { p.section = s.title; EP.pages[p.id] = p; }));
  EP.pages.home = { id: 'home', title: 'Home', render: V.home, section: '' };

  // Pathway → page lookup, entity → pathways index
  EP.pageForPathway = {};
  EP.pageForNetwork = {};
  Object.values(EP.pages).forEach((p) => { (p.pathways || []).forEach((id) => { EP.pageForPathway[id] = EP.pageForPathway[id] || p.id; }); (p.networks || []).forEach((id) => { EP.pageForNetwork[id] = EP.pageForNetwork[id] || p.id; }); });
  EP.appears = {};
  Object.values(EP.pathways).forEach((pw) => pw.nodes.forEach((n) => { const id = n.ent || n.id; (EP.appears[id] = EP.appears[id] || new Set()).add(pw.id); }));
  Object.values(EP.networks).forEach((net) => net.nodes.forEach((n) => { if (n.ent) (EP.appears[n.ent] = EP.appears[n.ent] || new Set()).add('net:' + net.id); }));

  // ------------------------------------------------------------------ shell
  const app = document.getElementById('app');
  const sidebar = h('nav.sidebar', { 'aria-label': 'Topics' });
  const main = h('main.main', { id: 'main' });
  const levelBtns = [1, 2, 3, 4].map((lv) => h('button', { onclick: () => EP.setLevel(lv), title: ['Medical student', 'Detailed physiology', 'Molecular', 'Clinical'][lv - 1] }, 'L' + lv, h('span.lvl-long', ' ' + ['Student', 'Physiology', 'Molecular', 'Clinical'][lv - 1])));
  const searchInput = h('input', { type: 'search', placeholder: 'Search: GLUT4, cortisol, acetyl-CoA, 21-hydroxylase…', 'aria-label': 'Search' });
  const searchRes = h('div.search-results');
  const themeBtn = h('button.iconbtn', { title: 'Toggle light/dark', onclick: toggleTheme }, '◐');
  const topbar = h('header.topbar',
    h('button.iconbtn.menu-toggle', { onclick: () => sidebar.classList.toggle('open'), 'aria-label': 'Menu' }, '☰'),
    h('a.brand', { href: '#/home' },
      h('span', { html: '<svg class="logo" viewBox="0 0 32 32"><defs><linearGradient id="lg" x1="0" x2="1"><stop offset="0" stop-color="#6ea8ff"/><stop offset="1" stop-color="#b48cff"/></linearGradient></defs><path d="M16 3 L28 10 L28 22 L16 29 L4 22 L4 10 Z" fill="none" stroke="url(#lg)" stroke-width="2.5"/><circle cx="16" cy="16" r="4" fill="#f4a945"/><path d="M16 12 V6 M19.5 18 L25 21 M12.5 18 L7 21" stroke="url(#lg)" stroke-width="2"/></svg>' }),
      h('span', 'Endocrine Physiology Lab', h('small', 'interactive atlas & metabolic simulator'))),
    h('div.search', searchInput, searchRes),
    h('div.levels', { role: 'group', 'aria-label': 'Detail level' }, levelBtns),
    h('button.whatif-btn', { onclick: () => go('whatif') }, '⚡', h('span', ' What if…?')),
    themeBtn);
  const info = h('aside.info', { 'aria-label': 'Explanation panel' },
    h('div.info-head', h('strong', 'Explain this'), h('button.iconbtn', { onclick: closeInfo, 'aria-label': 'Close' }, '✕')),
    h('div.info-body'));
  app.append(topbar, sidebar, main, info);

  // sidebar
  const collapsed = EP.store.get('collapsed', {});
  EP.sections.forEach((s) => {
    const sec = h('div.nav-sec' + (collapsed[s.k] ? '.collapsed' : ''));
    sec.append(h('button', { onclick: () => { sec.classList.toggle('collapsed'); collapsed[s.k] = sec.classList.contains('collapsed'); EP.store.set('collapsed', collapsed); } }, h('span.letter', s.k), s.title),
      h('ul', s.pages.map((p) => h('li', h('a', { href: '#/' + p.id, 'data-page': p.id, html: EP.esc(p.title).replace('★', '<span class="star">★</span>') })))));
    sidebar.appendChild(sec);
  });

  function effectiveTheme() {
    const t = document.documentElement.dataset.theme;
    if (t === 'light' || t === 'dark') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function toggleTheme() {
    const cur = effectiveTheme() === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = cur; EP.store.set('theme', cur);
  }
  const savedTheme = EP.store.get('theme', null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme; // otherwise follow the system/host theme
  EP.on('level', (lv) => { levelBtns.forEach((b, i) => b.classList.toggle('on', i + 1 === lv)); EP.store.set('level', lv); });
  EP.setLevel(EP.store.get('level', 2));

  // ------------------------------------------------------------------ router
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const params = {};
    (qs || '').split('&').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); params[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return { id: path || 'home', params };
  }
  function go(id, params) {
    const qs = params ? '?' + Object.keys(params).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&') : '';
    location.hash = '#/' + id + qs;
  }
  EP.go = go;
  function route() {
    const { id, params } = parseHash();
    const page = EP.pages[id] || EP.pages.home;
    EP.teardown();
    EP.clear(main);
    closeInfo();
    sidebar.classList.remove('open');
    sidebar.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.page === page.id));
    document.title = (page.id === 'home' ? '' : page.title.replace(' ★', '') + ' · ') + 'Endocrine Physiology Lab';
    try { page.render(main, params || {}); } catch (err) { console.error(err); main.appendChild(h('p.error', 'Something went wrong rendering this page: ' + err.message)); }
    main.scrollTop = 0;
  }
  window.addEventListener('hashchange', route);

  // ------------------------------------------------------------------ info drawer
  const infoBody = info.querySelector('.info-body');
  function openInfo() { info.classList.add('open'); }
  function closeInfo() { info.classList.remove('open'); }
  EP.closeInfo = closeInfo;
  EP.showInfoHTML = function (html) { infoBody.innerHTML = html; openInfo(); };
  EP.showInfo = function (entId, ctx = {}) {
    const ent = EP.data.entities[entId];
    const node = ctx.node;
    const lv = EP.state.level;
    const name = ent ? ent.name : (node && (node.label || node.id)) || entId;
    const type = ent ? ent.type : (node && node.type) || 'protein';
    let html = `<div class="info-type t-${type}"><i></i>${EP.esc(EP.TYPE_LABEL[type] || type)}</div><h3>${EP.esc(name.replace(/\n/g, ' '))}</h3>`;
    if (node && node.label && ent && node.label.replace(/\n/g, ' ') !== ent.name && node.label.replace(/\n/g, ' ') !== ent.short) html += `<p class="muted small">In this diagram: ${EP.esc(node.label.replace(/\n/g, ' '))}</p>`;
    const m = ctx.model, mid = ctx.modelId;
    if (m && mid && m.byId && m.byId[mid]) {
      const q = EP.qual(m.eff(mid), m.ref[mid]);
      html += `<div class="modelval">Current state: <span class="qual ${q.cls}">${q.sym}</span> ${q.word} <span class="muted small">(vs. reference state)</span></div>`;
      html += EP.explainHTML(m, mid);
      const chain = m.trace(mid);
      if (chain.length > 1) html += `<div class="why-head">Main causal chain</div><div class="chain">${chain.map((c) => `<span>${EP.esc((m.byId[c] && m.byId[c].label) || c)} ${EP.qual(m.eff(c), m.ref[c]).sym}</span>`).join('<i>→</i>')}</div>`;
    }
    if (ent) {
      const sec = (k, label, cls) => ent[k] ? `<div class="info-sec ${cls || ''}"><b>${label}</b>${EP.md(ent[k])}</div>` : '';
      html += sec('what', 'What it is');
      if (lv >= 2) html += sec('where', 'Where');
      html += sec('act', 'Activated / stimulated by') + sec('inh', 'Inhibited by');
      html += sec('down', 'Downstream');
      html += lv >= 4 || !ent.down ? sec('clin', 'Clinical: what goes wrong', 'clin') : (ent.clin ? `<details class="info-sec clin"><summary><b style="display:inline">Clinical: what goes wrong</b></summary>${EP.md(ent.clin)}</details>` : '');
      if (ent.refs && ent.refs.length) html += `<div class="info-sec small muted"><b>Sources</b>${ent.refs.map((r) => EP.md(`{{ref:${r}}}`)).join(' ')}</div>`;
    } else if (node && node.desc) html += `<p>${EP.md(node.desc)}</p>`;
    // appears in
    const ap = EP.appears[entId];
    if (ap && ap.size) {
      const links = [...ap].map((pid) => {
        if (pid.startsWith('net:')) { const nid = pid.slice(4); const pg = EP.pageForNetwork[nid]; return pg ? `<a href="#/${pg}">${EP.esc(EP.networks[nid].title)}</a>` : ''; }
        const pg = EP.pageForPathway[pid]; return pg ? `<a href="#/${pg}?focus=${encodeURIComponent(entId)}">${EP.esc(EP.pathways[pid].title.split(':')[0])}</a>` : '';
      }).filter(Boolean);
      if (links.length) html += `<div class="info-sec appears"><b>Appears in</b>${links.join('')}</div>`;
    }
    html += '<div class="info-sec">';
    if (ctx.followable && ctx.onFollow) html += '<button class="btn" data-act="follow-here">↳ Highlight everything downstream here</button> ';
    if (EP.data.fates && EP.data.fates[entId]) html += `<a class="btn" href="#/follow?m=${entId}">Follow this molecule →</a> `;
    if (EP.data.hormoneMap && EP.data.hormoneMap[entId]) html += `<a class="btn" href="#/follow?h=${entId}">Follow this hormone →</a>`;
    html += '</div>';
    infoBody.innerHTML = html;
    const fb = infoBody.querySelector('[data-act="follow-here"]');
    if (fb) fb.onclick = () => ctx.onFollow();
    openInfo();
  };
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('.ent-link');
    if (a) { ev.preventDefault(); EP.showInfo(a.dataset.ent); return; }
    const r = ev.target.closest('.ref-link');
    if (r) { ev.preventDefault(); const ref = EP.data.refs[r.dataset.ref]; if (ref) EP.showInfoHTML(`<div class="why-head">Source</div><p>${EP.refHTML(ref)}</p>`); }
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { closeInfo(); searchRes.classList.remove('open'); } if (ev.key === '/' && document.activeElement.tagName !== 'INPUT') { ev.preventDefault(); searchInput.focus(); } });

  // ------------------------------------------------------------------ search
  const index = [];
  Object.values(EP.pages).forEach((p) => { if (p.id !== 'home') index.push({ kind: 'Pages & modules', title: p.title.replace(' ★', ''), text: (p.kw || '') + ' ' + p.title, go: () => go(p.id), sub: p.section }); });
  Object.values(EP.data.entities).forEach((e) => {
    const pws = [...(EP.appears[e.id] || [])];
    index.push({ kind: 'Components', title: e.name, text: [e.name, e.short, (e.tags || []).join(' '), e.what].join(' '), sub: EP.TYPE_LABEL[e.type], ent: e.id,
      go: () => { const pid = pws.find((x) => !x.startsWith('net:')); if (pid && EP.pageForPathway[pid]) go(EP.pageForPathway[pid], { focus: e.id }); else if (pws[0] && pws[0].startsWith('net:')) go(EP.pageForNetwork[pws[0].slice(4)]); setTimeout(() => EP.showInfo(e.id), 120); } });
  });
  Object.values(EP.networks).forEach((net) => (net.presets || []).forEach((p) => index.push({ kind: 'Disorders & states', title: p.label, text: p.label + ' ' + (p.desc || '') + ' ' + net.title, sub: net.title, go: () => go(EP.pageForNetwork[net.id], { preset: p.id }) })));
  (EP.metabolic.presets || []).forEach((p) => index.push({ kind: 'Disorders & states', title: p.label, text: p.label + ' ' + p.text, sub: 'Metabolic simulator', go: () => go('flux', { preset: p.id }) }));
  (EP.data.steroidDefects || []).forEach((d) => index.push({ kind: 'Disorders & states', title: d.label, text: d.label + ' ' + d.text + ' CAH adrenal', sub: 'Steroidogenesis', go: () => go('steroidogenesis', { defect: d.id }) }));
  Object.keys(EP.data.fates || {}).forEach((id) => { const e = EP.data.entities[id]; index.push({ kind: 'Follow', title: 'Follow ' + (e ? e.name : id), text: 'follow ' + (e ? e.name + ' ' + (e.short || '') : id), go: () => go('follow', { m: id }) }); });
  (EP.data.cases || []).forEach((c) => index.push({ kind: 'Clinical cases', title: c.title, text: c.title + ' ' + c.stem + ' ' + (c.tags || ''), go: () => go('cases', { c: c.id }) }));
  const norm = (s) => String(s || '').toLowerCase().replace(/[‐–—]/g, '-').replace(/β/g, 'beta').replace(/α/g, 'alpha').replace(/[₂²]/g, '2').replace(/[₃³]/g, '3').replace(/₄/g, '4');
  index.forEach((it) => { it.n = norm(it.text); it.t = norm(it.title); });
  let active = -1, results = [];
  function search(q) {
    const qq = norm(q).trim();
    if (!qq) { searchRes.classList.remove('open'); return; }
    const toks = qq.split(/\s+/);
    results = index.map((it) => {
      let s = 0;
      toks.forEach((t) => { if (it.t === t) s += 12; else if (it.t.startsWith(t)) s += 7; else if (it.t.includes(t)) s += 5; if (it.n.includes(t)) s += 2; else s -= 4; });
      return { it, s };
    }).filter((r) => r.s > 0).sort((a, b) => b.s - a.s).slice(0, 40);
    EP.clear(searchRes);
    const groups = {};
    results.forEach((r) => { (groups[r.it.kind] = groups[r.it.kind] || []).push(r); });
    let i = 0;
    ['Pages & modules', 'Components', 'Disorders & states', 'Follow', 'Clinical cases'].forEach((k) => {
      if (!groups[k]) return;
      searchRes.appendChild(h('div.sr-group', k));
      groups[k].slice(0, k === 'Components' ? 10 : 8).forEach((r) => {
        const idx = i++;
        searchRes.appendChild(h('div.sr-item', { 'data-i': idx, onmousedown: (ev) => { ev.preventDefault(); pick(r.it); } }, h('span', r.it.title), h('span.sr-type', r.it.sub || '')));
        r.idx = idx;
      });
    });
    if (!results.length) searchRes.appendChild(h('div.sr-item.muted', 'No matches.'));
    searchRes.classList.add('open'); active = -1;
  }
  function pick(it) { searchRes.classList.remove('open'); searchInput.blur(); it.go(); }
  searchInput.addEventListener('input', () => search(searchInput.value));
  searchInput.addEventListener('focus', () => { if (searchInput.value) search(searchInput.value); });
  searchInput.addEventListener('blur', () => setTimeout(() => searchRes.classList.remove('open'), 150));
  searchInput.addEventListener('keydown', (ev) => {
    const items = [...searchRes.querySelectorAll('.sr-item[data-i]')];
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); active = EP.clamp(active + (ev.key === 'ArrowDown' ? 1 : -1), 0, items.length - 1); items.forEach((x, j) => x.classList.toggle('active', j === active)); }
    if (ev.key === 'Enter') { const el = items[Math.max(active, 0)]; if (el) el.dispatchEvent(new MouseEvent('mousedown')); }
  });
  EP.searchFor = (q) => { searchInput.value = q; searchInput.focus(); search(q); };

  route();
})();
