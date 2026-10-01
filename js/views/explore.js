/* Follow the molecule/hormone, organ map, cases, and remaining module pages. */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;
  const V = EP.views;
  const D = EP.data;
  const ent = (id) => D.entities[id] || { name: id, type: 'metabolite' };

  // ------------------------------------------------------------------ body map component
  EP.mountBodyMap = function (container, opts = {}) {
    const W = 920, H = 680;
    const svg = s('svg', { class: 'bodymap', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Organ cross-talk map' });
    svg.appendChild(EP.svgDefs());
    container.appendChild(svg);
    // stylized body silhouette
    svg.appendChild(s('path', { class: 'body-sil', d: 'M450,20 C500,20 520,60 515,95 C512,120 495,140 480,148 L480,165 C560,175 610,200 640,240 C670,290 680,360 690,430 L700,520 C705,560 690,580 670,570 L650,480 L640,420 L630,470 C640,540 640,600 625,660 L540,660 C535,610 520,560 470,560 L430,560 C380,560 365,610 360,660 L275,660 C260,600 260,540 270,470 L260,420 L250,480 L230,570 C210,580 195,560 200,520 L210,430 C220,360 230,290 260,240 C290,200 340,175 420,165 L420,148 C405,140 388,120 385,95 C380,60 400,20 450,20 Z', opacity: 0.6 }));
    const O = D.body.organs;
    const gL = s('g'), gO = s('g'), gP = s('g');
    svg.append(gL, gO, gP);
    const center = (k) => { const o = O[k]; return [o.x, o.y]; };
    const linkEls = D.body.links.map((L, i) => {
      const a = center(L.from), b = center(L.to);
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const bend = (L.bend || 18) * (i % 2 ? 1 : -1);
      const qx = mx - (b[1] - a[1]) / len * bend, qy = my + (b[0] - a[0]) / len * bend;
      const d = `M${a[0]},${a[1]} Q${qx},${qy} ${b[0]},${b[1]}`;
      const p = s('path', { d, class: 'blink k-' + L.kind, 'marker-end': 'url(#m-' + (L.kind === 'hormone' ? 'endo' : L.kind === 'metabolite' ? 'transport' : 'stim') + ')' });
      p.appendChild(s('title', {}, `${O[L.from].label} → ${O[L.to].label}: ${L.mol}`));
      p.addEventListener('click', () => opts.onLink && opts.onLink(L));
      const t = s('text', { class: 'blabel', x: qx, y: qy, 'text-anchor': 'middle', style: 'display:none' }, L.mol);
      gL.append(p, t);
      return { L, p, t, d };
    });
    const orgEls = {};
    Object.keys(O).forEach((k) => {
      if (O[k].alias) return;
      const o = O[k]; const w = o.w || 110;
      const g = s('g', { class: 'borgan', transform: `translate(${o.x - w / 2},${o.y - 15})`, tabindex: 0, role: 'button' });
      g.appendChild(s('rect', { width: w, height: 30, rx: 15 }));
      g.appendChild(s('text', { x: w / 2, y: 20, 'text-anchor': 'middle' }, o.label));
      g.addEventListener('click', () => opts.onOrgan && opts.onOrgan(k));
      gO.appendChild(g); orgEls[k] = g;
    });
    const parts = [];
    const stop = EP.loop((dt) => {
      parts.forEach((pt) => {
        pt.t = (pt.t + dt * pt.speed) % 1;
        try { const P = pt.path.getPointAtLength(pt.t * pt.len); pt.c.setAttribute('cx', P.x); pt.c.setAttribute('cy', P.y); } catch (e) { /* noop */ }
      });
    });
    EP.onTeardown(stop);
    function clearParticles() { parts.splice(0).forEach((p) => p.c.remove()); }
    function highlight({ organs = [], src = null, links = null, labels = true }) {
      clearParticles();
      Object.keys(orgEls).forEach((k) => { orgEls[k].classList.toggle('on', organs.includes(k)); orgEls[k].classList.toggle('src', k === src); orgEls[k].classList.toggle('dim', !!(organs.length || src) && !organs.includes(k) && k !== src); });
      linkEls.forEach((le) => {
        const on = links ? links.includes(le.L) : false;
        le.p.classList.toggle('hl', on); le.p.classList.toggle('dim', !!links && !on); le.t.style.display = on && labels ? '' : 'none';
        if (on) for (let i = 0; i < 3; i++) { const c = s('circle', { r: 4, class: 'flux-dot', fill: le.L.kind === 'hormone' ? 'var(--c-hormone)' : le.L.kind === 'metabolite' ? 'var(--c-transport)' : 'var(--c-tf)' }); gP.appendChild(c); parts.push({ c, path: le.p, len: le.p.getTotalLength(), t: i / 3, speed: 0.35 }); }
      });
    }
    function reset() { highlight({}); linkEls.forEach((le) => le.p.classList.remove('dim', 'hl')); }
    return { highlight, reset, linkEls };
  };

  // ------------------------------------------------------------------ Follow the molecule / hormone
  V.follow = function (el, params) {
    el.appendChild(EP.pageHeader('Follow the molecule — and the hormone', 'Pick a molecule and follow every place it can go; pick a hormone and follow it to each target organ.', { section: 'Explore & Learn' }));
    const tabs = h('div.tabs'); const slot = h('div');
    tabs.append(h('button', { 'data-t': 'm', onclick: () => go('m') }, 'Follow a molecule'), h('button', { 'data-t': 'h', onclick: () => go('h') }, 'Follow a hormone'));
    el.append(tabs, slot);
    let trail = [];
    function go(t, arg) {
      tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
      EP.teardown(); EP.clear(slot);
      if (t === 'm') molecule(arg || params.m || 'glucose'); else hormone(arg || params.h || 'insulin');
    }
    function molecule(id) {
      if (!trail.length || trail[trail.length - 1] !== id) { const i = trail.indexOf(id); trail = i >= 0 ? trail.slice(0, i + 1) : trail.concat(id); }
      const F = D.fates[id];
      const picker = h('div.statebar', Object.keys(D.fates).map((k) => h('button.chip' + (k === id ? '.on' : ''), { onclick: () => { trail = []; molecule(k); } }, ent(k).short || ent(k).name)));
      const crumbs = h('div.crumbs', h('span.muted', 'Trail: '), trail.map((k, i) => [i ? h('span.muted', '→') : null, h('a', { onclick: () => molecule(k) }, ent(k).short || ent(k).name)]));
      const e = ent(id);
      const center = h('div.fate-center', h('div.tile-k', EP.TYPE_LABEL[e.type] || ''), h('h2', e.name), h('p.small', { html: EP.md(F.summary) }), h('button.btn', { onclick: () => EP.showInfo(id) }, 'Explain this'));
      const cards = h('div.fates', F.dest.map((d) => {
        const de = ent(d.to);
        const canFollow = !!D.fates[d.to];
        return h('div.fate', h('div.when', d.when), h('h4', de.short || de.name), h('div.small', { html: EP.md(d.process) }), h('div.small.muted', { html: 'Where: ' + EP.md(d.where) }), d.note ? h('div.small', { html: EP.md(d.note) }) : null,
          h('div.go', canFollow ? h('button.btn.primary', { onclick: () => molecule(d.to) }, 'Follow ' + (de.short || de.name) + ' →') : null, h('a.btn', { href: '#/' + d.page + '?focus=' + d.to }, 'See in pathway'), h('button.btn.ghost', { onclick: () => EP.showInfo(d.to) }, 'Explain')));
      }));
      EP.clear(slot);
      slot.append(picker, crumbs, h('div.fate-tree', center, cards));
      // organ-level view of metabolite movement
      const orgLinks = D.body.links.filter((L) => L.kind === 'metabolite' && new RegExp((e.short || e.name).split(' ')[0].replace(/[()]/g, ''), 'i').test(L.mol));
      if (orgLinks.length) {
        slot.appendChild(h('h3', { style: { marginTop: '16px' } }, 'Between organs'));
        const bm = EP.mountBodyMap(slot, {});
        bm.highlight({ organs: [...new Set(orgLinks.flatMap((L) => [L.from, L.to]))], links: orgLinks });
      }
    }
    function hormone(id) {
      const HM = D.hormoneMap[id];
      const picker = h('div.statebar', Object.keys(D.hormoneMap).map((k) => h('button.chip' + (k === id ? '.on' : ''), { onclick: () => hormone(k) }, ent(k).short || ent(k).name)));
      const grid = h('div.cols'); const left = h('div'); const right = h('div.sim-panel');
      grid.append(left, right);
      EP.clear(slot); slot.append(picker, grid);
      const bm = EP.mountBodyMap(left, { onOrgan: (k) => { const t = HM.targets.find((x) => x.organ === k); if (t) EP.showInfoHTML(`<div class="why-head">${EP.esc(ent(id).name)} → ${EP.esc(D.body.organs[k].label)}</div><h3>${EP.md(t.effects)}</h3><p>${EP.md(t.mech)}</p>`); } });
      const fake = HM.targets.map((t) => ({ from: HM.source, to: t.organ, mol: ent(id).short || ent(id).name, kind: 'hormone' }));
      // draw dedicated links for this hormone
      const svg = left.querySelector('svg');
      const O = D.body.organs;
      const gx = s('g'); svg.insertBefore(gx, svg.children[2]);
      const parts = [];
      fake.forEach((L, i) => {
        const a = [O[L.from].x, O[L.from].y], b = [O[L.to].x, O[L.to].y];
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; const bend = 30 * (i % 2 ? 1 : -1);
        const p = s('path', { d: `M${a[0]},${a[1]} Q${mx - (b[1] - a[1]) / len * bend},${my + (b[0] - a[0]) / len * bend} ${b[0]},${b[1]}`, class: 'blink k-hormone hl', 'marker-end': 'url(#m-endo)' });
        gx.appendChild(p);
        for (let j = 0; j < 3; j++) { const c = s('circle', { r: 5, fill: 'var(--c-hormone)' }); gx.appendChild(c); parts.push({ c, p, t: j / 3 + i * 0.07 }); }
      });
      const stop = EP.loop((dt) => parts.forEach((pt) => { pt.t = (pt.t + dt * 0.3) % 1; const L = pt.p.getTotalLength(); const P = pt.p.getPointAtLength(pt.t * L); pt.c.setAttribute('cx', P.x); pt.c.setAttribute('cy', P.y); }));
      EP.onTeardown(stop);
      bm.highlight({ organs: HM.targets.map((t) => t.organ), src: HM.source, links: [] });
      right.innerHTML = `<h3>${EP.esc(ent(id).name)}</h3><p class="small muted">${EP.esc(D.body.organs[HM.source].label)} → ${EP.md(HM.route)}</p>` + HM.targets.map((t) => `<div class="info-sec"><b>${EP.esc(D.body.organs[t.organ].label)}</b>${EP.md(t.effects)}<div class="small muted">${EP.md(t.mech)}</div></div>`).join('') + `<p><button class="btn" data-e="${id}">Explain ${EP.esc(ent(id).short || ent(id).name)}</button></p>`;
      right.querySelector('[data-e]').onclick = () => EP.showInfo(id);
    }
    go(params.h ? 'h' : 'm');
  };

  // ------------------------------------------------------------------ organ map
  V.organmap = function (el) {
    el.appendChild(EP.pageHeader('Organ cross-talk map', 'Click an organ to see every hormone, metabolite and adipokine it sends and receives.', { section: 'Explore & Learn' }));
    const filt = { hormone: true, metabolite: true, adipokine: true, neural: true };
    const fbar = h('div.statebar', Object.keys(filt).map((k) => h('button.chip.on', { onclick: (ev) => { filt[k] = !filt[k]; ev.target.classList.toggle('on', filt[k]); apply(); } }, { hormone: '⬡ Hormones', metabolite: '● Metabolites', adipokine: '◆ Adipokines', neural: '⚡ Neural' }[k])));
    const grid = h('div.cols'); const left = h('div'); const right = h('div.sim-panel');
    grid.append(left, right); el.append(fbar, grid);
    let sel = null;
    const bm = EP.mountBodyMap(left, { onOrgan: (k) => { sel = sel === k ? null : k; apply(); }, onLink: (L) => EP.showInfoHTML(`<div class="why-head">${EP.esc(D.body.organs[L.from].label)} → ${EP.esc(D.body.organs[L.to].label)}</div><h3>${EP.esc(L.mol)}</h3><p>${EP.md(L.desc)}</p>`) });
    function apply() {
      const links = D.body.links.filter((L) => filt[L.kind] && (!sel || L.from === sel || L.to === sel));
      if (!sel) { bm.highlight({ links: links, labels: false }); right.innerHTML = '<p class="muted">Click an organ (e.g., Adipose, Muscle, Liver) to isolate its communications. Click any line for details.</p>'; return; }
      bm.highlight({ organs: [...new Set(links.flatMap((L) => [L.from, L.to]))], src: sel, links });
      const out = links.filter((L) => L.from === sel), inn = links.filter((L) => L.to === sel);
      const li = (L, dir) => `<li><strong>${EP.esc(L.mol)}</strong> ${dir} ${EP.esc(D.body.organs[dir === '→' ? L.to : L.from].label)}<div class="small muted">${EP.md(L.desc)}</div></li>`;
      right.innerHTML = `<h3>${EP.esc(D.body.organs[sel].label)}</h3><h4>Sends</h4><ul class="keypoints">${out.map((L) => li(L, '→')).join('') || '<li class="muted">—</li>'}</ul><h4>Receives</h4><ul class="keypoints">${inn.map((L) => li(L, '←')).join('') || '<li class="muted">—</li>'}</ul>`;
    }
    apply();
    el.appendChild(EP.sources(['molina10', 'kovacs15', 'petersen2018', 'cahill2006', 'felig1973', 'martin2012']));
  };

  // ------------------------------------------------------------------ cases
  V.cases = function (el, params) {
    el.appendChild(EP.pageHeader('Clinical cases', 'Predict the hormone levels and pathway changes before you check. Each case links to the simulator state that reproduces it.', { section: 'Explore & Learn' }));
    const list = h('div.statebar', D.cases.map((c) => h('button.chip', { 'data-id': c.id, onclick: () => show(c.id) }, c.title)));
    const slot = h('div'); el.append(list, slot);
    function show(id) {
      const c = D.cases.find((x) => x.id === id) || D.cases[0];
      list.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', b.dataset.id === c.id));
      EP.clear(slot);
      const tbl = h('table.predict');
      const sels = c.questions.map((q) => {
        const sel = h('select', h('option', { value: '' }, 'predict…'), h('option', { value: 'up' }, '↑ increased'), h('option', { value: 'down' }, '↓ decreased'), h('option', { value: 'same' }, '↔ unchanged'));
        const res = h('td'); tbl.appendChild(h('tr', h('td', q.label), h('td', sel), res));
        return { q, sel, res };
      });
      const check = h('button.btn.primary', { onclick: () => {
        let score = 0;
        sels.forEach(({ q, sel, res }) => { const ok = sel.value === q.answer; if (ok) score++; res.innerHTML = `<span class="${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} ${{ up: '↑', down: '↓', same: '↔' }[q.answer]}</span> <span class="small muted">${EP.md(q.why)}</span>`; });
        out.innerHTML = `<strong>${score}/${sels.length}</strong> correct. ${EP.md(c.teach)}`;
      } }, 'Check my predictions');
      const out = h('div.pattern');
      const simLink = c.sim ? h('a.btn', { href: '#/' + c.sim.page + (c.sim.preset ? '?preset=' + c.sim.preset : c.sim.defect ? '?defect=' + c.sim.defect : '') }, 'Open this case in the simulator →') : null;
      slot.appendChild(h('div.case', h('div.card', h('h2', c.title), h('p', c.stem), simLink), h('div.card', h('h3', 'Your predictions'), tbl, h('p', check), out)));
    }
    show(params.c || D.cases[0].id);
    el.appendChild(EP.sources(['bornstein2016', 'speiser2018', 'nieman2008', 'kovacs12', 'kovacs14', 'molina7', 'cahill2006', 'sylow2017']));
  };

  // ------------------------------------------------------------------ calcium page
  V.calciumPage = function (el, params) {
    el.appendChild(EP.pageHeader('Calcium, phosphate, PTH, vitamin D & FGF23', 'Change serum calcium, PTH, vitamin D, phosphate or FGF23: how do bone, kidney and gut respond — and which effects are direct versus mediated by calcitriol?', { section: 'Calcium, Bone & Mineral', lede: 'Arrows labelled **direct** are PTH1R actions in kidney and bone; arrows labelled **via 1,25-D** reach the gut only through calcitriol.' }));
    const api = EP.mountNetwork(el, 'calcium');
    if (params.preset) api.choose(params.preset);
    el.appendChild(h('h2', 'Nephron & enterocyte detail'));
    EP.mountPathway(el, 'kidneymineral', { height: 480, focus: params.focus });
    el.appendChild(h('p', h('a', { href: '#/bone' }, 'Bone remodeling (RANK/RANKL/OPG) →')));
    el.appendChild(EP.sources(['kovacs14', 'molina5', 'brown1993', 'martin2012', 'blaine2015', 'boyle2003']));
  };

  // ------------------------------------------------------------------ testis & androgens
  V.testisPage = function (el, params) {
    el.appendChild(EP.pageHeader('Testis & androgen physiology', 'Testosterone acts directly — and as a prohormone for DHT and estradiol. Which tissue needs which?', { section: 'Reproductive' }));
    EP.mountPathway(el, 'androgen', { height: 520, focus: params.focus });
    el.appendChild(h('h2', 'Leydig and Sertoli cells'));
    EP.mountPathway(el, 'testis', { height: 460, focus: params.focus });
    el.appendChild(h('p', h('a', { href: '#/hpgm' }, 'HPG axis (male): feedback, exogenous testosterone, Klinefelter →')));
    el.appendChild(EP.sources(['kovacs9', 'molina8', 'miller2011']));
  };

  // ------------------------------------------------------------------ menstrual cycle
  V.cycle = function (el, params) {
    el.appendChild(EP.pageHeader('Ovary & the menstrual cycle', 'Move through the cycle: which follicle or corpus luteum dominates, which feedback mode is active, and what does the endometrium do?', { section: 'Reproductive' }));
    const cv = h('canvas.chart', { width: 1000, height: 300 });
    const day = h('input', { type: 'range', min: 1, max: 28, value: 8 });
    const phase = h('span.phase-pill', '');
    const info = h('div.grid2');
    el.append(h('div.card', h('div.daybar', h('strong', 'Day'), day, phase), cv, h('p.small.muted', 'Schematic curve shapes summarising Kovacs Ch8 / Molina Ch9 (relative scale for each hormone; not measured concentrations). The real cycle length and amplitudes vary.'), info));
    const g = (x, m, sd) => Math.exp(-0.5 * Math.pow((x - m) / sd, 2));
    const curves = {
      LH: (d) => 0.12 + 0.95 * g(d, 14, 0.9) + 0.05 * g(d, 7, 5),
      FSH: (d) => 0.18 + 0.25 * g(d, 3, 3) + 0.35 * g(d, 14, 0.9) + 0.12 * g(d, 27, 2),
      Estradiol: (d) => 0.1 + 0.8 * g(d, 12.5, 2) + 0.4 * g(d, 21, 3),
      Progesterone: (d) => 0.03 + 0.9 * g(d, 21, 3.2),
      'Inhibin B': (d) => 0.1 + 0.5 * g(d, 7, 3),
    };
    function draw() {
      const ctx = cv.getContext('2d'); const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      const css = getComputedStyle(document.body);
      const X = (d) => 40 + (d - 1) / 27 * (W - 60);
      ctx.fillStyle = 'rgba(255,107,125,.08)'; ctx.fillRect(X(1), 10, X(5) - X(1), H - 40);
      ctx.fillStyle = 'rgba(110,168,255,.06)'; ctx.fillRect(X(15), 10, X(28) - X(15), H - 40);
      ctx.font = '11px Inter, sans-serif'; ctx.fillStyle = css.getPropertyValue('--muted');
      ctx.fillText('menses', X(1.5), 24); ctx.fillText('follicular phase', X(6), 24); ctx.fillText('ovulation', X(13.3), 24); ctx.fillText('luteal phase', X(19), 24);
      Object.keys(curves).forEach((k, i) => {
        ctx.strokeStyle = css.getPropertyValue('--tr' + i); ctx.lineWidth = 2.4; ctx.beginPath();
        for (let d = 1; d <= 28; d += 0.1) { const y = H - 30 - curves[k](d) * (H - 70); d === 1 ? ctx.moveTo(X(d), y) : ctx.lineTo(X(d), y); }
        ctx.stroke(); ctx.fillStyle = css.getPropertyValue('--tr' + i); ctx.fillText(k, W - 120, 50 + i * 15);
      });
      const dd = +day.value; ctx.strokeStyle = css.getPropertyValue('--text'); ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(dd), 10); ctx.lineTo(X(dd), H - 30); ctx.stroke(); ctx.setLineDash([]);
      for (let d = 1; d <= 28; d += 3) ctx.fillText(String(d), X(d) - 4, H - 12);
    }
    function upd() {
      const d = +day.value; draw();
      let ph, txt, fb, ov, endo;
      if (d <= 5) { ph = 'Menses / early follicular'; ov = 'Cohort of antral follicles recruited by the late-luteal FSH rise.'; fb = 'Low E2/P/inhibin A → FSH rises (feedback released).'; endo = 'Shedding of the functional layer (progesterone withdrawal).'; }
      else if (d <= 11) { ph = 'Mid follicular'; ov = 'Dominant follicle selected: most FSH receptors and aromatase; others undergo atresia as FSH falls.'; fb = '**Negative feedback**: rising E2 and inhibin B lower FSH.'; endo = 'Proliferative phase (estrogen).'; }
      else if (d <= 15) { ph = 'Late follicular → ovulation'; ov = 'Pre-ovulatory follicle; LH surge triggers oocyte maturation, follicle rupture ~36 h after surge onset, luteinization.'; fb = '**Positive feedback**: sustained high E2 switches the gonadotroph/hypothalamus to an LH surge.'; endo = 'Late proliferative.'; }
      else if (d <= 25) { ph = 'Luteal'; ov = 'Corpus luteum secretes progesterone (and E2, inhibin A); without hCG it regresses after ~14 days.'; fb = 'Progesterone + E2 → negative feedback; slowed GnRH pulses → LH and FSH low.'; endo = 'Secretory phase (progesterone): glands, spiral arteries, receptive window.'; }
      else { ph = 'Late luteal'; ov = 'Luteolysis; progesterone and E2 fall.'; fb = 'Feedback released → FSH begins to rise for the next cycle.'; endo = 'Pre-menstrual ischemia → menses.'; }
      phase.textContent = ph;
      info.innerHTML = `<div><h4>Ovary</h4><p>${EP.md(ov)}</p><h4>Feedback mode</h4><p>${EP.md(fb)}</p></div><div><h4>Endometrium</h4><p>${EP.md(endo)}</p><p><a href="#/hpgf?preset=${d >= 12 && d <= 15 ? 'surge' : d > 15 && d <= 25 ? 'luteal' : 'late'}">Simulate this feedback state →</a></p></div>`;
    }
    day.addEventListener('input', upd); upd();
    el.appendChild(h('h2', 'Inside the follicle: two cells, two gonadotropins'));
    EP.mountPathway(el, 'ovary', { height: 420, focus: params.focus });
    el.appendChild(EP.sources(['kovacs8', 'molina9']));
  };

  // ------------------------------------------------------------------ pregnancy & puberty
  V.pregnancy = function (el, params) {
    el.appendChild(EP.pageHeader('Pregnancy & puberty', 'Who makes progesterone and estrogen in pregnancy — and what switches the reproductive axis on at puberty?', { section: 'Reproductive' }));
    EP.mountPathway(el, 'placenta', { height: 440, focus: params.focus });
    el.appendChild(h('div.card', h('h3', 'Key ideas'), h('ul.keypoints', { html: [
      '**hCG** (LH-receptor agonist) rescues the corpus luteum until the placenta takes over progesterone production (luteal–placental shift, ~7–9 weeks).',
      'The placenta lacks CYP17, so **estrogens** require fetal adrenal DHEA-S (16-hydroxylated in fetal liver) — the feto-placental unit.',
      '**Prolactin** rises with estrogen; lactation waits for the fall of progesterone at delivery. Suckling then lowers dopamine (see <a href="#/prl?preset=suck">prolactin</a>).',
      '**Puberty:** kisspeptin/neurokinin B neurons reactivate pulsatile GnRH (sleep-entrained LH pulses first); leptin/energy sufficiency is permissive. Continuous GnRH would desensitize — see <a href="#/secretion">pulsatility</a>.',
    ].map((t) => `<li>${EP.md(t).replace(/&lt;a href=&quot;(.*?)&quot;&gt;(.*?)&lt;\/a&gt;/g, '<a href="$1">$2</a>')}</li>`).join('') })));
    el.appendChild(EP.sources(['kovacs10', 'kovacs8', 'molina9']));
  };
})();
