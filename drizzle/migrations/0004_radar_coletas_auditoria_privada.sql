CREATE TABLE public.radar_coleta_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observacao_id uuid NOT NULL UNIQUE REFERENCES public.radar_observacoes(id),
  registrado_por uuid NOT NULL,
  autor_nome text NOT NULL,
  registrado_em timestamptz NOT NULL DEFAULT now(),
  utms jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT ON public.radar_coleta_auditoria TO authenticated;
GRANT ALL ON public.radar_coleta_auditoria TO service_role;
ALTER TABLE public.radar_coleta_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins leem auditoria de coletas" ON public.radar_coleta_auditoria FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
COMMENT ON TABLE public.radar_coleta_auditoria IS 'Auditoria operacional privada: autor e horário do servidor, UTMs declaradas do acesso ao admin. Não é telemetria de marketing e não tem leitura pública.';
CREATE OR REPLACE FUNCTION public.auditar_nova_coleta_radar() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_autor text; v_utms jsonb;
BEGIN
  IF NEW.indicador <> 'adr_medio_brl' OR auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Acesso exclusivo de administrador.' USING ERRCODE = '42501'; END IF;
  SELECT nullif(btrim(full_name), '') INTO v_autor FROM public.profiles WHERE id = auth.uid();
  v_utms := coalesce(nullif(current_setting('radar.coleta_utms', true), '')::jsonb, '{}'::jsonb);
  INSERT INTO public.radar_coleta_auditoria(observacao_id, registrado_por, autor_nome, utms) VALUES(NEW.id, auth.uid(), coalesce(v_autor, 'Administrador ' || auth.uid()::text), v_utms);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.auditar_nova_coleta_radar() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER auditar_nova_coleta_radar AFTER INSERT ON public.radar_observacoes FOR EACH ROW EXECUTE FUNCTION public.auditar_nova_coleta_radar();
CREATE OR REPLACE FUNCTION public.admin_registrar_coleta_radar_auditada(p_coleta jsonb, p_utms jsonb DEFAULT '{}'::jsonb) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_chave text; v_valor jsonb; v_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Acesso exclusivo de administrador.' USING ERRCODE = '42501'; END IF;
  IF p_utms IS NULL OR jsonb_typeof(p_utms) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'UTMs inválidas.'; END IF;
  FOR v_chave, v_valor IN SELECT key, value FROM jsonb_each(p_utms) LOOP
    IF v_chave NOT IN ('utm_source','utm_medium','utm_campaign','utm_content','utm_term') OR jsonb_typeof(v_valor) IS DISTINCT FROM 'string' OR length(v_valor #>> '{}') > 256 THEN RAISE EXCEPTION 'UTMs inválidas: use os cinco campos permitidos, até 256 caracteres.'; END IF;
  END LOOP;
  PERFORM set_config('radar.coleta_utms', p_utms::text, true);
  v_count := public.admin_registrar_coleta_radar(p_coleta);
  PERFORM set_config('radar.coleta_utms', '', true);
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_registrar_coleta_radar_auditada(jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_registrar_coleta_radar_auditada(jsonb,jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.admin_registrar_coleta_radar_auditada(jsonb,jsonb) TO service_role;