import { describe, expect, it } from 'vitest';
import { decodeState, DEFAULT_STATE, encodeState, equalWeight, PRESETS, portfolioSerial, rescaleTo100, totalWeight } from './portfolio';
import { dataset } from '../data';

const known = new Set(dataset.assets.map((a) => a.ticker));

describe('presets', () => {
  it('only reference bundled tickers and sum to 100%', () => {
    for (const p of PRESETS) {
      expect(p.holdings.every((h) => known.has(h.ticker))).toBe(true);
      expect(totalWeight(p.holdings)).toBeCloseTo(100, 10);
    }
  });

  it('equal-weights a ticker list', () => {
    expect(equalWeight(['A', 'B', 'C', 'D'])).toEqual(['A', 'B', 'C', 'D'].map((ticker) => ({ ticker, weight: 25 })));
  });
});

describe('rescaleTo100', () => {
  it('rescales to exactly 100 at two decimals', () => {
    const out = rescaleTo100([{ ticker: 'A', weight: 1 }, { ticker: 'B', weight: 1 }, { ticker: 'C', weight: 1 }]);
    expect(totalWeight(out)).toBeCloseTo(100, 10);
    expect(out.map((h) => h.weight).sort()).toEqual([33.33, 33.33, 33.34]);
  });

  it('leaves an all-zero portfolio alone', () => {
    expect(rescaleTo100([{ ticker: 'A', weight: 0 }])).toEqual([{ ticker: 'A', weight: 0 }]);
  });
});

describe('URL hash round trip', () => {
  it('encodes and decodes state', () => {
    const state = { holdings: [{ ticker: 'NOVA', weight: 62.5 }, { ticker: 'TBND', weight: 37.5 }], confidence: 0.99 as const, horizon: 10 as const, notional: 250000 };
    const hash = encodeState(state);
    expect(hash).toBe('#p=NOVA:62.5,TBND:37.5&c=99&h=10&v=250000');
    expect(decodeState(hash, known)).toEqual(state);
  });

  it('drops unknown, duplicate and out-of-range entries and falls back to defaults', () => {
    const s = decodeState('#p=NOVA:10,FAKE:20,NOVA:30,QBIT:-5,GLDX:abc&c=97&h=3&v=-1', known);
    expect(s.holdings).toEqual([{ ticker: 'NOVA', weight: 10 }]);
    expect(s.confidence).toBe(DEFAULT_STATE.confidence);
    expect(s.horizon).toBe(1);
    expect(s.notional).toBe(DEFAULT_STATE.notional);
  });

  it('returns the default portfolio for an empty hash', () => {
    expect(decodeState('', known)).toEqual(DEFAULT_STATE);
  });
});

describe('portfolioSerial', () => {
  it('is stable regardless of holding order and ignores zero weights', () => {
    const a = portfolioSerial([{ ticker: 'NOVA', weight: 50 }, { ticker: 'TBND', weight: 50 }, { ticker: 'GLDX', weight: 0 }]);
    const b = portfolioSerial([{ ticker: 'TBND', weight: 50 }, { ticker: 'NOVA', weight: 50 }]);
    expect(a).toBe(b);
    expect(a).toMatch(/^RB [0-9A-F]{4} [0-9A-F]{4}$/);
  });

  it('changes when a weight changes', () => {
    expect(portfolioSerial([{ ticker: 'NOVA', weight: 50 }])).not.toBe(portfolioSerial([{ ticker: 'NOVA', weight: 51 }]));
  });
});
