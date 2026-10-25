CREATE TABLE public.radar_precos_imoveis (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bairro text NOT NULL, preco_m2 numeric NOT NULL, fonte_nome text NOT NULL, url_origem text NOT NULL, periodo_inicio date NOT NULL, periodo_fim date NOT NULL, coletado_em date NOT NULL, amostra_n integer NOT NULL, observacao text NOT NULL DEFAULT '', ativo boolean NOT NULL DEFAULT true, criado_em timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT radar_preco_positivo CHECK (preco_m2 > 0), CONSTRAINT radar_preco_amostra CHECK (amostra_n > 0), CONSTRAINT radar_preco_periodo CHECK (periodo_inicio <= periodo_fim), UNIQUE(bairro,fonte_nome,periodo_inicio,periodo_fim,coletado_em)
);
GRANT SELECT ON public.radar_precos_imoveis TO anon, authenticated;
GRANT ALL ON public.radar_precos_imoveis TO service_role;
ALTER TABLE public.radar_precos_imoveis ENABLE ROW LEVEL SECURITY;
CREATE POLICY preco_publico ON public.radar_precos_imoveis FOR SELECT TO anon, authenticated USING (true);
CREATE UNIQUE INDEX radar_preco_ativo ON public.radar_precos_imoveis(bairro) WHERE ativo;
CREATE TABLE public.radar_precos_auditoria (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), coleta_id uuid NOT NULL REFERENCES public.radar_precos_imoveis(id), registrado_por uuid NOT NULL, registrado_em timestamptz NOT NULL DEFAULT now(), utms jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT ON public.radar_precos_auditoria TO authenticated;
GRANT ALL ON public.radar_precos_auditoria TO service_role;
ALTER TABLE public.radar_precos_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY preco_auditoria_admin ON public.radar_precos_auditoria FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.admin_registrar_preco_imovel(p_coleta jsonb, p_utms jsonb DEFAULT '{}'::jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b text := btrim(p_coleta->>'bairro'); valor numeric := (p_coleta->>'preco_m2')::numeric; fonte text := btrim(p_coleta->>'fonte_nome'); url text := p_coleta->>'url_origem'; ini date := (p_coleta->>'periodo_inicio')::date; fim date := (p_coleta->>'periodo_fim')::date; coleta date := (p_coleta->>'coletado_em')::date; n integer := (p_coleta->>'amostra_n')::integer; obs text := coalesce(p_coleta->>'observacao',''); novo uuid; chave text; v jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso exclusivo de administrador.' USING ERRCODE='42501'; END IF;
 IF b IS NULL OR NOT EXISTS (SELECT 1 FROM public.radar_observacoes WHERE bairro=b AND cidade='São Paulo' AND bairro <> 'São Paulo') THEN RAISE EXCEPTION 'Escolha um bairro da base do Radar.'; END IF;
 IF valor IS NULL OR valor <= 0 OR valor::text IN ('NaN','Infinity','-Infinity') OR n IS NULL OR n <= 0 OR fonte IS NULL OR length(fonte) NOT BETWEEN 2 AND 200 OR url IS NULL OR url !~ '^https://[A-Za-z0-9][^[:space:]]*$' OR url ~ '^https://(www\.)?guestfavorites\.com(/|$)' OR length(url)>2000 OR length(obs)>4000 THEN RAISE EXCEPTION 'Informe preço médio por m², amostra e fonte imobiliária própria com link HTTPS.'; END IF;
 IF ini IS NULL OR fim IS NULL OR coleta IS NULL OR ini>fim OR fim>coleta OR coleta>CURRENT_DATE THEN RAISE EXCEPTION 'Revise o período e a data da coleta.'; END IF;
 IF p_utms IS NULL OR jsonb_typeof(p_utms) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'UTMs inválidas.'; END IF;
 FOR chave,v IN SELECT key,value FROM jsonb_each(p_utms) LOOP IF chave NOT IN ('utm_source','utm_medium','utm_campaign','utm_content','utm_term') OR jsonb_typeof(v) IS DISTINCT FROM 'string' OR length(v #>> '{}')>256 THEN RAISE EXCEPTION 'UTMs inválidas.'; END IF; END LOOP;
 PERFORM pg_advisory_xact_lock(hashtextextended('radar-preco:' || b,0));
 IF EXISTS(SELECT 1 FROM public.radar_precos_imoveis WHERE bairro=b AND ativo AND coletado_em>coleta) THEN RAISE EXCEPTION 'Há uma coleta de preço mais recente neste bairro.'; END IF;
 IF EXISTS(SELECT 1 FROM public.radar_precos_imoveis WHERE bairro=b AND fonte_nome=fonte AND periodo_inicio=ini AND periodo_fim=fim AND coletado_em=coleta) THEN RAISE EXCEPTION 'Esta coleta de preço já está registrada.'; END IF;
 UPDATE public.radar_precos_imoveis SET ativo=false WHERE bairro=b AND ativo;
 INSERT INTO public.radar_precos_imoveis(bairro,preco_m2,fonte_nome,url_origem,periodo_inicio,periodo_fim,coletado_em,amostra_n,observacao) VALUES(b,valor,fonte,url,ini,fim,coleta,n,obs) RETURNING id INTO novo;
 INSERT INTO public.radar_precos_auditoria(coleta_id,registrado_por,utms) VALUES(novo,auth.uid(),p_utms);
 RETURN novo;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_registrar_preco_imovel(jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_registrar_preco_imovel(jsonb,jsonb) TO authenticated,service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE public.radar_precos_imoveis;