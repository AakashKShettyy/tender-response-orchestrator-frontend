import { useMotionValueEvent, useScroll } from 'framer-motion'
import { useState } from 'react'
import { brand, nav } from '../content/copy'
import { Button } from './Button'
import { Mark } from './icons'

export function Nav() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))

  return (
    <header className="site-nav" data-scrolled={scrolled}>
      <a className="brand" href="#top">
        <Mark />
        <span className="brand__short">{brand.short}</span>
        <span className="brand__full">{brand.name}</span>
      </a>
      <nav aria-label="Primary" className="site-nav__links">
        <ul>
          {nav.links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <Button cta={nav.cta} size="sm" />
    </header>
  )
}
