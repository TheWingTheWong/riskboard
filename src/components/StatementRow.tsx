import type { PortfolioAnalysis } from '../risk';
import { num, pct, signedPct } from '../lib/format';
import { dataset } from '../data';

/** The portfolio's standing figures, set as one ruled line rather than a row of tiles. */
export function StatementRow({ a }: { a: PortfolioAnalysis }) {
  return (
    <dl className="statement">
      <div className="statement-item is-lead">
        <dt>Volatility, annualised</dt>
        <dd>{pct(a.annualVolatility, 1)}</dd>
      </div>
      <div className="statement-item">
        <dt>Beta to {dataset.index.ticker}</dt>
        <dd>{num(a.beta, 2)}</dd>
      </div>
      <div className="statement-item">
        <dt>Mean return, annualised</dt>
        <dd>{signedPct(a.annualReturn, 1)}</dd>
      </div>
      <div className="statement-item">
        <dt>Return / volatility</dt>
        <dd>{num(a.sharpe, 2)}</dd>
      </div>
      <div className="statement-item">
        <dt>Max drawdown</dt>
        <dd className="is-loss">{pct(-a.maxDrawdown, 1)}</dd>
      </div>
    </dl>
  );
}
