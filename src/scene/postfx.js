/**
 * src/scene/postfx.js — a small, hand-rolled post pass (Phase 7).
 *
 * The spec asks for bloom and vignette on the 3D pass only. Rather than
 * vendor the whole examples/jsm composer stack for two effects, this is
 * a minimal pipeline with exactly what the room needs:
 *
 *   scene → render target → bright-pass (half res) → blur H → blur V
 *         → composite (scene + bloom·strength, vignette, gentle grain)
 *
 * Tier-gated by the caller: bloom on museum/gallery, vignette everywhere,
 * plain renderer.render on plate. The grain time is stepped, so nothing
 * animates under reduced motion. Context-loss safe: sizes rebuild from
 * setSize().
 */

import * as THREE from "three";

const VERT = /* glsl */ `
precision highp float;
attribute vec3 position; // RawShaderMaterial injects nothing — declare built-ins
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const BRIGHT_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tex;
uniform float threshold;
void main() {
  vec3 c = texture2D(tex, vUv).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float k = smoothstep(threshold, threshold + 0.35, l);
  gl_FragColor = vec4(c * k, 1.0);
}
`;

const BLUR_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tex;
uniform vec2 dir; // texel-sized direction
void main() {
  vec3 sum = texture2D(tex, vUv).rgb * 0.227;
  sum += (texture2D(tex, vUv + dir * 1.384).rgb + texture2D(tex, vUv - dir * 1.384).rgb) * 0.316;
  sum += (texture2D(tex, vUv + dir * 3.230).rgb + texture2D(tex, vUv - dir * 3.230).rgb) * 0.070;
  gl_FragColor = vec4(sum, 1.0);
}
`;

const COMPOSITE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D sceneTex;
uniform sampler2D bloomTex;
uniform float bloomStrength;
uniform float vignette;
uniform float grain;
uniform float frame;
uniform float aspect;

float rnd(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 c = texture2D(sceneTex, vUv).rgb;
  c += texture2D(bloomTex, vUv).rgb * bloomStrength;

  // vignette: warm-dark corners — museum light falloff, not drama
  vec2 d = (vUv - 0.5) * vec2(max(aspect, 1.0), max(1.0 / aspect, 1.0));
  float v = 1.0 - vignette * smoothstep(0.45, 1.05, length(d));
  c *= v;

  // faint grain floor so gentle gradients never band (stepped, not animated)
  c += (rnd(vUv * 913.7 + frame) - 0.5) * grain;

  gl_FragColor = vec4(c, 1.0);
}
`;

export function createPostFX({ renderer }) {
  const params = { bloom: 0.5, vignette: 0.42, grain: 0.012, threshold: 0.72 };

  const rtScene = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType });
  const rtA = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const rtB = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });

  const materials = {
    bright: new THREE.RawShaderMaterial({
      vertexShader: VERT,
      fragmentShader: BRIGHT_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: { tex: { value: rtScene.texture }, threshold: { value: params.threshold } },
    }),
    blurH: new THREE.RawShaderMaterial({
      vertexShader: VERT,
      fragmentShader: BLUR_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: { tex: { value: rtA.texture }, dir: { value: new THREE.Vector2(1 / 64, 0) } },
    }),
    blurV: new THREE.RawShaderMaterial({
      vertexShader: VERT,
      fragmentShader: BLUR_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: { tex: { value: rtB.texture }, dir: { value: new THREE.Vector2(0, 1 / 64) } },
    }),
    composite: new THREE.RawShaderMaterial({
      vertexShader: VERT,
      fragmentShader: COMPOSITE_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        sceneTex: { value: rtScene.texture },
        bloomTex: { value: rtA.texture },
        bloomStrength: { value: params.bloom },
        vignette: { value: params.vignette },
        grain: { value: params.grain },
        frame: { value: 0 },
        aspect: { value: 1 },
      },
    }),
  };

  // one fullscreen triangle, material swapped per pass
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  const quad = new THREE.Mesh(geo, materials.composite);
  quad.frustumCulled = false;
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const fx = {
    bloomEnabled: true,
    _frame: 0,

    setSize(w, h) {
      rtScene.setSize(w, h);
      const bw = Math.max(1, Math.floor(w / 2));
      const bh = Math.max(1, Math.floor(h / 2));
      rtA.setSize(bw, bh);
      rtB.setSize(bw, bh);
      materials.composite.uniforms.aspect.value = w / h;
      materials.blurH.uniforms.dir.value.set(1 / bw, 0);
      materials.blurV.uniforms.dir.value.set(0, 1 / bh);
    },

    setBloomEnabled(on) {
      fx.bloomEnabled = Boolean(on);
    },

    setVignette(v) {
      params.vignette = v;
      materials.composite.uniforms.vignette.value = v;
    },

    render(scene, camera) {
      fx._frame++;
      materials.composite.uniforms.frame.value = fx._frame % 8;

      renderer.setRenderTarget(rtScene);
      renderer.render(scene, camera);

      if (fx.bloomEnabled) {
        quad.material = materials.bright;
        renderer.setRenderTarget(rtA);
        renderer.render(quadScene, quadCam);

        quad.material = materials.blurH;
        renderer.setRenderTarget(rtB);
        renderer.render(quadScene, quadCam);

        quad.material = materials.blurV;
        renderer.setRenderTarget(rtA);
        renderer.render(quadScene, quadCam);
      } else {
        materials.composite.uniforms.bloomTex.value = rtA.texture;
      }

      quad.material = materials.composite;
      renderer.setRenderTarget(null);
      renderer.render(quadScene, quadCam);
    },

    dispose() {
      rtScene.dispose();
      rtA.dispose();
      rtB.dispose();
      geo.dispose();
      for (const m of Object.values(materials)) m.dispose();
    },
  };
  return fx;
}
