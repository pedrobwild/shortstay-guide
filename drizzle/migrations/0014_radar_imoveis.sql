CREATE TABLE public.radar_imoveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL CHECK (char_length(titulo) BETWEEN 3 AND 140),
  descricao text NOT NULL DEFAULT '' CHECK (char_length(descricao) <= 1200),
  bairro text NOT NULL DEFAULT '' CHECK (char_length(bairro) <= 80),
  foto_url text NOT NULL CHECK (foto_url ~ '^https://' AND char_length(foto_url) <= 1000),
  anuncio_url text NOT NULL CHECK (anuncio_url ~ '^https://' AND char_length(anuncio_url) <= 1000),
  publicado boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.radar_imoveis TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.radar_imoveis TO authenticated;
GRANT ALL ON public.radar_imoveis TO service_role;
ALTER TABLE public.radar_imoveis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitantes veem imoveis publicados" ON public.radar_imoveis FOR SELECT TO anon, authenticated USING (publicado OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins incluem imoveis" ON public.radar_imoveis FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins editam imoveis" ON public.radar_imoveis FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins removem imoveis" ON public.radar_imoveis FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER radar_imoveis_atualizado BEFORE UPDATE ON public.radar_imoveis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();