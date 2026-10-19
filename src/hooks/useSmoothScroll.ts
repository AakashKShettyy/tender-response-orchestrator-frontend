import Lenis from 'lenis'
import { useEffect } from 'react'

/**
 * Inertial smooth scrolling (Lenis). Native scrolling is never replaced, only eased, so the scroll position,
 * keyboard, find-in-page and anchors keep working. Disabled entirely for people who ask for reduced motion.
 */
export function useSmoothScroll(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 3.2), smoothWheel: true })

    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    // In-page links glide instead of jumping.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]')
      const hash = link?.getAttribute('href')
      if (!link || !hash || hash === '#' || link.getAttribute('aria-disabled') === 'true') return
      const target = document.querySelector<HTMLElement>(hash)
      if (!target) return
      event.preventDefault()
      lenis.scrollTo(target, { offset: hash === '#top' ? 0 : -8, duration: 1.6 })
      history.replaceState(null, '', hash)
    }
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [enabled])
}
