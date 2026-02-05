-- Adicionar coluna de localização na tabela games
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS location TEXT DEFAULT NULL;
