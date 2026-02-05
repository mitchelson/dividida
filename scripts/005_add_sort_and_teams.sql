-- Add sort mode to games: 'payment' (default), 'teams', 'arrival'
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS sort_mode TEXT DEFAULT 'payment';

-- Add players per team config for team mode
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS players_per_team INTEGER DEFAULT 5;

-- Add paid_at timestamp to track payment order
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add sort_order for manual drag-and-drop ordering (arrival mode)
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
