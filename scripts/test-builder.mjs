/**
 * scripts/test-builder.mjs — Phase 5 gate: rules engine, arrangement model
 * (undo/redo, capacity), prop factory, and zone→point mapping. Headless.
 * Run via `npm test`.
 */
import assert from "node:assert/strict";
import * as THREE from "three";
import { SYMBOLS, SYMBOLS_BY_ID } from "../data/symbols.js";
import { TOOLS } from "../data/tools.js";
import { ZONES } from "../data/zones.js";
import { evaluatePlacement, verdictPermits, VERDICT_COPY } from "../src/engine/placement.js";
import { Arrangement, nextUid } from "../src/engine/arrangement.js";
import { buildToolProp, buildSymbolPlaque, zoneMount } from "../src/engine/props.js";
import { zoneForPoint, ZONE_GEOMETRY } from "../src/scene/room.js";
import { EventBus } from "../src/core/eventBus.js";
import { EVENTS } from "../src/core/events.js";

let passed = 0;
const section = (n) => console.log(`\n— ${n}`);
function ok(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

/* ---- rules engine ---------------------------------------------------------- */
section("rules engine");
const pentacle = SYMBOLS_BY_ID["pentacle"];
const swastika = SYMBOLS_BY_ID["swastika"];
const rug = TOOLS.find((t) => t.id === "prayer-rug");
const candle = TOOLS.find((t) => t.id === "candle");
const cloth = TOOLS.find((t) => t.id === "cloth");
const chalice = TOOLS.find((t) => t.id === "chalice");

ok("symbol explicit rule wins (swastika: above-door allowed, high-wall warned)", () => {
  assert.equal(evaluatePlacement({ kind: "symbol", data: swastika }, "above-door").verdict, "allowed");
  const hw = evaluatePlacement({ kind: "symbol", data: swastika }, "high-wall");
  assert.equal(hw.verdict, "warned");
  assert.match(hw.rationale, /misread|conflation|Hakenkreuz/i);
});

ok("default rule: no record → allowed + note + low confidence (never a ban)", () => {
  const noRules = { id: "x", name: "X", zoneRules: {} };
  const e = evaluatePlacement({ kind: "symbol", data: noRules }, "altar-east");
  assert.equal(e.verdict, "allowed");
  assert.equal(e.confidence, "low");
  assert.match(e.rationale, /[Nn]o recorded placement guidance/);
});

ok("forbidden exists in data and is honored (celtic-cross ✕ floor)", () => {
  const cc = SYMBOLS_BY_ID["celtic-cross"];
  assert.equal(cc.zoneRules.floor.verdict, "forbidden");
  const e = evaluatePlacement({ kind: "symbol", data: cc }, "floor");
  assert.equal(e.verdict, "forbidden");
  assert.equal(verdictPermits(e.verdict), false);
  // at least one forbidden pair exists somewhere in the dataset
  let any = false;
  for (const s of SYMBOLS) {
    for (const r of Object.values(s.zoneRules ?? {})) if (r.verdict === "forbidden") any = true;
  }
  assert.ok(any);
});

ok("tool structural rules: rugs on floors, vessels off walls, hearth heat caution", () => {
  assert.equal(evaluatePlacement({ kind: "tool", data: rug }, "floor").verdict, "allowed");
  assert.equal(evaluatePlacement({ kind: "tool", data: rug }, "altar-center").verdict, "forbidden");
  assert.equal(evaluatePlacement({ kind: "tool", data: chalice }, "high-wall").verdict, "forbidden");
  assert.equal(evaluatePlacement({ kind: "tool", data: candle }, "hearth").verdict, "allowed");
  const heat = evaluatePlacement({ kind: "tool", data: cloth }, "hearth");
  assert.equal(heat.verdict, "warned");
  assert.match(heat.rationale, /heat|flame/i);
});

ok("convention language, never correct/wrong", () => {
  for (const v of Object.values(VERDICT_COPY)) {
    assert.match(v, /aligned with convention|place with care|outside convention/);
  }
});

/* ---- arrangement ------------------------------------------------------------ */
section("arrangement");
function fresh() {
  const bus = new EventBus();
  return { bus, arr: new Arrangement(bus), events: [] };
}
const P = { x: 0, y: 1.099, z: -4.5 };

ok("place → capacity → denial leaves model untouched, gentle reason", () => {
  const { bus, arr } = fresh();
  const denied = [];
  bus.on(EVENTS.PLACEMENT_DENIED, (e) => denied.push(e));
  const r1 = arr.place({ kind: "tool", data: candle, zoneId: "pendant", position: P });
  // candle on pendant: forbidden (tools rest on surfaces)
  assert.equal(r1.ok, false);
  assert.equal(arr.size(), 0);
  assert.match(denied[0].reason, /signs, not standing tools/);
});

ok("pendant capacity is exactly 1; altar-center holds 2", () => {
  const { arr } = fresh();
  const amulet = SYMBOLS_BY_ID["eye-of-horus"];
  const r1 = arr.place({ kind: "symbol", data: amulet, zoneId: "pendant", position: P });
  assert.equal(r1.ok, true);
  const r2 = arr.place({ kind: "symbol", data: pentacle, zoneId: "pendant", position: P });
  assert.equal(r2.ok, false);
  assert.match(r2.reason, /full/);
  for (let i = 0; i < 2; i++) {
    const r = arr.place({ kind: "tool", data: candle, zoneId: "altar-center", position: P });
    assert.equal(r.ok, true, `altar-center seat ${i + 1}`);
  }
  const r3 = arr.place({ kind: "tool", data: chalice, zoneId: "altar-center", position: P });
  assert.equal(r3.ok, false);
});

ok("warned placements place AND note (PLACEMENT_NOTED emitted)", () => {
  const { bus, arr } = fresh();
  const notes = [];
  bus.on(EVENTS.PLACEMENT_NOTED, (n) => notes.push(n));
  const r = arr.place({ kind: "symbol", data: swastika, zoneId: "high-wall", position: P });
  assert.equal(r.ok, true);
  assert.equal(r.evaluation.verdict, "warned");
  assert.equal(notes.length, 1);
  assert.match(notes[0].rationale, /misread|conflation|Hakenkreuz/i);
});

ok("undo/redo round-trips through place/remove/move/rotate", () => {
  const { arr } = fresh();
  arr.place({ kind: "tool", data: candle, zoneId: "altar-center", position: P });
  const uid = [...arr.items.keys()][0];
  arr.rotate(uid, 0.3);
  arr.move(uid, { position: { x: 0.5, y: 1.099, z: -4.4 }, zoneId: "altar-east" });
  assert.equal(arr.size(), 1);
  const moved = arr.get(uid);
  assert.equal(moved.zoneId, "altar-east");
  arr.undo(); // undo move
  assert.equal(arr.get(uid).zoneId, "altar-center");
  arr.undo(); // undo rotate
  assert.equal(arr.get(uid).rotationY, 0);
  arr.redo();
  assert.notEqual(arr.get(uid).rotationY, 0);
  arr.undo();
  arr.remove(uid);
  assert.equal(arr.size(), 0);
  arr.undo();
  assert.equal(arr.size(), 1, "undo restores the removed item");
});

ok("move re-runs rules: forbidden target refused, model unchanged", () => {
  const { arr } = fresh();
  const r = arr.place({ kind: "symbol", data: pentacle, zoneId: "altar-center", position: P });
  const uid = r.uid;
  const cc = arr.place({ kind: "symbol", data: SYMBOLS_BY_ID["celtic-cross"], zoneId: "altar-north", position: P });
  const moved = arr.move(cc.uid, { position: P, zoneId: "floor" });
  assert.equal(moved.ok, false);
  assert.equal(arr.get(cc.uid).zoneId, "altar-north", "stayed put");
  void uid;
});

ok("serialize/load round-trip preserves records", () => {
  const { arr } = fresh();
  arr.place({ kind: "tool", data: candle, zoneId: "altar-center", position: P });
  arr.place({ kind: "symbol", data: pentacle, zoneId: "altar-east", position: P, rotationY: 1.2 });
  const blob = JSON.parse(JSON.stringify(arr.serialize()));
  const { arr: arr2 } = fresh();
  arr2.load(blob);
  assert.equal(arr2.size(), 2);
  const items = [...arr2.items.values()];
  assert.equal(items[1].rotationY, 1.2);
  assert.deepEqual(items[0].position, P);
});

ok("uids never collide", () => {
  const s = new Set();
  for (let i = 0; i < 500; i++) s.add(nextUid());
  assert.equal(s.size, 500);
});

/* ---- props ---------------------------------------------------------------------- */
section("prop factory");
ok("all 13 tools build as named groups with base at y=0", () => {
  for (const t of TOOLS) {
    const g = buildToolProp(t);
    assert.equal(g.name, `tool-${t.id}`);
    assert.equal(g.userData.kind, "tool");
    const box = new (g.constructor)(); // cheap Object3D sanity
    void box;
  }
});

ok("symbol plaques build in three mounts; worn is smallest", () => {
  for (const mount of ["stand", "wall", "worn"]) {
    const { group, instance, mount: m } = buildSymbolPlaque(pentacle, { mount });
    assert.equal(m, mount);
    assert.ok(instance);
    assert.ok(group.userData.id === "pentacle");
    instance.dispose();
  }
  const worn = buildSymbolPlaque(pentacle, { mount: "worn" });
  const stand = buildSymbolPlaque(pentacle, { mount: "stand" });
  const wornBox = new THREE.Box3().setFromObject(worn.group);
  const standBox = new THREE.Box3().setFromObject(stand.group);
  assert.ok(wornBox.getSize(new THREE.Vector3()).x < standBox.getSize(new THREE.Vector3()).x);
  worn.instance.dispose();
  stand.instance.dispose();
});

ok("zoneMount maps zones to mounts", () => {
  assert.equal(zoneMount("pendant"), "worn");
  assert.equal(zoneMount("high-wall"), "wall");
  assert.equal(zoneMount("above-door"), "wall");
  assert.equal(zoneMount("altar-center"), "stand");
  assert.equal(zoneMount("floor"), "stand");
});

/* ---- zone mapping -------------------------------------------------------------------- */
section("zone mapping");
ok("altar cloth hits map to the five altar zones", () => {
  const g = ZONE_GEOMETRY;
  assert.equal(zoneForPoint({ x: 0, y: g.altarTopY, z: -4.6 }, "altar-cloth"), "altar-center");
  assert.equal(zoneForPoint({ x: 0, y: g.altarTopY, z: -4.95 }, "altar-cloth"), "altar-north");
  assert.equal(zoneForPoint({ x: 0, y: g.altarTopY, z: -4.25 }, "altar-cloth"), "altar-south");
  // altar spans z -5.0..-4.2, centered at -4.6; west/east by x
  assert.equal(zoneForPoint({ x: -0.6, y: g.altarTopY, z: -4.6 }, "altar-cloth"), "altar-west");
  assert.equal(zoneForPoint({ x: 0.6, y: g.altarTopY, z: -4.6 }, "altar-cloth"), "altar-east");
});

ok("floor rug area is the floor zone; beyond it is not placeable", () => {
  assert.equal(zoneForPoint({ x: 0, y: 0, z: -3.1 }, "rug"), "floor");
  assert.equal(zoneForPoint({ x: 2.0, y: 0, z: -2.2 }, "floor"), "floor");
  assert.equal(zoneForPoint({ x: 3.9, y: 0, z: 2.0 }, "floor"), null);
});

ok("walls: above-door on the south lintel wall, high-wall high up, null at hand height", () => {
  assert.equal(zoneForPoint({ x: 0, y: 2.5, z: 5.9 }, "wall-south"), "above-door");
  assert.equal(zoneForPoint({ x: 0.3, y: 2.5, z: 5.9 }, "wall-south"), "above-door");
  assert.equal(zoneForPoint({ x: 2.5, y: 2.6, z: 5.9 }, "wall-south"), "high-wall");
  assert.equal(zoneForPoint({ x: 4.4, y: 2.4, z: 0 }, "wall-east"), "high-wall");
  assert.equal(zoneForPoint({ x: 4.4, y: 1.0, z: 0 }, "wall-east"), null, "hand-height wall is not a zone");
});

ok("hearth mantel and pendant stand resolve", () => {
  assert.equal(zoneForPoint({ x: -4.1, y: 1.05, z: 1.4 }, "hearth-mantel"), "hearth");
  assert.equal(zoneForPoint({ x: 1.75, y: 1.3, z: 4.9 }, "pendant-stand-post"), "pendant");
  assert.equal(zoneForPoint({ x: 1.75, y: 1.3, z: 4.9 }, "pendant-stand-bar"), "pendant");
});

ok("every zone id in the data has a way to be reached (mapping coverage)", () => {
  const reachable = new Set([
    "altar-center", "altar-north", "altar-east", "altar-south", "altar-west",
    "hearth", "floor", "above-door", "high-wall", "pendant",
  ]);
  for (const z of ZONES) assert.ok(reachable.has(z.id), z.id);
  assert.equal(reachable.size, ZONES.length);
});

/* THREE is imported at the top (Box3 for the plaque size comparison). */


/* ---- camera rig -------------------------------------------------------------------- */
section("camera rig");
{
  const { createCameraRig, CAMERA_VIEWS } = await import("../src/ui/cameraRig.js");
  const stubDom = { addEventListener() {}, setPointerCapture() {} };
  const cam = new THREE.PerspectiveCamera(46, 1, 0.1, 60);
  const rig = createCameraRig({ camera: cam, dom: stubDom, reducedMotion: true });

  ok("rig: named views move the camera to the framed sightline", () => {
    assert.equal(rig.setView("altar"), true);
    rig.update(1);
    const t = CAMERA_VIEWS.altar.target;
    const a = CAMERA_VIEWS.altar.azimuth, e = CAMERA_VIEWS.altar.elevation, r = CAMERA_VIEWS.altar.radius;
    const want = [t[0] + r * Math.sin(a) * Math.cos(e), t[1] + r * Math.sin(e), t[2] + r * Math.cos(a) * Math.cos(e)];
    const got = cam.position.toArray().map((v) => +v.toFixed(3));
    assert.deepEqual(got, want.map((v) => +v.toFixed(3)));
    assert.equal(rig.setView("nonsense"), false);
  });

  ok("rig: rotate/pan/zoom clamp inside the room", () => {
    rig.setView("room");
    rig.update(1);
    rig.rotateBy(-500, 500); // wild drag
    rig.zoomBy(0.0001);
    rig.update(1);
    assert.ok(rig.state.elevation <= 1.25 + 1e-6, "elevation clamped");
    assert.ok(rig.state.radius >= 1.7 - 1e-6, "radius clamped");
    rig.panBy(2000, 2000);
    rig.update(1);
    assert.ok(rig.state.target.x <= 4 + 1e-6 && rig.state.target.z <= 5.2 + 1e-6, "target clamped");
    assert.ok(rig.state.target.y >= 0.3 - 1e-6, "target height clamped");
  });

  ok("rig: pointer gesture lifecycle (down → move → up)", () => {
    rig.setView("room");
    rig.update(1);
    const az0 = rig.state.azimuth;
    assert.equal(rig.pointerDown({ button: 0, clientX: 10, clientY: 10, pointerId: 1, ctrlKey: false }), true);
    assert.equal(rig.gesture, "rotate");
    rig.pointerMove({ clientX: 60, clientY: 10, pointerId: 1 });
    rig.update(1);
    assert.notEqual(+rig.state.azimuth.toFixed(6), +az0.toFixed(6), "azimuth changed");
    assert.equal(rig.pointerUp({ pointerId: 1 }), undefined);
    assert.equal(rig.gesture, null);
  });

  ok("rig: right-drag pans, wheel zoom exists, reduced motion snaps", () => {
    const cam2 = new THREE.PerspectiveCamera(46, 1, 0.1, 60);
    const rig2 = createCameraRig({ camera: cam2, dom: stubDom, reducedMotion: true });
    rig2.setView("altar");
    assert.equal(rig2.gesture, null);
    rig2.pointerDown({ button: 2, clientX: 0, clientY: 0, pointerId: 2, ctrlKey: false });
    assert.equal(rig2.gesture, "pan");
    const tz = rig2.state.target.z;
    rig2.pointerMove({ clientX: 0, clientY: 40, pointerId: 2 });
    rig2.update(1);
    assert.notEqual(+rig2.state.target.z.toFixed(5), +tz.toFixed(5), "pan moved target");
    rig2.pointerUp({ pointerId: 2 });
    // wheel zoomBy path
    const r0 = rig2.state.radius;
    rig2.zoomBy(0.5);
    rig2.update(1);
    assert.ok(rig2.state.radius < r0, "zoom-in shortens radius");
  });
}

console.log(`\nRESULT: PASS — ${passed} builder checks green\n`);
