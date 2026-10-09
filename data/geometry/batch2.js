/**
 * data/geometry/batch2.js — Phase 2, Batch 2 (symbols 11–20 of 40).
 * Egyptian ×3 (was, shen, scarab), Wicca/Pagan ×5, Christian ×2.
 * All coordinates normalized 0–1, y up.
 */
import { geom, line, polyline, circle, cubic, arc, mirrorV } from "./_helpers.js";

export const BATCH2 = {
  /* 11 ─ was scepter: shaft, angled beast head, forked foot */
  "was-scepter": geom({
    primitives: [
      line("shaft", 0.5, 0.1, 0.5, 0.72),
      polyline("head", [
        [0.5, 0.72], [0.56, 0.81], [0.66, 0.81], [0.68, 0.7], [0.6, 0.66],
      ]),
      line("fork-left", 0.5, 0.1, 0.42, 0.04),
      line("fork-right", 0.5, 0.1, 0.58, 0.04),
    ],
    strokeOrder: ["shaft", "head", "fork-left", "fork-right"],
    closed: false,
    symmetry: "none",
    anchor: [0.5, 0.42],
  }),

  /* 12 ─ shen ring: the loop of eternity with its base knot */
  "shen-ring": geom({
    primitives: [
      circle("loop", 0.5, 0.54, 0.27),
      line("knot", 0.4, 0.225, 0.6, 0.225),
      line("knot-tie", 0.46, 0.27, 0.54, 0.185),
    ],
    strokeOrder: ["loop", "knot", "knot-tie"],
    closed: "mixed",
    symmetry: "vertical",
    anchor: [0.5, 0.5],
    orientation: "rotatable",
  }),

  /* 13 ─ scarab: head dome, split elytra, six legs, pushed sun */
  scarab: (() => {
    const elytronLeft = cubic("elytron-left", 0.41, 0.64, 0.29, 0.54, 0.32, 0.28, 0.5, 0.18);
    const legFront = polyline("leg-front-left", [[0.4, 0.62], [0.26, 0.7], [0.2, 0.66]]);
    const legMid = polyline("leg-mid-left", [[0.36, 0.48], [0.22, 0.5], [0.16, 0.44]]);
    const legBack = polyline("leg-back-left", [[0.38, 0.32], [0.26, 0.24], [0.22, 0.16]]);
    return geom({
      primitives: [
        arc("head", 0.5, 0.72, 0.09, 20, 160),
        line("pronotum", 0.41, 0.66, 0.59, 0.66),
        elytronLeft,
        { ...mirrorV(elytronLeft), id: "elytron-right" },
        line("split", 0.5, 0.64, 0.5, 0.2),
        legFront, { ...mirrorV(legFront), id: "leg-front-right" },
        legMid, { ...mirrorV(legMid), id: "leg-mid-right" },
        legBack, { ...mirrorV(legBack), id: "leg-back-right" },
        circle("sun", 0.5, 0.89, 0.055),
      ],
      strokeOrder: [
        "head", "pronotum", "elytron-left", "elytron-right", "split",
        "leg-front-left", "leg-front-right", "leg-mid-left", "leg-mid-right",
        "leg-back-left", "leg-back-right", "sun",
      ],
      closed: "mixed",
      symmetry: "vertical",
      anchor: [0.5, 0.5],
    });
  })(),

  /* 14 ─ pentacle: one continuous pentagram stroke + circle.
        The inverted variant is the same glyph turned through 180°. */
  pentacle: geom({
    primitives: [
      polyline("star", [
        [0.5, 0.84], [0.3001, 0.2249], [0.8234, 0.6051],
        [0.1766, 0.6051], [0.6999, 0.2249], [0.5, 0.84],
      ]),
      circle("circle", 0.5, 0.5, 0.4),
    ],
    strokeOrder: ["star", "circle"],
    closed: true,
    symmetry: "rotational-5",
    anchor: [0.5, 0.5],
    orientation: "locked",
    variants: { inverted: { rotate: 180 } },
  }),

  /* 15 ─ triple moon: waxing, full, waning */
  "triple-moon": geom({
    primitives: [
      circle("waxing", 0.23, 0.5, 0.13),
      circle("full", 0.5, 0.5, 0.15),
      circle("waning", 0.77, 0.5, 0.13),
    ],
    strokeOrder: ["waxing", "full", "waning"],
    closed: true,
    symmetry: "vertical",
    anchor: [0.5, 0.5],
  }),

  /* 16 ─ hecate's wheel: rim, six spokes, the serpent through them */
  "hecates-wheel": geom({
    primitives: [
      circle("rim", 0.5, 0.5, 0.34),
      line("spoke-1", 0.16, 0.5, 0.84, 0.5),
      line("spoke-2", 0.33, 0.206, 0.67, 0.794),
      line("spoke-3", 0.33, 0.794, 0.67, 0.206),
      cubic("serpent", 0.32, 0.66, 0.62, 0.66, 0.38, 0.34, 0.66, 0.34),
    ],
    strokeOrder: ["rim", "spoke-1", "spoke-2", "spoke-3", "serpent"],
    closed: "mixed",
    symmetry: "none",
    anchor: [0.5, 0.5],
  }),

  /* 17 ─ horned god: horns, face arc, beard, shoulders, sun disc */
  "horned-god": (() => {
    const hornLeft = cubic("horn-left", 0.42, 0.62, 0.3, 0.7, 0.26, 0.82, 0.3, 0.9);
    return geom({
      primitives: [
        hornLeft,
        { ...mirrorV(hornLeft), id: "horn-right" },
        circle("sun", 0.5, 0.78, 0.07),
        arc("face", 0.5, 0.56, 0.12, 200, 340),
        polyline("beard", [[0.47, 0.45], [0.5, 0.36], [0.53, 0.45]]),
        cubic("shoulders", 0.3, 0.3, 0.4, 0.22, 0.6, 0.22, 0.7, 0.3),
      ],
      strokeOrder: ["horn-left", "horn-right", "sun", "face", "beard", "shoulders"],
      closed: "mixed",
      symmetry: "vertical",
      anchor: [0.5, 0.55],
    });
  })(),

  /* 18 ─ elemental triangles: fire, water, air, earth (barred) */
  "elemental-triangles": geom({
    primitives: [
      polyline("fire", [[0.3, 0.85], [0.17, 0.55], [0.43, 0.55], [0.3, 0.85]]),
      polyline("water", [[0.7, 0.55], [0.57, 0.85], [0.83, 0.85], [0.7, 0.55]]),
      polyline("air", [[0.3, 0.45], [0.17, 0.15], [0.43, 0.15], [0.3, 0.45]]),
      line("air-bar", 0.222, 0.27, 0.378, 0.27),
      polyline("earth", [[0.7, 0.15], [0.57, 0.45], [0.83, 0.45], [0.7, 0.15]]),
      line("earth-bar", 0.622, 0.33, 0.778, 0.33),
    ],
    strokeOrder: ["fire", "water", "air", "air-bar", "earth", "earth-bar"],
    closed: "mixed",
    symmetry: "none",
    anchor: [0.5, 0.5],
  }),

  /* 19 ─ latin cross: two weighty strokes, brushed wide */
  "latin-cross": geom({
    primitives: [
      line("vertical", 0.5, 0.9, 0.5, 0.08),
      line("horizontal", 0.26, 0.66, 0.74, 0.66),
    ],
    strokeOrder: ["vertical", "horizontal"],
    closed: false,
    symmetry: "vertical",
    anchor: [0.5, 0.4],
  }),

  /* 20 ─ chi-rho: rho shaft + bowl, chi overlaid */
  "chi-rho": geom({
    primitives: [
      line("rho-shaft", 0.5, 0.88, 0.5, 0.1),
      arc("rho-bowl", 0.5, 0.74, 0.13, -90, 90),
      line("chi-1", 0.34, 0.84, 0.66, 0.52),
      line("chi-2", 0.66, 0.84, 0.34, 0.52),
    ],
    strokeOrder: ["rho-shaft", "rho-bowl", "chi-1", "chi-2"],
    closed: false,
    symmetry: "none",
    anchor: [0.5, 0.5],
  }),
};
