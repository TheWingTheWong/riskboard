import { describe, expect, it } from 'vitest';
import { empiricalVaR, historicalVaR, monteCarloVaR, parametricVaR } from './var';
import { createRng } from './rng';
import { covarianceMatrix, mean, stdev } from './stats';
import { normalizeWeights, portfolioReturns, portfolioVolatility } from './portfolio';

describe('historical VaR', () => {
  // 100 returns: -0.10, -0.09, ..., -0.01, then 90 small gains.
  const returns = [
    ...Array.from({ length: 10 }, (_, i) => -(10 - i) / 100),
    ...Array.from({ length: 90 }, () => 0.01),
  ];

  it('reads VaR off the empirical quantile', () => {
    // type-7 quantile at p = 0.05 sits at index 4.95 -> between -0.06 and -0.05
    const { var: v } = empiricalVaR(returns, 0.95);
    expect(v).toBeCloseTo(0.0505, 10);
  });

  it('computes CVaR as the mean loss beyond VaR', () => {
    const { cvar } = empiricalVaR(returns, 0.95);
    // tail = returns <= -0.0505: -0.10..-0.06 (5 obs), mean -0.08
    expect(cvar).toBeCloseTo(0.08, 10);
  });

  it('is monotone in confidence and CVaR >= VaR', () => {
    const levels = [0.9, 0.95, 0.99].map((c) => empiricalVaR(returns, c));
    expect(levels[0].var).toBeLessThan(levels[1].var);
    expect(levels[1].var).toBeLessThan(levels[2].var);
    for (const l of levels) expect(l.cvar).toBeGreaterThanOrEqual(l.var);
  });

  it('applies square-root-of-time horizon scaling', () => {
    const one = historicalVaR(returns, 0.99, 1);
    const ten = historicalVaR(returns, 0.99, 10);
    expect(ten.var).toBeCloseTo(one.var * Math.sqrt(10), 12);
    expect(ten.cvar).toBeCloseTo(one.cvar * Math.sqrt(10), 12);
  });

  it('validates its inputs', () => {
    expect(() => empiricalVaR([], 0.95)).toThrow(RangeError);
    expect(() => empiricalVaR([0.01], 1)).toThrow(RangeError);
  });
});

describe('parametric VaR', () => {
  it('matches the closed form for a zero-mean normal', () => {
    // 95%: z = 1.6449; 99%: z = 2.3263
    expect(parametricVaR(0, 0.01, 0.95).var).toBeCloseTo(0.016448536, 8);
    expect(parametricVaR(0, 0.01, 0.99).var).toBeCloseTo(0.023263479, 8);
  });

  it('computes normal expected shortfall', () => {
    // ES_97.5% of N(0,1) = phi(1.96)/0.025 = 2.3378
    expect(parametricVaR(0, 1, 0.975).cvar).toBeCloseTo(2.33780, 4);
  });

  it('subtracts the mean and scales with the horizon', () => {
    const r = parametricVaR(0.001, 0.02, 0.99, 10);
    expect(r.var).toBeCloseTo(-(0.01 - 2.3263478740408408 * 0.02 * Math.sqrt(10)), 10);
  });

  it('agrees with historical VaR on a large normal sample', () => {
    const rng = createRng(99);
    const xs = Array.from({ length: 200_000 }, () => 0.0004 + 0.012 * rng.normal());
    const hist = historicalVaR(xs, 0.99);
    const para = parametricVaR(mean(xs), stdev(xs), 0.99);
    expect(hist.var).toBeCloseTo(para.var, 3);
    expect(hist.cvar).toBeCloseTo(para.cvar, 3);
  });
});

describe('Monte Carlo VaR', () => {
  const rng = createRng(5);
  // Three correlated synthetic assets via a common factor.
  const factor = Array.from({ length: 1500 }, () => rng.normal() * 0.01);
  const series = [1.2, 0.8, -0.3].map((b, i) =>
    factor.map((f) => 0.0003 * (i + 1) + b * f + 0.006 * rng.normal()),
  );
  const cov = covarianceMatrix(series);
  const means = series.map(mean);
  const weights = normalizeWeights([0.5, 0.3, 0.2]);

  it('converges to the parametric answer (normal draws)', () => {
    const mc = monteCarloVaR({ means, cov, weights, confidence: 0.95, simulations: 100_000, seed: 3 });
    const mu = weights.reduce((a, w, i) => a + w * means[i], 0);
    const para = parametricVaR(mu, portfolioVolatility(cov, weights), 0.95);
    expect(mc.var / para.var).toBeGreaterThan(0.97);
    expect(mc.var / para.var).toBeLessThan(1.03);
    expect(mc.cvar / para.cvar).toBeGreaterThan(0.96);
    expect(mc.cvar / para.cvar).toBeLessThan(1.04);
  });

  it('reproduces the input correlation through the Cholesky factor', () => {
    // Simulate single-asset portfolios and compare their sample covariance.
    const sims = [0, 1, 2].map((i) =>
      monteCarloVaR({ means, cov, weights: [0, 1, 2].map((j) => (j === i ? 1 : 0)), confidence: 0.95, simulations: 60_000, seed: 11 }).samples,
    );
    const simCov = covarianceMatrix(sims);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(Math.abs(simCov[i][j] - cov[i][j])).toBeLessThan(0.05 * Math.sqrt(cov[i][i] * cov[j][j]));
      }
    }
  });

  it('is deterministic for a seed and returns one sample per path', () => {
    const a = monteCarloVaR({ means, cov, weights, confidence: 0.99, simulations: 2000, seed: 42 });
    const b = monteCarloVaR({ means, cov, weights, confidence: 0.99, simulations: 2000, seed: 42 });
    expect(a).toEqual(b);
    expect(a.samples).toHaveLength(2000);
  });

  it('rejects misaligned inputs', () => {
    expect(() => monteCarloVaR({ means, cov, weights: [1], confidence: 0.95 })).toThrow(RangeError);
  });

  it('prices the same portfolio as portfolioReturns', () => {
    const pr = portfolioReturns(series, weights);
    const mu = weights.reduce((a, w, i) => a + w * means[i], 0);
    expect(mean(pr)).toBeCloseTo(mu, 14);
  });
});
