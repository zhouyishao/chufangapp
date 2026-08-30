-- Additive production-domain foundation. Existing columns remain available during the compatibility window.
CREATE TYPE "ContentType" AS ENUM ('RECIPE', 'INGREDIENT', 'FRUIT', 'BEVERAGE', 'SEASONING');
CREATE TYPE "PreferenceKind" AS ENUM ('LIKE', 'AVOID', 'ALLERGY');
CREATE TYPE "ShareScope" AS ENUM ('PRIVATE', 'FAMILY');
CREATE TYPE "PurchaseBatchStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'FAMILY_EVENT', 'MEAL_READY');
CREATE TYPE "FamilyEventStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "BeverageKind" AS ENUM ('ORDINARY', 'MIXED');
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO');
CREATE TYPE "FileStorageKind" AS ENUM ('LOCAL', 'OBJECT');

ALTER TABLE "beverages" ADD COLUMN "kind" "BeverageKind" NOT NULL DEFAULT 'ORDINARY';
ALTER TABLE "favorites" ADD COLUMN "beverage_id" INTEGER,
  ADD COLUMN "target_id" VARCHAR(64), ADD COLUMN "target_type" "ContentType";
ALTER TABLE "view_histories" ADD COLUMN "beverage_id" INTEGER,
  ADD COLUMN "target_id" VARCHAR(64), ADD COLUMN "target_type" "ContentType";
ALTER TABLE "files" ADD COLUMN "duration_seconds" INTEGER,
  ADD COLUMN "sha256" VARCHAR(64),
  ADD COLUMN "storage_kind" "FileStorageKind" NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN "uploader_id" INTEGER;
ALTER TABLE "purchase_list_items" ADD COLUMN "batch_id" INTEGER;
ALTER TABLE "recipe_steps" ADD COLUMN "media_file_id" INTEGER,
  ADD COLUMN "media_kind" "MediaKind", ADD COLUMN "timer_seconds" INTEGER,
  ADD COLUMN "tip" TEXT;

UPDATE "favorites"
SET "target_type" = CASE WHEN "recipe_id" IS NOT NULL THEN 'RECIPE'::"ContentType" ELSE 'INGREDIENT'::"ContentType" END,
    "target_id" = COALESCE("recipe_id", "ingredient_id")::text
WHERE "target_type" IS NULL OR "target_id" IS NULL;
UPDATE "view_histories"
SET "target_type" = CASE WHEN "recipe_id" IS NOT NULL THEN 'RECIPE'::"ContentType" ELSE 'INGREDIENT'::"ContentType" END,
    "target_id" = COALESCE("recipe_id", "ingredient_id")::text
WHERE "target_type" IS NULL OR "target_id" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "favorites" WHERE "target_type" IS NULL OR "target_id" IS NULL) THEN
    RAISE EXCEPTION 'favorites contain rows without a supported target';
  END IF;
  IF EXISTS (SELECT 1 FROM "view_histories" WHERE "target_type" IS NULL OR "target_id" IS NULL) THEN
    RAISE EXCEPTION 'view_histories contain rows without a supported target';
  END IF;
END $$;

WITH ranked AS (
  SELECT "id", row_number() OVER (
    PARTITION BY "user_id", "target_type", "target_id"
    ORDER BY "updated_at" DESC, "id" DESC
  ) AS duplicate_rank
  FROM "favorites" WHERE "deleted_at" IS NULL
)
UPDATE "favorites" AS item
SET "deleted_at" = CURRENT_TIMESTAMP, "status" = 'DISABLED'
FROM ranked WHERE item."id" = ranked."id" AND ranked.duplicate_rank > 1;

WITH ranked AS (
  SELECT "id", row_number() OVER (
    PARTITION BY "user_id", "target_type", "target_id"
    ORDER BY "updated_at" DESC, "id" DESC
  ) AS duplicate_rank
  FROM "view_histories" WHERE "deleted_at" IS NULL
)
UPDATE "view_histories" AS item
SET "deleted_at" = CURRENT_TIMESTAMP, "status" = 'DISABLED'
FROM ranked WHERE item."id" = ranked."id" AND ranked.duplicate_rank > 1;

ALTER TABLE "favorites" ALTER COLUMN "target_id" SET NOT NULL, ALTER COLUMN "target_type" SET NOT NULL;
ALTER TABLE "view_histories" ALTER COLUMN "target_id" SET NOT NULL, ALTER COLUMN "target_type" SET NOT NULL;

CREATE TABLE "user_preferences" (
  "id" SERIAL PRIMARY KEY, "user_id" INTEGER NOT NULL, "kind" "PreferenceKind" NOT NULL,
  "value" VARCHAR(80) NOT NULL, "share_scope" "ShareScope" NOT NULL DEFAULT 'PRIVATE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL, "deleted_at" TIMESTAMP(3)
);
CREATE TABLE "purchase_batches" (
  "id" SERIAL PRIMARY KEY, "family_id" INTEGER NOT NULL, "created_by_id" INTEGER NOT NULL,
  "title" VARCHAR(120) NOT NULL, "status" "PurchaseBatchStatus" NOT NULL DEFAULT 'ACTIVE',
  "completed_at" TIMESTAMP(3), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL, "deleted_at" TIMESTAMP(3)
);
CREATE TABLE "family_events" (
  "id" SERIAL PRIMARY KEY, "family_id" INTEGER NOT NULL, "created_by_id" INTEGER NOT NULL,
  "title" VARCHAR(120) NOT NULL, "starts_at" TIMESTAMP(3), "meal_ready_at" TIMESTAMP(3),
  "status" "FamilyEventStatus" NOT NULL DEFAULT 'PLANNING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL, "deleted_at" TIMESTAMP(3)
);
CREATE TABLE "notifications" (
  "id" SERIAL PRIMARY KEY, "type" "NotificationType" NOT NULL, "family_id" INTEGER,
  "event_id" INTEGER, "sender_id" INTEGER, "recipient_id" INTEGER,
  "title" VARCHAR(120) NOT NULL, "body" TEXT NOT NULL, "dedupe_key" VARCHAR(120),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deleted_at" TIMESTAMP(3)
);
CREATE TABLE "notification_receipts" (
  "id" SERIAL PRIMARY KEY, "notification_id" INTEGER NOT NULL, "user_id" INTEGER NOT NULL,
  "delivered_at" TIMESTAMP(3), "read_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "beverage_ingredients" (
  "id" SERIAL PRIMARY KEY, "beverage_id" INTEGER NOT NULL, "name" VARCHAR(120) NOT NULL,
  "amount" VARCHAR(80), "is_base" BOOLEAN NOT NULL DEFAULT false, "sort_index" INTEGER NOT NULL
);
CREATE TABLE "beverage_tools" (
  "id" SERIAL PRIMARY KEY, "beverage_id" INTEGER NOT NULL, "name" VARCHAR(120) NOT NULL,
  "sort_index" INTEGER NOT NULL
);
CREATE TABLE "beverage_steps" (
  "id" SERIAL PRIMARY KEY, "beverage_id" INTEGER NOT NULL, "sort_index" INTEGER NOT NULL,
  "title" VARCHAR(120) NOT NULL, "description" TEXT NOT NULL, "media_file_id" INTEGER,
  "timer_seconds" INTEGER, "tip" TEXT
);
CREATE TABLE "ingredient_recipe_recommendations" (
  "id" SERIAL PRIMARY KEY, "ingredient_id" INTEGER NOT NULL, "recipe_id" INTEGER NOT NULL,
  "sort_index" INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE "file_references" (
  "id" SERIAL PRIMARY KEY, "file_id" INTEGER NOT NULL, "owner_type" VARCHAR(40) NOT NULL,
  "owner_id" VARCHAR(64) NOT NULL, "field" VARCHAR(40) NOT NULL,
  "sort_index" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "user_preferences_user_id_kind_value_key" ON "user_preferences"("user_id", "kind", "value");
CREATE INDEX "user_preferences_user_id_deleted_at_idx" ON "user_preferences"("user_id", "deleted_at");
CREATE INDEX "purchase_batches_family_id_status_created_at_idx" ON "purchase_batches"("family_id", "status", "created_at" DESC);
CREATE INDEX "family_events_family_id_starts_at_idx" ON "family_events"("family_id", "starts_at");
CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "notifications"("dedupe_key");
CREATE INDEX "notifications_recipient_id_created_at_idx" ON "notifications"("recipient_id", "created_at" DESC);
CREATE INDEX "notifications_family_id_created_at_idx" ON "notifications"("family_id", "created_at" DESC);
CREATE UNIQUE INDEX "notification_receipts_notification_id_user_id_key" ON "notification_receipts"("notification_id", "user_id");
CREATE INDEX "notification_receipts_user_id_read_at_idx" ON "notification_receipts"("user_id", "read_at");
CREATE UNIQUE INDEX "beverage_ingredients_beverage_id_sort_index_key" ON "beverage_ingredients"("beverage_id", "sort_index");
CREATE UNIQUE INDEX "beverage_tools_beverage_id_sort_index_key" ON "beverage_tools"("beverage_id", "sort_index");
CREATE UNIQUE INDEX "beverage_steps_beverage_id_sort_index_key" ON "beverage_steps"("beverage_id", "sort_index");
CREATE INDEX "beverage_steps_media_file_id_idx" ON "beverage_steps"("media_file_id");
CREATE UNIQUE INDEX "ingredient_recipe_recommendations_ingredient_id_recipe_id_key" ON "ingredient_recipe_recommendations"("ingredient_id", "recipe_id");
CREATE UNIQUE INDEX "file_references_file_id_owner_type_owner_id_field_sort_inde_key" ON "file_references"("file_id", "owner_type", "owner_id", "field", "sort_index");
CREATE INDEX "file_references_owner_type_owner_id_idx" ON "file_references"("owner_type", "owner_id");
CREATE INDEX "favorites_beverage_id_idx" ON "favorites"("beverage_id");
CREATE UNIQUE INDEX "favorites_target_active_unique" ON "favorites"("user_id", "target_type", "target_id") WHERE "deleted_at" IS NULL;
CREATE INDEX "favorites_target_active_idx" ON "favorites"("user_id", "target_type", "target_id", "deleted_at");
CREATE INDEX "view_histories_beverage_id_idx" ON "view_histories"("beverage_id");
CREATE UNIQUE INDEX "view_histories_target_active_unique" ON "view_histories"("user_id", "target_type", "target_id") WHERE "deleted_at" IS NULL;
CREATE INDEX "view_histories_target_active_idx" ON "view_histories"("user_id", "target_type", "target_id", "deleted_at");
CREATE UNIQUE INDEX "files_sha256_key" ON "files"("sha256");
CREATE INDEX "purchase_list_items_batch_id_idx" ON "purchase_list_items"("batch_id");
CREATE INDEX "recipe_steps_media_file_id_idx" ON "recipe_steps"("media_file_id");
CREATE UNIQUE INDEX "recipe_steps_recipe_id_sort_index_key" ON "recipe_steps"("recipe_id", "sort_index");

ALTER TABLE "favorites" ADD CONSTRAINT "favorites_beverage_id_fkey" FOREIGN KEY ("beverage_id") REFERENCES "beverages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "view_histories" ADD CONSTRAINT "view_histories_beverage_id_fkey" FOREIGN KEY ("beverage_id") REFERENCES "beverages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_list_items" ADD CONSTRAINT "purchase_list_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "purchase_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_media_file_id_fkey" FOREIGN KEY ("media_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "files" ADD CONSTRAINT "files_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_batches" ADD CONSTRAINT "purchase_batches_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_batches" ADD CONSTRAINT "purchase_batches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "family_events" ADD CONSTRAINT "family_events_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "family_events" ADD CONSTRAINT "family_events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "family_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notification_receipts" ADD CONSTRAINT "notification_receipts_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notification_receipts" ADD CONSTRAINT "notification_receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "beverage_ingredients" ADD CONSTRAINT "beverage_ingredients_beverage_id_fkey" FOREIGN KEY ("beverage_id") REFERENCES "beverages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "beverage_tools" ADD CONSTRAINT "beverage_tools_beverage_id_fkey" FOREIGN KEY ("beverage_id") REFERENCES "beverages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "beverage_steps" ADD CONSTRAINT "beverage_steps_beverage_id_fkey" FOREIGN KEY ("beverage_id") REFERENCES "beverages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "beverage_steps" ADD CONSTRAINT "beverage_steps_media_file_id_fkey" FOREIGN KEY ("media_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ingredient_recipe_recommendations" ADD CONSTRAINT "ingredient_recipe_recommendations_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ingredient_recipe_recommendations" ADD CONSTRAINT "ingredient_recipe_recommendations_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "file_references" ADD CONSTRAINT "file_references_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
