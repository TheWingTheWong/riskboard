import { useMemo, useState } from 'react';
import { linearScale, niceDomain } from './scale';
import type { FrontierAnalysis } from '../risk';
import { num, pct } from '../lib/format';
import { useElementWidth } from '../lib/useElementWidth';

interface Props {
  frontier: FrontierAnalysis;
  tickers: string[];
  /** Portfolio weights (fractions) aligned with `tickers`, used to size asset dots. */
  weights: number[];
}

const HEIGHT = 340;
const M = { top: 16, right: 18, bottom: 38, left: 48 };

/** Green ramp for the random-portfolio cloud, by return/volatility ratio. */
function cloudFill(t: number): string {
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${Math.round(52 + 90 * k)}, ${Math.round(86 + 110 * k)}, ${Math.round(72 + 84 * k)})`;
}

export function FrontierChart({ frontier, tickers, weights }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const { cloud, curve, minVariance, current, assets } = frontier;

  const { x, y, sharpeLo, sharpeHi, curvePath } = useMemo(() => {
    const vols = [...assets.map((a) => a.vol), ...cloud.map((p) => p.vol), minVariance.vol, current.vol];
    const rets = [...assets.map((a) => a.ret), ...cloud.map((p) => p.ret), minVariance.ret, current.ret];
    const xd = niceDomain(0, Math.max(...vols) * 1.05, 5);
    const yd = niceDomain(Math.min(0, ...rets), Math.max(...rets) * 1.05, 5);
    const x = linearScale(xd, [M.left, width - M.right]);
    const y = linearScale(yd, [HEIGHT - M.bottom, M.top]);
    const sharpes = cloud.map((p) => p.sharpe);
    const visible = curve.filter((p) => p.vol <= xd[1] && p.ret <= yd[1]);
    const curvePath = visible.map((p, i) => `${i ? 'L' : 'M'}${x(p.vol).toFixed(1)},${y(p.ret).toFixed(1)}`).join('');
    return { x, y, sharpeLo: Math.min(...sharpes), sharpeHi: Math.max(...sharpes), curvePath };
  }, [cloud, curve, assets, minVariance, current, width]);

  const xTicks = x.ticks(Math.max(3, Math.floor(width / 100)));
  const yTicks = y.ticks(5);
  const cx = x(current.vol);
  const cy = y(current.ret);
  const labelLeft = cx > width - 170;

  return (
    <div className="chart" ref={ref}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`Efficient frontier. Your portfolio: ${pct(current.ret, 1)} annual return at ${pct(current.vol, 1)} volatility. Minimum-variance portfolio: ${pct(minVariance.vol, 1)} volatility.`}
      >
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line className="grid" x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
            <text className="tick" x={M.left - 6} y={y(t)} dy="0.32em" textAnchor="end">{pct(t, 0)}</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={`x${t}`} className="tick" x={x(t)} y={HEIGHT - M.bottom + 16} textAnchor="middle">{pct(t, 0)}</text>
        ))}
        <line className="axis" x1={M.left} x2={width - M.right} y1={HEIGHT - M.bottom} y2={HEIGHT - M.bottom} />
        <text className="axis-title" x={width - M.right} y={HEIGHT - 4} textAnchor="end">Annualised volatility</text>
        <text className="axis-title" x={M.left} y={M.top - 4}>Annualised return</text>

        <g className="cloud">
          {cloud.map((p, i) => (
            <circle key={i} cx={x(p.vol)} cy={y(p.ret)} r={1.6} fill={cloudFill((p.sharpe - sharpeLo) / (sharpeHi - sharpeLo || 1))} />
          ))}
        </g>
        <path d={curvePath} className="frontier-curve" />

        {assets.map((a, i) => {
          const r = 2.5 + Math.sqrt(weights[i]) * 9;
          return (
            <g key={tickers[i]} className="asset-dot" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <circle cx={x(a.vol)} cy={y(a.ret)} r={r} />
              <text className="tick asset-label" x={x(a.vol) + r + 3} y={y(a.ret)} dy="0.32em">{tickers[i]}</text>
            </g>
          );
        })}

        <g className="minvar">
          <path d={`M${x(minVariance.vol)},${y(minVariance.ret) - 6}l6,6l-6,6l-6,-6z`} />
          <text className="tick" x={x(minVariance.vol) - 9} y={y(minVariance.ret)} dy="0.32em" textAnchor="end">Min variance</text>
        </g>

        <g className="current">
          <line x1={cx} x2={cx} y1={cy + 9} y2={HEIGHT - M.bottom} />
          <line x1={M.left} x2={cx - 9} y1={cy} y2={cy} />
          <circle cx={cx} cy={cy} r={7} />
          <circle cx={cx} cy={cy} r={2} className="current-core" />
          <text x={labelLeft ? cx - 12 : cx + 12} y={cy - 10} textAnchor={labelLeft ? 'end' : 'start'} className="current-label">
            Your portfolio
          </text>
          <text x={labelLeft ? cx - 12 : cx + 12} y={cy + 4} textAnchor={labelLeft ? 'end' : 'start'} className="current-figures">
            {pct(current.ret, 1)} / {pct(current.vol, 1)}
          </text>
        </g>
      </svg>
      {hover !== null && (
        <div className="tooltip" style={{ left: Math.min(x(assets[hover].vol) + 10, width - 170), top: y(assets[hover].ret) + 12 }}>
          <strong>{tickers[hover]}</strong> {pct(assets[hover].ret, 1)} return, {pct(assets[hover].vol, 1)} vol, ratio {num(assets[hover].ret / assets[hover].vol, 2)}
        </div>
      )}
    </div>
  );
}
