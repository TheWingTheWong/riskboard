import type { PortfolioAnalysis } from '../risk';
import { CONFIDENCE_LEVELS, type Confidence, type Horizon } from '../state/portfolio';
import { money, pct } from '../lib/format';
import { Histogram, type VarMarker } from '../charts/Histogram';

interface Props {
  daily: PortfolioAnalysis;
  atHorizon: PortfolioAnalysis;
  confidence: Confidence;
  horizon: Horizon;
  notional: number;
  simulations: number;
  onConfidence(c: Confidence): void;
  onHorizon(h: Horizon): void;
}

export function VarPanel({ daily, atHorizon, confidence, horizon, notional, simulations, onConfidence, onHorizon }: Props) {
  const level = Math.round(confidence * 100);
  const methods = [
    { key: 'hist', name: 'Historical simulation', note: `${daily.returns.length} observed days`, est: atHorizon.historical, dash: '' },
    { key: 'param', name: 'Parametric', note: 'normal, variance-covariance', est: atHorizon.parametric, dash: '5 3' },
    { key: 'mc', name: 'Monte Carlo', note: `${simulations.toLocaleString('en-US')} correlated paths`, est: atHorizon.monteCarlo, dash: '1.5 2.5' },
  ];
  const markers: VarMarker[] = [
    { key: 'hist', label: 'Hist', value: daily.historical.var, dash: '' },
    { key: 'param', label: 'Param', value: daily.parametric.var, dash: '5 3' },
    { key: 'mc', label: 'MC', value: daily.monteCarlo.var, dash: '1.5 2.5' },
  ];
  const horizonText = horizon === 1 ? 'one day' : `${horizon} trading days`;
  const hist = atHorizon.historical;

  return (
    <section className="panel var-panel" aria-labelledby="var-title">
      <header className="panel-head">
        <h2 id="var-title">Value at Risk</h2>
        <div className="controls">
          <label className="confidence">
            <span className="control-label">Confidence</span>
            <input
              type="range"
              min={0}
              max={CONFIDENCE_LEVELS.length - 1}
              step={1}
              value={CONFIDENCE_LEVELS.indexOf(confidence)}
              aria-valuetext={`${level}%`}
              onChange={(e) => onConfidence(CONFIDENCE_LEVELS[Number(e.target.value)])}
            />
            <span className="confidence-stops" aria-hidden="true">
              {CONFIDENCE_LEVELS.map((c) => (
                <span key={c} className={c === confidence ? 'is-on' : undefined}>{Math.round(c * 100)}</span>
              ))}
            </span>
          </label>
          <div className="segmented" role="radiogroup" aria-label="Horizon">
            {([1, 10] as Horizon[]).map((h) => (
              <button key={h} type="button" role="radio" aria-checked={horizon === h} onClick={() => onHorizon(h)}>
                {h === 1 ? '1 day' : '10 days'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="var-body">
        <div className="var-table-wrap">
          <p className="var-reading">
            On {level} of 100 {horizon === 1 ? 'days' : 'ten-day periods'}, the portfolio should lose no more than{' '}
            <strong>{money(hist.var * notional)}</strong>. When it does, the average loss is{' '}
            <strong className="is-loss">{money(hist.cvar * notional)}</strong>.
          </p>
          <table className="var-table">
            <caption className="visually-hidden">{level}% VaR and CVaR over {horizonText} by method</caption>
            <thead>
              <tr>
                <th scope="col">Method</th>
                <th scope="col" className="num">VaR</th>
                <th scope="col" className="num">CVaR</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m.key}>
                  <th scope="row">
                    <span className="method-key">
                      <svg width="22" height="8" aria-hidden="true"><line x1="0" x2="22" y1="4" y2="4" strokeDasharray={m.dash} /></svg>
                      {m.name}
                    </span>
                    <span className="method-note">{m.note}</span>
                  </th>
                  <td className="num">
                    <span className="denomination">{money(m.est.var * notional)}</span>
                    <span className="fraction">{pct(m.est.var)}</span>
                  </td>
                  <td className="num">
                    <span className="denomination is-loss">{money(m.est.cvar * notional)}</span>
                    <span className="fraction">{pct(m.est.cvar)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {horizon > 1 && (
            <p className="footnote">
              Historical VaR at {horizon} days uses square-root-of-time scaling. Parametric and Monte Carlo scale the mean by {horizon} and the covariance by {horizon}.
            </p>
          )}
        </div>

        <figure className="var-figure">
          <figcaption>
            <span>Daily returns, {daily.returns.length} days</span>
            <span className="legend-inline">
              <svg width="14" height="10" aria-hidden="true"><rect width="14" height="10" fill="url(#tail-hatch)" /></svg>
              beyond 1-day historical VaR
            </span>
            <span className="legend-inline">
              <svg width="18" height="10" aria-hidden="true"><path d="M0 8 C6 8 6 1 9 1 C12 1 12 8 18 8" className="normal-curve" /></svg>
              normal fit
            </span>
          </figcaption>
          <Histogram
            returns={daily.returns}
            mean={daily.dailyMean}
            sd={daily.dailyVolatility}
            markers={markers}
            tailCutoff={daily.historical.var}
          />
        </figure>
      </div>
    </section>
  );
}
