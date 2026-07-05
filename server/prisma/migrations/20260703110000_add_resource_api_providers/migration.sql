CREATE TABLE IF NOT EXISTS "resource_api_providers" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "provider_name" VARCHAR(120) NOT NULL,
  "resource_type" VARCHAR(32) NOT NULL,
  "method" VARCHAR(16) NOT NULL DEFAULT 'GET',
  "endpoint_url" VARCHAR(500) NOT NULL,
  "auth_type" VARCHAR(32) NOT NULL DEFAULT 'NONE',
  "app_key" VARCHAR(255),
  "encrypted_secret" TEXT,
  "default_headers" JSONB,
  "default_params" JSONB,
  "data_path" VARCHAR(120) NOT NULL DEFAULT 'data.list',
  "timeout_ms" INTEGER NOT NULL DEFAULT 10000,
  "daily_limit" INTEGER NOT NULL DEFAULT 10000,
  "description" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "last_synced_at" TIMESTAMP(3),
  "last_tested_at" TIMESTAMP(3),
  "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "resource_api_providers_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "resource_import_batches"
  ADD COLUMN IF NOT EXISTS "provider_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "source_name" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "request_snapshot" JSONB;

ALTER TABLE "resource_import_items"
  ADD COLUMN IF NOT EXISTS "external_id" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "external_url" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "filter_code" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "duplicate_target_id" INTEGER;

DO $$ BEGIN
  ALTER TABLE "resource_import_batches"
    ADD CONSTRAINT "resource_import_batches_provider_id_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "resource_api_providers"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "resource_api_providers_resource_type_idx" ON "resource_api_providers"("resource_type");
CREATE INDEX IF NOT EXISTS "resource_api_providers_status_idx" ON "resource_api_providers"("status");
CREATE INDEX IF NOT EXISTS "resource_import_batches_provider_id_idx" ON "resource_import_batches"("provider_id");
