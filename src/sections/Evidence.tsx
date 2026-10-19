import { Marquee } from '../components/Marquee'
import { Reveal } from '../components/Reveal'
import { SplitHeadline } from '../components/SplitHeadline'
import { TiltCard } from '../components/TiltCard'
import { evidence, stack } from '../content/copy'

export function Evidence() {
  return (
    <section id="evidence" className="chapter chapter--wide" aria-labelledby="evidence-title">
      <div className="chapter__inner chapter__inner--single">
        <header className="section-head">
          <Reveal>
            <p className="eyebrow">{evidence.eyebrow}</p>
          </Reveal>
          <SplitHeadline id="evidence-title" className="display display--h2" text={evidence.title} accent={['measured,']} />
          <Reveal delay={0.1}>
            <p className="prose prose--wide">{evidence.body}</p>
          </Reveal>
        </header>

        <ul className="evidence-grid">
          {evidence.inPlace.map((item, i) => (
            <Reveal as="li" key={item.title} delay={0.08 * i}>
              <TiltCard className="panel evidence-card" tilt={4}>
                <span className="evidence-card__n mono" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </TiltCard>
            </Reveal>
          ))}
        </ul>

        <Reveal>
          <div className="ledger">
            <p className="ledger__label mono">{evidence.trapsLabel}</p>
            <ol className="ledger__list">
              {evidence.traps.map((trap, i) => (
                <li key={trap}>
                  <span className="mono ledger__n">T{i + 1}</span>
                  {trap}
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        <Reveal>
          <p className="status" role="note">
            <span className="status__dot" aria-hidden="true" />
            {evidence.status}
          </p>
        </Reveal>

        <Marquee items={stack} label="Technology used" />
      </div>
    </section>
  )
}
