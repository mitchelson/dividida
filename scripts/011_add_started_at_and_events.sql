-- Add started_at column to matches table for storing the actual start time
ALTER TABLE matches ADD COLUMN IF NOT EXISTS started_at timestamptz;

-- Create match_events table to track events like "Iniciado em 15h21"
CREATE TABLE IF NOT EXISTS match_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'started', 'paused', 'resumed', 'finished', 'goal'
  event_time integer, -- seconds when event occurred
  participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  team text, -- 'a' or 'b' for team-specific events
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

-- Public access policies for match_events
CREATE POLICY "match_events_select_public" ON match_events FOR SELECT USING (true);
CREATE POLICY "match_events_insert_public" ON match_events FOR INSERT WITH CHECK (true);
CREATE POLICY "match_events_update_public" ON match_events FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "match_events_delete_public" ON match_events FOR DELETE USING (true);
