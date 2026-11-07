/**
 * Seeded pseudo-random number generation.
 *
 * Everything stochastic in riskboard (synthetic data, Monte Carlo VaR, random
 * frontier portfolios) runs off this module so results are reproducible for a
 * given seed: the same portfolio always shows the same Monte Carlo VaR.
 */

export interface Rng {
  /** Uniform draw in [0, 1). */
  next(): number;
  /** Standard normal draw N(0, 1). */
  normal(): number;
}

/** mulberry32: tiny, fast, 32-bit state, good enough statistical quality for simulation. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Creates a seeded RNG with uniform and (Marsaglia polar) normal draws. */
export function createRng(seed: number): Rng {
  const uniform = mulberry32(seed);
  let spare: number | null = null;

  return {
    next: uniform,
    normal() {
      if (spare !== null) {
        const s = spare;
        spare = null;
        return s;
      }
      let u = 0;
      let v = 0;
      let s = 0;
      do {
        u = uniform() * 2 - 1;
        v = uniform() * 2 - 1;
        s = u * u + v * v;
      } while (s >= 1 || s === 0);
      const m = Math.sqrt((-2 * Math.log(s)) / s);
      spare = v * m;
      return u * m;
    },
  };
}

/**
 * Student-t draw rescaled to unit variance (requires dof > 2). Used to give
 * synthetic returns realistically fat tails.
 */
export function studentT(rng: Rng, dof: number): number {
  if (dof <= 2) throw new RangeError('studentT requires dof > 2 for finite variance');
  let chi2 = 0;
  for (let i = 0; i < dof; i++) {
    const z = rng.normal();
    chi2 += z * z;
  }
  const t = rng.normal() / Math.sqrt(chi2 / dof);
  return t * Math.sqrt((dof - 2) / dof);
}
