import { PerspectiveCamera, Group } from 'three'
import { LABELS, registerLabel, updateLabels } from './labels'
import { sceneWeights } from './poses'

describe('scene labels', () => {
  it('have unique ids and readable text', () => {
    expect(new Set(LABELS.map((l) => l.id)).size).toBe(LABELS.length)
    for (const l of LABELS) expect(l.text.length).toBeGreaterThan(2)
  })

  it('fade in and out with the story, always within 0..1', () => {
    for (let p = 0; p <= 6; p += 0.05) {
      const w = sceneWeights(p)
      for (const l of LABELS) {
        const v = l.weight(w)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
    const at = (id: string, p: number) => LABELS.find((l) => l.id === id)!.weight(sceneWeights(p))
    expect(at('pricing', 0)).toBe(0)
    expect(at('pricing', 2.2)).toBe(1)
    expect(at('gate', 3.5)).toBe(1)
    expect(at('held', 3.8)).toBe(1)
    expect(at('seal', 5)).toBe(1)
  })

  it('positions a visible label on screen and hides one that is not part of the current chapter', () => {
    const camera = new PerspectiveCamera(36, 1.6, 0.1, 60)
    camera.position.set(0, 0, 11.5)
    camera.lookAt(0, 0, 0)
    const root = new Group()
    const gate = document.createElement('div')
    const pricing = document.createElement('div')
    registerLabel('gate', gate)
    registerLabel('pricing', pricing)

    updateLabels(camera, root, 1440, 900, 3.5)
    expect(gate.style.visibility).toBe('visible')
    expect(gate.style.transform).toMatch(/translate3d\(\s*7\d\d\.\d+px/) // the gate sits near the horizontal centre
    expect(pricing.style.visibility).toBe('hidden')

    registerLabel('gate', null)
    registerLabel('pricing', null)
  })
})
