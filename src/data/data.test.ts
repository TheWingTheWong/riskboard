import { describe, expect, it } from 'vitest';
import { dataset } from './index';
import { businessDays, DEFAULT_SEED, generateDataset } from './generate';
import { correlationMatrix } from '../risk/stats';

describe('bundled dataset', () => {
  it('is labelled synthetic', () => {
    expect(dataset.synthetic).toBe(true);
    expect(dataset.description).toMatch(/SYNTHETIC/);
  });

  it('has 15 assets aligned to one date axis with finite returns', () => {
    expect(dataset.assets).toHaveLength(15);
    const n = dataset.dates.length;
    expect(n).toBeGreaterThan(500);
    for (const s of [dataset.index, ...dataset.assets]) {
      expect(s.returns).toHaveLength(n);
      expect(s.returns.every(Number.isFinite)).toBe(true);
    }
    expect(new Set(dataset.assets.map((a) => a.ticker)).size).toBe(15);
  });

  it('is reproducible from the committed seed', () => {
    expect(dataset.seed).toBe(DEFAULT_SEED);
    expect(generateDataset(DEFAULT_SEED)).toEqual(dataset);
  });

  it('has the intended correlation structure', () => {
    const byTicker = Object.fromEntries(dataset.assets.map((a, i) => [a.ticker, i]));
    const corr = correlationMatrix(dataset.assets.map((a) => a.returns));
    const c = (a: string, b: string) => corr[byTicker[a]][byTicker[b]];
    expect(c('NOVA', 'QBIT')).toBeGreaterThan(c('NOVA', 'MDCO')); // same sector co-moves more
    expect(c('NOVA', 'TBND')).toBeLessThan(0); // bonds hedge equities
  });
});

describe('businessDays', () => {
  it('skips weekends and ends on the given date', () => {
    const days = businessDays('2025-12-31', 5);
    expect(days).toEqual(['2025-12-25', '2025-12-26', '2025-12-29', '2025-12-30', '2025-12-31']);
  });
});
