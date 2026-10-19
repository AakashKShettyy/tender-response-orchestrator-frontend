import { AdditiveBlending, Color, ShaderMaterial } from 'three'

/** Soft radial glow for a flat plane. Cheap, additive, and works with the bloom pass. */
export function createGlowMaterial(color: readonly [number, number, number], falloff = 2.2): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color(color[0], color[1], color[2]) }, uIntensity: { value: 1 }, uFalloff: { value: falloff } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uFalloff;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float a = pow(max(0.0, 1.0 - d), uFalloff) * uIntensity;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  })
}
