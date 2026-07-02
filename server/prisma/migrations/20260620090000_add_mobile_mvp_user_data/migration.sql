CREATE TABLE "purchase_list_items" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "family_id" INTEGER,
  "recipe_id" INTEGER,
  "ingredient_id" INTEGER,
  "recipe_name" VARCHAR(120),
  "name" VARCHAR(80) NOT NULL,
  "amount_text" VARCHAR(80),
  "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
  "unit" VARCHAR(24),
  "purchase_text" VARCHAR(120),
  "checked" BOOLEAN NOT NULL DEFAULT false,
  "checked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "sort" INTEGER NOT NULL DEFAULT 0,
  "is_publish" BOOLEAN NOT NULL DEFAULT false,
  "is_recommend" BOOLEAN NOT NULL DEFAULT false,
  "source_type" "SourceType" NOT NULL DEFAULT 'USER',
  "source_id" INTEGER,
  "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
  "created_by" INTEGER,
  "updated_by" INTEGER,
  CONSTRAINT "purchase_list_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "purchase_list_items_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "purchase_list_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "purchase_list_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "purchase_list_items_user_id_idx" ON "purchase_list_items"("user_id");
CREATE INDEX "purchase_list_items_family_id_idx" ON "purchase_list_items"("family_id");
CREATE INDEX "purchase_list_items_recipe_id_idx" ON "purchase_list_items"("recipe_id");
CREATE INDEX "purchase_list_items_ingredient_id_idx" ON "purchase_list_items"("ingredient_id");

CREATE TABLE "search_histories" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "keyword" VARCHAR(80) NOT NULL,
  "result_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "sort" INTEGER NOT NULL DEFAULT 0,
  "is_publish" BOOLEAN NOT NULL DEFAULT false,
  "is_recommend" BOOLEAN NOT NULL DEFAULT false,
  "source_type" "SourceType" NOT NULL DEFAULT 'USER',
  "source_id" INTEGER,
  "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
  "created_by" INTEGER,
  "updated_by" INTEGER,
  CONSTRAINT "search_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "search_histories_user_id_keyword_key" ON "search_histories"("user_id", "keyword");
CREATE INDEX "search_histories_user_id_idx" ON "search_histories"("user_id");

CREATE TABLE "family_preferences" (
  "id" SERIAL PRIMARY KEY,
  "family_id" INTEGER NOT NULL UNIQUE,
  "avoid_items" JSONB NOT NULL DEFAULT '[]',
  "allergies" JSONB NOT NULL DEFAULT '[]',
  "preferences" JSONB NOT NULL DEFAULT '[]',
  "taste" VARCHAR(80),
  "note" VARCHAR(255),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "sort" INTEGER NOT NULL DEFAULT 0,
  "is_publish" BOOLEAN NOT NULL DEFAULT false,
  "is_recommend" BOOLEAN NOT NULL DEFAULT false,
  "source_type" "SourceType" NOT NULL DEFAULT 'USER',
  "source_id" INTEGER,
  "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
  "created_by" INTEGER,
  "updated_by" INTEGER,
  CONSTRAINT "family_preferences_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
