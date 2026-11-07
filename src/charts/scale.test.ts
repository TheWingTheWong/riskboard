import { describe, expect, it } from 'vitest';
import { histogram, linearScale, niceDomain, niceStep, niceTicks } from './scale';
import { pct, signedPct, money } from '../lib/format';

describe('chart scales', () => {
  it('maps domain to range linearly, including inverted ranges', () => {
    const y = linearScale([0, 10], [100, 0]);
    expect(y(0)).toBe(100);
    expect(y(10)).toBe(0);
    expect(y(2.5)).toBe(75);
  });

  it('chooses 1-2-5 steps', () => {
    expect(niceStep(0, 1, 5)).toBe(0.2);
    expect(niceStep(0, 0.07, 5)).toBe(0.01);
    expect(niceStep(-0.05, 0.05, 4)).toBe(0.02);
  });

  it('produces clean tick values inside the domain', () => {
    expect(niceTicks(-0.043, 0.051, 4)).toEqual([-0.04, -0.02, 0, 0.02, 0.04]);
    expect(niceTicks(0, 1, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });

  it('expands a domain to nice bounds', () => {
    expect(niceDomain(0.031, 0.387, 5)).toEqual([0, 0.4]);
  });

  it('bins values and clamps outliers to the edges', () => {
    const bins = histogram([-5, 0.1, 0.2, 0.6, 0.9, 5], 2, 0, 1);
    expect(bins.map((b) => b.count)).toEqual([3, 3]);
    expect(bins[1].x0).toBe(0.5);
  });
});

describe('formatting', () => {
  it('formats percentages with a true minus sign', () => {
    expect(pct(0.02346)).toBe('2.35%');
    expect(pct(-0.004, 1)).toBe('−0.4%');
    expect(signedPct(0.012)).toBe('+1.20%');
    expect(pct(Number.NaN)).toBe('–');
  });

  it('formats money without cents', () => {
    expect(money(23456.7)).toBe('$23,457');
  });
});
