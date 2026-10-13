-- 1) Registro idempotente da correção de leitura de leads/eventos (só admin)
DROP POLICY IF EXISTS "Allow authenticated read on guide_leads" ON public.guide_leads;
DROP POLICY IF EXISTS "Admins read guide_leads" ON public.guide_leads;
CREATE POLICY "Admins read guide_leads" ON public.guide_leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Allow authenticated read on guide_events" ON public.guide_events;
DROP POLICY IF EXISTS "Admins read guide_events" ON public.guide_events;
CREATE POLICY "Admins read guide_events" ON public.guide_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Base única de dados de mercado
CREATE TABLE IF NOT EXISTS public.radar_fontes (
  id text PRIMARY KEY,
  nome text NOT NULL,
  url text,
  tipo text NOT NULL CHECK (tipo IN ('publica','propria','estimativa')),
  metodologia_declarada boolean NOT NULL DEFAULT false,
  observacao text
);
GRANT SELECT ON public.radar_fontes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.radar_fontes TO authenticated;
GRANT ALL ON public.radar_fontes TO service_role;
ALTER TABLE public.radar_fontes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de radar_fontes" ON public.radar_fontes;
CREATE POLICY "Leitura pública de radar_fontes" ON public.radar_fontes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins gerenciam radar_fontes" ON public.radar_fontes;
CREATE POLICY "Admins gerenciam radar_fontes" ON public.radar_fontes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.radar_observacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador text NOT NULL CHECK (indicador IN ('ocupacao_media_pct','adr_medio_brl','adr_p25_brl','adr_mediana_brl','adr_p75_brl','receita_anual_brl','anuncios_ativos')),
  bairro text NOT NULL,
  cidade text NOT NULL DEFAULT 'São Paulo',
  periodo_inicio date,
  periodo_fim date,
  valor numeric NOT NULL,
  unidade text NOT NULL,
  amostra_n integer,
  fonte_id text NOT NULL REFERENCES public.radar_fontes(id),
  url_origem text,
  coletado_em date NOT NULL,
  publicado_em date,
  observacao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT radar_observacoes_unica UNIQUE NULLS NOT DISTINCT (indicador, bairro, cidade, periodo_inicio, periodo_fim, fonte_id)
);
CREATE INDEX IF NOT EXISTS radar_observacoes_atual_idx ON public.radar_observacoes (bairro, indicador, coletado_em DESC) WHERE ativo;
GRANT SELECT ON public.radar_observacoes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.radar_observacoes TO authenticated;
GRANT ALL ON public.radar_observacoes TO service_role;
ALTER TABLE public.radar_observacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de radar_observacoes" ON public.radar_observacoes;
CREATE POLICY "Leitura pública de radar_observacoes" ON public.radar_observacoes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins gerenciam radar_observacoes" ON public.radar_observacoes;
CREATE POLICY "Admins gerenciam radar_observacoes" ON public.radar_observacoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- View: observação ativa mais recente por (bairro, cidade, indicador); confiança calculada
CREATE OR REPLACE VIEW public.radar_bairro_atual WITH (security_invoker = true) AS
SELECT DISTINCT ON (o.cidade, o.bairro, o.indicador)
  o.id, o.indicador, o.bairro, o.cidade, o.periodo_inicio, o.periodo_fim, o.valor, o.unidade,
  o.amostra_n, o.fonte_id, f.nome AS fonte_nome, f.tipo AS fonte_tipo, f.url AS fonte_url,
  f.metodologia_declarada, o.url_origem, o.coletado_em, o.publicado_em, o.observacao,
  (CURRENT_DATE - o.coletado_em) AS idade_dias,
  CASE
    WHEN f.tipo = 'publica' AND COALESCE(o.amostra_n, 0) >= 1000 AND (CURRENT_DATE - o.coletado_em) <= 120 THEN 'alta'
    WHEN f.tipo = 'publica' AND (COALESCE(o.amostra_n, 0) >= 200 OR (CURRENT_DATE - o.coletado_em) <= 240) THEN 'media'
    ELSE 'baixa'
  END AS confianca
FROM public.radar_observacoes o
JOIN public.radar_fontes f ON f.id = o.fonte_id
WHERE o.ativo
ORDER BY o.cidade, o.bairro, o.indicador, o.coletado_em DESC, o.periodo_fim DESC NULLS LAST, o.created_at DESC;
GRANT SELECT ON public.radar_bairro_atual TO anon, authenticated, service_role;

-- 3) Carga inicial (valores idênticos a bairrosCurados.ts e guestfavorites-2026-10-13.csv)
INSERT INTO public.radar_fontes (id, nome, url, tipo, metodologia_declarada, observacao) VALUES
  ('guestfavorites', 'GuestFavorites', 'https://www.guestfavorites.com', 'publica', false, 'página não declara metodologia; número em destaque é média, não mediana; não específico de studio'),
  ('estimativa_bewild', 'Estimativa Bewild', NULL, 'estimativa', false, 'valores Bewild anteriores, sem fonte pública atualizada')
ON CONFLICT (id) DO NOTHING;

WITH gf(bairro, ini, fim, pub, occ, adr, rec, n, p25, med, p75, url, obs) AS (VALUES
  ('Pinheiros','2026-01-01','2026-09-30','2026-10-08',62,300,68335,2424,171,232,301,'https://www.guestfavorites.com/airbnb-occupancy-rates-in-pinheiros-sao-paulo-brazil',NULL),
  ('Bela Vista','2026-01-01','2026-09-30','2026-10-08',64,237,54954,1983,140,198,256,'https://www.guestfavorites.com/airbnb-occupancy-rates-in-bela-vista-sao-paulo-brazil',NULL),
  ('Itaim Bibi','2026-01-01','2026-09-30','2026-10-08',59,359,77390,3884,180,279,404,'https://www.guestfavorites.com/airbnb-occupancy-rates-in-itaim-bibi-sao-paulo-brazil',NULL),
  ('Jardim Paulista','2026-01-01','2026-09-30','2026-10-08',62,319,72372,3147,183,251,327,'https://www.guestfavorites.com/airbnb-occupancy-rates-in-jardim-paulista-sao-paulo-brazil',NULL),
  ('Liberdade','2026-01-01','2026-07-31','2026-08-20',61,230,51079,553,132,195,251,'https://www.guestfavorites.com/airbnb-occupancy-rates-in-liberdade-sao-paulo-brazil','texto da página também cita receita típica de R$ 35.938, conflitando com R$ 51.079'),
  ('Moema','2026-01-01','2026-09-30','2026-10-08',61,263,58542,2621,167,225,288,'https://www.guestfavorites.com/airbnb-occupancy-rates-in-moema-sao-paulo-brazil',NULL),
  ('República','2026-01-01','2026-07-31','2026-08-20',63,203,46492,3079,117,166,210,'https://www.guestfavorites.com/airbnb-occupancy-rates-in-republica-sao-paulo-brazil',NULL),
  ('Vila Mariana','2026-01-01','2026-09-30','2026-10-02',60,226,49446,2238,143,194,235,'https://www.guestfavorites.com/airbnb-occupancy-rates-in-vila-mariana-sao-paulo-brazil',NULL),
  ('Mooca','2026-01-01','2026-09-30','2026-10-08',59,241,51765,85,27,195,268,'https://www.guestfavorites.com/airbnb-occupancy-rates-in-mooca-sao-paulo-brazil','amostra pequena (85 anúncios)'),
  ('Perdizes','2026-01-01','2026-09-30','2026-10-08',53,254,49423,1752,174,217,276,'https://www.guestfavorites.com/airbnb-occupancy-rates-in-perdizes-sao-paulo-brazil',NULL),
  ('São Paulo','2026-01-01','2026-09-30','2026-10-08',60,266,58259,34854,NULL,NULL,NULL,'https://www.guestfavorites.com/airbnb-occupancy-rates-in-sao-paulo-brasil','referência da cidade')
), linhas AS (
  SELECT gf.*, i.indicador, i.valor, i.unidade FROM gf
  CROSS JOIN LATERAL (VALUES
    ('ocupacao_media_pct', gf.occ::numeric, 'pct'),
    ('adr_medio_brl', gf.adr::numeric, 'BRL'),
    ('adr_p25_brl', gf.p25::numeric, 'BRL'),
    ('adr_mediana_brl', gf.med::numeric, 'BRL'),
    ('adr_p75_brl', gf.p75::numeric, 'BRL'),
    ('receita_anual_brl', gf.rec::numeric, 'BRL/ano'),
    ('anuncios_ativos', gf.n::numeric, 'anuncios')
  ) AS i(indicador, valor, unidade)
  WHERE i.valor IS NOT NULL
)
INSERT INTO public.radar_observacoes (indicador, bairro, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao)
SELECT indicador, bairro, ini::date, fim::date, valor, unidade, n, 'guestfavorites', url, DATE '2026-10-13', pub::date, obs FROM linhas
ON CONFLICT ON CONSTRAINT radar_observacoes_unica DO NOTHING;

WITH est(bairro, mn, mx, occ) AS (VALUES ('Brooklin',290,430,75), ('Consolação',260,390,63), ('Vila Olímpia',330,500,79))
INSERT INTO public.radar_observacoes (indicador, bairro, valor, unidade, fonte_id, coletado_em, observacao)
SELECT i.indicador, est.bairro, i.valor, i.unidade, 'estimativa_bewild', DATE '2026-10-13', 'valores Bewild anteriores, sem fonte pública atualizada'
FROM est CROSS JOIN LATERAL (VALUES
  ('ocupacao_media_pct', est.occ::numeric, 'pct'),
  ('adr_medio_brl', ((est.mn + est.mx) / 2.0)::numeric, 'BRL'),
  ('adr_p25_brl', est.mn::numeric, 'BRL'),
  ('adr_p75_brl', est.mx::numeric, 'BRL')
) AS i(indicador, valor, unidade)
ON CONFLICT ON CONSTRAINT radar_observacoes_unica DO NOTHING;

COMMENT ON TABLE public.bairro_airbnb_sp IS 'LEGADA (base 2025): diária/ocupação substituídas por radar_observacoes / radar_bairro_atual. Mantida só para as demais métricas de estimativa.';