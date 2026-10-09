/**
 * src/ui/ritual.js — Ritual Mode console (Phase 6).
 *
 * Two surfaces:
 *   - the picker (overlay): choose one of the three guided sequences,
 *     each showing its honest disclaimer before anything begins;
 *   - the console (slim panel above the canvas): current step, hints
 *     after the data's delay, captions when a step completes, wait
 *     countdown, skip where the data allows, and "place one" when a
 *     step needs an object that isn't on the altar yet.
 *
 * Interaction: clicking a placed tool attempts the current step and —
 * whether or not the step names it — the tool SPEAKS with its own
 * synthesized voice from its own position (positional audio). Tracing a
 * symbol replays its stroke order under the pointer. There is no fail
 * state: only hints, notes, and quiet completion.
 */

import { EVENTS } from "../core/events.js";
import { RITUALS } from "../../data/rituals.js";
import { TOOLS } from "../../data/tools.js";

const TOOLS_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t]));
import { RitualRunner } from "../engine/ritual.js";

const $ = (id) => document.getElementById(id);

export function initRitual({ app, builder, audio, camera, notice }) {
  const bus = app.bus;
  const machine = app.machine;
  let runner = null;
  let lastRecord = null;
  let closed = false; // the completion block must fire exactly once
  let trace = null; // {uid, startX, startY, dist}

  /* ---- picker ------------------------------------------------------------ */
  function renderPicker() {
    const wrap = $("ritual-cards");
    wrap.textContent = "";
    for (const r of RITUALS) {
      const card = document.createElement("button");
      card.className = "ritual-card";
      card.type = "button";
      card.innerHTML = "";
      const title = document.createElement("strong");
      title.textContent = r.name;
      const meta = document.createElement("span");
      meta.className = "ritual-meta";
      meta.textContent = `${r.steps.length} steps · about ${r.estimatedMinutes} minutes`;
      const desc = document.createElement("p");
      desc.textContent = r.description;
      card.append(title, meta, desc);
      card.addEventListener("click", () => {
        $("ritual-disclaimer").textContent = r.disclaimer;
        for (const c of wrap.children) c.classList.toggle("picked", c === card);
        $("btn-ritual-begin").disabled = false;
        $("btn-ritual-begin").dataset.ritual = r.id;
      });
      wrap.append(card);
    }
    $("btn-ritual-begin").disabled = true;
    $("ritual-disclaimer").textContent = "Choose a sequence — its honest scope note appears here before you begin.";
  }

  function openPicker() {
    renderPicker();
    $("ritual-overlay").hidden = false;
    $("ritual-console").hidden = true;
    $("btn-ritual-begin").focus();
  }

  function closeAll() {
    $("ritual-overlay").hidden = true;
    $("ritual-console").hidden = true;
  }

  /* ---- running console ------------------------------------------------------- */
  function begin(ritualId) {
    const ritual = RITUALS.find((r) => r.id === ritualId);
    if (!ritual) return;
    runner = new RitualRunner({ ritual, arrangement: builder.arrangement, bus });
    closed = false;
    closeAll();
    $("ritual-console").hidden = false;
    audio.unlock();
    audio.playAt("chime", altarPos(), { level: 0.7 });
    renderStep();
  }

  function altarPos() {
    const p = builder.getWorldPos?.([...builder.arrangement.items.keys()][0]);
    return p ?? { x: 0, y: 1.2, z: -4.6 };
  }

  function renderStep() {
    if (!runner) return; // the runner's constructor emits its own step event before assignment
    const s = runner.step;
    const n = runner.stepIndex + 1;
    $("ritual-step-num").textContent = `Step ${n} of ${runner.ritual.steps.length}`;
    $("ritual-instruction").textContent = s.instruction;
    $("ritual-hint").textContent = "";
    $("ritual-caption").textContent = "";
    $("ritual-wait").hidden = s.action !== "wait";
    const skipBtn = $("ritual-skip");
    skipBtn.hidden = !s.skipAllowed;
    skipBtn.textContent = s.skipAllowed ? "set this step aside" : "";
    const req = runner.requirements();
    const placeBtn = $("ritual-place-one");
    if (req.needsPlace && (s.requiredObjects?.length ?? 0) > 0) {
      const need = s.requiredObjects.find((id) => req.missing.includes(id));
      placeBtn.hidden = false;
      placeBtn.dataset.tool = need;
      placeBtn.textContent = `place ${need.replace(/-/g, " ")} from the library`;
    } else {
      placeBtn.hidden = true;
    }
  }

  /** A placed item was clicked while a ritual runs. */
  function itemClicked(uid) {
    if (!runner || runner.finished) return false;
    const item = builder.arrangement.get(uid);
    if (!item) return false;
    const s = runner.step;

    // the item speaks, wherever it stands
    const soundType = toolSound(item);
    const pos = builder.getWorldPos(uid) ?? item.position;
    audio.playAt(soundType, pos, { level: 1 });

    // trace steps complete by tracing the symbol, not by clicking
    if (s.action === "trace" && item.kind === "symbol") {
      builder.replaySymbol(uid);
      return runner.attempt("trace").ok;
    }

    const accepted = runner.acceptedToolIds();
    if (item.kind === "tool" && accepted.includes(item.id)) {
      const via = s.action === "ring" ? "ring" : s.action === "pour" ? "pour" : "click";
      const result = runner.attempt(via);
      if (result.ok && s.caption) {
        $("ritual-caption").textContent = s.caption;
      } else if (!result.ok && result.reason) {
        notice(result.reason);
      }
      return result.ok;
    }
    // a wrong item still made its sound; a gentle nudge when it's a step tool elsewhere
    if (item.kind === "tool" && s.requiredObjects?.includes(item.id)) {
      const zoneName = s.zone ? ` in the ${s.zone.replace(/-/g, " ")}` : "";
      notice(`It speaks — but this step wants it${zoneName}. Drag it there, or continue gently.`);
    }
    return false;
  }

  function toolSound(item) {
    if (item.kind === "symbol") return "chime";
    return TOOLS_BY_ID[item.id]?.sound?.type ?? "cloth";
  }

  /* ---- pointer: trace steps -------------------------------------------------------- */
  function traceTarget() {
    if (!runner || runner.finished) return null;
    const s = runner.step;
    if (s.action !== "trace") return null;
    for (const it of builder.arrangement.items.values()) {
      if (it.kind === "symbol") return it;
    }
    return null;
  }

  function onPointerDown(e) {
    const t = traceTarget();
    if (!t) return;
    const sp = builder.screenPosOf(t.uid);
    if (!sp) return;
    const d = Math.hypot(e.clientX - sp.x, e.clientY - sp.y);
    if (d <= 140) trace = { uid: t.uid, dist: 0, active: true, lastX: e.clientX, lastY: e.clientY };
  }

  function onPointerMove(e) {
    if (!trace?.active) return;
    trace.dist += Math.hypot(e.clientX - trace.lastX, e.clientY - trace.lastY);
    trace.lastX = e.clientX;
    trace.lastY = e.clientY;
    if (trace.dist > 130) {
      const result = runner.attempt("trace");
      builder.replaySymbol(trace.uid);
      trace.active = false;
      if (result.ok) {
        audio.playAt("chime", builder.getWorldPos(trace.uid), { level: 0.5 });
        const cap = runner.ritual.steps[runner.stepIndex - 1]?.caption;
        if (cap) $("ritual-caption").textContent = cap;
      } else if (result.reason) {
        notice(result.reason);
      }
    }
  }

  function onPointerUp() {
    trace = null;
  }

  /* ---- per-frame -------------------------------------------------------------------- */
  function update(dt) {
    if (!runner || closed) return;
    const out = runner.update(dt); // may complete a wait step (and the ritual)
    if (out.hint) $("ritual-hint").textContent = out.hint;
    const s = runner.step;
    if (s && s.action === "wait" && out.waitRemaining != null) {
      const bar = $("ritual-wait");
      bar.max = s.waitSec ?? 1;
      bar.value = (s.waitSec ?? 1) - out.waitRemaining;
      $("ritual-hint").textContent =
        out.waitRemaining > 0.5 ? `rest — ${Math.ceil(out.waitRemaining)} breaths` : "";
    }
    // a ritual whose LAST step was a click/trace/pour is already finished
    // here — the old early-return meant it never closed
    if (runner.finished) {
      closed = true;
      lastRecord = runner.serialize();
      closeAll();
      audio.playAt("bowl", { x: 0, y: 1.3, z: -4.6 }, { level: 0.9 });
      notice("The sequence is complete. Your record is in the summary.");
      setTimeout(() => {
        if (machine.state === "RITUAL") machine.transition("SUMMARY");
      }, 1400);
    }
  }

  /* ---- wiring ----------------------------------------------------------------------------- */
  $("btn-ritual").addEventListener("click", () => {
    if (machine.state !== "RITUAL" && !machine.transition("RITUAL")) return;
    if (runner && !runner.finished) {
      // a ritual is mid-flight — resume the current step, never restart it
      $("ritual-console").hidden = false;
      renderStep();
      return;
    }
    lastRecord = null;
    runner = null;
    openPicker();
  });
  $("btn-ritual-begin").addEventListener("click", () => begin($("btn-ritual-begin").dataset.ritual));
  $("btn-ritual-back").addEventListener("click", () => machine.transition("BUILDING"));
  $("btn-ritual-aside").addEventListener("click", () => {
    runner = null;
    machine.transition("BUILDING");
    notice("Set aside, nothing lost — the arrangement stands as you left it.");
  });
  $("ritual-skip").addEventListener("click", () => {
    const result = runner?.skip();
    if (result?.ok) renderStep();
    else if (result?.reason) notice(result.reason);
  });
  $("ritual-place-one").addEventListener("click", (e) => {
    const toolId = e.target.dataset.tool;
    const tool = TOOLS_BY_ID[toolId];
    if (!tool) return;
    // the machine must actually leave RITUAL for the commit path to accept
    // the click — this edge is the whole difference between armed and dead
    if (machine.state === "RITUAL") machine.transition("PLACING");
    builder.setPlacingTool(toolId);
    notice(`${tool.name} is in your hand — set it down where the step asks.`);
  });

  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);

  // the console is a view of the runner: re-render on every step advance,
  // or completed steps happen silently and the walk looks frozen
  bus.on(EVENTS.RITUAL_STEP, () => {
    renderStep();
  });

  bus.on(EVENTS.STATE_CHANGE, ({ from, to } = {}) => {
    if (machine.state === "RITUAL") {
      if (runner && !runner.finished && to === "RITUAL") {
        $("ritual-console").hidden = false;
        renderStep(); // back mid-flight: show the step we were on
      }
      return;
    }
    closeAll();
    // the ritual's own placement just committed — resume the step
    if (runner && !runner.finished && from === "PLACING" && to === "BUILDING") {
      machine.transition("RITUAL");
    }
  });

  return {
    update,
    itemClicked,
    get record() {
      return lastRecord;
    },
    get active() {
      return Boolean(runner) && !runner.finished;
    },
  };
}
