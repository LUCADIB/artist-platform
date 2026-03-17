-- ============================================================================
-- Migration: Add Category Featured Support
-- Version: 003
-- Date: 2026-03-16
-- Description: Adds category_featured_rank column and unique constraints
--              for per-category featured artist positioning.
--
-- Safety: All operations use IF NOT EXISTS for idempotency.
--         No data modification - only schema extension.
-- ============================================================================

-- Step 1: Add category_featured_rank column
-- Allows artists to be featured within their category (1-6 position)
-- NULL means not featured in category (default)
ALTER TABLE artists
ADD COLUMN IF NOT EXISTS category_featured_rank INTEGER NULL;

COMMENT ON COLUMN artists.category_featured_rank IS
  'Position within category page (1-6). NULL means not featured in category. '
  'Different from home_featured_rank which is for homepage positioning.';

-- Step 2: Create unique indexes to prevent duplicate ranks
-- These are partial indexes that only apply to non-null values

-- Ensure unique home_featured_rank values across all artists
-- Prevents two artists from having rank 1 on homepage
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_home_featured_rank
ON artists (home_featured_rank)
WHERE home_featured_rank IS NOT NULL;

-- Ensure unique category_featured_rank per category
-- Allows same rank in different categories, but not within same category
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_category_featured_rank
ON artists (category_id, category_featured_rank)
WHERE category_featured_rank IS NOT NULL;

-- Step 3: Create performance indexes for common queries

-- Index for category page queries with featured ordering
-- Filters: status = approved, category_featured_rank not null
CREATE INDEX IF NOT EXISTS idx_artists_category_featured
ON artists (category_id, category_featured_rank)
WHERE status = 'approved' AND category_featured_rank IS NOT NULL;

-- Index for homepage featured queries
-- Filters: status = approved, home_featured_rank not null
CREATE INDEX IF NOT EXISTS idx_artists_home_featured
ON artists (home_featured_rank)
WHERE status = 'approved' AND home_featured_rank IS NOT NULL;

-- ============================================================================
-- Notes for future implementation:
--
-- 1. Max 6 per category should be enforced at API level, not database level
-- 2. category_featured_rank can coexist with home_featured_rank
-- 3. Artists without a category_id cannot have category_featured_rank set
-- ============================================================================
