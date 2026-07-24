BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "file_references"
    WHERE NOT (
      "owner_type" = 'USER'
      AND "field" = 'avatar'
      AND "sort_index" = 0
    )
    GROUP BY "owner_type", "owner_id", "field", "sort_index"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'duplicate non-avatar file reference slots require an explicit migration strategy';
  END IF;
END
$$;

ALTER TABLE "users" ADD COLUMN "bio" VARCHAR(120);

INSERT INTO "file_references" ("file_id", "owner_type", "owner_id", "field", "sort_index")
SELECT
  file."id",
  'USER',
  app_user."id"::text,
  'avatar',
  0
FROM "users" AS app_user
JOIN "files" AS file ON file."url" = app_user."avatar"
WHERE app_user."avatar" IS NOT NULL
  AND (file."uploader_id" = app_user."id" OR file."uploader_id" IS NULL)
  AND file."deleted_at" IS NULL
  AND file."mime_type" LIKE 'image/%'
ON CONFLICT DO NOTHING;

UPDATE "files"
SET "sha256" = NULL
WHERE "deleted_at" IS NOT NULL
  AND "sha256" IS NOT NULL;

WITH reference_candidates AS (
  SELECT
    reference."id",
    reference."owner_type",
    reference."owner_id",
    reference."field",
    reference."sort_index",
    reference."created_at",
    file."url" AS file_url,
    app_user."avatar" AS user_avatar
  FROM "file_references" AS reference
  LEFT JOIN "files" AS file ON file."id" = reference."file_id"
  LEFT JOIN "users" AS app_user
    ON reference."owner_type" = 'USER'
    AND app_user."id"::text = reference."owner_id"
  WHERE reference."owner_type" = 'USER'
    AND reference."field" = 'avatar'
    AND reference."sort_index" = 0
),
ranked_references AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "owner_type", "owner_id", "field", "sort_index"
      ORDER BY
        CASE
          WHEN "owner_type" = 'USER'
            AND "field" = 'avatar'
            AND user_avatar = file_url
          THEN 0
          ELSE 1
        END,
        "created_at" DESC,
        "id" DESC
    ) AS slot_rank
  FROM reference_candidates
)
DELETE FROM "file_references"
WHERE "id" IN (
  SELECT "id"
  FROM ranked_references
  WHERE slot_rank > 1
);

DROP INDEX IF EXISTS "file_references_file_id_owner_type_owner_id_field_sort_inde_key";
CREATE UNIQUE INDEX "file_references_owner_type_owner_id_field_sort_index_key"
  ON "file_references"("owner_type", "owner_id", "field", "sort_index");

COMMIT;
