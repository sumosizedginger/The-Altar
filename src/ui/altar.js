/**
 * src/ui/altar.js — the room + workshop host (Phases 4–5).
 *
 * Phase 4 brought the room, lighting, textures, and quality tiers.
 * Phase 5 turns this page into the workshop: the state machine boots here,
 * the Altar Builder (src/ui/builder.js) takes the handles below, and
 * PLACING → BUILDING → SUMMARY become real places.
 */

import * as THREE from "three";
import { createApp } from "../core/app.js";
import { EVENTS } from "../core/events.js";
import { STATE_DESCRIPTION } from "../core/stateMachine.js";
import { createTextureFactory } from "../scene/textures.js";
import { buildRoom } from "../scene/room.js";
import { createLightingRig } from "../scene/lighting.js";
import { detectTier, QUALITY_SETTINGS, stepTier, FpsProbe } from "../scene/quality.js";
import { createCameraRig } from "./cameraRig.js";
import { createPostFX } from "../scene/postfx.js";
import { createAudioEngine } from "../audio/audioEngine.js";
import { initRitual } from "./ritual.js";
import { initBuilder } from "./builder.js";

const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---- gentle failure: WebGL can be absent ---------------------------------- */
function fatal(msg) {
  $("fatal-msg").textContent = msg;
  $("fatal").style.display = "grid";
  $("controls").style.display = "none";
  $("status").style.display = "none";
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas: $("scene"),
    antialias: true,
    powerPreference: "high-performance",
  });
} catch (e) {
  fatal("WebGL could not start here, so the room cannot be drawn. The Codex remains fully usable.");
  throw e;
}
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/* ---- scene + room + rig ----------------------------------------------------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x17130e);

const textures = createTextureFactory();
const room = buildRoom({ textures });
scene.add(room.group);

const rig = createLightingRig({ scene, room, reducedMotion });
rig.setPreset("daylight", { immediate: true });

const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 60);

/* ---- quality tiers ------------------------------------------------------------ */
let tier = localStorage.getItem("altar:tier") || "auto";
if (tier !== "auto" && !QUALITY_SETTINGS[tier]) tier = "auto";
let activeTier = tier === "auto" ? detectTier(window) : tier;
let probe = null;

function applyTier(name, { first = false } = {}) {
  activeTier = name;
  const s = QUALITY_SETTINGS[name];
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, s.pixelRatio));

  const shadowChanged = renderer.shadowMap.enabled !== s.shadows;
  renderer.shadowMap.enabled = s.shadows;
  rig.windowLight.castShadow = s.shadows;
  rig.keyLight.castShadow = s.shadows;
  for (const light of [rig.windowLight, rig.keyLight]) {
    light.shadow.mapSize.set(s.shadowMapSize, s.shadowMapSize);
    if (light.shadow.map) {
      light.shadow.map.dispose();
      light.shadow.map = null;
    }
    light.shadow.camera.left = -6;
    light.shadow.camera.right = 6;
    light.shadow.camera.top = 6;
    light.shadow.camera.bottom = -6;
    light.shadow.camera.far = 30;
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = 0.02;
  }
  if (shadowChanged && !first) {
    scene.traverse((o) => {
      if (o.material) o.material.needsUpdate = true;
    });
  }

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  for (const tex of room.textures) tex.anisotropy = Math.min(maxAniso, s.anisotropy);

  rig.setFlameLights(s.flameLights);
  rig.setDustCount(s.dust);
  $("sel-tier").value = tier;
  syncPostTier();
}

function armProbe() {
  probe?.stop();
  if (tier !== "auto") return;
  probe = new FpsProbe({
    windowFrames: 150,
    threshold: 28,
    onResult: ({ fps, belowThreshold }) => {
      if (belowThreshold && activeTier !== "plate") {
        const lower = stepTier(activeTier, -1);
        applyTier(lower);
        notice(`The room is running gently at ${Math.round(fps)} frames a second — quality rests at “${lower}” so everything stays calm. You can choose a tier yourself anytime.`);
      }
    },
  });
}

/* ---- notices ---------------------------------------------------------------------- */
let noticeTimer = 0;
function notice(text) {
  const n = $("notice");
  n.textContent = text;
  n.classList.add("show");
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => n.classList.remove("show"), 6000);
}

/* ---- camera rig: orbit / pan / zoom / named views --------------------------------- */
const cameraCtl = createCameraRig({ camera, dom: renderer.domElement, reducedMotion });
cameraCtl.setView("room");
cameraCtl.update(1);

/* ---- post pass (Phase 7): bloom + vignette on the 3D pass only ---------- */
const postfx = createPostFX({ renderer });
function syncPostTier() {
  postfx.setBloomEnabled(activeTier !== "plate");
  postfx.setVignette(0.42);
}
const postSize = () => postfx.setSize(window.innerWidth, window.innerHeight);
window.addEventListener("resize", postSize);
postSize();

/* ---- procedural positional audio (Phase 6) -------------------------------- */
const audio = createAudioEngine();
window.addEventListener("pointerdown", () => audio.unlock(), { once: true });
window.addEventListener("keydown", () => audio.unlock(), { once: true });
const UP = new THREE.Vector3(0, 1, 0);
const camForward = new THREE.Vector3();

/* ---- render loop ---------------------------------------------------------------------- */
let contextOk = true;
let swayTime = 0;

function frame(now) {
  requestAnimationFrame(frame);
  if (!contextOk) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;

  rig.update(dt, t);
  cameraCtl.update(dt);
  if (!reducedMotion && !cameraCtl.active) {
    swayTime += dt;
    camera.position.x += Math.sin(swayTime * 0.09) * 0.05;
    camera.position.y += Math.sin(swayTime * 0.14) * 0.012;
    camera.lookAt(cameraCtl.state.target);
  }
  renderer.toneMappingExposure = rig.current.exposure;

  camera.getWorldDirection(camForward);
  audio.updateListener(camera.position, camForward, UP);
  ritualRef.current?.update(dt);

  if (activeTier === "plate") renderer.render(scene, camera);
  else postfx.render(scene, camera);

  probe?.push(dt);
  fpsAccum += dt;
  fpsFrames++;
  if (fpsAccum >= 0.5) {
    const fpsShown = Math.round(fpsFrames / fpsAccum);
    fpsAccum = 0;
    fpsFrames = 0;
    const s = QUALITY_SETTINGS[activeTier];
    $("status").textContent =
      `${s.label.split("—")[0].trim()} tier · ${fpsShown} fps · shadows ${s.shadows ? "on" : "off"} · ` +
      `${textures.list.length} procedural textures · reduced motion ${reducedMotion ? "on" : "off"}`;
  }
}
let last = performance.now();
let fpsAccum = 0;
let fpsFrames = 0;

/* ---- controls ---------------------------------------------------------------------------- */
$("sel-light").addEventListener("change", (e) => rig.setPreset(e.target.value));
$("sel-tier").addEventListener("change", (e) => {
  tier = e.target.value;
  localStorage.setItem("altar:tier", tier);
  applyTier(tier === "auto" ? detectTier(window) : tier);
  armProbe();
});

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

renderer.domElement.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  contextOk = false;
  notice("The room's canvas went dark for a moment — it will relight itself. Nothing is lost.");
});
renderer.domElement.addEventListener("webglcontextrestored", () => {
  contextOk = true;
  applyTier(activeTier, { first: true });
});

/* ---- boot the workshop (Phase 5) ------------------------------------------------------------ */
applyTier(activeTier, { first: true });
armProbe();
resize();
rig.setPreset("dusk");

const app = createApp();
const ritualRef = { current: null };
const builder = initBuilder({
  app,
  renderer,
  scene,
  camera,
  room,
  rig,
  textures,
  reducedMotion,
  notice,
  cameraCtl,
  audio,
  onItemClick: (uid) => ritualRef.current?.itemClicked(uid),
});

const ritual = initRitual({ app, builder, audio, camera, notice });
ritualRef.current = ritual;

// The threshold door: enter straight into the placing workshop.
$("btn-enter-workshop").addEventListener("click", () => {
  app.machine.transition("CODEX");
  app.machine.transition("PLACING");
});
// Codex page links here with ?enter=placing
if (new URLSearchParams(location.search).get("enter") === "placing") {
  app.machine.transition("CODEX");
  app.machine.transition("PLACING");
}

app.bus.on(EVENTS.APP_NOTICE, (n) => notice(n.text));
app.bus.on(EVENTS.STATE_CHANGE, () => {
  const st = app.machine.state;
  const atThreshold = st === "THRESHOLD";
  $("workshop-threshold").classList.toggle("gone", !atThreshold);
  $("top-actions").hidden = atThreshold;
  $("catalog").hidden = atThreshold;
  $("state-badge").textContent = st + (app.machine.sandbox ? " · sandbox" : "");
  $("sandbox-toggle").checked = app.machine.sandbox;
  $("sandbox-toggle").disabled = !["PLACING", "BUILDING"].includes(st);
  $("btn-ritual").disabled = st !== "BUILDING";
  $("btn-summary").disabled = st !== "BUILDING";
  $("ritual-overlay").hidden = st !== "RITUAL";
  $("summary-overlay").hidden = st !== "SUMMARY";
  $("state-desc").textContent = STATE_DESCRIPTION[st] ?? "";
  if (st === "SUMMARY") builder.renderSummary(ritualRef.current?.record ?? null);
});
app.bus.emit(EVENTS.STATE_CHANGE, { from: "THRESHOLD", to: app.machine.state, sandbox: false });

window.addEventListener("error", (e) => {
  if (e?.message) notice("Something slipped — the room caught it. If a panel looks stuck, reloading is safe.");
});

$("btn-ritual-back").addEventListener("click", () => app.machine.transition("BUILDING"));
$("btn-ritual-back-2").addEventListener("click", () => app.machine.transition("BUILDING"));

/* named views: framed sightlines, one click each */
for (const btn of document.querySelectorAll("#views [data-view]")) {
  btn.addEventListener("click", () => {
    cameraCtl.setView(btn.dataset.view);
    for (const b of document.querySelectorAll("#views [data-view]")) {
      b.classList.toggle("active", b === btn);
    }
  });
}

requestAnimationFrame(frame);
