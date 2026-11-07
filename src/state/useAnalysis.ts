import { useMemo } from 'react';
import { dataset } from '../data';
import { analyzeFrontier, analyzePortfolio, correlationMatrix, type FrontierAnalysis, type PortfolioAnalysis } from '../risk';
import type { Holding, PortfolioState } from './portfolio';

const tickerIndex = new Map(dataset.assets.map((a, i) => [a.ticker, i]));

/** Correlation of the full universe; static, so computed once at load. */
export const universeCorrelation = correlationMatrix(dataset.assets.map((a) => a.returns));

export interface HeldAsset extends Holding {
  index: number;
  name: string;
  sector: string;
}

export interface RiskView {
  held: HeldAsset[];
  /** One-day analysis: drives the histogram, statement row and risk bars. */
  daily: PortfolioAnalysis;
  /** Analysis at the selected horizon (same object as `daily` when horizon is 1). */
  atHorizon: PortfolioAnalysis;
  frontier: FrontierAnalysis | null;
}

export function useAnalysis(state: PortfolioState): RiskView | null {
  const held = useMemo<HeldAsset[]>(
    () =>
      state.holdings
        .filter((h) => h.weight > 0 && tickerIndex.has(h.ticker))
        .map((h) => {
          const index = tickerIndex.get(h.ticker)!;
          const a = dataset.assets[index];
          return { ...h, index, name: a.name, sector: a.sector };
        }),
    [state.holdings],
  );

  const daily = useMemo(() => {
    if (held.length === 0) return null;
    return analyzePortfolio({
      series: held.map((h) => dataset.assets[h.index].returns),
      weights: held.map((h) => h.weight),
      benchmark: dataset.index.returns,
      confidence: state.confidence,
      horizonDays: 1,
    });
  }, [held, state.confidence]);

  const atHorizon = useMemo(() => {
    if (!daily || state.horizon === 1) return daily;
    return analyzePortfolio({
      series: held.map((h) => dataset.assets[h.index].returns),
      weights: held.map((h) => h.weight),
      benchmark: dataset.index.returns,
      confidence: state.confidence,
      horizonDays: state.horizon,
    });
  }, [daily, held, state.confidence, state.horizon]);

  const frontier = useMemo(() => {
    if (held.length < 2) return null;
    return analyzeFrontier(
      held.map((h) => dataset.assets[h.index].returns),
      held.map((h) => h.weight),
    );
  }, [held]);

  if (!daily || !atHorizon) return null;
  return { held, daily, atHorizon, frontier };
}
