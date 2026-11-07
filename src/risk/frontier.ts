/**
 * Mean-variance analysis (Markowitz). All inputs here are ANNUALISED:
 * `means` are expected annual returns, `cov` is the annual covariance matrix.
 */
import { dot, cholesky, choleskySolve } from './linalg';
import { portfolioVolatility } from './portfolio';
import { createRng } from './rng';

export interface FrontierPoint {
  ret: number;
  vol: number;
}

export interface PortfolioPoint extends FrontierPoint {
  weights: number[];
  /** (ret - riskFree) / vol */
  sharpe: number;
}

function point(weights: number[], means: readonly number[], cov: readonly (readonly number[])[], riskFree: number): PortfolioPoint {
  const ret = dot(weights, means);
  const vol = portfolioVolatility(cov, weights);
  return { weights, ret, vol, sharpe: vol > 0 ? (ret - riskFree) / vol : 0 };
}

/**
 * Long-only random portfolios for the feasible-set cloud. Weights are drawn
 * from a Dirichlet distribution; half the draws use a concentration < 1 so the
 * cloud reaches into concentrated corners, not just the equal-weight middle.
 */
export function randomPortfolios(
  means: readonly number[],
  cov: readonly (readonly number[])[],
  count: number,
  { seed = 7, riskFree = 0 }: { seed?: number; riskFree?: number } = {},
): PortfolioPoint[] {
  const rng = createRng(seed);
  const n = means.length;
  const out: PortfolioPoint[] = [];
  for (let k = 0; k < count; k++) {
    const sparse = k % 2 === 1;
    const raw = Array.from({ length: n }, () => {
      const g = -Math.log(1 - rng.next()); // Gamma(1) = Exp(1)
      return sparse ? g ** 3 : g; // cubing pushes mass towards a few names
    });
    const total = raw.reduce((a, b) => a + b, 0);
    out.push(point(raw.map((x) => x / total), means, cov, riskFree));
  }
  return out;
}

/** Closed-form scalars of the unconstrained frontier (Merton, 1972). */
export interface FrontierCoefficients {
  /** 1' Σ^-1 1 */
  a: number;
  /** 1' Σ^-1 mu */
  b: number;
  /** mu' Σ^-1 mu */
  c: number;
  /** a c - b^2 */
  d: number;
  invOnes: number[];
  invMu: number[];
}

export function frontierCoefficients(means: readonly number[], cov: readonly (readonly number[])[]): FrontierCoefficients {
  const l = cholesky(cov);
  const ones = means.map(() => 1);
  const invOnes = choleskySolve(l, ones);
  const invMu = choleskySolve(l, means);
  const a = dot(ones, invOnes);
  const b = dot(ones, invMu);
  const c = dot(means as number[], invMu);
  return { a, b, c, d: a * c - b * b, invOnes, invMu };
}

/** Global minimum-variance portfolio w = Σ^-1 1 / (1' Σ^-1 1). Short positions allowed. */
export function minVariancePortfolio(
  means: readonly number[],
  cov: readonly (readonly number[])[],
  riskFree = 0,
): PortfolioPoint {
  const { a, invOnes } = frontierCoefficients(means, cov);
  return point(invOnes.map((x) => x / a), means, cov, riskFree);
}

/** Frontier portfolio with target return `target` (fully invested, shorts allowed). */
export function frontierPortfolio(
  means: readonly number[],
  cov: readonly (readonly number[])[],
  target: number,
  riskFree = 0,
): PortfolioPoint {
  const { a, b, c, d, invOnes, invMu } = frontierCoefficients(means, cov);
  const lambda = (c - b * target) / d;
  const gamma = (a * target - b) / d;
  return point(invOnes.map((x, i) => lambda * x + gamma * invMu[i]), means, cov, riskFree);
}

/**
 * Efficient (upper) branch of the analytic frontier hyperbola,
 * sigma^2(mu) = (a mu^2 - 2 b mu + c) / d, sampled from the minimum-variance
 * return up to `maxReturn`.
 */
export function efficientFrontier(
  means: readonly number[],
  cov: readonly (readonly number[])[],
  maxReturn: number,
  points = 60,
): FrontierPoint[] {
  const { a, b, c, d } = frontierCoefficients(means, cov);
  const muMin = b / a;
  if (!(d > 0) || maxReturn <= muMin) return [{ ret: muMin, vol: Math.sqrt(1 / a) }];
  const out: FrontierPoint[] = [];
  for (let k = 0; k < points; k++) {
    const mu = muMin + ((maxReturn - muMin) * k) / (points - 1);
    out.push({ ret: mu, vol: Math.sqrt(Math.max((a * mu * mu - 2 * b * mu + c) / d, 0)) });
  }
  return out;
}
