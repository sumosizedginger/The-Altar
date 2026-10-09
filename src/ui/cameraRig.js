/**
 * src/ui/cameraRig.js — the workshop camera (Phase 5 rework).
 *
 * Grab-style controls, mouse AND touch:
 *   - drag empty space (or one finger)  → orbit
 *   - right-drag / ctrl-drag (two-finger drag midpoint) → pan
 *   - wheel / pinch → zoom (dolly)
 *   - named VIEWS jump to the places that matter (room, altar, hearth,
 *     door, pendant) — the museum way: framed sightlines, not wrestling.
 *
 * Goals are damped toward each frame (smooth), snap instantly under
 * reduced motion. Wheel and context-menu are handled here; pointer
 * gestures are driven by the builder's event arbitration (items first,
 * camera for everything else) via pointerDown/pointerMove/pointerUp.
 */

import * as THREE from "three";

/** Framed sightlines. azimuth/elevation in radians; target in world. */
export const CAMERA_VIEWS = Object.freeze({
  room: Object.freeze({ target: [0, 1.05, -1.6], radius: 7.6, azimuth: 0, elevation: 0.16 }),
  altar: Object.freeze({ target: [0, 1.02, -4.6], radius: 2.7, azimuth: 0, elevation: 0.72 }),
  hearth: Object.freeze({ target: [-4.25, 1.05, 1.35], radius: 3.3, azimuth: -1.2, elevation: 0.14 }),
  door: Object.freeze({ target: [0, 1.7, 5.8], radius: 3.4, azimuth: Math.PI - 0.15, elevation: 0.06 }),
  pendant: Object.freeze({ target: [1.75, 1.15, 4.9], radius: 2.9, azimuth: -2.35, elevation: 0.12 }),
});

const CLAMP = Object.freeze({
  radius: [1.7, 10.5],
  elevation: [-0.15, 1.25],
  targetX: [-4, 4],
  targetY: [0.3, 2.2],
  targetZ: [-5.2, 5.2],
});

const clamp = (v, [a, b]) => Math.min(b, Math.max(a, v));

/** Shortest signed difference between two azimuths. */
function azimuthDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function createCameraRig({ camera, dom, reducedMotion = false }) {
  const v0 = CAMERA_VIEWS.room;
  const state = {
    target: new THREE.Vector3(...v0.target),
    radius: v0.radius,
    azimuth: v0.azimuth,
    elevation: v0.elevation,
  };
  const goal = {
    target: state.target.clone(),
    radius: state.radius,
    azimuth: state.azimuth,
    elevation: state.elevation,
  };

  let gesture = null; // "rotate" | "pan" | "pinch" | null
  const pointers = new Map(); // pointerId -> {x,y}
  let lastX = 0;
  let lastY = 0;
  let downX = 0;
  let downY = 0;
  let movedSinceDown = 0;
  const DRAG_DEAD_ZONE = 4; // px — a press that moves less is a click, not a gesture
  let pinchDist = 0;
  let pinchMid = { x: 0, y: 0 };

  const wrapAzimuth = () => {
    if (goal.azimuth > Math.PI) goal.azimuth -= Math.PI * 2;
    if (goal.azimuth < -Math.PI) goal.azimuth += Math.PI * 2;
    if (state.azimuth > Math.PI) state.azimuth -= Math.PI * 2;
    if (state.azimuth < -Math.PI) state.azimuth += Math.PI * 2;
  };

  function apply() {
    const { target, radius, azimuth: a, elevation: e } = state;
    camera.position.set(
      target.x + radius * Math.sin(a) * Math.cos(e),
      Math.max(0.35, target.y + radius * Math.sin(e)),
      target.z + radius * Math.cos(a) * Math.cos(e),
    );
    camera.lookAt(target);
  }

  function rotateBy(dx, dy) {
    goal.azimuth -= dx * 0.005;
    goal.elevation = clamp(goal.elevation + dy * 0.0038, CLAMP.elevation);
    wrapAzimuth();
  }

  function panBy(dx, dy) {
    const a = state.azimuth;
    const right = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
    const fwdH = new THREE.Vector3(-Math.sin(a), 0, -Math.cos(a)); // screen-up on the ground plane
    const k = state.radius * 0.0013;
    goal.target.addScaledVector(right, -dx * k);
    goal.target.addScaledVector(fwdH, dy * k);
    goal.target.x = clamp(goal.target.x, CLAMP.targetX);
    goal.target.y = clamp(goal.target.y, CLAMP.targetY);
    goal.target.z = clamp(goal.target.z, CLAMP.targetZ);
  }

  function zoomBy(factor) {
    goal.radius = clamp(goal.radius * factor, CLAMP.radius);
  }

  /* wheel + context menu live here; pointer gestures are delegated */
  dom.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomBy(Math.exp(e.deltaY * 0.0011));
  }, { passive: false });
  dom.addEventListener("contextmenu", (e) => e.preventDefault());

  /** Builder calls this when no item took the pointer. Returns true (took it). */
  function pointerDown(e) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      dom.setPointerCapture(e.pointerId);
    } catch {
      /* pointer may already be gone */
    }
    if (pointers.size === 2) {
      gesture = "pinch";
      const [p1, p2] = [...pointers.values()];
      pinchDist = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
      pinchMid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      return true;
    }
    gesture = e.button === 2 || e.ctrlKey || e.metaKey ? "pan" : "rotate";
    lastX = e.clientX;
    lastY = e.clientY;
    downX = e.clientX;
    downY = e.clientY;
    movedSinceDown = 0;
    return true;
  }

  /** Returns true when the rig consumed the move (camera gesture active). */
  function pointerMove(e) {
    if (!pointers.has(e.pointerId)) return false;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesture === "pinch" && pointers.size === 2) {
      const [p1, p2] = [...pointers.values()];
      const d = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
      zoomBy(pinchDist / d);
      pinchDist = d;
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      panBy(mid.x - pinchMid.x, mid.y - pinchMid.y);
      pinchMid = mid;
      return true;
    }
    if (!gesture) return false;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    movedSinceDown += Math.abs(dx) + Math.abs(dy);
    if (movedSinceDown < DRAG_DEAD_ZONE) return true; // tiny jitter: not a gesture yet
    if (gesture === "pan") panBy(dx, dy);
    else rotateBy(dx, dy);
    return true;
  }

  function pointerUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size === 0) {
      gesture = null;
    } else if (pointers.size === 1 && gesture === "pinch") {
      gesture = "rotate";
      const [p] = [...pointers.values()];
      lastX = p.x;
      lastY = p.y;
    }
  }

  /** Damp state toward goal and apply to the camera. */
  function update(dt) {
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 8.5);
    state.azimuth += azimuthDelta(state.azimuth, goal.azimuth) * k;
    state.elevation += (goal.elevation - state.elevation) * k;
    state.radius += (goal.radius - state.radius) * k;
    state.target.lerp(goal.target, k);
    wrapAzimuth();
    apply();
  }

  /** Jump/flow to a named view. Returns false for unknown names. */
  function setView(name) {
    const v = CAMERA_VIEWS[name];
    if (!v) return false;
    goal.target.set(v.target[0], v.target[1], v.target[2]);
    goal.radius = v.radius;
    goal.azimuth = v.azimuth;
    goal.elevation = v.elevation;
    wrapAzimuth();
    if (reducedMotion) update(1);
    return true;
  }

  apply();
  return {
    pointerDown,
    pointerMove,
    pointerUp,
    rotateBy,
    panBy,
    zoomBy,
    update,
    setView,
    get gesture() {
      return gesture;
    },
    get movedSinceDown() {
      return movedSinceDown;
    },
    get active() {
      return gesture !== null;
    },
    state,
    views: Object.keys(CAMERA_VIEWS),
  };
}
