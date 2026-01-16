-- Profile Picture Setup for Finance Tracker

-- Add avatar_url column to user_stats table
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Instructions:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Rename the bucket "MyFinances" to "avatars" (or create a new bucket named "avatars")
-- 3. Make sure it's PUBLIC
-- 4. Set file size limit to 15MB
-- 5. Run the ALTER TABLE command above in SQL Editor
-- 6. The policies below will be created automatically

-- Storage policies (these are created automatically when you create the bucket)
-- Allow users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
