CREATE TABLE public.bairro_ajustes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bairro text NOT NULL UNIQUE,
  diaria numeric NOT NULL CHECK (diaria > 0 AND diaria < 100000),
  ocupacao numeric NOT NULL CHECK (ocupacao > 0 AND ocupacao <= 100),
  fonte text NOT NULL CHECK (char_length(fonte) BETWEEN 3 AND 300),
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bairro_ajustes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bairro_ajustes TO authenticated;
GRANT ALL ON public.bairro_ajustes TO service_role;
ALTER TABLE public.bairro_ajustes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública dos ajustes" ON public.bairro_ajustes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins gerenciam ajustes" ON public.bairro_ajustes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_bairro_ajustes_updated_at BEFORE UPDATE ON public.bairro_ajustes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();