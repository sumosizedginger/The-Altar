/**
 * data/geometry/batch4.js — Phase 2, Batch 4 (symbols 31–40 of 40).
 * Hindu ×2 (swastika, trishula), Buddhist ×4, Taoist ×2, LHP ×2.
 * All coordinates normalized 0–1, y up.
 */
import { geom, line, polyline, circle, cubic, arc, polar } from "./_helpers.js";

export const BATCH4 = {
  /* 31 ─ swastika: right-facing, level, arms bent clockwise, four dots.
        (Data entry explicitly distinguishes it from the tilted Hakenkreuz.) */
  swastika: geom({
    primitives: [
      line("arm-h", 0.2, 0.5, 0.8, 0.5),
      line("arm-v", 0.5, 0.2, 0.5, 0.8),
      line("hook-n", 0.5, 0.8, 0.66, 0.8),
      line("hook-e", 0.8, 0.5, 0.8, 0.34),
      line("hook-s", 0.5, 0.2, 0.34, 0.2),
      line("hook-w", 0.2, 0.5, 0.2, 0.66),
      circle("dot-ne", 0.67, 0.67, 0.015),
      circle("dot-se", 0.67, 0.33, 0.015),
      circle("dot-sw", 0.33, 0.33, 0.015),
      circle("dot-nw", 0.33, 0.67, 0.015),
    ],
    strokeOrder: ["arm-h", "arm-v", "hook-n", "hook-e", "hook-s", "hook-w", "dot-ne", "dot-se", "dot-sw", "dot-nw"],
    closed: "mixed",
    symmetry: "rotational-4",
    anchor: [0.5, 0.5],
    orientation: "locked",
  }),

  /* 32 ─ trishula: shaft, cross-guard, three prongs */
  trishula: geom({
    primitives: [
      line("shaft", 0.5, 0.1, 0.5, 0.52),
      line("guard", 0.4, 0.52, 0.6, 0.52),
      line("prong-center", 0.5, 0.52, 0.5, 0.9),
      cubic("prong-left", 0.5, 0.52, 0.42, 0.6, 0.34, 0.68, 0.34, 0.8),
      cubic("prong-right", 0.5, 0.52, 0.58, 0.6, 0.66, 0.68, 0.66, 0.8),
    ],
    strokeOrder: ["shaft", "guard", "prong-center", "prong-left", "prong-right"],
    closed: false,
    symmetry: "vertical",
    anchor: [0.5, 0.45],
  }),

  /* 33 ─ dharma wheel: rim, hub, eight spokes */
  "dharma-wheel": (() => {
    const spokes = Array.from({ length: 8 }, (_, k) => {
      const a = (k * 45 * Math.PI) / 180;
      return line(`spoke-${k + 1}`,
        0.5 + 0.08 * Math.cos(a), 0.5 + 0.08 * Math.sin(a),
        0.5 + 0.34 * Math.cos(a), 0.5 + 0.34 * Math.sin(a));
    });
    return geom({
      primitives: [circle("rim", 0.5, 0.5, 0.34), circle("hub", 0.5, 0.5, 0.08), ...spokes],
      strokeOrder: ["rim", "hub", ...spokes.map((s) => s.id)],
      closed: "mixed",
      symmetry: "rotational-8",
      anchor: [0.5, 0.5],
      orientation: "rotatable",
    });
  })(),

  /* 34 ─ endless knot: two interlaced square-spiral strands */
  "endless-knot": (() => {
    const A = [
      [0.5, 0.5], [0.5, 0.6], [0.4, 0.6], [0.4, 0.4], [0.6, 0.4],
      [0.6, 0.68], [0.32, 0.68], [0.32, 0.32], [0.68, 0.32], [0.68, 0.74],
    ];
    const B = A.map(([x, y]) => [1 - x, 1 - y]);
    return geom({
      primitives: [polyline("strand-a", A), polyline("strand-b", B)],
      strokeOrder: ["strand-a", "strand-b"],
      closed: false,
      symmetry: "rotational-2",
      anchor: [0.5, 0.5],
    });
  })(),

  /* 35 ─ lotus: center petal, inner pair, outer pair, base leaves */
  lotus: (() => {
    const flankL = cubic("petal-c-left", 0.5, 0.34, 0.44, 0.44, 0.44, 0.6, 0.5, 0.7);
    const flankR = cubic("petal-c-right", 0.5, 0.34, 0.56, 0.44, 0.56, 0.6, 0.5, 0.7);
    const innerL = cubic("petal-l", 0.47, 0.36, 0.34, 0.44, 0.3, 0.56, 0.36, 0.64);
    const innerR = cubic("petal-r", 0.53, 0.36, 0.66, 0.44, 0.7, 0.56, 0.64, 0.64);
    const outerL = cubic("petal-ll", 0.42, 0.34, 0.26, 0.38, 0.2, 0.48, 0.24, 0.56);
    const outerR = cubic("petal-rr", 0.58, 0.34, 0.74, 0.38, 0.8, 0.48, 0.76, 0.56);
    return geom({
      primitives: [
        flankL, flankR, innerL, innerR, outerL, outerR,
        cubic("leaf-left", 0.48, 0.3, 0.36, 0.24, 0.26, 0.26, 0.2, 0.32),
        cubic("leaf-right", 0.52, 0.3, 0.64, 0.24, 0.74, 0.26, 0.8, 0.32),
      ],
      strokeOrder: [
        "petal-c-left", "petal-c-right", "petal-l", "petal-r",
        "petal-ll", "petal-rr", "leaf-left", "leaf-right",
      ],
      closed: false,
      symmetry: "vertical",
      anchor: [0.5, 0.45],
    });
  })(),

  /* 36 ─ unalome: base spiral, zigzag ascent, straightening, the point */
  unalome: geom({
    primitives: [
      polar("spiral-base", 0.5, 0.18, "0.015+0.085*t", 270, -180),
      polyline("zigzag", [
        [0.5, 0.26], [0.41, 0.34], [0.59, 0.44], [0.41, 0.54], [0.59, 0.64], [0.5, 0.72],
      ]),
      line("straighten", 0.5, 0.72, 0.5, 0.84),
      circle("point", 0.5, 0.9, 0.02),
    ],
    strokeOrder: ["spiral-base", "zigzag", "straighten", "point"],
    closed: "mixed",
    symmetry: "none",
    anchor: [0.5, 0.5],
  }),

  /* 37 ─ taijitu: circle, S-divider of two semicircles, two eyes */
  taijitu: geom({
    primitives: [
      circle("circle", 0.5, 0.5, 0.36),
      arc("s-upper", 0.5, 0.68, 0.18, 90, 270),
      arc("s-lower", 0.5, 0.32, 0.18, -90, 90),
      circle("eye-light", 0.5, 0.68, 0.045),
      circle("eye-dark", 0.5, 0.32, 0.045),
    ],
    strokeOrder: ["circle", "s-upper", "s-lower", "eye-light", "eye-dark"],
    closed: true,
    symmetry: "rotational-2",
    anchor: [0.5, 0.5],
    orientation: "rotatable",
  }),

  /* 38 ─ bagua: taijitu center + eight trigrams, Later Heaven order
        (Li at top, then clockwise: Kun, Dui, Qian, Kan, Gen, Zhen, Xun).
        Trigram lines read bottom→top; solid = one stroke, broken = two. */
  bagua: (() => {
    const order = {
      Li: [1, 0, 1], Kun: [0, 0, 0], Dui: [1, 1, 0], Qian: [1, 1, 1],
      Kan: [0, 1, 0], Gen: [0, 0, 1], Zhen: [1, 0, 0], Xun: [0, 1, 1],
    };
    const trigrams = [];
    Object.entries(order).forEach(([name, bits], k) => {
      const theta = Math.PI / 2 - (k * Math.PI) / 4; // top, clockwise
      const ux = Math.cos(theta), uy = Math.sin(theta);
      const tx = -uy, ty = ux; // tangent (perpendicular)
      bits.forEach((solid, j) => {
        const d = 0.28 + j * 0.045; // line distance from center
        const cx = 0.5 + d * ux, cy = 0.5 + d * uy;
        const half = 0.055;
        if (solid) {
          trigrams.push(line(`${name}-${j}`, cx - half * tx, cy - half * ty, cx + half * tx, cy + half * ty));
        } else {
          const gap = 0.016;
          trigrams.push(line(`${name}-${j}-a`, cx - half * tx, cy - half * ty, cx - gap * tx, cy - gap * ty));
          trigrams.push(line(`${name}-${j}-b`, cx + gap * tx, cy + gap * ty, cx + half * tx, cy + half * ty));
        }
      });
    });
    return geom({
      primitives: [
        circle("taiji", 0.5, 0.5, 0.14),
        arc("taiji-s-1", 0.5, 0.57, 0.07, 90, 270),
        arc("taiji-s-2", 0.5, 0.43, 0.07, -90, 90),
        ...trigrams,
      ],
      strokeOrder: ["taiji", "taiji-s-1", "taiji-s-2", ...trigrams.map((t) => t.id)],
      closed: "mixed",
      symmetry: "none",
      anchor: [0.5, 0.5],
      orientation: "locked",
    });
  })(),

  /* 39 ─ sigil of baphomet: inverted pentagram, ring band, goat head */
  "sigil-of-baphomet": (() => {
    // pentagram apex-DOWN: vertices at 270° + k*144°
    const pts = Array.from({ length: 6 }, (_, k) => {
      const a = ((270 + (k % 5) * 144) * Math.PI) / 180;
      return [0.5 + 0.34 * Math.cos(a), 0.5 + 0.34 * Math.sin(a)];
    });
    const hornL = cubic("horn-left", 0.44, 0.52, 0.36, 0.6, 0.34, 0.68, 0.38, 0.74);
    return geom({
      primitives: [
        polyline("star", pts),
        circle("ring-outer", 0.5, 0.5, 0.42),
        circle("ring-inner", 0.5, 0.5, 0.38),
        hornL,
        { ...hornL, id: "horn-right",
          type: "cubic", x1: 0.56, y1: 0.52, cx1: 0.64, cy1: 0.6, cx2: 0.66, cy2: 0.68, x2: 0.62, y2: 0.74 },
        cubic("head", 0.44, 0.52, 0.44, 0.4, 0.56, 0.4, 0.56, 0.52),
        polyline("beard", [[0.48, 0.42], [0.5, 0.34], [0.52, 0.42]]),
      ],
      strokeOrder: ["star", "ring-outer", "ring-inner", "horn-left", "horn-right", "head", "beard"],
      closed: "mixed",
      symmetry: "vertical",
      anchor: [0.5, 0.5],
      orientation: "locked",
    });
  })(),

  /* 40 ─ leviathan cross: the loop above the cross (alchemical sulfur) */
  "leviathan-cross": geom({
    primitives: [
      arc("loop-left", 0.4, 0.66, 0.115, 60, 300),
      arc("loop-right", 0.6, 0.66, 0.115, 120, -120),
      line("cross-vertical", 0.5, 0.42, 0.5, 0.12),
      line("cross-horizontal", 0.38, 0.28, 0.62, 0.28),
    ],
    strokeOrder: ["loop-left", "loop-right", "cross-vertical", "cross-horizontal"],
    closed: "mixed",
    symmetry: "vertical",
    anchor: [0.5, 0.45],
  }),
};
