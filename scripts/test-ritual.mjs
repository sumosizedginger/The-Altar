/**
 * scripts/test-ritual.mjs — Phase 6 gate: ritual runner logic + the
 * procedural audio engine (against a recording stub AudioContext).
 * Run via `npm test`.
 */
import assert from "node:assert/strict";
import { RITUALS } from "../data/rituals.js";
import { TOOLS } from "../data/tools.js";
import { SYMBOLS_BY_ID } from "../data/symbols.js";
import { RitualRunner } from "../src/engine/ritual.js";
import { Arrangement } from "../src/engine/arrangement.js";
import { createAudioEngine, SYNTH_TYPES } from "../src/audio/audioEngine.js";
import { EventBus } from "../src/core/eventBus.js";
import { EVENTS } from "../src/core/events.js";

let passed = 0;
const section = (n) => console.log(`\n— ${n}`);
function ok(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}
const P = { x: 0, y: 1.1, z: -4.6 };
const RITUAL_BY_ID = Object.fromEntries(RITUALS.map((r) => [r.id, r]));
const TOOL = Object.fromEntries(TOOLS.map((t) => [t.id, t]));

function freshRunner(ritualId, bus) {
  const arrangement = new Arrangement(bus);
  const runner = new RitualRunner({ ritual: RITUAL_BY_ID[ritualId], arrangement, bus });
  return { arrangement, runner };
}

/* ---- ritual runner --------------------------------------------------------- */
section("ritual runner");
ok("ritual starts at step 0 and announces itself", () => {
  const bus = new EventBus();
  const seen = [];
  bus.on(EVENTS.RITUAL_START, (e) => seen.push(e));
  bus.on(EVENTS.RITUAL_STEP, (e) => seen.push(`step:${e.index}`));
  const { runner } = freshRunner("opening-the-space", bus);
  assert.equal(runner.step.id, "ots-1-cloth");
  assert.equal(runner.stepIndex, 0);
  assert.ok(seen.includes("step:0"));
  void runner;
});

ok("missing required object → gentle refusal with concrete guidance", () => {
  const bus = new EventBus();
  const { runner } = freshRunner("opening-the-space", bus);
  const r = runner.attempt("click");
  assert.equal(r.ok, false);
  assert.match(r.reason, /place .*cloth/i);
  assert.equal(runner.stepIndex, 0, "state untouched on refusal");
});

ok("placing the right object in the right zone completes the step", () => {
  const bus = new EventBus();
  const { arrangement, runner } = freshRunner("opening-the-space", bus);
  arrangement.place({ kind: "tool", data: TOOL["cloth"], zoneId: "altar-center", position: P });
  const r = runner.attempt("click");
  assert.equal(r.ok, true);
  assert.equal(runner.step.id, "ots-2-flame");
});

ok("wrong zone refuses (four-quarters: salt belongs north)", () => {
  const bus = new EventBus();
  const { arrangement, runner } = freshRunner("four-quarters", bus);
  // skip nothing: walk the steps by placing each in turn; step 0 is salt in altar-north
  arrangement.place({ kind: "tool", data: TOOL["salt-dish"], zoneId: "altar-center", position: P });
  const r = runner.attempt("click");
  assert.equal(r.ok, false);
  assert.match(r.reason, /altar north/i);
  arrangement.place({ kind: "tool", data: TOOL["salt-dish"], zoneId: "altar-north", position: P });
  assert.equal(runner.attempt("click").ok, true);
});

ok("substitutes count (singing-bowl stands in for the bell)", () => {
  const bus = new EventBus();
  const { arrangement, runner } = freshRunner("opening-the-space", bus);
  // fast-forward: cloth + candle
  arrangement.place({ kind: "tool", data: TOOL["cloth"], zoneId: "altar-center", position: P });
  runner.attempt("click");
  arrangement.place({ kind: "tool", data: TOOL["candle"], zoneId: "altar-center", position: P });
  runner.attempt("click");
  // step 3 is the bell with substitute singing-bowl
  assert.equal(runner.step.id, "ots-3-sound");
  arrangement.place({ kind: "tool", data: TOOL["singing-bowl"], zoneId: "altar-west", position: P });
  const r = runner.attempt("ring");
  assert.equal(r.ok, true, "substitute accepted");
});

ok("trace step requires a placed symbol", () => {
  const bus = new EventBus();
  const { arrangement, runner } = freshRunner("opening-the-space", bus);
  // walk to step 4 (trace): cloth + candle in the center, bell anywhere (no zone named)
  const walkZones = { cloth: "altar-center", candle: "altar-center", bell: "altar-east" };
  for (const id of ["cloth", "candle", "bell"]) {
    arrangement.place({ kind: "tool", data: TOOL[id], zoneId: walkZones[id], position: P });
    runner.attempt("click");
  }
  assert.equal(runner.step.action, "trace");
  const r0 = runner.attempt("trace");
  assert.equal(r0.ok, false);
  arrangement.place({ kind: "symbol", data: SYMBOLS_BY_ID["pentacle"], zoneId: "altar-east", position: P });
  assert.equal(runner.attempt("trace").ok, true);
});

ok("wait steps complete by time; ritual completes and reports", () => {
  const bus = new EventBus();
  const done = [];
  bus.on(EVENTS.RITUAL_COMPLETE, (e) => done.push(e));
  const { arrangement, runner } = freshRunner("opening-the-space", bus);
  const walkZones = { cloth: "altar-center", candle: "altar-center", bell: "altar-east" };
  for (const id of ["cloth", "candle", "bell"]) {
    arrangement.place({ kind: "tool", data: TOOL[id], zoneId: walkZones[id], position: P });
    runner.attempt("click");
  }
  arrangement.place({ kind: "symbol", data: SYMBOLS_BY_ID["pentacle"], zoneId: "altar-east", position: P });
  runner.attempt("trace");
  assert.equal(runner.step.action, "wait");
  assert.equal(runner.step.waitSec, 12);
  let out = runner.update(6);
  assert.ok(out.waitRemaining > 0);
  runner.update(6.5);
  assert.equal(runner.finished, true);
  assert.equal(done.length, 1);
  assert.equal(runner.record.steps.length, 5);
});

ok("skip works only where the data allows; skipped steps are recorded", () => {
  const bus = new EventBus();
  const { arrangement, runner } = freshRunner("evening-flame", bus);
  // ef-1 allows skip
  const r = runner.skip();
  assert.equal(r.ok, true);
  assert.equal(runner.step.id, "ef-2-smoke");
  // walk to ef-5 (skipAllowed: false)
  for (const [id, zone] of [["water-bowl", "altar-west"], ["incense-burner", "altar-center"], ["singing-bowl", "altar-center"]]) {
    arrangement.place({ kind: "tool", data: TOOL[id], zoneId: zone, position: P });
    runner.attempt("click");
  }
  arrangement.place({ kind: "symbol", data: SYMBOLS_BY_ID["triquetra"], zoneId: "altar-east", position: P });
  runner.attempt("trace");
  assert.equal(runner.step.id, "ef-5-close");
  const r5 = runner.skip();
  assert.equal(r5.ok, false);
  assert.match(r5.reason, /cannot be skipped/);
  // the candle placed completes the ritual (ef-5 names no zone; center is full anyway)
  arrangement.place({ kind: "tool", data: TOOL["candle"], zoneId: "altar-east", position: P });
  assert.equal(runner.attempt("click").ok, true);
  assert.equal(runner.finished, true);
  assert.ok(runner.record.steps.some((s) => s.skipped), "skip recorded");
});

ok("hints fire after the data's delay, once per step", () => {
  const bus = new EventBus();
  const { runner } = freshRunner("opening-the-space", bus);
  const first = runner.update(25);
  assert.equal(first.hint, runner.step.hint.text);
  const again = runner.update(25);
  assert.equal(again.hint, undefined, "hint fires once");
});

/* ---- audio engine ------------------------------------------------------------ */
section("audio engine");

/** Recording stub of the WebAudio graph (enough for our recipes). */
function fakeCtxFactory() {
  const log = { nodes: [], connections: 0, panners: [], listenerSets: 0 };
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
    setTargetAtTime(v) {
      this.value = v;
    },
    cancelScheduledValues() {},
  });
  const mkNode = (kind, extra = {}) => {
    const node = { kind, connect() { log.connections++; return node; }, ...extra };
    log.nodes.push(node);
    return node;
  };
  const ctx = {
    currentTime: 0,
    sampleRate: 48000,
    state: "running",
    destination: { kind: "destination" },
    resume() {
      ctx.state = "running";
    },
    close() {},
    createGain: () => mkNode("gain", { gain: param() }),
    createOscillator: () =>
      mkNode("osc", {
        type: "sine",
        frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        start() {},
        stop() {},
      }),
    createBiquadFilter: () =>
      mkNode("filter", {
        type: "bandpass",
        frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        Q: param(),
      }),
    createBufferSource: () => mkNode("buffer", { buffer: null, loop: false, start() {}, stop() {} }),
    createBuffer: (ch, len) => ({ getChannelData: () => new Float32Array(len) }),
    createPanner: () => {
      const p = mkNode("panner", {
        panningModel: "",
        distanceModel: "",
        refDistance: 0,
        maxDistance: 0,
        rolloffFactor: 0,
        positionX: param(),
        positionY: param(),
        positionZ: param(),
      });
      log.panners.push(p);
      return p;
    },
    createDynamicsCompressor: () => mkNode("comp", { threshold: param(), ratio: param() }),
    listener: {
      positionX: param(),
      positionY: param(),
      positionZ: param(),
      forwardX: param(),
      forwardY: param(),
      forwardZ: param(),
      upX: param(),
      upY: param(),
      upZ: param(),
    },
  };
  return { ctx, log };
}

ok("unlock creates the graph; master reaches destination through a compressor", () => {
  const { ctx, log } = fakeCtxFactory();
  const engine = createAudioEngine({ ctxFactory: () => ctx });
  assert.equal(engine.unlock(), true);
  assert.equal(engine.enabled, true);
  assert.ok(log.nodes.some((n) => n.kind === "comp"), "compressor in the chain");
  assert.ok(log.connections >= 2);
});

ok("every synth recipe family plays through a positioned panner", () => {
  const { ctx, log } = fakeCtxFactory();
  const engine = createAudioEngine({ ctxFactory: () => ctx });
  engine.unlock();
  const pos = { x: 0.4, y: 1.2, z: -4.6 };
  for (const type of SYNTH_TYPES) {
    const res = engine.playAt(type, pos, { level: 1 });
    assert.ok(res, `${type} played`);
  }
  assert.equal(log.panners.length, SYNTH_TYPES.length);
  assert.equal(log.panners[0].positionX.value, 0.4, "panner positioned at the item");
  assert.equal(engine.playAt("no-such-synth", pos), false, "unknown synth refused");
});

ok("looped recipes take a seconds budget; one-shots do not need one", () => {
  const { ctx } = fakeCtxFactory();
  const engine = createAudioEngine({ ctxFactory: () => ctx });
  engine.unlock();
  assert.ok(engine.playAt("flame", null, { seconds: 3 }));
  assert.ok(engine.playAt("bell", null));
});

ok("listener follows the camera", () => {
  const { ctx } = fakeCtxFactory();
  const engine = createAudioEngine({ ctxFactory: () => ctx });
  engine.unlock();
  engine.updateListener(
    { x: 1, y: 1.6, z: 4 },
    { x: 0, y: 0, z: -1 },
    { x: 0, y: 1, z: 0 },
  );
  assert.equal(ctx.listener.positionX.value, 1);
  assert.equal(ctx.listener.forwardZ.value, -1);
});

ok("audio is safe when the browser offers none", () => {
  const engine = createAudioEngine({ ctxFactory: null });
  assert.equal(engine.unlock(), false);
  assert.equal(engine.enabled, false);
  assert.equal(engine.playAt("bell", null), false, "silent room, unbroken page");
  engine.updateListener({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 });
});

ok("tool sound types all map onto implemented recipes", () => {
  const types = new Set(TOOLS.map((t) => t.sound?.type).filter(Boolean));
  for (const t of types) assert.ok(SYNTH_TYPES.includes(t), `${t} implemented`);
});

console.log(`\nRESULT: PASS — ${passed} ritual/audio checks green\n`);
