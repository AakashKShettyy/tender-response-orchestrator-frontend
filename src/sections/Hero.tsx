import { Button } from '../components/Button'
import { Reveal } from '../components/Reveal'
import { SplitHeadline } from '../components/SplitHeadline'
import { hero } from '../content/copy'

export function Hero() {
  return (
    <section id="top" className="chapter chapter--hero" aria-labelledby="hero-title">
      <div className="chapter__inner">
        <div className="chapter__text">
          <Reveal y={14}>
            <p className="eyebrow">
              <span className="eyebrow__dot" aria-hidden="true" />
              {hero.eyebrow}
            </p>
          </Reveal>
          <SplitHeadline as="h1" id="hero-title" className="display" text={hero.title} accent={['signature']} delay={0.15} />
          <Reveal delay={0.7}>
            <p className="lede">{hero.lede}</p>
          </Reveal>
          <Reveal delay={0.85}>
            <div className="cta-row">
              {hero.ctas.map((cta) => (
                <Button key={cta.label} cta={cta} />
              ))}
            </div>
          </Reveal>
          <Reveal delay={1}>
            <ul className="chips" aria-label="What it is built around">
              {hero.chips.map((chip) => (
                <li key={chip}>{chip}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
      <p className="scroll-hint">
        <span className="scroll-hint__line" aria-hidden="true" />
        {hero.scrollHint}
      </p>
    </section>
  )
}
