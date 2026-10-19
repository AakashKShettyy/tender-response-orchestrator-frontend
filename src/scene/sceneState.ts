/**
 * Mutable state shared between the DOM (scroll, pointer) and the WebGL scene.
 * The scene reads it every frame, so updating it never triggers a React render.
 */
export interface SceneState {
  /** Continuous chapter index, 0..6, written by the scroll hook. */
  progress: number
  /** Pointer position, -1..1 on both axes (0 when idle). */
  pointerX: number
  pointerY: number
  /** When true, no continuous motion: chapters snap and time is frozen. */
  reducedMotion: boolean
  /** Position of the held card, written by the card field, read by the halo. */
  held: { x: number; y: number; z: number }
}

export const sceneState: SceneState = {
  progress: 0,
  pointerX: 0,
  pointerY: 0,
  reducedMotion: false,
  held: { x: 0, y: 0, z: 0 },
}

export type Quality = 'high' | 'low'
