import { useEffect } from 'react'
import { sceneState } from '../scene/sceneState'

/** Writes the pointer position (-1..1) into the scene state. Ignored on touch screens and when motion is reduced. */
export function usePointer(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || window.matchMedia?.('(pointer: coarse)').matches) return
    const move = (e: PointerEvent) => {
      sceneState.pointerX = (e.clientX / window.innerWidth) * 2 - 1
      sceneState.pointerY = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    const leave = () => {
      sceneState.pointerX = 0
      sceneState.pointerY = 0
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
      leave()
    }
  }, [enabled])
}
