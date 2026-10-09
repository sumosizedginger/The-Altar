/**
 * src/ui/preview.js — the Codex's live symbol preview.
 *
 * ONE WebGL context for the detail pane, reused for every symbol (the
 * previous instance is disposed before the next is built). Same camera,
 * lights, and brass material defaults as the /debug grid so what the
 * Codex shows is what the altar will show.
 *
 * DOM/WebGL separation (spec §6): the canvas sets pointer-events:none;
 * pointer position for the eye behavior is read from a document-level
 * listener and converted to scene coordinates here — the DOM never
 * receives drags "into" WebGL and WebGL never captures the pointer.
 */

import * as THREE from "three";
import { SymbolInstance } from "../engine/symbolRenderer.js";
import { EVENTS } from "../core/events.js";

export class SymbolPreview {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import("../core/eventBus.js").EventBus} bus
   * @param {{reducedMotion?: boolean}} [opts]
   */
  constructor(canvas, bus, { reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.bus = bus;
    this.reducedMotion = reducedMotion;
    this.instance = null;
    this._visible = true;
    this._raf = 0;
    this._start = performance.now();
    this.pointer = new THREE.Vector2();
    this._pointerInside = false;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0xfff2dc, 0.65));
    const key = new THREE.DirectionalLight(0xffe9c4, 1.4);
    key.position.set(0.6, 1.0, 0.8);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xc5a059, 0.5);
    rim.position.set(-0.7, -0.3, -0.6);
    this.scene.add(rim);

    this.camera = new THREE.OrthographicCamera(-0.68, 0.68, 0.68, -0.68, 0.01, 10);
    this.camera.position.set(0, 0, 2);

    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvas.parentElement ?? canvas);
    this._resize();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pause();
      else this.resume();
    });

    // Eye-behavior pointer tracking, deliberately NOT on the canvas:
    // the canvas never captures the pointer (pointer-events:none), so
    // document scrolling/clicks stay DOM through and through.
    document.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      const inside =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      this._pointerInside = inside;
      if (inside) {
        this.pointer.set(
          ((e.clientX - r.left) / r.width) * 2 - 1,
          -(((e.clientY - r.top) / r.height) * 2 - 1),
        );
      }
    });

    this.resume();
    this._frame();
  }

  _resize() {
    const r = this.canvas.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return; // pane hidden
    this.renderer.setSize(r.width, r.height, false);
    this.camera.left = -0.68;
    this.camera.right = 0.68;
    this.camera.top = 0.68;
    this.camera.bottom = -0.68;
    this.camera.updateProjectionMatrix();
    if (this.reducedMotion) this.renderOnce();
  }

  /** Build and begin a symbol; disposes whatever was there. */
  show(symbol) {
    if (this.instance) {
      this.scene.remove(this.instance.group);
      this.instance.dispose();
      this.instance = null;
    }
    this.instance = new SymbolInstance(symbol);
    if (this.reducedMotion) this.instance.setFinal();
    this.scene.add(this.instance.group);
    this._start = performance.now();
    this.bus.emit(EVENTS.PREVIEW_PLAY, { symbolId: symbol.id });
    if (this.reducedMotion) this.renderOnce();
    return this.instance;
  }

  /** Replay the recorded stroke order (disabled under reduced motion). */
  replay() {
    if (!this.instance || this.reducedMotion) return false;
    this.instance.replay();
    this.bus.emit(EVENTS.PREVIEW_REPLAY, { symbolId: this.instance.symbol.id });
    return true;
  }

  pause() {
    this._visible = false;
  }

  resume() {
    this._visible = true;
  }

  _frame() {
    this._raf = requestAnimationFrame(() => this._frame());
    if (!this._visible || !this.instance || this.reducedMotion) return;
    const t = (performance.now() - this._start) / 1000;
    const ctx = {
      time: t,
      reducedMotion: this.reducedMotion,
      pointer: this._pointerInside ? this.pointer : null,
    };
    this.instance.update(1 / 60, ctx);
    this.renderer.render(this.scene, this.camera);
  }

  /** Drive exactly one settled frame (reduced motion, hidden pane). */
  renderOnce() {
    if (!this.instance) return;
    if (this.reducedMotion) this.instance.setFinal();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    this._ro.disconnect();
    if (this.instance) {
      this.instance.dispose();
      this.instance = null;
    }
    this.renderer.dispose();
  }
}
