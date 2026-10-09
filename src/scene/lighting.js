/**
 * src/scene/lighting.js — the room's lighting rig and atmosphere.
 *
 * Three presets, all warm and parchment-adjacent (no red/black trope):
 *   daylight    — even museum light through the east window; candles out
 *   dusk        — low amber window, candles waking
 *   candlelight — candles carry the room; the window is a whisper
 *
 * Preset changes TWEEN (1.2 s) rather than snap; flicker is a sum of
 * sines with per-candle seeds (no two flames match). Dust motes drift
 * in the light — or hold still entirely under reduced motion.
 */

import * as THREE from "three";

export const LIGHT_PRESETS = Object.freeze({
  daylight: Object.freeze({
    ambient: 0xfff6e6, ambientI: 0.9,
    hemiSky: 0xeef3f2, hemiGround: 0x8a7a5c, hemiI: 0.6,
    windowColor: 0xfff2d8, windowI: 3.0,
    glow: 1.0, candle: 0.0, keyI: 0.35,
    fogColor: 0xcfc8b2, fogDensity: 0.012,
    dust: 0.22, exposure: 1.05,
  }),
  dusk: Object.freeze({
    ambient: 0xffedd2, ambientI: 0.42,
    hemiSky: 0xcfd8d4, hemiGround: 0x5c5142, hemiI: 0.3,
    windowColor: 0xffd9a0, windowI: 1.15,
    glow: 0.62, candle: 0.55, keyI: 0.2,
    fogColor: 0x6b5f4a, fogDensity: 0.03,
    dust: 0.5, exposure: 1.0,
  }),
  candlelight: Object.freeze({
    ambient: 0xffe4bd, ambientI: 0.16,
    hemiSky: 0x46505a, hemiGround: 0x2e2820, hemiI: 0.14,
    windowColor: 0x9fb4c4, windowI: 0.12,
    glow: 0.1, candle: 1.0, keyI: 0.06,
    fogColor: 0x241d15, fogDensity: 0.05,
    dust: 0.85, exposure: 0.95,
  }),
});

const PRESET_NAMES = Object.keys(LIGHT_PRESETS);
const TWEEN_SECONDS = 1.2;

/**working copy helpers — numeric + color fields lerp, others copy. */
function lerpParams(out, a, b, t) {
  const colorFields = ["ambient", "hemiSky", "hemiGround", "windowColor", "fogColor"];
  for (const k of Object.keys(b)) {
    if (colorFields.includes(k)) {
      out[k] = out[k] instanceof THREE.Color ? out[k] : new THREE.Color(a[k]);
      out[k].lerp(new THREE.Color(b[k]), t);
    } else if (typeof b[k] === "number") {
      out[k] = a[k] + (b[k] - a[k]) * t;
    } else {
      out[k] = b[k];
    }
  }
  return out;
}

/**
 * @param {{scene, room, reducedMotion?}} opts
 * room supplies candleSpots:[{position:Vector3, flame:Mesh}]
 */
export function createLightingRig({ scene, room, reducedMotion = false }) {
  const spotCount = room.candleSpots.length;

  const ambient = new THREE.AmbientLight(0xfff6e6, 0.9);
  const hemi = new THREE.HemisphereLight(0xeef3f2, 0x8a7a5c, 0.6);
  const windowLight = new THREE.DirectionalLight(0xfff2d8, 3.0);
  windowLight.position.set(7.5, 4.3, -0.9);
  windowLight.target.position.set(-2.2, 0.4, -1.6);
  const key = new THREE.DirectionalLight(0xffe9c4, 0.35);
  key.position.set(0.8, 3.1, -3.4);
  key.target.position.set(0, 1.0, -4.4);

  scene.add(ambient, hemi, windowLight, windowLight.target, key, key.target);

  const candles = room.candleSpots.map((spot, i) => {
    const light = new THREE.PointLight(0xffb45f, 0, 7.5, 2);
    light.position.copy(spot.position).y += 0.06;
    scene.add(light);
    return {
      light,
      flame: spot.flame,
      seed: (i * 127.31 + 11.7) % 9.7,
      base: 3.1 * (0.85 + 0.3 * ((i * 37) % 10) / 10),
    };
  });

  scene.fog = new THREE.FogExp2(0xcfc8b2, 0.012);

  const current = { ...LIGHT_PRESETS.daylight, ambient: new THREE.Color(0xfff6e6), hemiSky: new THREE.Color(0xeef3f2), hemiGround: new THREE.Color(0x8a7a5c), windowColor: new THREE.Color(0xfff2d8), fogColor: new THREE.Color(0xcfc8b2) };

  let transition = null; // {from, to, elapsed}
  let dustPoints = null;
  let dustVelocities = null;
  let dustCount = 0;
  let flameLightCount = spotCount;

  const rig = {
    current,
    get presetName() {
      return transition ? transition.toName : transitionName;
    },
    candleCount: spotCount,
    keyLight: key,
    windowLight,
  };

  let transitionName = "daylight";

  /* ---- dust ---------------------------------------------------------- */
  rig.setDustCount = (n) => {
    if (dustPoints) {
      scene.remove(dustPoints);
      dustPoints.geometry.dispose();
      dustPoints.material.dispose();
      dustPoints = null;
    }
    dustCount = n;
    const pos = new Float32Array(n * 3);
    dustVelocities = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8.4;
      pos[i * 3 + 1] = 0.2 + Math.random() * 2.9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10.8;
      dustVelocities[i * 3] = (Math.random() - 0.5) * 0.02;
      dustVelocities[i * 3 + 1] = 0.006 + Math.random() * 0.012;
      dustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.02,
      map: room.dustTexture,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      sizeAttenuation: true,
      color: 0xfff4dc,
    });
    dustPoints = new THREE.Points(geo, mat);
    dustPoints.name = "dust";
    dustPoints.frustumCulled = false;
    scene.add(dustPoints);
  };

  rig.setFlameLights = (n) => {
    flameLightCount = Math.max(0, Math.min(spotCount, n));
  };

  /* ---- presets --------------------------------------------------------- */
  rig.setPreset = (name, { immediate = false } = {}) => {
    if (!PRESET_NAMES.includes(name)) return false;
    if (immediate) {
      transition = null;
      transitionName = name;
      lerpParams(current, LIGHT_PRESETS[name], LIGHT_PRESETS[name], 1);
      rig._apply();
      return true;
    }
    transition = { fromName: transitionName, toName: name, elapsed: 0 };
    return true;
  };

  /** Push tweened/flickered values into the actual scene objects. */
  rig._apply = () => {
    ambient.color.set(current.ambient);
    ambient.intensity = current.ambientI;
    hemi.color.set(current.hemiSky);
    hemi.groundColor.set(current.hemiGround);
    hemi.intensity = current.hemiI;
    windowLight.color.set(current.windowColor);
    windowLight.intensity = current.windowI;
    key.intensity = current.keyI;
    if (scene.fog) {
      scene.fog.color.set(current.fogColor);
      scene.fog.density = current.fogDensity;
    }
    if (room.windowGlowMesh) {
      room.windowGlowMesh.material.opacity = current.glow;
    }
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const on = i < flameLightCount ? 1 : 0;
      c.light.intensity = c.base * current.candle * on * c.flicker;
      if (c.flame) {
        c.flame.material.opacity = 0.15 + 0.85 * current.candle;
        c.flame.visible = current.candle > 0.02;
        c.flame.scale.y = 0.8 + 0.4 * current.candle * (c.flicker ?? 1);
      }
    }
    if (dustPoints) dustPoints.material.opacity = current.dust * 0.5;
  };

  /* ---- per-frame --------------------------------------------------------- */
  rig.update = (dt, time) => {
    if (transition) {
      transition.elapsed += dt;
      const t = Math.min(1, transition.elapsed / TWEEN_SECONDS);
      const from = LIGHT_PRESETS[transition.fromName];
      const to = LIGHT_PRESETS[transition.toName];
      lerpParams(current, from, to, t * t * (3 - 2 * t)); // smoothstep
      if (t >= 1) {
        transitionName = transition.toName;
        transition = null;
      }
    }
    // flicker: sum of sines, seeded per candle; frozen under reduced motion
    for (const c of candles) {
      c.flicker = reducedMotion
        ? 0.94
        : 0.84 +
          0.1 * Math.sin(time * 7.3 + c.seed) +
          0.06 * Math.sin(time * 13.7 + c.seed * 2.1) +
          0.04 * Math.sin(time * 2.9 + c.seed * 0.7);
    }
    // dust drift with soft wrap
    if (dustPoints && !reducedMotion) {
      const pos = dustPoints.geometry.attributes.position;
      const arr = pos.array;
      for (let i = 0; i < dustCount; i++) {
        arr[i * 3] += dustVelocities[i * 3] * dt;
        arr[i * 3 + 1] += dustVelocities[i * 3 + 1] * dt;
        arr[i * 3 + 2] += dustVelocities[i * 3 + 2] * dt;
        if (arr[i * 3 + 1] > 3.2) arr[i * 3 + 1] = 0.15;
        if (arr[i * 3] > 4.4) arr[i * 3] = -4.4;
        if (arr[i * 3] < -4.4) arr[i * 3] = 4.4;
        if (arr[i * 3 + 2] > 5.9) arr[i * 3 + 2] = -5.9;
        if (arr[i * 3 + 2] < -5.9) arr[i * 3 + 2] = 5.9;
      }
      pos.needsUpdate = true;
    }
    rig._apply();
  };

  rig._apply();
  return rig;
}
