ALTER TABLE "recipes"
  ADD COLUMN "import_quality_score" INTEGER;

ALTER TABLE "resource_import_items"
  ADD COLUMN "quality_score" INTEGER,
  ADD COLUMN "is_chinese" BOOLEAN,
  ADD COLUMN "quality_issues" JSONB;

ALTER TABLE "resource_api_providers"
  ADD COLUMN "terms_url" VARCHAR(500),
  ADD COLUMN "license_note" TEXT;

CREATE INDEX "resource_import_items_recipe_quality_idx"
  ON "resource_import_items" ("status", "is_chinese", "quality_score");
