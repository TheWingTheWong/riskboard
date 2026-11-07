import { describe, expect, it } from 'vitest';
import { beta, maxDrawdown, normalizeWeights, portfolioReturns, portfolioVolatility, riskContributions } from './portfolio';
import { createRng } from './rng';
import { covarianceMatrix, stdev } from './stats';

describe('portfolio aggregation', () => {
  it('normalises weights and rejects non-positive totals', () => {
    expect(normalizeWeights([20, 30, 50])).toEqual([0.2, 0.3, 0.5]);
    expect(() => normalizeWeights([0, 0])).toThrow(RangeError);
  });

  it('computes weighted daily returns', () => {
    const r = portfolioReturns([[0.01, -0.02], [0.03, 0.01]], [0.25, 0.75]);
    expect(r[0]).toBeCloseTo(0.025, 15);
    expect(r[1]).toBeCloseTo(0.0025, 15);
  });

  it('volatility from the covariance matrix matches the realised series', () => {
    const rng = createRng(1);
    const series = Array.from({ length: 4 }, () => Array.from({ length: 500 }, () => rng.normal() * 0.01));
    const w = [0.1, 0.2, 0.3, 0.4];
    expect(portfolioVolatility(covarianceMatrix(series), w)).toBeCloseTo(stdev(portfolioReturns(series, w)), 12);
  });
});

describe('beta', () => {
  const rng = createRng(2);
  const index = Array.from({ length: 2000 }, () => rng.normal() * 0.01);

  it('is 1 against itself and scales linearly', () => {
    expect(beta(index, index)).toBeCloseTo(1, 12);
    expect(beta(index.map((x) => 1.5 * x), index)).toBeCloseTo(1.5, 12);
  });

  it('recovers a factor loading through noise', () => {
    const asset = index.map((x) => 0.8 * x + 0.005 * rng.normal());
    expect(beta(asset, index)).toBeCloseTo(0.8, 1);
  });
});

describe('risk contributions', () => {
  const cov = [
    [0.04, 0.006, -0.002],
    [0.006, 0.09, 0.01],
    [-0.002, 0.01, 0.0025],
  ];
  const w = [0.5, 0.3, 0.2];

  it('component contributions sum to total volatility (Euler)', () => {
    const rc = riskContributions(cov, w);
    expect(rc.component.reduce((a, b) => a + b, 0)).toBeCloseTo(rc.volatility, 14);
    expect(rc.percent.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 14);
    expect(rc.volatility).toBeCloseTo(portfolioVolatility(cov, w), 14);
  });

  it('marginal contribution matches a finite-difference derivative', () => {
    const rc = riskContributions(cov, w);
    const h = 1e-6;
    for (let i = 0; i < 3; i++) {
      const up = w.map((x, j) => (j === i ? x + h : x));
      const dn = w.map((x, j) => (j === i ? x - h : x));
      const fd = (portfolioVolatility(cov, up) - portfolioVolatility(cov, dn)) / (2 * h);
      expect(rc.marginal[i]).toBeCloseTo(fd, 8);
    }
  });

  it('equals the weight for uncorrelated equal-vol assets', () => {
    const rc = riskContributions([[0.01, 0], [0, 0.01]], [0.5, 0.5]);
    expect(rc.percent).toEqual([0.5, 0.5]);
  });

  it('can be negative for a hedge', () => {
    const rc = riskContributions([[0.04, -0.01], [-0.01, 0.01]], [0.9, 0.1]);
    expect(rc.percent[1]).toBeLessThan(0);
  });

  it('handles a zero-risk portfolio', () => {
    expect(riskContributions([[0]], [1]).percent).toEqual([0]);
  });
});

describe('maxDrawdown', () => {
  it('measures the worst peak-to-trough fall of the compounded path', () => {
    // 100 -> 110 -> 88 -> 96.8 -> 77.44: peak 110, trough 77.44
    expect(maxDrawdown([0.1, -0.2, 0.1, -0.2])).toBeCloseTo(1 - 77.44 / 110, 12);
    expect(maxDrawdown([0.01, 0.02])).toBe(0);
  });
});
