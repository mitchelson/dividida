-- Adicionar coluna para indicar se a lista está fechada
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS list_closed BOOLEAN DEFAULT FALSE;
