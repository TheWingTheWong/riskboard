import { useMemo, useState } from 'react';
import { histogram, linearScale, niceTicks } from './scale';
import { HatchDefs } from './Hatch';
import { normalPdf, quantile } from '../risk';
import { pct } from '../lib/format';
import { useElementWidth } from '../lib/useElementWidth';

export interface VarMarker {
  key: string;
  label: string;
  /** Loss as a positive fraction; drawn at x = -value. */
  value: number;
  dash: string;
}

interface Props {
  returns: readonly number[];
  mean: number;
  sd: number;
  markers: VarMarker[];
  /** Threshold that separates hatched tail bins (historical VaR). */
  tailCutoff: number;
}

const HEIGHT = 260;
const M = { top: 46, right: 12, bottom: 30, left: 40 };

export function Histogram({ returns, mean, sd, markers, tailCutoff }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const { bins, x, y, curve } = useMemo(() => {
    const lo = Math.min(quantile(returns, 0.002), -Math.max(...markers.map((m) => m.value)) * 1.15);
    const hi = quantile(returns, 0.998);
    const span = Math.max(Math.abs(lo), Math.abs(hi));
    const domain: [number, number] = [-span, span];
    const binCount = Math.max(24, Math.min(64, Math.round(width / 11)));
    const bins = histogram(returns, binCount, domain[0], domain[1]);
    const binWidth = (domain[1] - domain[0]) / binCount;
    const x = linearScale(domain, [M.left, width - M.right]);
    const peakNormal = (returns.length * binWidth * normalPdf(0)) / sd;
    const yMax = Math.max(...bins.map((b) => b.count), peakNormal) * 1.08;
    const y = linearScale([0, yMax], [HEIGHT - M.bottom, M.top]);
    const curve = Array.from({ length: 121 }, (_, i) => {
      const r = domain[0] + ((domain[1] - domain[0]) * i) / 120;
      const density = (returns.length * binWidth * normalPdf((r - mean) / sd)) / sd;
      return `${i === 0 ? 'M' : 'L'}${x(r).toFixed(1)},${y(density).toFixed(1)}`;
    }).join('');
    return { bins, x, y, curve };
  }, [returns, mean, sd, markers, width]);

  const xTicks = niceTicks(x.domain[0], x.domain[1], Math.max(4, Math.floor(width / 90)));
  const yTicks = niceTicks(0, y.domain[1], 4);
  const hovered = hover === null ? null : bins[hover];
  const tailDays = returns.filter((r) => r <= -tailCutoff).length;
  const offScale = returns.filter((r) => r < x.domain[0] || r > x.domain[1]);
  const worst = Math.min(...returns);

  // Stagger marker labels so close thresholds stay legible.
  const sortedMarkers = [...markers].sort((a, b) => b.value - a.value);

  return (
    <div className="chart" ref={ref}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`Histogram of ${returns.length} daily portfolio returns. ${tailDays} days fell beyond the historical VaR of ${pct(-tailCutoff)}.`}
        onMouseLeave={() => setHover(null)}
      >
        <HatchDefs id="tail-hatch" color="var(--loss)" spacing={3.5} weight={1.2} />
        {yTicks.map((t) => (
          <g key={t}>
            <line className="grid" x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
            <text className="tick" x={M.left - 6} y={y(t)} dy="0.32em" textAnchor="end">{t}</text>
          </g>
        ))}
        {bins.map((b, i) => {
          const inTail = b.x1 <= -tailCutoff + 1e-12 || (b.x0 < -tailCutoff && b.x1 > -tailCutoff);
          const bx = x(b.x0) + 0.5;
          const bw = Math.max(x(b.x1) - x(b.x0) - 1, 0.5);
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={bx} y={M.top} width={bw} height={HEIGHT - M.bottom - M.top} fill="transparent" />
              {b.count > 0 && (
                <rect
                  x={bx}
                  y={y(b.count)}
                  width={bw}
                  height={y(0) - y(b.count)}
                  className={inTail ? 'bin bin-tail' : 'bin'}
                  data-active={hover === i || undefined}
                />
              )}
            </g>
          );
        })}
        <path d={curve} className="normal-curve" />
        <line className="axis" x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} />
        {xTicks.map((t) => (
          <text key={t} className="tick" x={x(t)} y={HEIGHT - M.bottom + 16} textAnchor="middle">
            {pct(t, Math.abs(t) < 0.01 && t !== 0 ? 1 : 0)}
          </text>
        ))}
        {sortedMarkers.map((m, i) => {
          const mx = x(-m.value);
          return (
            <g key={m.key} className="var-marker">
              <line x1={mx} x2={mx} y1={M.top - 40 + i * 13} y2={y(0)} strokeDasharray={m.dash} />
              <text x={mx - 5} y={M.top - 40 + i * 13} dy="0.75em" textAnchor="end" className="var-label">
                {m.label} {pct(-m.value)}
              </text>
            </g>
          );
        })}
      </svg>
      {hovered && (
        <div className="tooltip" style={{ left: Math.min(x((hovered.x0 + hovered.x1) / 2), width - 150), top: 6 }}>
          <strong>{hovered.count} days</strong> between {pct(hovered.x0)} and {pct(hovered.x1)}
        </div>
      )}
      {offScale.length > 0 && (
        <p className="chart-note">
          {offScale.length} {offScale.length === 1 ? 'day falls' : 'days fall'} outside the axis and {offScale.length === 1 ? 'is' : 'are'} counted in the edge bars. Worst day: {pct(worst)}.
        </p>
      )}
    </div>
  );
}
