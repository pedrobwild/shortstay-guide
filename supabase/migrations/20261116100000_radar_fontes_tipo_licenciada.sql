-- Radar Bewild — aceita o tipo de fonte 'licenciada' em radar_fontes (16/11/2026).
-- Já aplicada no banco em 16/11/2026 pelo Lovable; este arquivo deixa o repositório
-- igual ao banco. Idempotente.
--
-- É só a regra de tipo. A migration 20261017030000 (que também redefinia a view
-- radar_bairro_atual e a função de coleta) não foi aplicada, porque as duas mudaram depois.
ALTER TABLE public.radar_fontes DROP CONSTRAINT IF EXISTS radar_fontes_tipo_check;
ALTER TABLE public.radar_fontes ADD CONSTRAINT radar_fontes_tipo_check
  CHECK (tipo = ANY (ARRAY['publica'::text, 'propria'::text, 'estimativa'::text, 'licenciada'::text]));
