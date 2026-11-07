/**
 * Synthetic market generator.
 *
 * riskboard ships with generated, not real, return data so it runs offline
 * with no licensing questions. To make the risk numbers meaningful the
 * generator reproduces the stylised facts of daily equity returns:
 *
 *  - a common market factor with GARCH(1,1) volatility clustering,
 *  - Student-t innovations (fat tails, excess kurtosis),
 *  - a stress episode (a gap-down shock that the GARCH recursion propagates),
 *  - sector factors so stocks in the same sector co-move more,
 *  - defensive assets (a bond fund with negative equity beta, a gold trust).
 *
 * The output is fully determined by the seed, and a unit test asserts the
 * committed JSON matches `generateDataset(DEFAULT_SEED)`.
 */
import { createRng, studentT, type Rng } from '../risk/rng';
import type { AssetSeries, Dataset, Sector } from './types';

export const DEFAULT_SEED = 20260107;
export const DEFAULT_DAYS = 756; // three years of trading days
const END_DATE = '2025-12-31';

type Factor = 'tech' | 'fin' | 'energy' | 'health' | 'consumer' | 'industrial' | 'rates' | 'gold';

interface AssetSpec {
  ticker: string;
  name: string;
  sector: Sector;
  /** Loading on the market factor. */
  beta: number;
  factor: Factor;
  /** Loading on the sector/style factor. */
  loading: number;
  /** Daily idiosyncratic volatility. */
  idioVol: number;
  /** Daily drift. */
  alpha: number;
}

export const ASSET_SPECS: readonly AssetSpec[] = [
  { ticker: 'NOVA', name: 'Nova Systems', sector: 'Technology', beta: 1.25, factor: 'tech', loading: 1.0, idioVol: 0.012, alpha: 0.0004 },
  { ticker: 'QBIT', name: 'Qubit Semiconductor', sector: 'Technology', beta: 1.45, factor: 'tech', loading: 1.25, idioVol: 0.018, alpha: 0.0005 },
  { ticker: 'CLDX', name: 'Cloudex Software', sector: 'Technology', beta: 1.15, factor: 'tech', loading: 0.9, idioVol: 0.015, alpha: 0.0002 },
  { ticker: 'BKRT', name: 'Bancroft Financial', sector: 'Financials', beta: 1.1, factor: 'fin', loading: 1.0, idioVol: 0.01, alpha: 0.0001 },
  { ticker: 'ASRX', name: 'Assurex Insurance', sector: 'Financials', beta: 0.8, factor: 'fin', loading: 0.7, idioVol: 0.008, alpha: 0.00015 },
  { ticker: 'PTRL', name: 'Petralis Energy', sector: 'Energy', beta: 0.9, factor: 'energy', loading: 1.2, idioVol: 0.014, alpha: 0.0001 },
  { ticker: 'WNDG', name: 'Windgate Renewables', sector: 'Energy', beta: 1.2, factor: 'energy', loading: 0.6, idioVol: 0.021, alpha: -0.0001 },
  { ticker: 'HELX', name: 'Helix Therapeutics', sector: 'Healthcare', beta: 0.9, factor: 'health', loading: 1.0, idioVol: 0.022, alpha: 0.0002 },
  { ticker: 'MDCO', name: 'Medico Health', sector: 'Healthcare', beta: 0.65, factor: 'health', loading: 0.8, idioVol: 0.008, alpha: 0.0002 },
  { ticker: 'RTLX', name: 'Retailix', sector: 'Consumer', beta: 1.0, factor: 'consumer', loading: 1.0, idioVol: 0.013, alpha: 0.0001 },
  { ticker: 'BRWX', name: 'Brewster Brands', sector: 'Consumer', beta: 0.55, factor: 'consumer', loading: 0.7, idioVol: 0.007, alpha: 0.00015 },
  { ticker: 'FRGE', name: 'Forge Industrial', sector: 'Industrials', beta: 1.05, factor: 'industrial', loading: 1.0, idioVol: 0.011, alpha: 0.0002 },
  { ticker: 'ARCO', name: 'Arcadia Aerospace', sector: 'Industrials', beta: 1.2, factor: 'industrial', loading: 1.1, idioVol: 0.015, alpha: 0.00025 },
  { ticker: 'TBND', name: 'Long Treasury Bond Fund', sector: 'Fixed Income', beta: -0.15, factor: 'rates', loading: 1.0, idioVol: 0.001, alpha: 0.00005 },
  { ticker: 'GLDX', name: 'Gold Bullion Trust', sector: 'Commodities', beta: 0.05, factor: 'gold', loading: 1.0, idioVol: 0.001, alpha: 0.0002 },
];

const FACTOR_VOL: Record<Factor, number> = {
  tech: 0.0065,
  fin: 0.006,
  energy: 0.009,
  health: 0.005,
  consumer: 0.005,
  industrial: 0.005,
  rates: 0.0055,
  gold: 0.009,
};

// `|| 0` folds -0 into 0 so generated data matches its JSON round-trip.
const round6 = (x: number) => Math.round(x * 1e6) / 1e6 || 0;

/** Weekday ISO dates ending at `end` (inclusive), ascending. */
export function businessDays(end: string, count: number): string[] {
  const out: string[] = [];
  const d = new Date(`${end}T00:00:00Z`);
  while (out.length < count) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return out.reverse();
}

/** Market factor: GARCH(1,1) with t(5) shocks plus a one-off stress gap. */
function simulateMarket(rng: Rng, days: number): number[] {
  const longRunVol = 0.0095;
  const drift = 0.0005;
  const alpha = 0.09;
  const beta = 0.89;
  const omega = longRunVol ** 2 * (1 - alpha - beta);
  const stressDay = Math.floor(days * 0.62);

  const out: number[] = [];
  let sigma2 = longRunVol ** 2;
  let prevShock = 0;
  for (let t = 0; t < days; t++) {
    sigma2 = omega + alpha * prevShock ** 2 + beta * sigma2;
    let shock = Math.sqrt(sigma2) * studentT(rng, 5);
    if (t === stressDay) shock = -0.068; // gap-down; GARCH carries the aftershock
    if (t === stressDay + 1) shock -= 0.025;
    out.push(drift + shock);
    prevShock = shock;
  }
  return out;
}

export function generateDataset(seed = DEFAULT_SEED, days = DEFAULT_DAYS): Dataset {
  const rng = createRng(seed);
  const market = simulateMarket(rng, days);

  const factors = Object.fromEntries(
    (Object.keys(FACTOR_VOL) as Factor[]).map((f) => [
      f,
      Array.from({ length: days }, () => FACTOR_VOL[f] * studentT(rng, 6)),
    ]),
  ) as Record<Factor, number[]>;

  const assets: AssetSeries[] = ASSET_SPECS.map((spec) => ({
    ticker: spec.ticker,
    name: spec.name,
    sector: spec.sector,
    returns: market.map((m, t) =>
      round6(
        spec.alpha +
          spec.beta * m +
          spec.loading * factors[spec.factor][t] +
          spec.idioVol * studentT(rng, 5),
      ),
    ),
  }));

  return {
    synthetic: true,
    seed,
    description:
      'SYNTHETIC daily returns from a seeded factor model (GARCH market factor, sector factors, ' +
      'Student-t shocks). Tickers and company names are fictional. Not real market data.',
    dates: businessDays(END_DATE, days),
    index: {
      ticker: 'RBX',
      name: 'Riskboard Composite Index',
      returns: market.map((m) => round6(m + 0.0008 * rng.normal())),
    },
    assets,
  };
}
