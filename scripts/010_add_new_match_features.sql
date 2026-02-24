-- Add new columns for match status and player numbering features

-- Add status column to matches table (draft, playing, completed)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Add enable_player_numbers toggle to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS enable_player_numbers boolean NOT NULL DEFAULT false;

-- Add number column to participants (for player numbers)
ALTER TABLE participants ADD COLUMN IF NOT EXISTS number integer;

-- Create a players table if it doesn't exist (for storing player info per match)
CREATE TABLE IF NOT EXISTS players (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  number integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for players table
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Public access policies for players
CREATE POLICY "players_select_public" ON players FOR SELECT USING (true);
CREATE POLICY "players_insert_public" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_update_public" ON players FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "players_delete_public" ON players FOR DELETE USING (true);
