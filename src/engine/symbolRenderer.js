/**
 * src/engine/symbolRenderer.js
 * Symbols & Sigils — Phase 2. The single entry point the rest of the app
 * uses to own a live symbol: build, animate, replay, dispose.
 *
 * "Remember how they were made": strokes carry their primitive ids, the
 * geometry record carries strokeOrder, and replay() re-runs the exact
 * recorded order. Ritual Mode will later ask instances to replay slowly
 * while the user traces alongside.
 */
import * as THREE from "three";
import { buildSymbol, makeBrassMaterial } from "./builder.js";
import { BEHAVIORS } from "./behaviors.js";

const BASE_DURATION = 3.4; // seconds at speed 1

export class SymbolInstance {
  constructor(symbol, { radius = 0.011, radialSegments = 8, material = null } = {}) {
    this.symbol = symbol;
    this.params = symbol.animationParams || {};
    const built = buildSymbol(symbol, { material: material ?? makeBrassMaterial(), radius, radialSegments });
    this.group = built.group;
    this.strokes = built.strokes;
    this.lengths = null; // lazily computed
    this.t = 0;
    this.duration = BASE_DURATION / (this.params.speed ?? 1);
    this.behavior = BEHAVIORS[symbol.animationType] ?? BEHAVIORS.draw;
    this.behavior.init?.(this);
    this._elapsed = 0;
  }

  /** Advance reveal + behavior. dt seconds; ctx from the host scene. */
  update(dt, ctx) {
    if (this.t < 1) {
      this._elapsed += dt;
      this.t = Math.min(1, this._elapsed / this.duration);
    }
    this.behavior.update(this, dt, ctx);
  }

  /** Jump to the completed state (reduced motion, static previews). */
  setFinal() {
    this.t = 1;
    this._elapsed = this.duration;
    this.behavior.update(this, 0, { pointer: null, reducedMotion: true, time: 0 });
    this.behavior.update(this, 0, { pointer: null, reducedMotion: false, time: 0 });
  }

  /** Replay the recorded stroke order from the beginning. */
  replay() {
    this.t = 0;
    this._elapsed = 0;
    for (const s of this.strokes) {
      s.geom.setDrawRange(0, 0);
      s.mesh.position.z = 0;
    }
    this.group.scale.set(1, 1, 1);
    this.group.rotation.z = 0;
  }

  dispose() {
    for (const s of this.strokes) {
      s.geom.dispose();
    }
    this.group.traverse((o) => {
      if (o.geometry && !this.strokes.some((s) => s.geom === o.geometry)) o.geometry.dispose();
      if (o.material) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose?.());
      }
    });
  }
}
