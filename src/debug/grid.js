/**
 * src/debug/grid.js — the /debug page controller.
 * ONE renderer for all 40 symbols (never a context per card):
 *   - scissored viewports, one per grid cell
 *   - IntersectionObserver pauses off-screen cells
 *   - hard cap of 8 simultaneously animating cells (others: final frame)
 *   - prefers-reduced-motion: everything static at its final frame
 *   - WebGL context loss/restore handled with a user-visible notice
 */
import * as THREE from "three";
import { SYMBOLS } from "../../data/symbols.js";
import { TRADITIONS } from "../../data/traditions.js";
import { SymbolInstance } from "../engine/symbolRenderer.js";

const MAX_ANIMATING = 8;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const gridEl = document.getElementById("grid");
const statusEl = document.getElementById("status");
const lostEl = document.getElementById("context-lost");

/* ---- DOM grid ------------------------------------------------------ */
const cells = [];
for (const sym of SYMBOLS) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.dataset.symbolId = sym.id;

  const meta = document.createElement("div");
  meta.className = "meta";
  const tradNames = sym.traditions.map((t) => TRADITIONS[t]?.name ?? t).join(" · ");
  meta.innerHTML = `
    <span class="id">${sym.id}</span>
    <span class="trad">${tradNames}</span>
    <span class="anim">${sym.animationType}</span>`;

  const stage = document.createElement("div");
  stage.className = "stage";

  const controls = document.createElement("div");
  controls.className = "controls";
  const replay = document.createElement("button");
  replay.type = "button";
  replay.textContent = "↺ replay";
  replay.setAttribute("aria-label", `Replay stroke order of ${sym.name}`);
  const state = document.createElement("span");
  state.className = "state";
  state.textContent = sym.geometry ? "" : "pending Phase 2 batch";
  controls.append(state, replay);

  cell.append(meta, stage, controls);
  gridEl.append(cell);

  cells.push({
    sym,
    el: cell,
    stageEl: stage,
    replayBtn: replay,
    stateEl: state,
    instance: null,
    visible: false,
    animating: false,
    needsStatic: false,
    pointer: new THREE.Vector2(),
  });

  if (!sym.geometry) {
    const pend = document.createElement("div");
    pend.className = "pending";
    pend.textContent = "geometry arrives with its Phase 2 batch";
    stage.append(pend);
    replay.disabled = true;
  }
}

/* ---- renderer + scene ---------------------------------------------- */
const canvas = document.createElement("canvas");
canvas.id = "glcanvas";
gridEl.append(canvas);

let renderer = null;
let contextLost = false;

function createRenderer() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.autoClear = false; // we scissor-render many cells per frame
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    contextLost = true;
    lostEl.style.display = "block";
  });
  canvas.addEventListener("webglcontextrestored", () => {
    contextLost = false;
    lostEl.style.display = "none";
    resizeCanvas();
  });
}
createRenderer();

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xfff2dc, 0.65));
const key = new THREE.DirectionalLight(0xffe9c4, 1.4);
key.position.set(0.4, 0.9, 1.2);
scene.add(key);
const rim = new THREE.DirectionalLight(0xc5a059, 0.5);
rim.position.set(-0.8, -0.3, 0.6);
scene.add(rim);

const camera = new THREE.OrthographicCamera(-0.68, 0.68, 0.68, -0.68, 0.01, 10);
camera.position.set(0, 0, 2);

/* instances (built lazily once visible; kept after — replay needs them) */
function ensureInstance(cell) {
  if (cell.instance || !cell.sym.geometry) return;
  cell.instance = new SymbolInstance(cell.sym);
  if (reducedMotion) cell.instance.setFinal();
}

/* ---- layout ---------------------------------------------------------- */
function resizeCanvas() {
  const w = gridEl.clientWidth;
  const h = gridEl.scrollHeight;
  const pr = renderer.getPixelRatio();
  canvas.width = Math.round(w * pr);
  canvas.height = Math.round(h * pr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  renderer.setSize(w, h, false);
  cells.forEach((c) => (c.needsStatic = c.visible && !c.animating));
}
new ResizeObserver(resizeCanvas).observe(gridEl);
resizeCanvas();

/* ---- pointer tracking (eye behavior) --------------------------------- */
let hoverCell = null;
gridEl.addEventListener("pointermove", (e) => {
  if (!hoverCell) return;
  const r = hoverCell.stageEl.getBoundingClientRect();
  hoverCell.pointer.set(
    ((e.clientX - r.left) / r.width) * 2 - 1,
    -(((e.clientY - r.top) / r.height) * 2 - 1)
  );
});

/* ---- animation-slot management ---------------------------------------- */
const animating = new Set();

function grantSlot(cell) {
  if (animating.size >= MAX_ANIMATING) {
    const oldest = animating.values().next().value;
    if (oldest) revokeSlot(oldest);
  }
  animating.add(cell);
  cell.animating = true;
  cell.stateEl.textContent = "animating";
}
function revokeSlot(cell) {
  animating.delete(cell);
  cell.animating = false;
  cell.needsStatic = true;
  cell.stateEl.textContent = "static";
}

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      const cell = cells.find((c) => c.el === e.target);
      if (!cell) continue;
      cell.visible = e.isIntersecting;
      if (!cell.sym.geometry) continue;
      ensureInstance(cell);
      if (e.isIntersecting) {
        if (reducedMotion) {
          cell.instance.setFinal();
          cell.needsStatic = true;
          cell.stateEl.textContent = "final frame";
        } else if (cell.instance.t < 1 || cell.instance._elapsed === 0) {
          grantSlot(cell);
        } else {
          cell.needsStatic = true;
          cell.stateEl.textContent = "static";
        }
      } else if (cell.animating) {
        revokeSlot(cell);
      }
    }
  },
  { rootMargin: "120px" }
);
cells.forEach((c) => io.observe(c.el));

/* replay buttons */
cells.forEach((cell) => {
  cell.replayBtn.addEventListener("click", () => {
    if (!cell.sym.geometry || reducedMotion) return;
    ensureInstance(cell);
    cell.instance.replay();
    grantSlot(cell);
  });
});

/* ---- per-cell rendering ------------------------------------------------ */
function renderCell(cell) {
  const gridRect = gridEl.getBoundingClientRect();
  const r = cell.stageEl.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return;
  // three.js multiplies viewport/scissor by the pixel ratio internally —
  // pass CSS pixels, NOT device pixels (double-scaling pushed every glyph
  // off its cell on high-DPI screens).
  const x = r.left - gridRect.left;
  const y = gridRect.height - (r.top - gridRect.top) - r.height;
  const w = r.width;
  const h = r.height;
  renderer.setViewport(x, y, w, h);
  renderer.setScissor(x, y, w, h);

  // one symbol in the scene at a time
  for (const c of cells) {
    if (c.instance && c.instance.group.parent === scene) scene.remove(c.instance.group);
  }
  scene.add(cell.instance.group);
  renderer.render(scene, camera);
}

/* ---- main loop ---------------------------------------------------------- */
let last = performance.now();
let frames = 0;

function frame(now) {
  requestAnimationFrame(frame);
  if (contextLost || !renderer) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  renderer.setScissorTest(false);
  renderer.clear();
  renderer.setScissorTest(true);

  const ctx = { time: now / 1000, reducedMotion };

  for (const cell of cells) {
    if (!cell.visible || !cell.instance) continue;
    if (cell.animating) {
      ctx.pointer = cell === hoverCell ? cell.pointer : null;
      cell.instance.update(dt, ctx);
      renderCell(cell);
    } else if (cell.needsStatic) {
      cell.instance.setFinal();
      renderCell(cell);
      cell.needsStatic = false;
    }
  }
  frames++;
}

gridEl.addEventListener("pointerover", (e) => {
  const el = e.target.closest(".cell");
  hoverCell = cells.find((c) => c.el === el) || null;
});
gridEl.addEventListener("pointerleave", () => (hoverCell = null));

/* ---- error surfacing: never fail silently ----------------------------- */
function showError(msg) {
  statusEl.textContent = `⚠ ${msg}`;
  statusEl.style.background = "#f6d9d2";
  console.error(msg);
}
window.addEventListener("error", (e) => showError(`Script error: ${e.message} (${e.filename?.split("/").pop()}:${e.lineno})`));
window.addEventListener("unhandledrejection", (e) => showError(`Module load failed: ${e.reason?.message ?? e.reason}`));

/* ---- status line ----------------------------------------------------- */
const withGeom = SYMBOLS.filter((s) => s.geometry).length;
statusEl.textContent =
  `${withGeom}/${SYMBOLS.length} symbols have geometry · ` +
  `${reducedMotion ? "reduced motion: final frames only (replay disabled by OS preference)" : `up to ${MAX_ANIMATING} animating at once`} · ` +
  `one shared WebGL context`;

document.addEventListener("visibilitychange", () => {
  last = performance.now(); // avoid a dt spike when returning to the tab
});

requestAnimationFrame(frame);
