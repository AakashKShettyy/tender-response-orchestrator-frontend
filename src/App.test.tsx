import { render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'
import { CHAPTERS } from './scene/chapters'
import * as copy from './content/copy'

// Smooth scrolling and WebGL are not available in jsdom; the page must work without them.
vi.mock('lenis', () => ({ default: class { raf() {} scrollTo() {} destroy() {} } }))

describe('landing page structure', () => {
  it('has the landmarks and one top-level heading', () => {
    render(<App />)
    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(copy.hero.title)
  })

  it('offers a skip link as the first thing to tab to', () => {
    render(<App />)
    const skip = screen.getByRole('link', { name: /skip to the story/i })
    expect(skip).toHaveAttribute('href', '#problem')
  })

  it('renders every chapter as a labelled section with a heading', () => {
    render(<App />)
    for (const chapter of CHAPTERS) {
      const section = document.getElementById(chapter.id)
      expect(section, chapter.id).not.toBeNull()
      expect(section?.tagName).toBe('SECTION')
      const labelledBy = section?.getAttribute('aria-labelledby')
      expect(labelledBy, chapter.id).toBeTruthy()
      expect(document.getElementById(labelledBy as string), chapter.id).not.toBeNull()
    }
  })

  it('every in-page link points at a section that exists', () => {
    render(<App />)
    const hrefs = screen.getAllByRole('link').map((l) => l.getAttribute('href')).filter((h): h is string => Boolean(h?.startsWith('#')))
    expect(hrefs.length).toBeGreaterThan(8)
    for (const href of hrefs) expect(document.querySelector(href), href).not.toBeNull()
  })

  it('does not render the 3D canvas without WebGL, and the text is still all there', () => {
    render(<App />)
    expect(document.querySelector('canvas')).toBeNull()
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { name: copy.problem.title })).toBeInTheDocument()
    expect(main.getByRole('heading', { name: copy.gate.title })).toBeInTheDocument()
    expect(main.getByText(copy.evidence.status)).toBeInTheDocument()
  })

  it('hides the decorative scene layer from assistive technology', () => {
    render(<App />)
    expect(document.querySelector('.scene-layer')).toHaveAttribute('aria-hidden', 'true')
    expect(document.querySelector('.scene-scrim')).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows the unavailable demo call to action as disabled, not as a link', () => {
    render(<App />)
    const demo = screen.getByRole('button', { name: /coming soon/i })
    expect(demo).toHaveAttribute('aria-disabled', 'true')
  })
})
