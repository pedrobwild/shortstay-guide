DROP TRIGGER IF EXISTS radar_imoveis_atualizado ON public.radar_imoveis;
CREATE OR REPLACE FUNCTION public.atualizar_imovel_radar() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END; $$;
CREATE TRIGGER radar_imoveis_atualizado BEFORE UPDATE ON public.radar_imoveis FOR EACH ROW EXECUTE FUNCTION public.atualizar_imovel_radar();