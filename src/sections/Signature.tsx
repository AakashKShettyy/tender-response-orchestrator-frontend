import { Reveal } from '../components/Reveal'
import { SplitHeadline } from '../components/SplitHeadline'
import { signature } from '../content/copy'

export function Signature() {
  return (
    <section id="signature" className="chapter" aria-labelledby="signature-title">
      <div className="chapter__inner">
        <div className="chapter__text">
          <Reveal>
            <p className="eyebrow">{signature.eyebrow}</p>
          </Reveal>
          <SplitHeadline id="signature-title" className="display display--h2" text={signature.title} accent={['decides.']} />
          <Reveal delay={0.1}>
            <p className="prose">{signature.body}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <ul className="chips chips--stack" aria-label="Safeguards">
              {signature.chips.map((chip) => (
                <li key={chip}>{chip}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
