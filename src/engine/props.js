/**
 * src/engine/props.js — procedural meshes for placeable items (Phase 5).
 *
 * One generic factory per item kind, parametric by data — no bespoke
 * scene code per item:
 *   - buildToolProp(tool): 13 tools from lathe profiles and primitives,
 *     keyed by the tool's own category/heightClass with per-id profiles;
 *   - buildSymbolPlaque(symbol): a brass plaque carrying a live
 *     SymbolInstance, in three mounts — stand (surfaces), wall, worn.
 *
 * Every group's origin sits at its BASE (y=0) so the builder can rest
 * items on any surface height; everything faces +Z (south, toward the
 * viewer) by convention. Plain-color materials only — these meshes are
 * headless-testable with the three shim.
 */

import * as THREE from "three";
import { SymbolInstance } from "./symbolRenderer.js";

const MAT = {
  // Candlelit-room brass: with no environment map, bare high-metalness
  // surfaces read as black voids at dusk — carry a warm emissive floor.
  brass: new THREE.MeshStandardMaterial({ color: 0xb08d4f, roughness: 0.42, metalness: 0.6, emissive: 0x2a1f0c, emissiveIntensity: 0.5 }),
  pewter: new THREE.MeshStandardMaterial({ color: 0x9a938a, roughness: 0.48, metalness: 0.55, emissive: 0x14120e, emissiveIntensity: 0.35 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x3d3a35, roughness: 0.55, metalness: 0.6 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x6f5638, roughness: 0.6, metalness: 0.05 }),
  darkWood: new THREE.MeshStandardMaterial({ color: 0x4a3a26, roughness: 0.65, metalness: 0.05 }),
  wax: new THREE.MeshStandardMaterial({ color: 0xf2e8cf, roughness: 0.6 }),
  ceramic: new THREE.MeshStandardMaterial({ color: 0xd9cfb8, roughness: 0.5 }),
  cloth: new THREE.MeshStandardMaterial({ color: 0xe8dfc8, roughness: 0.95 }),
  rug: new THREE.MeshStandardMaterial({ color: 0xb3a284, roughness: 1 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x8b8478, roughness: 0.9 }),
  feather: new THREE.MeshStandardMaterial({ color: 0xe4e0d2, roughness: 0.85 }),
  wick: new THREE.MeshStandardMaterial({ color: 0x1c1814, roughness: 0.9 }),
  water: new THREE.MeshStandardMaterial({ color: 0x9db4b0, roughness: 0.15, metalness: 0.1 }),
  salt: new THREE.MeshStandardMaterial({ color: 0xf4efe2, roughness: 0.9 }),
};

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Lathe a vessel from a 2D profile (points are [radius, height]). */
function lathe(profile, mat, segments = 24) {
  const pts = profile.map(([r, h]) => new THREE.Vector2(r, h));
  return mesh(new THREE.LatheGeometry(pts, segments), mat);
}

/* ---- tool forms ------------------------------------------------------------ */

const TOOL_FORMS = {
  candle: () => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.22, 14), MAT.wax, 0, 0.11, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 6), MAT.wick, 0, 0.235, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.02, 14), MAT.brass, 0, 0.01, 0));
    return g;
  },
  "oil-lamp": () => {
    const g = new THREE.Group();
    g.add(lathe([[0.001, 0], [0.09, 0.005], [0.1, 0.05], [0.07, 0.075], [0.065, 0.08]], MAT.pewter));
    g.add(mesh(new THREE.ConeGeometry(0.02, 0.07, 10), MAT.pewter, 0.1, 0.055, 0)).children.at(-1).rotation.z = -1.1;
    g.add(mesh(new THREE.TorusGeometry(0.03, 0.008, 8, 14), MAT.pewter, -0.1, 0.06, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.035, 6), MAT.wick, 0.115, 0.07, 0));
    return g;
  },
  chalice: () => {
    const g = new THREE.Group();
    g.add(lathe([[0.001, 0], [0.055, 0], [0.06, 0.015], [0.018, 0.04], [0.016, 0.12], [0.05, 0.16], [0.058, 0.2], [0.055, 0.21]], MAT.brass));
    return g;
  },
  "water-bowl": () => {
    const g = new THREE.Group();
    g.add(lathe([[0.001, 0], [0.09, 0.002], [0.11, 0.035], [0.115, 0.06], [0.108, 0.062]], MAT.ceramic));
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.004, 24), MAT.water, 0, 0.045, 0));
    return g;
  },
  "salt-dish": () => {
    const g = new THREE.Group();
    g.add(lathe([[0.001, 0], [0.05, 0.002], [0.06, 0.03], [0.055, 0.032]], MAT.ceramic));
    g.add(mesh(new THREE.SphereGeometry(0.032, 12, 10), MAT.salt, 0, 0.028, 0));
    return g;
  },
  "incense-burner": () => {
    const g = new THREE.Group();
    g.add(lathe([[0.001, 0], [0.07, 0.004], [0.085, 0.03], [0.08, 0.035]], MAT.brass));
    g.add(mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.16, 6), MAT.wick, 0.02, 0.1, 0)).children.at(-1).rotation.z = 0.5;
    g.add(mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 14, Math.PI), MAT.brass, 0, 0.035, 0));
    return g;
  },
  bell: () => {
    const g = new THREE.Group();
    g.add(lathe([[0.001, 0.012], [0.02, 0.004], [0.032, 0.01], [0.05, 0.07], [0.055, 0.1], [0.052, 0.105], [0.012, 0.115], [0.01, 0.125]], MAT.brass));
    g.add(mesh(new THREE.SphereGeometry(0.011, 10, 8), MAT.iron, 0, 0.014, 0));
    return g;
  },
  "singing-bowl": () => {
    const g = new THREE.Group();
    g.add(lathe([[0.001, 0.02], [0.1, 0.012], [0.13, 0.05], [0.135, 0.075], [0.128, 0.078]], MAT.pewter));
    const striker = mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.12, 8), MAT.wood, 0.16, 0.06, 0.05);
    striker.rotation.z = Math.PI / 2 - 0.25;
    g.add(striker);
    return g;
  },
  wand: () => {
    const g = new THREE.Group();
    const rod = mesh(new THREE.CylinderGeometry(0.008, 0.013, 0.42, 8), MAT.darkWood, 0, 0.21, 0);
    rod.rotation.z = 0.06;
    g.add(rod);
    g.add(mesh(new THREE.SphereGeometry(0.016, 10, 8), MAT.brass, -0.012, 0.415, 0));
    return g;
  },
  feather: () => {
    const g = new THREE.Group();
    const vane = mesh(new THREE.ConeGeometry(0.028, 0.24, 8), MAT.feather, 0, 0.2, 0);
    vane.scale.set(0.35, 1, 1);
    vane.rotation.z = 0.08;
    g.add(vane);
    const quill = mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.13, 6), MAT.wax, -0.008, 0.055, 0);
    g.add(quill);
    return g;
  },
  stone: () => {
    const g = new THREE.Group();
    const rock = mesh(new THREE.DodecahedronGeometry(0.07, 0), MAT.stone, 0, 0.05, 0);
    rock.scale.set(1, 0.7, 0.9);
    rock.rotation.set(0.3, 0.7, 0.15);
    g.add(rock);
    return g;
  },
  cloth: () => {
    const g = new THREE.Group();
    const drape = mesh(new THREE.BoxGeometry(0.5, 0.012, 0.3), MAT.cloth, 0, 0.006, 0);
    g.add(drape);
    const fall = mesh(new THREE.BoxGeometry(0.5, 0.1, 0.012), MAT.cloth, 0, 0.05, 0.15);
    fall.rotation.x = -0.18;
    g.add(fall);
    return g;
  },
  "prayer-rug": () => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.95, 0.014, 0.6), MAT.rug, 0, 0.007, 0));
    g.add(mesh(new THREE.BoxGeometry(0.85, 0.002, 0.5), MAT.cloth, 0, 0.015, 0));
    const arch = mesh(new THREE.TorusGeometry(0.12, 0.012, 6, 16, Math.PI), MAT.brass, 0, 0.017, -0.1);
    arch.rotation.x = -Math.PI / 2;
    g.add(arch);
    return g;
  },
};

/** Generic fallback keyed by category (unknown ids never crash the room). */
const CATEGORY_FORMS = {
  vessel: TOOL_FORMS["water-bowl"],
  flame: TOOL_FORMS.candle,
  sound: TOOL_FORMS.bell,
  wand: TOOL_FORMS.wand,
  censer: TOOL_FORMS["incense-burner"],
  natural: TOOL_FORMS.stone,
  textile: TOOL_FORMS.cloth,
};

export function buildToolProp(tool) {
  const form = TOOL_FORMS[tool.id] ?? CATEGORY_FORMS[tool.category] ?? TOOL_FORMS.stone;
  const group = form();
  group.name = `tool-${tool.id}`;
  group.userData = { kind: "tool", id: tool.id };
  return group;
}

/* ---- symbol plaques --------------------------------------------------------- */

/**
 * A symbol plaque: brass disc + the symbol's live strokes.
 * mount: "stand" (surfaces/floor) | "wall" | "worn" (small, hanging).
 */
export function buildSymbolPlaque(symbol, { mount = "stand", radius = 0.013 } = {}) {
  const group = new THREE.Group();
  group.name = `symbol-${symbol.id}`;
  group.userData = { kind: "symbol", id: symbol.id };

  const discR = mount === "worn" ? 0.13 : 0.27;
  const disc = mesh(
    new THREE.CylinderGeometry(discR, discR, mount === "wall" ? 0.018 : 0.024, 28),
    MAT.brass,
  );
  disc.rotation.x = Math.PI / 2; // face +Z
  disc.castShadow = false; // a wall plaque shadowing its own wall = acne + blobs
  group.add(disc);

  const instance = new SymbolInstance(symbol, { radius });
  const holder = new THREE.Group(); // wrapper owns the plaque scale — the
  // instance group keeps its centering offset and stays free for behaviors
  holder.scale.setScalar(mount === "worn" ? 0.2 : 0.42);
  holder.position.z = mount === "wall" ? 0.012 : 0.014;
  holder.add(instance.group);
  group.add(holder);

  if (mount === "stand") {
    const foot = mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.02, 18), MAT.darkWood, 0, 0.01, -0.02);
    const strut = mesh(new THREE.BoxGeometry(0.03, 0.16, 0.02), MAT.darkWood, 0, 0.09, -0.035);
    strut.rotation.x = 0.42;
    group.add(foot, strut);
    group.position.y = 0; // base at origin
    group.rotation.x = -0.34; // tilted toward the viewer
  } else if (mount === "worn") {
    const bail = mesh(new THREE.TorusGeometry(0.02, 0.005, 8, 14), MAT.brass, 0, discR + 0.012, 0);
    const cord = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.14, 6), MAT.darkWood, 0, discR + 0.09, 0);
    group.add(bail, cord);
  }

  return { group, instance, mount };
}

/** Dispatcher used by the builder UI. */
export function buildItem(kind, data, opts = {}) {
  if (kind === "tool") return { group: buildToolProp(data), instance: null };
  const mount = opts.mount ?? zoneMount(opts.zoneId);
  return buildSymbolPlaque(data, { mount, radius: opts.radius });
}

/** Which plaque mount suits a zone (worn zone → hanging form). */
export function zoneMount(zoneId) {
  if (zoneId === "pendant") return "worn";
  if (zoneId === "high-wall" || zoneId === "above-door") return "wall";
  return "stand";
}
