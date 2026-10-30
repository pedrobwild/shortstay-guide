-- Regras de publicação dos empreendimentos (revisão de 30/10/2026), as mesmas do
-- formulário do admin (empreendimentoSchema em src/lib/empreendimentos.ts):
--   * publicado exige link da fonte, data da consulta e bairro confirmado (nunca
--     "A confirmar"); sem isso a tela diria "conforme" uma fonte que não existe;
--   * a foto só pode vir do bucket "empreendimentos" (enviada pelo admin, com direito
--     de uso), nunca de link externo.
-- CHECKs imutáveis (sem now()). Só estrutura: dados vão por SQL direto. Idempotente.

ALTER TABLE public.empreendimentos DROP CONSTRAINT IF EXISTS empreendimentos_publicado_com_fonte;
ALTER TABLE public.empreendimentos ADD CONSTRAINT empreendimentos_publicado_com_fonte
  CHECK (
    status <> 'publicado'
    OR (fonte_url IS NOT NULL AND fonte_consultada_em IS NOT NULL AND btrim(bairro) <> 'A confirmar')
  );

ALTER TABLE public.empreendimentos DROP CONSTRAINT IF EXISTS empreendimentos_foto_do_bucket;
ALTER TABLE public.empreendimentos ADD CONSTRAINT empreendimentos_foto_do_bucket
  CHECK (
    foto_url IS NULL
    OR foto_url ~ '^https://[^[:space:]]+/storage/v1/object/public/empreendimentos/[^[:space:]]+$'
  );
