-- Add champion columns to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS champion_team_id uuid;
ALTER TABLE games ADD COLUMN IF NOT EXISTS champion_photo_url text;
