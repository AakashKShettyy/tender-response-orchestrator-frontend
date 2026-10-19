import { Vector3, type Camera, type Object3D } from 'three'
import { AGENT_POSITIONS, GATE_X, SHEET_BOUNDS, sceneWeights, type SceneWeights } from './poses'
import { sceneState } from './sceneState'

export type LabelTone = 'copper' | 'cyan' | 'violet' | 'red' | 'gold' | 'ivory'
type Vec3 = readonly [number, number, number]

export interface LabelDef {
  readonly id: string
  readonly text: string
  readonly tone: LabelTone
  /** A fixed point in scene space, or a function for something that moves (the held card). */
  readonly position: Vec3 | (() => Vec3)
  /** How visible the caption is at this point of the story, 0..1. */
  readonly weight: (s: SceneWeights) => number
}

const [pricing, compliance, operations] = AGENT_POSITIONS as readonly [Vec3, Vec3, Vec3]
const sheetCenterX = (SHEET_BOUNDS.left + SHEET_BOUNDS.right) / 2

/** Captions for the specialists, the gate, the held card, the response and the seal. */
export const LABELS: readonly LabelDef[] = [
  { id: 'pricing', text: 'Pricing', tone: 'copper', position: [pricing[0], pricing[1] + 1.5, pricing[2]], weight: (s) => s.agents },
  { id: 'compliance', text: 'Compliance', tone: 'cyan', position: [compliance[0], compliance[1] + 1.5, compliance[2]], weight: (s) => s.agents },
  { id: 'operations', text: 'Operations', tone: 'violet', position: [operations[0], operations[1] - 1.45, operations[2]], weight: (s) => s.agents },
  { id: 'gate', text: 'Review gate', tone: 'cyan', position: [GATE_X, 2.75, 0], weight: (s) => s.gate },
  {
    id: 'held',
    text: 'Held · expired certificate',
    tone: 'red',
    position: () => [sceneState.held.x, sceneState.held.y - 0.8, sceneState.held.z],
    weight: (s) => s.hold,
  },
  { id: 'sheet', text: 'Response · every claim cited', tone: 'ivory', position: [sheetCenterX, SHEET_BOUNDS.top + 0.42, 0], weight: (s) => s.sheet },
  { id: 'seal', text: 'Signed off', tone: 'gold', position: [sheetCenterX + 0.55, SHEET_BOUNDS.bottom - 0.62, 0.4], weight: (s) => s.seal },
]

// ---- DOM registry: the labels are plain elements, positioned from the 3D scene every frame ----
const elements = new Map<string, HTMLElement>()
export function registerLabel(id: string, el: HTMLElement | null): void {
  if (el) elements.set(id, el)
  else elements.delete(id)
}

const scratch = new Vector3()

/** Project every label's anchor to the screen and fade it with the story. Writes straight to the DOM (no React). */
export function updateLabels(camera: Camera, root: Object3D, width: number, height: number, progress: number): void {
  const weights = sceneWeights(progress)
  root.updateWorldMatrix(true, false)
  camera.updateMatrixWorld()
  for (const label of LABELS) {
    const el = elements.get(label.id)
    if (!el) continue
    const w = label.weight(weights) * weights.canvas
    el.style.opacity = String(w)
    el.style.visibility = w < 0.03 ? 'hidden' : 'visible'
    if (w < 0.03) continue
    const [x, y, z] = typeof label.position === 'function' ? label.position() : label.position
    scratch.set(x, y, z)
    root.localToWorld(scratch)
    scratch.project(camera)
    const sx = (scratch.x * 0.5 + 0.5) * width
    const sy = (-scratch.y * 0.5 + 0.5) * height
    el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%)`
  }
}
