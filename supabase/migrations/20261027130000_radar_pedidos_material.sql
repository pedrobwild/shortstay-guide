-- =========================================================
-- Radar Bewild — pedido de material por e-mail (checklist antes de comprar o
-- studio). Captura leve: sem senha nem WhatsApp, com consentimento registrado
-- (versão do texto em cada linha, LGPD). Decisão do Pedro (27/10/2026, D3):
-- ainda não há provedor de e-mail; o pedido é registrado e a tela entrega o
-- material (/guia/checklist).
--
-- Um pedido por e-mail e material: o índice único faz o segundo pedido falhar
-- com 23505, e o site trata como sucesso (o material já foi entregue).
--
-- Escrita: anon/authenticated só podem INSERIR, e só nas colunas listadas.
-- Leitura e status comercial: só o papel admin (Bewild).
-- "sessao" é o id da telemetria interna da aba (pode faltar); nunca vai para
-- evento de marketing junto do e-mail.
-- =========================================================

CREATE TABLE public.radar_pedidos_material (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254 AND position('@' in email) > 1),
  email_chave text GENERATED ALWAYS AS (lower(btrim(email))) STORED,
  nome text CHECK (nome IS NULL OR char_length(nome) BETWEEN 1 AND 80),
  material text NOT NULL CHECK (material IN ('checklist_compra')),
  etapa text CHECK (etapa IS NULL OR etapa IN ('procurando','tenho','reformar')),
  bairro text CHECK (bairro IS NULL OR char_length(bairro) BETWEEN 1 AND 80),
  boletim boolean NOT NULL DEFAULT false,
  consentimento_versao text NOT NULL CHECK (char_length(consentimento_versao) BETWEEN 1 AND 20),
  origem text NOT NULL CHECK (origem IN ('guia','bairro','comparar','projecao')),
  sessao text,
  entregue_em timestamptz,
  status_comercial text NOT NULL DEFAULT 'novo' CHECK (status_comercial IN ('novo','qualificado','oportunidade','perdido','fora_do_perfil')),
  responsavel text, motivo_perda text, atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX radar_pedidos_material_email_material_uq ON public.radar_pedidos_material (email_chave, material);

-- 1) GRANTs — insert só nas colunas que o site envia (id, datas, email_chave e
-- colunas comerciais ficam de fora). O REVOKE vem antes porque os privilégios
-- padrão do Supabase dão ALL a anon e authenticated em toda tabela nova do
-- public, o que anularia o GRANT por coluna.
REVOKE ALL ON public.radar_pedidos_material FROM anon, authenticated;
GRANT INSERT (email, nome, material, etapa, bairro, boletim, consentimento_versao, origem, sessao) ON public.radar_pedidos_material TO anon, authenticated;
GRANT SELECT, UPDATE (status_comercial, responsavel, motivo_perda, atualizado_em) ON public.radar_pedidos_material TO authenticated;
GRANT ALL ON public.radar_pedidos_material TO service_role;

-- 2) RLS
ALTER TABLE public.radar_pedidos_material ENABLE ROW LEVEL SECURITY;

-- 3) Policies
CREATE POLICY pedidos_insert_publico ON public.radar_pedidos_material FOR INSERT TO anon, authenticated WITH CHECK (consentimento_versao IS NOT NULL);
CREATE POLICY pedidos_select_admin ON public.radar_pedidos_material FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY pedidos_update_admin ON public.radar_pedidos_material FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) atualizado_em acompanha cada mudança de status (mesmo modelo de
-- touch_project_assumptions_updated_at). SECURITY INVOKER (padrão), com
-- search_path fixado mesmo assim.
CREATE OR REPLACE FUNCTION public.touch_radar_pedidos_material_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_radar_pedidos_material_atualizado_em
  BEFORE UPDATE ON public.radar_pedidos_material
  FOR EACH ROW EXECUTE FUNCTION public.touch_radar_pedidos_material_atualizado_em();
