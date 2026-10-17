REVOKE ALL ON public.radar_coleta_auditoria FROM anon, authenticated;
GRANT SELECT ON public.radar_coleta_auditoria TO authenticated;
GRANT ALL ON public.radar_coleta_auditoria TO service_role;