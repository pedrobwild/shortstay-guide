import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export type TipoCategoria = "post" | "bairro";
export type CategoriaRadar = { id: string; nome: string; tipo: TipoCategoria };
export const categoriaSchema = z.object({
  nome: z.string().trim().min(2, "Use pelo menos 2 caracteres.").max(80, "Use até 80 caracteres."),
  tipo: z.enum(["post", "bairro"]),
});

export async function listarCategorias(): Promise<CategoriaRadar[]> {
  const { data, error } = await supabase.from("radar_categorias").select("id,nome,tipo").order("tipo").order("nome").order("id").limit(1000);
  if (error) throw error;
  return (data ?? []) as CategoriaRadar[];
}
export async function salvarCategoria(entrada: { nome: string; tipo: TipoCategoria }, id?: string) {
  const d = categoriaSchema.parse(entrada);
  const linha = { nome: d.nome, tipo: d.tipo };
  const { error } = id ? await supabase.from("radar_categorias").update({ nome: d.nome }).eq("id", id) : await supabase.from("radar_categorias").insert(linha);
  if (error) throw new Error(error.code === "23505" ? "Já existe uma categoria com esse nome." : "Não foi possível salvar.");
}
export async function excluirCategoria(id: string) {
  const { error } = await supabase.from("radar_categorias").delete().eq("id", id);
  if (error) throw error;
}
export async function listarBairroCategorias() {
  const { data, error } = await supabase.from("radar_bairro_categorias").select("bairro,categoria_id").order("bairro").order("categoria_id").limit(1000);
  if (error) throw error;
  return data ?? [];
}
export async function alternarBairroCategoria(bairro: string, categoriaId: string, ligar: boolean) {
  const { error } = ligar
    ? await supabase.from("radar_bairro_categorias").insert({ bairro, categoria_id: categoriaId })
    : await supabase.from("radar_bairro_categorias").delete().eq("bairro", bairro).eq("categoria_id", categoriaId);
  if (error) throw error;
}

export type UsuarioRadar = { id: string; email: string; nome: string; admin: boolean; criado_em: string; ultimo_acesso: string | null; confirmado: boolean };
async function chamar<T>(corpo: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-usuarios", { body: corpo });
  if (error) {
    const msg = await (error as { context?: Response }).context?.json?.().then((j: { error?: string }) => j.error).catch(() => undefined);
    throw new Error(msg ?? "Não foi possível concluir. Tente novamente.");
  }
  return data as T;
}
export const listarUsuarios = (pagina: number) => chamar<{ usuarios: UsuarioRadar[]; temMais: boolean }>({ acao: "listar", pagina });
export const convidarUsuario = (email: string, nome: string, papel: "admin" | "user") => chamar({ acao: "convidar", email, nome, papel, redirectTo: window.location.origin });
export const mudarPapel = (userId: string, admin: boolean) => chamar({ acao: "papel", userId, admin });
