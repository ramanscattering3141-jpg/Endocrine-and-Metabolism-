/* Shared arrow router for every diagram engine (pathway, network, flow).
 * EP.route(A, B, obstacles, o) returns a polyline [[x,y],…] from box A to box B that avoids the
 * obstacle boxes when it can, preferring straight or right-angle (orthogonal) paths. Boxes are
 * {x, y, w, h} with x, y = centre. EP.pathD() turns a polyline into an SVG path with rounded corners.
 * EP.placeLabel() finds a spot along a polyline where a label covers no box and no other label. */
(function () {
  'use strict';
  const EP = window.EP;

  const rectOf = (b, pad) => ({ x0: b.x - b.w / 2 - pad, x1: b.x + b.w / 2 + pad, y0: b.y - b.h / 2 - pad, y1: b.y + b.h / 2 + pad });
  /** Does segment p→q cross rectangle r (Liang–Barsky)? */
  function segHits(p, q, r) {
    let t0 = 0, t1 = 1;
    const dx = q[0] - p[0], dy = q[1] - p[1];
    const P = [-dx, dx, -dy, dy], Q = [p[0] - r.x0, r.x1 - p[0], p[1] - r.y0, r.y1 - p[1]];
    for (let i = 0; i < 4; i++) {
      if (P[i] === 0) { if (Q[i] < 0) return false; continue; }
      const t = Q[i] / P[i];
      if (P[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
    return t1 - t0 > 1e-6;
  }
  EP.segHits = (p, q, b, pad = 0) => segHits(p, q, rectOf(b, pad));
  function hits(pts, obs, pad) {
    let n = 0;
    for (let i = 1; i < pts.length; i++) for (const o of obs) if (segHits(pts[i - 1], pts[i], rectOf(o, pad))) n++;
    return n;
  }
  const len = (pts) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
  // point where the ray from the box centre toward (tx,ty) leaves the box (plus pad)
  function exitPt(b, tx, ty, pad) {
    const dx = tx - b.x, dy = ty - b.y;
    if (!dx && !dy) return [b.x, b.y];
    const sc = Math.min((b.w / 2 + pad) / Math.abs(dx || 1e-9), (b.h / 2 + pad) / Math.abs(dy || 1e-9));
    return [b.x + dx * sc, b.y + dy * sc];
  }
  EP.exitPt = exitPt;

  /** o: { padA, padB, diag (penalty for a slanted straight line), obstaclePad } */
  EP.route = function (A, B, obstacles, o = {}) {
    const pa = o.padA != null ? o.padA : 2, pb = o.padB != null ? o.padB : 5, op = o.obstaclePad != null ? o.obstaclePad : 4;
    const obs = obstacles || [];
    const ax0 = A.x - A.w / 2, ax1 = A.x + A.w / 2, ay0 = A.y - A.h / 2, ay1 = A.y + A.h / 2;
    const bx0 = B.x - B.w / 2, bx1 = B.x + B.w / 2, by0 = B.y - B.h / 2, by1 = B.y + B.h / 2;
    const C = [];
    // aligned: straight vertical / horizontal through the overlap of the two boxes
    const ox0 = Math.max(ax0, bx0) + 8, ox1 = Math.min(ax1, bx1) - 8;
    if (ox1 >= ox0) {
      const x = Math.abs(A.x - B.x) < 2 ? A.x : (ox0 + ox1) / 2;
      const down = B.y > A.y;
      C.push({ pts: [[x, down ? ay1 + pa : ay0 - pa], [x, down ? by0 - pb : by1 + pb]], cost: 0 });
    }
    const oy0 = Math.max(ay0, by0) + 6, oy1 = Math.min(ay1, by1) - 6;
    if (oy1 >= oy0) {
      const y = Math.abs(A.y - B.y) < 2 ? A.y : (oy0 + oy1) / 2;
      const right = B.x > A.x;
      C.push({ pts: [[right ? ax1 + pa : ax0 - pa, y], [right ? bx0 - pb : bx1 + pb, y]], cost: 0 });
    }
    // slanted straight line
    C.push({ pts: [exitPt(A, B.x, B.y, pa), exitPt(B, A.x, A.y, pb)], cost: o.diag != null ? o.diag : 60 });
    const right = B.x >= A.x, down = B.y >= A.y;
    // L-shapes (one bend)
    if (B.x < ax0 - 10 || B.x > ax1 + 10) if (A.y < by0 - 10 || A.y > by1 + 10) C.push({ pts: [[right ? ax1 + pa : ax0 - pa, A.y], [B.x, A.y], [B.x, down ? by0 - pb : by1 + pb]], cost: 22 });
    if (B.y < ay0 - 10 || B.y > ay1 + 10) if (A.x < bx0 - 10 || A.x > bx1 + 10) C.push({ pts: [[A.x, down ? ay1 + pa : ay0 - pa], [A.x, B.y], [right ? bx0 - pb : bx1 + pb, B.y]], cost: 22 });
    // Z-shapes (two bends) at a few lane positions
    if (bx0 > ax1 + 16 || ax0 > bx1 + 16) {
      const xs = right ? [ax1, bx0] : [bx1, ax0];
      [0.5, 0.3, 0.7, 0.15, 0.85].forEach((f, i) => { const mx = xs[0] + (xs[1] - xs[0]) * f; C.push({ pts: [[right ? ax1 + pa : ax0 - pa, A.y], [mx, A.y], [mx, B.y], [right ? bx0 - pb : bx1 + pb, B.y]], cost: 40 + i * 6 }); });
    }
    if (by0 > ay1 + 16 || ay0 > by1 + 16) {
      const ys = down ? [ay1, by0] : [by1, ay0];
      [0.5, 0.3, 0.7, 0.15, 0.85].forEach((f, i) => { const my = ys[0] + (ys[1] - ys[0]) * f; C.push({ pts: [[A.x, down ? ay1 + pa : ay0 - pa], [A.x, my], [B.x, my], [B.x, down ? by0 - pb : by1 + pb]], cost: 40 + i * 6 }); });
    }
    // detours around blocking boxes: go out to a side lane past all obstacles in the way
    const lanes = [];
    const minX = Math.min(ax0, bx0), maxX = Math.max(ax1, bx1), minY = Math.min(ay0, by0), maxY = Math.max(ay1, by1);
    obs.forEach((b) => { lanes.push(['x', b.x - b.w / 2 - 12], ['x', b.x + b.w / 2 + 12], ['y', b.y - b.h / 2 - 12], ['y', b.y + b.h / 2 + 12]); });
    lanes.push(['x', minX - 18], ['x', maxX + 18], ['y', minY - 18], ['y', maxY + 18]);
    lanes.forEach(([k, v]) => {
      if (k === 'x') C.push({ pts: [[v < A.x ? ax0 - pa : ax1 + pa, A.y], [v, A.y], [v, B.y], [v < B.x ? bx0 - pb : bx1 + pb, B.y]], cost: 70 });
      else C.push({ pts: [[A.x, v < A.y ? ay0 - pa : ay1 + pa], [A.x, v], [B.x, v], [B.x, v < B.y ? by0 - pb : by1 + pb]], cost: 70 });
    });
    let best = null;
    const consider = (c) => {
      // a path must not run back through its own end boxes
      const self = hits(c.pts.slice(1), [A], -3) + hits(c.pts.slice(0, -1), [B], -3);
      const score = (hits(c.pts, obs, op) + self) * 1000 + len(c.pts) + c.cost;
      if (!best || score < best.score) best = { pts: c.pts, score, clean: !hits(c.pts, obs, op) && !self };
    };
    C.forEach(consider);
    if (!best.clean) {
      // still blocked: try three-bend paths through one vertical and one horizontal lane
      const xs = lanes.filter((l) => l[0] === 'x').map((l) => l[1]), ys = lanes.filter((l) => l[0] === 'y').map((l) => l[1]);
      xs.forEach((x) => ys.forEach((y) => {
        consider({ pts: [[x < A.x ? ax0 - pa : ax1 + pa, A.y], [x, A.y], [x, y], [B.x, y], [B.x, y < B.y ? by0 - pb : by1 + pb]], cost: 90 });
        consider({ pts: [[A.x, y < A.y ? ay0 - pa : ay1 + pa], [A.x, y], [x, y], [x, B.y], [x < B.x ? bx0 - pb : bx1 + pb, B.y]], cost: 90 });
      }));
    }
    return best;
  };

  /** Polyline → SVG path with rounded corners (radius r). */
  EP.pathD = function (pts, r = 9) {
    if (pts.length < 3) return 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], a = pts[i - 1], b = pts[i + 1];
      const la = Math.hypot(p[0] - a[0], p[1] - a[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const rr = Math.min(r, la / 2, lb / 2);
      const s1 = [p[0] + (a[0] - p[0]) / (la || 1) * rr, p[1] + (a[1] - p[1]) / (la || 1) * rr];
      const s2 = [p[0] + (b[0] - p[0]) / (lb || 1) * rr, p[1] + (b[1] - p[1]) / (lb || 1) * rr];
      d += ` L${s1[0].toFixed(1)},${s1[1].toFixed(1)} Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${s2[0].toFixed(1)},${s2[1].toFixed(1)}`;
    }
    const l = pts[pts.length - 1];
    return d + ` L${l[0].toFixed(1)},${l[1].toFixed(1)}`;
  };

  /** Place a label (text, font px) along polyline pts so it covers no box (boxes) and no placed label (placed, mutated). */
  EP.placeLabel = function (pts, text, boxes, placed, fs = 10.5, lines = []) {
    const w = EP.textWidth(text, fs, 600) + 6, hh = fs + 5;
    const segs = pts.slice(1).map((p, i) => ({ a: pts[i], b: p, L: Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]) })).sort((x, y) => y.L - x.L);
    const free = (cx, cy) => {
      const r = { x0: cx - w / 2, x1: cx + w / 2, y0: cy - hh / 2, y1: cy + hh / 2 };
      const ov = (q) => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0;
      if (boxes.some((b) => ov(rectOf(b, 2))) || placed.some(ov)) return false;
      for (const L of lines) for (let i = 1; i < L.length; i++) if (segHits(L[i - 1], L[i], r)) return false;
      return r;
    };
    for (const sg of segs) {
      const horiz = Math.abs(sg.b[1] - sg.a[1]) < Math.abs(sg.b[0] - sg.a[0]);
      for (const f of [0.5, 0.35, 0.65, 0.2, 0.8]) {
        const px = sg.a[0] + (sg.b[0] - sg.a[0]) * f, py = sg.a[1] + (sg.b[1] - sg.a[1]) * f;
        const offs = horiz ? [[0, -hh / 2 - 1], [0, hh / 2 + 2]] : [[w / 2 + 4, 0], [-w / 2 - 4, 0]];
        for (const [ox, oy] of offs) { const r = free(px + ox, py + oy); if (r) { placed.push(r); return [px + ox, py + oy + fs * 0.36]; } }
      }
    }
    // no room beside the line: move further out, perpendicular to the longest segment
    const sg = segs[0]; const px = (sg.a[0] + sg.b[0]) / 2, py = (sg.a[1] + sg.b[1]) / 2;
    const horiz = Math.abs(sg.b[1] - sg.a[1]) < Math.abs(sg.b[0] - sg.a[0]);
    for (let k = 1; k <= 8; k++) {
      for (const sgn of [-1, 1]) {
        const ox = horiz ? 0 : sgn * (w / 2 + 4 + k * 10), oy = horiz ? sgn * (hh / 2 + 1 + k * 8) : 0;
        const r = free(px + ox, py + oy); if (r) { placed.push(r); return [px + ox, py + oy + fs * 0.36]; }
      }
    }
    return [px, py - 4];
  };
})();
