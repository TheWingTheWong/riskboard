import { useEffect, useRef, useState } from 'react';
import { pct } from '../lib/format';

export interface RiskRow {
  ticker: string;
  name: string;
  /** Portfolio weight as a fraction. */
  weight: number;
  /** Share of portfolio volatility (can be negative for a hedge). */
  contribution: number;
}

const ROW = 34;

/**
 * Weight against share of risk, one row per holding, ranked by risk share.
 * Rows keep their identity and slide to their new rank when weights change;
 * a row whose rank moved keeps a mark for a moment so the change is noticed.
 */
export function RiskBars({ rows }: { rows: RiskRow[] }) {
  const ranked = [...rows].sort((a, b) => b.contribution - a.contribution);
  const rank = new Map(ranked.map((r, i) => [r.ticker, i]));
  const prevRank = useRef(new Map<string, number>());
  const [moved, setMoved] = useState<Set<string>>(new Set());

  const rankKey = ranked.map((r) => r.ticker).join(',');
  useEffect(() => {
    const changed = new Set<string>();
    for (const [t, i] of rank) {
      const before = prevRank.current.get(t);
      if (before !== undefined && before !== i) changed.add(t);
    }
    prevRank.current = rank;
    if (changed.size === 0) return;
    setMoved(changed);
    const timer = setTimeout(() => setMoved(new Set()), 1600);
    return () => clearTimeout(timer);
  }, [rankKey]);

  const maxShare = Math.max(...rows.map((r) => Math.max(r.weight, r.contribution)), 0.01);
  const minShare = Math.min(0, ...rows.map((r) => r.contribution));
  const span = maxShare - minShare;
  const zero = (-minShare / span) * 100;
  const pos = (v: number) => `${((v - minShare) / span) * 100}%`;

  return (
    <div className="riskbars" style={{ height: rows.length * ROW }} role="table" aria-label="Weight and share of risk per holding">
      <div role="rowgroup">
        {rows.map((r) => {
          const ratio = r.weight > 0 ? r.contribution / r.weight : 0;
          const hedge = r.contribution < 0;
          return (
            <div
              key={r.ticker}
              role="row"
              className={`riskrow${moved.has(r.ticker) ? ' is-moved' : ''}`}
              style={{ transform: `translateY(${rank.get(r.ticker)! * ROW}px)` }}
            >
              <span role="cell" className="riskrow-ticker" title={r.name}>{r.ticker}</span>
              <span role="cell" className="riskrow-track">
                <span className="riskrow-zero" style={{ left: `${zero}%` }} />
                <span className="riskrow-weight" style={{ left: `${zero}%`, width: `${(r.weight / span) * 100}%` }} />
                <span
                  className={`riskrow-share${hedge ? ' is-hedge' : ''}`}
                  style={hedge ? { left: pos(r.contribution), width: `${(-r.contribution / span) * 100}%` } : { left: `${zero}%`, width: `${(r.contribution / span) * 100}%` }}
                />
              </span>
              <span role="cell" className="riskrow-fig">{pct(r.weight, 1)}</span>
              <span role="cell" className="riskrow-fig riskrow-share-fig">{pct(r.contribution, 1)}</span>
              <span role="cell" className={`riskrow-ratio${ratio > 1.25 ? ' is-heavy' : ''}`}>{ratio.toFixed(2)}×</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
