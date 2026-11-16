-- =========================================================
-- Radar Bewild — séries diárias de mercado, calendário de eventos e efeito
-- medido por evento e bairro (decisão do Pedro, 16/11/2026).
--
-- Para que serve: o Radar só tinha médias de jan–set/2026 por bairro. Com a série
-- por data dá para medir o efeito de eventos, a sazonalidade observada e a
-- evolução das reservas futuras. Ver docs/estudo-eventos-2026-11-16.md.
--
-- Só estrutura. Os dados entram por SQL direto, com aprovação do Pedro.
--
-- Licença: a série diária é dado licenciado bruto (AirDNA) e fica restrita ao
-- papel admin. O efeito por evento só aparece ao público quando a linha é marcada
-- como publicável, depois de conferido o contrato da fonte.
-- Idempotente (pode rodar de novo sem efeito).
-- =========================================================

-- ---------------------------------------------------------
-- 1) radar_series_diarias — uma linha por bairro, data, recorte e leitura
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.radar_series_diarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fonte_id text NOT NULL REFERENCES public.radar_fontes(id),
  bairro text NOT NULL CHECK (char_length(btrim(bairro)) BETWEEN 2 AND 100),
  cidade text NOT NULL DEFAULT 'São Paulo' CHECK (char_length(btrim(cidade)) BETWEEN 2 AND 100),
  submercado_ref text CHECK (submercado_ref IS NULL OR char_length(submercado_ref) <= 60),
  data date NOT NULL,
  tipo_serie text NOT NULL CHECK (tipo_serie IN ('realizado', 'futuro')),
  recorte text NOT NULL DEFAULT 'todos' CHECK (recorte IN ('todos', 'ate_1_quarto')),
  diaria_media numeric CHECK (diaria_media IS NULL OR diaria_media >= 0),
  reservados integer CHECK (reservados IS NULL OR reservados >= 0),
  disponiveis integer CHECK (disponiveis IS NULL OR disponiveis >= 0),
  diaria_disponivel numeric CHECK (diaria_disponivel IS NULL OR diaria_disponivel >= 0),
  moeda text NOT NULL DEFAULT 'USD' CHECK (moeda ~ '^[A-Z]{3}$'),
  lido_em date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT radar_series_diarias_leitura_unica
    UNIQUE (fonte_id, cidade, bairro, data, tipo_serie, recorte, lido_em),
  -- Série realizada só existe até o dia da leitura; a futura, do dia da leitura em diante.
  CONSTRAINT radar_series_diarias_data_coerente
    CHECK ((tipo_serie = 'realizado' AND data <= lido_em) OR (tipo_serie = 'futuro' AND data >= lido_em))
);

CREATE INDEX IF NOT EXISTS radar_series_diarias_bairro_data_idx
  ON public.radar_series_diarias (bairro, data, id);

-- GRANTs (sem anon: dado licenciado bruto não vai para o público)
REVOKE ALL ON public.radar_series_diarias FROM anon, authenticated;
GRANT SELECT, INSERT ON public.radar_series_diarias TO authenticated;
GRANT ALL ON public.radar_series_diarias TO service_role;

-- RLS
ALTER TABLE public.radar_series_diarias ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "radar_series_diarias_admin_select" ON public.radar_series_diarias;
CREATE POLICY "radar_series_diarias_admin_select" ON public.radar_series_diarias
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "radar_series_diarias_admin_insert" ON public.radar_series_diarias;
CREATE POLICY "radar_series_diarias_admin_insert" ON public.radar_series_diarias
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------
-- 2) radar_eventos — calendário com fonte (substitui a lista fixa do código)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.radar_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 2 AND 120),
  categoria text NOT NULL
    CHECK (categoria IN ('festival', 'esporte', 'feira', 'show_estadio', 'feriado', 'cultura')),
  local text CHECK (local IS NULL OR char_length(local) <= 160),
  cidade text NOT NULL DEFAULT 'São Paulo' CHECK (char_length(btrim(cidade)) BETWEEN 2 AND 100),
  lat numeric CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
  lng numeric CHECK (lng IS NULL OR lng BETWEEN -180 AND 180),
  inicio date NOT NULL,
  fim date NOT NULL,
  data_confirmada boolean NOT NULL DEFAULT false,
  fonte_titulo text CHECK (fonte_titulo IS NULL OR char_length(fonte_titulo) <= 120),
  fonte_url text CHECK (fonte_url IS NULL OR fonte_url ~ '^https://'),
  fonte_consultada_em date,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT radar_eventos_periodo CHECK (inicio <= fim),
  CONSTRAINT radar_eventos_unico UNIQUE (nome, inicio),
  -- Data confirmada e evento publicado exigem fonte com link e dia da consulta.
  CONSTRAINT radar_eventos_confirmado_com_fonte
    CHECK (NOT (data_confirmada OR status = 'publicado') OR (fonte_url IS NOT NULL AND fonte_consultada_em IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS radar_eventos_status_inicio_idx
  ON public.radar_eventos (status, inicio, id);

CREATE OR REPLACE FUNCTION public.atualizar_radar_evento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.atualizado_em = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS atualizar_radar_evento ON public.radar_eventos;
CREATE TRIGGER atualizar_radar_evento
  BEFORE UPDATE ON public.radar_eventos
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_radar_evento();

-- GRANTs (sem DELETE: o admin arquiva)
REVOKE ALL ON public.radar_eventos FROM anon, authenticated;
GRANT SELECT ON public.radar_eventos TO anon;
GRANT SELECT, INSERT, UPDATE ON public.radar_eventos TO authenticated;
GRANT ALL ON public.radar_eventos TO service_role;

-- RLS
ALTER TABLE public.radar_eventos ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "radar_eventos_publicados" ON public.radar_eventos;
CREATE POLICY "radar_eventos_publicados" ON public.radar_eventos
  FOR SELECT TO anon, authenticated
  USING (status = 'publicado');

DROP POLICY IF EXISTS "radar_eventos_admin_select" ON public.radar_eventos;
CREATE POLICY "radar_eventos_admin_select" ON public.radar_eventos
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "radar_eventos_admin_insert" ON public.radar_eventos;
CREATE POLICY "radar_eventos_admin_insert" ON public.radar_eventos
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "radar_eventos_admin_update" ON public.radar_eventos;
CREATE POLICY "radar_eventos_admin_update" ON public.radar_eventos
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------
-- 3) radar_evento_efeitos — efeito medido na diária, por evento e bairro
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.radar_evento_efeitos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.radar_eventos(id) ON DELETE CASCADE,
  bairro text NOT NULL CHECK (char_length(btrim(bairro)) BETWEEN 2 AND 100),
  recorte text NOT NULL DEFAULT 'todos' CHECK (recorte IN ('todos', 'ate_1_quarto')),
  fonte_id text NOT NULL REFERENCES public.radar_fontes(id),
  -- Variação da diária nas noites do evento contra a referência (ex.: 11.2 = +11,2%).
  efeito_diaria_pct numeric NOT NULL CHECK (efeito_diaria_pct BETWEEN -100 AND 1000),
  -- Parcela das janelas comuns do bairro com efeito igual ou maior (teste de placebo).
  p_placebo numeric CHECK (p_placebo IS NULL OR p_placebo BETWEEN 0 AND 1),
  noites integer NOT NULL CHECK (noites BETWEEN 1 AND 31),
  janelas_placebo integer CHECK (janelas_placebo IS NULL OR janelas_placebo >= 0),
  metodo text NOT NULL CHECK (char_length(btrim(metodo)) BETWEEN 10 AND 600),
  lido_em date NOT NULL,
  calculado_em date NOT NULL,
  -- Só vira verdadeiro depois de conferido o contrato da fonte.
  publicavel boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT radar_evento_efeitos_unico UNIQUE (evento_id, bairro, recorte, fonte_id, lido_em),
  CONSTRAINT radar_evento_efeitos_datas CHECK (lido_em <= calculado_em)
);

CREATE INDEX IF NOT EXISTS radar_evento_efeitos_evento_idx
  ON public.radar_evento_efeitos (evento_id, bairro, id);

-- GRANTs
REVOKE ALL ON public.radar_evento_efeitos FROM anon, authenticated;
GRANT SELECT ON public.radar_evento_efeitos TO anon;
GRANT SELECT, INSERT, UPDATE ON public.radar_evento_efeitos TO authenticated;
GRANT ALL ON public.radar_evento_efeitos TO service_role;

-- RLS
ALTER TABLE public.radar_evento_efeitos ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "radar_evento_efeitos_publicaveis" ON public.radar_evento_efeitos;
CREATE POLICY "radar_evento_efeitos_publicaveis" ON public.radar_evento_efeitos
  FOR SELECT TO anon, authenticated
  USING (
    publicavel
    AND EXISTS (
      SELECT 1 FROM public.radar_eventos e
      WHERE e.id = radar_evento_efeitos.evento_id AND e.status = 'publicado'
    )
  );

DROP POLICY IF EXISTS "radar_evento_efeitos_admin_select" ON public.radar_evento_efeitos;
CREATE POLICY "radar_evento_efeitos_admin_select" ON public.radar_evento_efeitos
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "radar_evento_efeitos_admin_insert" ON public.radar_evento_efeitos;
CREATE POLICY "radar_evento_efeitos_admin_insert" ON public.radar_evento_efeitos
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "radar_evento_efeitos_admin_update" ON public.radar_evento_efeitos;
CREATE POLICY "radar_evento_efeitos_admin_update" ON public.radar_evento_efeitos
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
