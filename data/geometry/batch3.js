/**
 * data/geometry/batch3.js — Phase 2, Batch 3 (symbols 21–30 of 40).
 * Christian ×2 (ichthys, scutum), Jewish ×3, Islamic ×3, Hindu ×2 (om, sri-yantra).
 * All coordinates normalized 0–1, y up.
 */
import { geom, line, polyline, circle, cubic, arc } from "./_helpers.js";

/** Closed equilateral-ish triangle from apex + base. */
function tri(id, ax, ay, bx1, bx2, by) {
  return polyline(id, [[ax, ay], [bx1, by], [bx2, by], [ax, ay]]);
}

export const BATCH3 = {
  /* 21 ─ ichthys: two arcs crossing at the tail */
  ichthys: geom({
    primitives: [
      cubic("arc-upper", 0.1, 0.5, 0.28, 0.76, 0.58, 0.76, 0.9, 0.4),
      cubic("arc-lower", 0.1, 0.5, 0.28, 0.24, 0.58, 0.24, 0.9, 0.6),
    ],
    strokeOrder: ["arc-upper", "arc-lower"],
    closed: false,
    symmetry: "horizontal",
    anchor: [0.5, 0.5],
  }),

  /* 22 ─ shield of the trinity: three persons, one God, six links */
  "shield-of-the-trinity": geom({
    primitives: [
      circle("father", 0.5, 0.79, 0.1),
      circle("son", 0.266, 0.385, 0.1),
      circle("spirit", 0.734, 0.385, 0.1),
      line("link-fs", 0.5, 0.79, 0.266, 0.385),
      line("link-sf", 0.266, 0.385, 0.734, 0.385),
      line("link-hf", 0.734, 0.385, 0.5, 0.79),
      circle("deus", 0.5, 0.52, 0.09),
      line("link-fd", 0.5, 0.79, 0.5, 0.52),
      line("link-sd", 0.266, 0.385, 0.5, 0.52),
      line("link-hd", 0.734, 0.385, 0.5, 0.52),
    ],
    strokeOrder: ["father", "son", "spirit", "link-fs", "link-sf", "link-hf", "deus", "link-fd", "link-sd", "link-hd"],
    closed: "mixed",
    symmetry: "vertical",
    anchor: [0.5, 0.5],
  }),

  /* 23 ─ star of david: two interlocked triangles */
  "star-of-david": geom({
    primitives: [
      tri("triangle-up", 0.5, 0.86, 0.188, 0.812, 0.32),
      tri("triangle-down", 0.5, 0.14, 0.188, 0.812, 0.68),
    ],
    strokeOrder: ["triangle-up", "triangle-down"],
    closed: true,
    symmetry: "rotational-6",
    anchor: [0.5, 0.5],
    orientation: "rotatable",
  }),

  /* 24 ─ menorah: shaft, three U-arms, seven branches, flames, base */
  menorah: (() => {
    const ys = 0.54;
    const arms = [0.12, 0.24, 0.36].map((r, i) => arc(`arm-${i + 1}`, 0.5, ys, r, 180, 360));
    const uprights = [0.12, 0.24, 0.36].flatMap((r, i) => [
      line(`up-left-${i + 1}`, 0.5 - r, ys, 0.5 - r, 0.8),
      line(`up-right-${i + 1}`, 0.5 + r, ys, 0.5 + r, 0.8),
    ]);
    const flames = [0, 0.12, 0.24, 0.36].flatMap((r, i) => [
      line(`flame-${i}-l`, 0.5 - r, 0.8, 0.5 - r, 0.86),
      ...(r ? [line(`flame-${i}-r`, 0.5 + r, 0.8, 0.5 + r, 0.86)] : []),
    ]);
    return geom({
      primitives: [
        line("shaft", 0.5, 0.14, 0.5, 0.8),
        ...arms,
        ...uprights,
        polyline("base", [[0.38, 0.14], [0.5, 0.08], [0.62, 0.14]]),
        ...flames,
      ],
      strokeOrder: [
        "shaft", "arm-1", "arm-2", "arm-3",
        ...uprights.map((u) => u.id),
        "base",
        ...flames.map((f) => f.id),
      ],
      closed: false,
      symmetry: "vertical",
      anchor: [0.5, 0.42],
    });
  })(),

  /* 25 ─ chai: חַי in brush strokes, read right to left */
  chai: geom({
    primitives: [
      polyline("chet", [[0.74, 0.3], [0.74, 0.7], [0.56, 0.7], [0.56, 0.3]]),
      line("yud", 0.42, 0.7, 0.42, 0.56),
    ],
    strokeOrder: ["chet", "yud"],
    closed: false,
    symmetry: "none",
    anchor: [0.5, 0.5],
  }),

  /* 26 ─ rub el hizb: two overlapping squares + center */
  "rub-el-hizb": geom({
    primitives: [
      polyline("square", [[0.24, 0.24], [0.76, 0.24], [0.76, 0.76], [0.24, 0.76], [0.24, 0.24]]),
      polyline("diamond", [[0.5, 0.14], [0.86, 0.5], [0.5, 0.86], [0.14, 0.5], [0.5, 0.14]]),
      circle("center", 0.5, 0.5, 0.07),
    ],
    strokeOrder: ["square", "diamond", "center"],
    closed: true,
    symmetry: "rotational-4",
    anchor: [0.5, 0.5],
    orientation: "rotatable",
  }),

  /* 27 ─ crescent and star: lune from two circle arcs + five-point star */
  "crescent-and-star": geom({
    primitives: [
      arc("crescent-outer", 0.44, 0.5, 0.3, 78.5, 281.5),
      arc("crescent-inner", 0.56, 0.5, 0.3, 258.5, 461.5),
      polyline("star", [
        [0.62, 0.59], [0.567, 0.427], [0.706, 0.528],
        [0.534, 0.528], [0.673, 0.427], [0.62, 0.59],
      ]),
    ],
    strokeOrder: ["crescent-outer", "crescent-inner", "star"],
    closed: "mixed",
    symmetry: "none",
    anchor: [0.5, 0.5],
  }),

  /* 28 ─ khatam: two congruent squares at 45° + rosette */
  khatam: geom({
    primitives: [
      polyline("square", [[0.26, 0.26], [0.74, 0.26], [0.74, 0.74], [0.26, 0.74], [0.26, 0.26]]),
      polyline("diamond", [[0.5, 0.16], [0.84, 0.5], [0.5, 0.84], [0.16, 0.5], [0.5, 0.16]]),
      circle("rosette", 0.5, 0.5, 0.09),
    ],
    strokeOrder: ["square", "diamond", "rosette"],
    closed: true,
    symmetry: "rotational-8",
    anchor: [0.5, 0.5],
    orientation: "rotatable",
  }),

  /* 29 ─ om: the syllable ॐ — body bowls, sweeping tail, crescent, bindu */
  om: geom({
    primitives: [
      cubic("hook-upper", 0.58, 0.68, 0.46, 0.78, 0.32, 0.74, 0.33, 0.63),
      cubic("waist", 0.33, 0.63, 0.34, 0.55, 0.44, 0.54, 0.52, 0.58),
      cubic("bowl-lower", 0.52, 0.58, 0.63, 0.62, 0.63, 0.44, 0.48, 0.42),
      cubic("tail", 0.48, 0.42, 0.56, 0.33, 0.68, 0.3, 0.78, 0.2),
      arc("crescent", 0.52, 0.84, 0.1, 200, 340),
      circle("bindu", 0.52, 0.95, 0.02),
    ],
    strokeOrder: ["hook-upper", "waist", "bowl-lower", "tail", "crescent", "bindu"],
    closed: "mixed",
    symmetry: "none",
    anchor: [0.5, 0.55],
  }),

  /* 30 ─ sri yantra (simplified nine-triangle interlock): gates, lotus,
        five down-pointing + four up-pointing triangles, bindu */
  "sri-yantra": geom({
    primitives: [
      polyline("gate", [[0.08, 0.08], [0.92, 0.08], [0.92, 0.92], [0.08, 0.92], [0.08, 0.08]]),
      circle("lotus-outer", 0.5, 0.5, 0.34),
      circle("lotus-inner", 0.5, 0.5, 0.3),
      tri("down-1", 0.5, 0.16, 0.2, 0.8, 0.78),
      tri("up-1", 0.5, 0.84, 0.22, 0.78, 0.24),
      tri("down-2", 0.5, 0.26, 0.26, 0.74, 0.7),
      tri("up-2", 0.5, 0.76, 0.28, 0.72, 0.32),
      tri("down-3", 0.5, 0.34, 0.32, 0.68, 0.64),
      tri("up-3", 0.5, 0.68, 0.35, 0.65, 0.4),
      tri("down-4", 0.5, 0.42, 0.39, 0.61, 0.58),
      tri("down-5", 0.5, 0.48, 0.45, 0.55, 0.54),
      circle("bindu", 0.5, 0.5, 0.015),
    ],
    strokeOrder: [
      "gate", "lotus-outer", "lotus-inner",
      "down-1", "up-1", "down-2", "up-2", "down-3", "up-3", "down-4", "down-5",
      "bindu",
    ],
    closed: true,
    symmetry: "vertical",
    anchor: [0.5, 0.5],
  }),
};
