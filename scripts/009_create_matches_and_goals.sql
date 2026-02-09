-- Matches between teams within a game
CREATE TABLE IF NOT EXISTS matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_a_name text NOT NULL DEFAULT 'Time 1',
  team_b_name text NOT NULL DEFAULT 'Time 2',
  score_a integer NOT NULL DEFAULT 0,
  score_b integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending, playing, finished
  elapsed_seconds integer NOT NULL DEFAULT 0,
  match_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Goals scored in each match
CREATE TABLE IF NOT EXISTS goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  team text NOT NULL, -- 'a' or 'b'
  minute integer, -- optional: at what second of the match
  created_at timestamptz DEFAULT now()
);

-- Add team_id column to participants for explicit team assignment
ALTER TABLE participants ADD COLUMN IF NOT EXISTS team_index integer;

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Public access policies for matches
CREATE POLICY "matches_select_public" ON matches FOR SELECT USING (true);
CREATE POLICY "matches_insert_public" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "matches_update_public" ON matches FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "matches_delete_public" ON matches FOR DELETE USING (true);

-- Public access policies for goals
CREATE POLICY "goals_select_public" ON goals FOR SELECT USING (true);
CREATE POLICY "goals_insert_public" ON goals FOR INSERT WITH CHECK (true);
CREATE POLICY "goals_update_public" ON goals FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "goals_delete_public" ON goals FOR DELETE USING (true);
