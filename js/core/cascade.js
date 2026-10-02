/* Signaling cascade explorer.
 * A cascade is drawn as lanes: a membrane/receptor bar on the left, then stage columns
 * (adaptor → messenger → kinase → effector → target → outcome). Each branch occupies a
 * coloured band of rows. Signals propagate qualitatively (sign × strength) from the
 * receptor; knockouts/disorders force nodes to a value. Particles flow along active links.
 *
 * Data: EP.cascades[id] = { id, title, ligand, receptor:{label,ent,why}, cols:[...], branches:[{id,label,c,desc}],
 *        nodes:[{id,label,col,row,branch,type,ent,time,why}], links:[[from,to,sign('+'|'-'),why,{fb,label}]],
 *        knock:[{id,label,force:{node:value},desc}], steps:[{n:[ids],t}], ligandLabels:[down,basal,up], refs:[] }
 * Node 'R' is the receptor bar. */
(function () {
  'use strict';
  const EP = window.EP;
  const { h, s } = EP;
  EP.cascades = EP.cascades || {};
  const W = 1200, TOP = 64, ROWH = 56, LABW = 150, BARX = 158, BARW = 34, X0 = 212;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function wrap(label, maxW, px) {
    const words = label.split(' '); const lines = []; let cur = '';
    words.forEach((w) => { const t = cur ? cur + ' ' + w : w; if (EP.textWidth(t, px, 600) <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } });
    if (cur) lines.push(cur);
    return lines;
  }

  EP.mountCascade = function (container, id, opts = {}) {
    const C = EP.cascades[id];
    if (!C) return null;
    const ncol = C.cols.length;
    const TAGW = C.nodes.some((n) => n.time) ? Math.max(...C.nodes.filter((n) => n.time).map((n) => EP.textWidth(n.time, 9.5, 600))) + 20 : 0;
    const colW = (W - X0 - 12 - TAGW) / ncol, nw = colW - 20;
    const byId = {}; C.nodes.forEach((n) => (byId[n.id] = n));
    const maxRow = Math.max(...C.nodes.map((n) => n.row));
    const H = TOP + (maxRow + 1) * ROWH + 16;
    const bcolor = (b) => { const br = C.branches.find((x) => x.id === b); return br ? `var(--tr${br.c})` : 'var(--accent)'; };
    const st = { lig: 1, knock: null, focus: null, step: -1 };

    // ---------- DOM
    const root = h('div.casc');
    const bar = h('div.casc-bar');
    const ligSel = h('div.seg', (C.ligandLabels || ['↓ falls', 'basal', '↑ rises']).map((l, i) => h('button', { 'data-v': i - 1, onclick: () => { st.lig = i - 1; update(); } }, l)));
    const knockSel = C.knock && C.knock.length ? h('select.btn', { onchange: (ev) => { st.knock = C.knock.find((k) => k.id === ev.target.value) || null; update(); } },
      h('option', { value: '' }, 'Normal cell'), ...C.knock.map((k) => h('option', { value: k.id }, k.label))) : null;
    const walkBtn = C.steps && C.steps.length ? h('button.btn', { onclick: () => { st.step = st.step < 0 ? 0 : -1; update(); } }, '▶ Walk me through it') : null;
    bar.append(h('span.small.muted', (C.ligand || 'Hormone') + ':'), ligSel, knockSel ? h('span.small.muted', 'Cell / disorder / drug:') : null, knockSel, walkBtn);
    const grid = h('div.casc-grid'); const left = h('div.casc-map'); const side = h('div.sim-panel.casc-side');
    grid.append(left, side);
    const cap = h('div.casc-cap', { hidden: true });
    root.append(bar, cap, grid); container.appendChild(root);

    const svg = s('svg', { class: 'casc-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': C.title });
    svg.appendChild(EP.svgDefs());
    const gBand = s('g'), gLink = s('g'), gNode = s('g'), gDot = s('g');
    svg.append(gBand, gLink, gNode, gDot);
    left.appendChild(svg);
    {
      const TV = { receptor: ['--c-receptor', 'Receptor'], kinase: ['--c-kinase', 'Kinase / signaling protein'], messenger: ['--c-messenger', 'Second messenger / G protein'], enzyme: ['--c-enzyme', 'Enzyme'], tf: ['--c-tf', 'Transcription factor'], gene: ['--c-tf', 'Gene / transcription (dashed)'], transporter: ['--c-transporter', 'Transporter / channel'], process: ['--c-process', 'Cell process'], hormone: ['--c-hormone', 'Hormone / mediator'], ion: ['--c-ion', 'Ion'], metabolite: ['--c-metabolite', 'Metabolite'] };
      const types = [...new Set(C.nodes.map((n) => n.type || 'kinase'))].filter((x) => TV[x]);
      left.appendChild(EP.colorKey([
        ['Bands = branches', C.branches.map((b) => ({ band: `var(--tr${b.c})`, label: b.label }))],
        ['Box outline = kind of molecule', types.map((x) => ({ fill: 'var(--panel)', stroke: `var(${TV[x][0]})`, dash: x === 'gene' ? '4 2' : null, label: TV[x][1] })).concat([{ fill: 'color-mix(in srgb, var(--accent) 10%, var(--panel))', stroke: 'var(--accent)', rx: 8, label: 'Result (outlined in its branch colour)' }])],
        ['Box fill = change', [{ fill: 'color-mix(in srgb, var(--up) 22%, var(--panel))', stroke: 'var(--c-kinase)', label: '↑ increased' }, { fill: 'color-mix(in srgb, var(--dn) 22%, var(--panel))', stroke: 'var(--c-kinase)', label: '↓ decreased' }, { fill: 'color-mix(in srgb, #f4c430 25%, var(--panel))', stroke: 'var(--c-kinase)', label: '± opposing inputs' }, { fill: 'var(--panel)', stroke: 'var(--c-kinase)', dash: '5 3', label: 'dashed = set by the disorder/drug (✕ = blocked)' }, { fill: 'var(--panel)', stroke: 'var(--line)', label: '— no change' }]],
        ['Arrows & moving dots', [{ line: 'var(--c-stim)', marker: 'stim', label: 'Active stimulation' }, { line: 'var(--c-inhib)', dash: '5 3', marker: 'inhib', label: 'Active inhibition' }, { line: 'var(--faint)', label: 'Inactive' }, { line: 'var(--faint)', dash: '2 4', label: 'Feedback' }, { dot: 'var(--c-stim)', label: 'Signal pushing a target up' }, { dot: 'var(--c-inhib)', label: 'Signal pushing a target down' }]],
      ]));
    }

    // ---------- layout
    const rowY = (r) => TOP + r * ROWH + ROWH / 2;
    const colX = (c) => X0 + c * colW + 10;
    C.cols.forEach((t, i) => svg.appendChild(s('text', { x: colX(i) + nw / 2, y: 26, class: 'casc-col', 'text-anchor': 'middle' }, t)));
    svg.appendChild(s('text', { x: BARX + BARW / 2, y: 26, class: 'casc-col', 'text-anchor': 'middle' }, C.receptor.short || 'Receptor'));
    // bands
    const bandEls = {};
    C.branches.forEach((b) => {
      const rows = C.nodes.filter((n) => n.branch === b.id).map((n) => n.row);
      if (!rows.length) return;
      const r0 = Math.min(...rows), r1 = Math.max(...rows);
      const y0 = rowY(r0) - ROWH / 2 + 3, y1 = rowY(r1) + ROWH / 2 - 3;
      const g = s('g', { class: 'casc-band', style: `--bc:${bcolor(b.id)}`, tabindex: 0, role: 'button' });
      const minCol = Math.min(...C.nodes.filter((n) => n.branch === b.id).map((n) => n.col));
      const bx = minCol === 0 ? 6 : colX(minCol) - 9;
      g.appendChild(s('rect', { x: bx, y: y0, width: W - 6 - bx, height: y1 - y0, rx: 10 }));
      if (minCol > 0) g.appendChild(s('rect', { x: 6, y: y0, width: LABW - 4, height: y1 - y0, rx: 10, class: 'casc-btab' }));
      const lines = wrap(b.label, LABW - 16, 11.5);
      const ty = (y0 + y1) / 2 - (lines.length - 1) * 7;
      lines.forEach((l, i) => g.appendChild(s('text', { x: 16, y: ty + i * 14 + 4, class: 'casc-blabel' }, l)));
      g.addEventListener('click', () => { st.focus = st.focus === b.id ? null : b.id; update(); });
      gBand.appendChild(g); bandEls[b.id] = g;
    });
    // receptor bar
    const rTop = TOP + 4, rBot = H - 20;
    const rG = s('g', { class: 'casc-rec cnode', tabindex: 0, role: 'button' });
    rG.appendChild(s('rect', { x: BARX, y: rTop, width: BARW, height: rBot - rTop, rx: 12 }));
    const rl = s('text', { class: 'casc-rlabel', transform: `translate(${BARX + BARW / 2 + 5},${(rTop + rBot) / 2}) rotate(-90)`, 'text-anchor': 'middle' }, C.receptor.label);
    rG.appendChild(rl);
    rG.addEventListener('click', () => info('R'));
    gNode.appendChild(rG);
    // nodes
    const els = {};
    C.nodes.forEach((n) => {
      let px, lines;
      for (px of [12, 11, 10.2]) {
        const mw = nw - 24 - (12 - px) * 2;
        lines = wrap(n.label, mw, px);
        if (lines.length <= (px === 12 ? 2 : 3) && lines.every((l) => EP.textWidth(l, px, 600) <= mw)) break;
      }
      const nh = Math.min(ROWH - 6, Math.max(38, lines.length * (px + 1.5) + 10));
      const x = colX(n.col), y = rowY(n.row) - nh / 2;
      n._x = x; n._y = y; n._h = nh;
      const g = s('g', { class: `casc-node cnode t-${n.type || 'kinase'}`, tabindex: 0, role: 'button', 'data-id': n.id, style: `--bc:${bcolor(n.branch)}` });
      g.appendChild(s('rect', { x, y, width: nw, height: nh, rx: n.type === 'outcome' ? 18 : n.type === 'tf' || n.type === 'gene' ? 4 : 9 }));
      const t0 = rowY(n.row) - (lines.length - 1) * (px + 1.5) / 2 + px * 0.36;
      lines.forEach((l, i) => g.appendChild(s('text', { x: x + (nw - 16) / 2 + 2, y: t0 + i * (px + 1.5), 'text-anchor': 'middle', style: `font-size:${px}px` }, l)));
      const badge = s('text', { class: 'casc-badge', x: x + nw - 9, y: rowY(n.row) + 5, 'text-anchor': 'middle' }, '');
      g.appendChild(badge);
      if (n.time) { const tw = EP.textWidth(n.time, 9.5, 600) + 10; const tg = s('g', { class: 'casc-time' }); const tx = x + nw + 6; tg.append(s('rect', { x: tx, y: rowY(n.row) - 7, width: tw, height: 14, rx: 7 }), s('text', { x: tx + tw / 2, y: rowY(n.row) + 3.5, 'text-anchor': 'middle' }, n.time)); g.appendChild(tg); }
      g.addEventListener('click', () => info(n.id));
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') info(n.id); });
      gNode.appendChild(g); els[n.id] = { g, badge, n };
    });
    // links
    const links = C.links.map((raw) => {
      let [a, b, sign, why, o] = raw;
      if (why && typeof why === 'object') { o = why; why = undefined; }
      o = o || {};
      const tb = byId[b]; let d;
      if (a === 'R') { const y = rowY(tb.row); d = `M${BARX + BARW},${y} C${BARX + BARW + 20},${y} ${tb._x - 20},${y} ${tb._x},${y}`; }
      else {
        const sa = byId[a];
        const ya = rowY(sa.row), yb = rowY(tb.row);
        if (o.fb && o.route === 'left') { // run along the row gap, down the left margin, into the target's left side
          const yLow = sa._y + sa._h + 7, xL = X0 - 4, yT = rowY(tb.row) + 9;
          d = `M${sa._x + nw / 2},${sa._y + sa._h} L${sa._x + nw / 2},${yLow} L${xL},${yLow} L${xL},${yT} L${tb._x},${yT}`;
        } else if (o.fb) { // feedback: arc below the source and back to target's bottom
          const yy = Math.max(sa._y + sa._h, tb._y + tb._h) + 16;
          d = `M${sa._x + nw / 2},${sa._y + sa._h} C${sa._x + nw / 2},${yy} ${tb._x + nw / 2},${yy} ${tb._x + nw / 2},${tb._y + tb._h}`;
        } else if (tb.col === sa.col) {
          const down = tb.row > sa.row; const x1 = sa._x + nw / 2 + (o.dx || 0);
          d = `M${x1},${down ? sa._y + sa._h : sa._y} L${x1},${down ? tb._y : tb._y + tb._h}`;
        } else if (tb.col > sa.col) {
          const x1 = sa._x + nw, x2 = tb._x, mx = (x1 + x2) / 2;
          d = `M${x1},${ya} C${mx},${ya} ${mx},${yb} ${x2},${yb}`;
        } else {
          const yy = Math.min(sa._y, tb._y) - 10;
          d = `M${sa._x + nw / 2},${sa._y} C${sa._x + nw / 2},${yy} ${tb._x + nw / 2},${yy} ${tb._x + nw / 2},${tb._y}`;
        }
      }
      const p = s('path', { d, class: 'casc-link' + (sign === '-' ? ' neg' : '') + (o.fb ? ' fb' : ''), 'marker-end': sign === '-' ? 'url(#m-inhib)' : 'url(#m-stim)' });
      if (why) p.appendChild(s('title', {}, why.replace(/\*\*/g, '')));
      gLink.appendChild(p);
      return { a, b, sign: sign === '-' ? -1 : 1, why, o, p, len: p.getTotalLength(), t: Math.random() };
    });

    // ---------- propagation
    function solve() {
      const v = { R: st.lig }; const forced = Object.assign({}, (st.knock && st.knock.force) || {});
      if ('R' in forced) v.R = forced.R;
      C.nodes.forEach((n) => (v[n.id] = n.id in forced ? forced[n.id] : 0));
      const mixed = {};
      for (let it = 0; it < 40; it++) {
        let ch = 0;
        C.nodes.forEach((n) => {
          if (n.id in forced) return;
          let sum = 0, pos = 0, neg = 0;
          links.forEach((L) => { if (L.b !== n.id || L.o.fb) return; const c = L.sign * (v[L.a] || 0) * (L.o.w || 1); sum += c; if (c > 0.12) pos++; if (c < -0.12) neg++; });
          const nv = clamp(sum, -1, 1);
          mixed[n.id] = pos > 0 && neg > 0;
          if (Math.abs(nv - v[n.id]) > 1e-6) { ch++; v[n.id] = nv; }
        });
        if (!ch) break;
      }
      return { v, mixed, forced };
    }
    const sym = (x, mx) => (mx && Math.abs(x) < 0.6 ? '±' : x >= 0.6 ? '↑' : x > 0.15 ? '↑' : x <= -0.6 ? '↓' : x < -0.15 ? '↓' : '—');
    const cls = (x) => (x >= 0.6 ? 'up' : x > 0.15 ? 'up weak' : x <= -0.6 ? 'down' : x < -0.15 ? 'down weak' : 'flat');

    let S = null;
    function update() {
      S = solve();
      ligSel.querySelectorAll('button').forEach((b) => b.classList.toggle('on', +b.dataset.v === st.lig));
      const stepNodes = st.step >= 0 ? new Set(C.steps[st.step].n) : null;
      Object.values(els).forEach(({ g, badge, n }) => {
        const x = S.v[n.id];
        g.setAttribute('class', `casc-node cnode t-${n.type || 'kinase'} ${cls(x)}` + (S.mixed[n.id] ? ' mixed' : '') + (n.id in S.forced ? ' forced' : '') +
          ((st.focus && n.branch !== st.focus) || (stepNodes && !stepNodes.has(n.id)) ? ' dim' : '') + (stepNodes && stepNodes.has(n.id) ? ' hl' : ''));
        badge.textContent = n.id in S.forced && Math.abs(x) < 0.15 ? '✕' : sym(x, S.mixed[n.id]);
      });
      rG.classList.toggle('dim', !!stepNodes && !stepNodes.has('R'));
      Object.entries(bandEls).forEach(([b, g]) => g.classList.toggle('dim', !!st.focus && st.focus !== b));
      links.forEach((L) => {
        const src = S.v[L.a] || 0; const eff = L.sign * src;
        L.active = Math.abs(src) > 0.15 && !(L.b in S.forced);
        L.eff = eff;
        const dimmed = (st.focus && !(L.a === 'R' || byId[L.a].branch === st.focus) && byId[L.b].branch !== st.focus) || (stepNodes && !(stepNodes.has(L.a) && stepNodes.has(L.b)));
        L.p.setAttribute('class', 'casc-link' + (L.sign < 0 ? ' neg' : '') + (L.o.fb ? ' fb' : '') + (L.active ? ' on' : '') + (dimmed ? ' dim' : ''));
      });
      if (walkBtn) walkBtn.textContent = st.step >= 0 ? '■ Exit walkthrough' : '▶ Walk me through it';
      if (st.step >= 0) {
        cap.hidden = false;
        cap.innerHTML = `<div class="walk-nav"><button class="btn ghost" data-a="-1" ${st.step === 0 ? 'disabled' : ''}>◀</button><b>Step ${st.step + 1}/${C.steps.length}</b><button class="btn ghost" data-a="1" ${st.step === C.steps.length - 1 ? 'disabled' : ''}>▶</button></div><div>${EP.md(C.steps[st.step].t)}</div>`;
        cap.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => { st.step = clamp(st.step + +b.dataset.a, 0, C.steps.length - 1); update(); }));
      } else if (st.knock) { cap.hidden = false; cap.innerHTML = `<b>${EP.esc(st.knock.label)}.</b> ${EP.md(st.knock.desc || '')}`; }
      else cap.hidden = true;
      renderSide();
    }

    function renderSide() {
      const outs = C.nodes.filter((n) => n.type === 'outcome');
      const rows = C.branches.map((b) => {
        const os = outs.filter((n) => n.branch === b.id); if (!os.length) return '';
        return `<div class="casc-sb" style="--bc:var(--tr${b.c})"><div class="casc-sbh">${EP.esc(b.label)}</div>${os.map((n) => { const x = S.v[n.id]; return `<div class="casc-o ${cls(x)}"><span class="q">${n.id in S.forced && Math.abs(x) < 0.15 ? '✕' : sym(x, S.mixed[n.id])}</span><a class="linkish" data-n="${n.id}">${EP.esc(n.label)}</a>${n.time ? `<span class="tm">${EP.esc(n.time)}</span>` : ''}</div>`; }).join('')}</div>`;
      }).join('');
      const fb = st.focus ? C.branches.find((b) => b.id === st.focus) : null;
      side.innerHTML = `<div class="why-head">What it results in</div><p class="small muted">${st.lig > 0 ? `When ${EP.esc((C.ligand || 'the hormone').toLowerCase())} rises:` : st.lig < 0 ? `When ${EP.esc((C.ligand || 'the hormone').toLowerCase())} falls:` : 'At basal hormone (changes come only from the selected disorder/drug):'}</p><div class="casc-outs">${rows}</div>
        ${fb ? `<div class="casc-fdesc"><b>${EP.esc(fb.label)}</b><br>${EP.md(fb.desc || '')}</div>` : '<p class="small muted">Click a coloured band to isolate a branch; click any box for the mechanism. Time tags show how fast each output appears.</p>'}`;
      side.querySelectorAll('[data-n]').forEach((a) => a.addEventListener('click', () => info(a.dataset.n)));
    }

    function info(nid) {
      const n = nid === 'R' ? Object.assign({ id: 'R', label: C.receptor.label, why: C.receptor.why, ent: C.receptor.ent }, {}) : byId[nid];
      const ent = n.ent && EP.data.entities[n.ent];
      const inn = links.filter((L) => L.b === nid), out = links.filter((L) => L.a === nid);
      const nm = (x) => (x === 'R' ? C.receptor.label : byId[x].label);
      const li = (L, other) => `<li><span class="${L.sign < 0 ? 'bad' : 'ok'}">${L.sign < 0 ? '⊣' : '→'}</span> <strong>${EP.esc(nm(other))}</strong>${L.o.fb ? ' <span class="small muted">(feedback)</span>' : ''}${L.why ? `<div class="small muted">${EP.md(L.why)}</div>` : ''}</li>`;
      const x = S.v[nid] || 0;
      const br = n.branch && C.branches.find((b) => b.id === n.branch);
      let html = `<div class="why-head">${EP.esc(C.title)}${br ? ' · ' + EP.esc(br.label) : ''}</div><h3>${EP.esc(n.label)}</h3>`;
      if (nid !== 'R') html += `<div class="modelval">Now: <span class="qual ${cls(x).split(' ')[0]}">${sym(x, S.mixed[nid])}</span> ${nid in S.forced ? '(set by the selected disorder/drug)' : ''} ${n.time ? `· appears over <b>${EP.esc(n.time)}</b>` : ''}</div>`;
      if (n.why) html += `<p>${EP.md(n.why)}</p>`;
      if (ent && ent.what) html += `<p class="small">${EP.md(ent.what)}</p>`;
      if (inn.length) html += `<h4>Inputs</h4><ul class="keypoints">${inn.map((L) => li(L, L.a)).join('')}</ul>`;
      if (out.length) html += `<h4>Outputs</h4><ul class="keypoints">${out.map((L) => li(L, L.b)).join('')}</ul>`;
      if (ent) html += `<p><a class="linkish" data-ent="${n.ent}">More about ${EP.esc(ent.name)} →</a></p>`;
      EP.showInfoHTML(html);
      const a = document.querySelector('[data-ent]'); if (a) a.addEventListener('click', () => EP.showInfo(n.ent));
    }

    // ---------- signal particles
    const dots = [];
    const stop = EP.loop((dt) => {
      links.forEach((L) => {
        if (!L.active || L.p.classList.contains('dim')) { if (L.dot) { L.dot.remove(); L.dot = null; } return; }
        if (!L.dot) { L.dot = s('circle', { r: 3.3, class: 'casc-dot' }); gDot.appendChild(L.dot); }
        L.dot.setAttribute('class', 'casc-dot ' + (L.eff > 0 ? 'pos' : 'neg'));
        L.t = (L.t + dt * 95 / Math.max(L.len, 40)) % 1;
        const pt = L.p.getPointAtLength(L.t * L.len); L.dot.setAttribute('cx', pt.x); L.dot.setAttribute('cy', pt.y);
      });
    });
    EP.onTeardown && EP.onTeardown(stop);
    if (opts.knock) st.knock = C.knock.find((k) => k.id === opts.knock) || null;
    if (knockSel && st.knock) knockSel.value = st.knock.id;
    update();
    if (opts.sources !== false && C.refs) container.appendChild(EP.sources(C.refs));
    return { update, st, stop };
  };
})();
