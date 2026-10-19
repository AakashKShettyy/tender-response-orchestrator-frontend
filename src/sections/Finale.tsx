import { Button } from '../components/Button'
import { Reveal } from '../components/Reveal'
import { SplitHeadline } from '../components/SplitHeadline'
import { finale } from '../content/copy'

export function Finale() {
  return (
    <section id="start" className="chapter chapter--finale" aria-labelledby="start-title">
      <div className="chapter__inner">
        <div className="chapter__text">
          <Reveal>
            <p className="eyebrow">{finale.eyebrow}</p>
          </Reveal>
          <SplitHeadline id="start-title" className="display" text={finale.title} accent={['signed-off']} />
          <Reveal delay={0.2}>
            <p className="lede">{finale.body}</p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="cta-row">
              {finale.ctas.map((cta) => (
                <Button key={cta.label} cta={cta} />
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
