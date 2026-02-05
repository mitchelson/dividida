-- Tabela de partidas de futebol
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  game_date DATE NOT NULL,
  game_time TIME NOT NULL,
  court_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  password_hash TEXT NOT NULL,
  pix_key TEXT,
  pix_receiver_name TEXT,
  pix_city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de participantes
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_participants_game_id ON public.participants(game_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON public.participants(status);
CREATE INDEX IF NOT EXISTS idx_games_game_date ON public.games(game_date);

-- Habilitar RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para games (acesso público para leitura)
CREATE POLICY "games_select_public" ON public.games FOR SELECT USING (true);
CREATE POLICY "games_insert_public" ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY "games_update_public" ON public.games FOR UPDATE USING (true);
CREATE POLICY "games_delete_public" ON public.games FOR DELETE USING (true);

-- Políticas RLS para participants (acesso público)
CREATE POLICY "participants_select_public" ON public.participants FOR SELECT USING (true);
CREATE POLICY "participants_insert_public" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "participants_update_public" ON public.participants FOR UPDATE USING (true);
CREATE POLICY "participants_delete_public" ON public.participants FOR DELETE USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_games_updated_at ON public.games;
CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON public.games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_participants_updated_at ON public.participants;
CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON public.participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
