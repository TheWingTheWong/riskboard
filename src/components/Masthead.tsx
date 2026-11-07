import { dataset } from '../data';
import { Guilloche } from './Guilloche';

interface Props {
  serial: string;
  volatility: number;
}

const first = dataset.dates[0];
const last = dataset.dates[dataset.dates.length - 1];

export function Masthead({ serial, volatility }: Props) {
  return (
    <header className="masthead">
      <div className="masthead-row">
        <h1 className="wordmark">
          <svg viewBox="0 0 32 32" aria-hidden="true" className="wordmark-seal">
            {Array.from({ length: 12 }, (_, i) => (
              <ellipse key={i} cx="16" cy="16" rx="13" ry="5.2" transform={`rotate(${i * 15} 16 16)`} />
            ))}
          </svg>
          riskboard
        </h1>
        <p className="dataset-note">
          <span className="synthetic-flag">Synthetic data</span>
          {dataset.assets.length} fictional assets and the {dataset.index.ticker} index, {dataset.dates.length} trading days, <span className="nowrap">{first}</span> to <span className="nowrap">{last}</span>. Generated from a seeded factor model; not market prices.
        </p>
        <p className="serial" title="Identifier of the current holdings. The URL carries the full portfolio, so the link reproduces it.">
          <span className="serial-label">Portfolio</span>
          <span className="serial-number">{serial}</span>
        </p>
      </div>
      <Guilloche volatility={volatility} />
    </header>
  );
}
