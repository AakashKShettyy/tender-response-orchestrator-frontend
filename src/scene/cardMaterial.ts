import { AdditiveBlending, ShaderMaterial } from 'three'

/**
 * Holographic glass for the question cards. Additive blending makes the draw order irrelevant (96 instances
 * cannot be depth-sorted individually), and lets dark glass fall away to the page background so only the
 * luminous edges, text bars and fresnel rim remain.
 *
 * `flat` is derived from the instance scale: once a card has become a thin line of the final response it
 * switches from "card with text bars" to a solid bar.
 */
const vertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vTint;
  varying float vFlat;

  void main() {
    vUv = uv;
    float sy = length(instanceMatrix[1].xyz);
    vFlat = 1.0 - smoothstep(0.045, 0.12, sy);
    mat3 normalMat = mat3(instanceMatrix);
    vNormal = normalize(normalMatrix * normalMat * normal);
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    #ifdef USE_INSTANCING_COLOR
      vTint = instanceColor;
    #else
      vTint = vec3(1.0);
    #endif
    gl_Position = projectionMatrix * mv;
  }
`

const fragment = /* glsl */ `
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vTint;
  varying float vFlat;

  float box(vec2 uv, vec2 lo, vec2 hi) {
    vec2 s = step(lo, uv) * step(uv, hi);
    return s.x * s.y;
  }

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);
    float fresnel = pow(1.0 - abs(dot(n, v)), 2.2);

    // text bars: a small number tag and three ragged lines, like a question on a page
    float tag = box(vUv, vec2(0.08, 0.78), vec2(0.27, 0.9));
    float lines = box(vUv, vec2(0.08, 0.585), vec2(0.92, 0.655))
                + box(vUv, vec2(0.08, 0.415), vec2(0.78, 0.485))
                + box(vUv, vec2(0.08, 0.245), vec2(0.52, 0.315));
    float content = (tag * 0.95 + lines * 0.55) * (1.0 - vFlat);

    vec2 edgeDist = min(vUv, 1.0 - vUv);
    float edge = 1.0 - smoothstep(0.0, 0.03, min(edgeDist.x * 0.62, edgeDist.y));

    vec3 glassBody = vTint * 0.07;
    vec3 glow = vTint * (fresnel * 1.15 + content * 0.85 + edge * 0.5 * (1.0 - vFlat));
    vec3 color = glassBody + glow;

    // once it is a line of the response, it is a solid bar
    color = mix(color, vTint * 0.78 + fresnel * 0.2, vFlat);

    float alpha = (0.5 + fresnel * 0.4 + content * 0.3 + edge * 0.3) * mix(1.0, 1.4, vFlat);
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0) * uOpacity);
  }
`

export function createCardMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: { uOpacity: { value: 1 }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  })
}
