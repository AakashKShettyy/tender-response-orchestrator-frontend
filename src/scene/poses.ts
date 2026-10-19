/**
 * Where every question card is at every point of the story.
 *
 * Chapters (p is the continuous chapter index, see chapters.ts):
 *   0 helix       the tender, a stack of 96 numbered questions
 *   1 chaos       the problem: answers scattered across teams and files
 *   2 fan-out     the planner routes each card to one of three specialists, who work in parallel
 *   3 queue/gate  cards line up and pass the review gate; one is held back for a person
 *   4 sheet       passed cards become the lines of one response; the person decides on the held card
 *
 * Everything here is pure (no React, no WebGL) so it is deterministic and unit-testable.
 */
import { clamp, lerp, remap, smoothstep, trapezoid } from '../lib/math'
import { mulberry32, shuffled } from '../lib/rng'

export const CARD_COUNT = 96
export const PER_CATEGORY = CARD_COUNT / 3
export type Category = 0 | 1 | 2
export const CATEGORY_NAMES = ['Pricing', 'Compliance', 'Operations'] as const

export interface CardMeta {
  readonly category: Category
  /** Position within its category, 0..PER_CATEGORY-1. */
  readonly rank: number
  readonly chaos: readonly [number, number, number]
  readonly spin: readonly [number, number, number]
  readonly phase: number
  /** Length of the line this card becomes in the final response, 0.45..1. */
  readonly length: number
  /** Gate order, 0 = first through the gate. */
  readonly order: number
}

export interface Pose {
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
  sx: number
  sy: number
  /** 0..1: how far this card has passed the gate (drives its colour). */
  pass: number
}

const TAU = Math.PI * 2
const wrap = (a: number): number => ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI
const lerpAngle = (a: number, b: number, t: number): number => a + wrap(b - a) * t

function buildCards(): { cards: CardMeta[]; heldIndex: number } {
  const random = mulberry32(0x7e4d1)
  const categories = shuffled(
    Array.from({ length: CARD_COUNT }, (_, i) => (Math.floor(i / PER_CATEGORY) as Category)),
    random,
  )
  const seen = [0, 0, 0]
  const cards: CardMeta[] = categories.map((category) => {
    const rank = seen[category] ?? 0
    seen[category] = rank + 1
    const chaos: [number, number, number] = [(random() * 2 - 1) * 3.0, (random() * 2 - 1) * 3.1, (random() * 2 - 1) * 2.2]
    const spin: [number, number, number] = [random() * TAU - Math.PI, random() * TAU - Math.PI, random() * TAU - Math.PI]
    return {
      category,
      rank,
      chaos,
      spin,
      phase: random(),
      length: 0.45 + random() * 0.55,
      order: (1 - rank / (PER_CATEGORY - 1)) * 0.85 + category * 0.05 + random() * 0.05,
    }
  })
  // The card that will not pass: a compliance question, near the front of its lane (the expired certificate).
  const heldIndex = cards.findIndex((c) => c.category === 1 && c.rank === PER_CATEGORY - 5)
  return { cards, heldIndex }
}

const built = buildCards()
export const CARDS: readonly CardMeta[] = built.cards
export const HELD_INDEX = built.heldIndex

// ---- geometry constants -------------------------------------------------------------------------------------
export const AGENT_POSITIONS: readonly (readonly [number, number, number])[] = [
  [-1.65, 1.45, 0.2],
  [1.65, 1.45, 0.2],
  [0, -1.7, 0.5],
]
const LANE_Y = [1.5, 0, -1.5] as const
export const GATE_X = 0
const HOLD = { x: -0.7, y: -0.1, z: 0.9 } as const
const SHEET = { left: 0.55, top: 2.1, width: 2.0, lineHeight: 0.034, paragraphGap: 0.06 } as const

/** Final y position of each response line, with a small gap every six lines so it reads like paragraphs. */
const LINE_Y: readonly number[] = (() => {
  const out: number[] = []
  let y = SHEET.top
  for (let j = 0; j < CARD_COUNT; j++) {
    out.push(y)
    y -= SHEET.lineHeight + (j % 6 === 5 ? SHEET.paragraphGap : 0)
  }
  return out
})()

const blank = (): Pose => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 0.6, sy: 0.37, pass: 0 })
const scratchA = blank()
const scratchB = blank()
export const newPose = blank

// ---- keyframes ----------------------------------------------------------------------------------------------
function helix(i: number, time: number, out: Pose): Pose {
  const theta = i * 0.43 + time * 0.12
  const r = 1.4
  out.x = Math.cos(theta) * r
  out.z = Math.sin(theta) * r
  out.y = (i - (CARD_COUNT - 1) / 2) * 0.05
  out.rx = 0
  out.ry = wrap(Math.PI / 2 - theta)
  out.rz = 0.05 * Math.sin(i)
  out.sx = 0.62
  out.sy = 0.38
  out.pass = 0
  return out
}

function chaos(i: number, time: number, out: Pose): Pose {
  const c = CARDS[i] as CardMeta
  const drift = 0.14
  out.x = c.chaos[0] + drift * Math.sin(time * 0.7 + i)
  out.y = c.chaos[1] + drift * Math.sin(time * 0.9 + i * 1.3)
  out.z = c.chaos[2] + drift * Math.sin(time * 0.6 + i * 0.7)
  out.rx = wrap(c.spin[0] + time * 0.16 * (c.phase - 0.5))
  out.ry = wrap(c.spin[1] + time * 0.2 * (c.phase - 0.5))
  out.rz = wrap(c.spin[2] + time * 0.12)
  const s = 0.85 + c.phase * 0.3
  out.sx = 0.6 * s
  out.sy = 0.37 * s
  out.pass = 0
  return out
}

const RING_SIZES = [11, 11, 10] as const
function fanOut(i: number, time: number, out: Pose): Pose {
  const c = CARDS[i] as CardMeta
  const agent = AGENT_POSITIONS[c.category] as readonly [number, number, number]
  const ring = c.rank < 11 ? 0 : c.rank < 22 ? 1 : 2
  const inRing = ring === 0 ? c.rank : ring === 1 ? c.rank - 11 : c.rank - 22
  const count = RING_SIZES[ring] as number
  const dir = ring % 2 === 0 ? 1 : -1
  const a = (inRing / count) * TAU + time * (0.55 - 0.13 * ring) * dir
  const radius = 0.62 + ring * 0.25
  out.x = agent[0] + Math.cos(a) * radius
  out.y = agent[1] + Math.sin(a) * radius * 0.48
  out.z = agent[2] + Math.sin(a) * radius * 0.85
  out.rx = 0.35 * Math.sin(a + ring)
  out.ry = wrap(Math.PI / 2 - a)
  out.rz = 0.1 * Math.cos(a)
  out.sx = 0.4
  out.sy = 0.25
  out.pass = 0
  return out
}

function queue(i: number, time: number, out: Pose): Pose {
  const c = CARDS[i] as CardMeta
  const col = Math.floor(c.rank / 2)
  const row = c.rank % 2
  out.x = -3.3 + (col / (PER_CATEGORY / 2 - 1)) * 2.6
  out.y = (LANE_Y[c.category] as number) + (row === 0 ? -0.2 : 0.2) + 0.04 * Math.sin(time * 1.1 + c.rank * 0.6)
  out.z = 0.06 * Math.sin(c.rank * 0.9)
  out.rx = 0
  out.ry = 0.28
  out.rz = 0
  out.sx = 0.26
  out.sy = 0.17
  out.pass = 0
  return out
}

function holdSpot(time: number, out: Pose): Pose {
  out.x = HOLD.x
  out.y = HOLD.y + 0.06 * Math.sin(time * 1.3)
  out.z = HOLD.z
  out.rx = 0.12
  out.ry = 0.45
  out.rz = 0.16 + 0.02 * Math.sin(time * 0.9)
  out.sx = 0.66
  out.sy = 0.4
  out.pass = 0
  return out
}

/** The card as one line of the final response document. */
function sheetLine(i: number, time: number, out: Pose): Pose {
  const c = CARDS[i] as CardMeta
  const width = SHEET.width * c.length
  out.x = SHEET.left + width / 2
  out.y = (LINE_Y[i] as number) + 0.003 * Math.sin(time * 0.8 + i)
  out.z = 0
  out.rx = 0
  out.ry = 0
  out.rz = 0
  out.sx = width
  out.sy = SHEET.lineHeight * 0.62
  out.pass = 1
  return out
}

type Keyframe = (i: number, time: number, out: Pose) => Pose
const KEYFRAMES: readonly Keyframe[] = [helix, chaos, fanOut, queue]

function mix(a: Pose, b: Pose, t: number, out: Pose): Pose {
  out.x = lerp(a.x, b.x, t)
  out.y = lerp(a.y, b.y, t)
  out.z = lerp(a.z, b.z, t)
  out.rx = lerpAngle(a.rx, b.rx, t)
  out.ry = lerpAngle(a.ry, b.ry, t)
  out.rz = lerpAngle(a.rz, b.rz, t)
  out.sx = lerp(a.sx, b.sx, t)
  out.sy = lerp(a.sy, b.sy, t)
  out.pass = lerp(a.pass, b.pass, t)
  return out
}

/**
 * Pose of card `i` at chapter progress `p` (0..6) and time `time` (seconds). Writes into `out` and returns it.
 * Allocation free: called 96 times per frame.
 */
export function poseAt(i: number, p: number, time: number, out: Pose): Pose {
  const clamped = clamp(p, 0, 6)
  const held = i === HELD_INDEX
  const c = CARDS[i] as CardMeta

  if (clamped < 3) {
    const s = Math.floor(clamped)
    const f = smoothstep(clamped - s)
    return mix((KEYFRAMES[s] as Keyframe)(i, time, scratchA), (KEYFRAMES[s + 1] as Keyframe)(i, time, scratchB), f, out)
  }

  if (clamped < 4) {
    // Through the gate. Cards at the front of the queue go first; each one squeezes through in an arc.
    const t = clamped - 3
    const e = smoothstep(remap(t, c.order * 0.45, c.order * 0.45 + 0.55))
    queue(i, time, scratchA)
    if (held) {
      holdSpot(time, scratchB)
    } else {
      sheetLine(i, time, scratchB)
    }
    mix(scratchA, scratchB, e, out)
    const squeeze = Math.sin(Math.PI * e)
    if (!held) {
      out.z += squeeze * 0.7
      out.sx *= 1 - 0.25 * squeeze
      out.sy *= 1 - 0.25 * squeeze
    }
    return out
  }

  // p >= 4: the response is formed. The held card waits until a person decides, then joins the sheet.
  sheetLine(i, time, out)
  if (held) {
    const t4 = smoothstep(remap(clamped, 4.05, 4.55))
    holdSpot(time, scratchA)
    mix(scratchA, out, t4, out)
    out.z += Math.sin(Math.PI * t4) * 1.0
    out.pass = t4 > 0 ? 1 : 0
  }
  return out
}

// ---- colour -------------------------------------------------------------------------------------------------
export type Rgb = [number, number, number]
export const TINTS: readonly Rgb[] = [
  [1.0, 0.62, 0.42], // pricing: copper
  [0.36, 0.82, 1.0], // compliance: cyan
  [0.66, 0.56, 1.0], // operations: violet
]
const IVORY: Rgb = [0.93, 0.9, 0.82]
const GOLD: Rgb = [0.89, 0.69, 0.29]
const RED: Rgb = [1.0, 0.35, 0.37]

const mixRgb = (a: Rgb, b: Rgb, t: number, out: Rgb): Rgb => {
  out[0] = lerp(a[0], b[0], t)
  out[1] = lerp(a[1], b[1], t)
  out[2] = lerp(a[2], b[2], t)
  return out
}

/** Colour of card `i` given its current pose and chapter progress. */
export function colorAt(i: number, pose: Pose, p: number, out: Rgb): Rgb {
  const base = TINTS[(CARDS[i] as CardMeta).category] as Rgb
  if (i === HELD_INDEX) {
    const redness = smoothstep(remap(p, 2.9, 3.4))
    mixRgb(base, RED, redness, out)
    const decided = smoothstep(remap(p, 4.05, 4.55))
    return mixRgb(out, GOLD, decided, out)
  }
  return mixRgb(base, IVORY, smoothstep(remap(pose.pass, 0.15, 0.85)), out)
}

// ---- scene-level weights --------------------------------------------------------------------------------------
export interface SceneWeights {
  /** Specialist nodes. */
  agents: number
  /** Review gate rings. */
  gate: number
  /** The response sheet behind the lines. */
  sheet: number
  /** Gold seal. */
  seal: number
  /** Halo around the held card. */
  hold: number
  /** Whole-canvas opacity (dims during the evidence section so text stays readable). */
  canvas: number
}

export function sceneWeights(p: number): SceneWeights {
  return {
    agents: trapezoid(p, 1.35, 2.0, 2.4, 2.85),
    gate: trapezoid(p, 2.5, 3.0, 4.2, 4.8),
    sheet: smoothstep(remap(p, 3.3, 4.0)),
    seal: smoothstep(remap(p, 4.15, 4.6)),
    hold: trapezoid(p, 3.2, 3.6, 4.0, 4.3),
    canvas: 1 - 0.9 * trapezoid(p, 4.85, 5.15, 5.75, 6.0),
  }
}

/**
 * Horizontal shift of the whole scene so it sits beside the text column on wide screens.
 * Narrow screens keep it centred behind the text.
 */
export function sceneOffsetX(_p: number, aspect: number): number {
  if (aspect < 0.9) return 0
  const wide = clamp((aspect - 0.9) / 0.8)
  return 2.7 * wide
}

/** Gate ring orientation: tilted so it reads as a 3D ring while cards still pass through it. */
export const GATE_TILT_Y = 1.05
/** Exposed for tests: the y of the first and last line of the final response. */
export const SHEET_BOUNDS = { top: LINE_Y[0] as number, bottom: LINE_Y[CARD_COUNT - 1] as number, left: SHEET.left, right: SHEET.left + SHEET.width }
