-- Add match_status column to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_status text NOT NULL DEFAULT 'draft';
