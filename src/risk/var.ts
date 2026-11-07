/**
 * Value at Risk and Expected Shortfall.
 *
 * Conventions: inputs are simple returns; outputs are LOSSES expressed as
 * positive fractions of portfolio value. A 95% VaR of 0.021 means "on 95% of
 * days the loss should not exceed 2.1%". CVaR (expected shortfall) is the
 * average loss on the days that do exceed VaR, so CVaR >= VaR always.
 */
import { cholesky } from './linalg';
import { normalInv, normalPdf } from './normal';
import { createRng } from './rng';
import { quantileSorted } from './stats';

export interface RiskEstimate {
  /** Value at Risk: loss threshold not exceeded with probability `confidence`. */
  var: number;
  /** Conditional VaR / expected shortfall: mean loss beyond VaR. */
  cvar: number;
}

function assertConfidence(confidence: number) {
  if (!(confidence > 0 && confidence < 1)) throw new RangeError('confidence must be in (0, 1)');
}

/** VaR/CVaR read directly off an empirical (or simulated) return distribution. */
export function empiricalVaR(returns: readonly number[], confidence: number): RiskEstimate {
  assertConfidence(confidence);
  if (returns.length === 0) throw new RangeError('empiricalVaR needs at least one return');
  const sorted = [...returns].sort((a, b) => a - b);
  const cutoff = quantileSorted(sorted, 1 - confidence);
  let tailSum = 0;
  let tailCount = 0;
  for (const r of sorted) {
    if (r > cutoff) break;
    tailSum += r;
    tailCount++;
  }
  // With interpolation the cutoff can sit below every observation only if the
  // sample is tiny; fall back to the worst observation in that case.
  const tailMean = tailCount > 0 ? tailSum / tailCount : sorted[0];
  return { var: -cutoff, cvar: -tailMean };
}

/**
 * Historical simulation VaR: the (1 - confidence) quantile of realised
 * portfolio returns. `horizonDays > 1` uses square-root-of-time scaling,
 * the usual regulatory approximation (it ignores autocorrelation).
 */
export function historicalVaR(returns: readonly number[], confidence: number, horizonDays = 1): RiskEstimate {
  const oneDay = empiricalVaR(returns, confidence);
  const k = Math.sqrt(horizonDays);
  return { var: oneDay.var * k, cvar: oneDay.cvar * k };
}

/**
 * Parametric (variance-covariance / delta-normal) VaR assuming normally
 * distributed returns with daily mean `mu` and volatility `sigma`.
 *
 *   VaR  = -(mu_h + z * sigma_h)            z = Phi^-1(1 - c)
 *   CVaR = -(mu_h - sigma_h * phi(z) / (1 - c))
 */
export function parametricVaR(mu: number, sigma: number, confidence: number, horizonDays = 1): RiskEstimate {
  assertConfidence(confidence);
  const muH = mu * horizonDays;
  const sigmaH = sigma * Math.sqrt(horizonDays);
  const z = normalInv(1 - confidence);
  return {
    var: -(muH + z * sigmaH),
    cvar: -(muH - (sigmaH * normalPdf(z)) / (1 - confidence)),
  };
}

export interface MonteCarloOptions {
  /** Per-asset daily mean returns. */
  means: readonly number[];
  /** Daily covariance matrix of asset returns. */
  cov: readonly (readonly number[])[];
  weights: readonly number[];
  confidence: number;
  horizonDays?: number;
  simulations?: number;
  seed?: number;
}

export interface MonteCarloResult extends RiskEstimate {
  /** Simulated portfolio returns over the horizon, one per path. */
  samples: number[];
}

/**
 * Monte Carlo VaR. Draws correlated multivariate-normal asset returns as
 * x = mu + L z, where L is the Cholesky factor of the covariance matrix and
 * z is a vector of independent standard normals, then prices the portfolio
 * on each draw and reads VaR/CVaR off the simulated distribution.
 */
export function monteCarloVaR(options: MonteCarloOptions): MonteCarloResult {
  const { means, cov, weights, confidence, horizonDays = 1, simulations = 10_000, seed = 1 } = options;
  assertConfidence(confidence);
  const n = means.length;
  if (cov.length !== n || weights.length !== n) throw new RangeError('means, cov and weights must align');

  const l = cholesky(cov.map((row) => row.map((c) => c * horizonDays)));
  const muH = means.map((m) => m * horizonDays);
  const rng = createRng(seed);
  const z = new Array<number>(n);
  const samples = new Array<number>(simulations);

  for (let s = 0; s < simulations; s++) {
    for (let j = 0; j < n; j++) z[j] = rng.normal();
    let portfolio = 0;
    for (let i = 0; i < n; i++) {
      let x = muH[i];
      const li = l[i];
      for (let j = 0; j <= i; j++) x += li[j] * z[j];
      portfolio += weights[i] * x;
    }
    samples[s] = portfolio;
  }

  return { ...empiricalVaR(samples, confidence), samples };
}
