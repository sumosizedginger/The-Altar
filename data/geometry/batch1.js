/**
 * data/geometry/batch1.js — Phase 2, Batch 1 (symbols 1–10 of 40).
 * Celtic ×7, Egyptian ×3 (ankh, eye-of-horus, djed).
 * All coordinates normalized 0–1, y up.
 */
import { geom, line, polyline, circle, cubic, arc, polar, rot, mirrorV } from "./_helpers.js";

export const BATCH1 = {
  /* 1 ─ triskelion: three spiral arms unwinding from the center */
  triskelion: geom({
    primitives: [
      polar("spiral-1", 0.5, 0.5, "0.05+0.31*t", 90, 390),
      polar("spiral-2", 0.5, 0.5, "0.05+0.31*t", 210, 510),
      polar("spiral-3", 0.5, 0.5, "0.05+0.31*t", 330, 630),
    ],
    strokeOrder: ["spiral-1", "spiral-2", "spiral-3"],
    closed: false,
    symmetry: "rotational-3",
    anchor: [0.5, 0.5],
    orientation: "rotatable",
  }),

  /* 2 ─ triquetra: three pointed leaves radiating from the center,
        axes 120° apart; each leaf is two curved flanks */
  triquetra: (() => {
    const C = [0.5, 0.5];
    const flankLeft = cubic("leaf-a-left", 0.5, 0.42, 0.375, 0.5, 0.375, 0.72, 0.5, 0.86);
    const flankRight = cubic("leaf-a-right", 0.5, 0.42, 0.625, 0.5, 0.625, 0.72, 0.5, 0.86);
    return geom({
      primitives: [
        flankLeft, flankRight,
        { ...rot(flankLeft, 120, C[0], C[1]), id: "leaf-b-left" },
        { ...rot(flankRight, 120, C[0], C[1]), id: "leaf-b-right" },
        { ...rot(flankLeft, 240, C[0], C[1]), id: "leaf-c-left" },
        { ...rot(flankRight, 240, C[0], C[1]), id: "leaf-c-right" },
      ],
      strokeOrder: ["leaf-a-left", "leaf-a-right", "leaf-b-left", "leaf-b-right", "leaf-c-left", "leaf-c-right"],
      closed: "mixed",
      symmetry: "rotational-3",
      anchor: [0.5, 0.5],
    });
  })(),

  /* 3 ─ dara knot: two woven strands over a root fan */
  "dara-knot": (() => {
    const strandLeft = cubic("strand-left", 0.43, 0.83, 0.66, 0.72, 0.34, 0.55, 0.5, 0.34);
    const rootLeft = cubic("root-left", 0.5, 0.34, 0.42, 0.27, 0.33, 0.21, 0.29, 0.12);
    return geom({
      primitives: [
        arc("top-arch", 0.5, 0.83, 0.07, 0, 180),
        strandLeft,
        { ...mirrorV(strandLeft), id: "strand-right" },
        rootLeft,
        cubic("root-center", 0.5, 0.34, 0.48, 0.26, 0.52, 0.18, 0.5, 0.1),
        { ...mirrorV(rootLeft), id: "root-right" },
      ],
      strokeOrder: ["top-arch", "strand-left", "strand-right", "root-left", "root-center", "root-right"],
      closed: false,
      symmetry: "vertical",
      anchor: [0.5, 0.5],
    });
  })(),

  /* 4 ─ brigid's cross: four woven rush arms + bound center */
  "brigids-cross": (() => {
    const arm = polyline("arm-n", [
      [0.452, 0.5], [0.452, 0.8], [0.5, 0.875], [0.548, 0.8], [0.548, 0.5],
    ]);
    return geom({
      primitives: [
        arm,
        { ...rot(arm, 90), id: "arm-e" },
        { ...rot(arm, 180), id: "arm-s" },
        { ...rot(arm, 270), id: "arm-w" },
        polyline("center-bind", [
          [0.452, 0.452], [0.548, 0.452], [0.548, 0.548], [0.452, 0.548], [0.452, 0.452],
        ]),
      ],
      strokeOrder: ["arm-n", "arm-e", "arm-s", "arm-w", "center-bind"],
      closed: "mixed",
      symmetry: "rotational-4",
      anchor: [0.5, 0.5],
    });
  })(),

  /* 5 ─ celtic cross: shaft + arms + ring at the crossing */
  "celtic-cross": geom({
    primitives: [
      polyline("shaft", [[0.455, 0.06], [0.455, 0.92], [0.545, 0.92], [0.545, 0.06], [0.455, 0.06]]),
      polyline("arms", [[0.2, 0.575], [0.8, 0.575], [0.8, 0.665], [0.2, 0.665], [0.2, 0.575]]),
      circle("ring", 0.5, 0.62, 0.17),
    ],
    strokeOrder: ["shaft", "arms", "ring"],
    closed: true,
    symmetry: "vertical",
    anchor: [0.5, 0.35],
  }),

  /* 6 ─ awen: three rays rising from one point, encircled */
  awen: geom({
    primitives: [
      line("ray-left", 0.5, 0.26, 0.3, 0.78),
      line("ray-right", 0.5, 0.26, 0.7, 0.78),
      line("ray-center", 0.5, 0.26, 0.5, 0.82),
      circle("circle", 0.5, 0.5, 0.34),
    ],
    strokeOrder: ["ray-left", "ray-right", "ray-center", "circle"],
    closed: "mixed",
    symmetry: "vertical",
    anchor: [0.5, 0.5],
  }),

  /* 7 ─ spiral tree of life: root fan, trunk, spiral crown */
  "spiral-tree-of-life": (() => {
    const rootLeft = cubic("root-left", 0.5, 0.16, 0.42, 0.07, 0.34, 0.07, 0.3, 0.14);
    const spiralLeft = polar("crown-left", 0.36, 0.585, "0.015+0.06*t", 180, -240);
    return geom({
      primitives: [
        rootLeft,
        { ...mirrorV(rootLeft), id: "root-right" },
        cubic("trunk", 0.5, 0.16, 0.46, 0.32, 0.54, 0.44, 0.5, 0.58),
        spiralLeft,
        { ...mirrorV(spiralLeft), id: "crown-right" },
        circle("crown-top", 0.5, 0.74, 0.055),
      ],
      strokeOrder: ["root-left", "root-right", "trunk", "crown-left", "crown-right", "crown-top"],
      closed: "mixed",
      symmetry: "vertical",
      anchor: [0.5, 0.4],
    });
  })(),

  /* 8 ─ ankh: loop, shaft, crossbar */
  ankh: geom({
    primitives: [
      circle("loop", 0.5, 0.74, 0.14),
      line("shaft", 0.5, 0.6, 0.5, 0.08),
      line("crossbar", 0.3, 0.52, 0.7, 0.52),
    ],
    strokeOrder: ["loop", "shaft", "crossbar"],
    closed: "mixed",
    symmetry: "vertical",
    anchor: [0.5, 0.42],
  }),

  /* 9 ─ eye of horus: brow, lids, pupil, cheek curl, tail.
        The eye behavior animates "pupil" + "lid-upper"/"lid-lower". */
  "eye-of-horus": geom({
    primitives: [
      cubic("brow", 0.18, 0.66, 0.3, 0.79, 0.62, 0.81, 0.8, 0.7),
      cubic("lid-upper", 0.2, 0.58, 0.35, 0.71, 0.6, 0.71, 0.78, 0.58),
      cubic("lid-lower", 0.22, 0.52, 0.35, 0.42, 0.5, 0.42, 0.62, 0.52),
      circle("pupil", 0.47, 0.575, 0.055),
      polyline("cheek-drop", [[0.4, 0.5], [0.4, 0.34]]),
      cubic("cheek-curl", 0.4, 0.34, 0.4, 0.23, 0.29, 0.21, 0.27, 0.3),
      polyline("tail", [[0.78, 0.58], [0.88, 0.47], [0.81, 0.35]]),
    ],
    strokeOrder: ["brow", "lid-upper", "lid-lower", "pupil", "cheek-drop", "cheek-curl", "tail"],
    closed: "mixed",
    symmetry: "none",
    anchor: [0.5, 0.55],
  }),

  /* 10 ─ djed pillar: spine of the altar's stability */
  djed: geom({
    primitives: [
      line("pillar-left", 0.44, 0.12, 0.44, 0.72),
      line("pillar-right", 0.56, 0.12, 0.56, 0.72),
      line("base", 0.36, 0.12, 0.64, 0.12),
      line("bar-1", 0.32, 0.64, 0.68, 0.64),
      line("bar-2", 0.34, 0.55, 0.66, 0.55),
      line("bar-3", 0.36, 0.46, 0.64, 0.46),
      line("bar-4", 0.38, 0.37, 0.62, 0.37),
      arc("capital", 0.5, 0.72, 0.06, 0, 180),
    ],
    strokeOrder: ["pillar-left", "pillar-right", "base", "bar-1", "bar-2", "bar-3", "bar-4", "capital"],
    closed: false,
    symmetry: "vertical",
    anchor: [0.5, 0.4],
  }),
};
