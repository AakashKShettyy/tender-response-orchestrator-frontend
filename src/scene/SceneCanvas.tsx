import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useCallback, useRef, useState } from 'react'
import { MathUtils, type Group } from 'three'
import { CardField } from './CardField'
import { updateLabels } from './labels'
import { Agents, Gate, HeldHalo, Particles, SheetAndSeal } from './Parts'
import { sceneOffsetX, sceneWeights } from './poses'
import { sceneState, type Quality } from './sceneState'

const CAMERA_Z = 11.5

/** Reads scroll progress, smooths it, and shares the result with every part of the scene. */
function SceneRoot({ quality }: { quality: Quality }) {
  const group = useRef<Group>(null)
  const clock = useRef({ progress: 0, time: 0 })
  const { camera, size } = useThree()

  const getProgress = useCallback(() => clock.current.progress, [])
  const getTime = useCallback(() => clock.current.time, [])
  const getOpacity = useCallback(() => sceneWeights(clock.current.progress).canvas, [])

  useFrame((state, delta) => {
    const reduced = sceneState.reducedMotion
    const target = reduced ? Math.round(sceneState.progress) : sceneState.progress
    clock.current.progress = reduced ? target : MathUtils.damp(clock.current.progress, target, 5, Math.min(delta, 0.05))
    clock.current.time = reduced ? 0 : state.clock.elapsedTime

    const aspect = size.width / size.height
    const narrow = aspect < 0.9
    const g = group.current
    if (g) {
      g.position.x = MathUtils.damp(g.position.x, sceneOffsetX(clock.current.progress, aspect), 6, delta)
      g.position.y = narrow ? 1.1 : 0
      g.scale.setScalar(narrow ? 0.72 : 1)
    }
    // Camera parallax from the pointer: a few degrees of orbit, never enough to feel unstable.
    const px = reduced ? 0 : sceneState.pointerX
    const py = reduced ? 0 : sceneState.pointerY
    camera.position.x = MathUtils.damp(camera.position.x, px * 0.55, 3, delta)
    camera.position.y = MathUtils.damp(camera.position.y, py * 0.32, 3, delta)
    camera.position.z = narrow ? CAMERA_Z + 2.2 : CAMERA_Z
    camera.lookAt(0, 0, 0)
    if (g) updateLabels(camera, g, size.width, size.height, clock.current.progress)
  })

  const common = { getProgress, getTime }
  return (
    <group ref={group}>
      <Particles {...common} count={quality === 'high' ? 650 : 280} />
      <Agents {...common} />
      <Gate {...common} />
      <SheetAndSeal {...common} />
      <CardField {...common} getOpacity={getOpacity} />
      <HeldHalo {...common} />
    </group>
  )
}

export default function SceneCanvas() {
  const [quality, setQuality] = useState<Quality>(() =>
    typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768) ? 'low' : 'high',
  )
  return (
    <Canvas
      className="scene-canvas"
      dpr={quality === 'high' ? [1, 1.75] : [1, 1.25]}
      camera={{ fov: 36, position: [0, 0, CAMERA_Z], near: 0.1, far: 60 }}
      gl={{ antialias: quality === 'high', alpha: true, powerPreference: 'high-performance' }}
      frameloop="always"
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setQuality('low')} flipflops={2} />
      <SceneRoot quality={quality} />
      {quality === 'high' && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.85} luminanceThreshold={0.32} luminanceSmoothing={0.25} mipmapBlur />
          <Vignette eskil={false} offset={0.25} darkness={0.75} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
