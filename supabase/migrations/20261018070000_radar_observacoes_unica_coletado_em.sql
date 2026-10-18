-- A GuestFavorites revisa os números dentro do MESMO rótulo de período (jan–set/2026 lido em
-- 13/10 e de novo em 18/10). A chave única de radar_observacoes impedia guardar as duas leituras
-- (a RPC admin_registrar_coleta_radar já considera coletado_em desde 20261018060000). A data da
-- coleta passa a fazer parte da chave: o histórico guarda cada leitura, e só a mais recente fica ativa.
ALTER TABLE public.radar_observacoes DROP CONSTRAINT IF EXISTS radar_observacoes_unica;
ALTER TABLE public.radar_observacoes
  ADD CONSTRAINT radar_observacoes_unica
  UNIQUE NULLS NOT DISTINCT (indicador, bairro, cidade, periodo_inicio, periodo_fim, fonte_id, coletado_em);
