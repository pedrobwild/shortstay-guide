import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { TEMAS_GUIA } from "@/data/temasGuia";
import { slugifyBairro } from "@/lib/seo";

export const DESTINOS_NOTICIAS = [
  { caminho: "/mercado", nome: "Mercado" },
  { caminho: "/ranking", nome: "Ranking de bairros" },
  ...BAIRROS_CURADOS.map((b) => ({ caminho: `/bairro/${slugifyBairro(b.name)}`, nome: `Bairro · ${b.name}` })),
  ...TEMAS_GUIA.map((t) => ({ caminho: `/guia/${t.slug}`, nome: `Guia · ${t.titulo}` })),
];
export const noticiaSchema = z.object({
  titulo: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres.").max(180),
  resumo: z.string().trim().max(600, "O resumo pode ter até 600 caracteres."),
  url: z.string().trim().regex(/^https:\/\/(www\.)?bewild\.com\.br\/conteudos\/[a-z0-9][a-z0-9/-]*$/, "Use o endereço https://bewild.com.br/conteudos/ do artigo, sem parâmetros."),
  destino: z.string().refine((v) => DESTINOS_NOTICIAS.some((d) => d.caminho === v), "Escolha uma página do Radar."),
  status: z.enum(["rascunho", "publicado", "arquivado"]),
  categoria_id: z.string().uuid().nullable().optional(),
});
export type NoticiaEntrada = z.infer<typeof noticiaSchema>;
export type NoticiaRadar = NoticiaEntrada & { id: string; atualizado_em: string };
export const STATUS_NOTICIA = { rascunho: "Rascunho", publicado: "Publicado", arquivado: "Arquivado" };
export async function listarNoticias(pagina: number, status: string) {
  let consulta = supabase.from("radar_noticias").select("*", { count: "exact" }).order("atualizado_em", { ascending: false }).order("id");
  if (status !== "todos") consulta = consulta.eq("status", status);
  const { data, count, error } = await consulta.range(pagina * 20, pagina * 20 + 19);
  if (error) throw error;
  return { noticias: (data ?? []) as NoticiaRadar[], total: count ?? 0 };
}
export async function salvarNoticia(entrada: NoticiaEntrada, id?: string) {
  const dados = noticiaSchema.parse(entrada);
  const linha = { titulo: dados.titulo ?? "", url: dados.url ?? "", resumo: dados.resumo ?? "", destino: dados.destino ?? "/mercado", status: dados.status ?? "rascunho", categoria_id: dados.categoria_id ?? null };
  const consulta = id ? supabase.from("radar_noticias").update(linha).eq("id", id) : supabase.from("radar_noticias").insert(linha);
  const { data, error } = await consulta.select("id").single();
  if (error) throw error;
  return data.id;
}
export async function noticiasPublicadas(destino: string) {
  const { data, error } = await supabase.from("radar_noticias").select("id,titulo,resumo,url,destino,status,atualizado_em").eq("status", "publicado").eq("destino", destino).order("atualizado_em", { ascending: false }).order("id").limit(100);
  if (error) throw error;
  return (data ?? []) as NoticiaRadar[];
}