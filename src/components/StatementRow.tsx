import type { PortfolioAnalysis } from '../risk';
import { num, pct, signedPct } from '../lib/format';
import { dataset } from '../data';

const MICROPRINT = 'RISKBOARD · SYNTHETIC DATA · NOT MARKET PRICES · '.repeat(24);

/**
 * The portfolio's standing figures as one ruled line, every figure at the same
 * size, between two microprint rules (the small repeated lettering used as
 * rules on security paper).
 */
export function StatementRow({ a }: { a: PortfolioAnalysis }) {
  const items: { label: string; value: string; loss?: boolean }[] = [
    { label: 'Volatility, annualised', value: pct(a.annualVolatility, 1) },
    { label: `Beta to ${dataset.index.ticker}`, value: num(a.beta, 2) },
    { label: 'Mean return, annualised', value: signedPct(a.annualReturn, 1) },
    { label: 'Return / volatility', value: num(a.sharpe, 2) },
    { label: 'Max drawdown', value: pct(-a.maxDrawdown, 1), loss: true },
  ];
  return (
    <div className="statement-wrap">
      <div className="microprint" aria-hidden="true">{MICROPRINT}</div>
      <dl className="statement">
        {items.map((it) => (
          <div key={it.label} className="statement-item">
            <dt>{it.label}</dt>
            <dd className={it.loss ? 'is-loss' : undefined}>{it.value}</dd>
          </div>
        ))}
      </dl>
      <div className="microprint" aria-hidden="true">{MICROPRINT}</div>
    </div>
  );
}
