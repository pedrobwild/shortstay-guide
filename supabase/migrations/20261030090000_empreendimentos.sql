-- =========================================================
-- Radar Bewild — empreendimentos em destaque (catálogo público, decisão do Pedro,
-- 30/10/2026): prédios de São Paulo onde a Bewild já atua, com bairro, endereço,
-- incorporadora, situação, diferenciais e a página oficial usada como fonte.
--
-- Privacidade: a tabela guarda só o prédio. Nome de cliente, número de unidade,
-- contrato e valores nunca entram aqui (o selo diz apenas que a Bewild atua no
-- prédio, sem contagem).
--
-- Leitura pública: só linhas com status 'publicado'. Escrita: só o papel admin.
-- Fotos: bucket público "empreendimentos" (leitura pela URL pública); envio,
-- troca e remoção só pelo admin. Idempotente (pode rodar de novo sem efeito).
-- =========================================================

CREATE TABLE IF NOT EXISTS public.empreendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 120),
  nome text NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 2 AND 120),
  bairro text NOT NULL CHECK (char_length(btrim(bairro)) BETWEEN 2 AND 80),
  endereco text CHECK (endereco IS NULL OR char_length(endereco) <= 160),
  incorporadora text CHECK (incorporadora IS NULL OR char_length(incorporadora) <= 120),
  tipologias text CHECK (tipologias IS NULL OR char_length(tipologias) <= 160),
  situacao text CHECK (situacao IS NULL OR situacao IN ('lancamento', 'em_obras', 'pronto')),
  entrega text CHECK (entrega IS NULL OR char_length(entrega) <= 40),
  resumo text NOT NULL DEFAULT '' CHECK (char_length(resumo) <= 600),
  diferenciais text[] NOT NULL DEFAULT '{}' CHECK (cardinality(diferenciais) <= 10),
  fonte_url text CHECK (fonte_url IS NULL OR fonte_url ~ '^https://'),
  fonte_titulo text CHECK (fonte_titulo IS NULL OR char_length(fonte_titulo) <= 120),
  fonte_consultada_em date,
  foto_url text CHECK (foto_url IS NULL OR foto_url ~ '^https://'),
  foto_alt text CHECK (foto_alt IS NULL OR char_length(foto_alt) <= 200),
  foto_credito text CHECK (foto_credito IS NULL OR char_length(foto_credito) <= 120),
  selo_bewild boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS empreendimentos_status_nome_idx ON public.empreendimentos (status, nome, id);
CREATE INDEX IF NOT EXISTS empreendimentos_bairro_idx ON public.empreendimentos (bairro);

CREATE OR REPLACE FUNCTION public.atualizar_empreendimento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.atualizado_em = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS atualizar_empreendimento ON public.empreendimentos;
CREATE TRIGGER atualizar_empreendimento
  BEFORE UPDATE ON public.empreendimentos
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_empreendimento();

-- 1) GRANTs. O REVOKE vem antes porque os privilégios padrão do Supabase dão ALL a
-- anon e authenticated em toda tabela nova do public. Sem DELETE: o admin arquiva.
REVOKE ALL ON public.empreendimentos FROM anon, authenticated;
GRANT SELECT ON public.empreendimentos TO anon;
GRANT SELECT, INSERT, UPDATE ON public.empreendimentos TO authenticated;
GRANT ALL ON public.empreendimentos TO service_role;

-- 2) RLS
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;

-- 3) Policies
DROP POLICY IF EXISTS "empreendimentos_publicados" ON public.empreendimentos;
CREATE POLICY "empreendimentos_publicados" ON public.empreendimentos
  FOR SELECT TO anon, authenticated
  USING (status = 'publicado');

DROP POLICY IF EXISTS "empreendimentos_admin_select" ON public.empreendimentos;
CREATE POLICY "empreendimentos_admin_select" ON public.empreendimentos
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "empreendimentos_admin_insert" ON public.empreendimentos;
CREATE POLICY "empreendimentos_admin_insert" ON public.empreendimentos
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "empreendimentos_admin_update" ON public.empreendimentos;
CREATE POLICY "empreendimentos_admin_update" ON public.empreendimentos
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Fotos dos prédios: bucket público (só imagens, até 5 MB). Configuração de
-- infraestrutura, junto das policies que dependem dele.
-- =========================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('empreendimentos', 'empreendimentos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- A remoção pela API do Storage lê o objeto antes de apagar: o admin precisa de SELECT.
DROP POLICY IF EXISTS "empreendimentos_fotos_admin_select" ON storage.objects;
CREATE POLICY "empreendimentos_fotos_admin_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'empreendimentos' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "empreendimentos_fotos_admin_insert" ON storage.objects;
CREATE POLICY "empreendimentos_fotos_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'empreendimentos' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "empreendimentos_fotos_admin_update" ON storage.objects;
CREATE POLICY "empreendimentos_fotos_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'empreendimentos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'empreendimentos' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "empreendimentos_fotos_admin_delete" ON storage.objects;
CREATE POLICY "empreendimentos_fotos_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'empreendimentos' AND public.has_role(auth.uid(), 'admin'));
