import { describe, expect, it } from 'vitest';
import { efficientFrontier, frontierCoefficients, frontierPortfolio, minVariancePortfolio, randomPortfolios } from './frontier';
import { analyzeFrontier, analyzePortfolio } from './analyze';
import { portfolioVolatility } from './portfolio';
import { dataset } from '../data';

const means = [0.08, 0.12, 0.05, 0.15];
const cov = [
  [0.04, 0.01, 0.002, 0.012],
  [0.01, 0.0625, 0.001, 0.02],
  [0.002, 0.001, 0.01, 0.0005],
  [0.012, 0.02, 0.0005, 0.09],
];

describe('minimum-variance portfolio', () => {
  const mv = minVariancePortfolio(means, cov);

  it('is fully invested', () => {
    expect(mv.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });

  it('has lower variance than any random long-only portfolio', () => {
    for (const p of randomPortfolios(means, cov, 2000, { seed: 3 })) {
      expect(mv.vol).toBeLessThanOrEqual(p.vol + 1e-12);
    }
  });

  it('cannot be improved by small perturbations that keep weights summing to 1', () => {
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const w = [...mv.weights];
      w[i] += 0.01;
      w[j] -= 0.01;
      expect(portfolioVolatility(cov, w)).toBeGreaterThan(mv.vol);
    }
  });
});

describe('analytic frontier', () => {
  it('starts at the minimum-variance point', () => {
    const curve = efficientFrontier(means, cov, 0.2, 40);
    const mv = minVariancePortfolio(means, cov);
    expect(curve[0].ret).toBeCloseTo(mv.ret, 12);
    expect(curve[0].vol).toBeCloseTo(mv.vol, 12);
    expect(curve).toHaveLength(40);
  });

  it('is increasing in volatility along the efficient branch', () => {
    const curve = efficientFrontier(means, cov, 0.2, 40);
    for (let k = 1; k < curve.length; k++) expect(curve[k].vol).toBeGreaterThan(curve[k - 1].vol);
  });

  it('frontier weights hit the target return and the hyperbola volatility', () => {
    const { a, b, c, d } = frontierCoefficients(means, cov);
    for (const target of [0.07, 0.1, 0.14]) {
      const p = frontierPortfolio(means, cov, target);
      expect(p.weights.reduce((s, w) => s + w, 0)).toBeCloseTo(1, 12);
      expect(p.ret).toBeCloseTo(target, 12);
      expect(p.vol ** 2).toBeCloseTo((a * target ** 2 - 2 * b * target + c) / d, 12);
    }
  });

  it('dominates every random long-only portfolio', () => {
    const { a, b, c, d } = frontierCoefficients(means, cov);
    for (const p of randomPortfolios(means, cov, 2000, { seed: 9 })) {
      const minVol = Math.sqrt((a * p.ret ** 2 - 2 * b * p.ret + c) / d);
      expect(p.vol).toBeGreaterThanOrEqual(minVol - 1e-12);
    }
  });

  it('random portfolios are long-only and fully invested', () => {
    for (const p of randomPortfolios(means, cov, 200)) {
      expect(p.weights.every((w) => w >= 0)).toBe(true);
      expect(p.weights.reduce((s, w) => s + w, 0)).toBeCloseTo(1, 12);
    }
  });
});

describe('end-to-end on the bundled dataset', () => {
  const series = dataset.assets.map((a) => a.returns);
  const weights = series.map(() => 1);

  it('produces a coherent risk picture for an equal-weight portfolio', () => {
    const a = analyzePortfolio({ series, weights, benchmark: dataset.index.returns, confidence: 0.99, simulations: 20_000 });
    expect(a.weights.reduce((s, w) => s + w, 0)).toBeCloseTo(1, 12);
    expect(a.annualVolatility).toBeGreaterThan(0.05);
    expect(a.annualVolatility).toBeLessThan(0.4);
    expect(a.beta).toBeGreaterThan(0.5);
    expect(a.beta).toBeLessThan(1.3);
    for (const est of [a.historical, a.parametric, a.monteCarlo]) {
      expect(est.var).toBeGreaterThan(0);
      expect(est.cvar).toBeGreaterThan(est.var);
    }
    // Fat-tailed data: historical 99% shortfall should exceed the normal model's.
    expect(a.historical.cvar).toBeGreaterThan(a.parametric.cvar);
    expect(a.risk.percent.reduce((s, p) => s + p, 0)).toBeCloseTo(1, 12);
  });

  it('places the current portfolio inside the frontier', () => {
    const f = analyzeFrontier(series, weights, { count: 500 });
    expect(f.current.vol).toBeGreaterThanOrEqual(f.minVariance.vol);
    expect(f.cloud).toHaveLength(500);
    expect(f.assets).toHaveLength(15);
  });
});
