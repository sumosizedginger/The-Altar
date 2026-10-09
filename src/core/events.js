/**
 * src/core/events.js — the event-name catalog for the central event bus.
 *
 * Every cross-module conversation in the app goes through the bus, using
 * names declared HERE. Names are namespaced `area:subject` (and
 * `area:subject:id` where an id qualifies the subject). Later phases add
 * their own entries to this file rather than emitting undeclared strings —
 * that keeps the app's conversation auditable in one place.
 *
 * Honesty/design rules that apply to payloads:
 *  - notice text is guidance, never scolding ("that door isn't open yet —
 *    begin at ...", never "error/invalid/wrong").
 */

/** @enum {string} */
export const EVENTS = {
  /* ---- app lifecycle ------------------------------------------------- */
  APP_BOOT: "app:boot", // {version, phases} — createApp fired it once
  APP_NOTICE: "app:notice", // {text, tone} tone: "gentle" | "fault"

  /* ---- state machine -------------------------------------------------- */
  STATE_CHANGE: "state:change", // {from, to, sandbox}
  STATE_REFUSED: "state:refused", // {from, to, reason}
  SANDBOX_CHANGE: "sandbox:change", // {sandbox, state}

  /* ---- codex UI (Phase 3) --------------------------------------------- */
  CODEX_TAB: "codex:tab", // {tab}
  CODEX_FILTER: "codex:filter", // {tradition|null}
  CODEX_SEARCH: "codex:search", // {query}
  CODEX_SELECT: "codex:select", // {kind:"symbol"|"tool"|"zone"|"ritual"|"source", id}

  /* ---- symbol preview (Phase 3; reused by builder/ritual later) -------- */
  PREVIEW_PLAY: "preview:play", // {symbolId}
  PREVIEW_REPLAY: "preview:replay", // {symbolId}

  /* ---- altar builder (Phase 5) ----------------------------------------- */
  ITEM_PLACED: "item:placed", // {uid, kind, id, zoneId}
  ITEM_REMOVED: "item:removed", // {uid, kind, id, zoneId}
  ITEM_MOVED: "item:moved", // {uid, fromZone, toZone}
  ITEM_ROTATED: "item:rotated", // {uid, rotationY}
  ARRANGEMENT_CHANGE: "arrangement:change", // {size, byZone}
  ARRANGEMENT_UNDONE: "arrangement:undone", // {size}
  ARRANGEMENT_REDONE: "arrangement:redone", // {size}
  PLACEMENT_DENIED: "placement:denied", // {kind, id, zoneId, reason}
  PLACEMENT_NOTED: "placement:noted", // {kind, id, zoneId, verdict, rationale}
  BUILDER_MODE: "builder:mode", // {mode} "placing" | "building" | "summary"
};

export const NOTICE_TONES = Object.freeze({ GENTLE: "gentle", FAULT: "fault" });
