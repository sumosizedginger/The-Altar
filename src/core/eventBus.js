/**
 * src/core/eventBus.js — the central event bus (spec: one bus, one app).
 *
 * Design contracts:
 *  - Listener isolation: a throwing listener is logged and skipped; the
 *    remaining listeners still run. UI code must never be able to wedge
 *    the whole app through one bad subscriber.
 *  - Emission is synchronous and ordered: listeners run in subscription
 *    order, and state:change handlers therefore see a consistent world.
 *  - A bounded history ring remembers the last N emissions ("remember how
 *    they were made" at the app level) — the debug strip and later phases
 *    use it to explain what just happened.
 *  - Event NAMES come from src/core/events.js; emitting undeclared strings
 *    is allowed only as `debug:*` for scratch work.
 */

import { EVENTS } from "./events.js";

export class EventBus {
  constructor({ historyMax = 200 } = {}) {
    this._listeners = new Map(); // type -> Set<fn>
    this._anyListeners = new Set();
    this._historyMax = historyMax;
    this._history = [];
  }

  /** Subscribe; returns an unsubscribe function. */
  on(type, fn) {
    if (typeof fn !== "function") throw new TypeError("eventBus.on requires a function");
    let set = this._listeners.get(type);
    if (!set) this._listeners.set(type, (set = new Set()));
    set.add(fn);
    return () => this.off(type, fn);
  }

  /** Subscribe for exactly one emission. */
  once(type, fn) {
    const off = this.on(type, (data) => {
      off();
      fn(data);
    });
    return off;
  }

  /** Observe every emission (devtools, notice toasts, tests). */
  onAny(fn) {
    this._anyListeners.add(fn);
    return () => this._anyListeners.delete(fn);
  }

  off(type, fn) {
    const set = this._listeners.get(type);
    if (set) set.delete(fn);
  }

  /**
   * Emit synchronously. Returns the number of listeners that were called
   * (exact-match plus any-listeners). Never throws outward.
   */
  emit(type, data = null) {
    this._history.push({ type, data, at: Date.now() });
    if (this._history.length > this._historyMax) this._history.shift();
    let called = 0;
    for (const fn of this._listeners.get(type) ?? []) {
      ++called;
      try {
        fn(data);
      } catch (e) {
        console.error(`[bus] listener for "${type}" threw`, e);
      }
    }
    for (const fn of this._anyListeners) {
      try {
        fn(type, data);
      } catch (e) {
        console.error(`[bus] any-listener threw on "${type}"`, e);
      }
    }
    return called;
  }

  /** Most recent emissions, oldest first. */
  history(lastN = Infinity) {
    return this._history.slice(-lastN);
  }

  /** Count of currently-subscribed listeners for a type (diagnostics). */
  listenerCount(type) {
    return (this._listeners.get(type)?.size ?? 0) + this._anyListeners.size;
  }
}

/** True for scratch/debug channel names exempt from the catalog rule. */
export function isDebugEvent(type) {
  return typeof type === "string" && type.startsWith("debug:");
}

/** Catalog audit — throws for undeclared non-debug names (used by tests). */
export function assertEventDeclared(type) {
  const declared = Object.values(EVENTS);
  if (!declared.includes(type) && !isDebugEvent(type)) {
    throw new Error(`undeclared bus event "${type}" — add it to src/core/events.js`);
  }
}
