/**
 * src/scene/quality.js — the three quality tiers and their detection.
 *
 * Tiers are a single settings object consulted by the room, the lighting
 * rig, and the page. "auto" picks a tier from device signals at boot and
 * may step DOWN once, based on a measured-FPS probe — never up (a machine
 * that struggles must not be bounced between tiers).
 */

export const TIERS = Object.freeze(["plate", "gallery", "museum"]);

/** One settings object per tier. Every consumer reads from here only. */
export const QUALITY_SETTINGS = Object.freeze({
  plate: Object.freeze({
    pixelRatio: 1,
    shadows: false,
    shadowMapSize: 512,
    dust: 70,
    anisotropy: 2,
    flameLights: 2, // number of candle point-lights allowed
    label: "Plate — study view; no shadows, minimal atmosphere",
  }),
  gallery: Object.freeze({
    pixelRatio: 1.5,
    shadows: true,
    shadowMapSize: 1024,
    dust: 170,
    anisotropy: 4,
    flameLights: 3,
    label: "Gallery — shadows on, moderate atmosphere",
  }),
  museum: Object.freeze({
    pixelRatio: 2,
    shadows: true,
    shadowMapSize: 2048,
    dust: 320,
    anisotropy: 8,
    flameLights: 4,
    label: "Museum — full shadows, full atmosphere",
  }),
});

/**
 * Boot-time guess from device signals only (no rendering yet).
 * @returns {typeof TIERS[number]}
 */
export function detectTier({ devicePixelRatio = 1, hardwareConcurrency = 4, deviceMemory = null } = {}) {
  const cores = hardwareConcurrency || 4;
  if (cores >= 8 && devicePixelRatio >= 1.25) return "museum";
  if (cores <= 2 || (deviceMemory !== null && deviceMemory <= 2)) return "plate";
  return "gallery";
}

/** Neighboring tier in a direction, clamped ("museum" never steps up). */
export function stepTier(tier, dir) {
  const i = TIERS.indexOf(tier);
  return TIERS[Math.min(TIERS.length - 1, Math.max(0, i + (dir > 0 ? 1 : -1)))];
}

/**
 * Measures average FPS over a window and reports once. Pure logic — the
 * page feeds it dt values from its rAF loop.
 */
export class FpsProbe {
  constructor({ windowFrames = 150, threshold = 28, onResult } = {}) {
    this._window = windowFrames;
    this._threshold = threshold;
    this._onResult = onResult;
    this._times = [];
    this._done = false;
  }

  /** @param {number} dt frame delta in seconds */
  push(dt) {
    if (this._done) return;
    this._times.push(dt);
    if (this._times.length > this._window) this._times.shift();
    if (this._times.length === this._window) {
      this._done = true;
      const avg = this._times.reduce((a, b) => a + b, 0) / this._times.length;
      const fps = 1 / avg;
      this._onResult({ fps, belowThreshold: fps < this._threshold });
    }
  }

  stop() {
    this._done = true;
  }
}
