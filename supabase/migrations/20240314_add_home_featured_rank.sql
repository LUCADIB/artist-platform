-- Add home_featured_rank column to artists table
-- NULL = not featured, 1-10 = featured position

ALTER TABLE artists
ADD COLUMN IF NOT EXISTS home_featured_rank INTEGER NULL;

-- Add comment for documentation
COMMENT ON COLUMN artists.home_featured_rank IS 'Position on home page (1-10). NULL means not featured.';
