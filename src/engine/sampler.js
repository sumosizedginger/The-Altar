/**
 * src/engine/sampler.js
 * Symbols & Sigils — The Living Altar (v3), Phase 2
 *
 * Pure-math symbol geometry core. NO three.js imports here: this module
 * runs identically in the browser engine and in Node (ASCII plotting,
 * bounds/closed/symmetry validation). One normalized format, one sampler:
 * there are no per-symbol renderers anywhere in the codebase.
 *
 * Normalized space: x right, y UP, everything inside [0,1]² (±tolerance).
 *
 * Primitive types (see schema.js geometry contract):
 *   line     { x1,y1,x2,y2 }
 *   polyline { points: [[x,y],...] }           (closed if geometry says so)
 *   arc      { cx,cy,r,a0,a1, ccw? }            (angles in DEGREES, CCW+)
 *   cubic    { x1,y1, cx1,cy1, cx2,cy2, x2,y2 }
 *   polar    { cx,cy, rFn:"expr", a0?, a1? }    (t∈[0,1] maps to angle)
 *
 * Every primitive samples to an ordered array of [x,y] points — the stroke
 * order of the symbol is the order of its primitives.
 */

/* ------------------------------------------------------------------ */
/* Tiny safe expression parser for polar rFn (no eval)                */
/* Grammar: number | t | pi | (E) | f(E) | E op E,  f ∈ {sin,cos,abs}  */
/* ------------------------------------------------------------------ */

export function compileExpr(src) {
  let i = 0;
  const isDigit = (c) => c >= "0" && c <= "9";
  function skip() { while (src[i] === " ") i++; }
  function parseNumber() {
    const start = i;
    while (isDigit(src[i]) || src[i] === ".") i++;
    const v = parseFloat(src.slice(start, i));
    if (!Number.isFinite(v)) throw new Error(`bad number in expr "${src}"`);
    return () => v;
  }
  function parseAtom() {
    skip();
    const c = src[i];
    if (isDigit(c) || c === ".") return parseNumber();
    if (c === "(") {
      i++;
      const inner = parseAdd();
      skip();
      if (src[i] !== ")") throw new Error(`missing ) in expr "${src}"`);
      i++;
      return inner;
    }
    if (c === "-") { i++; const rhs = parseAtom(); return (t) => -rhs(t); }
    // identifier
    const m = /^[a-z]+/i.exec(src.slice(i));
    if (!m) throw new Error(`unexpected token in expr "${src}" at ${i}`);
    const name = m[0];
    i += name.length;
    skip();
    if (src[i] === "(") {
      i++;
      const arg = parseAdd();
      skip();
      if (src[i] !== ")") throw new Error(`missing ) after ${name} in "${src}"`);
      i++;
      const fns = { sin: Math.sin, cos: Math.cos, abs: Math.abs };
      if (!fns[name]) throw new Error(`unknown function ${name} in "${src}"`);
      const f = fns[name];
      return (t) => f(arg(t));
    }
    if (name === "t") return (t) => t;
    if (name === "pi") return () => Math.PI;
    throw new Error(`unknown identifier ${name} in "${src}"`);
  }
  function parsePow() {
    const base = parseAtom();
    skip();
    if (src[i] === "^") {
      i++;
      const exp = parsePow();
      return (t) => Math.pow(base(t), exp(t));
    }
    return base;
  }
  function parseMul() {
    let lhs = parsePow();
    for (;;) {
      skip();
      const c = src[i];
      if (c === "*" || c === "/") {
        i++;
        const rhs = parsePow();
        const op = c;
        const l = lhs;
        lhs = (t) => (op === "*" ? l(t) * rhs(t) : l(t) / rhs(t));
      } else break;
    }
    return lhs;
  }
  function parseAdd() {
    let lhs = parseMul();
    for (;;) {
      skip();
      const c = src[i];
      if (c === "+" || c === "-") {
        i++;
        const rhs = parseMul();
        const op = c;
        const l = lhs;
        lhs = (t) => (op === "+" ? l(t) + rhs(t) : l(t) - rhs(t));
      } else break;
    }
    return lhs;
  }
  const fn = parseAdd();
  skip();
  if (i !== src.length) throw new Error(`trailing tokens in expr "${src}"`);
  return fn;
}

/* ------------------------------------------------------------------ */
/* Primitive sampling                                                  */
/* ------------------------------------------------------------------ */

const DEG = Math.PI / 180;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function arcPoint(cx, cy, r, aDeg) {
  return [cx + r * Math.cos(aDeg * DEG), cy + r * Math.sin(aDeg * DEG)];
}

/**
 * Sample one primitive into ≥2 ordered points.
 * @param {object} p primitive record
 * @param {number} quality 1 = default density (debug plot may raise it)
 */
export function samplePrimitive(p, quality = 1) {
  const t0 = p.t0 ?? 0;
  const t1 = p.t1 ?? 1;
  switch (p.type) {
    case "line": {
      const len = Math.hypot(p.x2 - p.x1, p.y2 - p.y1);
      const n = Math.max(2, Math.ceil(len * 48 * quality));
      const pts = [];
      for (let k = 0; k <= n; k++) {
        const u = t0 + ((t1 - t0) * k) / n;
        pts.push([p.x1 + (p.x2 - p.x1) * u, p.y1 + (p.y2 - p.y1) * u]);
      }
      return pts;
    }
    case "polyline": {
      const src = p.points;
      // walk cumulative length; densify each segment so draw-range reveal
      // and analysis see many rings, not just the raw vertices
      const lens = [0];
      for (let k = 1; k < src.length; k++)
        lens.push(lens[k - 1] + Math.hypot(src[k][0] - src[k - 1][0], src[k][1] - src[k - 1][1]));
      const L = lens[lens.length - 1] || 1;
      const a = t0 * L, b = t1 * L;
      const at = (d) => {
        let k = 1;
        while (k < lens.length - 1 && lens[k] < d) k++;
        const f = (d - lens[k - 1]) / (lens[k] - lens[k - 1] || 1);
        return [src[k - 1][0] + (src[k][0] - src[k - 1][0]) * f, src[k - 1][1] + (src[k][1] - src[k - 1][1]) * f];
      };
      const DENSITY = Math.max(24, Math.round(48 * quality)); // samples per unit
      const n = Math.max(2, Math.ceil(((b - a) / L) * DENSITY * (L || 1)));
      const pts = [];
      for (let k = 0; k <= n; k++) pts.push(at(a + ((b - a) * k) / n));
      return pts;
    }
    case "arc": {
      const span = p.ccw === false ? -(p.a1 - p.a0) : p.a1 - p.a0;
      const n = Math.max(6, Math.round((Math.abs(span) / 12) * quality));
      const pts = [];
      for (let k = 0; k <= n; k++) {
        const u = t0 + ((t1 - t0) * k) / n;
        pts.push(arcPoint(p.cx, p.cy, p.r, p.a0 + span * u));
      }
      return pts;
    }
    case "cubic": {
      const n = Math.max(8, Math.round(16 * quality));
      const pts = [];
      for (let k = 0; k <= n; k++) {
        const u = t0 + ((t1 - t0) * k) / n;
        const v = 1 - u;
        const x = v * v * v * p.x1 + 3 * v * v * u * p.cx1 + 3 * v * u * u * p.cx2 + u * u * u * p.x2;
        const y = v * v * v * p.y1 + 3 * v * v * u * p.cy1 + 3 * v * u * u * p.cy2 + u * u * u * p.y2;
        pts.push([x, y]);
      }
      return pts;
    }
    case "polar": {
      const a0 = (p.a0 ?? 0) * DEG;
      const a1 = (p.a1 ?? 360) * DEG;
      const rf = compileExpr(p.rFn);
      const n = Math.max(12, Math.round((Math.abs(a1 - a0) / (Math.PI / 24)) * quality));
      const pts = [];
      for (let k = 0; k <= n; k++) {
        const u = t0 + ((t1 - t0) * k) / n;
        const a = a0 + (a1 - a0) * u;
        const r = rf(u);
        pts.push([p.cx + r * Math.cos(a), p.cy + r * Math.sin(a)]);
      }
      return pts;
    }
    default:
      throw new Error(`unknown primitive type ${p.type}`);
  }
}

/** Sample a whole geometry: array of {id, points} in stroke order. */
export function sampleGeometry(geometry, quality = 1) {
  return geometry.primitives.map((p) => ({ id: p.id ?? null, points: samplePrimitive(p, quality) }));
}

/* ------------------------------------------------------------------ */
/* Analysis: bounds, closed intent, symmetry (validation script)       */
/* ------------------------------------------------------------------ */

export function analyzeGeometry(geometry, { tol = 0.08 } = {}) {
  const issues = [];
  const strokes = sampleGeometry(geometry, 2);
  const all = strokes.flatMap((s) => s.points);

  // 1. bounds: every sampled point inside [0,1]² ± tol
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of all) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    if (x < -tol || x > 1 + tol || y < -tol || y > 1 + tol)
      issues.push(`bounds: point (${x.toFixed(3)},${y.toFixed(3)}) outside normalized space (±${tol})`);
  }
  // 2. non-degenerate extent (thin glyphs like the unalome are fine;
  // a glyph tiny in BOTH dimensions is a data error)
  if (maxX - minX < 0.18 && maxY - minY < 0.18)
    issues.push(`bounds: glyph suspiciously small (${(maxX - minX).toFixed(2)} × ${(maxY - minY).toFixed(2)})`);

  // 3. closed/open intent
  const closes = (pts, eps = 0.02) => Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]) < eps;
  const anyClosed = strokes.some((s) => closes(s.points));
  if (geometry.closed === true && !anyClosed)
    issues.push(`closed: declared closed but no stroke returns to its start`);
  if (geometry.closed === false && anyClosed)
    issues.push(`closed: declared open but a stroke returns to its start`);

  // 4. symmetry check (declared vs sampled).
  // Rotation/mirror centers come from the point centroid — the bbox center
  // is unreliable for glyphs whose strokes don't fill their box evenly.
  let cx = 0, cy = 0;
  for (const [x, y] of all) { cx += x; cy += y; }
  cx /= all.length; cy /= all.length;
  const distToSet = (pt, pts) => {
    let best = Infinity;
    for (const q of pts) {
      const d = Math.hypot(pt[0] - q[0], pt[1] - q[1]);
      if (d < best) best = d;
    }
    return best;
  };
  const checkSymmetry = (transform, label) => {
    const symTol = 0.045;
    let hits = 0;
    const probes = all.filter((_, i) => i % 3 === 0); // subsample for speed
    for (const p of probes) {
      const q = transform(p);
      if (distToSet(q, all) < symTol) hits++;
    }
    const ratio = probes.length ? hits / probes.length : 0;
    if (ratio < 0.86)
      issues.push(`symmetry: declared ${geometry.symmetry} but sampled set matches ${label} only ${(ratio * 100).toFixed(0)}%`);
  };
  if (geometry.symmetry === "vertical") checkSymmetry(([x, y]) => [2 * cx - x, y], "vertical mirror");
  if (geometry.symmetry === "horizontal") checkSymmetry(([x, y]) => [x, 2 * cy - y], "horizontal mirror");
  const rot = geometry.symmetry.match?.(/^rotational-(\d+)$/);
  if (rot) {
    const n = parseInt(rot[1], 10);
    const a = (2 * Math.PI) / n;
    checkSymmetry(([x, y]) => {
      const dx = x - cx, dy = y - cy;
      return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
    }, `${n}-fold rotation`);
  }

  // 5. stroke-order sanity: ids in geometry.strokeOrder must exist
  if (geometry.strokeOrder) {
    const ids = new Set(geometry.primitives.map((p) => p.id).filter(Boolean));
    for (const id of geometry.strokeOrder)
      if (!ids.has(id)) issues.push(`strokeOrder: unknown primitive id "${id}"`);
  }

  return { issues, bounds: { minX, minY, maxX, maxY } };
}

/* ------------------------------------------------------------------ */
/* ASCII plotting (developer eyes; used by scripts/plot-geometry.mjs)  */
/* ------------------------------------------------------------------ */

export function plotGeometry(geometry, W = 64, H = 36) {
  const grid = Array.from({ length: H }, () => Array(W).fill(" "));
  const strokes = sampleGeometry(geometry, 2);
  strokes.forEach((s, si) => {
    const mark = "123456789abcdefghijklmnopqrstuvwxyz"[si % 36] || "*";
    for (const [x, y] of s.points) {
      const px = Math.round(x * (W - 1));
      const py = Math.round((1 - y) * (H - 1)); // y up → row down
      if (px >= 0 && px < W && py >= 0 && py < H) grid[py][px] = mark;
    }
  });
  return grid.map((row) => row.join("")).join("\n");
}
