-- Add started_at column to matches table if it doesn't exist
ALTER TABLE matches ADD COLUMN IF NOT EXISTS started_at timestamptz;

-- Create match_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS match_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_time integer,
  team text,
  participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for match_events
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

-- Public access policies
CREATE POLICY IF NOT EXISTS "match_events_select_public" ON match_events FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "match_events_insert_public" ON match_events FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "match_events_update_public" ON match_events FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "match_events_delete_public" ON match_events FOR DELETE USING (true);
