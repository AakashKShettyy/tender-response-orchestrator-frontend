import { useEffect, useState } from 'react'
import { progressFromAnchors, sectionAnchors } from '../lib/math'
import { sceneState } from '../scene/sceneState'

/**
 * Keeps `sceneState.progress` in step with the page: the continuous chapter index the 3D scene reads.
 * Returns the integer chapter that is currently "on screen" for the progress rail.
 */
export function useChapterProgress(ids: readonly string[]): number {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let anchors: number[] = []

    const measure = () => {
      const tops = ids.map((id) => {
        const el = document.getElementById(id)
        return el ? el.getBoundingClientRect().top + window.scrollY : 0
      })
      anchors = sectionAnchors(tops, window.innerHeight, 0.45)
    }
    const update = () => {
      const p = progressFromAnchors(window.scrollY, anchors, 0.35)
      sceneState.progress = p
      setCurrent(Math.round(p))
    }
    const remeasure = () => {
      measure()
      update()
    }

    remeasure()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', remeasure)
    // Fonts and images change section heights after first paint.
    const observer = new ResizeObserver(remeasure)
    observer.observe(document.body)
    const settle = window.setTimeout(remeasure, 600)

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', remeasure)
      observer.disconnect()
      window.clearTimeout(settle)
    }
  }, [ids])

  return current
}
