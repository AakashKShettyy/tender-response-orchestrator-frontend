import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

export const ArrowIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const CheckIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

export const CrossIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const HoldIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10 9v6M14 9v6" />
  </svg>
)

export const Mark = (p: IconProps) => (
  <svg viewBox="0 0 32 32" width={26} height={26} aria-hidden="true" {...p}>
    <rect width="32" height="32" rx="8" fill="#0a0e15" stroke="rgb(239 232 216 / .3)" />
    <path d="M8 10h16M8 16h11M8 22h7" stroke="#efe8d8" strokeWidth="2" strokeLinecap="round" opacity=".6" />
    <circle cx="23" cy="21" r="5" fill="#e3b04b" />
    <path d="M20.8 21.1l1.6 1.6 2.9-3.3" stroke="#231703" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
)
