/* Physiology regression tests: every simulator preset must reproduce the textbook direction
 * of change (up / dn / eq relative to normal; '/' = either acceptable).
 * Run: node tests/physiology.test.js   (exit code 1 on any failure) */
global.window = global; global.document = {}; global.Node = function () {};
const fs = require('fs'); const path = require('path');
const R = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
['js/core/util.js', 'js/core/model.js', 'js/data/networks.js', 'js/data/metabolic-model.js'].forEach((f) => eval(R(f)));
eval(R('js/views/steroid.js').replace('EP.data.steroidDefects = DEFECTS;', 'EP.data.steroidDefects = DEFECTS; EP.__simulate = simulate;'));
const cls = (r) => { const l = Math.log2(Math.max(r, 1e-6)); return l > 0.2 ? 'up' : l < -0.2 ? 'dn' : 'eq'; };
let total = 0, fails = 0;
function check(tag, get, exp) {
  const bad = [];
  for (const [k, e] of Object.entries(exp)) { total++; const r = get(k); if (!e.split('/').includes(cls(r))) { fails++; bad.push(`${k}=${r.toFixed(2)} (want ${e})`); } }
  if (bad.length) console.log('FAIL ' + tag + ': ' + bad.join(', '));
}

// ---------- endocrine axes (dynamic network, stepped to steady state as in the page) ----------
const AXES = {
 hpa: {
  normal:{crh:'eq',acth:'eq',cortisol:'eq',aldo:'eq',renin:'eq'},
  primary:{crh:'up',acth:'up',cortisol:'dn',aldo:'dn',renin:'up',pigment:'up'},
  secondary:{crh:'up',acth:'dn/eq',cortisol:'dn',aldo:'eq',renin:'eq',pigment:'dn/eq'},
  tertiary:{crh:'dn',acth:'dn',cortisol:'dn',aldo:'eq',renin:'eq',pigment:'dn/eq'},
  autonomous:{crh:'dn',acth:'dn',cortisol:'up',aldo:'eq',pigment:'dn/eq'},
  disease:{crh:'dn',acth:'up/eq',cortisol:'up',aldo:'eq'},
  ectopic:{crh:'dn',acth:'up',cortisol:'up',pigment:'up'},
  exo:{crh:'dn',acth:'dn',cortisol:'up','endo:cortisol':'dn',aldo:'eq'},
  stress:{crh:'up',acth:'up',cortisol:'up'},
 },
 hpt: {
  primary:{trh:'up',tsh:'up',t4:'dn',t3:'dn',bmr:'dn'},
  secondary:{trh:'up',tsh:'dn/eq',t4:'dn',t3:'dn',bmr:'dn'},
  tertiary:{trh:'dn',tsh:'dn/eq',t4:'dn',t3:'dn'},
  graves:{trh:'dn',tsh:'dn',t4:'up',t3:'up',bmr:'up'},
  tshoma:{tsh:'up/eq',t4:'up',t3:'up',bmr:'up'},
  rth:{tsh:'up/eq',t4:'up',t3:'up'},
  excess:{trh:'dn',tsh:'dn',t4:'up','endo:t4':'dn',t3:'up'},
  iodine:{tsh:'up',t4:'dn/eq',t3:'eq/dn'},
 },
 hpgm: {
  klinefelter:{lh:'up',fsh:'up',t:'dn',inhibin:'dn',sperm:'dn',dht:'dn'},
  secondary:{lh:'dn',fsh:'dn',t:'dn',sperm:'dn',gnrh:'up/eq'},
  kallmann:{gnrh:'dn',lh:'dn',fsh:'dn',t:'dn',sperm:'dn'},
  exoT:{gnrh:'dn',lh:'dn',fsh:'dn',t:'up',itt:'dn',sperm:'dn',inhibin:'dn',e2:'up',dht:'up'},
  prl:{gnrh:'dn',lh:'dn',fsh:'dn',t:'dn'},
  sertoli:{fsh:'up',inhibin:'dn',lh:'eq',t:'eq',sperm:'dn'},
  srd5a:{dht:'dn',t:'eq',lh:'eq',fsh:'eq'},
  energy:{gnrh:'dn',lh:'dn',fsh:'dn/eq',t:'dn'},
 },
 hpgf: {
  surge:{lh:'up',fsh:'up',e2:'up'},
  late:{e2:'up',fsh:'dn',inhibin:'up'},
  luteal:{prog:'up',gnrh:'dn',lh:'dn',fsh:'dn'},
  meno:{e2:'dn',inhibin:'dn',fsh:'up',lh:'up'},
  fha:{gnrh:'dn',lh:'dn',fsh:'dn/eq',e2:'dn'},
  prl:{gnrh:'dn',lh:'dn',fsh:'dn',e2:'dn'},
  ocp:{gnrh:'dn',lh:'dn',fsh:'dn','endo:e2':'dn'},
 },
 gh: {
  acro:{gh:'up',igf1:'up',growth:'up',lipo:'up'},
  ghd:{gh:'dn',igf1:'dn',growth:'dn',ghrh:'up/eq'},
  laron:{gh:'up',igf1:'dn',growth:'dn'},
  malnut:{gh:'up',igf1:'dn'},
  sleep:{gh:'up',ghrh:'up'},
 },
 prl: {
  suck:{da:'dn',prl:'up',milk:'up',gnrh:'dn',lh:'dn'},
  stalk:{prl:'up',gnrh:'dn',lh:'dn'},
  antipsych:{prl:'up',gnrh:'dn',lh:'dn'},
  prolactinoma:{prl:'up',da:'up',gnrh:'dn',lh:'dn'},
  hypothyroid:{prl:'up'},
  pregnancy:{prl:'up'},
 },
 adh: {
  dehyd:{posm:'up',adh:'up',h2o:'up',uosm:'up',thirst:'up'},
  waterload:{posm:'dn',adh:'dn',uosm:'dn',thirst:'dn'},
  cdi:{posm:'up',adh:'dn',uosm:'dn',thirst:'up'},
  ndi:{posm:'up',adh:'up',h2o:'dn',uosm:'dn',thirst:'up'},
  siadh:{posm:'dn',adh:'up',uosm:'up',thirst:'dn'},
  hemorrhage:{adh:'up',uosm:'up',posm:'dn/eq'},
 },
 raas: {
  pa:{aldo:'up',renin:'dn',ang:'dn',kp:'dn',vol:'up'},
  ras:{renin:'up',ang:'up',aldo:'up',kp:'dn'},
  addison:{aldo:'dn',renin:'up',ang:'up',kp:'up',vol:'dn'},
  acei:{ang:'dn',renin:'up',aldo:'dn',kp:'up'},
  hyperk:{kp:'up',aldo:'up',renin:'dn/eq'},
 },
 calcium: {
  phpt:{pth:'up',ca:'up',phos:'dn',d125:'up',res:'up'},
  hypopara:{pth:'dn',ca:'dn',phos:'up',d125:'dn'},
  vitd:{pth:'up',ca:'dn/eq',phos:'dn',gutca:'dn'},
  ckd:{phos:'up',fgf23:'up',d125:'dn',ca:'dn',pth:'up'},
  fgf23:{fgf23:'up',phos:'dn',d125:'dn/eq'},
  pthrp:{pth:'dn',ca:'up',phos:'dn',d125:'dn/eq'},
  granuloma:{d125:'up',ca:'up',pth:'dn',phos:'up/eq'},
  fhh:{ca:'up',pth:'up/eq',renalca:'up'},
 },
};
for (const nid of Object.keys(AXES)) {
  const net = EP.networks[nid];
  for (const pid of Object.keys(AXES[nid])) {
    const p = pid === 'normal' ? null : net.presets.find((x) => x.id === pid);
    if (pid !== 'normal' && !p) { fails++; console.log('MISSING preset ' + nid + '/' + pid); continue; }
    const m = new EP.Model({ nodes: net.nodes }); m.applyPreset(p);
    for (let i = 0; i < 30000; i++) m.step(0.01);
    check(nid + '/' + pid, (k) => (k.startsWith('endo:') ? m.v[k.slice(5)] / m.ref[k.slice(5)] : m.eff(k) / m.ref[k]), AXES[nid][pid]);
  }
}

// ---------- adrenal steroidogenesis enzyme defects ----------
const STEROID = {
  cyp21: { cortisol: 'dn', aldo: 'dn', oh17p: 'up', a4: 'up', t: 'up', acth: 'up', renin: 'up' },
  cyp21nc: { cortisol: 'eq', aldo: 'eq', oh17p: 'up', a4: 'up', renin: 'eq/up' },
  cyp11b1: { cortisol: 'dn', doc: 'up', s11: 'up', a4: 'up', acth: 'up', renin: 'dn', aldo: 'dn' },
  cyp17: { cortisol: 'dn', doc: 'up', b: 'up', dhea: 'dn', t: 'dn', renin: 'dn', aldo: 'dn' },
  hsd3b2: { cortisol: 'dn', aldo: 'dn', dhea: 'up', oh17preg: 'up', renin: 'up', acth: 'up' },
  star: { cortisol: 'dn', aldo: 'dn', dhea: 'dn', t: 'dn', acth: 'up', renin: 'up' },
  cyp11b2: { aldo: 'dn', cortisol: 'eq', renin: 'up', acth: 'eq' },
  srd5a2: { dht: 'dn', t: 'eq', cortisol: 'eq' },
  cyp19: { e2: 'dn', cortisol: 'eq' },
};
for (const d of EP.data.steroidDefects) {
  const r = EP.__simulate(d.set, 0);
  check('steroid/' + d.id, (k) => (k === 'acth' ? r.acth : k === 'renin' ? r.renin : r.rel[k]), STEROID[d.id] || {});
}

// ---------- whole-body metabolic model ----------
const M = EP.metabolic;
const PRESETS = {
 fed:{insulin:'up',glucagon:'dn',glucose:'up/eq',m_uptake:'up',h_glycogenesis:'up',m_glycogenesis:'up',dnl:'up',lipolysis:'dn',ffa:'dn',gng:'dn',hgo:'dn',ketogenesis:'dn',malonyl:'up',m_protsyn:'up',m_proteolysis:'dn',h_fao:'dn'},
 early:{insulin:'dn/eq',glucagon:'eq/up',lipolysis:'up',ffa:'up',h_fao:'up',ketogenesis:'up',gng:'up',dnl:'dn',glucose:'eq/dn'},
 prolonged:{insulin:'dn',glucagon:'up',ketones:'up',ketogenesis:'up',gng:'up',h_glycogenolysis:'dn',brainket:'up',brainglc:'dn',m_proteolysis:'dn/eq',renalgng:'up',lipolysis:'up',leptin:'dn',lgly:'dn'},
 exercise:{m_uptake:'up',m_glut4:'up',insulin:'dn/eq',glucagon:'up',epi:'up',hgo:'up',lipolysis:'up',m_glycogenolysis:'up',lactrel:'up',m_fao:'up',m_malonyl:'dn',glucose:'eq/up'},
 stress:{epi:'up',cortisol:'up',glucose:'up',hgo:'up',lipolysis:'up',m_proteolysis:'up',glucagon:'up'},
 ir:{insulin:'up',glucose:'eq/up',m_ins:'dn',h_ins:'dn',dnl:'up',htg:'up',vldl:'up',tgp:'up',ketogenesis:'eq/up',ffa:'up',lipolysis:'up',hgo:'eq/up'},
 t2d:{glucose:'up',hgo:'up',glucagon:'up',dnl:'up/eq',htg:'up',tgp:'up',ketogenesis:'up/eq'},
 t1d:{insulin:'dn',glucose:'up',glucagon:'up',lipolysis:'up',ffa:'up',ketogenesis:'up',ketones:'up',malonyl:'dn',hgo:'up',m_proteolysis:'up',dnl:'dn'},
};
const WHATIF = {
 ins_up:{glucose:'eq',hgo:'dn',m_uptake:'up',lipolysis:'dn',ffa:'dn',ketogenesis:'dn',gng:'dn',dnl:'up',h_glycogenesis:'up',m_proteolysis:'dn'},
 ins_dn:{insulin:'dn',glucose:'up',lipolysis:'up',ketogenesis:'up',hgo:'up'},
 gcg_up:{glucagon:'up',hgo:'up',h_glycogenolysis:'up',gng:'eq/up',m_glycogenolysis:'eq',glucose:'up',ketogenesis:'up',urea:'up'},
 gcg_dn:{glucagon:'dn',hgo:'dn',glucose:'dn/eq',aa:'up'},
 cort_up:{cortisol:'up',glucose:'eq/up',m_ins:'dn',gngenes:'up',m_proteolysis:'up',m_protsyn:'dn',insulin:'up'},
 cort_dn:{cortisol:'dn',glucose:'dn/eq',m_proteolysis:'dn',gngenes:'dn'},
 gh_up:{gh:'up',lipolysis:'up',ffa:'up',glucose:'up/eq',insulin:'up'},
 epi_up:{epi:'up',glucose:'up',lipolysis:'up',hgo:'up',m_glycogenolysis:'up',lactrel:'up',insulin:'dn/eq'},
 glc_up:{glucose:'up',insulin:'up',glucagon:'dn',hgo:'dn'},
 glc_dn:{glucagon:'up',epi:'up',cortisol:'up',gh:'up',insulin:'dn',h_glycogenolysis:'up'},
 ffa_up:{h_fao:'up',acoa:'up',pc:'up',ketogenesis:'up',m_ins:'dn'},
 aa_up:{insulin:'up',glucagon:'up',m_protsyn:'up',urea:'up'},
 acoa_up:{pc:'up',ketogenesis:'up'},
 fast:{ketogenesis:'up',lipolysis:'up',insulin:'dn'},
 feed:{insulin:'up',dnl:'up',lipolysis:'dn'},
 ex:{m_uptake:'up'},
 ir:{insulin:'up',dnl:'up'},
};
const run = (apply, cg, ci) => { const m = M.create(); m.applyPreset(apply); if (cg) m.clamps.glucose = 1; if (ci) m.clamps.insulin = 1; m.solve(); return m; };
for (const p of M.presets) if (PRESETS[p.id]) { const m = run({ inputs: p.inputs }); check('metabolic/' + p.id, (k) => m.rel(k), PRESETS[p.id]); }
for (const p of M.perturbations) if (WHATIF[p.id]) { const m = run(p.apply, p.clampGlucose, p.clampInsulin); check('what-if/' + p.id, (k) => m.rel(k), WHATIF[p.id]); }

console.log(`${total - fails}/${total} physiology checks pass`);
process.exit(fails ? 1 : 0);
