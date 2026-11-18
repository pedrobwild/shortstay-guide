-- =========================================================
-- Radar Bewild — conteúdos próprios (decisão do Pedro, 18/11/2026): artigos, releases
-- de imprensa e estudos com página por texto em /conteudos/<slug>.
--
-- Sem tabela nova: a tabela radar_noticias (links para o bewild.com.br) ganha o tipo
-- e os campos do texto. Linhas existentes viram tipo 'link' e seguem iguais.
--
-- Leitura e escrita: as policies e os GRANTs que a tabela já tem continuam valendo
-- (leitura pública de publicados, escrita só pelo papel admin). Esta migration não
-- mexe neles. Capa: bucket público "conteudos"; envio, troca e remoção só pelo admin.
-- Idempotente (pode rodar de novo sem efeito).
-- =========================================================

ALTER TABLE public.radar_noticias
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'link',
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS corpo text,
  ADD COLUMN IF NOT EXISTS capa_url text,
  ADD COLUMN IF NOT EXISTS capa_alt text,
  ADD COLUMN IF NOT EXISTS autor_nome text,
  ADD COLUMN IF NOT EXISTS seo_titulo text,
  ADD COLUMN IF NOT EXISTS seo_descricao text,
  ADD COLUMN IF NOT EXISTS canonical_externo text,
  ADD COLUMN IF NOT EXISTS publicado_em timestamptz;

-- Texto próprio não tem link externo.
ALTER TABLE public.radar_noticias ALTER COLUMN url DROP NOT NULL;

ALTER TABLE public.radar_noticias DROP CONSTRAINT IF EXISTS radar_noticias_tipo_valido;
ALTER TABLE public.radar_noticias ADD CONSTRAINT radar_noticias_tipo_valido
  CHECK (tipo IN ('link', 'artigo', 'release', 'estudo'));

-- Link exige o endereço do artigo; texto próprio exige endereço (slug) e corpo.
ALTER TABLE public.radar_noticias DROP CONSTRAINT IF EXISTS radar_noticias_forma_por_tipo;
ALTER TABLE public.radar_noticias ADD CONSTRAINT radar_noticias_forma_por_tipo
  CHECK (
    (tipo = 'link' AND url IS NOT NULL AND slug IS NULL AND corpo IS NULL)
    OR (tipo <> 'link' AND url IS NULL AND slug IS NOT NULL AND corpo IS NOT NULL AND char_length(btrim(corpo)) >= 200)
  );

-- Slug vira caminho de arquivo no build: só minúsculas, números e hífens; os nomes dos
-- índices por tipo e do feed são reservados.
ALTER TABLE public.radar_noticias DROP CONSTRAINT IF EXISTS radar_noticias_slug_valido;
ALTER TABLE public.radar_noticias ADD CONSTRAINT radar_noticias_slug_valido
  CHECK (
    slug IS NULL
    OR (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 90
        AND slug NOT IN ('artigos', 'releases', 'estudos', 'rss', 'pagina'))
  );

ALTER TABLE public.radar_noticias DROP CONSTRAINT IF EXISTS radar_noticias_campos_do_texto;
ALTER TABLE public.radar_noticias ADD CONSTRAINT radar_noticias_campos_do_texto
  CHECK (
    (corpo IS NULL OR char_length(corpo) <= 60000)
    AND (capa_url IS NULL OR capa_url ~ '^https://\S+/storage/v1/object/public/conteudos/\S+$')
    AND (capa_url IS NULL OR (capa_alt IS NOT NULL AND char_length(btrim(capa_alt)) BETWEEN 1 AND 200))
    AND (autor_nome IS NULL OR char_length(autor_nome) <= 80)
    AND (seo_titulo IS NULL OR char_length(seo_titulo) <= 60)
    AND (seo_descricao IS NULL OR char_length(seo_descricao) <= 160)
    AND (canonical_externo IS NULL OR canonical_externo ~ '^https://(www\.)?bewild\.com\.br/[a-z0-9][a-z0-9/-]*$')
  );

CREATE UNIQUE INDEX IF NOT EXISTS radar_noticias_slug_unico ON public.radar_noticias (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS radar_noticias_publicados_idx ON public.radar_noticias (status, tipo, publicado_em DESC, id);

-- Data de publicação: gravada na primeira vez que a linha fica 'publicado' e nunca mais
-- alterada (nem por quem edita). Regra que depende do relógio fica em trigger, não em CHECK.
CREATE OR REPLACE FUNCTION public.radar_noticias_publicado_em()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.publicado_em IS NOT NULL THEN
    NEW.publicado_em = OLD.publicado_em;
  ELSIF NEW.status = 'publicado' THEN
    NEW.publicado_em = now();
  ELSE
    NEW.publicado_em = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS radar_noticias_publicado_em ON public.radar_noticias;
CREATE TRIGGER radar_noticias_publicado_em
  BEFORE INSERT OR UPDATE ON public.radar_noticias
  FOR EACH ROW EXECUTE FUNCTION public.radar_noticias_publicado_em();

-- =========================================================
-- Capas dos textos: bucket público (só imagens, até 5 MB).
-- =========================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('conteudos', 'conteudos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "conteudos_capas_admin_select" ON storage.objects;
CREATE POLICY "conteudos_capas_admin_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'conteudos' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "conteudos_capas_admin_insert" ON storage.objects;
CREATE POLICY "conteudos_capas_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'conteudos' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "conteudos_capas_admin_update" ON storage.objects;
CREATE POLICY "conteudos_capas_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'conteudos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'conteudos' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "conteudos_capas_admin_delete" ON storage.objects;
CREATE POLICY "conteudos_capas_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'conteudos' AND public.has_role(auth.uid(), 'admin'));
