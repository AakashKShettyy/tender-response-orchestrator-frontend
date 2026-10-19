import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import { clamp } from '../lib/math'
import { mulberry32 } from '../lib/rng'
import { createGlowMaterial } from './glow'
import { AGENT_POSITIONS, GATE_TILT_Y, GATE_X, SHEET_BOUNDS, TINTS, sceneWeights } from './poses'
import { sceneState } from './sceneState'

interface PartProps {
  getProgress: () => number
  getTime: () => number
}

const easeOutBack = (t: number): number => {
  const c1 = 1.70158
  const c3 = c1 + 1
  const x = clamp(t)
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

const basic = (color: Color | string | number, opacity = 1) =>
  new MeshBasicMaterial({ color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false, toneMapped: false })

/** Three specialist nodes: a wireframe crystal, a bright core and two orbit rings each. */
export function Agents({ getProgress, getTime }: PartProps) {
  const groups = useRef<(Group | null)[]>([])
  const parts = useMemo(
    () =>
      TINTS.map((tint) => {
        const color = new Color(tint[0], tint[1], tint[2])
        return {
          crystal: new IcosahedronGeometry(0.34, 1),
          core: new SphereGeometry(0.13, 24, 24),
          ringA: new TorusGeometry(0.5, 0.006, 8, 96),
          ringB: new TorusGeometry(0.62, 0.004, 8, 96),
          glow: new PlaneGeometry(2.4, 2.4),
          wire: new MeshBasicMaterial({ color, wireframe: true, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
          coreMat: basic(color.clone().multiplyScalar(1.6)),
          ringMat: basic(color),
          glowMat: createGlowMaterial(tint),
        }
      }),
    [],
  )

  useEffect(
    () => () => {
      for (const p of parts) {
        p.crystal.dispose(); p.core.dispose(); p.ringA.dispose(); p.ringB.dispose(); p.glow.dispose()
        p.wire.dispose(); p.coreMat.dispose(); p.ringMat.dispose(); p.glowMat.dispose()
      }
    },
    [parts],
  )

  useFrame(() => {
    const sw = sceneWeights(getProgress())
    const w = sw.agents * sw.canvas
    const t = getTime()
    for (let i = 0; i < parts.length; i++) {
      const g = groups.current[i]
      const p = parts[i]
      if (!g || !p) continue
      g.visible = w > 0.001
      const pop = easeOutBack(clamp(w * 1.15 - i * 0.05))
      g.scale.setScalar(Math.max(0.0001, pop))
      g.rotation.y = t * 0.35 + i
      g.rotation.x = Math.sin(t * 0.4 + i) * 0.2
      p.wire.opacity = 0.85 * w
      p.coreMat.opacity = w
      p.ringMat.opacity = 0.7 * w
      p.glowMat.uniforms.uIntensity!.value = 0.55 * w * (0.85 + 0.15 * Math.sin(t * 1.7 + i * 2))
    }
  })

  return (
    <>
      {parts.map((p, i) => {
        const pos = AGENT_POSITIONS[i] as readonly [number, number, number]
        return (
          <group key={i} position={[pos[0], pos[1], pos[2]]}>
            <mesh geometry={p.glow} material={p.glowMat} position={[0, 0, -0.2]} />
            <group ref={(el) => { groups.current[i] = el }}>
              <mesh geometry={p.crystal} material={p.wire} />
              <mesh geometry={p.core} material={p.coreMat} />
              <mesh geometry={p.ringA} material={p.ringMat} rotation={[Math.PI / 2.4, 0, 0]} />
              <mesh geometry={p.ringB} material={p.ringMat} rotation={[Math.PI / 1.8, 0.8, 0]} />
            </group>
          </group>
        )
      })}
    </>
  )
}

/** The review gate: a tilted ring of light that cards pass through, with scanning rings sweeping through it. */
export function Gate({ getProgress, getTime }: PartProps) {
  const group = useRef<Group>(null)
  const scans = useRef<(Mesh | null)[]>([])
  const geo = useMemo(
    () => ({
      main: new TorusGeometry(2.15, 0.012, 16, 200),
      outer: new TorusGeometry(2.36, 0.004, 8, 200),
      scan: new RingGeometry(2.05, 2.12, 96),
      disc: new PlaneGeometry(4.6, 4.6),
    }),
    [],
  )
  const mat = useMemo(
    () => ({
      main: basic(new Color(0.6, 0.88, 1).multiplyScalar(1.1)),
      outer: basic(new Color(0.6, 0.88, 1)),
      disc: createGlowMaterial([0.45, 0.8, 1], 1.4),
      scans: [0, 1, 2].map(
        () => new MeshBasicMaterial({ color: new Color(0.6, 0.9, 1), transparent: true, side: DoubleSide, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
      ),
    }),
    [],
  )
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose())
      mat.main.dispose(); mat.outer.dispose(); mat.disc.dispose(); mat.scans.forEach((m) => m.dispose())
    },
    [geo, mat],
  )

  useFrame(() => {
    const sw = sceneWeights(getProgress())
    const w = sw.gate * sw.canvas
    const t = getTime()
    const g = group.current
    if (!g) return
    g.visible = w > 0.001
    g.scale.setScalar(0.6 + 0.4 * w)
    mat.main.opacity = w
    mat.outer.opacity = 0.5 * w
    mat.disc.uniforms.uIntensity!.value = 0.13 * w
    for (let i = 0; i < scans.current.length; i++) {
      const m = scans.current[i]
      if (!m) continue
      const phase = (t * 0.45 + i / 3) % 1
      m.position.z = (phase - 0.5) * 1.8
      const s = 0.97 + 0.03 * Math.sin(phase * Math.PI)
      m.scale.setScalar(s)
      ;(m.material as MeshBasicMaterial).opacity = 0.35 * w * Math.sin(phase * Math.PI)
    }
  })

  return (
    <group ref={group} position={[GATE_X, 0, 0]} rotation={[0, GATE_TILT_Y, 0]}>
      <mesh geometry={geo.disc} material={mat.disc} />
      <mesh geometry={geo.main} material={mat.main} />
      <mesh geometry={geo.outer} material={mat.outer} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => { scans.current[i] = el }} geometry={geo.scan} material={mat.scans[i]} />
      ))}
    </group>
  )
}

/** A pulsing red halo around the card that was held back. */
export function HeldHalo({ getProgress, getTime }: PartProps) {
  const group = useRef<Group>(null)
  const geo = useMemo(() => ({ ring: new TorusGeometry(0.62, 0.012, 8, 64), glow: new PlaneGeometry(2.0, 2.0) }), [])
  const mat = useMemo(() => ({ ring: basic(new Color(1, 0.4, 0.42).multiplyScalar(1.4)), glow: createGlowMaterial([1, 0.3, 0.35], 1.8) }), [])
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose())
      Object.values(mat).forEach((m) => m.dispose())
    },
    [geo, mat],
  )
  useFrame(() => {
    const sw = sceneWeights(getProgress())
    const w = sw.hold * sw.canvas
    const g = group.current
    if (!g) return
    g.visible = w > 0.001
    g.position.set(sceneState.held.x, sceneState.held.y, sceneState.held.z - 0.05)
    const t = getTime()
    const pulse = 1 + 0.08 * Math.sin(t * 3)
    g.scale.setScalar(pulse)
    mat.ring.opacity = 0.8 * w
    mat.glow.uniforms.uIntensity!.value = 0.55 * w
  })
  return (
    <group ref={group}>
      <mesh geometry={geo.glow} material={mat.glow} />
      <mesh geometry={geo.ring} material={mat.ring} />
    </group>
  )
}

/** The response sheet that the passed cards become the lines of, and the gold seal that closes it. */
export function SheetAndSeal({ getProgress, getTime }: PartProps) {
  const sheet = useRef<Mesh>(null)
  const seal = useRef<Group>(null)
  const geo = useMemo(() => {
    const width = SHEET_BOUNDS.right - SHEET_BOUNDS.left + 0.5
    const height = SHEET_BOUNDS.top - SHEET_BOUNDS.bottom + 0.55
    const check = new CatmullRomCurve3([new Vector3(-0.13, 0.0, 0), new Vector3(-0.04, -0.1, 0), new Vector3(0.15, 0.12, 0)])
    return {
      sheet: new PlaneGeometry(width, height),
      width,
      height,
      disc: new SphereGeometry(0.34, 40, 8).scale(1, 1, 0.1),
      rim: new TorusGeometry(0.34, 0.025, 12, 72),
      inner: new TorusGeometry(0.26, 0.008, 8, 72),
      check: new TubeGeometry(check, 24, 0.028, 8, false),
      glow: new PlaneGeometry(2.4, 2.4),
    }
  }, [])
  const mat = useMemo(
    () => ({
      sheet: new MeshBasicMaterial({ color: new Color(0.93, 0.9, 0.82), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
      gold: new MeshBasicMaterial({ color: new Color(0.95, 0.74, 0.3).multiplyScalar(1.15), transparent: true, toneMapped: false }),
      rim: basic(new Color(1, 0.86, 0.5).multiplyScalar(1.6)),
      ink: new MeshBasicMaterial({ color: new Color(0.04, 0.03, 0.02), transparent: true, toneMapped: false }),
      glow: createGlowMaterial([0.95, 0.72, 0.28], 1.6),
    }),
    [],
  )
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => typeof g !== 'number' && g.dispose())
      Object.values(mat).forEach((m) => m.dispose())
    },
    [geo, mat],
  )

  const centerX = (SHEET_BOUNDS.left + SHEET_BOUNDS.right) / 2
  const centerY = (SHEET_BOUNDS.top + SHEET_BOUNDS.bottom) / 2

  useFrame(() => {
    const w = sceneWeights(getProgress())
    const t = getTime()
    const sheetW = w.sheet * w.canvas
    const sealW = w.seal * w.canvas
    mat.sheet.opacity = 0.055 * sheetW
    if (sheet.current) sheet.current.visible = sheetW > 0.001
    const s = seal.current
    if (!s) return
    s.visible = sealW > 0.001
    const pop = easeOutBack(w.seal)
    s.scale.setScalar(Math.max(0.0001, pop))
    s.position.z = 0.35 + (1 - Math.pow(w.seal, 3)) * 1.2 // stamps down onto the sheet
    s.rotation.z = -0.22 + (1 - w.seal) * 0.6 + Math.sin(t * 0.8) * 0.02
    mat.gold.opacity = sealW
    mat.rim.opacity = sealW
    mat.ink.opacity = sealW
    mat.glow.uniforms.uIntensity!.value = 0.5 * sealW * (0.9 + 0.1 * Math.sin(t * 1.4))
  })

  return (
    <>
      <mesh ref={sheet} geometry={geo.sheet} material={mat.sheet} position={[centerX, centerY, -0.05]} />
      <group ref={seal} position={[centerX + 0.55, SHEET_BOUNDS.bottom - 0.05, 0.35]}>
        <mesh geometry={geo.glow} material={mat.glow} position={[0, 0, -0.1]} />
        <mesh geometry={geo.disc} material={mat.gold} />
        <mesh geometry={geo.rim} material={mat.rim} />
        <mesh geometry={geo.inner} material={mat.ink} position={[0, 0, 0.012]} />
        <mesh geometry={geo.check} material={mat.ink} position={[0, 0, 0.04]} />
      </group>
    </>
  )
}

/** Slow ambient dust for depth. Points are tinted from a small palette and drift with the scroll. */
export function Particles({ getProgress, getTime, count }: PartProps & { count: number }) {
  const points = useRef<Points>(null)
  const { geometry, material } = useMemo(() => {
    const random = mulberry32(0x51a11)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const palette = [new Color(0.93, 0.9, 0.82), new Color(0.36, 0.82, 1), new Color(0.66, 0.56, 1), new Color(0.89, 0.69, 0.29)]
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() * 2 - 1) * 8.5
      positions[i * 3 + 1] = (random() * 2 - 1) * 5
      positions[i * 3 + 2] = (random() * 2 - 1) * 5 - 1
      const c = palette[Math.floor(random() * palette.length)] as Color
      const k = 0.35 + random() * 0.65
      colors[i * 3] = c.r * k
      colors[i * 3 + 1] = c.g * k
      colors[i * 3 + 2] = c.b * k
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(positions, 3))
    g.setAttribute('color', new BufferAttribute(colors, 3))
    const m = new PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.8, blending: AdditiveBlending, depthWrite: false, sizeAttenuation: true, toneMapped: false })
    return { geometry: g, material: m }
  }, [count])
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  useFrame(() => {
    const pts = points.current
    if (!pts) return
    const t = getTime()
    pts.rotation.y = t * 0.012
    pts.position.y = getProgress() * 0.18
    material.opacity = 0.8 * sceneWeights(getProgress()).canvas
  })
  return <points ref={points} geometry={geometry} material={material} />
}
