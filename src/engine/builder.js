/**
 * src/engine/builder.js
 * Symbols & Sigils — Phase 2 symbol engine (three.js layer).
 *
 * ONE generic renderer for ALL symbols: every geometry record becomes a
 * set of tube strokes built from sampled normalized points. No per-symbol
 * mesh code exists anywhere. Reveal is done with draw-range over ring
 * segments, so the index buffer is ordered along the stroke.
 */
import * as THREE from "three";
import { samplePrimitive } from "./sampler.js";

/* ------------------------------------------------------------------ */
/* Variable-radius tube along a sampled 2D polyline (in XY plane).     */
/* Ring-major vertex order → setDrawRange reveals start→tip.           */
/* ------------------------------------------------------------------ */
export function buildStrokeGeometry(points, {
  radius = 0.011,
  radialSegments = 8,
  radiusFn = null,          // (u∈0..1) → multiplier, for brush behavior
} = {}) {
  const N = points.length;
  const R = Math.max(3, radialSegments);
  const positions = new Float32Array(N * R * 3);
  const normals = new Float32Array(N * R * 3);
  const indices = [];

  const tan = new THREE.Vector2(), nrm = new THREE.Vector2();
  const Z = new THREE.Vector3(0, 0, 1);
  const n3 = new THREE.Vector3(), b3 = new THREE.Vector3();

  const pt = (i) => points[Math.min(N - 1, Math.max(0, i))];

  for (let i = 0; i < N; i++) {
    const u = N > 1 ? i / (N - 1) : 0;
    const r = radius * (radiusFn ? Math.max(0.08, radiusFn(u)) : 1);
    // tangent by central difference
    const a = pt(i - 1), b = pt(i + 1);
    tan.set(b[0] - a[0], b[1] - a[1]);
    if (tan.lengthSq() < 1e-10) tan.set(1, 0);
    tan.normalize();
    nrm.set(-tan.y, tan.x); // in-plane normal
    n3.set(nrm.x, nrm.y, 0);
    b3.copy(Z);
    const [x, y] = pt(i);
    for (let j = 0; j < R; j++) {
      const th = (j / R) * Math.PI * 2;
      const cx = Math.cos(th), sy = Math.sin(th);
      const k = (i * R + j) * 3;
      positions[k] = x + (n3.x * cx + b3.x * sy) * r;
      positions[k + 1] = y + (n3.y * cx + b3.y * sy) * r;
      positions[k + 2] = 0 + (n3.z * cx + b3.z * sy) * r;
      normals[k] = n3.x * cx + b3.x * sy;
      normals[k + 1] = n3.y * cx + b3.y * sy;
      normals[k + 2] = n3.z * cx + b3.z * sy;
    }
  }
  for (let i = 0; i < N - 1; i++) {
    for (let j = 0; j < R; j++) {
      const j2 = (j + 1) % R;
      const v0 = i * R + j, v1 = (i + 1) * R + j;
      const v2 = (i + 1) * R + j2, v3 = i * R + j2;
      indices.push(v0, v1, v2, v0, v2, v3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  g.setIndex(indices);
  return g;
}

/** Index count to reveal for progress p∈[0,1] of a stroke geometry. */
export function revealCount(geometry, p) {
  const idx = geometry.index;
  if (!idx) return 0;
  const total = idx.count;
  if (p >= 1) return total;
  if (p <= 0) return 0;
  // total = rings * R * 6 → quantize to whole ring segments
  const rings = total / 6;
  const visible = Math.max(0, Math.ceil(p * rings));
  return Math.min(total, visible * 6);
}

/* ------------------------------------------------------------------ */
/* Shared materials (cloned per instance for emissive idling)          */
/* ------------------------------------------------------------------ */
export function makeBrassMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    metalness: 0.75,
    roughness: 0.38,
    emissive: 0x2a1f0c,
    emissiveIntensity: 0.55,
  });
}

export function makeInkMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x1d1a14,
    metalness: 0.15,
    roughness: 0.8,
    emissive: 0x100d07,
    emissiveIntensity: 0.4,
  });
}

/* ------------------------------------------------------------------ */
/* Build a symbol group from its geometry record.                      */
/* Returns { group, strokes:[{mesh, geom, points, id, primitive}] }    */
/* ------------------------------------------------------------------ */
export function buildSymbol(symbol, { material = null, radius = 0.011, radialSegments = 8 } = {}) {
  const geo = symbol.geometry;
  if (!geo) throw new Error(`symbol ${symbol.id} has no geometry yet`);
  const byId = new Map(geo.primitives.map((p, i) => [p.id ?? `#${i}`, p]));
  const order = geo.strokeOrder && geo.strokeOrder.length ? geo.strokeOrder : [...byId.keys()];

  // Stroke weight: symbol-declared (calligraphic forms) > call-site > default
  radius = symbol.animationParams?.radius ?? radius;

  const group = new THREE.Group();
  const strokes = [];
  const baseMat = material ?? makeBrassMaterial();

  // Brush-pressure radius profile (behavior 6)
  const pressure = symbol.animationParams?.pressure;
  const radiusFn =
    pressure === "calligraphic"
      ? (u) => 0.5 + 1.15 * Math.sin(Math.PI * Math.min(1, Math.max(0, u))) ** 0.8
      : null;

  for (const id of order) {
    const primitive = byId.get(id);
    if (!primitive) continue;
    const pts = samplePrimitive(primitive, 2).map(([x, y]) => [x, y]);
    if (pts.length < 2) continue;
    const geom = buildStrokeGeometry(pts, { radius, radialSegments, radiusFn });
    const mesh = new THREE.Mesh(geom, baseMat);
    mesh.name = id;
    group.add(mesh);
    strokes.push({ mesh, geom, points: pts, id, primitive });
  }

  // Center the normalized [0,1] glyph on the origin
  group.position.set(-0.5, -0.5, 0);
  return { group, strokes };
}
