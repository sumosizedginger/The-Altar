/**
 * data/geometry/_helpers.js
 * Authoring helpers for symbol geometry. The OUTPUT is always the plain
 * normalized primitive format from schema.js — helpers only keep the data
 * files compact and exact (rotations, circles, mirrored pairs). One
 * normalized format, one generic renderer: helpers are authoring sugar,
 * not bespoke renderers.
 */

const DEG = Math.PI / 180;

export function rotXY(x, y, deg, cx, cy) {
  const a = deg * DEG;
  const dx = x - cx, dy = y - cy;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
}

/** Rotate any primitive `deg` degrees around (cx, cy).
 *  Transformed copies lose their id — callers must re-id them
 *  (ids must stay unique within a geometry). */
export function rot(p, deg, cx = 0.5, cy = 0.5) {
  if (deg === 0) return { ...p };
  const q = { ...p };
  delete q.id;
  switch (p.type) {
    case "line": {
      [q.x1, q.y1] = rotXY(p.x1, p.y1, deg, cx, cy);
      [q.x2, q.y2] = rotXY(p.x2, p.y2, deg, cx, cy);
      break;
    }
    case "polyline":
      q.points = p.points.map(([x, y]) => rotXY(x, y, deg, cx, cy));
      break;
    case "arc":
      [q.cx, q.cy] = rotXY(p.cx, p.cy, deg, cx, cy);
      q.a0 = p.a0 + deg;
      q.a1 = p.a1 + deg;
      break;
    case "cubic": {
      [q.x1, q.y1] = rotXY(p.x1, p.y1, deg, cx, cy);
      [q.cx1, q.cy1] = rotXY(p.cx1, p.cy1, deg, cx, cy);
      [q.cx2, q.cy2] = rotXY(p.cx2, p.cy2, deg, cx, cy);
      [q.x2, q.y2] = rotXY(p.x2, p.y2, deg, cx, cy);
      break;
    }
    case "polar":
      [q.cx, q.cy] = rotXY(p.cx, p.cy, deg, cx, cy);
      q.a0 = (p.a0 ?? 0) + deg;
      q.a1 = (p.a1 ?? 360) + deg;
      break;
  }
  return q;
}

/** Mirror a primitive across the vertical axis x = mx.
 *  Transformed copies lose their id — callers must re-id them. */
export function mirrorV(p, mx = 0.5) {
  const q = { ...p };
  delete q.id;
  const m = (x) => 2 * mx - x;
  switch (p.type) {
    case "line":
      q.x1 = m(p.x1); q.x2 = m(p.x2);
      break;
    case "polyline":
      q.points = p.points.map(([x, y]) => [m(x), y]);
      break;
    case "arc":
      q.cx = m(p.cx);
      // mirror maps angle θ → 180−θ, preserving parameter direction,
      // which flips the sweep handedness
      q.a0 = 180 - p.a0;
      q.a1 = 180 - p.a1;
      break;
    case "cubic":
      q.x1 = m(p.x1); q.x2 = m(p.x2);
      q.cx1 = m(p.cx1); q.cx2 = m(p.cx2);
      break;
    case "polar":
      q.cx = m(p.cx);
      q.a0 = 180 - (p.a0 ?? 0);
      q.a1 = 180 - (p.a1 ?? 360);
      break;
  }
  return q;
}

/** Full-circle arc primitive. */
export function circle(id, cx, cy, r, extra = {}) {
  return { id, type: "arc", cx, cy, r, a0: 0, a1: 360, ...extra };
}

export function line(id, x1, y1, x2, y2) {
  return { id, type: "line", x1, y1, x2, y2 };
}

export function polyline(id, points) {
  return { id, type: "polyline", points };
}

export function cubic(id, x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
  return { id, type: "cubic", x1, y1, cx1, cy1, cx2, cy2, x2, y2 };
}

export function arc(id, cx, cy, r, a0, a1, extra = {}) {
  return { id, type: "arc", cx, cy, r, a0, a1, ...extra };
}

export function polar(id, cx, cy, rFn, a0 = 0, a1 = 360, extra = {}) {
  return { id, type: "polar", cx, cy, rFn, a0, a1, ...extra };
}

/** Standard record wrapper. */
export function geom({ primitives, strokeOrder, closed, symmetry, anchor = [0.5, 0.5], orientation = "upright", variants = null }) {
  const rec = { format: "altar-symbol/1", primitives, strokeOrder, closed, symmetry, anchor, orientation };
  if (variants) rec.variants = variants;
  return rec;
}
