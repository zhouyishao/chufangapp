BEGIN;

-- Additive media identity fields. Legacy URL columns remain readable during migration.
ALTER TABLE "ingredients"
  ADD COLUMN "cover_file_id" INTEGER,
  ADD COLUMN "detail_image_file_ids" JSONB,
  ADD COLUMN "selection_media_file_id" INTEGER;

ALTER TABLE "recipes"
  ADD COLUMN "cover_file_id" INTEGER,
  ADD COLUMN "image_file_ids" JSONB,
  ADD COLUMN "video_file_id" INTEGER;

ALTER TABLE "beverages"
  ADD COLUMN "cover_file_id" INTEGER,
  ADD COLUMN "gallery_file_ids" JSONB,
  ADD COLUMN "video_file_id" INTEGER;

ALTER TABLE "ingredients"
  ADD CONSTRAINT "ingredients_cover_file_id_fkey"
  FOREIGN KEY ("cover_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ingredients_selection_media_file_id_fkey"
  FOREIGN KEY ("selection_media_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "recipes"
  ADD CONSTRAINT "recipes_cover_file_id_fkey"
  FOREIGN KEY ("cover_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "recipes_video_file_id_fkey"
  FOREIGN KEY ("video_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "beverages"
  ADD CONSTRAINT "beverages_cover_file_id_fkey"
  FOREIGN KEY ("cover_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "beverages_video_file_id_fkey"
  FOREIGN KEY ("video_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill only exact matches to known active files. External or historical URLs remain
-- available through the legacy columns and can be migrated explicitly later.
UPDATE "ingredients" AS item
SET "cover_file_id" = file."id"
FROM "files" AS file
WHERE item."cover_file_id" IS NULL
  AND item."cover" IS NOT NULL
  AND file."url" = item."cover"
  AND file."deleted_at" IS NULL
  AND file."status" = 'ACTIVE';

UPDATE "ingredients" AS item
SET "selection_media_file_id" = file."id"
FROM "files" AS file
WHERE item."selection_media_file_id" IS NULL
  AND item."selection_media" IS NOT NULL
  AND file."url" = item."selection_media"
  AND file."deleted_at" IS NULL
  AND file."status" = 'ACTIVE';

UPDATE "recipes" AS item
SET "cover_file_id" = file."id"
FROM "files" AS file
WHERE item."cover_file_id" IS NULL
  AND item."cover" IS NOT NULL
  AND file."url" = item."cover"
  AND file."deleted_at" IS NULL
  AND file."status" = 'ACTIVE';

UPDATE "recipes" AS item
SET "video_file_id" = file."id"
FROM "files" AS file
WHERE item."video_file_id" IS NULL
  AND item."video" IS NOT NULL
  AND file."url" = item."video"
  AND file."deleted_at" IS NULL
  AND file."status" = 'ACTIVE';

UPDATE "beverages" AS item
SET "cover_file_id" = file."id"
FROM "files" AS file
WHERE item."cover_file_id" IS NULL
  AND item."cover_image" IS NOT NULL
  AND file."url" = item."cover_image"
  AND file."deleted_at" IS NULL
  AND file."status" = 'ACTIVE';

CREATE INDEX "ingredients_cover_file_id_idx" ON "ingredients"("cover_file_id");
CREATE INDEX "ingredients_selection_media_file_id_idx" ON "ingredients"("selection_media_file_id");
CREATE INDEX "recipes_cover_file_id_idx" ON "recipes"("cover_file_id");
CREATE INDEX "recipes_video_file_id_idx" ON "recipes"("video_file_id");
CREATE INDEX "beverages_cover_file_id_idx" ON "beverages"("cover_file_id");
CREATE INDEX "beverages_video_file_id_idx" ON "beverages"("video_file_id");

COMMIT;
