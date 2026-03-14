-- ============================================================================
-- RLS Policies for booking_requests table
-- ============================================================================
--
-- This migration sets up Row Level Security policies for booking_requests.
--
-- Access Rules:
-- 1. Artists can SELECT their own booking requests (where artist_id matches their artist record)
-- 2. Managers can SELECT booking requests for artists with managed_by_admin = true
-- 3. Admins can SELECT all booking requests
-- 4. Public (anonymous) can INSERT new booking requests (for the booking form)
-- 5. Managers/Admins can UPDATE booking request status
--
-- ============================================================================

-- Enable RLS on booking_requests table (if not already enabled)
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Artists can read their own booking requests" ON booking_requests;
DROP POLICY IF EXISTS "Managers can read booking requests for managed artists" ON booking_requests;
DROP POLICY IF EXISTS "Admins can read all booking requests" ON booking_requests;
DROP POLICY IF EXISTS "Public can create booking requests" ON booking_requests;
DROP POLICY IF EXISTS "Managers and Admins can update booking requests" ON booking_requests;
DROP POLICY IF EXISTS "Admins can delete booking requests" ON booking_requests;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Policy: Artists can read their own booking requests
-- An artist can read booking_requests where the artist_id matches their own artist record
-- Uses CAST to handle potential type mismatches (uuid vs text)
CREATE POLICY "Artists can read their own booking requests"
ON booking_requests
FOR SELECT
TO authenticated
USING (
  artist_id::text IN (
    SELECT id::text FROM artists WHERE profile_id = auth.uid()
  )
);

-- Policy: Managers can read booking requests for managed artists
-- Managers can read booking_requests where the artist has managed_by_admin = true
CREATE POLICY "Managers can read booking requests for managed artists"
ON booking_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('manager', 'admin')
  )
  AND artist_id::text IN (
    SELECT id::text FROM artists WHERE managed_by_admin = true
  )
);

-- Policy: Admins can read all booking requests
CREATE POLICY "Admins can read all booking requests"
ON booking_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- INSERT Policies
-- ============================================================================

-- Policy: Public can create booking requests (for the booking form)
-- This allows anonymous users to submit booking requests from the public artist profile
CREATE POLICY "Public can create booking requests"
ON booking_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Policy: Managers and Admins can update booking request status
CREATE POLICY "Managers and Admins can update booking requests"
ON booking_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('manager', 'admin')
  )
);

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Policy: Only Admins can delete booking requests
CREATE POLICY "Admins can delete booking requests"
ON booking_requests
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
