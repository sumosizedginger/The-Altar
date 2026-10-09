/**
 * src/scene/room.js — the ritual room (Phase 4 shell).
 *
 * COORDINATE CONTRACT (spec §6): scene -Z is NORTH. The altar stands at
 * the north wall; the window is in the EAST wall (+X) so daylight crosses
 * the room. Zones/compass data (bearing = degrees clockwise from north)
 * converts with bearingToDirection().
 *
 * Everything visible is procedural: oak floorboards, plaster walls, linen
 * cloth — all canvas textures from src/scene/textures.js. The room names
 * its meshes so tests and the builder (Phase 5) can address them.
 */

import * as THREE from "three";
import { seedFromId } from "./textures.js";

export const ROOM_DIMS = Object.freeze({ width: 9, depth: 12, height: 3.4 });

/** bearing (deg clockwise from north) → direction vector. N=0 → (0,0,-1). */
export function bearingToDirection(bearingDeg, out = new THREE.Vector3()) {
  const rad = (bearingDeg * Math.PI) / 180;
  return out.set(Math.sin(rad), 0, -Math.cos(rad));
}

/**
 * @param {{textures: ReturnType<import("./textures.js").createTextureFactory>}} opts
 */
export function buildRoom({ textures }) {
  const { width: W, depth: D, height: H } = ROOM_DIMS;
  const group = new THREE.Group();
  group.name = "room";

  /* ---- textures (each surface its own seed → stable variation) ------- */
  const floorTex = textures.wood({ seed: seedFromId("floor-oak"), plankCount: 7 });
  floorTex.repeat.set(4.5, 6);
  const furnTex = textures.wood({ seed: seedFromId("furn-oak"), plankCount: 4, base: "#6f5638" });
  const wallTex = textures.plaster();
  wallTex.repeat.set(3, 1.5);
  const clothTex = textures.cloth();
  const rugTex = textures.cloth({ seed: seedFromId("rug"), base: "#b3a284" });
  rugTex.repeat.set(5, 5);
  const windowTex = textures.windowGlow();
  const dustTex = textures.dustSprite();
  const allTextures = [floorTex, furnTex, wallTex, clothTex, rugTex, windowTex, dustTex];

  /* ---- materials ------------------------------------------------------ */
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55, metalness: 0.05 });
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 });
  const ceilMat = new THREE.MeshStandardMaterial({ map: wallTex, color: 0xd9d2bf, roughness: 1 });
  const furnMat = new THREE.MeshStandardMaterial({ map: furnTex, roughness: 0.5, metalness: 0.05 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ map: furnTex, color: 0x8a7a5e, roughness: 0.6 });
  const clothMat = new THREE.MeshStandardMaterial({ map: clothTex, roughness: 0.9 });
  const rugMat = new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x6b5a3a, roughness: 0.35, metalness: 0.85 });
  const waxMat = new THREE.MeshStandardMaterial({ color: 0xf2e8cf, roughness: 0.6 });
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, toneMapped: false });

  /* ---- floor / ceiling ------------------------------------------------- */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floor.name = "floor";
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilMat);
  ceiling.name = "ceiling";
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = H;
  group.add(ceiling);

  /* ---- walls (planes face inward) --------------------------------------- */
  const wallDefs = [
    ["wall-north", W, H, [0, H / 2, -D / 2], 0],
    ["wall-south", W, H, [0, H / 2, D / 2], Math.PI],
    ["wall-east", D, H, [W / 2, H / 2, 0], -Math.PI / 2],
    ["wall-west", D, H, [-W / 2, H / 2, 0], Math.PI / 2],
  ];
  for (const [name, w, h, pos, ry] of wallDefs) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    m.name = name;
    m.position.set(...pos);
    m.rotation.y = ry;
    m.receiveShadow = true;
    group.add(m);
  }

  /* ---- wainscot rail + baseboard (dark oak band around the room) -------- */
  const railH = 0.94;
  const bandDefs = [
    ["wainscot-north", W, [0, railH / 2, -D / 2 + 0.03], 0],
    ["wainscot-south", W, [0, railH / 2, D / 2 - 0.03], 0],
    ["wainscot-east", D, [W / 2 - 0.03, railH / 2, 0], Math.PI / 2],
    ["wainscot-west", D, [-W / 2 + 0.03, railH / 2, 0], Math.PI / 2],
  ];
  for (const [name, len, pos, ry] of bandDefs) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, railH, 0.06), darkWoodMat);
    m.name = name;
    m.position.set(...pos);
    m.rotation.y = ry;
    m.castShadow = false;
    m.receiveShadow = true;
    group.add(m);
  }

  /* ---- rug + framed panels (quiet museum furniture) ---------------------- */
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.9, 48), rugMat);
  rug.name = "rug";
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.012, -3.1);
  rug.receiveShadow = true;
  group.add(rug);

  const frameMat = darkWoodMat;
  for (const [i, x] of [-2.2, 2.2].entries()) {
    const panel = new THREE.Group();
    panel.name = `wall-panel-${i === 0 ? "l" : "r"}`;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.045), frameMat);
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.08), clothMat);
    inner.position.z = 0.026;
    panel.add(frame, inner);
    panel.position.set(x, 1.9, D / 2 - 0.05);
    panel.rotation.y = Math.PI;
    panel.castShadow = false;
    frame.castShadow = false;
    group.add(panel);
  }

  /* ---- the altar (static shell for Phase 4; builder arrives in 5) -------- */
  const altar = new THREE.Group();
  altar.name = "altar";
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.09, 0.8), furnMat);
  top.name = "altar-top";
  top.position.y = 1.02;
  top.castShadow = true;
  top.receiveShadow = true;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.975, 0.72), furnMat);
  legL.name = "altar-leg-l";
  legL.position.set(-0.72, 0.4875, 0);
  const legR = legL.clone();
  legR.name = "altar-leg-r";
  legR.position.x = 0.72;
  for (const l of [legL, legR]) {
    l.castShadow = true;
    l.receiveShadow = true;
  }
  const clothTop = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.024, 0.86), clothMat);
  clothTop.name = "altar-cloth";
  clothTop.position.y = 1.075;
  clothTop.castShadow = true;
  clothTop.receiveShadow = true;
  const drapeF = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.4, 0.02), clothMat);
  drapeF.name = "altar-drape-f";
  drapeF.position.set(0, 0.855, 0.42);
  const drapeB = drapeF.clone();
  drapeB.name = "altar-drape-b";
  drapeB.position.z = -0.42;
  altar.add(top, legL, legR, clothTop, drapeF, drapeB);
  altar.position.set(0, 0, -4.6);
  group.add(altar);

  /* ---- window, east wall (+X): glow plane + oak frame --------------------- */
  const win = new THREE.Group();
  win.name = "window";
  const winW = 1.4;
  const winH = 1.9;
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(winW, winH),
    new THREE.MeshBasicMaterial({ map: windowTex, transparent: true, opacity: 1, toneMapped: false }),
  );
  glow.name = "window-glow";
  win.add(glow);
  const slat = (w2, h2, x, y) => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(w2, h2, 0.09), frameMat);
    s.position.set(x, y, 0.055);
    s.castShadow = true;
    return s;
  };
  win.add(
    slat(winW + 0.16, 0.09, 0, winH / 2 + 0.045),
    slat(winW + 0.16, 0.09, 0, -winH / 2 - 0.045),
    slat(0.09, winH + 0.16, -winW / 2 - 0.045, 0),
    slat(0.09, winH + 0.16, winW / 2 + 0.045, 0),
  );
  win.position.set(W / 2 - 0.06, 1.85, -1.0);
  win.rotation.y = -Math.PI / 2; // faces into the room (-X)
  group.add(win);

  /* ---- candles: two sconces (north wall) + two standing stands ---------- */
  const candleSpots = [];
  let flameIndex = 0;

  function addCandle(parent, x, y, z) {
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.021, 0.13, 10), waxMat);
    wax.name = `candle-${flameIndex}`;
    wax.position.set(x, y, z);
    wax.castShadow = true;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.075, 8), flameMat);
    flame.name = `flame-${flameIndex}`;
    flame.position.set(x, y + 0.1, z);
    parent.add(wax, flame);
    const worldPos = new THREE.Vector3();
    wax.getWorldPosition(worldPos); // composes ancestor matrices itself
    candleSpots.push({ position: worldPos, flame });
    flameIndex += 1;
  }

  for (const [i, sx] of [-1.7, 1.7].entries()) {
    const sconce = new THREE.Group();
    sconce.name = `sconce-${i === 0 ? "l" : "r"}`;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.025), darkWoodMat);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.024, 0.05, 10), metalMat);
    cup.position.set(0, 0.12, 0.03);
    sconce.add(plate, cup);
    sconce.position.set(sx, 1.75, -D / 2 + 0.06);
    group.add(sconce);
    addCandle(sconce, 0, 0.17, 0.03);
  }

  for (const [i, sx] of [-2.55, 2.55].entries()) {
    const stand = new THREE.Group();
    stand.name = `stand-${i === 0 ? "l" : "r"}`;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.12, 0.07), darkWoodMat);
    post.position.y = 0.56;
    post.castShadow = true;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.34), darkWoodMat);
    foot.position.y = 0.025;
    foot.castShadow = true;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.026, 0.055, 10), metalMat);
    cup.position.y = 1.15;
    stand.add(post, foot, cup);
    stand.position.set(sx, 0, -2.6);
    group.add(stand);
    addCandle(stand, 0, 1.21, 0);
  }

  /* ---- door, south wall (Phase 5: anchors the above-door zone) ------------ */
  const door = new THREE.Group();
  door.name = "door";
  const doorW = 1.06;
  const doorH = 2.14;
  const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.07), furnMat);
  doorPanel.name = "door-panel";
  doorPanel.position.y = doorH / 2;
  doorPanel.castShadow = true;
  doorPanel.receiveShadow = true;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.22, 0.12, 0.1), frameMat);
  lintel.name = "door-lintel";
  lintel.position.y = doorH + 0.06;
  const jambL = new THREE.Mesh(new THREE.BoxGeometry(0.11, doorH + 0.06, 0.1), frameMat);
  jambL.position.set(-(doorW / 2 + 0.055), (doorH + 0.06) / 2, 0);
  const jambR = jambL.clone();
  jambR.position.x = doorW / 2 + 0.055;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), metalMat);
  knob.name = "door-knob";
  knob.position.set(doorW / 2 - 0.12, 1.05, 0.06);
  door.add(doorPanel, lintel, jambL, jambR, knob);
  door.position.set(0, 0, D / 2 - 0.05);
  door.rotation.y = Math.PI;
  group.add(door);

  /* ---- hearth, west wall (Phase 5: anchors the hearth zone) ---------------- */
  const hearth = new THREE.Group();
  hearth.name = "hearth";
  const breast = new THREE.Mesh(new THREE.BoxGeometry(0.34, H, 2.2), wallMat);
  breast.name = "hearth-breast";
  breast.position.set(0, H / 2, 0);
  breast.receiveShadow = true;
  const firebox = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.72, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x171310, roughness: 1 }),
  );
  firebox.name = "hearth-firebox";
  firebox.position.set(0.06, 0.42, 0);
  const mantel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, 1.5), darkWoodMat);
  mantel.name = "hearth-mantel";
  mantel.position.set(0.1, 0.985, 0);
  mantel.castShadow = true;
  mantel.receiveShadow = true;
  const hearthStone = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.045, 1.62), darkWoodMat);
  hearthStone.name = "hearth-stone";
  hearthStone.position.set(0.16, 0.0225, 0);
  hearthStone.receiveShadow = true;
  hearth.add(breast, firebox, mantel, hearthStone);
  hearth.position.set(-W / 2 + 0.02, 0, 1.4);
  hearth.rotation.y = Math.PI / 2; // faces into the room (+X)
  group.add(hearth);

  /* ---- pendant stand (Phase 5: anchors the worn/pendant zone) --------------- */
  const pendantStand = new THREE.Group();
  pendantStand.name = "pendant-stand";
  const pBase = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 0.035, 16), darkWoodMat);
  pBase.position.y = 0.0175;
  pBase.castShadow = true;
  const pPost = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 1.28, 10), darkWoodMat);
  pPost.position.y = 0.67;
  pPost.castShadow = true;
  const pBar = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.52, 8), darkWoodMat);
  pBar.rotation.z = Math.PI / 2;
  pBar.position.y = 1.3;
  pBar.castShadow = true;
  pendantStand.add(pBase, pPost, pBar);
  pendantStand.position.set(1.75, 0, 4.9);
  group.add(pendantStand);

  return {
    group,
    candleSpots,
    windowGlowMesh: glow,
    dustTexture: dustTex,
    textures: allTextures,
    dims: ROOM_DIMS,
    bounds: { minX: -W / 2 + 0.3, maxX: W / 2 - 0.3, minY: 0.15, maxY: H - 0.2, minZ: -D / 2 + 0.3, maxZ: D / 2 - 0.3 },
  };
}

/* ------------------------------------------------------------------------ *
 * Zone geometry (Phase 5) — where placement rays land, which zone is that?  *
 * Pure point-in-region logic over the SAME numbers the builder uses, so     *
 * tests verify the mapping headlessly.                                     *
 * ------------------------------------------------------------------------ */

export const ZONE_GEOMETRY = Object.freeze({
  altarTopY: 1.099, // cloth top surface (1.075 + half of 0.024)
  altarCenter: { minX: -0.32, maxX: 0.32, minZ: -0.2, maxZ: 0.2 },
  altarNorth: { minZ: -0.4, maxZ: -0.2 },
  altarSouth: { minZ: 0.2, maxZ: 0.4 },
  altarWest: { minX: -0.85, maxX: -0.32 },
  altarEast: { minX: 0.32, maxX: 0.85 },
  hearthMantelY: 1.02,
  floorCenter: { x: 0, z: -3.1, radius: 2.4 },
  aboveDoor: { wall: "south", minY: 2.2, maxY: 3.0, minX: -0.64, maxX: 0.64 },
  highWallMinY: 1.55,
});

/**
 * Which placement zone contains a world-space hit point?
 * @param {{x:number,y:number,z:number}} p hit point (world)
 * @param {string} hitName name of the intersected room mesh
 * @returns {string|null} zone id, or null when the point is not placeable
 */
export function zoneForPoint(p, hitName) {
  const g = ZONE_GEOMETRY;
  if (hitName === "altar-cloth" || hitName === "altar-top") {
    // regions are altar-local; the altar stands centered at (0, -4.6)
    const lx = p.x;
    const lz = p.z + 4.6;
    if (
      lx < g.altarCenter.maxX && lx > g.altarCenter.minX &&
      lz < g.altarCenter.maxZ && lz > g.altarCenter.minZ
    ) {
      return "altar-center";
    }
    if (lz < g.altarNorth.maxZ && lz >= g.altarNorth.minZ) return "altar-north";
    if (lz > g.altarSouth.minZ && lz <= g.altarSouth.maxZ) return "altar-south";
    if (lx < g.altarWest.maxX) return "altar-west";
    if (lx > g.altarEast.minX) return "altar-east";
    return "altar-center";
  }
  if (hitName === "hearth-mantel") return "hearth";
  if (hitName === "floor" || hitName === "rug") {
    const dx = p.x - g.floorCenter.x;
    const dz = p.z - g.floorCenter.z;
    return dx * dx + dz * dz <= g.floorCenter.radius * g.floorCenter.radius ? "floor" : null;
  }
  if (hitName.startsWith("pendant-stand")) return "pendant";
  if (hitName.startsWith("wall-") || hitName.startsWith("wainscot-")) {
    const south = hitName.includes("south");
    if (
      south && p.y >= g.aboveDoor.minY && p.y <= g.aboveDoor.maxY &&
      Math.abs(p.x) <= g.aboveDoor.maxX
    ) {
      return "above-door";
    }
    if (p.y >= g.highWallMinY) return "high-wall";
    return null; // reachable wall at hand height is not a zone
  }
  return null;
}
