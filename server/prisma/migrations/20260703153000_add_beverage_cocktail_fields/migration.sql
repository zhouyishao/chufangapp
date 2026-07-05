ALTER TABLE "beverages"
  ADD COLUMN IF NOT EXISTS "drink_type" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "cocktail_method" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "base_spirit" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "glass_type" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "alcoholic_type" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "ingredients" JSONB,
  ADD COLUMN IF NOT EXISTS "measures" JSONB,
  ADD COLUMN IF NOT EXISTS "garnish" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "instructions" TEXT,
  ADD COLUMN IF NOT EXISTS "flavor_tags" JSONB,
  ADD COLUMN IF NOT EXISTS "scene_tags" JSONB,
  ADD COLUMN IF NOT EXISTS "source_name" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "source_external_id" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "raw_json" JSONB;

CREATE INDEX IF NOT EXISTS "beverages_source_name_source_external_id_idx"
  ON "beverages"("source_name", "source_external_id");
