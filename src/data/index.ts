import raw from './returns.json';
import type { Dataset } from './types';

/** The bundled synthetic dataset (see `src/data/generate.ts`). */
export const dataset = raw as Dataset;

export type { AssetSeries, Dataset, Sector } from './types';
