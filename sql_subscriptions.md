
-- 🛡️ TABELA DE ASSINATURAS: Cupido Católico
-- Esta tabela controla quem pagou e quanto tempo resta de acesso premium

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_origem UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_origem TEXT,
    data_aquisicao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    data_expiracao TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo_assinatura TEXT NOT NULL CHECK (tipo_assinatura IN ('Mensal', 'Semestral', 'Anual')),
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Permissões (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- O usuário só pode ver sua própria assinatura
CREATE POLICY "Users can see their own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = id_origem);

-- Para simplificar o teste, permitimos insert pelo anon (em produção, o backend do gateway faria isso)
CREATE POLICY "Anyone can insert subscriptions for testing" ON public.subscriptions
    FOR INSERT WITH CHECK (true);
