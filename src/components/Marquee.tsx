interface Props {
  items: readonly string[]
  label: string
}

/** A slow, endless ticker. The second copy is hidden from assistive tech; reduced motion stops the scroll. */
export function Marquee({ items, label }: Props) {
  return (
    <div className="marquee" role="group" aria-label={label}>
      <div className="marquee__track">
        <ul className="marquee__row">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <ul className="marquee__row" aria-hidden="true">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
