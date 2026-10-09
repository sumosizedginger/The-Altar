/**
 * src/audio/audioEngine.js — procedural, positional audio (Phase 6).
 *
 * Every sound is synthesized with Web Audio — the synth RECIPE for each
 * tool lives in data/tools.js; this engine implements the recipe families
 * (bell, bowl, flame, pour, granular, smoke, swish, stone, cloth, chime).
 * No audio files exist in the repo; nothing is downloaded.
 *
 * Positional: each sound plays through a PannerNode placed at the item's
 * world position; the listener is driven from the camera every frame
 * (updateListener). Distance rolloff makes the room audible — a bell at
 * the altar is quieter at the door, as it should be.
 *
 * The AudioContext is injectable so headless tests can verify the graph
 * with a recording stub; in the browser it is created lazily on the first
 * user gesture (autoplay policy) and every public call is safe when audio
 * is unavailable — a silent room must never become a broken page.
 */

/** Recipe families implemented by this engine. */
export const SYNTH_TYPES = Object.freeze([
  "bell", "bowl", "flame", "pour", "granular", "smoke", "swish", "stone", "cloth", "chime",
]);

const NOTE = (freq) => freq;

/** Create the engine. ctxFactory is injectable (tests pass a stub). */
export function createAudioEngine({ ctxFactory = null, volume = 0.8 } = {}) {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let disabled = false;
  let started = false;
  const loopers = new Set();

  function ensureCtx() {
    if (ctx || disabled) return ctx;
    try {
      // an injected factory is a plain function returning a context;
      // the browser default is a constructor
      const ctxOrCtor = ctxFactory ?? globalThis.AudioContext;
      if (!ctxOrCtor) {
        disabled = true;
        return null;
      }
      ctx = typeof ctxFactory === "function" ? ctxFactory() : new ctxOrCtor();
      master = ctx.createGain();
      master.gain.value = volume;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      master.connect(comp);
      comp.connect(ctx.destination);
      // one second of white noise, shared by every noise recipe
      const len = ctx.sampleRate;
      noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let seed = 1234567;
      for (let i = 0; i < len; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        data[i] = (seed / 0x3fffffff) - 1;
      }
    } catch {
      disabled = true;
      return null;
    }
    return ctx;
  }

  /** First-gesture unlock (browsers start contexts suspended). */
  function unlock() {
    const c = ensureCtx();
    if (!c) return false;
    if (c.state === "suspended") c.resume?.();
    started = true;
    return true;
  }

  /* ---- small node helpers (stub-safe) ------------------------------------ */
  function gain(v) {
    const g = ctx.createGain();
    g.gain.value = v;
    return g;
  }
  function osc(type, freq) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    return o;
  }
  function noiseSource() {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuffer;
    s.loop = true;
    return s;
  }
  function filter(type, freq, q = 1) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }
  function expDecay(param, peak, seconds, at = 0) {
    param.cancelScheduledValues(0);
    param.setValueAtTime(0.0001, at);
    param.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + 0.008);
    param.exponentialRampToValueAtTime(0.0001, at + seconds);
  }
  function pannerAt(pos) {
    const p = ctx.createPanner();
    p.panningModel = "equalpower";
    p.distanceModel = "inverse";
    p.refDistance = 1.6;
    p.maxDistance = 14;
    p.rolloffFactor = 1.1;
    if (pos) {
      if (p.positionX) {
        p.positionX.value = pos.x;
        p.positionY.value = pos.y;
        p.positionZ.value = pos.z;
      } else if (p.setPosition) {
        p.setPosition(pos.x, pos.y, pos.z); // older API
      }
    }
    return p;
  }

  /* ---- recipes (one per family) ------------------------------------------- */
  const recipes = {
    /** Inharmonic partials (1, 2.4, 3.0, 4.2) with exponential decay. */
    bell(dest, { at = 0, level = 1 } = {}) {
      const t = ctx.currentTime + at;
      const partials = [[1, 0.5, 4.2], [2.4, 0.28, 3.1], [3.0, 0.16, 2.2], [4.2, 0.09, 1.4]];
      const out = [];
      for (const [ratio, amp, decay] of partials) {
        const o = osc("sine", NOTE(523) * ratio);
        const g = gain(0);
        expDecay(g.gain, amp * 0.5 * level, decay);
        o.connect(g);
        g.connect(dest);
        o.start(t);
        o.stop(t + decay + 0.1);
        out.push(o);
      }
      return out;
    },
    /** Two close detuned partials, slow beating, long release. */
    bowl(dest, { at = 0, level = 1 } = {}) {
      const t = ctx.currentTime + at;
      const out = [];
      for (const [freq, amp, detune] of [[432, 0.4, 0], [432.9, 0.3, 0.9], [866, 0.1, 0]]) {
        const o = osc("sine", freq + detune);
        const g = gain(0);
        const atk = 0.4;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(amp * 0.4 * level, t + atk);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 9);
        o.connect(g);
        g.connect(dest);
        o.start(t);
        o.stop(t + 9.2);
        out.push(o);
      }
      return out;
    },
    /** Filtered noise, slow amplitude LFO, sparse crackle bursts. */
    flame(dest, { seconds = 6, level = 1 } = {}) {
      const t = ctx.currentTime;
      const src = noiseSource();
      const lp = filter("lowpass", 900, 0.6);
      const g = gain(0.0001);
      const lfo = osc("sine", 2.3);
      const lfoGain = gain(0.05 * level);
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.11 * level, t + 0.7);
      g.gain.setTargetAtTime(0.0001, t + seconds - 0.9, 0.4);
      src.connect(lp);
      lp.connect(g);
      g.connect(dest);
      src.start(t);
      lfo.start(t);
      src.stop(t + seconds);
      lfo.stop(t + seconds);
      // crackles: three short bright bursts
      for (const at of [0.9 + Math.random(), 2.7 + Math.random(), 4.3 + Math.random()]) {
        if (at > seconds - 0.4) break;
        const c = noiseSource();
        const hp = filter("highpass", 2600, 1);
        const cg = gain(0);
        cg.gain.setValueAtTime(0.05 * level, t + at);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.05);
        c.connect(hp);
        hp.connect(cg);
        cg.connect(dest);
        c.start(t + at);
        c.stop(t + at + 0.08);
      }
      return [src, lfo];
    },
    /** Band-passed noise with descending center (liquid pour). */
    pour(dest, { level = 1 } = {}) {
      const t = ctx.currentTime;
      const src = noiseSource();
      const bp = filter("bandpass", 1400, 2.2);
      bp.frequency.setValueAtTime(1700, t);
      bp.frequency.exponentialRampToValueAtTime(520, t + 1.5);
      const g = gain(0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.16 * level, t + 0.18);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      src.connect(bp);
      bp.connect(g);
      g.connect(dest);
      src.start(t);
      src.stop(t + 2);
      return [src];
    },
    /** Very short filtered grains, randomized spacing (salt falling). */
    granular(dest, { level = 1 } = {}) {
      const t = ctx.currentTime;
      for (let i = 0; i < 14; i++) {
        const at = t + i * 0.045 + Math.random() * 0.03;
        const g = ctx.createGain();
        const bp = filter("bandpass", 2400 + Math.random() * 2600, 6);
        const src = noiseSource();
        g.gain.setValueAtTime(0.06 * level, at);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
        src.connect(bp);
        bp.connect(g);
        g.connect(dest);
        src.start(at);
        src.stop(at + 0.05);
      }
      return [];
    },
    /** Long-release, very quiet filtered noise with high shimmer. */
    smoke(dest, { seconds = 8, level = 0.6 } = {}) {
      const t = ctx.currentTime;
      const src = noiseSource();
      const lp = filter("lowpass", 480, 0.8);
      const g = gain(0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.045 * level, t + 1.4);
      g.gain.setTargetAtTime(0.0001, t + seconds - 2, 0.9);
      src.connect(lp);
      lp.connect(g);
      g.connect(dest);
      src.start(t);
      src.stop(t + seconds);
      return [src];
    },
    /** Band-pass sweep, rising then falling (a wand's swish). */
    swish(dest, { level = 1 } = {}) {
      const t = ctx.currentTime;
      const src = noiseSource();
      const bp = filter("bandpass", 500, 1.6);
      bp.frequency.setValueAtTime(500, t);
      bp.frequency.exponentialRampToValueAtTime(2400, t + 0.22);
      bp.frequency.exponentialRampToValueAtTime(400, t + 0.5);
      const g = gain(0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.13 * level, t + 0.2);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      src.connect(bp);
      bp.connect(g);
      g.connect(dest);
      src.start(t);
      src.stop(t + 0.6);
      return [src];
    },
    /** 60–90 Hz thump plus a click. */
    stone(dest, { level = 1 } = {}) {
      const t = ctx.currentTime;
      const o = osc("sine", 74);
      o.frequency.exponentialRampToValueAtTime(52, t + 0.12);
      const g = gain(0);
      expDecay(g.gain, 0.5 * level, 0.22);
      o.connect(g);
      g.connect(dest);
      o.start(t);
      o.stop(t + 0.3);
      const c = noiseSource();
      const hp = filter("highpass", 1800, 0.8);
      const cg = gain(0);
      cg.gain.setValueAtTime(0.08 * level, t);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      c.connect(hp);
      hp.connect(cg);
      cg.connect(dest);
      c.start(t);
      c.stop(t + 0.05);
      return [o];
    },
    /** Soft-attack filtered noise with flutter decay (fabric settling). */
    cloth(dest, { level = 1 } = {}) {
      const t = ctx.currentTime;
      const src = noiseSource();
      const bp = filter("bandpass", 950, 0.9);
      const g = gain(0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.12 * level, t + 0.09);
      g.gain.exponentialRampToValueAtTime(0.02 * level, t + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
      src.connect(bp);
      bp.connect(g);
      g.connect(dest);
      src.start(t);
      src.stop(t + 0.9);
      return [src];
    },
    /** Tiny UI blip — quiet, high, friendly. */
    chime(dest, { at = 0, level = 0.5 } = {}) {
      const t = ctx.currentTime + at;
      const o = osc("sine", 1180);
      const g = gain(0);
      expDecay(g.gain, 0.08 * level, 0.35);
      o.connect(g);
      g.connect(dest);
      o.start(t);
      o.stop(t + 0.4);
      return [o];
    },
  };

  /* ---- public API ------------------------------------------------------------ */
  const engine = {
    /** @returns true when audio is live (context running). */
    unlock,
    get enabled() {
      return Boolean(ctx) && !disabled && started;
    },
    get state() {
      return ctx?.state ?? "unavailable";
    },

    /** Fire a one-shot (or looped, via seconds) sound at a world position. */
    playAt(type, pos = null, opts = {}) {
      if (!SYNTH_TYPES.includes(type)) return false;
      const c = ensureCtx();
      if (!c || !started) return false;
      if (c.state === "suspended") c.resume?.();
      const p = pannerAt(pos);
      p.connect(master);
      const nodes = recipes[type](p, opts) ?? [];
      // auto-stop long loopers
      const secs = opts.seconds ?? 0;
      void secs;
      return { panner: p, nodes };
    },

    /** Update the listener from the camera each frame. */
    updateListener(pos, forward, up) {
      if (!ctx || !ctx.listener) return;
      const L = ctx.listener;
      if (L.positionX) {
        const t = ctx.currentTime;
        L.positionX.setTargetAtTime(pos.x, t, 0.05);
        L.positionY.setTargetAtTime(pos.y, t, 0.05);
        L.positionZ.setTargetAtTime(pos.z, t, 0.05);
        L.forwardX.setTargetAtTime(forward.x, t, 0.05);
        L.forwardY.setTargetAtTime(forward.y, t, 0.05);
        L.forwardZ.setTargetAtTime(forward.z, t, 0.05);
        L.upX.setTargetAtTime(up.x, t, 0.05);
        L.upY.setTargetAtTime(up.y, t, 0.05);
        L.upZ.setTargetAtTime(up.z, t, 0.05);
      } else if (L.setPosition) {
        L.setPosition(pos.x, pos.y, pos.z);
        L.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
      }
    },

    setVolume(v) {
      volume = v;
      if (master) master.gain.value = v;
    },

    /** Sound for a placed tool record (id → its data's sound.type). */
    playTool(type, pos, opts = {}) {
      return engine.playAt(type, pos, { level: 0.9, ...opts });
    },

    dispose() {
      for (const l of loopers) {
        try {
          l.stop?.();
        } catch {
          /* already stopped */
        }
      }
      loopers.clear();
      try {
        ctx?.close?.();
      } catch {
        /* already closed */
      }
      ctx = null;
      master = null;
    },
  };

  return engine;
}
