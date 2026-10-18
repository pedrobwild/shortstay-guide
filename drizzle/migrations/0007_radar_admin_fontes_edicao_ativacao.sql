CREATE TABLE public.radar_observacao_revisoes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 observacao_id uuid NOT NULL REFERENCES public.radar_observacoes(id),
 registrado_por uuid NOT NULL,
 registrado_em timestamptz NOT NULL DEFAULT now(),
 anterior jsonb NOT NULL
);
GRANT SELECT ON public.radar_observacao_revisoes TO authenticated;
GRANT ALL ON public.radar_observacao_revisoes TO service_role;
ALTER TABLE public.radar_observacao_revisoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins leem revisoes de observacoes" ON public.radar_observacao_revisoes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE OR REPLACE FUNCTION public.admin_editar_observacao_radar(p_id uuid, p_valor numeric, p_url text, p_observacao text, p_esperado timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.radar_observacoes; v_med numeric; v_p25 numeric; v_p75 numeric;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Acesso exclusivo de administrador.' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.radar_observacoes WHERE id=p_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Observação não encontrada.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('radar:' || lower(r.bairro),0));
 SELECT * INTO r FROM public.radar_observacoes WHERE id=p_id FOR UPDATE;
 IF r.created_at IS DISTINCT FROM p_esperado OR EXISTS (SELECT 1 FROM public.radar_observacao_revisoes WHERE observacao_id=p_id AND registrado_em > p_esperado) THEN RAISE EXCEPTION 'Esta observação foi editada. Reabra o formulário para revisar os dados atuais.'; END IF;
 IF p_valor IS NULL OR p_valor::text IN ('NaN','Infinity','-Infinity') OR p_valor<0 OR (r.indicador='adr_medio_brl' AND p_valor<=0) OR (r.indicador='ocupacao_media_pct' AND p_valor>100) OR (r.indicador='anuncios_ativos' AND p_valor<>trunc(p_valor)) THEN RAISE EXCEPTION 'Valor fora da faixa do indicador.'; END IF;
 IF length(coalesce(p_observacao,''))>4000 OR length(coalesce(p_url,''))>2000 OR (nullif(p_url,'') IS NOT NULL AND p_url !~ '^https://') THEN RAISE EXCEPTION 'Revise o link HTTPS e a observação.'; END IF;
 SELECT max(CASE WHEN indicador='adr_p25_brl' THEN CASE WHEN id=p_id THEN p_valor ELSE valor END END),max(CASE WHEN indicador='adr_mediana_brl' THEN CASE WHEN id=p_id THEN p_valor ELSE valor END END),max(CASE WHEN indicador='adr_p75_brl' THEN CASE WHEN id=p_id THEN p_valor ELSE valor END END) INTO v_p25,v_med,v_p75 FROM public.radar_observacoes WHERE bairro=r.bairro AND cidade=r.cidade AND fonte_id=r.fonte_id AND periodo_inicio IS NOT DISTINCT FROM r.periodo_inicio AND periodo_fim IS NOT DISTINCT FROM r.periodo_fim AND coletado_em=r.coletado_em;
 IF v_p25>v_med OR v_med>v_p75 THEN RAISE EXCEPTION 'Os quartis devem estar em ordem crescente.'; END IF;
 INSERT INTO public.radar_observacao_revisoes(observacao_id,registrado_por,anterior) VALUES(r.id,auth.uid(),to_jsonb(r));
 UPDATE public.radar_observacoes SET valor=p_valor,url_origem=nullif(p_url,''),observacao=nullif(btrim(p_observacao),'') WHERE id=p_id;
END; $$;
CREATE OR REPLACE FUNCTION public.admin_ativar_coleta_radar(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.radar_observacoes;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Acesso exclusivo de administrador.' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.radar_observacoes WHERE id=p_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Observação não encontrada.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('radar:' || lower(r.bairro),0));
 IF NOT EXISTS(SELECT 1 FROM public.radar_observacoes WHERE bairro=r.bairro AND cidade=r.cidade AND fonte_id=r.fonte_id AND periodo_inicio IS NOT DISTINCT FROM r.periodo_inicio AND periodo_fim IS NOT DISTINCT FROM r.periodo_fim AND coletado_em=r.coletado_em AND indicador='adr_medio_brl') OR NOT EXISTS(SELECT 1 FROM public.radar_observacoes WHERE bairro=r.bairro AND cidade=r.cidade AND fonte_id=r.fonte_id AND periodo_inicio IS NOT DISTINCT FROM r.periodo_inicio AND periodo_fim IS NOT DISTINCT FROM r.periodo_fim AND coletado_em=r.coletado_em AND indicador='ocupacao_media_pct') THEN RAISE EXCEPTION 'A coleta precisa ter diária média e ocupação.'; END IF;
 UPDATE public.radar_observacoes SET ativo=false WHERE bairro=r.bairro AND cidade=r.cidade AND ativo AND CASE WHEN r.fonte_id='estimativa_bewild' THEN fonte_id='estimativa_bewild' ELSE fonte_id<>'estimativa_bewild' END;
 UPDATE public.radar_observacoes SET ativo=true WHERE bairro=r.bairro AND cidade=r.cidade AND fonte_id=r.fonte_id AND periodo_inicio IS NOT DISTINCT FROM r.periodo_inicio AND periodo_fim IS NOT DISTINCT FROM r.periodo_fim AND coletado_em=r.coletado_em;
END; $$;
REVOKE ALL ON FUNCTION public.admin_editar_observacao_radar(uuid,numeric,text,text,timestamptz) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_ativar_coleta_radar(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_editar_observacao_radar(uuid,numeric,text,text,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ativar_coleta_radar(uuid) TO authenticated;