/**
 * src/engine/arrangement.js — the arrangement model + undo/redo (Phase 5).
 *
 * Pure data: items are records {uid, kind, id, zoneId, position:{x,y,z},
 * rotationY}. Meshes are the UI layer's concern (src/ui/builder.js mirrors
 * this model into the scene). Snapshot-based undo: every successful
 * mutation pushes the previous state onto a bounded stack — simple,
 * total, and impossible to leave half-applied.
 *
 * All mutations flow through methods that run the rules engine first;
 * refusals never touch the model and are reported so the UI can be gentle.
 */

import { ZONES_BY_ID } from "./placement.js";
import { evaluatePlacement, verdictPermits } from "./placement.js";
import { EVENTS } from "../core/events.js";

const UNDO_MAX = 60;

let uidCounter = 0;
export function nextUid() {
  uidCounter += 1;
  return `item-${uidCounter}`;
}

export class Arrangement {
  /** @param {import("../core/eventBus.js").EventBus} bus */
  constructor(bus) {
    this.bus = bus;
    this.items = new Map(); // uid -> item record
    this._undoStack = [];
    this._redoStack = [];
  }

  /* ---- queries ---------------------------------------------------------- */
  size() {
    return this.items.size;
  }

  countInZone(zoneId) {
    let n = 0;
    for (const it of this.items.values()) if (it.zoneId === zoneId) n++;
    return n;
  }

  byZone() {
    const out = {};
    for (const it of this.items.values()) (out[it.zoneId] ??= []).push(it);
    return out;
  }

  /** Zone is full? (capacity from zone data; pendant holds exactly 1) */
  zoneHasRoom(zoneId) {
    const zone = ZONES_BY_ID[zoneId];
    if (!zone) return false;
    return this.countInZone(zoneId) < (zone.capacity ?? 1);
  }

  get(uid) {
    return this.items.get(uid) ?? null;
  }

  /* ---- snapshot undo/redo ------------------------------------------------ */
  _snapshot() {
    return {
      items: [...this.items.values()].map((it) => ({
        ...it,
        position: { ...it.position },
      })),
    };
  }

  _pushUndo() {
    this._undoStack.push(this._snapshot());
    if (this._undoStack.length > UNDO_MAX) this._undoStack.shift();
    this._redoStack.length = 0;
  }

  _restore(snap) {
    this.items = new Map(snap.items.map((it) => [it.uid, { ...it, position: { ...it.position } }]));
  }

  get canUndo() {
    return this._undoStack.length > 0;
  }

  get canRedo() {
    return this._redoStack.length > 0;
  }

  undo() {
    const snap = this._undoStack.pop();
    if (!snap) return false;
    this._redoStack.push(this._snapshot());
    this._restore(snap);
    this.bus.emit(EVENTS.ARRANGEMENT_UNDONE, { size: this.size() });
    this._emitChange();
    return true;
  }

  redo() {
    const snap = this._redoStack.pop();
    if (!snap) return false;
    this._undoStack.push(this._snapshot());
    this._restore(snap);
    this.bus.emit(EVENTS.ARRANGEMENT_REDONE, { size: this.size() });
    this._emitChange();
    return true;
  }

  _emitChange() {
    this.bus.emit(EVENTS.ARRANGEMENT_CHANGE, { size: this.size(), byZone: this.byZone() });
  }

  _deny(item, zoneId, reason) {
    this.bus.emit(EVENTS.PLACEMENT_DENIED, {
      kind: item?.kind ?? null,
      id: item?.data?.id ?? null,
      zoneId,
      reason,
    });
    return { ok: false, reason };
  }

  /* ---- mutations ----------------------------------------------------------- */
  /**
   * Place an item. Runs rules + capacity; refusal leaves the model alone.
   * @returns {{ok:boolean, uid?:string, evaluation?:object, reason?:string}}
   */
  place({ kind, data, zoneId, position, rotationY = 0 }) {
    const evaluation = evaluatePlacement({ kind, data }, zoneId);
    if (!verdictPermits(evaluation.verdict)) {
      const r = this._deny({ kind, data }, zoneId, evaluation.rationale);
      return { ...r, evaluation };
    }
    if (!this.zoneHasRoom(zoneId)) {
      const zone = ZONES_BY_ID[zoneId];
      const r = this._deny(
        { kind, data },
        zoneId,
        `${zone?.name ?? zoneId} holds ${zone?.capacity ?? 1} placement${(zone?.capacity ?? 1) > 1 ? "s" : ""}, and it is full. Another place will suit.`,
      );
      return { ...r, evaluation };
    }
    this._pushUndo();
    const uid = nextUid();
    this.items.set(uid, {
      uid,
      kind,
      id: data.id,
      name: data.name,
      ruleData:
        kind === "symbol"
          ? { zoneRules: data.zoneRules ?? {} }
          : { heightClass: data.heightClass, category: data.category },
      zoneId,
      position: { x: position.x, y: position.y, z: position.z },
      rotationY,
    });
    this.bus.emit(EVENTS.ITEM_PLACED, { uid, kind, id: data.id, zoneId });
    if (evaluation.verdict === "warned") {
      this.bus.emit(EVENTS.PLACEMENT_NOTED, {
        kind,
        id: data.id,
        zoneId,
        verdict: evaluation.verdict,
        rationale: evaluation.rationale,
      });
    }
    this._emitChange();
    return { ok: true, uid, evaluation };
  }

  /**
   * Move an item (possibly across zones). Zone change re-runs rules and
   * capacity against the item's stored ruleData; a refusal leaves
   * everything untouched.
   */
  move(uid, { position, zoneId }) {
    const it = this.items.get(uid);
    if (!it) return { ok: false, reason: "That piece is no longer on the altar." };
    const targetZone = zoneId ?? it.zoneId;
    let evaluation = null;
    if (targetZone !== it.zoneId) {
      evaluation = evaluatePlacement(
        { kind: it.kind, data: { name: it.name, ...it.ruleData } },
        targetZone,
      );
      if (!verdictPermits(evaluation.verdict)) {
        return { ...this._deny(it, targetZone, evaluation.rationale), evaluation };
      }
      if (!this.zoneHasRoom(targetZone)) {
        const zone = ZONES_BY_ID[targetZone];
        return {
          ...this._deny(
            it,
            targetZone,
            `${zone?.name ?? targetZone} is full — ${zone?.capacity ?? 1} placements at most.`,
          ),
          evaluation,
        };
      }
    }
    this._pushUndo();
    const fromZone = it.zoneId;
    it.position = { x: position.x, y: position.y, z: position.z };
    it.zoneId = targetZone;
    if (targetZone !== fromZone) this.bus.emit(EVENTS.ITEM_MOVED, { uid, fromZone, toZone: targetZone });
    this._emitChange();
    return { ok: true };
  }

  rotate(uid, delta) {
    const it = this.items.get(uid);
    if (!it) return { ok: false, reason: "That piece is no longer on the altar." };
    this._pushUndo();
    it.rotationY = (it.rotationY + delta) % (Math.PI * 2);
    this.bus.emit(EVENTS.ITEM_ROTATED, { uid, rotationY: it.rotationY });
    this._emitChange();
    return { ok: true };
  }

  remove(uid) {
    const it = this.items.get(uid);
    if (!it) return { ok: false, reason: "That piece is no longer on the altar." };
    this._pushUndo();
    this.items.delete(uid);
    this.bus.emit(EVENTS.ITEM_REMOVED, { uid, kind: it.kind, id: it.id, zoneId: it.zoneId });
    this._emitChange();
    return { ok: true };
  }

  clear() {
    if (!this.size()) return;
    this._pushUndo();
    this.items.clear();
    this._emitChange();
  }

  /* ---- serialization (summary keepsake, tests) ------------------------------ */
  serialize() {
    return {
      savedAt: new Date().toISOString(),
      items: [...this.items.values()].map((it) => ({ ...it, position: { ...it.position } })),
    };
  }

  /** Replace contents from a serialize() blob (no rules re-check: restores trust). */
  load(blob) {
    this._pushUndo();
    this.items = new Map(
      (blob.items ?? [])
        .filter((it) => it && it.uid && it.zoneId)
        .map((it) => [it.uid, { ...it, position: { x: it.position.x, y: it.position.y, z: it.position.z } }]),
    );
    this._emitChange();
  }
}
