import AxeBuilder from '@axe-core/playwright'
import { expect, test, type ConsoleMessage, type Page } from '@playwright/test'

/** The one known warning comes from inside React Three Fiber itself (it still uses THREE.Clock). */
const KNOWN_NOISE = [/THREE\.Clock: This module has been deprecated/]

function watchConsole(page: Page) {
  const problems: string[] = []
  page.on('console', (m: ConsoleMessage) => {
    if (['error', 'warning'].includes(m.type()) && !KNOWN_NOISE.some((r) => r.test(m.text()))) problems.push(`${m.type()}: ${m.text()}`)
  })
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
  return problems
}

const CHAPTER_IDS = ['top', 'problem', 'fan-out', 'gate', 'signature', 'evidence', 'start']

test.describe('landing page', () => {
  test('loads with the story headline, a 3D canvas and no console problems', async ({ page }) => {
    const problems = watchConsole(page)
    await page.goto('/')
    await expect(page).toHaveTitle(/Tender Response Orchestrator/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      /One tender\. A team of agents\. Nothing leaves without a signature\./,
    )
    await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(1500)
    expect(problems).toEqual([])
  })

  test('every headline shows all of its words (none clipped away or missing)', async ({ page }) => {
    await page.goto('/')
    for (const id of CHAPTER_IDS) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded()
      await page.waitForTimeout(900)
      const heading = page.locator(`#${id} [aria-label]`).first()
      const expected = (await heading.getAttribute('aria-label'))!.split(/\s+/)
      const shown = await heading.locator('.split__word').allTextContents()
      expect(shown, id).toEqual(expected)
      for (const word of await heading.locator('.split__inner').all()) await expect(word, id).toHaveCSS('opacity', '1')
    }
  })

  test('navigation links scroll to their chapter', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the link list is hidden on small screens')
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Review' }).click()
    await expect(page).toHaveURL(/#gate$/)
    await expect(page.locator('#gate-title')).toBeInViewport({ timeout: 8000 })
  })

  test('the chapter rail follows the scroll', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the rail is desktop only')
    await page.goto('/')
    const current = page.getByRole('navigation', { name: 'Chapters' }).locator('[aria-current="step"]')
    await expect(current).toHaveAttribute('href', '#top')
    await page.locator('#gate').scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, 200))
    await expect(current).toHaveAttribute('href', '#gate')
  })

  test('the unavailable demo button does nothing and says so', async ({ page }) => {
    await page.goto('/')
    const demo = page.getByRole('button', { name: /coming soon/i })
    await demo.scrollIntoViewIfNeeded()
    await expect(demo).toHaveAttribute('aria-disabled', 'true')
    const before = page.url()
    await demo.click({ force: true }) // Playwright treats aria-disabled as disabled; a real person can still click it
    expect(page.url()).toBe(before)
  })

  test('has no horizontal scroll at common widths', async ({ page }) => {
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/')
      await page.waitForTimeout(600)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `width ${width}`).toBeLessThanOrEqual(0)
    }
  })

  test('works for people who ask for reduced motion: content is visible and nothing loops', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } })
    const page = await context.newPage()
    const problems = watchConsole(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.locator('#evidence').scrollIntoViewIfNeeded()
    const durations = await page.evaluate(() =>
      ['.marquee__track', '.eyebrow__dot', '.scroll-hint__line'].map((s) => {
        const el = document.querySelector(s)
        return el ? getComputedStyle(el).animationDuration : 'n/a'
      }),
    )
    for (const d of durations) expect(['n/a', '0.001ms', '1e-06s']).toContain(d)
    for (const el of await page.locator('.split__inner').all()) await expect(el).toHaveCSS('opacity', '1')
    expect(problems).toEqual([])
    await context.close()
  })

  test('still renders every section when WebGL is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (/webgl/.test(type)) return null
        return (original as (...a: unknown[]) => unknown).call(this, type, ...rest)
      } as typeof original
    })
    const problems = watchConsole(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(0)
    for (const id of CHAPTER_IDS) await expect(page.locator(`#${id}`)).toBeAttached()
    expect(problems).toEqual([])
  })

  test('keyboard: the first Tab stop is the skip link, and focus is always visible', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard navigation is a desktop concern')
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: /skip to the story/i })
    await expect(skip).toBeFocused()
    await expect(skip).toBeInViewport()
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      const outline = await page.evaluate(() => {
        const s = getComputedStyle(document.activeElement as HTMLElement)
        return { width: parseFloat(s.outlineWidth), style: s.outlineStyle }
      })
      expect(outline.style, `tab stop ${i + 1}`).not.toBe('none')
      expect(outline.width, `tab stop ${i + 1}`).toBeGreaterThanOrEqual(2)
    }
  })

  test('buttons are at least 44px tall', async ({ page }) => {
    await page.goto('/')
    for (const el of await page.locator('a.btn, button.btn').all()) {
      const box = await el.boundingBox()
      if (box) expect(box.height, await el.innerText()).toBeGreaterThanOrEqual(44)
    }
  })

  test('accessibility audit finds no serious or critical violations', async ({ page }) => {
    await page.goto('/')
    // visit every chapter first so each reveal animation has finished and the audit sees final colours
    await page.evaluate(async () => {
      for (const id of ['problem', 'fan-out', 'gate', 'signature', 'evidence', 'start']) {
        document.getElementById(id)?.scrollIntoView()
        await new Promise((r) => setTimeout(r, 500))
      }
      window.scrollTo(0, 0)
      await new Promise((r) => setTimeout(r, 1200))
    })
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([])
  })
})
