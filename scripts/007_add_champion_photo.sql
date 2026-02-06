-- Add champion photo URL to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS champion_photo_url TEXT;
