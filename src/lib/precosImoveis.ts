import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { useQuery } from "@tanstack/react-query";
import { useRadarRealtime } from "@/hooks/useRadarRealtime";

const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const precoImovelSchema = z.object({
  bairro: z.string().refine((v) => BAIRROS_CURADOS.some((b) => b.name === v), "Escolha um bairro da base."),
  preco_m2: z.number().finite().positive("Informe um preço por m² maior que zero."),
  fonte_nome: z.string().trim().min(2).max(200),
  url_origem: z.string().url().max(2000).refine((v) => { try { const u = new URL(v); return u.protocol === "https:" && !u.username && !u.password && !/(^|\.)guestfavorites\.com$/i.test(u.hostname); } catch { return false; } }, "Use um link HTTPS de uma fonte imobiliária, não da GuestFavorites."),
  periodo_inicio: data, periodo_fim: data, coletado_em: data,
  amostra_n: z.number().int().positive("Informe a quantidade de imóveis da amostra."),
  observacao: z.string().max(4000),
}).superRefine((v,c) => {
  if (v.periodo_inicio > v.periodo_fim || v.periodo_fim > v.coletado_em || v.coletado_em > new Date().toISOString().slice(0,10)) c.addIssue({ code: "custom", message: "Revise o período e a data da coleta." });
});
export type PrecoImovel = z.infer<typeof precoImovelSchema> & { id: string; ativo: boolean };
export function valorReferenciaImovel(precoM2: number, area: number) {
  return Number.isFinite(precoM2) && precoM2 > 0 && Number.isFinite(area) && area > 0 ? precoM2 * area : null;
}
export async function carregarPrecos(bairro: string, pagina = 0) {
  const { data, error, count } = await supabase.from("radar_precos_imoveis").select("*", { count: "exact" }).eq("bairro", bairro).order("coletado_em", { ascending: false }).order("criado_em", { ascending: false }).order("id").range(pagina * 20, pagina * 20 + 19);
  if (error) throw error;
  return { linhas: (data ?? []) as PrecoImovel[], total: count ?? 0 };
}
export function usePrecoImovel(bairro: string) {
  useRadarRealtime();
  return useQuery({ queryKey: ["radar_preco_atual", bairro], queryFn: async () => {
    const { data, error } = await supabase.from("radar_precos_imoveis").select("*").eq("bairro", bairro).eq("ativo", true).maybeSingle();
    if (error) throw error;
    return data as PrecoImovel | null;
  }, enabled: Boolean(bairro), staleTime: 60000 });
}
export async function registrarPreco(entrada: unknown, utms: Record<string,string>) {
  const p = precoImovelSchema.parse(entrada);
  return supabase.rpc("admin_registrar_preco_imovel", { p_coleta: { ...p }, p_utms: utms });
}