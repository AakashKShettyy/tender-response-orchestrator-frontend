import { CheckIcon, CrossIcon } from '../components/icons'
import { Reveal } from '../components/Reveal'
import { SplitHeadline } from '../components/SplitHeadline'
import { TiltCard } from '../components/TiltCard'
import { problem } from '../content/copy'

export function Problem() {
  return (
    <section id="problem" className="chapter" aria-labelledby="problem-title">
      <div className="chapter__inner">
        <div className="chapter__text">
          <Reveal>
            <p className="eyebrow">{problem.eyebrow}</p>
          </Reveal>
          <SplitHeadline id="problem-title" className="display display--h2" text={problem.title} accent={['expired']} />
          <div className="prose">
            {problem.body.map((paragraph, i) => (
              <Reveal key={paragraph} delay={0.1 + i * 0.1}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <TiltCard className="panel compare">
              <p className="compare__label">
                <span className="mono">Q14</span> {problem.exampleLabel}
              </p>
              <p className="compare__question">{problem.exampleQuestion}</p>
              <p className="compare__row compare__row--bad">
                <CrossIcon />
                <span>{problem.exampleBad}</span>
              </p>
              <p className="compare__row compare__row--good">
                <CheckIcon />
                <span>{problem.exampleGood}</span>
              </p>
            </TiltCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
