-- Repair legacy published ingredients that were incorrectly assigned to the
-- generic vegetable category. This only changes category bindings; publish
-- status and content fields remain untouched.
UPDATE "ingredients"
SET "category_id" = (
  SELECT "id" FROM "categories"
  WHERE "type" = 'INGREDIENT' AND "name" = '畜肉' AND "deleted_at" IS NULL
  ORDER BY "id" ASC
  LIMIT 1
)
WHERE "name" IN ('猪肉', '牛肉')
  AND "deleted_at" IS NULL
  AND EXISTS (
    SELECT 1 FROM "categories"
    WHERE "type" = 'INGREDIENT' AND "name" = '畜肉' AND "deleted_at" IS NULL
  );

UPDATE "ingredients"
SET "category_id" = (
  SELECT "id" FROM "categories"
  WHERE "type" = 'INGREDIENT' AND "name" = '鱼类' AND "deleted_at" IS NULL
  ORDER BY "id" ASC
  LIMIT 1
)
WHERE "name" = '鱼'
  AND "deleted_at" IS NULL
  AND EXISTS (
    SELECT 1 FROM "categories"
    WHERE "type" = 'INGREDIENT' AND "name" = '鱼类' AND "deleted_at" IS NULL
  );

UPDATE "ingredients"
SET "category_id" = (
  SELECT "id" FROM "categories"
  WHERE "type" = 'INGREDIENT' AND "name" = '谷物' AND "deleted_at" IS NULL
  ORDER BY "id" ASC
  LIMIT 1
)
WHERE "name" = '米饭'
  AND "deleted_at" IS NULL
  AND EXISTS (
    SELECT 1 FROM "categories"
    WHERE "type" = 'INGREDIENT' AND "name" = '谷物' AND "deleted_at" IS NULL
  );

UPDATE "ingredients"
SET "category_id" = (
  SELECT "id" FROM "categories"
  WHERE "type" = 'INGREDIENT' AND "name" = '面制品' AND "deleted_at" IS NULL
  ORDER BY "id" ASC
  LIMIT 1
)
WHERE "name" = '面条'
  AND "deleted_at" IS NULL
  AND EXISTS (
    SELECT 1 FROM "categories"
    WHERE "type" = 'INGREDIENT' AND "name" = '面制品' AND "deleted_at" IS NULL
  );
