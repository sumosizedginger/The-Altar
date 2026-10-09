/**
 * src/core/app.js — the application shell for Phase 3.
 *
 * Creates the ONE event bus and the ONE state machine, wires them together,
 * and hands them to every later phase. Nothing else in the app constructs
 * a bus or a machine directly.
 */

import { EventBus } from "./eventBus.js";
import { StateMachine, STATES, STATE_DESCRIPTION } from "./stateMachine.js";
import { EVENTS } from "./events.js";

export const APP_VERSION = "0.3.0-phase3";

/**
 * @returns {{
 *  bus: import("./eventBus.js").EventBus,
 *  machine: import("./stateMachine.js").StateMachine,
 *  states: typeof STATES,
 *  stateDescription: typeof STATE_DESCRIPTION,
 *  version: string,
 * }}
 */
export function createApp() {
  const bus = new EventBus({ historyMax: 200 });
  const machine = new StateMachine(bus);
  const app = {
    bus,
    machine,
    states: STATES,
    stateDescription: STATE_DESCRIPTION,
    version: APP_VERSION,
  };
  bus.emit(EVENTS.APP_BOOT, { version: APP_VERSION, phases: 7 });
  return app;
}
