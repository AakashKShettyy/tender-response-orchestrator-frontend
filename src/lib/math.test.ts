import { clamp, lerp, progressFromAnchors, remap, sectionAnchors, smoothstep, trapezoid } from './math'
import { mulberry32, shuffled } from './rng'

describe('math helpers', () => {
  it('clamps, lerps and smoothsteps', () => {
    expect(clamp(5, 0, 1)).toBe(1)
    expect(clamp(-2, 0, 1)).toBe(0)
    expect(lerp(10, 20, 0.25)).toBe(12.5)
    expect(smoothstep(0)).toBe(0)
    expect(smoothstep(1)).toBe(1)
    expect(smoothstep(0.5)).toBe(0.5)
    expect(smoothstep(-4)).toBe(0)
    expect(smoothstep(9)).toBe(1)
  })

  it('remap is clamped and safe on an empty range', () => {
    expect(remap(5, 0, 10)).toBe(0.5)
    expect(remap(-1, 0, 10)).toBe(0)
    expect(remap(11, 0, 10)).toBe(1)
    expect(remap(3, 4, 4)).toBe(0)
    expect(remap(5, 4, 4)).toBe(1)
  })

  it('trapezoid rises, holds and falls', () => {
    expect(trapezoid(0, 1, 2, 3, 4)).toBe(0)
    expect(trapezoid(2.5, 1, 2, 3, 4)).toBe(1)
    expect(trapezoid(5, 1, 2, 3, 4)).toBe(0)
    const rising = trapezoid(1.5, 1, 2, 3, 4)
    expect(rising).toBeGreaterThan(0)
    expect(rising).toBeLessThan(1)
  })
})

describe('progressFromAnchors', () => {
  const anchors = [0, 100, 300, 600]

  it('is 0 before the first anchor and the last index after the last', () => {
    expect(progressFromAnchors(-50, anchors)).toBe(0)
    expect(progressFromAnchors(0, anchors)).toBe(0)
    expect(progressFromAnchors(600, anchors)).toBe(3)
    expect(progressFromAnchors(9000, anchors)).toBe(3)
  })

  it('is continuous between anchors', () => {
    expect(progressFromAnchors(50, anchors)).toBe(0.5)
    expect(progressFromAnchors(100, anchors)).toBe(1)
    expect(progressFromAnchors(200, anchors)).toBe(1.5)
    expect(progressFromAnchors(450, anchors)).toBe(2.5)
  })

  it('holds on a chapter before moving on when asked to', () => {
    expect(progressFromAnchors(30, anchors, 0.4)).toBe(0) // still settled on chapter 0
    expect(progressFromAnchors(100, anchors, 0.4)).toBe(1)
    const moving = progressFromAnchors(80, anchors, 0.4)
    expect(moving).toBeGreaterThan(0)
    expect(moving).toBeLessThan(1)
    let last = -1
    for (let y = 0; y <= 600; y += 3) {
      const p = progressFromAnchors(y, anchors, 0.4)
      expect(p).toBeGreaterThanOrEqual(last) // still monotonic
      last = p
    }
  })

  it('is monotonic', () => {
    let last = -1
    for (let y = -10; y < 700; y += 7) {
      const p = progressFromAnchors(y, anchors)
      expect(p).toBeGreaterThanOrEqual(last)
      last = p
    }
  })

  it('copes with no anchors and with duplicate anchors', () => {
    expect(progressFromAnchors(10, [])).toBe(0)
    expect(Number.isFinite(progressFromAnchors(100, [0, 100, 100, 200]))).toBe(true)
  })

  it('builds ascending anchors from section tops', () => {
    const a = sectionAnchors([0, 900, 1800, 1700], 1000, 0.5)
    expect(a).toEqual([0, 400, 1300, 1300]) // a section above its predecessor never makes anchors go backwards
    for (let i = 1; i < a.length; i++) expect(a[i]!).toBeGreaterThanOrEqual(a[i - 1]!)
  })
})

describe('seeded random', () => {
  it('is deterministic and in [0, 1)', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 50; i++) {
      const v = a()
      expect(v).toBe(b())
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })

  it('shuffles without losing or duplicating items', () => {
    const items = Array.from({ length: 30 }, (_, i) => i)
    const out = shuffled(items, mulberry32(7))
    expect([...out].sort((x, y) => x - y)).toEqual(items)
    expect(out).not.toEqual(items)
    expect(items[0]).toBe(0) // the input is not mutated
  })
})
