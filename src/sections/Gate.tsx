import { HoldIcon } from '../components/icons'
import { Reveal } from '../components/Reveal'
import { SplitHeadline } from '../components/SplitHeadline'
import { gate } from '../content/copy'

export function Gate() {
  return (
    <section id="gate" className="chapter" aria-labelledby="gate-title">
      <div className="chapter__inner">
        <div className="chapter__text">
          <Reveal>
            <p className="eyebrow">{gate.eyebrow}</p>
          </Reveal>
          <SplitHeadline id="gate-title" className="display display--h2" text={gate.title} accent={['no.']} />
          <Reveal delay={0.1}>
            <p className="prose">{gate.body}</p>
          </Reveal>
          <ul className="checks" aria-label="What review checks">
            {gate.checks.map((check, i) => (
              <Reveal as="li" key={check.label} delay={0.08 * i}>
                <div className="check">
                  <span className="check__label">{check.label}</span>
                  <span className="check__outcome">
                    <HoldIcon width={15} height={15} />
                    {check.outcome}
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.1}>
            <p className="footnote">{gate.footnote}</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
