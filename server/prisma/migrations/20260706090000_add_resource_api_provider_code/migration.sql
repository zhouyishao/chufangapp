ALTER TABLE "resource_api_providers"
  ADD COLUMN IF NOT EXISTS "provider_code" VARCHAR(64);

UPDATE "resource_api_providers" SET "provider_code" = 'mock_recipe' WHERE "id" = 1;
UPDATE "resource_api_providers" SET "provider_code" = 'themealdb_recipe' WHERE "id" = 2;
UPDATE "resource_api_providers" SET "provider_code" = 'usda_fdc_fruit' WHERE "id" = 3;
UPDATE "resource_api_providers" SET "provider_code" = 'openfoodfacts_ingredient' WHERE "id" = 4;
UPDATE "resource_api_providers" SET "provider_code" = 'usda_fdc_seasoning' WHERE "id" = 5;
UPDATE "resource_api_providers" SET "provider_code" = 'thecocktaildb' WHERE "id" = 6;
UPDATE "resource_api_providers" SET "provider_code" = 'tianapi_caipu' WHERE "id" = 7;
UPDATE "resource_api_providers" SET "provider_code" = 'tianapi_nutrient_ingredient' WHERE "id" = 8;
UPDATE "resource_api_providers" SET "provider_code" = 'tianapi_nutrient_fruit' WHERE "id" = 9;
UPDATE "resource_api_providers" SET "provider_code" = 'tianapi_nutrient_seasoning' WHERE "id" = 10;
UPDATE "resource_api_providers" SET "provider_code" = 'usda_fdc' WHERE "id" = 11;

ALTER TABLE "resource_api_providers"
  ALTER COLUMN "provider_code" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "resource_api_providers"
    ADD CONSTRAINT "resource_api_providers_provider_code_key" UNIQUE ("provider_code");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
