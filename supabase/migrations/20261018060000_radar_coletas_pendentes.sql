-- Coleta assistida: propostas de coleta lidas das páginas públicas da GuestFavorites
-- ficam aqui até um admin aprovar (vira coleta via admin_registrar_coleta_radar) ou
-- descartar. Nada entra em radar_observacoes sem aprovação.
CREATE TABLE public.radar_coletas_pendentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bairro text NOT NULL,
  cidade text NOT NULL DEFAULT 'São Paulo',
  fonte_id text NOT NULL REFERENCES public.radar_fontes(id),
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  coletado_em date NOT NULL,
  publicado_em date,
  amostra_n integer NOT NULL,
  url_origem text NOT NULL,
  -- Mesmo formato que admin_registrar_coleta_radar recebe em p_coleta->'indicadores'.
  indicadores jsonb NOT NULL,
  -- Valores ativos no momento da leitura, para o admin ver o que muda (null = bairro sem coleta ativa).
  atual jsonb,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'descartada', 'erro')),
  motivo text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  decidido_em timestamptz,
  decidido_por uuid,
  -- Só uma proposta pendente por bairro/fonte/período.
  CONSTRAINT radar_coletas_pendentes_unica UNIQUE (bairro, cidade, fonte_id, periodo_inicio, periodo_fim, coletado_em)
);

GRANT SELECT, INSERT, UPDATE ON public.radar_coletas_pendentes TO authenticated;
GRANT ALL ON public.radar_coletas_pendentes TO service_role;

ALTER TABLE public.radar_coletas_pendentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam coletas pendentes"
  ON public.radar_coletas_pendentes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX radar_coletas_pendentes_status_idx ON public.radar_coletas_pendentes (status, criado_em DESC);

-- Aprovar: registra a coleta pela RPC existente (mesmas validações, histórico preservado,
-- auditoria) e marca a proposta. Roda com as permissões de quem chama (admin).
CREATE OR REPLACE FUNCTION public.admin_aprovar_coleta_pendente(p_id uuid)
RETURNS integer
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_p public.radar_coletas_pendentes%ROWTYPE;
  v_n integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso exclusivo de administrador.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_p FROM public.radar_coletas_pendentes WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Proposta não encontrada.'; END IF;
  IF v_p.status <> 'pendente' THEN RAISE EXCEPTION 'Esta proposta já foi decidida (%).', v_p.status; END IF;
  v_n := public.admin_registrar_coleta_radar(jsonb_build_object(
    'bairro', v_p.bairro,
    'fonte_id', v_p.fonte_id,
    'periodo_inicio', to_char(v_p.periodo_inicio, 'YYYY-MM-DD'),
    'periodo_fim', to_char(v_p.periodo_fim, 'YYYY-MM-DD'),
    'coletado_em', to_char(v_p.coletado_em, 'YYYY-MM-DD'),
    'publicado_em', coalesce(to_char(v_p.publicado_em, 'YYYY-MM-DD'), ''),
    'amostra_n', v_p.amostra_n,
    'url_origem', v_p.url_origem,
    'observacao', coalesce(v_p.motivo, ''),
    'indicadores', v_p.indicadores
  ));
  UPDATE public.radar_coletas_pendentes SET status = 'aprovada', decidido_em = now(), decidido_por = auth.uid() WHERE id = p_id;
  RETURN v_n;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_descartar_coleta_pendente(p_id uuid, p_motivo text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso exclusivo de administrador.' USING ERRCODE = '42501';
  END IF;
  UPDATE public.radar_coletas_pendentes
     SET status = 'descartada', motivo = coalesce(nullif(btrim(p_motivo), ''), motivo), decidido_em = now(), decidido_por = auth.uid()
   WHERE id = p_id AND status = 'pendente';
  IF NOT FOUND THEN RAISE EXCEPTION 'Proposta não encontrada ou já decidida.'; END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_aprovar_coleta_pendente(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_descartar_coleta_pendente(uuid, text) TO authenticated;

-- A GuestFavorites atualiza os números dentro do MESMO rótulo de período (ex.: jan–set/2026
-- lido em 13/10 e de novo em 18/10). Uma leitura em outro dia é uma coleta nova: a regra de
-- duplicidade passa a considerar também a data da coleta. O resto da função fica como está.
CREATE OR REPLACE FUNCTION public.admin_registrar_coleta_radar(p_coleta jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_bairro text := btrim(p_coleta->>'bairro');
  v_fonte text := p_coleta->>'fonte_id';
  v_inicio date := (p_coleta->>'periodo_inicio')::date;
  v_fim date := (p_coleta->>'periodo_fim')::date;
  v_coleta date := (p_coleta->>'coletado_em')::date;
  v_publicacao date := nullif(p_coleta->>'publicado_em', '')::date;
  v_n integer := (p_coleta->>'amostra_n')::integer;
  v_url text := p_coleta->>'url_origem';
  v_ind text;
  v_val numeric;
  v_count integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso exclusivo de administrador.' USING ERRCODE = '42501';
  END IF;
  IF v_bairro IS NULL OR length(v_bairro) NOT BETWEEN 2 AND 100 OR v_fonte IS DISTINCT FROM 'guestfavorites' THEN
    RAISE EXCEPTION 'Informe um bairro e a fonte GuestFavorites.';
  END IF;
  IF v_inicio IS NULL OR v_fim IS NULL OR v_coleta IS NULL OR v_inicio > v_fim OR v_fim > v_coleta OR v_coleta > CURRENT_DATE OR (v_publicacao IS NOT NULL AND v_publicacao > v_coleta) THEN
    RAISE EXCEPTION 'Revise o período e as datas da coleta/publicação.';
  END IF;
  IF v_n IS NULL OR v_n < 0 OR v_url IS NULL OR v_url !~ '^https://(www\.)?guestfavorites\.com/' OR length(v_url) > 2000 OR length(coalesce(p_coleta->>'observacao', '')) > 4000 THEN
    RAISE EXCEPTION 'Revise a amostra, o link GuestFavorites e a observação.';
  END IF;
  IF jsonb_typeof(p_coleta->'indicadores') IS DISTINCT FROM 'object' OR NOT (p_coleta->'indicadores' ? 'adr_medio_brl') OR NOT (p_coleta->'indicadores' ? 'ocupacao_media_pct') THEN
    RAISE EXCEPTION 'Diária e ocupação são obrigatórias.';
  END IF;
  FOR v_ind, v_val IN SELECT key, value::numeric FROM jsonb_each_text(p_coleta->'indicadores') LOOP
    IF v_ind NOT IN ('ocupacao_media_pct','adr_medio_brl','adr_p25_brl','adr_mediana_brl','adr_p75_brl','receita_anual_brl') OR v_val IS NULL OR v_val < 0 OR (v_ind = 'ocupacao_media_pct' AND v_val > 100) OR (v_ind = 'adr_medio_brl' AND v_val <= 0) THEN
      RAISE EXCEPTION 'Indicador inválido ou valor fora da faixa.';
    END IF;
  END LOOP;
  IF ((p_coleta->'indicadores' ? 'adr_p25_brl') OR (p_coleta->'indicadores' ? 'adr_mediana_brl') OR (p_coleta->'indicadores' ? 'adr_p75_brl')) AND NOT ((p_coleta->'indicadores' ? 'adr_p25_brl') AND (p_coleta->'indicadores' ? 'adr_mediana_brl') AND (p_coleta->'indicadores' ? 'adr_p75_brl')) THEN
    RAISE EXCEPTION 'Preencha os três quartis ou deixe os três vazios.';
  END IF;
  IF (p_coleta->'indicadores'->>'adr_p25_brl')::numeric > (p_coleta->'indicadores'->>'adr_mediana_brl')::numeric OR (p_coleta->'indicadores'->>'adr_mediana_brl')::numeric > (p_coleta->'indicadores'->>'adr_p75_brl')::numeric THEN
    RAISE EXCEPTION 'Os quartis devem estar em ordem crescente.';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('radar:' || lower(v_bairro), 0));
  IF EXISTS (SELECT 1 FROM public.radar_observacoes WHERE bairro = v_bairro AND cidade = 'São Paulo' AND fonte_id = v_fonte AND periodo_inicio = v_inicio AND periodo_fim = v_fim AND coletado_em = v_coleta) THEN
    RAISE EXCEPTION 'Esta coleta (bairro, fonte, período e data) já está registrada. O histórico não será sobrescrito.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.radar_observacoes WHERE bairro = v_bairro AND cidade = 'São Paulo' AND ativo AND coletado_em > v_coleta) THEN
    RAISE EXCEPTION 'Há uma coleta ativa mais recente neste bairro.';
  END IF;
  UPDATE public.radar_observacoes SET ativo = false WHERE bairro = v_bairro AND cidade = 'São Paulo' AND ativo;
  FOR v_ind, v_val IN SELECT key, value::numeric FROM jsonb_each_text(p_coleta->'indicadores')
    UNION ALL SELECT 'anuncios_ativos', v_n::numeric LOOP
    INSERT INTO public.radar_observacoes (indicador,bairro,cidade,periodo_inicio,periodo_fim,valor,unidade,amostra_n,fonte_id,url_origem,coletado_em,publicado_em,observacao,ativo)
    VALUES (v_ind,v_bairro,'São Paulo',v_inicio,v_fim,v_val,CASE WHEN v_ind = 'ocupacao_media_pct' THEN 'pct' WHEN v_ind = 'anuncios_ativos' THEN 'anuncios' WHEN v_ind = 'receita_anual_brl' THEN 'BRL/ano' ELSE 'BRL' END,v_n,v_fonte,v_url,v_coleta,v_publicacao,nullif(btrim(p_coleta->>'observacao'),''),true);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$function$;
