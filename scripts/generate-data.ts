/**
 * Regenerates the bundled synthetic dataset.
 *
 *   npm run generate:data            # default seed
 *   npm run generate:data -- 12345   # custom seed (the data test will then fail until reverted)
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SEED, generateDataset } from '../src/data/generate';

const seed = process.argv[2] ? Number(process.argv[2]) : DEFAULT_SEED;
if (!Number.isInteger(seed)) throw new Error(`seed must be an integer, got ${process.argv[2]}`);

const dataset = generateDataset(seed);
const target = fileURLToPath(new URL('../src/data/returns.json', import.meta.url));
writeFileSync(target, JSON.stringify(dataset) + '\n');

const annualVol = (r: number[]) => {
  const m = r.reduce((a, b) => a + b, 0) / r.length;
  return Math.sqrt((r.reduce((a, b) => a + (b - m) ** 2, 0) / (r.length - 1)) * 252);
};
console.log(`wrote ${dataset.assets.length} assets x ${dataset.dates.length} days (seed ${seed}) -> ${target}`);
for (const a of [dataset.index, ...dataset.assets]) {
  const total = a.returns.reduce((acc, r) => acc * (1 + r), 1) - 1;
  console.log(`  ${a.ticker.padEnd(5)} vol ${(annualVol(a.returns) * 100).toFixed(1).padStart(5)}%  total ${(total * 100).toFixed(1).padStart(6)}%`);
}
