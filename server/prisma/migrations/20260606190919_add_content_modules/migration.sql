-- CreateTable
CREATE TABLE "content_modules" (
    "id" SERIAL NOT NULL,
    "nav_id" INTEGER NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "subtitle" VARCHAR(160),
    "display_style" VARCHAR(40) NOT NULL,
    "content_type" VARCHAR(20) NOT NULL,
    "content_source" VARCHAR(20) NOT NULL,
    "display_count" INTEGER NOT NULL DEFAULT 6,
    "show_more" BOOLEAN NOT NULL DEFAULT false,
    "more_link" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ENABLED',
    "items" JSONB,
    "category_id" INTEGER,
    "tag_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_modules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_modules_nav_id_status_sort_order_idx" ON "content_modules"("nav_id", "status", "sort_order");

-- AddForeignKey
ALTER TABLE "content_modules" ADD CONSTRAINT "content_modules_nav_id_fkey" FOREIGN KEY ("nav_id") REFERENCES "home_top_navs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
