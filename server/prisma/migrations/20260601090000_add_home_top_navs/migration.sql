CREATE TABLE "home_top_navs" (
  "id" SERIAL PRIMARY KEY,
  "biz_id" VARCHAR(64) UNIQUE,
  "code" VARCHAR(32) UNIQUE,
  "name" VARCHAR(32) NOT NULL,
  "alias" VARCHAR(64),
  "nav_type" VARCHAR(32) NOT NULL DEFAULT 'recipe_category',
  "display_position" VARCHAR(32) NOT NULL DEFAULT 'home_top',
  "icon_url" VARCHAR(255),
  "sort_order" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "is_fixed" BOOLEAN NOT NULL DEFAULT true,
  "show_more_entry" BOOLEAN NOT NULL DEFAULT false,
  "description" VARCHAR(120),
  "remark" VARCHAR(200),
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "created_by" INTEGER,
  "updated_by" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3)
);

CREATE UNIQUE INDEX "home_top_navs_display_position_name_deleted_at_key" ON "home_top_navs"("display_position", "name", "deleted_at");

CREATE TABLE "home_top_nav_relations" (
  "id" SERIAL PRIMARY KEY,
  "nav_id" INTEGER NOT NULL,
  "relation_type" VARCHAR(32) NOT NULL,
  "relation_id" VARCHAR(64) NOT NULL,
  "relation_name" VARCHAR(64),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "home_top_nav_relations_nav_id_fkey" FOREIGN KEY ("nav_id") REFERENCES "home_top_navs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "home_top_nav_styles" (
  "id" SERIAL PRIMARY KEY,
  "nav_id" INTEGER NOT NULL UNIQUE,
  "nav_style" VARCHAR(32) NOT NULL DEFAULT 'text_tab',
  "active_style" VARCHAR(32) NOT NULL DEFAULT 'underline',
  "layout_mode" VARCHAR(32) NOT NULL DEFAULT 'fixed',
  "text_color" VARCHAR(16) NOT NULL DEFAULT '#666666',
  "active_text_color" VARCHAR(16) NOT NULL DEFAULT '#7A8B6F',
  "show_divider" BOOLEAN NOT NULL DEFAULT true,
  "tab_gap" VARCHAR(16) NOT NULL DEFAULT 'medium',
  "reserve_space" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "home_top_nav_styles_nav_id_fkey" FOREIGN KEY ("nav_id") REFERENCES "home_top_navs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "home_top_nav_content_rules" (
  "id" SERIAL PRIMARY KEY,
  "nav_id" INTEGER NOT NULL UNIQUE,
  "source_type" VARCHAR(32) NOT NULL DEFAULT 'category',
  "difficulty_filter" VARCHAR(32) DEFAULT 'all',
  "duration_filter" VARCHAR(32) DEFAULT 'all',
  "cooking_method_filter" VARCHAR(32) DEFAULT 'all',
  "display_count" INTEGER NOT NULL DEFAULT 6,
  "sort_rule" VARCHAR(32) NOT NULL DEFAULT 'comprehensive',
  "more_button_text" VARCHAR(20) NOT NULL DEFAULT '查看更多',
  "jump_rule" VARCHAR(64) NOT NULL DEFAULT 'nav_content_list',
  "recommend_start_at" TIMESTAMP(3),
  "recommend_end_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "home_top_nav_content_rules_nav_id_fkey" FOREIGN KEY ("nav_id") REFERENCES "home_top_navs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
