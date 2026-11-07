import { useMemo } from 'react';

/**
 * A guilloche band: interlaced phase-shifted waves, as engraved on security
 * paper. Its amplitude follows the portfolio's annualised volatility, so the
 * masthead rule visibly calms or agitates as the portfolio changes.
 */
export function Guilloche({ volatility }: { volatility: number }) {
  const paths = useMemo(() => {
    const amp = 3 + Math.min(volatility / 0.35, 1) * 10;
    const strands = 9;
    const width = 1200;
    const mid = 14;
    return Array.from({ length: strands }, (_, k) => {
      const phase = (k / strands) * Math.PI * 2;
      let d = '';
      for (let px = 0; px <= width; px += 6) {
        const t = (px / width) * Math.PI * 2;
        const yv = mid + amp * Math.sin(t * 9 + phase) * Math.cos(t * 2 - phase / 3);
        d += `${px === 0 ? 'M' : 'L'}${px},${yv.toFixed(2)}`;
      }
      return d;
    });
  }, [volatility]);

  return (
    <svg className="guilloche" viewBox="0 0 1200 28" preserveAspectRatio="none" aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
