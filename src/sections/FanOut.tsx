import { Reveal } from '../components/Reveal'
import { SplitHeadline } from '../components/SplitHeadline'
import { TiltCard } from '../components/TiltCard'
import { fanOut } from '../content/copy'

export function FanOut() {
  return (
    <section id="fan-out" className="chapter" aria-labelledby="fan-out-title">
      <div className="chapter__inner">
        <div className="chapter__text">
          <Reveal>
            <p className="eyebrow">{fanOut.eyebrow}</p>
          </Reveal>
          <SplitHeadline id="fan-out-title" className="display display--h2" text={fanOut.title} accent={['parallel.']} />
          <Reveal delay={0.1}>
            <p className="prose">{fanOut.body}</p>
          </Reveal>
          <ul className="agent-list">
            {fanOut.agents.map((agent, i) => (
              <Reveal as="li" key={agent.name} delay={0.12 * i}>
                <TiltCard className={`panel agent agent--${agent.tone}`} tilt={5}>
                  <h3 className="agent__name">
                    <span className="agent__dot" aria-hidden="true" />
                    {agent.name}
                  </h3>
                  <p className="agent__role mono">{agent.role}</p>
                  <p className="agent__rule">{agent.rule}</p>
                </TiltCard>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.1}>
            <p className="footnote">{fanOut.footnote}</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
