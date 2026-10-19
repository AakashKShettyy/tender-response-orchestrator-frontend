import { brand, footer } from '../content/copy'
import { Mark } from '../components/icons'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__brand">
          <Mark width={22} height={22} />
          {brand.name}
        </p>
        <p>{footer.line}</p>
        <p className="mono">{footer.credit}</p>
      </div>
    </footer>
  )
}
