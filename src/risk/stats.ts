/** Descriptive statistics over plain number arrays. */

export function sum(xs: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += xs[i];
  return s;
}

export function mean(xs: readonly number[]): number {
  if (xs.length === 0) throw new RangeError('mean of empty array');
  return sum(xs) / xs.length;
}

/** Sample covariance (n - 1 denominator). */
export function covariance(xs: readonly number[], ys: readonly number[]): number {
  if (xs.length !== ys.length) throw new RangeError('covariance: length mismatch');
  if (xs.length < 2) throw new RangeError('covariance needs at least two observations');
  const mx = mean(xs);
  const my = mean(ys);
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += (xs[i] - mx) * (ys[i] - my);
  return s / (xs.length - 1);
}

/** Sample variance (n - 1 denominator). */
export function variance(xs: readonly number[]): number {
  return covariance(xs, xs);
}

export function stdev(xs: readonly number[]): number {
  return Math.sqrt(variance(xs));
}

/**
 * Quantile with linear interpolation between order statistics
 * (Hyndman & Fan type 7, the default in R and NumPy).
 */
export function quantile(xs: readonly number[], p: number): number {
  if (xs.length === 0) throw new RangeError('quantile of empty array');
  if (p < 0 || p > 1) throw new RangeError('quantile p must be in [0, 1]');
  const sorted = [...xs].sort((a, b) => a - b);
  return quantileSorted(sorted, p);
}

/** Same as {@link quantile} but assumes `sorted` is ascending (avoids a re-sort). */
export function quantileSorted(sorted: readonly number[], p: number): number {
  const h = (sorted.length - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo]);
}

/** Sample covariance matrix of column series: `series[i]` is asset i's return history. */
export function covarianceMatrix(series: readonly (readonly number[])[]): number[][] {
  const n = series.length;
  const means = series.map(mean);
  const t = series[0]?.length ?? 0;
  const out: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let s = 0;
      const a = series[i];
      const b = series[j];
      for (let k = 0; k < t; k++) s += (a[k] - means[i]) * (b[k] - means[j]);
      const c = s / (t - 1);
      out[i][j] = c;
      out[j][i] = c;
    }
  }
  return out;
}

/** Converts a covariance matrix into a correlation matrix. */
export function correlationFromCovariance(cov: readonly (readonly number[])[]): number[][] {
  const sd = cov.map((row, i) => Math.sqrt(row[i]));
  return cov.map((row, i) =>
    row.map((c, j) => (i === j ? 1 : c / (sd[i] * sd[j]))),
  );
}

export function correlationMatrix(series: readonly (readonly number[])[]): number[][] {
  return correlationFromCovariance(covarianceMatrix(series));
}
