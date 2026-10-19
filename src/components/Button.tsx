import type { Cta } from '../content/copy'
import { ArrowIcon } from './icons'
import { Magnetic } from './Magnetic'

interface Props {
  cta: Cta
  size?: 'md' | 'sm'
}

/**
 * A call to action. A link when it goes somewhere; when it is not live yet it is a real, focusable button that
 * announces itself as unavailable, so nobody is sent to a dead link.
 */
export function Button({ cta, size = 'md' }: Props) {
  const className = `btn btn--${cta.kind} btn--${size}`
  if (cta.disabled) {
    return (
      <button type="button" className={className} aria-disabled="true" onClick={(e) => e.preventDefault()}>
        <span className="btn__label">{cta.label}</span>
      </button>
    )
  }
  return (
    <Magnetic>
      <a className={className} href={cta.href}>
        <span className="btn__label">{cta.label}</span>
        <ArrowIcon className="btn__icon" />
      </a>
    </Magnetic>
  )
}
