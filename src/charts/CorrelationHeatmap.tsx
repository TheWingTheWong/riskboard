import { useState } from 'react';
import { num } from '../lib/format';
import { useElementWidth } from '../lib/useElementWidth';

interface Props {
  tickers: string[];
  matrix: number[][];
  /** Tickers to emphasise (current holdings). */
  highlight: ReadonlySet<string>;
}

const BASE = [19, 33, 28]; // --z2
const PAPER = [236, 226, 196];
const GREEN = [72, 178, 140];

function mix(a: number[], b: number[], t: number): string {
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(', ')})`;
}

/** Diverging fill: hedging (negative) mixes toward banknote green, co-movement toward paper. */
export function correlationFill(c: number): string {
  const a = Math.min(Math.abs(c), 1);
  return c >= 0 ? mix(BASE, PAPER, a ** 0.9) : mix(BASE, GREEN, Math.min(1, 0.15 + a ** 0.7));
}

export function CorrelationHeatmap({ tickers, matrix, highlight }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<[number, number] | null>(null);
  const n = tickers.length;
  const label = 40;
  const size = Math.max(160, Math.min(width, 560));
  const cell = (size - label) / n;
  const showValues = cell >= 24;

  return (
    <div className="chart heatmap" ref={ref}>
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={`Correlation matrix of ${n} assets. Hover a cell for the exact value.`}
        onMouseLeave={() => setHover(null)}
      >
        {tickers.map((t, i) => (
          <g key={t}>
            <text
              className={`tick heat-label${highlight.has(t) ? ' is-held' : ''}${hover && (hover[0] === i || hover[1] === i) ? ' is-hover' : ''}`}
              x={label - 6}
              y={label + (i + 0.5) * cell}
              dy="0.32em"
              textAnchor="end"
            >
              {t}
            </text>
            <text
              className={`tick heat-label${highlight.has(t) ? ' is-held' : ''}${hover && (hover[0] === i || hover[1] === i) ? ' is-hover' : ''}`}
              transform={`translate(${label + (i + 0.5) * cell},${label - 6}) rotate(-90)`}
              dy="0.32em"
            >
              {t}
            </text>
          </g>
        ))}
        {matrix.map((row, i) =>
          row.map((c, j) => (
            <g key={`${i}-${j}`} onMouseEnter={() => setHover([i, j])}>
              <rect
                x={label + j * cell + 0.5}
                y={label + i * cell + 0.5}
                width={cell - 1}
                height={cell - 1}
                fill={i === j ? 'var(--z3)' : correlationFill(c)}
                className={hover && hover[0] === i && hover[1] === j ? 'heat-cell is-hover' : 'heat-cell'}
              />
              {showValues && i !== j && (
                <text
                  className="heat-value"
                  x={label + (j + 0.5) * cell}
                  y={label + (i + 0.5) * cell}
                  dy="0.32em"
                  textAnchor="middle"
                  data-dark={c > 0.5 || undefined}
                >
                  {num(c, 2).replace('0.', '.')}
                </text>
              )}
            </g>
          )),
        )}
      </svg>
      {hover && hover[0] !== hover[1] && (
        <div className="tooltip" style={{ left: Math.min(label + hover[1] * cell + cell, size - 140), top: label + hover[0] * cell - 34 }}>
          {tickers[hover[0]]} × {tickers[hover[1]]} <strong>{num(matrix[hover[0]][hover[1]], 2)}</strong>
        </div>
      )}
      <div className="legend" aria-hidden="true">
        <span>−1</span>
        <span className="legend-ramp" />
        <span>+1</span>
      </div>
    </div>
  );
}
