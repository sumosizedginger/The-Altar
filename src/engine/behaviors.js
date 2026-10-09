/**
 * src/engine/behaviors.js
 * Symbols & Sigils — Phase 2. The SIX reusable animation behaviors
 * (spec §3). Symbols select one via animationType and pass parameters;
 * nothing here is symbol-specific except through named stroke ids that
 * the geometry data itself declares ("pupil", loop strokes, …).
 *
 * Behavior protocol:
 *   init(instance)                 — optional setup
 *   update(instance, dt, ctx)      — ctx: {pointer, reducedMotion, time}
 *
 * Reveal progress lives on instance.t (0→1 over instance.duration);
 * behaviors layer motion on top. Reduced motion: everything renders its
 * final frame and behaviors freeze (spec §6/§7).
 */
import * as THREE from "three";
import { revealCount } from "./builder.js";

/* ---- shared helpers ------------------------------------------------ */

function strokeLengths(strokes) {
  return strokes.map((s) => {
    let L = 0;
    for (let i = 1; i < s.points.length; i++)
      L += Math.hypot(s.points[i][0] - s.points[i - 1][0], s.points[i][1] - s.points[i - 1][1]);
    return Math.max(L, 1e-6);
  });
}

/** Map global reveal t∈[0,1] to per-stroke local progress (sequential). */
export function strokeProgresses(strokes, t, lengths) {
  const lens = lengths ?? strokeLengths(strokes);
  const total = lens.reduce((a, b) => a + b, 0);
  const out = [];
  let acc = 0;
  const target = t * total;
  for (const L of lens) {
    const local = Math.min(1, Math.max(0, (target - acc) / L));
    out.push(local);
    acc += L;
  }
  return out;
}

function applyReveal(strokes, progresses) {
  strokes.forEach((s, i) => {
    s.geom.setDrawRange(0, revealCount(s.geom, progresses[i]));
    s.mesh.visible = progresses[i] > 0;
  });
}

/* ---- 1. single-stroke draw (calligraphic reveal) ------------------- */
const draw = {
  update(inst, dt, ctx) {
    const p = strokeProgresses(inst.strokes, inst.t, inst.lengths);
    applyReveal(inst.strokes, p);
    if (ctx.reducedMotion) return;
    // faint ember pulse once fully drawn
    if (inst.t >= 1) {
      const m = inst.strokes[0]?.mesh.material;
      if (m && m.emissiveIntensity !== undefined)
        m.emissiveIntensity = 0.5 + 0.14 * Math.sin(ctx.time * 1.7);
    }
  },
};

/* ---- 2. weave / over-under build ----------------------------------- */
const weave = {
  init(inst) {
    inst.weaveAmp = inst.params.weaveAmp ?? 0.028;
  },
  update(inst, dt, ctx) {
    const p = strokeProgresses(inst.strokes, inst.t, inst.lengths);
    applyReveal(inst.strokes, p);
    inst.strokes.forEach((s, i) => {
      const local = p[i];
      const active = local > 0 && local < 1;
      // the working strand rides above/below alternating, then settles
      const side = i % 2 === 0 ? 1 : -1;
      s.mesh.position.z = active && !ctx.reducedMotion
        ? side * inst.weaveAmp * Math.sin(local * Math.PI)
        : 0;
    });
    if (ctx.reducedMotion) inst.strokes.forEach((s) => (s.mesh.position.z = 0));
  },
};

/* ---- 3. eye: cursor tracking + blink -------------------------------- */
const eye = {
  init(inst) {
    const pupilStroke = inst.strokes.find((s) => s.id === "pupil") || null;
    inst.pupilMesh = pupilStroke ? pupilStroke.mesh : null;
    inst.pupilHome = inst.pupilMesh ? inst.pupilMesh.position.clone() : null;
    inst.blinkTimer = 3 + Math.random() * 5;
    inst.blinkPhase = 0; // 0 idle, >0 blinking
  },
  update(inst, dt, ctx) {
    const p = strokeProgresses(inst.strokes, Math.min(1, inst.t * 1.6), inst.lengths);
    applyReveal(inst.strokes, p);
    if (inst.t < 1 || ctx.reducedMotion) return;

    // subtle tracking toward the pointer (in glyph space, clamped)
    if (inst.pupilMesh && ctx.pointer) {
      const k = 0.028;
      inst.pupilMesh.position.x = inst.pupilHome.x + THREE.MathUtils.clamp(ctx.pointer.x, -1, 1) * k;
      inst.pupilMesh.position.y = inst.pupilHome.y + THREE.MathUtils.clamp(ctx.pointer.y, -1, 1) * k * 0.7;
    }
    // blink: brief vertical squash of the whole glyph
    inst.blinkTimer -= dt;
    if (inst.blinkTimer <= 0 && inst.blinkPhase === 0) {
      inst.blinkPhase = 1e-4;
      inst.blinkTimer = 6 + Math.random() * 8;
    }
    if (inst.blinkPhase > 0) {
      inst.blinkPhase += dt / 0.22; // 220 ms blink
      const b = Math.sin(Math.min(1, inst.blinkPhase) * Math.PI);
      inst.group.scale.y = 1 - b * 0.82;
      if (inst.blinkPhase >= 1) {
        inst.blinkPhase = 0;
        inst.group.scale.y = 1;
      }
    }
  },
};

/* ---- 4. phase math (moon cycles, taijitu) --------------------------- */
const phase = {
  init(inst) {
    // per-stroke materials so strokes can glow independently
    inst.strokes.forEach((s) => {
      s.mesh.material = s.mesh.material.clone();
    });
  },
  update(inst, dt, ctx) {
    const p = strokeProgresses(inst.strokes, inst.t, inst.lengths);
    applyReveal(inst.strokes, p);
    if (inst.t < 1 || ctx.reducedMotion) return;
    const mode = inst.params.mode ?? "rotate";
    if (mode === "taiji-wax-wane") {
      // the diagram turns; the two eyes breathe in opposition
      inst.group.rotation.z = ctx.time * 0.22;
      inst.strokes.forEach((s, i) => {
        s.mesh.material.emissiveIntensity = 0.5 + 0.25 * Math.sin(ctx.time * 1.3 + i * 1.7);
      });
    } else if (mode === "lunar-cycle") {
      // waxing → full → waning glow passes across the three bodies
      const period = inst.params.periodSec ?? 24;
      const ph = (ctx.time % period) / period;
      inst.strokes.forEach((s, i) => {
        const local = (ph * 3 - i + 3) % 3;
        const glow = Math.max(0, 1 - local * 2.2);
        s.mesh.material.emissiveIntensity = 0.45 + glow * 1.5;
      });
    }
  },
};

/* ---- 5. particle smoke / rotating loop ------------------------------ */
const particles = {
  init(inst) {
    // the loop is the first closed stroke (or params.loopStroke)
    const loop =
      inst.strokes.find((s) => s.id === inst.params.loopStroke) ||
      inst.strokes.find((s) => {
        const a = s.points[0], b = s.points[s.points.length - 1];
        return Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.03;
      }) ||
      inst.strokes[0];
    inst.loopPoints = loop ? loop.points : [[0.5, 0.5]];
    const count = Math.min(64, Math.max(8, inst.params.particles ?? 24));
    inst.particles = [];
    const ghost = Math.max(1, Math.round((inst.params.trail ?? 0.3) * 5));
    inst.ghost = ghost;
    const total = count * ghost;
    const pos = new Float32Array(total * 3);
    inst.pointsGeo = new THREE.BufferGeometry();
    inst.pointsGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xe8c880,
      size: 0.012,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    inst.points = new THREE.Points(inst.pointsGeo, mat);
    inst.group.add(inst.points);
    for (let i = 0; i < count; i++) inst.particles.push(Math.random());
  },
  update(inst, dt, ctx) {
    const p = strokeProgresses(inst.strokes, inst.t, inst.lengths);
    applyReveal(inst.strokes, p);
    if (inst.t < 1) return;
    const pts = inst.loopPoints;
    const speed = (inst.params.rpm ?? 4) / 60; // loops per second
    const pos = inst.pointsGeo.attributes.position.array;
    let w = 0;
    for (let i = 0; i < inst.particles.length; i++) {
      inst.particles[i] = ctx.reducedMotion ? i / inst.particles.length : (inst.particles[i] + speed * dt) % 1;
      for (let g = 0; g < inst.ghost; g++) {
        const back = ctx.reducedMotion ? 0 : (g * 0.008) % 1;
        let u = inst.particles[i] - back;
        if (u < 0) u += 1;
        const f = u * (pts.length - 1);
        const k = Math.floor(f), fr = f - k;
        const a = pts[k], b = pts[Math.min(pts.length - 1, k + 1)];
        pos[w++] = a[0] + (b[0] - a[0]) * fr;
        pos[w++] = a[1] + (b[1] - a[1]) * fr;
        pos[w++] = 0.015 + 0.01 * Math.sin((i + g) * 2.1);
      }
    }
    inst.pointsGeo.attributes.position.needsUpdate = true;
  },
};

/* ---- 6. brush pressure (calligraphic thick/thin) -------------------- */
const brush = {
  init(inst) {
    inst.flash = new Map();
  },
  update(inst, dt, ctx) {
    // eased advance: the brush slows into curves
    const p = strokeProgresses(inst.strokes, inst.t, inst.lengths);
    applyReveal(inst.strokes, p);
    if (ctx.reducedMotion) return;
    p.forEach((local, i) => {
      const s = inst.strokes[i];
      if (local >= 1 && !inst.flash.has(s.id)) {
        inst.flash.set(s.id, 0.5); // seconds of fresh-ink glow
      }
      const f = inst.flash.get(s.id);
      if (f !== undefined) {
        const mat = s.mesh.material;
        mat.emissiveIntensity = 0.55 + f * 2.2;
        inst.flash.set(s.id, Math.max(0, f - dt));
      }
    });
  },
};

export const BEHAVIORS = { draw, weave, eye, phase, particles, brush };
