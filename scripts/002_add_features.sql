-- Adicionar coluna de categoria na tabela games
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'futebol';

-- Adicionar coluna de pagamento e badges na tabela participants
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
