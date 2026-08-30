BEGIN;

ALTER TABLE "ingredients"
  ADD COLUMN "transparent_image" VARCHAR(255),
  ADD COLUMN "transparent_image_file_id" INTEGER;

ALTER TABLE "beverages"
  ADD COLUMN "transparent_image" VARCHAR(255),
  ADD COLUMN "transparent_image_file_id" INTEGER;

ALTER TABLE "ingredients"
  ADD CONSTRAINT "ingredients_transparent_image_file_id_fkey"
  FOREIGN KEY ("transparent_image_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "beverages"
  ADD CONSTRAINT "beverages_transparent_image_file_id_fkey"
  FOREIGN KEY ("transparent_image_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ingredients_transparent_image_file_id_idx" ON "ingredients"("transparent_image_file_id");
CREATE INDEX "beverages_transparent_image_file_id_idx" ON "beverages"("transparent_image_file_id");

COMMIT;
