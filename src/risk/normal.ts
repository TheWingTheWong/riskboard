/** Standard normal distribution helpers. */

const SQRT_2PI = Math.sqrt(2 * Math.PI);

/** Standard normal density. */
export function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / SQRT_2PI;
}

/**
 * Standard normal CDF, Hart (1968) double-precision algorithm as published by
 * Graeme West, "Better approximations to cumulative normal functions" (2005).
 * Absolute error is ~1e-14, accurate enough to polish {@link normalInv}.
 */
export function normalCdf(x: number): number {
  const z = Math.abs(x);
  let tail: number;
  if (z > 37) {
    tail = 0;
  } else {
    const e = Math.exp((-z * z) / 2);
    if (z < 7.07106781186547) {
      let num = 3.52624965998911e-2 * z + 0.700383064443688;
      num = num * z + 6.37396220353165;
      num = num * z + 33.912866078383;
      num = num * z + 112.079291497871;
      num = num * z + 221.213596169931;
      num = num * z + 220.206867912376;
      let den = 8.83883476483184e-2 * z + 1.75566716318264;
      den = den * z + 16.064177579207;
      den = den * z + 86.7807322029461;
      den = den * z + 296.564248779674;
      den = den * z + 637.333633378831;
      den = den * z + 793.826512519948;
      den = den * z + 440.413735824752;
      tail = (e * num) / den;
    } else {
      let b = z + 0.65;
      b = z + 4 / b;
      b = z + 3 / b;
      b = z + 2 / b;
      b = z + 1 / b;
      tail = e / b / SQRT_2PI;
    }
  }
  return x > 0 ? 1 - tail : tail;
}

/**
 * Inverse standard normal CDF (quantile function), Peter Acklam's algorithm
 * with one Halley refinement step. Relative error ~1e-15 after refinement.
 */
export function normalInv(p: number): number {
  if (!(p > 0 && p < 1)) {
    if (p === 0) return -Infinity;
    if (p === 1) return Infinity;
    throw new RangeError('normalInv p must be in (0, 1)');
  }
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425;

  let x: number;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pLow) {
    const q = p - 0.5;
    const r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  // Halley step against the CDF tightens the approximation.
  const e = normalCdf(x) - p;
  const u = e * SQRT_2PI * Math.exp((x * x) / 2);
  return x - u / (1 + (x * u) / 2);
}
