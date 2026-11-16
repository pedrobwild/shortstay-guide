ALTER TABLE public.radar_fontes DROP CONSTRAINT IF EXISTS radar_fontes_tipo_check;
ALTER TABLE public.radar_fontes ADD CONSTRAINT radar_fontes_tipo_check
  CHECK (tipo = ANY (ARRAY['publica'::text, 'propria'::text, 'estimativa'::text, 'licenciada'::text]));