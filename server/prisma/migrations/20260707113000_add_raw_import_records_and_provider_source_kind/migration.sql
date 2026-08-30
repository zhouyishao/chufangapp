ALTER TABLE "resource_api_providers"
  ADD COLUMN IF NOT EXISTS "source_kind" VARCHAR(32) NOT NULL DEFAULT 'API',
  ADD COLUMN IF NOT EXISTS "format_hint" VARCHAR(32) NOT NULL DEFAULT 'AUTO',
  ADD COLUMN IF NOT EXISTS "source_home_url" VARCHAR(500);

CREATE INDEX IF NOT EXISTS "resource_api_providers_source_kind_idx"
  ON "resource_api_providers" ("source_kind");

CREATE TABLE IF NOT EXISTS "raw_import_records" (
  "id" SERIAL PRIMARY KEY,
  "provider_id" INTEGER NOT NULL REFERENCES "resource_api_providers"("id") ON DELETE CASCADE,
  "batch_id" INTEGER REFERENCES "resource_import_batches"("id") ON DELETE SET NULL,
  "source_type" VARCHAR(32) NOT NULL DEFAULT 'DATASET',
  "file_name" VARCHAR(255) NOT NULL,
  "source_url" VARCHAR(500) NOT NULL,
  "content_type" VARCHAR(120),
  "raw_text" TEXT,
  "raw_json" JSONB,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "parsed_count" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "raw_import_records_provider_id_idx"
  ON "raw_import_records" ("provider_id");

CREATE INDEX IF NOT EXISTS "raw_import_records_batch_id_idx"
  ON "raw_import_records" ("batch_id");

CREATE INDEX IF NOT EXISTS "raw_import_records_status_idx"
  ON "raw_import_records" ("status");
