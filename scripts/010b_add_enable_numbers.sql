-- Add enable_player_numbers column to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS enable_player_numbers boolean NOT NULL DEFAULT false;
