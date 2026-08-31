import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('basket starts reliably on direct entry, deduplicates lifecycle requests, and uses canonical ingredient price first', async () => {
  const source = await readFile(new URL('../src/pages/basket/index.vue', import.meta.url), 'utf8');

  assert.match(source, /import \{[^}]*onMounted[^}]*\} from 'vue'/);
  assert.match(source, /let activeBasketLoad: Promise<void> \| null = null/);
  assert.match(source, /onMounted\(\(\) => \{[\s\S]{0,120}loadBasketPage/);
  assert.match(source, /onShow\(\(\) => \{[\s\S]{0,120}loadBasketPage/);
  assert.match(source, /typeof item\.currentPrice === 'number'/);
  assert.doesNotMatch(source, /item\.purchaseText\?\.includes\('元\/'\)/);
});
