/* Qualitative regulatory-network engine.
 *
 * A network is a list of nodes. Each non-input node computes a *target* value from
 * the current values of other nodes:
 *   mode 'prod' (default):  target = cap · Π eff(src)^w        (power-law / S-system style)
 *   mode 'sum':             target = cap · Σ c · eff(src)      (parallel contributions)
 * plus an optional autonomous term `auto` (e.g. a hormone-secreting adenoma).
 *
 * w > 0 = stimulatory, w < 0 = inhibitory. With all inputs at 1 and cap = 1 every node
 * sits at 1, so every value is directly readable as "relative to reference".
 * The same engine powers the hormone axes, the calcium system, the pathway diagrams
 * and the whole-body metabolic simulator. It is deliberately qualitative: exponents
 * encode the *sign and rough strength* of a regulatory influence, not measured kinetics.
 */
(function () {
  'use strict';
  const EP = window.EP;
  const LO = 0.01, HI = 50;

  class Model {
    constructor(def) {
      this.def = def;
      this.nodes = def.nodes;
      this.byId = {};
      this.nodes.forEach((n) => { this.byId[n.id] = n; });
      this.inputs = {};   // id -> value for input nodes
      this.caps = {};     // id -> capacity multiplier (lesions, receptor loss…)
      this.autos = {};    // id -> autonomous production added
      this.exo = {};      // id -> exogenous amount added to the *effective* value
      this.clamps = {};   // id -> forced value (manual override)
      this.mods = {};     // id -> {src: sensitivity} (receptor/feedback resistance)
      this.flips = {};    // id -> {src: newWeight} (sign switch, e.g. E2 positive feedback)
      this.v = {};
      this.reset();
      this.ref = this.solve(true);
    }
    reset() {
      this.nodes.forEach((n) => {
        this.v[n.id] = n.init != null ? n.init : 1;
        if (n.input) this.inputs[n.id] = n.value != null ? n.value : 1;
      });
    }
    eff(id) {
      const base = this.clamps[id] != null ? this.clamps[id] : (this.byId[id] && this.byId[id].input ? this.inputs[id] : this.v[id]);
      return EP.clamp(base + (this.exo[id] || 0), LO, HI);
    }
    capOf(n) { return (n.cap != null ? n.cap : 1) * (this.caps[n.id] != null ? this.caps[n.id] : 1); }
    /** Effective weight (a preset may flip a feedback sign, e.g. estradiol positive feedback). */
    weight(n, t) { const f = this.flips[n.id]; return f && f[t.src] != null ? f[t.src] : t.w; }
    /** Receptor sensitivity: node n "sees" src scaled by mods[n][src] (<1 = resistance, raises the set-point). */
    seen(n, t) { const m = this.mods[n.id]; return this.eff(t.src) * (m && m[t.src] != null ? m[t.src] : 1); }
    target(n) {
      if (n.input) return this.inputs[n.id];
      if (this.clamps[n.id] != null) return this.clamps[n.id];
      const cap = this.capOf(n);
      let x;
      if (n.mode === 'sum') {
        x = 0;
        n.terms.forEach((t) => { x += t.c * (t.src ? this.eff(t.src) : 1); });
        x *= cap;
      } else {
        let lg = Math.log(Math.max(cap, 1e-6));
        (n.terms || []).forEach((t) => { lg += this.weight(n, t) * Math.log(this.seen(n, t)); });
        x = Math.exp(lg);
      }
      if (n.sat) x = (1 + n.sat) * x / (n.sat + x); // saturating (Michaelis–Menten-like), still 1 at reference
      x += (n.auto || 0) + (this.autos[n.id] || 0);
      return EP.clamp(x, LO, HI);
    }
    /** Damped Newton solve of log(target(x)) = x for all non-input nodes. Returns true if converged. */
    newton() {
      const ns = this.nodes.filter((n) => !n.input);
      const k = ns.length;
      this.nodes.forEach((n) => { if (n.input) this.v[n.id] = this.inputs[n.id]; });
      const X = ns.map((n) => Math.log(this.v[n.id]));
      const setX = (x) => ns.forEach((n, i) => { this.v[n.id] = Math.exp(EP.clamp(x[i], Math.log(LO), Math.log(HI))); });
      const F = (x) => { setX(x); return ns.map((n, i) => Math.log(this.target(n)) - x[i]); };
      const norm = (f) => Math.sqrt(f.reduce((a, b) => a + b * b, 0));
      let f = F(X), nf = norm(f);
      for (let it = 0; it < 40 && nf > 1e-7; it++) {
        // numerical Jacobian of F
        const Jm = [];
        for (let j = 0; j < k; j++) {
          const xp = X.slice(); xp[j] += 1e-5;
          const fp = F(xp);
          for (let i = 0; i < k; i++) { (Jm[i] = Jm[i] || [])[j] = (fp[i] - f[i]) / 1e-5; }
        }
        const dx = linsolve(Jm, f.map((v) => -v));
        if (!dx) break;
        let step = 1, ok = false;
        for (let ls = 0; ls < 12; ls++) {
          const xn = X.map((x, i) => x + step * EP.clamp(dx[i], -3, 3));
          const fn = F(xn), nn = norm(fn);
          if (nn < nf * (1 - 1e-4 * step)) { for (let i = 0; i < k; i++) X[i] = xn[i]; f = fn; nf = nn; ok = true; break; }
          step /= 2;
        }
        if (!ok) break;
      }
      setX(X);
      return nf < 1e-4;
    }
    /** Relax to steady state. Returns a snapshot of values. */
    solve(isRef) {
      if (this.def.newton && this.newton()) {
        const snap = {};
        this.nodes.forEach((n) => { snap[n.id] = this.eff(n.id); });
        if (!isRef) this.last = snap;
        return snap;
      }
      const nodes = this.nodes;
      const iters = this.def.iters || 400, dflt = this.def.damp || 0.5;
      for (let it = 0; it < iters; it++) {
        let delta = 0;
        for (const n of nodes) {
          if (n.input) { this.v[n.id] = this.inputs[n.id]; continue; }
          const tg = this.target(n);
          const a = n.damp || dflt;
          const nv = Math.exp((1 - a) * Math.log(this.v[n.id]) + a * Math.log(tg));
          delta = Math.max(delta, Math.abs(Math.log(nv / this.v[n.id])));
          this.v[n.id] = nv;
        }
        if (delta < 1e-5 && it > 5) break;
      }
      const snap = {};
      nodes.forEach((n) => { snap[n.id] = this.eff(n.id); });
      if (!isRef) this.last = snap;
      return snap;
    }
    /** One explicit time step (first-order lag toward target). dt in seconds of sim time. */
    step(dt) {
      for (const n of this.nodes) {
        if (n.input) { this.v[n.id] = this.inputs[n.id]; continue; }
        const tg = this.target(n);
        const tau = n.tau || 1;
        const k = Math.min(1, dt / tau);
        this.v[n.id] = Math.exp(Math.log(this.v[n.id]) + k * (Math.log(tg) - Math.log(this.v[n.id])));
      }
    }
    rel(id) { return this.eff(id) / (this.ref[id] || 1); }
    /** Ranked contributions explaining why a node differs from reference. */
    explain(id) {
      const n = this.byId[id];
      if (!n || n.input) return [];
      const out = [];
      if (n.mode === 'sum') {
        n.terms.forEach((t) => {
          const now = t.c * (t.src ? this.eff(t.src) : 1);
          const ref = t.c * (t.src ? this.ref[t.src] : 1);
          out.push({ term: t, src: t.src, now, ref, score: now - ref, share: now });
        });
      } else {
        (n.terms || []).forEach((t) => {
          const w = this.weight(n, t);
          const score = w * Math.log(this.seen(n, t) / (this.ref[t.src] || 1));
          out.push({ term: t, src: t.src, w, score });
        });
      }
      const cap = this.capOf(n);
      if (cap !== (n.cap != null ? n.cap : 1)) out.push({ cap: true, score: Math.log(cap), text: 'Intrinsic capacity changed (lesion / receptor loss / genetic defect)' });
      if (this.autos[n.id]) out.push({ auto: true, score: 1, text: 'Autonomous production (not under normal control)' });
      if (this.clamps[n.id] != null) out.push({ clamp: true, score: 2, text: 'You are clamping this value manually' });
      if (this.exo[n.id]) out.push({ exo: true, score: 1, text: 'Exogenous supply added' });
      return out.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
    }
    /** Upstream chain: follow the strongest contributor back toward an input. */
    trace(id, maxDepth = 8) {
      const chain = [id];
      let cur = id;
      for (let d = 0; d < maxDepth; d++) {
        const ex = this.explain(cur).filter((e) => e.src && Math.abs(e.score) > 0.05);
        if (!ex.length) break;
        const nxt = ex[0].src;
        if (chain.includes(nxt)) break;
        chain.push(nxt);
        cur = nxt;
      }
      return chain.reverse();
    }
    setInput(id, v) { this.inputs[id] = v; }
    snapshotState() {
      return JSON.stringify({ i: this.inputs, c: this.caps, a: this.autos, e: this.exo, k: this.clamps, m: this.mods, f: this.flips });
    }
    restoreState(s) {
      const o = JSON.parse(s);
      this.inputs = o.i; this.caps = o.c; this.autos = o.a; this.exo = o.e; this.clamps = o.k; this.mods = o.m; this.flips = o.f || {};
    }
    resetPerturbations() {
      this.caps = {}; this.autos = {}; this.exo = {}; this.clamps = {}; this.mods = {}; this.flips = {};
      this.nodes.forEach((n) => { if (n.input) this.inputs[n.id] = n.value != null ? n.value : 1; });
    }
    /** Apply a preset {inputs, caps, autos, exo, clamps, mods} on top of a clean slate. */
    applyPreset(p) {
      this.resetPerturbations();
      if (!p) return;
      Object.assign(this.inputs, p.inputs || {});
      Object.assign(this.caps, p.caps || {});
      Object.assign(this.autos, p.autos || {});
      Object.assign(this.exo, p.exo || {});
      Object.assign(this.clamps, p.clamps || {});
      Object.keys(p.mods || {}).forEach((k) => { this.mods[k] = Object.assign({}, p.mods[k]); });
      Object.keys(p.flips || {}).forEach((k) => { this.flips[k] = Object.assign({}, p.flips[k]); });
    }
  }
  /** Gaussian elimination with partial pivoting; returns null if singular. */
  function linsolve(A, b) {
    const n = b.length; const M = A.map((r, i) => r.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-12) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; if (!f) continue; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    const x = new Array(n);
    for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
    return x;
  }
  EP.Model = Model;

  /** Human-readable reason for one contribution. */
  EP.explainLine = function (model, e) {
    if (!e.src) return e.text;
    const src = model.byId[e.src];
    const q = EP.qual(model.eff(e.src), model.ref[e.src]);
    const sign = e.term.w != null ? (e.term.w > 0 ? 'stimulates' : 'inhibits') : 'contributes to';
    return `${src ? src.label : e.src} is ${q.word} (${q.sym}) and ${sign} this node` + (e.term.why ? ` — ${e.term.why}` : '');
  };
})();
