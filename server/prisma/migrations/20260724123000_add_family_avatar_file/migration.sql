BEGIN;

ALTER TABLE "families" ADD COLUMN "avatar_file_id" INTEGER;

ALTER TABLE "families"
  ADD CONSTRAINT "families_avatar_file_id_fkey"
  FOREIGN KEY ("avatar_file_id") REFERENCES "files"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "families_avatar_file_id_idx" ON "families"("avatar_file_id");

COMMIT;
