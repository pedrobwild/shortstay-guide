CREATE TABLE public.radar_noticias (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 titulo text NOT NULL,
 resumo text NOT NULL DEFAULT '',
 url text NOT NULL,
 destino text NOT NULL DEFAULT '/mercado',
 status text NOT NULL DEFAULT 'rascunho',
 criado_em timestamptz NOT NULL DEFAULT now(),
 atualizado_em timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT radar_noticias_titulo CHECK (char_length(trim(titulo)) BETWEEN 3 AND 180),
 CONSTRAINT radar_noticias_resumo CHECK (char_length(resumo) <= 600),
 CONSTRAINT radar_noticias_url CHECK (url ~ '^https://(www\.)?bewild\.com\.br/conteudos/[a-z0-9][a-z0-9/-]*$'),
 CONSTRAINT radar_noticias_destino CHECK (destino IN ('/ranking', '/mercado') OR destino ~ '^/(bairro|guia)/[a-z0-9]+(-[a-z0-9]+)*$'),
 CONSTRAINT radar_noticias_status CHECK (status IN ('rascunho', 'publicado', 'arquivado'))
);
GRANT SELECT ON public.radar_noticias TO anon;
GRANT SELECT, INSERT, UPDATE ON public.radar_noticias TO authenticated;
GRANT ALL ON public.radar_noticias TO service_role;
ALTER TABLE public.radar_noticias ENABLE ROW LEVEL SECURITY;
CREATE POLICY noticias_publicadas ON public.radar_noticias FOR SELECT TO anon, authenticated USING (status = 'publicado');
CREATE POLICY noticias_admin_select ON public.radar_noticias FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY noticias_admin_insert ON public.radar_noticias FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY noticias_admin_update ON public.radar_noticias FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX radar_noticias_destino_status ON public.radar_noticias(destino, status);
CREATE FUNCTION public.atualizar_noticia_radar() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.atualizado_em = now(); RETURN NEW; END; $$;
CREATE TRIGGER atualizar_noticia_radar BEFORE UPDATE ON public.radar_noticias FOR EACH ROW EXECUTE FUNCTION public.atualizar_noticia_radar();