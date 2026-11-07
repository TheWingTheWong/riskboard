const moneyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const compactFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });

/** 0.02346 -> "2.35%". Uses a true minus sign so columns of figures align. */
export function pct(x: number, digits = 2): string {
  if (!Number.isFinite(x)) return '–';
  const s = (x * 100).toFixed(digits);
  return `${s.replace('-', '−')}%`;
}

/** Signed percent: "+1.20%" / "−0.40%". */
export function signedPct(x: number, digits = 2): string {
  if (!Number.isFinite(x)) return '–';
  return `${x > 0 ? '+' : ''}${pct(x, digits)}`;
}

export function money(x: number): string {
  return Number.isFinite(x) ? moneyFmt.format(x).replace('-', '−') : '–';
}

export function compactMoney(x: number): string {
  return Number.isFinite(x) ? compactFmt.format(x).replace('-', '−') : '–';
}

export function num(x: number, digits = 2): string {
  return Number.isFinite(x) ? x.toFixed(digits).replace('-', '−') : '–';
}
