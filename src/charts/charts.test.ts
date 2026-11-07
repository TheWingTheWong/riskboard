import { describe, expect, it } from 'vitest';
import { placeLabels } from './FrontierChart';
import { correlationFill } from './CorrelationHeatmap';

describe('placeLabels', () => {
  it('leaves non-overlapping labels where they are', () => {
    expect(placeLabels([{ x: 0, y: 10, width: 30 }, { x: 100, y: 12, width: 30 }])).toEqual([10, 12]);
  });

  it('pushes horizontally overlapping labels at least `gap` apart', () => {
    const ys = placeLabels([{ x: 0, y: 50, width: 40 }, { x: 10, y: 52, width: 40 }, { x: 20, y: 49, width: 40 }], 12);
    const sorted = [...ys].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(12);
    expect(Math.min(...ys)).toBe(49); // the topmost label keeps its position
  });
});

describe('correlationFill', () => {
  const channels = (c: string) => c.match(/\d+/g)!.map(Number);
  const strength = (c: number) => {
    const [r, g, b] = channels(correlationFill(c));
    const [r0, g0, b0] = channels(correlationFill(0));
    return Math.hypot(r - r0, g - g0, b - b0);
  };

  it('is the neutral base at zero', () => {
    expect(correlationFill(0)).toBe('rgb(19, 33, 28)');
  });

  it('scales linearly with |correlation| on both sides', () => {
    expect(strength(0.5) / strength(1)).toBeCloseTo(0.5, 1);
    expect(strength(-0.5) / strength(-1)).toBeCloseTo(0.5, 1);
  });

  it('uses different hues for hedging and co-movement', () => {
    expect(correlationFill(-0.8)).not.toBe(correlationFill(0.8));
  });
});
