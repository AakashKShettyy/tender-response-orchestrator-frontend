import { motion, useScroll, useSpring } from 'framer-motion'
import { CHAPTERS } from '../scene/chapters'

/** A thin bar across the top showing how far through the story you are. */
export function TopProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 })
  return <motion.div className="top-progress" style={{ scaleX }} aria-hidden="true" />
}

interface RailProps {
  /** Index of the chapter currently on screen. */
  current: number
}

/** Chapter navigation: where you are in the tender's journey, and a way to jump. */
export function ProgressRail({ current }: RailProps) {
  return (
    <nav className="rail" aria-label="Chapters">
      <ol>
        {CHAPTERS.map((chapter, i) => (
          <li key={chapter.id}>
            <a href={`#${chapter.id}`} aria-current={i === current ? 'step' : undefined} data-active={i === current}>
              <span className="rail__label">
                <span className="rail__index">{chapter.index}</span> {chapter.label}
              </span>
              <span className="rail__dot" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
