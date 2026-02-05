-- Player profiles linked to Supabase auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  -- FIFA-style stats (1-99 scale)
  stat_pace INTEGER NOT NULL DEFAULT 50 CHECK (stat_pace BETWEEN 1 AND 99),
  stat_shooting INTEGER NOT NULL DEFAULT 50 CHECK (stat_shooting BETWEEN 1 AND 99),
  stat_passing INTEGER NOT NULL DEFAULT 50 CHECK (stat_passing BETWEEN 1 AND 99),
  stat_dribbling INTEGER NOT NULL DEFAULT 50 CHECK (stat_dribbling BETWEEN 1 AND 99),
  stat_defending INTEGER NOT NULL DEFAULT 50 CHECK (stat_defending BETWEEN 1 AND 99),
  stat_physical INTEGER NOT NULL DEFAULT 50 CHECK (stat_physical BETWEEN 1 AND 99),
  -- Overall computed from average (stored for convenience)
  overall INTEGER GENERATED ALWAYS AS (
    (stat_pace + stat_shooting + stat_passing + stat_dribbling + stat_defending + stat_physical) / 6
  ) STORED,
  position TEXT DEFAULT 'ATA',
  games_played INTEGER NOT NULL DEFAULT 0,
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: link participants to profiles
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
