CREATE OR REPLACE FUNCTION public.admin_registrar_coleta_radar(p_coleta jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
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
  IF EXISTS (SELECT 1 FROM public.radar_observacoes WHERE bairro = v_bairro AND cidade = 'São Paulo' AND fonte_id = v_fonte AND periodo_inicio = v_inicio AND periodo_fim = v_fim) THEN
    RAISE EXCEPTION 'Este período já está registrado para o bairro e a fonte. O histórico não será sobrescrito.';
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
$$;
REVOKE ALL ON FUNCTION public.admin_registrar_coleta_radar(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_registrar_coleta_radar(jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.admin_registrar_coleta_radar(jsonb) TO service_role;
COMMENT ON FUNCTION public.admin_registrar_coleta_radar(jsonb) IS 'Admin: registra nova coleta GuestFavorites e desativa observações anteriores do bairro na mesma transação, preservando histórico e confiança calculada pela view.';