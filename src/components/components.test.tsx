import { fireEvent, render, screen, within } from '@testing-library/react'
import { Button } from './Button'
import { Marquee } from './Marquee'
import { ProgressRail } from './ProgressRail'
import { SplitHeadline } from './SplitHeadline'
import { CHAPTERS } from '../scene/chapters'

describe('Button', () => {
  it('is a link when it goes somewhere', () => {
    render(<Button cta={{ label: 'Follow one tender', href: '#problem', kind: 'primary' }} />)
    const link = screen.getByRole('link', { name: /follow one tender/i })
    expect(link).toHaveAttribute('href', '#problem')
    expect(link).toHaveClass('btn--primary')
  })

  it('is a real, focusable, clearly unavailable button when the destination is not live yet', () => {
    render(<Button cta={{ label: 'Recorded demo: coming soon', href: '#start', kind: 'ghost', disabled: true }} />)
    expect(screen.queryByRole('link')).toBeNull() // never a dead link
    const button = screen.getByRole('button', { name: /coming soon/i })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toBeDisabled() // stays focusable so assistive tech can find and announce it
    const prevented = !fireEvent.click(button)
    expect(prevented).toBe(true)
  })

  it('supports the small size used in the navigation bar', () => {
    render(<Button cta={{ label: 'Go', href: '#top', kind: 'primary' }} size="sm" />)
    expect(screen.getByRole('link')).toHaveClass('btn--sm')
  })
})

describe('SplitHeadline', () => {
  it('gives assistive technology the whole sentence once, and hides the animated pieces', () => {
    render(<SplitHeadline as="h1" text="One tender. A team of agents." />)
    const heading = screen.getByRole('heading', { level: 1, name: 'One tender. A team of agents.' })
    const pieces = heading.querySelector('[aria-hidden="true"]')
    expect(pieces).not.toBeNull()
    expect(pieces?.textContent).toBe('Onetender.Ateamofagents.') // words are separate boxes; spacing is margin, not text
  })

  it('keeps every word, including one-letter words', () => {
    render(<SplitHeadline text="A person decides. Then it ships." />)
    const words = Array.from(document.querySelectorAll('.split__word')).map((el) => el.textContent)
    expect(words).toEqual(['A', 'person', 'decides.', 'Then', 'it', 'ships.'])
  })

  it('styles the accent words, ignoring punctuation and case', () => {
    render(<SplitHeadline text="Review can say no." accent={['NO']} />)
    const accented = Array.from(document.querySelectorAll('.split__inner--accent')).map((el) => el.textContent)
    expect(accented).toEqual(['no.'])
  })

  it('renders an h2 by default', () => {
    render(<SplitHeadline text="Hello world" />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })
})

describe('ProgressRail', () => {
  it('lists every chapter and marks exactly one as the current step', () => {
    render(<ProgressRail current={3} />)
    const nav = screen.getByRole('navigation', { name: 'Chapters' })
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(CHAPTERS.length)
    const current = links.filter((l) => l.getAttribute('aria-current') === 'step')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveAttribute('href', '#gate')
  })

  it('links every chapter to its section id', () => {
    render(<ProgressRail current={0} />)
    const hrefs = screen.getAllByRole('link').map((l) => l.getAttribute('href'))
    expect(hrefs).toEqual(CHAPTERS.map((c) => `#${c.id}`))
  })
})

describe('Marquee', () => {
  it('is labelled and exposes each item to assistive technology only once', () => {
    render(<Marquee label="Technology used" items={['FastAPI', 'LangGraph']} />)
    const group = screen.getByRole('group', { name: 'Technology used' })
    expect(within(group).getAllByText('FastAPI')).toHaveLength(2) // two copies for the loop...
    const hidden = group.querySelectorAll('[aria-hidden="true"]')
    expect(hidden).toHaveLength(1) // ...and the second one is hidden from screen readers
  })
})
