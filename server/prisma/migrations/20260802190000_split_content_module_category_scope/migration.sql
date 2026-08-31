ALTER TABLE "content_modules"
ADD COLUMN "source_category_id" INTEGER;

UPDATE "content_modules"
SET "source_category_id" = "category_id"
WHERE "content_source" IN ('CATEGORY', 'CATEGORY_CONTENT')
  AND "category_id" IS NOT NULL;

CREATE INDEX "content_modules_source_category_id_idx"
ON "content_modules"("source_category_id");
