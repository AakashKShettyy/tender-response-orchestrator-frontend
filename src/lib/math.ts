export const clamp = (value: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, value))

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/** Hermite smoothstep on a 0..1 input (clamped). */
export const smoothstep = (t: number): number => {
  const x = clamp(t)
  return x * x * (3 - 2 * x)
}

/** Map `value` from [inLo, inHi] to [0, 1], clamped. */
export const remap = (value: number, inLo: number, inHi: number): number =>
  inHi === inLo ? (value >= inHi ? 1 : 0) : clamp((value - inLo) / (inHi - inLo))

/** 0 outside [a, d], rises over [a, b], holds 1 over [b, c], falls over [c, d]. */
export const trapezoid = (p: number, a: number, b: number, c: number, d: number): number =>
  smoothstep(remap(p, a, b)) * (1 - smoothstep(remap(p, c, d)))

/**
 * Turn a scroll position into a continuous chapter index.
 * `anchors` are the scroll positions (ascending) at which each chapter becomes current.
 * Returns 0 before the first anchor, `anchors.length - 1` after the last, and
 * `i + fraction` between anchors i and i + 1.
 *
 * `hold` (0..0.9) is the share of each segment during which the scene stays settled on chapter i, so it can be
 * read before the scene starts moving on to the next one. The remainder is an eased transition.
 */
export function progressFromAnchors(scrollY: number, anchors: readonly number[], hold = 0): number {
  if (anchors.length === 0) return 0
  const first = anchors[0] ?? 0
  const last = anchors[anchors.length - 1] ?? 0
  if (scrollY <= first) return 0
  if (scrollY >= last) return anchors.length - 1
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i] ?? 0
    const b = anchors[i + 1] ?? a
    if (scrollY >= a && scrollY < b) {
      if (b === a) return i
      const fraction = (scrollY - a) / (b - a)
      return i + (hold > 0 ? smoothstep(remap(fraction, hold, 1)) : fraction)
    }
  }
  return anchors.length - 1
}

/** Scroll positions at which each section becomes the current chapter (`bias` = how far down the viewport). */
export const sectionAnchors = (tops: readonly number[], viewportHeight: number, bias = 0.45): number[] => {
  const anchors: number[] = []
  for (const top of tops) {
    // Never below 0 (the page starts at chapter 0) and never going backwards.
    const previous = anchors[anchors.length - 1] ?? 0
    anchors.push(Math.max(top - viewportHeight * bias, previous))
  }
  return anchors
}
