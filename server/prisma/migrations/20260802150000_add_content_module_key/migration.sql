ALTER TABLE "content_modules"
ADD COLUMN "module_key" VARCHAR(48);

CREATE INDEX "content_modules_nav_id_module_key_idx"
ON "content_modules"("nav_id", "module_key");
