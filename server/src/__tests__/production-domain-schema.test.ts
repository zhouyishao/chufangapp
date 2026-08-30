import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const schema = readFileSync(resolve(__dirname, '../../prisma/schema.prisma'), 'utf8');
const migration = readFileSync(
  resolve(__dirname, '../../prisma/migrations/20260718220000_production_domain_foundation/migration.sql'),
  'utf8'
);

test('production domain schema contains the release-critical explicit models', () => {
  for (const model of [
    'UserPreference',
    'PurchaseBatch',
    'Notification',
    'NotificationReceipt',
    'FamilyEvent',
    'BeverageIngredient',
    'BeverageTool',
    'BeverageStep',
    'FileReference'
  ]) {
    assert.match(schema, new RegExp(`model\\s+${model}\\s+\\{`), `missing ${model}`);
  }
});

test('favorites and histories have a stable five-type target identity', () => {
  assert.match(schema, /enum\s+ContentType\s+\{[\s\S]*RECIPE[\s\S]*INGREDIENT[\s\S]*FRUIT[\s\S]*BEVERAGE[\s\S]*SEASONING[\s\S]*\}/);
  for (const model of ['Favorite', 'ViewHistory']) {
    const start = schema.indexOf(`model ${model} {`);
    const end = schema.indexOf('\n}', start);
    const block = schema.slice(start, end);
    assert.match(block, /targetType\s+ContentType/);
    assert.match(block, /targetId\s+String/);
    assert.match(block, /@@index\(\[userId, targetType, targetId, deletedAt\]/);
  }
  assert.match(migration, /CREATE UNIQUE INDEX "favorites_target_active_unique"[\s\S]*WHERE "deleted_at" IS NULL/);
  assert.match(migration, /CREATE UNIQUE INDEX "view_histories_target_active_unique"[\s\S]*WHERE "deleted_at" IS NULL/);
});

test('guided steps support media, timers, tips and stable ordering', () => {
  const recipeStep = schema.slice(schema.indexOf('model RecipeStep {'), schema.indexOf('\n}', schema.indexOf('model RecipeStep {')));
  assert.match(recipeStep, /mediaFileId\s+Int\?/);
  assert.match(recipeStep, /timerSeconds\s+Int\?/);
  assert.match(recipeStep, /tip\s+String\?/);
  assert.match(recipeStep, /@@unique\(\[recipeId, sortIndex\]\)/);
});

test('polymorphic target migration adds nullable fields, backfills, validates, then locks', () => {
  const addPosition = migration.indexOf('ADD COLUMN "target_id" VARCHAR(64)');
  const backfillPosition = migration.indexOf('UPDATE "favorites"');
  const guardPosition = migration.indexOf("favorites contain rows without a supported target");
  const lockPosition = migration.indexOf('ALTER COLUMN "target_id" SET NOT NULL');
  assert.ok(addPosition >= 0 && backfillPosition > addPosition);
  assert.ok(guardPosition > backfillPosition && lockPosition > guardPosition);
  assert.doesNotMatch(migration, /DROP\s+(TABLE|COLUMN)/i);
});
