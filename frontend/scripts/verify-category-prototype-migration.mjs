import { readFileSync } from 'node:fs';

const pagePath = new URL('../src/pages/ingredients/index.vue', import.meta.url);
const source = readFileSync(pagePath, 'utf8');

const assertions = [
  ['uses the frozen category shell', source.includes('category-prototype')],
  ['keeps the five primary categories', source.includes('category-primary-nav')],
  ['uses a left secondary rail', source.includes('category-secondary-rail')],
  ['uses a dedicated content pane', source.includes('category-content-pane')],
  ['uses square card media', source.includes('aspect-ratio: 1')],
  ['does not use the old generic module renderer', !source.includes('HomeModuleRenderer')],
  ['does not use the old horizontal filter chips', !source.includes('category-filter__chip')]
];

const failures = assertions.filter(([, passed]) => !passed);

if (failures.length) {
  for (const [message] of failures) {
    console.error(`category prototype migration check failed: ${message}`);
  }
  process.exit(1);
}

console.log('category prototype migration checks passed');
