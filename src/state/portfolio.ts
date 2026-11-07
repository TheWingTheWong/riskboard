/** Portfolio editor state: holdings, presets, and URL-hash persistence. */

export interface Holding {
  ticker: string;
  /** Weight in percent (0-100). Totals other than 100 are rescaled for analysis. */
  weight: number;
}

export type Confidence = 0.9 | 0.95 | 0.99;
export const CONFIDENCE_LEVELS: readonly Confidence[] = [0.9, 0.95, 0.99];
export type Horizon = 1 | 10;

export interface PortfolioState {
  holdings: Holding[];
  confidence: Confidence;
  horizon: Horizon;
  /** Portfolio value in USD, used to express VaR as money. */
  notional: number;
}

export interface Preset {
  id: string;
  label: string;
  holdings: Holding[];
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    holdings: [
      { ticker: 'NOVA', weight: 10 },
      { ticker: 'BKRT', weight: 8 },
      { ticker: 'PTRL', weight: 6 },
      { ticker: 'MDCO', weight: 8 },
      { ticker: 'RTLX', weight: 7 },
      { ticker: 'BRWX', weight: 8 },
      { ticker: 'FRGE', weight: 8 },
      { ticker: 'TBND', weight: 30 },
      { ticker: 'GLDX', weight: 15 },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    holdings: [
      { ticker: 'NOVA', weight: 20 },
      { ticker: 'QBIT', weight: 15 },
      { ticker: 'CLDX', weight: 15 },
      { ticker: 'ARCO', weight: 10 },
      { ticker: 'RTLX', weight: 10 },
      { ticker: 'WNDG', weight: 10 },
      { ticker: 'HELX', weight: 10 },
      { ticker: 'FRGE', weight: 10 },
    ],
  },
  {
    id: 'defensive',
    label: 'Defensive',
    holdings: [
      { ticker: 'MDCO', weight: 15 },
      { ticker: 'BRWX', weight: 15 },
      { ticker: 'ASRX', weight: 10 },
      { ticker: 'TBND', weight: 40 },
      { ticker: 'GLDX', weight: 20 },
    ],
  },
];

export function equalWeight(tickers: readonly string[]): Holding[] {
  const w = Math.round((100 / tickers.length) * 100) / 100;
  return tickers.map((ticker) => ({ ticker, weight: w }));
}

export const DEFAULT_STATE: PortfolioState = {
  holdings: PRESETS[0].holdings,
  confidence: 0.95,
  horizon: 1,
  notional: 1_000_000,
};

export function totalWeight(holdings: readonly Holding[]): number {
  return holdings.reduce((s, h) => s + h.weight, 0);
}

/** Rescales weights to sum to exactly 100 (to 2 dp, remainder on the largest). */
export function rescaleTo100(holdings: readonly Holding[]): Holding[] {
  const total = totalWeight(holdings);
  if (!(total > 0)) return holdings.map((h) => ({ ...h }));
  const scaled = holdings.map((h) => ({ ...h, weight: Math.round((h.weight / total) * 10000) / 100 }));
  const drift = Math.round((100 - totalWeight(scaled)) * 100) / 100;
  if (drift !== 0) {
    const largest = scaled.reduce((best, h, i) => (h.weight > scaled[best].weight ? i : best), 0);
    scaled[largest].weight = Math.round((scaled[largest].weight + drift) * 100) / 100;
  }
  return scaled;
}

/** Serialises state into a URL hash such as `#p=NOVA:10,TBND:30&c=95&h=1&v=1000000`. */
export function encodeState(state: PortfolioState): string {
  const p = state.holdings.map((h) => `${h.ticker}:${+h.weight.toFixed(2)}`).join(',');
  return `#p=${p}&c=${Math.round(state.confidence * 100)}&h=${state.horizon}&v=${Math.round(state.notional)}`;
}

/**
 * Parses a URL hash back into state. Unknown tickers, duplicates, bad
 * numbers and unsupported confidence/horizon values fall back to defaults,
 * so a hand-edited or stale link never breaks the page.
 */
export function decodeState(hash: string, knownTickers: ReadonlySet<string>): PortfolioState {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const seen = new Set<string>();
  const holdings: Holding[] = [];
  for (const part of (params.get('p') ?? '').split(',')) {
    const [ticker, raw] = part.split(':');
    const weight = Number(raw);
    if (!ticker || !knownTickers.has(ticker) || seen.has(ticker)) continue;
    if (!Number.isFinite(weight) || weight < 0 || weight > 100) continue;
    seen.add(ticker);
    holdings.push({ ticker, weight });
  }
  const c = Number(params.get('c')) / 100;
  const h = Number(params.get('h'));
  const v = Number(params.get('v'));
  return {
    holdings: holdings.length > 0 ? holdings : DEFAULT_STATE.holdings,
    confidence: (CONFIDENCE_LEVELS as readonly number[]).includes(c) ? (c as Confidence) : DEFAULT_STATE.confidence,
    horizon: h === 10 ? 10 : 1,
    notional: Number.isFinite(v) && v > 0 && v <= 1e12 ? v : DEFAULT_STATE.notional,
  };
}

/**
 * Short, stable identifier for a set of holdings, printed in the masthead like
 * a note's serial number. FNV-1a over the canonical holding list.
 */
export function portfolioSerial(holdings: readonly Holding[]): string {
  const canonical = [...holdings]
    .filter((h) => h.weight > 0)
    .sort((a, b) => a.ticker.localeCompare(b.ticker))
    .map((h) => `${h.ticker}:${h.weight.toFixed(2)}`)
    .join('|');
  let hash = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const hex = hash.toString(16).toUpperCase().padStart(8, '0');
  return `RB ${hex.slice(0, 4)} ${hex.slice(4)}`;
}
