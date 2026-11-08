import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const POR_PAGINA_IMOVEIS = 12;
const https = z.string().trim().max(1000).url("Informe um endereço válido.").refine((u) => u.startsWith("https://"), "Use um endereço que comece com https://");

export const imovelSchema = z.object({
  titulo: z.string().trim().min(3, "Título com pelo menos 3 letras.").max(140),
  descricao: z.string().trim().max(1200),
  bairro: z.string().trim().max(80),
  foto_url: https,
  anuncio_url: https,
  publicado: z.boolean(),
});
export type ImovelEntrada = z.infer<typeof imovelSchema>;
export type ImovelRadar = Required<ImovelEntrada> & { id: string; criado_em: string; atualizado_em: string };

export type FiltroImoveis = { bairro?: string; status?: "todos" | "publicado" | "rascunho" };

export async function listarBairrosImoveis() {
  const { data, error } = await supabase.from("radar_imoveis").select("bairro").order("bairro").order("id").range(0, 999);
  if (error) throw error;
  return [...new Set((data ?? []).map((d) => d.bairro).filter(Boolean))];
}

export async function listarImoveis(pagina: number, somentePublicados: boolean, filtro: FiltroImoveis = {}) {
  const de = pagina * POR_PAGINA_IMOVEIS;
  let q = supabase.from("radar_imoveis").select("*", { count: "exact" }).order("criado_em", { ascending: false }).order("id").range(de, de + POR_PAGINA_IMOVEIS - 1);
  if (somentePublicados || filtro.status === "publicado") q = q.eq("publicado", true);
  else if (filtro.status === "rascunho") q = q.eq("publicado", false);
  if (filtro.bairro) q = q.eq("bairro", filtro.bairro);
  const { data, error, count } = await q;
  if (error) throw error;
  return { imoveis: (data ?? []) as ImovelRadar[], total: count ?? 0 };
}

export async function salvarImovel(entrada: ImovelEntrada, id?: string) {
  const dados = imovelSchema.parse(entrada) as Required<ImovelEntrada>;
  const q = id ? supabase.from("radar_imoveis").update(dados).eq("id", id).select("id").single() : supabase.from("radar_imoveis").insert(dados).select("id").single();
  const { data, error } = await q;
  if (error) throw error;
  return data.id as string;
}

export async function removerImovel(id: string) {
  const { error } = await supabase.from("radar_imoveis").delete().eq("id", id);
  if (error) throw error;
}
