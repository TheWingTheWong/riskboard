/** Small dense linear algebra for covariance matrices (n is ~15, so O(n^3) is free). */

export type Matrix = number[][];
export type Vector = number[];

export function dot(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length) throw new RangeError('dot: length mismatch');
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function matVec(m: readonly (readonly number[])[], v: readonly number[]): Vector {
  return m.map((row) => dot(row, v));
}

/** Quadratic form v' M v. */
export function quadForm(m: readonly (readonly number[])[], v: readonly number[]): number {
  return dot(v, matVec(m, v));
}

/** Extracts the sub-matrix for the given row/column indices. */
export function subMatrix(m: readonly (readonly number[])[], idx: readonly number[]): Matrix {
  return idx.map((i) => idx.map((j) => m[i][j]));
}

/**
 * Cholesky decomposition M = L L' for a symmetric positive-definite matrix.
 * Returns the lower-triangular factor L. If the matrix is only positive
 * semi-definite (e.g. a sample covariance of nearly collinear assets) a tiny
 * diagonal jitter is added and the factorisation retried.
 */
export function cholesky(m: readonly (readonly number[])[]): Matrix {
  const n = m.length;
  const scale = Math.max(...m.map((row, i) => Math.abs(row[i])), 1e-300);
  let jitter = 0;
  for (let attempt = 0; attempt < 6; attempt++) {
    const l = tryCholesky(m, jitter);
    if (l) return l;
    jitter = jitter === 0 ? scale * 1e-12 : jitter * 100;
  }
  throw new Error(`cholesky: matrix (${n}x${n}) is not positive definite`);
}

function tryCholesky(m: readonly (readonly number[])[], jitter: number): Matrix | null {
  const n = m.length;
  const l: Matrix = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    if (m[i].length !== n) throw new RangeError('cholesky: matrix must be square');
    for (let j = 0; j <= i; j++) {
      let s = m[i][j] + (i === j ? jitter : 0);
      for (let k = 0; k < j; k++) s -= l[i][k] * l[j][k];
      if (i === j) {
        if (!(s > 0)) return null;
        l[i][i] = Math.sqrt(s);
      } else {
        l[i][j] = s / l[j][j];
      }
    }
  }
  return l;
}

/** Solves M x = b given the Cholesky factor L of M (forward then back substitution). */
export function choleskySolve(l: readonly (readonly number[])[], b: readonly number[]): Vector {
  const n = l.length;
  const y = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= l[i][k] * y[k];
    y[i] = s / l[i][i];
  }
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let k = i + 1; k < n; k++) s -= l[k][i] * x[k];
    x[i] = s / l[i][i];
  }
  return x;
}

/** Solves M x = b for symmetric positive-definite M. */
export function solveSpd(m: readonly (readonly number[])[], b: readonly number[]): Vector {
  return choleskySolve(cholesky(m), b);
}
