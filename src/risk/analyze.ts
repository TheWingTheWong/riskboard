/**
 * One-call portfolio analysis used by the UI. Pure: same inputs, same output.
 */
import { efficientFrontier, minVariancePortfolio, randomPortfolios, type FrontierPoint, type PortfolioPoint } from './frontier';
import { dot } from './linalg';
import { beta, maxDrawdown, normalizeWeights, portfolioReturns, riskContributions, TRADING_DAYS, type RiskContribution } from './portfolio';
import { covarianceMatrix, mean, stdev } from './stats';
import { historicalVaR, monteCarloVaR, parametricVaR, type RiskEstimate } from './var';

export interface AnalysisInput {
  /** Return histories of the held assets, one array per asset. */
  series: readonly (readonly number[])[];
  /** Raw weights (any positive scale); normalised internally. */
  weights: readonly number[];
  benchmark: readonly number[];
  confidence: number;
  horizonDays?: number;
  simulations?: number;
  seed?: number;
}

export interface PortfolioAnalysis {
  weights: number[];
  /** Daily portfolio returns. */
  returns: number[];
  dailyMean: number;
  dailyVolatility: number;
  annualReturn: number;
  annualVolatility: number;
  /** Annual return / annual volatility (risk-free rate taken as 0). */
  sharpe: number;
  beta: number;
  maxDrawdown: number;
  historical: RiskEstimate;
  parametric: RiskEstimate;
  monteCarlo: RiskEstimate & { samples: number[] };
  /** Euler decomposition of DAILY volatility. */
  risk: RiskContribution;
}

export function analyzePortfolio(input: AnalysisInput): PortfolioAnalysis {
  const { series, benchmark, confidence, horizonDays = 1, simulations = 10_000, seed = 1 } = input;
  const weights = normalizeWeights(input.weights);
  const returns = portfolioReturns(series, weights);
  const cov = covarianceMatrix(series);
  const means = series.map(mean);
  const dailyMean = mean(returns);
  const dailyVolatility = stdev(returns);
  const annualVolatility = dailyVolatility * Math.sqrt(TRADING_DAYS);
  const annualReturn = dailyMean * TRADING_DAYS;

  return {
    weights,
    returns,
    dailyMean,
    dailyVolatility,
    annualReturn,
    annualVolatility,
    sharpe: annualVolatility > 0 ? annualReturn / annualVolatility : 0,
    beta: beta(returns, benchmark),
    maxDrawdown: maxDrawdown(returns),
    historical: historicalVaR(returns, confidence, horizonDays),
    parametric: parametricVaR(dailyMean, dailyVolatility, confidence, horizonDays),
    monteCarlo: monteCarloVaR({ means, cov, weights, confidence, horizonDays, simulations, seed }),
    risk: riskContributions(cov, weights),
  };
}

export interface FrontierAnalysis {
  cloud: PortfolioPoint[];
  curve: FrontierPoint[];
  minVariance: PortfolioPoint;
  current: FrontierPoint;
  /** Each asset on its own (100% weight). */
  assets: FrontierPoint[];
}

/** Annualised mean-variance picture for the held assets. */
export function analyzeFrontier(
  series: readonly (readonly number[])[],
  rawWeights: readonly number[],
  { count = 2500, seed = 7 }: { count?: number; seed?: number } = {},
): FrontierAnalysis {
  const weights = normalizeWeights(rawWeights);
  const means = series.map((s) => mean(s) * TRADING_DAYS);
  const cov = covarianceMatrix(series).map((row) => row.map((c) => c * TRADING_DAYS));
  const assets = means.map((ret, i) => ({ ret, vol: Math.sqrt(cov[i][i]) }));
  const maxReturn = Math.max(...means) * 1.1 + 0.02;
  const currentVol = Math.sqrt(Math.max(dot(weights, cov.map((row) => dot(row, weights))), 0));

  return {
    cloud: randomPortfolios(means, cov, count, { seed }),
    curve: efficientFrontier(means, cov, maxReturn),
    minVariance: minVariancePortfolio(means, cov),
    current: { ret: dot(weights, means), vol: currentVol },
    assets,
  };
}
