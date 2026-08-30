import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const ingredientsSource = await readFile(new URL('./IngredientsPage.tsx', import.meta.url), 'utf8');
const recipesSource = await readFile(new URL('./RecipesPage.tsx', import.meta.url), 'utf8');
const beveragesSource = await readFile(new URL('./BeveragesPage.tsx', import.meta.url), 'utf8');

test('paginated content searches return to the first page before applying a new query', () => {
  assert.match(
    ingredientsSource,
    /<Input value=\{q\} onChange=\{\(e\) => \{ setPage\(1\); setQ\(e\.target\.value\); \}\}/
  );
  assert.match(
    recipesSource,
    /<Input value=\{q\} onChange=\{\(e\) => \{ setPage\(1\); setQ\(e\.target\.value\); \}\}/
  );
});

test('all content modules pass the trimmed search term to their list endpoint', () => {
  assert.match(ingredientsSource, /q: q\.trim\(\) \|\| undefined/);
  assert.match(recipesSource, /q: q\.trim\(\) \|\| undefined/);
  assert.match(beveragesSource, /q: q\.trim\(\) \|\| undefined/);
});
