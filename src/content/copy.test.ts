import { CHAPTERS } from '../scene/chapters'
import * as copy from './copy'

/** Collect every string in the copy module, however deeply nested. */
function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out))
  return out
}

describe('page copy', () => {
  const all = strings(copy)

  it('states no measured result: no percentages and no speed-up claims', () => {
    for (const text of all) {
      expect(text, text).not.toMatch(/\d\s?%/)
      expect(text, text).not.toMatch(/\b\d+(\.\d+)?\s?x\b/i)
      expect(text, text).not.toMatch(/\b(faster|cheaper|more accurate|outperform|beats?)\b.*\b\d/i)
    }
  })

  it('does not invent social proof', () => {
    for (const text of all) expect(text, text).not.toMatch(/trusted by|customers love|testimonial|award|#1\b|rated/i)
  })

  it('says the data is synthetic and that results are pending', () => {
    expect(copy.footer.line).toMatch(/synthetic/i)
    expect(copy.hero.chips.join(' ')).toMatch(/synthetic/i)
    expect(copy.evidence.status).toMatch(/in progress/i)
  })

  it('never links to something that does not exist: every href is an in-page chapter', () => {
    const ids = new Set(CHAPTERS.map((c) => `#${c.id}`))
    const links = [...copy.nav.links, copy.nav.cta, ...copy.hero.ctas, ...copy.finale.ctas]
    for (const link of links) expect(ids.has(link.href), link.href).toBe(true)
  })

  it('marks a call to action that is not live as disabled', () => {
    const demo = copy.finale.ctas.find((c) => /demo/i.test(c.label))
    expect(demo && 'disabled' in demo && demo.disabled).toBe(true)
  })

  it('describes exactly three specialists with distinct tones', () => {
    expect(copy.fanOut.agents).toHaveLength(3)
    expect(new Set(copy.fanOut.agents.map((a) => a.tone)).size).toBe(3)
  })

  it('lists the eight planted trap types', () => {
    expect(copy.evidence.traps).toHaveLength(8)
  })
})
