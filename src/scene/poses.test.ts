import {
  AGENT_POSITIONS,
  CARD_COUNT,
  CARDS,
  HELD_INDEX,
  PER_CATEGORY,
  SHEET_BOUNDS,
  colorAt,
  newPose,
  poseAt,
  sceneOffsetX,
  sceneWeights,
  type Rgb,
} from './poses'

const steps = (from: number, to: number, n: number) => Array.from({ length: n + 1 }, (_, k) => from + ((to - from) * k) / n)

describe('card set', () => {
  it('has 96 cards split evenly across the three specialists', () => {
    expect(CARDS).toHaveLength(CARD_COUNT)
    for (const category of [0, 1, 2]) expect(CARDS.filter((c) => c.category === category)).toHaveLength(PER_CATEGORY)
  })

  it('numbers each category 0..31 exactly once', () => {
    for (const category of [0, 1, 2]) {
      const ranks = CARDS.filter((c) => c.category === category).map((c) => c.rank).sort((a, b) => a - b)
      expect(ranks).toEqual(Array.from({ length: PER_CATEGORY }, (_, i) => i))
    }
  })

  it('holds back exactly one compliance card (the expired certificate)', () => {
    expect(HELD_INDEX).toBeGreaterThanOrEqual(0)
    expect(CARDS[HELD_INDEX]?.category).toBe(1)
  })

  it('is identical on every load', () => {
    expect(CARDS[0]).toEqual(CARDS[0])
    expect(CARDS.map((c) => c.category).join('')).toMatch(/^[012]{96}$/)
  })
})

describe('poseAt', () => {
  it('is finite for every card across the whole story', () => {
    const pose = newPose()
    for (const p of steps(0, 6, 120)) {
      for (let i = 0; i < CARD_COUNT; i++) {
        poseAt(i, p, 3.7, pose)
        for (const v of [pose.x, pose.y, pose.z, pose.rx, pose.ry, pose.rz, pose.sx, pose.sy, pose.pass]) {
          expect(Number.isFinite(v)).toBe(true)
        }
        expect(pose.sx).toBeGreaterThan(0)
        expect(pose.sy).toBeGreaterThan(0)
      }
    }
  })

  it('keeps cards in the visible area (no card flies off to infinity)', () => {
    const pose = newPose()
    for (const p of steps(0, 6, 60)) {
      for (let i = 0; i < CARD_COUNT; i++) {
        poseAt(i, p, 11.2, pose)
        expect(Math.abs(pose.x)).toBeLessThan(5.2)
        expect(Math.abs(pose.y)).toBeLessThan(4.2)
        expect(Math.abs(pose.z)).toBeLessThan(4.0)
      }
    }
  })

  it('moves smoothly: a tiny change in progress never teleports a card', () => {
    const a = newPose()
    const b = newPose()
    for (let i = 0; i < CARD_COUNT; i += 5) {
      for (const p of steps(0, 6, 600)) {
        poseAt(i, p, 2, a)
        poseAt(i, p + 0.01, 2, b)
        const jump = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
        expect(jump).toBeLessThan(0.6)
      }
    }
  })

  it('starts as a tall helix and ends as ruled lines inside the sheet', () => {
    const pose = newPose()
    poseAt(0, 0, 0, pose)
    const top = pose.y
    poseAt(CARD_COUNT - 1, 0, 0, pose)
    expect(top).toBeLessThan(pose.y) // a vertical stack

    for (let i = 0; i < CARD_COUNT; i++) {
      poseAt(i, 5, 0, pose)
      expect(pose.y).toBeLessThanOrEqual(SHEET_BOUNDS.top + 0.01)
      expect(pose.y).toBeGreaterThanOrEqual(SHEET_BOUNDS.bottom - 0.01)
      expect(pose.x - pose.sx / 2).toBeGreaterThanOrEqual(SHEET_BOUNDS.left - 0.01)
      expect(pose.x + pose.sx / 2).toBeLessThanOrEqual(SHEET_BOUNDS.right + 0.01)
      expect(pose.sy).toBeLessThan(0.05) // a thin line
    }
  })

  it('puts each category around its own specialist during the fan-out', () => {
    const pose = newPose()
    for (let i = 0; i < CARD_COUNT; i++) {
      poseAt(i, 2, 0, pose)
      const agent = AGENT_POSITIONS[CARDS[i]!.category]!
      expect(Math.hypot(pose.x - agent[0], pose.y - agent[1])).toBeLessThan(1.5)
    }
  })

  it('keeps the held card out of the response until a person decides', () => {
    const pose = newPose()
    poseAt(HELD_INDEX, 4, 0, pose)
    expect(pose.x).toBeLessThan(0) // still waiting before the gate
    poseAt(HELD_INDEX, 5, 0, pose)
    expect(pose.x).toBeGreaterThan(SHEET_BOUNDS.left - 0.01) // now part of the response
    // while every other card has already passed
    poseAt(HELD_INDEX === 0 ? 1 : 0, 4, 0, pose)
    expect(pose.x).toBeGreaterThan(0)
  })

  it('does not allocate: it writes into the pose it is given', () => {
    const pose = newPose()
    expect(poseAt(3, 1.5, 1, pose)).toBe(pose)
  })
})

describe('colour', () => {
  const rgb = (): Rgb => [0, 0, 0]

  it('stays in 0..1', () => {
    const pose = newPose()
    const out = rgb()
    for (const p of steps(0, 6, 80)) {
      for (let i = 0; i < CARD_COUNT; i++) {
        poseAt(i, p, 0, pose)
        colorAt(i, pose, p, out)
        for (const v of out) {
          expect(v).toBeGreaterThanOrEqual(0)
          expect(v).toBeLessThanOrEqual(1.0001)
        }
      }
    }
  })

  it('turns the held card red at the gate and gold once a person decides', () => {
    const pose = newPose()
    const out = rgb()
    poseAt(HELD_INDEX, 3.6, 0, pose)
    colorAt(HELD_INDEX, pose, 3.6, out)
    expect(out[0]).toBeGreaterThan(out[2]) // red channel dominates
    expect(out[0]).toBeGreaterThan(0.9)
    poseAt(HELD_INDEX, 5, 0, pose)
    colorAt(HELD_INDEX, pose, 5, out)
    expect(out[0]).toBeGreaterThan(out[2] + 0.4) // gold: warm
    expect(out[1]).toBeGreaterThan(0.6)
  })
})

describe('scene weights', () => {
  it('are always within 0..1 and shaped per chapter', () => {
    for (const p of steps(0, 6, 120)) {
      const w = sceneWeights(p)
      for (const v of Object.values(w)) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
    expect(sceneWeights(0).agents).toBe(0)
    expect(sceneWeights(2.2).agents).toBe(1)
    expect(sceneWeights(3).agents).toBe(0) // gone before the gate chapter is settled
    expect(sceneWeights(3.4).gate).toBe(1)
    expect(sceneWeights(0).seal).toBe(0)
    expect(sceneWeights(5).seal).toBe(1)
  })

  it('dims the canvas during the evidence section and restores it for the closing call to action', () => {
    expect(sceneWeights(4).canvas).toBe(1)
    expect(sceneWeights(5.4).canvas).toBeLessThan(0.15)
    expect(sceneWeights(6).canvas).toBe(1)
  })

  it('places the scene beside the text on wide screens (all the way to the end) and centres it on narrow ones', () => {
    expect(sceneOffsetX(2, 1.8)).toBeGreaterThan(2.5)
    expect(sceneOffsetX(6, 1.8)).toBe(sceneOffsetX(0, 1.8))
    expect(sceneOffsetX(2, 0.5)).toBe(0)
    expect(sceneOffsetX(2, 1.2)).toBeLessThan(sceneOffsetX(2, 1.8))
  })
})
