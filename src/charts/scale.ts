/** Minimal scale helpers for the hand-written SVG charts. */

export interface LinearScale {
  (x: number): number;
  domain: [number, number];
  range: [number, number];
  ticks(count?: number): number[];
}

export function linearScale(domain: [number, number], range: [number, number]): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  const scale = ((x: number) => r0 + ((x - d0) / span) * (r1 - r0)) as LinearScale;
  scale.domain = domain;
  scale.range = range;
  scale.ticks = (count = 5) => niceTicks(d0, d1, count);
  return scale;
}

/** Step of 1, 2 or 5 x 10^k that gives roughly `count` intervals over [lo, hi]. */
export function niceStep(lo: number, hi: number, count: number): number {
  const raw = Math.abs(hi - lo) / Math.max(count, 1);
  if (raw === 0 || !Number.isFinite(raw)) return 1;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const nice = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return nice * mag;
}

/** Tick values on a nice step that fall inside [lo, hi]. */
export function niceTicks(lo: number, hi: number, count = 5): number[] {
  const step = niceStep(lo, hi, count);
  const start = Math.ceil(lo / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toPrecision(12));
  return out;
}

/** Expands [lo, hi] outward to the nearest nice step. */
export function niceDomain(lo: number, hi: number, count = 5): [number, number] {
  const step = niceStep(lo, hi, count);
  return [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
}

export interface Bin {
  x0: number;
  x1: number;
  count: number;
}

/** Equal-width histogram over [lo, hi]; values outside are clamped into the edge bins. */
export function histogram(values: readonly number[], bins: number, lo: number, hi: number): Bin[] {
  const width = (hi - lo) / bins;
  const out: Bin[] = Array.from({ length: bins }, (_, i) => ({ x0: lo + i * width, x1: lo + (i + 1) * width, count: 0 }));
  for (const v of values) {
    const i = Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / width)));
    out[i].count++;
  }
  return out;
}
