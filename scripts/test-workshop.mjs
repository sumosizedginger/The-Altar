/**
 * scripts/test-workshop.mjs — Phase 5/6 integration gate.
 *
 * Drives the REAL builder code (initBuilder + cameraRig + machine +
 * arrangement + raycaster — all pure math headlessly) through a stub DOM,
 * replaying the exact interaction the reviewer hit: pick a symbol, hover
 * the altar, click, expect a placement. Catches wiring breaks that syntax
 * checks and module-unit tests structurally cannot see.
 * Run via `npm test`.
 */
import assert from "node:assert/strict";
import * as THREE from "three";
import { createApp } from "../src/core/app.js";
import { createCameraRig } from "../src/ui/cameraRig.js";
import { initBuilder } from "../src/ui/builder.js";
import { createTextureFactory } from "../src/scene/textures.js";
import { buildRoom } from "../src/scene/room.js";
import { SYMBOLS_BY_ID } from "../data/symbols.js";
import { buildItem } from "../src/engine/props.js";

let passed = 0;
const section = (n) => console.log(`\n— ${n}`);
function ok(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

/* ---- stub DOM -------------------------------------------------------------- */
function stubEl(tag = "div") {
  const el = {
    tag,
    className: "",
    textContent: "",
    hidden: false,
    dataset: {},
    children: [],
    listeners: {},
    append(...c) {
      this.children.push(...c);
    },
    addEventListener(t, fn) {
      (this.listeners[t] ??= []).push(fn);
    },
    removeEventListener() {},
    setAttribute() {},
    getAttribute: () => null,
    focus() {},
    classList: {
      _set: new Set(),
      toggle(c, force) {
        if (force === undefined) this._set.has(c) ? this._set.delete(c) : this._set.add(c);
        else force ? this._set.add(c) : this._set.delete(c);
      },
      add(c) {
        this._set.add(c);
      },
      remove(c) {
        this._set.delete(c);
      },
      contains(c) {
        return this._set.has(c);
      },
    },
  };
  return el;
}

const docListeners = {};
const allCreated = [];
const elements = {};
const byId = (id) => (elements[id] ??= stubEl("div"));

globalThis.HTMLInputElement = class HTMLInputElement {}; // builder's keydown guard instanceof-checks these
globalThis.HTMLSelectElement = class HTMLSelectElement {};
globalThis.document = {
  getElementById: byId,
  createElement: (tag) => {
    const el = stubEl(tag);
    allCreated.push(el);
    return el;
  },
  querySelectorAll: (sel) =>
    sel === ".cat-chip" ? allCreated.filter((e) => e.className.includes("cat-chip")) : [],
  addEventListener: (t, fn) => (docListeners[t] ??= []).push(fn),
  removeEventListener() {},
};
globalThis.window = { innerWidth: 1280, innerHeight: 720, addEventListener() {} };
globalThis.localStorage = { getItem: () => null, setItem() {} };

/* ---- real scene + builder ---------------------------------------------------- */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, 1280 / 720, 0.1, 60);
camera.aspect = 1280 / 720;
camera.updateProjectionMatrix();

const recordingDoc = {
  createElement() {
    const ctx = new Proxy(
      {},
      {
        get: (t, prop) =>
          prop === "__ops"
            ? []
            : (...args) => {
                if (prop === "createLinearGradient" || prop === "createRadialGradient") {
                  return { addColorStop() {} };
                }
                return undefined;
              },
        set: () => true,
      },
    );
    return { width: 0, height: 0, getContext: () => ctx };
  },
};
const room = buildRoom({ textures: createTextureFactory({ document: recordingDoc }) });
scene.add(room.group);

const fakeDom = stubEl("canvas");
const notices = [];
const app = createApp();
const cameraCtl = createCameraRig({ camera, dom: fakeDom, reducedMotion: false });
cameraCtl.setView("altar");
cameraCtl.update(1);

const builder = initBuilder({
  app,
  renderer: { domElement: fakeDom },
  scene,
  camera,
  room,
  textures: null,
  reducedMotion: false,
  notice: (t) => notices.push(t),
  cameraCtl,
  audio: null,
  onItemClick: null,
});

const machine = app.machine;
machine.transition("CODEX");
machine.transition("PLACING");

/* ---- helpers ------------------------------------------------------------------- */
const dom = { pointerdown: [], pointermove: [], pointerup: [], wheel: [] };
for (const type of Object.keys(dom)) {
  fakeDom.listeners[type] ??= [];
  dom[type] = fakeDom.listeners[type];
}
const fire = (type, e) => {
  for (const fn of dom[type]) fn(e);
};
const click = (x, y, extra = {}) => {
  fire("pointerdown", { clientX: x, clientY: y, button: 0, ctrlKey: false, metaKey: false, pointerId: 1, ...extra });
  fire("pointerup", { clientX: x, clientY: y, button: 0, pointerId: 1, shiftKey: false, ...extra });
};
/** Screen coords of a world point through the current camera. */
function project(x, y, z) {
  scene.updateMatrixWorld(true); // the real render loop does both every frame
  camera.updateMatrixWorld(true);
  const v = new THREE.Vector3(x, y, z).project(camera);
  return { x: ((v.x + 1) / 2) * 1280, y: ((1 - v.y) / 2) * 720 };
}
const ghostInScene = () => {
  let found = null;
  scene.traverse((o) => {
    if (o.userData?.isGhost) found = o;
  });
  return found;
};
const markerGroup = () => scene.getObjectByName("zone-markers");
const pickChip = (kind, id) => {
  for (const chip of document.querySelectorAll(".cat-chip")) {
    if (chip.dataset.kind === kind && chip.dataset.id === id) {
      for (const fn of chip.listeners.click) fn();
      return true;
    }
  }
  return false;
};

/* ---- the gates ------------------------------------------------------------------ */
section("workshop wiring (integration)");
ok("boot: catalog chips exist; zone markers hidden until needed", () => {
  assert.ok(document.querySelectorAll(".cat-chip").length >= 53, "40 symbols + 13 tools");
  assert.ok(markerGroup(), "marker group built");
  assert.equal(markerGroup().visible, false, "markers hidden at rest");
});

ok("picking a symbol enters placing mode AND lights the markers", () => {
  assert.equal(pickChip("symbol", "pentacle"), true, "pentacle chip clickable");
  assert.ok(byId("place-hint").textContent.includes("Placing: Pentacle"), "hint set");
  assert.equal(byId("place-hint").hidden, false);
  assert.equal(markerGroup().visible, true, "markers lit while placing");
});

ok("hovering the altar spawns the ghost + verdict chip", () => {
  const p = project(0, 1.09, -4.55); // altar cloth, center
  fire("pointermove", { clientX: p.x, clientY: p.y, pointerId: 1 });
  assert.ok(ghostInScene(), "ghost present in scene");
  assert.equal(byId("verdict-chip").hidden, false, "verdict chip shown");
  assert.ok(byId("verdict-chip").textContent.includes("Altar Center"), `chip reads: ${byId("verdict-chip").textContent}`);
});

ok("a clean click places the symbol; machine advances to BUILDING", () => {
  const p = project(0, 1.09, -4.55);
  click(p.x, p.y);
  assert.equal(builder.arrangement.size(), 1, "one item placed");
  const item = [...builder.arrangement.items.values()][0];
  assert.equal(item.zoneId, "altar-center");
  assert.equal(item.id, "pentacle");
  assert.equal(machine.state, "BUILDING", "PLACING → BUILDING on first placement");
});

ok("a jittered press (micro-drag) neither places nor throws", () => {
  cameraCtl.setView("room");
  cameraCtl.update(1);
  const p = project(4.45, 2.4, 0); // east wall, high-wall band
  const posBefore = camera.position.clone();
  fire("pointerdown", { clientX: p.x, clientY: p.y, button: 0, ctrlKey: false, metaKey: false, pointerId: 2 });
  fire("pointermove", { clientX: p.x + 40, clientY: p.y + 6, pointerId: 2 });
  fire("pointerup", { clientX: p.x + 40, clientY: p.y + 6, pointerId: 2 });
  cameraCtl.update(1); // let the rig ease toward the goal the drag set
  assert.equal(builder.arrangement.size(), 1, "no accidental placement");
  assert.ok(camera.position.distanceTo(posBefore) > 0.001, "the drag rotated the camera instead");
});

ok("Escape leaves placing mode and hides the markers", () => {
  assert.equal(pickChip("symbol", "triquetra"), true);
  assert.equal(markerGroup().visible, true);
  for (const fn of docListeners.keydown ?? []) fn({ key: "Escape" });
  assert.equal(byId("place-hint").hidden, true, "hint hidden");
  assert.equal(markerGroup().visible, false, "markers off again");
  assert.ok(!ghostInScene(), "ghost destroyed");
});

ok("placing a forbidden pairing refuses gently — nothing breaks", () => {
  // celtic-cross ✕ floor is forbidden in the data
  machine.transition("PLACING"); // back from BUILDING
  assert.equal(pickChip("symbol", "celtic-cross"), true);
  const p = project(0.4, 0.01, -2.6); // rug area
  fire("pointermove", { clientX: p.x, clientY: p.y, pointerId: 3 });
  assert.ok(ghostInScene(), "ghost follows even over forbidden ground...");
  assert.equal(ghostInScene().position.y, -50, "...but parks out of sight (refuses to pretend)");
  click(p.x, p.y);
  assert.equal(builder.arrangement.size(), 1, "forbidden placement refused");
  assert.ok(notices.some((n) => /floor/i.test(n) && /place|convention|not its place/i.test(n)), `gentle refusal: ${notices.at(-1)}`);
});


ok("plaque wraps its strokes: no stray black disc beside the symbol", () => {
  // Regression: scaling the instance group (which carries the baked-in
  // centering offset) shoved the strokes ~0.29 off the brass disc, and the
  // bare-metal disc rendered as a black dot at dusk. The plaque must be one
  // centered object: strokes inside the disc, disc warm and shadow-free.
  for (const mount of ["wall", "stand", "worn"]) {
    const plaque = buildItem("symbol", SYMBOLS_BY_ID["pentacle"], { mount });
    plaque.group.updateMatrixWorld(true);
    const box = new THREE.Box3();
    for (const st of plaque.instance.strokes) box.expandByObject(st.mesh);
    const center = new THREE.Vector3();
    box.getCenter(center);
    assert.ok(center.length() < 0.05, `${mount}: strokes centered on the disc (got ${center.toArray().map((v) => v.toFixed(3))})`);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    const discR = mount === "worn" ? 0.13 : 0.27;
    assert.ok(sphere.radius <= discR + 0.01, `${mount}: strokes fit inside the disc (r ${sphere.radius.toFixed(3)} ≤ ${discR})`);
    const disc = plaque.group.children.find((o) => o.isMesh && o.geometry?.type === "CylinderGeometry");
    assert.ok(disc, `${mount}: plaque has a disc`);
    assert.equal(disc.castShadow, false, `${mount}: disc never shadows its own wall`);
    assert.ok(disc.material.emissiveIntensity > 0, `${mount}: disc carries a warm emissive floor (no black-void metal)`);
    // legibility floors: the inlay must survive a candlelit dusk room
    const rim = plaque.group.children.find((o) => o.isMesh && o.geometry?.type === "TorusGeometry");
    assert.ok(rim && rim.castShadow === false, `${mount}: gold rim frames the disc (shadow-free)`);
    const st = plaque.instance.strokes[0];
    st.geom.computeBoundingBox();
    const tubeDiameter = st.geom.boundingBox.max.z - st.geom.boundingBox.min.z;
    assert.ok(tubeDiameter >= 0.05, `${mount}: stroke weight ≥ 0.025 pre-scale (got ${tubeDiameter.toFixed(3)})`);
    const ink = st.mesh.material;
    assert.ok(ink.emissiveIntensity >= 0.4, `${mount}: stroke ink carries its own light (emissive ${ink.emissiveIntensity})`);
    // isolation is across plaques: behaviors mutate stroke material in place
    const twin = buildItem("symbol", SYMBOLS_BY_ID["pentacle"], { mount });
    assert.ok(!Object.is(ink, twin.instance.strokes[0].mesh.material), `${mount}: ink is per-plaque (behaviors mutate it in place)`);
    twin.instance.dispose();
  }
});

console.log(`\nRESULT: PASS — ${passed} workshop integration checks green\n`);
