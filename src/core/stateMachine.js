/**
 * src/core/stateMachine.js — the app's state machine (spec §6).
 *
 * Canonical flow:  THRESHOLD → CODEX → PLACING → BUILDING → RITUAL → SUMMARY
 * plus a SANDBOX **flag** (not a state) that marks free, consequence-free
 * arrangement practice inside PLACING/BUILDING.
 *
 * Contract:
 *  - Transitions are DECLARED, not emergent: anything not listed in
 *    TRANSITIONS is refused. Refusals are gentle ("the altar isn't ready
 *    for that yet — …") and are announced on the bus; the machine never
 *    throws and never scolds.
 *  - SANDBOX is toggled only while in PLACING or BUILDING. In sandbox,
 *    BUILDING leads to SUMMARY directly and RITUAL is closed (a practice
 *    arrangement is not a performed ritual).
 *  - Every accepted change emits STATE_CHANGE; every refusal emits
 *    STATE_REFUSED + APP_NOTICE. UIs render from these events only.
 */

import { EVENTS, NOTICE_TONES } from "./events.js";

/** The six states, in canonical flow order. */
export const STATES = Object.freeze([
  "THRESHOLD",
  "CODEX",
  "PLACING",
  "BUILDING",
  "RITUAL",
  "SUMMARY",
]);

/** Where SANDBOX may be toggled. */
const SANDBOX_TOGGLE_STATES = Object.freeze(["PLACING", "BUILDING"]);

/** One-line, user-facing description of what each state is FOR. */
export const STATE_DESCRIPTION = Object.freeze({
  THRESHOLD: "The doorway. Pause here before entering the Codex.",
  CODEX: "Read the lore: symbols, tools, zones, rituals, and their sources.",
  PLACING: "Choose what will stand on the altar, and where it may stand.",
  BUILDING: "Arrange the altar. Everything stays adjustable here.",
  RITUAL: "Walk the ritual step by step, guided and unhurried.",
  SUMMARY: "Look back on what was made, with a record to keep.",
});

/**
 * Gentle refusal copy, keyed by reason code. Tone rule: aligned-with-flow
 * guidance, never correct/wrong language (spec §5 honesty rules).
 */
const REFUSAL_COPY = Object.freeze({
  "unknown-state": "That path isn't part of the altar's map, so nothing moved.",
  "no-path": "The altar isn't ready for that yet — try the highlighted steps first.",
  "sandbox-no-ritual":
    "This is a sandbox arrangement — ritual steps are set aside. Leaving sandbox opens the ritual path again.",
  "summary-needs-ritual":
    "The summary comes after a ritual is performed — or switch on sandbox to summarize a practice arrangement.",
  "sandbox-state":
    "Sandbox can change only while arranging or placing — finish what you're in first.",
});

/** Declared edges. `guard` returns true, or a reason code string. */
const TRANSITIONS = Object.freeze({
  THRESHOLD: [{ to: "CODEX" }],
  CODEX: [{ to: "THRESHOLD" }, { to: "PLACING" }],
  PLACING: [{ to: "CODEX" }, { to: "BUILDING" }, { to: "RITUAL" }], // resume a mid-flight ritual
  BUILDING: [
    { to: "PLACING" },
    { to: "RITUAL", guard: (m) => (m.sandbox ? "sandbox-no-ritual" : true) },
    { to: "SUMMARY", guard: (m) => (m.sandbox ? true : "summary-needs-ritual") },
  ],
  RITUAL: [{ to: "BUILDING" }, { to: "SUMMARY" }, { to: "PLACING" }], // a step may ask for an object to be placed
  SUMMARY: [{ to: "CODEX" }, { to: "THRESHOLD" }],
});

export class StateMachine {
  /** @param {import("./eventBus.js").EventBus} bus */
  constructor(bus) {
    this.bus = bus;
    this._state = "THRESHOLD";
    this._sandbox = false;
  }

  get state() {
    return this._state;
  }

  get sandbox() {
    return this._sandbox;
  }

  /** true if `to` is reachable now; otherwise a reason-code string. */
  can(to) {
    if (!STATES.includes(to)) return "unknown-state";
    const edges = TRANSITIONS[this._state] ?? [];
    const edge = edges.find((e) => e.to === to);
    if (!edge) return "no-path";
    if (edge.guard) {
      const verdict = edge.guard(this);
      if (verdict !== true) return verdict;
    }
    return true;
  }

  /**
   * Attempt a transition. Returns true and emits STATE_CHANGE on success;
   * returns false and emits STATE_REFUSED + APP_NOTICE otherwise.
   */
  transition(to) {
    const from = this._state;
    const verdict = this.can(to);
    if (verdict !== true) {
      this.bus.emit(EVENTS.STATE_REFUSED, { from, to, reason: verdict });
      this.bus.emit(EVENTS.APP_NOTICE, {
        text: REFUSAL_COPY[verdict] ?? REFUSAL_COPY["no-path"],
        tone: NOTICE_TONES.GENTLE,
      });
      return false;
    }
    this._state = to;
    this.bus.emit(EVENTS.STATE_CHANGE, { from, to, sandbox: this._sandbox });
    return true;
  }

  /**
   * Toggle the SANDBOX flag. Allowed only in PLACING/BUILDING; refusals are
   * gentle and announced. Returns the new flag value.
   */
  setSandbox(flag) {
    if (!SANDBOX_TOGGLE_STATES.includes(this._state)) {
      this.bus.emit(EVENTS.STATE_REFUSED, {
        from: this._state,
        to: this._state,
        reason: "sandbox-state",
      });
      this.bus.emit(EVENTS.APP_NOTICE, {
        text: REFUSAL_COPY["sandbox-state"],
        tone: NOTICE_TONES.GENTLE,
      });
      return this._sandbox;
    }
    if (this._sandbox === flag) return this._sandbox;
    this._sandbox = Boolean(flag);
    this.bus.emit(EVENTS.SANDBOX_CHANGE, { sandbox: this._sandbox, state: this._state });
    return this._sandbox;
  }

  /** Hard reset to the doorway (used by "begin anew" and by tests). */
  reset() {
    const from = this._state;
    const sandbox = this._sandbox;
    this._state = "THRESHOLD";
    this._sandbox = false;
    this.bus.emit(EVENTS.SANDBOX_CHANGE, { sandbox: false, state: "THRESHOLD" });
    this.bus.emit(EVENTS.STATE_CHANGE, { from, to: "THRESHOLD", sandbox: false, reset: true });
    void sandbox;
  }

  /** Edges reachable from `state` right now (for rendering nav affordances). */
  edgesFrom(state = this._state) {
    return (TRANSITIONS[state] ?? []).map((e) => {
      const saved = this._state;
      this._state = state;
      const verdict = this.can(e.to);
      this._state = saved;
      return { to: e.to, open: verdict === true, reason: verdict === true ? null : verdict };
    });
  }
}
