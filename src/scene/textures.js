/**
 * src/scene/textures.js — procedural, canvas-generated textures (spec §2:
 * no external image assets; everything drawn in code).
 *
 * The factory takes an injectable `document` so headless tests can run the
 * exact same drawing logic against a recording stub canvas (Node has no
 * 2D canvas). Visual truth is verified on /altar.html; determinism and
 * structure are verified by scripts/test-scene.mjs.
 *
 * All textures are seeded (mulberry32 + fnv1a of a stable id) so the room
 * looks the same on every visit — the altar is a place, not a slot machine.
 */

import * as THREE from "three";

/** fnv1a string hash → 32-bit seed. */
export function seedFromId(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, deterministic PRNG. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {{document?: Document}} [ctx] injectable document (tests pass a stub)
 * @returns {{wood, plaster, cloth, windowGlow, dustSprite, list}}
 */
export function createTextureFactory({ document: docRef = globalThis.document } = {}) {
  if (!docRef) throw new Error("createTextureFactory needs a document (or a stub)");

  /** @type {{name:string,size:number,seed:number}[]} */
  const list = [];

  function canvas2d(size) {
    const cv = docRef.createElement("canvas");
    cv.width = size;
    cv.height = size;
    return { cv, ctx: cv.getContext("2d") };
  }

  function finish(cv, name, seed, { repeat = null, srgb = true } = {}) {
    const tex = new THREE.CanvasTexture(cv);
    tex.name = name;
    tex.userData = { seed, name, size: cv.width };
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    if (repeat) tex.repeat.set(repeat[0], repeat[1]);
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    list.push({ name, size: cv.width, seed });
    return tex;
  }

  /** Soft radial blotch, the workhorse of mottling. */
  function blotch(ctx, x, y, r, rgba) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  /** Random speckle pass for tooth/grain. */
  function speckle(ctx, rng, size, count, dark, light) {
    for (let i = 0; i < count; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const s = 1 + rng() * 1.6;
      ctx.fillStyle = rng() < 0.5 ? dark : light;
      ctx.fillRect(x, y, s, s);
    }
  }

  /* ---- oak: floorboards & furniture ------------------------------- */
  function wood({ size = 512, plankCount = 6, seed = seedFromId("oak"), base = "#8a6b45" } = {}) {
    const { cv, ctx } = canvas2d(size);
    const rng = mulberry32(seed);

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    const plankH = size / plankCount;
    for (let p = 0; p < plankCount; p++) {
      const y0 = p * plankH;
      // per-plank tone drift
      const tone = (rng() - 0.5) * 0.16;
      ctx.fillStyle = tone > 0 ? `rgba(255,238,205,${tone})` : `rgba(30,18,8,${-tone})`;
      ctx.fillRect(0, y0, size, plankH);

      // grain: long wavy strokes
      const grains = 10 + Math.floor(rng() * 6);
      for (let g = 0; g < grains; g++) {
        const gy = y0 + rng() * plankH;
        ctx.strokeStyle = `rgba(52,34,16,${0.05 + rng() * 0.07})`;
        ctx.lineWidth = 0.8 + rng() * 1.1;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        let x = 0;
        let y = gy;
        while (x < size) {
          const nx = x + 40 + rng() * 60;
          const ny = Math.max(y0 + 2, Math.min(y0 + plankH - 2, y + (rng() - 0.5) * 6));
          ctx.quadraticCurveTo(x + (nx - x) / 2, y, nx, ny);
          x = nx;
          y = ny;
        }
        ctx.stroke();
      }

      // knots (0–2)
      const knots = Math.floor(rng() * 2.4);
      for (let k = 0; k < knots; k++) {
        const kx = rng() * size;
        const ky = y0 + plankH * (0.3 + rng() * 0.4);
        blotch(ctx, kx, ky, 9 + rng() * 10, "rgba(40,24,10,0.5)");
        blotch(ctx, kx, ky, 3 + rng() * 3, "rgba(24,14,5,0.65)");
      }

      // plank gap
      ctx.fillStyle = "rgba(18,11,5,0.55)";
      ctx.fillRect(0, y0, size, 2);
    }

    speckle(ctx, rng, size, 1400, "rgba(20,12,5,0.05)", "rgba(255,240,210,0.05)");
    return finish(cv, "oak", seed);
  }

  /* ---- plaster: walls --------------------------------------------- */
  function plaster({ size = 512, seed = seedFromId("plaster"), base = "#e6dfcb" } = {}) {
    const { cv, ctx } = canvas2d(size);
    const rng = mulberry32(seed);

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    // broad tonal mottling
    for (let i = 0; i < 46; i++) {
      const warm = rng() < 0.5;
      blotch(
        ctx,
        rng() * size,
        rng() * size,
        40 + rng() * 110,
        warm ? "rgba(196,176,132,0.05)" : "rgba(255,252,240,0.06)",
      );
    }
    // faint trowel streaks
    for (let i = 0; i < 34; i++) {
      const x = rng() * size;
      ctx.strokeStyle = `rgba(120,105,75,${0.02 + rng() * 0.03})`;
      ctx.lineWidth = 6 + rng() * 18;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (rng() - 0.5) * 60, size);
      ctx.stroke();
    }

    speckle(ctx, rng, size, 1900, "rgba(90,80,60,0.04)", "rgba(255,255,246,0.05)");
    return finish(cv, "plaster", seed);
  }

  /* ---- linen: altar cloth & rug ------------------------------------ */
  function cloth({ size = 512, seed = seedFromId("linen"), base = "#f0e8d4" } = {}) {
    const { cv, ctx } = canvas2d(size);
    const rng = mulberry32(seed);

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    // weave: two crossing thread families
    const step = 4;
    for (let y = 0; y < size; y += step) {
      ctx.fillStyle = `rgba(17,17,17,${0.03 + rng() * 0.025})`;
      ctx.fillRect(0, y, size, 1);
    }
    for (let x = 0; x < size; x += step) {
      ctx.fillStyle = `rgba(255,255,248,${0.03 + rng() * 0.03})`;
      ctx.fillRect(x, 0, 1, size);
    }
    // gentle laundering shade
    blotch(ctx, size * 0.3, size * 0.4, size * 0.5, "rgba(160,140,100,0.05)");
    blotch(ctx, size * 0.7, size * 0.6, size * 0.45, "rgba(255,252,240,0.06)");

    speckle(ctx, rng, size, 900, "rgba(90,80,60,0.03)", "rgba(255,255,248,0.04)");
    return finish(cv, "linen", seed);
  }

  /* ---- window: sky gradient + mullions (emissive plane) ------------- */
  function windowGlow({ w = 256, h = 384, seed = seedFromId("window") } = {}) {
    const { cv, ctx } = canvas2d(h); // square backing; aspect handled by plane
    cv.height = h;
    cv.width = w;
    const rng = mulberry32(seed);

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#e9f0ef");
    g.addColorStop(0.55, "#f3ead6");
    g.addColorStop(1, "#efe3c8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // sky interest: a couple of pale cloud blotches
    for (let i = 0; i < 5; i++) {
      blotch(ctx, rng() * w, rng() * h * 0.5, 30 + rng() * 50, "rgba(255,255,255,0.20)");
    }
    // mullions: one vertical, one horizontal bar
    ctx.fillStyle = "rgba(40,30,18,0.85)";
    ctx.fillRect(w / 2 - 3, 0, 6, h);
    ctx.fillRect(0, h * 0.62, w, 6);
    // slight inner vignette for glass depth
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(40,30,15,0.18)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    const tex = finish(cv, "window-glow", seed, { srgb: true });
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  /* ---- dust mote sprite (PointsMaterial map) ------------------------ */
  function dustSprite({ size = 64, seed = seedFromId("dust") } = {}) {
    const { cv, ctx } = canvas2d(size);
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,248,230,0.95)");
    g.addColorStop(0.4, "rgba(255,244,220,0.35)");
    g.addColorStop(1, "rgba(255,244,220,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = finish(cv, "dust-sprite", seed, { srgb: false });
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  return { wood, plaster, cloth, windowGlow, dustSprite, list };
}
