import { useEffect, useMemo, useState } from 'react';
import { dataset } from './data';
import { decodeState, encodeState, portfolioSerial, type PortfolioState } from './state/portfolio';
import { universeCorrelation, useAnalysis } from './state/useAnalysis';
import { Masthead } from './components/Masthead';
import { PortfolioEditor } from './components/PortfolioEditor';
import { StatementRow } from './components/StatementRow';
import { VarPanel } from './components/VarPanel';
import { CorrelationHeatmap } from './charts/CorrelationHeatmap';
import { FrontierChart } from './charts/FrontierChart';
import { RiskBars } from './charts/RiskBars';
import { subMatrix } from './risk';

const KNOWN = new Set(dataset.assets.map((a) => a.ticker));
const ALL_TICKERS = dataset.assets.map((a) => a.ticker);
const SIMULATIONS = 10_000;

function readHash(): PortfolioState {
  return decodeState(typeof window === 'undefined' ? '' : window.location.hash, KNOWN);
}

export function App() {
  const [state, setState] = useState<PortfolioState>(readHash);
  const [corrScope, setCorrScope] = useState<'held' | 'all'>('all');
  const view = useAnalysis(state);

  // Keep the URL in sync so any portfolio can be bookmarked or shared.
  useEffect(() => {
    const hash = encodeState(state);
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
  }, [state]);

  useEffect(() => {
    const onHash = () => setState(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const update = (patch: Partial<PortfolioState>) => setState((s) => ({ ...s, ...patch }));
  const serial = portfolioSerial(state.holdings);

  const heat = useMemo(() => {
    const heldIdx = view?.held.map((h) => h.index) ?? [];
    if (corrScope === 'held' && heldIdx.length >= 2) {
      return { tickers: heldIdx.map((i) => ALL_TICKERS[i]), matrix: subMatrix(universeCorrelation, heldIdx) };
    }
    return { tickers: ALL_TICKERS, matrix: universeCorrelation };
  }, [view?.held, corrScope]);

  return (
    <div className="app">
      <Masthead serial={serial} volatility={view?.daily.annualVolatility ?? 0} />
      <div className="shell">
        <aside className="rail">
          <PortfolioEditor
            holdings={state.holdings}
            notional={state.notional}
            onHoldings={(holdings) => update({ holdings })}
            onNotional={(notional) => update({ notional })}
          />
        </aside>

        <main className="work">
          {!view ? (
            <div className="empty-state">
              <h2>Nothing to measure yet</h2>
              <p>Give at least one holding a weight above zero, or load a preset from the Holdings list.</p>
            </div>
          ) : (
            <>
              <StatementRow a={view.daily} />
              <VarPanel
                daily={view.daily}
                atHorizon={view.atHorizon}
                confidence={state.confidence}
                horizon={state.horizon}
                notional={state.notional}
                simulations={SIMULATIONS}
                onConfidence={(confidence) => update({ confidence })}
                onHorizon={(horizon) => update({ horizon })}
              />

              <div className="pair">
                <section className="panel" aria-labelledby="corr-title">
                  <header className="panel-head">
                    <h2 id="corr-title">Correlation</h2>
                    <div className="segmented" role="radiogroup" aria-label="Assets shown">
                      <button type="button" role="radio" aria-checked={corrScope === 'all'} onClick={() => setCorrScope('all')}>
                        All 15
                      </button>
                      <button type="button" role="radio" aria-checked={corrScope === 'held'} onClick={() => setCorrScope('held')} disabled={view.held.length < 2}>
                        Holdings
                      </button>
                    </div>
                  </header>
                  <p className="panel-note">Daily return correlation over {dataset.dates.length} days. Highlighted tickers are held. Green cells hedge each other.</p>
                  <CorrelationHeatmap tickers={heat.tickers} matrix={heat.matrix} highlight={new Set(view.held.map((h) => h.ticker))} />
                </section>

                <section className="panel" aria-labelledby="frontier-title">
                  <header className="panel-head">
                    <h2 id="frontier-title">Efficient frontier</h2>
                  </header>
                  {view.frontier ? (
                    <>
                      <p className="panel-note">
                        Across your {view.held.length} holdings. Dots: 2,500 random long-only mixes, lighter where return per unit of
                        volatility is higher. Line: the closed-form frontier, which allows short sales. Asset dots are sized by your weight.
                      </p>
                      <FrontierChart frontier={view.frontier} tickers={view.held.map((h) => h.ticker)} weights={view.daily.weights} />
                    </>
                  ) : (
                    <p className="empty">The frontier needs at least two holdings with weight.</p>
                  )}
                </section>
              </div>

              <section className="panel" aria-labelledby="risk-title">
                <header className="panel-head">
                  <h2 id="risk-title">Where the risk comes from</h2>
                  <p className="riskbars-key" aria-hidden="true">
                    <span className="key-weight" /> weight <span className="key-share" /> share of volatility <span className="key-hedge" /> hedge
                  </p>
                </header>
                <p className="panel-note">
                  Euler decomposition of portfolio volatility: shares add up to 100%. Ratios above 1.25× are double-underlined: the holding carries more risk than
                  its weight suggests.
                </p>
                <div className="riskbars-head" aria-hidden="true">
                  <span />
                  <span />
                  <span>Weight</span>
                  <span>Risk</span>
                  <span>Ratio</span>
                </div>
                <RiskBars
                  rows={view.held.map((h, i) => ({
                    ticker: h.ticker,
                    name: h.name,
                    weight: view.daily.weights[i],
                    contribution: view.daily.risk.percent[i],
                  }))}
                />
              </section>
            </>
          )}
          <footer className="colophon">
            <p>
              riskboard computes everything in your browser from {dataset.dates.length} days of synthetic returns. VaR and CVaR are losses
              as positive amounts. Monte Carlo uses {SIMULATIONS.toLocaleString('en-US')} multivariate-normal draws through the Cholesky
              factor of the sample covariance, seeded so results repeat. MIT licensed.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
