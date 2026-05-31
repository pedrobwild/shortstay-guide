-- ============================================================
-- bairro_airbnb_sp: chave única para upsert idempotente
-- Finalidade: permitir que o pipeline de ingestão de inteligência de
--   mercado (skill airbnb-market-intel-sp → CSV → bairro_airbnb_sp)
--   re-rode sem duplicar linhas. Cada (bairro, cidade, período) é único.
-- A escrita acontece server-side via service role (bypass RLS); a policy
-- pública de SELECT permanece inalterada.
-- ============================================================
ALTER TABLE public.bairro_airbnb_sp
  ADD CONSTRAINT bairro_airbnb_sp_bairro_periodo_key
  UNIQUE (bairro, cidade, periodo_inicio, periodo_fim);
