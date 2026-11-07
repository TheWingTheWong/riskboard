/** Portfolio-level aggregation: returns, volatility, beta, risk decomposition. */
import { dot, matVec } from './linalg';
import { covariance, variance } from './stats';

export const TRADING_DAYS = 252;

/** Scales weights to sum to 1. Throws if they sum to zero or less. */
export function normalizeWeights(weights: readonly number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0);
  if (!(total > 0)) throw new RangeError('weights must sum to a positive number');
  return weights.map((w) => w / total);
}

/** Daily portfolio returns: r_t = sum_i w_i * r_{i,t} (daily rebalanced to target weights). */
export function portfolioReturns(series: readonly (readonly number[])[], weights: readonly number[]): number[] {
  if (series.length !== weights.length) throw new RangeError('one weight per series required');
  const t = series[0]?.length ?? 0;
  const out = new Array<number>(t).fill(0);
  for (let i = 0; i < series.length; i++) {
    const w = weights[i];
    if (w === 0) continue;
    const s = series[i];
    for (let k = 0; k < t; k++) out[k] += w * s[k];
  }
  return out;
}

/** Portfolio volatility sqrt(w' Σ w) for a covariance matrix in the same units. */
export function portfolioVolatility(cov: readonly (readonly number[])[], weights: readonly number[]): number {
  return Math.sqrt(Math.max(dot(weights, matVec(cov, weights)), 0));
}

/** Beta of a return series against a benchmark: cov(r, b) / var(b). */
export function beta(returns: readonly number[], benchmark: readonly number[]): number {
  return covariance(returns, benchmark) / variance(benchmark);
}

export interface RiskContribution {
  /** Marginal contribution d(sigma)/d(w_i) = (Σw)_i / sigma. */
  marginal: number[];
  /** Component contribution w_i * marginal_i. Sums to sigma (Euler allocation). */
  component: number[];
  /** Component as a share of total volatility. Sums to 1. */
  percent: number[];
  volatility: number;
}

/**
 * Euler risk decomposition of portfolio volatility. Because volatility is
 * homogeneous of degree one in the weights, the component contributions add
 * up exactly to the total.
 */
export function riskContributions(cov: readonly (readonly number[])[], weights: readonly number[]): RiskContribution {
  const sigmaW = matVec(cov, weights);
  const volatility = Math.sqrt(Math.max(dot(weights, sigmaW), 0));
  if (volatility === 0) {
    const zeros = weights.map(() => 0);
    return { marginal: zeros, component: zeros, percent: zeros, volatility };
  }
  const marginal = sigmaW.map((x) => x / volatility);
  const component = marginal.map((m, i) => m * weights[i]);
  return { marginal, component, percent: component.map((c) => c / volatility), volatility };
}

/** Peak-to-trough decline of the compounded path, as a positive fraction. */
export function maxDrawdown(returns: readonly number[]): number {
  let wealth = 1;
  let peak = 1;
  let worst = 0;
  for (const r of returns) {
    wealth *= 1 + r;
    if (wealth > peak) peak = wealth;
    worst = Math.max(worst, 1 - wealth / peak);
  }
  return worst;
}
