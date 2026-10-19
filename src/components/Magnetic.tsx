import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** How far the element follows the pointer, as a fraction of the distance from its centre. */
  strength?: number
}

/** Pulls its child gently toward the pointer. A no-op on touch screens and under reduced motion. */
export function Magnetic({ children, strength = 0.32 }: Props) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 16, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 16, mass: 0.4 })

  if (reduced) return <span className="magnetic">{children}</span>

  return (
    <motion.span
      ref={ref}
      className="magnetic"
      style={{ x, y }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        x.set((e.clientX - (rect.left + rect.width / 2)) * strength)
        y.set((e.clientY - (rect.top + rect.height / 2)) * strength)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.span>
  )
}
