-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'editor', 'member');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'deleted');

-- CreateEnum
CREATE TYPE "PermissionLevel" AS ENUM ('editor');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('user_created', 'user_updated', 'user_deleted', 'role_changed', 'permission_granted', 'permission_revoked', 'series_created', 'series_updated', 'series_deleted', 'content_created', 'content_updated', 'content_published', 'content_archived', 'version_created', 'version_restored');

-- CreateEnum
CREATE TYPE "SeriesStatus" AS ENUM ('active', 'deleted');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series_permissions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "series_id" INTEGER NOT NULL,
    "permission" "PermissionLevel" NOT NULL DEFAULT 'editor',
    "granted_by" INTEGER NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "series_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin_id" INTEGER NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "target_entity_type" VARCHAR(50) NOT NULL,
    "target_entity_id" INTEGER NOT NULL,
    "changes" JSONB,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_series" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "SeriesStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "content_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" SERIAL NOT NULL,
    "series_id" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "body" TEXT NOT NULL,
    "author_id" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "published_version" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "search_vector" tsvector,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" SERIAL NOT NULL,
    "content_item_id" INTEGER NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "body" TEXT NOT NULL,
    "author_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_current" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_metadata" (
    "id" SERIAL NOT NULL,
    "content_item_id" INTEGER NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "unique_viewer_count" INTEGER NOT NULL DEFAULT 0,
    "last_viewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "series_permissions_user_id_series_id_key" ON "series_permissions"("user_id", "series_id");

-- CreateIndex
CREATE INDEX "series_permissions_series_id_idx" ON "series_permissions"("series_id");

-- CreateIndex
CREATE INDEX "activity_logs_admin_id_timestamp_idx" ON "activity_logs"("admin_id", "timestamp");

-- CreateIndex
CREATE INDEX "activity_logs_target_entity_type_target_entity_id_idx" ON "activity_logs"("target_entity_type", "target_entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_timestamp_idx" ON "activity_logs"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "content_series_title_idx" ON "content_series"("title");

-- CreateIndex
CREATE INDEX "content_series_created_by_idx" ON "content_series"("created_by");

-- CreateIndex
CREATE INDEX "content_series_status_idx" ON "content_series"("status");

-- CreateIndex
CREATE INDEX "content_series_created_at_idx" ON "content_series"("created_at" DESC);

-- CreateIndex
CREATE INDEX "content_items_series_id_idx" ON "content_items"("series_id");

-- CreateIndex
CREATE INDEX "content_items_author_id_idx" ON "content_items"("author_id");

-- CreateIndex
CREATE INDEX "content_items_status_idx" ON "content_items"("status");

-- CreateIndex
CREATE INDEX "content_items_published_at_idx" ON "content_items"("published_at" DESC);

-- CreateIndex
CREATE INDEX "content_items_title_idx" ON "content_items"("title");

-- CreateIndex
CREATE INDEX "content_items_search_vector_idx" ON "content_items" USING GIN ("search_vector");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_content_item_id_version_number_key" ON "content_versions"("content_item_id", "version_number");

-- CreateIndex
CREATE INDEX "content_versions_content_item_id_version_number_idx" ON "content_versions"("content_item_id", "version_number" DESC);

-- CreateIndex
CREATE INDEX "content_versions_created_at_idx" ON "content_versions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "content_versions_is_current_idx" ON "content_versions"("is_current");

-- CreateIndex
CREATE UNIQUE INDEX "content_metadata_content_item_id_key" ON "content_metadata"("content_item_id");

-- CreateIndex
CREATE INDEX "content_metadata_view_count_idx" ON "content_metadata"("view_count" DESC);

-- CreateIndex
CREATE INDEX "content_metadata_last_viewed_at_idx" ON "content_metadata"("last_viewed_at" DESC);

-- AddForeignKey
ALTER TABLE "series_permissions" ADD CONSTRAINT "series_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_series" ADD CONSTRAINT "content_series_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "content_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_metadata" ADD CONSTRAINT "content_metadata_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- T010: Create trigger function for automatic search_vector updates
CREATE OR REPLACE FUNCTION content_items_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- T010: Create trigger to auto-update search_vector on INSERT or UPDATE
CREATE TRIGGER content_items_search_vector_trigger
  BEFORE INSERT OR UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION content_items_search_vector_update();
