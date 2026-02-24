-- Add new columns for match status and player numbering features

-- Add status column to matches table (draft, playing, completed)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_status text NOT NULL DEFAULT 'draft';

-- Add enable_player_numbers toggle to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS enable_player_numbers boolean NOT NULL DEFAULT false;

-- Add number column to participants (for player numbers)
ALTER TABLE participants ADD COLUMN IF NOT EXISTS player_number integer;

-- Add champion_photo_url and champion_team_id to games for daily champion
ALTER TABLE games ADD COLUMN IF NOT EXISTS champion_team_id uuid;
ALTER TABLE games ADD COLUMN IF NOT EXISTS champion_photo_url text;
