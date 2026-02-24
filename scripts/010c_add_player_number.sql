-- Add player_number column to participants table
ALTER TABLE participants ADD COLUMN IF NOT EXISTS player_number integer;
