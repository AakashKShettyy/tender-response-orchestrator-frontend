import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

interface Props {
  text: string
  as?: 'h1' | 'h2'
  id?: string
  className?: string
  /** Words (punctuation ignored) that get the accent style. */
  accent?: readonly string[]
  delay?: number
  stagger?: number
}

const normalise = (word: string): string => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

const hidden = { y: '115%', rotate: 5, opacity: 0 } as const
const shown = { y: '0%', rotate: 0, opacity: 1 } as const

/**
 * A headline that rises in word by word. Screen readers get the whole sentence from `aria-label`;
 * the animated words are hidden from them so nothing is read twice or in pieces.
 *
 * The headline as a whole is observed, not each word: a word that is translated out of its clipping box is
 * never "in view" by itself, so observing words individually would leave short words invisible forever.
 */
export function SplitHeadline({ text, as: Tag = 'h2', id, className, accent = [], delay = 0, stagger = 0.055 }: Props) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLHeadingElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const accents = new Set(accent.map(normalise))
  const words = text.split(/\s+/).filter(Boolean)
  const visible = reduced || inView

  return (
    <Tag ref={ref} id={id} className={className} aria-label={text}>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="split__word">
            <motion.span
              className={accents.has(normalise(word)) ? 'split__inner split__inner--accent' : 'split__inner'}
              initial={reduced ? shown : hidden}
              animate={visible ? shown : hidden}
              transition={{ duration: 1, delay: delay + i * stagger, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </span>
    </Tag>
  )
}
