/**
 * src/engine/ritual.js — the Ritual runner (Phase 6).
 *
 * Pure logic over the ritual data (src/data/rituals.js) and the live
 * Arrangement. Rules honored from the data, never invented here:
 *   - requiredObjects + zone: the named tool(s) must sit in the named
 *     zone (any zone when the step names none); substitutes[] count;
 *   - requiresPlacedSymbol: any placed symbol satisfies a trace step;
 *   - skipAllowed only where the data says so — a skipped step is
 *     recorded as a note, never as failure;
 *   - wait steps advance by time (update(dt)); hints arrive after the
 *     step's hint.afterSec; there is no fail state anywhere.
 *
 * Sound, captions, and rendering are the UI layer's job; this module
 * emits bus events and keeps a restorable record.
 */

import { EVENTS } from "../core/events.js";

export class RitualRunner {
  /**
   * @param {{ritual:object, arrangement:object, bus:object, clock?:()=>number}} opts
   */
  constructor({ ritual, arrangement, bus, clock = () => 0 }) {
    this.ritual = ritual;
    this.arrangement = arrangement;
    this.bus = bus;
    this.clock = clock;
    this.index = 0;
    this.elapsed = 0; // seconds in the CURRENT step
    this.done = false;
    this.record = {
      ritualId: ritual.id,
      startedAt: new Date().toISOString(),
      steps: [],
      notes: [],
    };
    this._hintFired = new Set();
    bus.emit(EVENTS.RITUAL_START, { ritualId: ritual.id, stepCount: ritual.steps.length });
    bus.emit(EVENTS.RITUAL_STEP, { ritualId: ritual.id, index: 0, step: ritual.steps[0] });
  }

  get step() {
    return this.ritual.steps[this.index];
  }

  get stepIndex() {
    return this.index;
  }

  get finished() {
    return this.done;
  }

  /** Items in `zoneId` whose id is in `ids` (directly or as a substitute). */
  _findInZone(zoneId, ids, substitutes = []) {
    const wanted = new Set([...ids, ...substitutes]);
    const found = [];
    for (const it of this.arrangement.items.values()) {
      if (!wanted.has(it.id)) continue;
      if (!zoneId || it.zoneId === zoneId) found.push(it);
    }
    return found;
  }

  /**
   * Status of the current step's requirements.
   * @returns {{ready:boolean, missing:string[], needsPlace:boolean, anyPlaced:boolean}}
   */
  requirements() {
    const s = this.step;
    const missing = [];
    let needsPlace = false;
    let anyPlaced = false;

    for (const id of s.requiredObjects ?? []) {
      const direct = this._findInZone(s.zone, [id]);
      const sub = this._findInZone(s.zone, [id], s.substitutes ?? []);
      if (sub.length) {
        anyPlaced = true;
      } else {
        missing.push(id);
        if (s.missingObject === "prompt-place") needsPlace = true;
      }
      void direct;
    }
    if (s.requiresPlacedSymbol) {
      const symbols = [...this.arrangement.items.values()].filter((it) => it.kind === "symbol");
      if (!symbols.length) missing.push("(a placed symbol)");
      else anyPlaced = true;
    }
    return { ready: missing.length === 0, missing, needsPlace, anyPlaced };
  }

  /**
   * Attempt the current step. `via` names what the user did ("ring",
   * "pour", "click", "trace", "wait"). Non-wait steps only complete when
   * requirements are met; the refusal reason comes back so the UI stays
   * gentle and concrete.
   * @returns {{ok:boolean, reason?:string, caption?:string}}
   */
  attempt(via = "click") {
    if (this.done) return { ok: false, reason: "The sequence has already closed." };
    const s = this.step;
    if (s.action === "wait") {
      // wait steps complete by time, not by gesture
      return { ok: false, reason: "This step is rest itself — let the countdown finish, or skip it." };
    }
    const req = this.requirements();
    if (!req.ready) {
      const names = req.missing.map((m) => m.replace(/-/g, " ")).join(", ");
      const zoneBit = s.zone ? ` in ${s.zone.replace(/-/g, " ")}` : "";
      return {
        ok: false,
        reason: req.needsPlace
          ? `Not yet — place ${names}${zoneBit} first. The library can place one for you.`
          : `Not yet — ${names} should stand${zoneBit} for this step.`,
      };
    }
    return this._complete(via, req.anyPlaced && (s.substitutes?.length ?? 0) > 0);
  }

  /** Complete the current step (internal; bypasses requirement checks). */
  _complete(via, substituteUsed = false) {
    const s = this.step;
    this.record.steps.push({
      id: s.id,
      via,
      substituteUsed,
      skipped: false,
      atSec: Math.round(this.elapsed * 10) / 10,
    });
    if (s.caption) this.record.notes.push(s.caption);
    for (const change of s.stateChanges ?? []) this.record.notes.push(change);
    this.bus.emit(EVENTS.RITUAL_STEP_DONE, { ritualId: this.ritual.id, index: this.index, via });
    return this._advance();
  }

  _advance() {
    if (this.index + 1 >= this.ritual.steps.length) {
      this.done = true;
      this.record.closedAt = new Date().toISOString();
      this.bus.emit(EVENTS.RITUAL_COMPLETE, { ritualId: this.ritual.id, record: this.record });
      this.bus.emit(EVENTS.RITUAL_ENDED, { ritualId: this.ritual.id, record: this.record });
      return { ok: true, caption: this.step.caption ?? null, complete: true };
    }
    this.index += 1;
    this.elapsed = 0;
    this._hintFired.delete(this.index); // fresh hint budget per step
    const s = this.step;
    this.bus.emit(EVENTS.RITUAL_STEP, { ritualId: this.ritual.id, index: this.index, step: s });
    return { ok: true, caption: null, complete: false };
  }

  /** Skip the current step (only where the data allows). */
  skip() {
    if (this.done) return { ok: false, reason: "The sequence has already closed." };
    const s = this.step;
    if (!s.skipAllowed) {
      return { ok: false, reason: "This step carries the sequence — it cannot be skipped." };
    }
    this.record.steps.push({ id: s.id, via: "skip", skipped: true, atSec: Math.round(this.elapsed * 10) / 10 });
    if (s.missingObject === "skip-with-note") {
      this.record.notes.push(`Set aside for now: ${s.instruction}`);
    }
    this.bus.emit(EVENTS.RITUAL_STEP_DONE, { ritualId: this.ritual.id, index: this.index, via: "skip" });
    return { ...this._advance(), skipped: true };
  }

  /**
   * Advance time. Fires the step's hint after hint.afterSec and completes
   * wait steps when waitSec elapses (unless already done).
   * @returns {{hint?:string, caption?:string, waitRemaining?:number}}
   */
  update(dt) {
    if (this.done) return {};
    const s = this.step;
    this.elapsed += dt;
    const out = {};

    if (s.action === "wait") {
      const remaining = Math.max(0, (s.waitSec ?? 0) - this.elapsed);
      out.waitRemaining = remaining;
      if (remaining === 0) {
        this._complete("wait");
      }
      return out;
    }

    const after = s.hint?.afterSec;
    if (after != null && this.elapsed >= after && !this._hintFired.has(this.index)) {
      this._hintFired.add(this.index);
      out.hint = s.hint.text;
      this.bus.emit(EVENTS.RITUAL_HINT_DUE, { ritualId: this.ritual.id, index: this.index, text: s.hint.text });
    }
    return out;
  }

  /** The tool id that should be interacted with for the current step (incl. substitutes). */
  acceptedToolIds() {
    const s = this.step;
    return [...(s.requiredObjects ?? []), ...(s.substitutes ?? [])];
  }

  /** Serialize the record for the summary keepsake. */
  serialize() {
    return JSON.parse(JSON.stringify(this.record));
  }
}
