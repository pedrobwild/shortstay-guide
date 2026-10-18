CREATE TABLE public.radar_coleta_execucoes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 fonte_id text NOT NULL DEFAULT 'guestfavorites',
 origem text NOT NULL CHECK (origem IN ('manual','externa')),
 iniciado_em timestamptz NOT NULL DEFAULT now(),
 finalizado_em timestamptz,
 status text NOT NULL DEFAULT 'executando' CHECK (status IN ('executando','concluida','parcial','erro')),
 lidos integer NOT NULL DEFAULT 0,
 propostas integer NOT NULL DEFAULT 0,
 sem_mudanca integer NOT NULL DEFAULT 0,
 erros jsonb NOT NULL DEFAULT '[]'::jsonb
);
GRANT SELECT ON public.radar_coleta_execucoes TO authenticated;
GRANT ALL ON public.radar_coleta_execucoes TO service_role;
ALTER TABLE public.radar_coleta_execucoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins leem execucoes" ON public.radar_coleta_execucoes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX radar_coleta_execucoes_inicio ON public.radar_coleta_execucoes(iniciado_em DESC,id);
CREATE OR REPLACE FUNCTION public.iniciar_execucao_guestfavorites(p_origem text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
 IF p_origem NOT IN ('manual','externa') THEN RAISE EXCEPTION 'Origem inválida.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('guestfavorites_execucao',0));
 IF EXISTS (SELECT 1 FROM public.radar_coleta_execucoes WHERE status='executando' AND iniciado_em > now()-interval '10 minutes') THEN RETURN NULL; END IF;
 UPDATE public.radar_coleta_execucoes SET status='erro',finalizado_em=now(),erros='["A execução anterior excedeu o tempo máximo."]'::jsonb WHERE status='executando';
 INSERT INTO public.radar_coleta_execucoes(origem) VALUES(p_origem) RETURNING id INTO v_id;
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.iniciar_execucao_guestfavorites(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.iniciar_execucao_guestfavorites(text) TO service_role;