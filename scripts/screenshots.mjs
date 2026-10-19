/**
 * Captures the landing page at each chapter so the 3D scene can be reviewed without a GPU or a human.
 *   npm run dev            (in another terminal)
 *   npm run shots          (writes ./shots/*.png, git-ignored)
 *
 * Headless Chromium has no GPU, so WebGL runs on SwiftShader (software): it is slow but renders the real scene.
 */
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const PAGE_URL = process.env.PAGE_URL ?? 'http://127.0.0.1:5173/'
const OUT = fileURLToPath(new URL('../shots/', import.meta.url))
const only = process.argv.slice(2)

const profiles = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
]
const chapters = ['top', 'problem', 'fan-out', 'gate', 'signature', 'evidence', 'start']

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] })

for (const profile of profiles) {
  if (only.length && !only.includes(profile.name)) continue
  const { name, ...options } = profile
  const context = await browser.newContext(options)
  const page = await context.newPage()
  const problems = []
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`${m.type()}: ${m.text()}`))
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))

  await page.goto(PAGE_URL, { waitUntil: 'networkidle' })
  await page.waitForSelector('canvas', { timeout: 20000 }).catch(() => problems.push('no canvas appeared'))
  await page.waitForTimeout(2500)

  for (const id of chapters) {
    const y = await page.evaluate((target) => {
      const el = document.getElementById(target)
      if (!el) return 0
      // land where the chapter is "settled": its top at 45% of the viewport
      return el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.2
    }, id)
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(2600)
    await page.screenshot({ path: `${OUT}${name}-${id}.png` })
    console.log(`${name} ${id} ok`)
  }
  if (problems.length) console.log(`--- ${name} console problems:\n${[...new Set(problems)].slice(0, 12).join('\n')}`)
  await context.close()
}
await browser.close()
