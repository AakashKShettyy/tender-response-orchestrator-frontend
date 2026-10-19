import { motion, useReducedMotion } from 'framer-motion'
import { useMemo, type ReactNode } from 'react'

type Tag = 'div' | 'p' | 'li' | 'ul' | 'span' | 'section'

interface Props {
  as?: Tag
  delay?: number
  /** Distance the element travels while it appears, in px. */
  y?: number
  className?: string
  children: ReactNode
}

/** Fade, rise and un-blur as an element scrolls into view. Renders in its final state under reduced motion. */
export function Reveal({ as = 'div', delay = 0, y = 28, className, children }: Props) {
  const reduced = useReducedMotion()
  const Component = useMemo(() => motion.create(as), [as])
  return (
    <Component
      className={className}
      initial={reduced ? false : { opacity: 0, y, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.95, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  )
}
