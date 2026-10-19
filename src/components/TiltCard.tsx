import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  /** Maximum tilt in degrees. */
  tilt?: number
}

/** A card that tilts toward the pointer in 3D and carries a soft spotlight under it. */
export function TiltCard({ children, className = '', tilt = 7 }: Props) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const rotateX = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 })

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse') return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    rotateY.set((px - 0.5) * tilt * 2)
    rotateX.set(-(py - 0.5) * tilt * 2)
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
  }
  const onLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={`tilt ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </motion.div>
  )
}
