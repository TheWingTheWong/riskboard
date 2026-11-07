import { describe, expect, it } from 'vitest';
import { createRng, mulberry32, studentT } from './rng';
import { covariance, covarianceMatrix, correlationMatrix, mean, quantile, stdev, variance } from './stats';
import { normalCdf, normalInv, normalPdf } from './normal';
import { cholesky, choleskySolve, dot, matVec, quadForm, solveSpd, subMatrix } from './linalg';

describe('rng', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it('produces different streams for different seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it('normal draws have ~zero mean and unit variance', () => {
    const rng = createRng(7);
    const xs = Array.from({ length: 50_000 }, () => rng.normal());
    expect(mean(xs)).toBeCloseTo(0, 1);
    expect(variance(xs)).toBeCloseTo(1, 1);
  });

  it('studentT is rescaled to unit variance and has fat tails', () => {
    const rng = createRng(11);
    const xs = Array.from({ length: 80_000 }, () => studentT(rng, 5));
    expect(variance(xs)).toBeGreaterThan(0.9);
    expect(variance(xs)).toBeLessThan(1.1);
    const m = mean(xs);
    const kurt = mean(xs.map((x) => (x - m) ** 4)) / variance(xs) ** 2;
    expect(kurt).toBeGreaterThan(4); // normal is 3; t(5) is 9 in theory
  });

  it('rejects dof <= 2', () => {
    expect(() => studentT(createRng(1), 2)).toThrow(RangeError);
  });
});

describe('stats', () => {
  it('computes mean, sample variance and stdev', () => {
    const xs = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(mean(xs)).toBe(5);
    expect(variance(xs)).toBeCloseTo(32 / 7, 12);
    expect(stdev(xs)).toBeCloseTo(Math.sqrt(32 / 7), 12);
  });

  it('computes type-7 quantiles like NumPy', () => {
    const xs = [10, 1, 7, 3, 5];
    expect(quantile(xs, 0)).toBe(1);
    expect(quantile(xs, 1)).toBe(10);
    expect(quantile(xs, 0.5)).toBe(5);
    expect(quantile(xs, 0.1)).toBeCloseTo(1.8, 12); // numpy.quantile([1,3,5,7,10], .1)
    expect(quantile(xs, 0.95)).toBeCloseTo(9.4, 12);
  });

  it('builds a symmetric covariance matrix consistent with pairwise covariance', () => {
    const a = [0.01, -0.02, 0.03, 0.0, 0.015];
    const b = [0.02, -0.01, 0.01, 0.005, -0.004];
    const c = [-0.01, 0.02, -0.03, 0.001, 0.0];
    const cov = covarianceMatrix([a, b, c]);
    expect(cov[0][1]).toBeCloseTo(covariance(a, b), 15);
    expect(cov[1][0]).toBe(cov[0][1]);
    expect(cov[2][2]).toBeCloseTo(variance(c), 15);
  });

  it('builds a correlation matrix with unit diagonal and bounded entries', () => {
    const rng = createRng(3);
    const series = Array.from({ length: 4 }, () => Array.from({ length: 200 }, () => rng.normal()));
    series[3] = series[0].map((x) => -2 * x); // perfectly anti-correlated with series 0
    const corr = correlationMatrix(series);
    for (let i = 0; i < 4; i++) {
      expect(corr[i][i]).toBe(1);
      for (let j = 0; j < 4; j++) {
        expect(Math.abs(corr[i][j])).toBeLessThanOrEqual(1 + 1e-12);
        expect(corr[i][j]).toBeCloseTo(corr[j][i], 15);
      }
    }
    expect(corr[0][3]).toBeCloseTo(-1, 12);
  });
});

describe('normal distribution', () => {
  it('matches reference CDF and PDF values', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 7);
    expect(normalCdf(1.959963985)).toBeCloseTo(0.975, 6);
    expect(normalCdf(-1.644853627)).toBeCloseTo(0.05, 6);
    expect(normalPdf(0)).toBeCloseTo(0.3989422804, 9);
  });

  it('inverts the CDF at standard confidence levels', () => {
    expect(normalInv(0.5)).toBeCloseTo(0, 12);
    expect(normalInv(0.95)).toBeCloseTo(1.6448536269514722, 10);
    expect(normalInv(0.99)).toBeCloseTo(2.3263478740408408, 10);
    expect(normalInv(0.1)).toBeCloseTo(-1.2815515655446004, 10);
    expect(normalInv(1e-6)).toBeCloseTo(-4.753424308822899, 5);
  });

  it('round-trips through the CDF', () => {
    for (const p of [0.001, 0.025, 0.3, 0.7, 0.975, 0.999]) {
      expect(normalCdf(normalInv(p))).toBeCloseTo(p, 12);
    }
  });
});

describe('linalg', () => {
  const spd = [
    [4, 12, -16],
    [12, 37, -43],
    [-16, -43, 98],
  ];

  it('computes the textbook Cholesky factor', () => {
    expect(cholesky(spd)).toEqual([
      [2, 0, 0],
      [6, 1, 0],
      [-8, 5, 3],
    ]);
  });

  it('reconstructs the matrix from L L^T', () => {
    const l = cholesky(spd);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let s = 0;
        for (let k = 0; k < 3; k++) s += l[i][k] * l[j][k];
        expect(s).toBeCloseTo(spd[i][j], 12);
      }
    }
  });

  it('solves SPD systems', () => {
    const b = [1, 2, 3];
    const x = solveSpd(spd, b);
    matVec(spd, x).forEach((v, i) => expect(v).toBeCloseTo(b[i], 10));
    expect(choleskySolve(cholesky(spd), b)).toEqual(x);
  });

  it('handles a singular PSD matrix via jitter', () => {
    const psd = [
      [1, 1],
      [1, 1],
    ];
    const l = cholesky(psd);
    expect(l[0][0]).toBeCloseTo(1, 6);
    expect(Number.isFinite(l[1][1])).toBe(true);
  });

  it('rejects indefinite matrices', () => {
    expect(() =>
      cholesky([
        [1, 2],
        [2, 1],
      ]),
    ).toThrow(/not positive definite/);
  });

  it('computes dot products, quadratic forms and sub-matrices', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
    expect(quadForm([[2, 0], [0, 3]], [1, 2])).toBe(14);
    expect(subMatrix(spd, [0, 2])).toEqual([
      [4, -16],
      [-16, 98],
    ]);
  });
});
