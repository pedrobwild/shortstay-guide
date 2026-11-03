-- Aceite explícito de contato comercial no pedido de material (D6, 03/11/2026).
-- Mudança de estrutura: coluna nova com padrão false ("não contatar"). O aceite
-- não é editável pelo admin (UPDATE por coluna não muda) e SELECT já cobre a
-- tabela inteira para authenticated.
ALTER TABLE public.radar_pedidos_material
  ADD COLUMN IF NOT EXISTS contato_comercial boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.radar_pedidos_material.contato_comercial IS 'Aceite explícito de contato comercial da Bewild sobre reforma (LGPD). false = não contatar.';

GRANT INSERT (contato_comercial) ON public.radar_pedidos_material TO anon, authenticated;
