-- =========================================================
-- Radar Bewild — "Guardar no Painel" preserva a simulação inteira
--
-- Até aqui o projeto guardava só bairro e faixa de área; a pessoa reabria o
-- estudo e perdia diária, ocupação, imóvel, reforma e deduções. Agora a
-- PremissasSimulador íntegra (só números e escolhas, sem dado pessoal) vai
-- junto, com a versão do cálculo e a data da coleta vigente quando foi guardada.
--
-- Sem GRANT nem policy novos: project_assumptions já tem RLS por dono
-- (user_owns_project) para SELECT/INSERT/UPDATE, e as colunas novas herdam.
-- =========================================================

ALTER TABLE public.project_assumptions
  ADD COLUMN IF NOT EXISTS premissas_simulador jsonb,
  ADD COLUMN IF NOT EXISTS versao_calculo text,
  ADD COLUMN IF NOT EXISTS base_coletada_em date;

COMMENT ON COLUMN public.project_assumptions.premissas_simulador IS
  'PremissasSimulador íntegra (src/lib/simuladorReceita.ts) no momento em que a pessoa guardou a simulação. Só números e escolhas; nenhum dado pessoal. Validada na leitura por normalizarPremissasSimulador.';
COMMENT ON COLUMN public.project_assumptions.versao_calculo IS
  'Versão do modelo de cálculo do simulador quando a simulação foi guardada (VERSAO_CALCULO em src/lib/projetoSimulacao.ts).';
COMMENT ON COLUMN public.project_assumptions.base_coletada_em IS
  'Data da coleta vigente de diária e ocupação do bairro quando a pessoa guardou a simulação; serve para avisar se a base mudou desde então.';
