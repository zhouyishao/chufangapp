ALTER TABLE "resource_api_providers"
  ADD COLUMN IF NOT EXISTS "provider_code" VARCHAR(64);

WITH provider_codes AS (
  SELECT
    "id" AS row_id,
    'provider_' || md5(concat_ws(
      E'\x1f',
      "name",
      "provider_name",
      "resource_type",
      "method",
      "endpoint_url",
      "auth_type",
      "data_path"
    )) AS base_code
  FROM "resource_api_providers"
  WHERE "provider_code" IS NULL
), ranked_provider_codes AS (
  SELECT
    row_id,
    base_code,
    row_number() OVER (
      PARTITION BY base_code
      ORDER BY row_id
    ) AS duplicate_number
  FROM provider_codes
)
UPDATE "resource_api_providers" AS provider
SET "provider_code" = ranked.base_code
  || CASE
    WHEN ranked.duplicate_number = 1 THEN ''
    ELSE '_' || ranked.duplicate_number::text
  END
FROM ranked_provider_codes AS ranked
WHERE provider."id" = ranked.row_id;

ALTER TABLE "resource_api_providers"
  ALTER COLUMN "provider_code" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "resource_api_providers"
    ADD CONSTRAINT "resource_api_providers_provider_code_key" UNIQUE ("provider_code");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
