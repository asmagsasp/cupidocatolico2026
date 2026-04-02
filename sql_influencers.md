
-- 🎭 TABELA DE INFLUENCIADORES: Onde a evangelização ganha escala
-- Cada influenciador tem um link único e recebe comissão por assinaturas

CREATE TABLE IF NOT EXISTS public.influencers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- O link será app.com/?ref=slug
    pix_key TEXT NOT NULL,
    commission_pct NUMERIC DEFAULT 10, -- Percentual de comissão
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Adicionar campo de referência no perfil do usuário
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by_influencer_id UUID REFERENCES public.influencers(id);

-- Atualizar tabela de assinaturas para registrar a comissão no ato do pagamento
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS influencer_id UUID REFERENCES public.influencers(id),
ADD COLUMN IF NOT EXISTS plan_value NUMERIC,
ADD COLUMN IF NOT EXISTS commission_value NUMERIC,
ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS commission_paid_at TIMESTAMP WITH TIME ZONE;

-- Habilitar RLS
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;

-- Apenas o admin pode ver tudo (Abel)
-- Limpar política existente se houver para evitar erro 42710
DROP POLICY IF EXISTS "Public read influencers by slug" ON public.influencers;

-- Criar a política novamente
CREATE POLICY "Public read influencers by slug" ON public.influencers
    FOR SELECT USING (true);
