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
const PAPER = [237, 231, 215]; // --z10

const GREEN = [72, 178, 140]; // --hedge

function mix(a: number[], b: number[], t: number): string {
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(', ')})`;
}

/**
 * Diverging fill, linear and symmetric so colour strength is proportional to
 * |correlation|: negative (hedging) mixes toward banknote green, positive
 * (co-movement) toward paper. Matches the legend ramp exactly.
 */
export function correlationFill(c: number): string {
  const a = Math.min(Math.abs(c), 1);
  return mix(BASE, c >= 0 ? PAPER : GREEN, a);
}

export function CorrelationHeatmap({ tickers, matrix, highlight }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [pointer, setPointer] = useState(false);
  const n = tickers.length;
  const active = hover && hover[0] < n && hover[1] < n ? hover : null;
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
        tabIndex={0}
        aria-label={`Correlation matrix of ${n} assets. Use the arrow keys to move between cells; the value is read out below the chart.`}
        onMouseLeave={() => setPointer(false)}
        onKeyDown={(e) => {
          const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
          const m = moves[e.key];
          if (!m) return;
          e.preventDefault();
          const [i, j] = hover ?? [0, 1];
          setHover([Math.max(0, Math.min(n - 1, i + m[0])), Math.max(0, Math.min(n - 1, j + m[1]))]);
        }}
      >
        {tickers.map((t, i) => (
          <g key={t}>
            <text
              className={`tick heat-label${highlight.has(t) ? ' is-held' : ''}${active && (active[0] === i || active[1] === i) ? ' is-hover' : ''}`}
              x={label - 6}
              y={label + (i + 0.5) * cell}
              dy="0.32em"
              textAnchor="end"
            >
              {t}
            </text>
            <text
              className={`tick heat-label${highlight.has(t) ? ' is-held' : ''}${active && (active[0] === i || active[1] === i) ? ' is-hover' : ''}`}
              transform={`translate(${label + (i + 0.5) * cell},${label - 6}) rotate(-90)`}
              dy="0.32em"
            >
              {t}
            </text>
          </g>
        ))}
        {matrix.map((row, i) =>
          row.map((c, j) => (
            <g
              key={`${i}-${j}`}
              onMouseEnter={() => {
                setHover([i, j]);
                setPointer(true);
              }}
              onClick={() => setHover([i, j])}
            >
              <rect
                x={label + j * cell + 0.5}
                y={label + i * cell + 0.5}
                width={cell - 1}
                height={cell - 1}
                fill={i === j ? 'var(--z3)' : correlationFill(c)}
                className={active && active[0] === i && active[1] === j ? 'heat-cell is-hover' : 'heat-cell'}
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
      {pointer && active && active[0] !== active[1] && (
        <div className="tooltip" style={{ left: Math.min(label + active[1] * cell + cell, size - 140), top: label + active[0] * cell - 34 }}>
          {tickers[active[0]]} × {tickers[active[1]]} <strong>{num(matrix[active[0]][active[1]], 2)}</strong>
        </div>
      )}
      <p className="heat-readout" aria-live="polite">
        {active && active[0] !== active[1] ? (
          <>
            <strong>{tickers[active[0]]} × {tickers[active[1]]}</strong> {num(matrix[active[0]][active[1]], 2)}
            {matrix[active[0]][active[1]] < 0 ? ', moves against each other' : ', moves together'}
          </>
        ) : (
          'Point at or tap a cell to read its correlation.'
        )}
      </p>
      <div className="legend" aria-hidden="true">
        <span>−1</span>
        <span className="legend-ramp" />
        <span>+1</span>
      </div>
    </div>
  );
}
