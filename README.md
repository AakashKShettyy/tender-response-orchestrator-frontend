# Tender Response Orchestrator: frontend

The web app for the Tender Response Orchestrator. This first slice is the **landing page**: a scroll-driven 3D story that
follows one tender through the system.

> A tender of 96 question cards fans out to three specialist agents, passes a review gate where one card (an expired
> certificate) is held back for a person, and becomes one signed response.

Everything on the page describes how the system is built. It states **no measured result**: the project publishes numbers
only from saved evaluation reports (see the backend repo). A test enforces this.

## Run it

```powershell
npm install
npm run dev          # http://127.0.0.1:5173
npm run build        # type-check + production build
npm run preview      # serve the production build
```

| Script | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit`, strict, no implicit any, no unchecked indexed access |
| `npm run lint` | ESLint (typescript-eslint, react-hooks) |
| `npm test` | Vitest: scene maths, copy rules, components, whole-page structure (54 tests) |
| `npm run test:e2e` | Playwright against the production build, desktop and a Pixel 7: story, keyboard, reduced motion, no-WebGL, overflow, axe audit |
| `npm run shots` | Screenshots of every chapter into `shots/` (git-ignored), for review without a GPU |

## How it works

```
 scroll (Lenis) --> useChapterProgress --> sceneState.progress (0..6) --+
 pointer -------> usePointer ----------> sceneState.pointer -----------+  read every frame,
                                                                        v  no React re-render
                        R3F <Canvas>:  poseAt(card, progress, time)  --> 96 cards, one InstancedMesh
                                       Agents, Gate, Sheet, Seal, Particles, labels (projected to DOM)
```

- **One story, seven chapters** (`src/scene/chapters.ts`). The section ids, the progress rail and the 3D scene all read it.
- **Pure scene maths** (`src/scene/poses.ts`): where each of the 96 cards is at any progress and time. Deterministic (seeded),
  allocation-free, and unit-tested: every pose is finite, stays on screen, never teleports between frames, and ends as ruled
  lines inside the sheet.
- **One draw call for the cards**: an `InstancedMesh` with a custom holographic shader (additive blending, so draw order
  never matters and dark glass falls away to the page).
- **Hold, then move**: each chapter's pose stays settled for the first third of its section so the text can be read, then
  the scene moves on to the next.
- **Labels are plain DOM**, positioned by projecting 3D anchors each frame, so they are crisp and cost no React renders.
- **The 3D bundle loads after first paint.** First load is the text, styles and Framer Motion (about 130 KB gzipped); three.js
  and React Three Fiber (about 270 KB gzipped) arrive lazily.

## Motion

Framer Motion drives the interface layer: scroll reveals, the word-by-word headlines, magnetic buttons, 3D-tilt cards with a
pointer-following spotlight, the progress bar and rail. Lenis adds inertial smooth scrolling (native scrolling is eased, never
replaced). The page is designed around "one or two key moves per view": the scene carries the motion, the text stays calm.

## Accessibility and resilience

- Reduced motion: no smooth scrolling, no transform animations (Framer `MotionConfig reducedMotion="user"`), no looping
  animations, the scene snaps between chapters and stops drifting.
- No WebGL: the full page renders without the canvas.
- Skip link, landmarks, one `h1`, labelled sections, `aria-current` on the rail, visible 2 px focus rings, 44 px+ buttons.
- Headlines expose the whole sentence once (`aria-label`); the animated word pieces are hidden from assistive technology.
- A call to action that is not live ("Recorded demo: coming soon") is a real, focusable button marked `aria-disabled`, never a dead link.
- Contrast is chosen in the tokens (`src/styles/tokens.css`); the axe audit reports no serious or critical violations.

## Design process and the agent skills in `.claude/skills/`

Four design skills were reviewed by hand (SKILL.md read in full, helper scripts audited) and **vendored at pinned commits** instead
of installed with `npx`; see `.claude/skills/PROVENANCE.md`. They informed the work like this:

| Skill | Used for |
|---|---|
| `ui-ux-pro-max` | The scroll-storytelling pattern, motion limits (one or two key moves per view, parallax on decoration only), reduced-motion rules. Its "Brutalism" style recommendation was rejected as a poor fit. |
| `bencium-innovative-ux-designer` | Its core principle: derive the look from the subject (a numbered ledger that is fanned out, checked and signed), not from a SaaS template. Its restrictive rules are waived for this project (`PROJECT-OVERRIDE.md`). |
| `better-layout` | Space-based grouping (gaps between groups at least twice those inside), logical properties, `svh`, `minmax(0, 1fr)`, no fixed heights on text, sticky-header `scroll-padding`. |
| `api-and-interface-design` | Typed contracts for copy, components and the scene state. |

Figma is not used.

## Layout

```
src/
  content/copy.ts      all page copy, typed (and tested for honesty)
  scene/               chapters, poses (pure), card shader, parts, labels, canvas
  components/          Reveal, SplitHeadline, Magnetic, TiltCard, Button, Nav, ProgressRail, Marquee
  sections/            one file per chapter
  hooks/               smooth scroll, chapter progress, pointer, WebGL check
  styles/              tokens, base, layout, components
e2e/                   Playwright specs      scripts/screenshots.mjs   chapter screenshots
```

## Honest limits

- Verified in headless Chromium with a **software** WebGL renderer, so frame rate on real GPUs, phones and low-end laptops is
  not measured. The scene degrades on touch screens and when the frame rate drops (no bloom, fewer particles, lower pixel ratio).
- No Lighthouse score has been recorded yet.
- This is the landing page only. The application screens (upload and plan, question board, answer panel, run view, learning
  and evaluation) come next and will use the backend's OpenAPI contract.
