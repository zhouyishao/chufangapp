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

CREATE INDEX "ingredients_cover_file_id_idx" ON "ingredients"("cover_file_id");
CREATE INDEX "ingredients_selection_media_file_id_idx" ON "ingredients"("selection_media_file_id");
CREATE INDEX "recipes_cover_file_id_idx" ON "recipes"("cover_file_id");
CREATE INDEX "recipes_video_file_id_idx" ON "recipes"("video_file_id");
CREATE INDEX "beverages_cover_file_id_idx" ON "beverages"("cover_file_id");
CREATE INDEX "beverages_video_file_id_idx" ON "beverages"("video_file_id");

COMMIT;
