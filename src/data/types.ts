export type Sector =
  | 'Technology'
  | 'Financials'
  | 'Energy'
  | 'Healthcare'
  | 'Consumer'
  | 'Industrials'
  | 'Fixed Income'
  | 'Commodities';

export interface AssetSeries {
  ticker: string;
  name: string;
  sector: Sector;
  /** Daily simple returns aligned with {@link Dataset.dates}. */
  returns: number[];
}

export interface Dataset {
  /** Always true: riskboard ships generated data, never real market prices. */
  synthetic: true;
  seed: number;
  description: string;
  /** ISO dates (YYYY-MM-DD), one per trading day, ascending. */
  dates: string[];
  /** Benchmark used for beta. */
  index: Omit<AssetSeries, 'sector'>;
  assets: AssetSeries[];
}
