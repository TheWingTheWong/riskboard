import { useState } from 'react';
import { dataset } from '../data';
import { equalWeight, PRESETS, rescaleTo100, totalWeight, type Holding } from '../state/portfolio';
import { money } from '../lib/format';
import { Icon } from './Icon';

interface Props {
  holdings: Holding[];
  notional: number;
  onHoldings(h: Holding[]): void;
  onNotional(v: number): void;
}

const byTicker = new Map(dataset.assets.map((a) => [a.ticker, a]));

export function PortfolioEditor({ holdings, notional, onHoldings, onNotional }: Props) {
  const held = new Set(holdings.map((h) => h.ticker));
  const available = dataset.assets.filter((a) => !held.has(a.ticker));
  const [toAdd, setToAdd] = useState('');
  const [notionalText, setNotionalText] = useState(String(notional));
  const total = totalWeight(holdings);
  const balanced = Math.abs(total - 100) < 0.005;
  const addTicker = toAdd && !held.has(toAdd) ? toAdd : available[0]?.ticker;

  const setWeight = (ticker: string, weight: number) =>
    onHoldings(holdings.map((h) => (h.ticker === ticker ? { ...h, weight: Math.max(0, Math.min(100, weight)) } : h)));

  return (
    <section className="editor" aria-labelledby="editor-title">
      <div className="editor-head">
        <h2 id="editor-title">Holdings</h2>
        <div className="presets" role="group" aria-label="Load a preset portfolio">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="text-button" onClick={() => onHoldings(p.holdings)}>
              {p.label}
            </button>
          ))}
          <button type="button" className="text-button" onClick={() => onHoldings(equalWeight(dataset.assets.map((a) => a.ticker)))}>
            All 15, equal
          </button>
        </div>
      </div>

      {holdings.length === 0 ? (
        <p className="empty">No holdings. Add an asset below or load a preset.</p>
      ) : (
        <ul className="holdings">
          {holdings.map((h) => {
            const asset = byTicker.get(h.ticker)!;
            return (
              <li key={h.ticker} className={`holding${h.weight === 0 ? ' is-zero' : ''}`}>
                <div className="holding-id">
                  <span className="holding-ticker">{h.ticker}</span>
                  <span className="holding-name">{asset.name}</span>
                </div>
                <label className="holding-weight">
                  <span className="visually-hidden">{h.ticker} weight, percent</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step={0.5}
                    value={Number.isFinite(h.weight) ? h.weight : 0}
                    onChange={(e) => setWeight(h.ticker, e.target.value === '' ? 0 : Number(e.target.value))}
                  />
                  <span className="unit">%</span>
                </label>
                <button type="button" className="icon-button" onClick={() => onHoldings(holdings.filter((x) => x.ticker !== h.ticker))}>
                  <Icon name="close" label={`Remove ${h.ticker}`} />
                </button>
                <input
                  className="holding-slider"
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={h.weight}
                  aria-label={`${h.ticker} weight`}
                  aria-valuetext={`${h.weight}%`}
                  style={{ '--fill': `${h.weight}%` } as React.CSSProperties}
                  onChange={(e) => setWeight(h.ticker, Number(e.target.value))}
                />
              </li>
            );
          })}
        </ul>
      )}

      <div className={`total${balanced ? '' : ' is-off'}`} aria-live="polite">
        <span>Total</span>
        <span className="total-figure">{total.toFixed(1)}%</span>
        {!balanced && total > 0 && (
          <button type="button" className="text-button" onClick={() => onHoldings(rescaleTo100(holdings))}>
            <Icon name="scale" /> Rescale to 100%
          </button>
        )}
      </div>
      {!balanced && total > 0 && <p className="hint">Figures treat these weights as rescaled to 100%.</p>}

      {available.length > 0 && (
        <form
          className="add"
          onSubmit={(e) => {
            e.preventDefault();
            if (addTicker) onHoldings([...holdings, { ticker: addTicker, weight: 5 }]);
            setToAdd('');
          }}
        >
          <label className="visually-hidden" htmlFor="add-asset">Asset to add</label>
          <select id="add-asset" value={addTicker} onChange={(e) => setToAdd(e.target.value)}>
            {available.map((a) => (
              <option key={a.ticker} value={a.ticker}>
                {a.ticker} · {a.name} · {a.sector}
              </option>
            ))}
          </select>
          <button type="submit" className="button">
            <Icon name="plus" /> Add at 5%
          </button>
        </form>
      )}

      <label className="notional">
        <span className="control-label">Portfolio value (USD)</span>
        <input
          type="text"
          inputMode="numeric"
          value={notionalText}
          onChange={(e) => {
            setNotionalText(e.target.value);
            const v = Number(e.target.value.replace(/[$,\s]/g, ''));
            if (Number.isFinite(v) && v > 0) onNotional(v);
          }}
          onBlur={() => setNotionalText(String(notional))}
          aria-describedby="notional-display"
        />
        <span id="notional-display" className="notional-display">{money(notional)}</span>
      </label>
    </section>
  );
}
