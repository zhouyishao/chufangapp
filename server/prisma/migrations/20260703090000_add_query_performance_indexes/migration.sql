-- Add read-path composite indexes for MVP list, basket, family and history queries.
CREATE INDEX IF NOT EXISTS "family_members_user_active_idx"
  ON "family_members" ("user_id", "deleted_at", "member_status");

CREATE INDEX IF NOT EXISTS "family_members_family_active_idx"
  ON "family_members" ("family_id", "deleted_at", "member_status");

CREATE INDEX IF NOT EXISTS "ingredients_public_list_idx"
  ON "ingredients" ("deleted_at", "status", "is_publish", "is_recommend", "sort" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "ingredients_category_public_idx"
  ON "ingredients" ("category_id", "deleted_at", "status", "is_publish", "is_recommend", "sort_order" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "ingredient_price_records_lookup_idx"
  ON "ingredient_price_records" ("ingredient_id", "user_id", "deleted_at", "price_date" DESC, "created_at" DESC);

CREATE INDEX IF NOT EXISTS "recipes_public_list_idx"
  ON "recipes" ("deleted_at", "status", "is_publish", "audit_status", "is_recommend", "sort" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "recipes_public_module_idx"
  ON "recipes" ("deleted_at", "status", "is_publish", "audit_status", "is_recommend", "sort_order" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "recipes_category_public_idx"
  ON "recipes" ("category_id", "deleted_at", "status", "is_publish", "audit_status", "is_recommend", "sort_order" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "recipes_author_idx"
  ON "recipes" ("author_id", "deleted_at", "updated_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "beverages_public_list_idx"
  ON "beverages" ("deleted_at", "status", "is_publish", "sort_order" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "beverages_category_public_idx"
  ON "beverages" ("category_id", "deleted_at", "status", "is_publish", "sort_order" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "favorites_user_active_updated_idx"
  ON "favorites" ("user_id", "deleted_at", "updated_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "favorites_user_active_recipe_idx"
  ON "favorites" ("user_id", "deleted_at", "recipe_id", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS "favorites_user_active_ingredient_idx"
  ON "favorites" ("user_id", "deleted_at", "ingredient_id", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS "view_histories_user_active_updated_idx"
  ON "view_histories" ("user_id", "deleted_at", "updated_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "view_histories_user_recipe_active_idx"
  ON "view_histories" ("user_id", "recipe_id", "deleted_at");

CREATE INDEX IF NOT EXISTS "view_histories_user_ingredient_active_idx"
  ON "view_histories" ("user_id", "ingredient_id", "deleted_at");

CREATE INDEX IF NOT EXISTS "purchase_list_items_user_active_idx"
  ON "purchase_list_items" ("user_id", "deleted_at", "checked", "updated_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "purchase_list_items_family_active_idx"
  ON "purchase_list_items" ("family_id", "deleted_at", "checked", "updated_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "search_histories_user_active_updated_idx"
  ON "search_histories" ("user_id", "deleted_at", "updated_at" DESC, "id" DESC);
