CREATE TABLE public.radar_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL CHECK (length(btrim(nome)) BETWEEN 2 AND 80),
  tipo text NOT NULL CHECK (tipo IN ('post','bairro')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo, nome)
);
GRANT SELECT ON public.radar_categorias TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.radar_categorias TO authenticated;
GRANT ALL ON public.radar_categorias TO service_role;
ALTER TABLE public.radar_categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categorias públicas" ON public.radar_categorias FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin gerencia categorias" ON public.radar_categorias FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.radar_bairro_categorias (
  bairro text NOT NULL CHECK (length(btrim(bairro)) BETWEEN 2 AND 100),
  categoria_id uuid NOT NULL REFERENCES public.radar_categorias(id) ON DELETE CASCADE,
  PRIMARY KEY (bairro, categoria_id)
);
GRANT SELECT ON public.radar_bairro_categorias TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.radar_bairro_categorias TO authenticated;
GRANT ALL ON public.radar_bairro_categorias TO service_role;
ALTER TABLE public.radar_bairro_categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categorias de bairro públicas" ON public.radar_bairro_categorias FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin gerencia categorias de bairro" ON public.radar_bairro_categorias FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.radar_noticias ADD COLUMN categoria_id uuid REFERENCES public.radar_categorias(id) ON DELETE SET NULL;