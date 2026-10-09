/**
 * scripts/test-core.mjs — Phase 3 gate for the core (bus + state machine).
 * Zero dependencies: node:assert only. Run with `npm test`.
 */
import assert from "node:assert/strict";
import { EventBus, assertEventDeclared } from "../src/core/eventBus.js";
import { EVENTS } from "../src/core/events.js";
import { StateMachine, STATES } from "../src/core/stateMachine.js";
import { createApp } from "../src/core/app.js";

let passed = 0;
const section = (name) => console.log(`\n— ${name}`);

function ok(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

/* ---- event bus ------------------------------------------------------- */
section("event bus");
{
  const bus = new EventBus();
  ok("on/emit returns listener count", () => {
    let got = null;
    const off = bus.on("test:a", (d) => (got = d));
    assert.equal(bus.emit("test:a", 41), 1);
    assert.equal(got, 41);
    off();
    assert.equal(bus.emit("test:a", 42), 0);
    assert.equal(got, 41, "off() really unsubscribed");
  });

  ok("once fires exactly once", () => {
    const bus = new EventBus();
    let n = 0;
    bus.once("test:b", () => ++n);
    bus.emit("test:b");
    bus.emit("test:b");
    assert.equal(n, 1);
  });

  ok("ordered, synchronous delivery", () => {
    const bus = new EventBus();
    const order = [];
    bus.on("test:c", () => order.push(1));
    bus.on("test:c", () => order.push(2));
    bus.emit("test:c");
    assert.deepEqual(order, [1, 2]);
  });

  ok("listener isolation: a throwing listener doesn't stop the rest", () => {
    const bus = new EventBus();
    let reached = false;
    bus.on("test:d", () => {
      throw new Error("boom");
    });
    bus.on("test:d", () => (reached = true));
    assert.equal(bus.emit("test:d"), 2, "both listeners counted");
    assert.equal(reached, true);
  });

  ok("onAny sees every emission; history ring bounded", () => {
    const bus = new EventBus({ historyMax: 5 });
    const seen = [];
    const off = bus.onAny((type) => seen.push(type));
    for (let i = 0; i < 8; i++) bus.emit("test:e", i);
    assert.equal(seen.length, 8);
    off();
    assert.equal(bus.history().length, 5, "history capped at historyMax");
    assert.equal(bus.history(1)[0].data, 7, "history keeps newest");
  });

  ok("catalog audit accepts declared + debug:* only", () => {
    assertEventDeclared(EVENTS.STATE_CHANGE);
    assertEventDeclared("debug:scratch");
    assert.throws(() => assertEventDeclared("totally:undeclared"));
  });
}

/* ---- state machine ---------------------------------------------------- */
section("state machine");
function freshMachine() {
  const bus = new EventBus();
  return { bus, machine: new StateMachine(bus) };
}

ok("starts at THRESHOLD; all six states declared", () => {
  const { machine } = freshMachine();
  assert.equal(machine.state, "THRESHOLD");
  assert.deepEqual([...STATES], ["THRESHOLD", "CODEX", "PLACING", "BUILDING", "RITUAL", "SUMMARY"]);
});

ok("canonical happy path walks the whole flow", () => {
  const { machine } = freshMachine();
  for (const to of ["CODEX", "PLACING", "BUILDING", "RITUAL", "SUMMARY"]) {
    assert.equal(machine.transition(to), true, `${machine.state} → ${to}`);
  }
  assert.equal(machine.state, "SUMMARY");
  assert.equal(machine.transition("CODEX"), true, "SUMMARY → CODEX to begin anew");
});

ok("undeclared jump refused, state unchanged, gentle notice emitted", () => {
  const { bus, machine } = freshMachine();
  const notices = [];
  bus.on(EVENTS.APP_NOTICE, (n) => notices.push(n));
  assert.equal(machine.transition("RITUAL"), false);
  assert.equal(machine.state, "THRESHOLD");
  assert.equal(notices.length, 1);
  assert.equal(notices[0].tone, "gentle");
  assert.match(notices[0].text, /ready|map/i, "refusal copy is guidance, not scolding");
});

ok("every STATE_CHANGE carries from/to/sandbox", () => {
  const { bus, machine } = freshMachine();
  const changes = [];
  bus.on(EVENTS.STATE_CHANGE, (e) => changes.push(e));
  machine.transition("CODEX");
  assert.deepEqual(changes[0], { from: "THRESHOLD", to: "CODEX", sandbox: false });
});

ok("sandbox closes RITUAL but opens SUMMARY from BUILDING", () => {
  const { bus, machine } = freshMachine();
  machine.transition("CODEX");
  machine.transition("PLACING");
  machine.setSandbox(true);
  machine.transition("BUILDING");
  assert.equal(machine.transition("RITUAL"), false, "sandbox build cannot become a ritual");
  assert.equal(machine.state, "BUILDING");
  assert.equal(machine.transition("SUMMARY"), true, "sandbox build summarizes directly");
});

ok("outside sandbox, BUILDING→SUMMARY is closed, RITUAL open", () => {
  const { machine } = freshMachine();
  machine.transition("CODEX");
  machine.transition("PLACING");
  machine.transition("BUILDING");
  assert.equal(machine.transition("SUMMARY"), false);
  assert.equal(machine.transition("RITUAL"), true);
});

ok("sandbox toggles only in PLACING/BUILDING", () => {
  const { machine } = freshMachine();
  assert.equal(machine.setSandbox(true), false, "refused at THRESHOLD");
  assert.equal(machine.sandbox, false);
  machine.transition("CODEX");
  machine.transition("PLACING");
  assert.equal(machine.setSandbox(true), true, "allowed in PLACING");
  machine.transition("BUILDING");
  assert.equal(machine.transition("RITUAL"), false, "RITUAL blocked while sandbox");
  machine.transition("SUMMARY");
  assert.equal(machine.setSandbox(false), true, "stays with the arrangement into SUMMARY");
});

ok("RITUAL can return to BUILDING (revise the arrangement)", () => {
  const { machine } = freshMachine();
  machine.transition("CODEX");
  machine.transition("PLACING");
  machine.transition("BUILDING");
  machine.transition("RITUAL");
  assert.equal(machine.transition("BUILDING"), true);
  assert.equal(machine.transition("RITUAL"), true);
  assert.equal(machine.transition("SUMMARY"), true);
});

ok("reset returns to THRESHOLD and clears sandbox", () => {
  const { bus, machine } = freshMachine();
  const changes = [];
  bus.on(EVENTS.STATE_CHANGE, (e) => changes.push(e));
  machine.transition("CODEX");
  machine.transition("PLACING");
  machine.setSandbox(true);
  machine.reset();
  assert.equal(machine.state, "THRESHOLD");
  assert.equal(machine.sandbox, false);
  assert.equal(changes.at(-1).to, "THRESHOLD");
});

ok("edgesFrom() reports open/closed doors for the nav UI", () => {
  const { machine } = freshMachine();
  machine.transition("CODEX");
  machine.transition("PLACING");
  machine.transition("BUILDING");
  const edges = machine.edgesFrom();
  assert.deepEqual(
    Object.fromEntries(edges.map((e) => [e.to, e.open])),
    { PLACING: true, RITUAL: true, SUMMARY: false },
    "non-sandbox BUILDING: RITUAL open, SUMMARY closed",
  );
});

/* ---- app shell -------------------------------------------------------- */
section("app shell");
ok("createApp wires one bus + one machine; APP_BOOT emitted once", () => {
  const boots = [];
  const bus = new EventBus();
  bus.on(EVENTS.APP_BOOT, () => boots.push(1));
  // createApp makes its OWN bus — boot count on that bus is what matters.
  const app = createApp();
  assert.equal(app.bus.listenerCount(EVENTS.APP_BOOT), 0);
  assert.equal(app.machine.state, "THRESHOLD");
  assert.equal(app.bus.history().filter((h) => h.type === EVENTS.APP_BOOT).length, 1);
  assert.equal(typeof app.stateDescription.BUILDING, "string");
  void boots;
});

ok("machine refusals surface on the app's bus (end-to-end)", () => {
  const app = createApp();
  const seen = [];
  app.bus.on(EVENTS.STATE_REFUSED, () => seen.push("refused"));
  app.bus.on(EVENTS.APP_NOTICE, (n) => seen.push(n.text));
  app.machine.transition("SUMMARY");
  assert.equal(app.machine.state, "THRESHOLD");
  assert.equal(seen[0], "refused", "STATE_REFUSED precedes the notice");
  assert.ok(seen[1].length > 10, "gentle notice text present");
});

console.log(`\nRESULT: PASS — ${passed} core checks green\n`);
