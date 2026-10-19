import { useReducedMotion } from 'framer-motion'
import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Nav } from './components/Nav'
import { ProgressRail, TopProgress } from './components/ProgressRail'
import { useChapterProgress } from './hooks/useChapterProgress'
import { usePointer } from './hooks/usePointer'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { hasWebGL } from './hooks/useWebGL'
import { CHAPTER_IDS } from './scene/chapters'
import { SceneLabels } from './scene/SceneLabels'
import { sceneState } from './scene/sceneState'
import { Evidence } from './sections/Evidence'
import { FanOut } from './sections/FanOut'
import { Finale } from './sections/Finale'
import { Footer } from './sections/Footer'
import { Gate } from './sections/Gate'
import { Hero } from './sections/Hero'
import { Problem } from './sections/Problem'
import { Signature } from './sections/Signature'

// The 3D scene (three.js and friends) is the heaviest part of the page, so it loads after the text has painted.
const SceneCanvas = lazy(() => import('./scene/SceneCanvas'))

export default function App() {
  const reduced = useReducedMotion() ?? false
  const webgl = useMemo(hasWebGL, [])
  const [sceneReady, setSceneReady] = useState(false)

  useEffect(() => {
    sceneState.reducedMotion = reduced
  }, [reduced])
  useEffect(() => {
    // Let the first paint happen, then bring in the scene.
    const id = window.requestAnimationFrame(() => setSceneReady(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  useSmoothScroll(!reduced)
  usePointer(!reduced)
  const current = useChapterProgress(CHAPTER_IDS)

  return (
    <>
      <a className="skip-link" href="#problem">
        Skip to the story
      </a>
      <TopProgress />
      <Nav />
      <div className="scene-layer" aria-hidden="true">
        {webgl && sceneReady ? (
          <Suspense fallback={null}>
            <SceneCanvas />
          </Suspense>
        ) : null}
        <SceneLabels />
      </div>
      <div className="scene-scrim" aria-hidden="true" />
      <ProgressRail current={current} />
      <main id="main">
        <Hero />
        <Problem />
        <FanOut />
        <Gate />
        <Signature />
        <Evidence />
        <Finale />
      </main>
      <Footer />
    </>
  )
}
