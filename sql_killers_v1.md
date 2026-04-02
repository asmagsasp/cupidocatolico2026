
-- 🏹 MIGRATION: Cupido Católico 2.0 - Funções Matadoras
-- 1. Upgrade na Tabela de Perfis
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS paroquia TEXT,
ADD COLUMN IF NOT EXISTS pastorais TEXT,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- 2. Garantir que a tabela matches existe (já existe, mas garantindo RLS)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see who liked them" ON public.matches;
CREATE POLICY "Users can see who liked them" ON public.matches
  FOR SELECT USING (auth.uid() = target_id);

-- 3. Função para checar likes recebidos (quem curtiu o user logado)
-- Isso será usado na aba "Quem me Curtiu"
