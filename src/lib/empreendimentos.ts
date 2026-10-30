import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { ItemMetadado } from "@/components/estudo/Metadados";
import { slugifyBairro } from "@/lib/seo";

/**
 * Empreendimentos em destaque (decisão do Pedro, 30/10/2026): prédios de São Paulo
 * onde a Bewild já atua, cadastrados em /admin/empreendimentos (tabela
 * `empreendimentos`). A tabela guarda só o prédio: nome de cliente, unidade,
 * contrato e valores nunca entram. Diferenciais, situação e endereço vêm da página
 * oficial indicada em `fonte_url`, consultada na data de `fonte_consultada_em`.
 *
 * A lista não é recomendação de compra: o catálogo não ordena por "melhor" nem
 * direciona demanda a um empreendimento (decisão de 18/10/2026).
 */

// A tabela entrou depois dos tipos gerados (types.ts é gerado; não se edita à mão).
const db = supabase as unknown as SupabaseClient;

export const SITUACOES = {
  lancamento: "Lançamento",
  em_obras: "Em obras",
  pronto: "Pronto",
} as const;
export type Situacao = keyof typeof SITUACOES;

export const STATUS_EMPREENDIMENTO = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  arquivado: "Arquivado",
} as const;
export type StatusEmpreendimento = keyof typeof STATUS_EMPREENDIMENTO;

/** Texto do selo (decisão do Pedro: só o selo, sem contagem de unidades). */
export const TEXTO_SELO_BEWILD = "A Bewild já atua neste prédio";
export const NOTA_SELO_BEWILD = "A Bewild tem projeto de reforma em unidade deste prédio. Nome de cliente e número de unidade não são divulgados.";

/** Aviso fixo do catálogo: não é recomendação nem anúncio de venda. */
export const AVISO_CATALOGO =
  "Prédios onde a Bewild já atua, em ordem alfabética. Não é recomendação de compra nem anúncio de venda: situação, endereço e diferenciais seguem a página oficial de cada empreendimento na data da consulta.";

export interface Empreendimento {
  id: string;
  slug: string;
  nome: string;
  bairro: string;
  endereco: string | null;
  incorporadora: string | null;
  tipologias: string | null;
  situacao: Situacao | null;
  entrega: string | null;
  resumo: string;
  diferenciais: string[];
  fonte_url: string | null;
  fonte_titulo: string | null;
  /** aaaa-mm-dd */
  fonte_consultada_em: string | null;
  foto_url: string | null;
  foto_alt: string | null;
  foto_credito: string | null;
  selo_bewild: boolean;
  status: StatusEmpreendimento;
  atualizado_em?: string;
}

/** Colunas lidas pelo site público (o status vem junto só para conferência). */
const COLUNAS_PUBLICAS =
  "id,slug,nome,bairro,endereco,incorporadora,tipologias,situacao,entrega,resumo,diferenciais,fonte_url,fonte_titulo,fonte_consultada_em,foto_url,foto_alt,foto_credito,selo_bewild,status";

/** Slug do empreendimento: mesmo padrão dos bairros (sem acento, minúsculas, hífen). */
export const slugEmpreendimento = (nome: string) => slugifyBairro(nome);
export const caminhoEmpreendimento = (slug: string) => `/empreendimentos/${slug}`;
export const CAMINHO_CATALOGO = "/empreendimentos";

const textoOpcional = (max: number, msg: string) =>
  z.string().trim().max(max, msg).transform((v) => (v === "" ? null : v)).nullable();

export const empreendimentoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do empreendimento.").max(120, "Nome com até 120 caracteres."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Endereço da página só com letras minúsculas, números e hífen.")
    .max(120),
  bairro: z.string().trim().min(2, "Informe o bairro.").max(80),
  endereco: textoOpcional(160, "Endereço com até 160 caracteres."),
  incorporadora: textoOpcional(120, "Incorporadora com até 120 caracteres."),
  tipologias: textoOpcional(160, "Tipologias com até 160 caracteres."),
  situacao: z.enum(["lancamento", "em_obras", "pronto"]).nullable(),
  entrega: textoOpcional(40, "Entrega com até 40 caracteres."),
  resumo: z.string().trim().max(600, "O resumo pode ter até 600 caracteres."),
  diferenciais: z
    .array(z.string().trim().min(2).max(120))
    .max(10, "Use até 10 diferenciais."),
  fonte_url: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v) => v === null || /^https:\/\/\S+$/.test(v), "Use um link https:// da página oficial."),
  fonte_titulo: textoOpcional(120, "Título da fonte com até 120 caracteres."),
  fonte_consultada_em: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Data da consulta no formato aaaa-mm-dd."),
  foto_url: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v) => v === null || /^https:\/\/\S+$/.test(v), "A foto precisa de um link https://."),
  foto_alt: textoOpcional(200, "Descrição da foto com até 200 caracteres."),
  foto_credito: textoOpcional(120, "Crédito da foto com até 120 caracteres."),
  selo_bewild: z.boolean(),
  status: z.enum(["rascunho", "publicado", "arquivado"]),
});
export type EmpreendimentoEntrada = z.input<typeof empreendimentoSchema>;

/** Diferenciais digitados um por linha no admin → lista limpa, sem repetição. */
export function diferenciaisDoTexto(texto: string): string[] {
  const vistos = new Set<string>();
  const lista: string[] = [];
  for (const linha of texto.split(/\r?\n/)) {
    const item = linha.replace(/^[\s•\-–*]+/, "").trim();
    const chave = item.toLocaleLowerCase("pt-BR");
    if (item.length < 2 || vistos.has(chave)) continue;
    vistos.add(chave);
    lista.push(item);
  }
  return lista;
}

const comparar = (a: string, b: string) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });

/** Ordem do catálogo: alfabética pelo nome (sem ranking). */
export function ordenarEmpreendimentos<T extends Pick<Empreendimento, "nome" | "id">>(lista: T[]): T[] {
  return [...lista].sort((a, b) => comparar(a.nome, b.nome) || a.id.localeCompare(b.id));
}

/** Busca sem acento e sem diferença de maiúsculas no nome, bairro, incorporadora e endereço. */
const normalizar = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function filtrarEmpreendimentos<T extends Pick<Empreendimento, "nome" | "bairro" | "incorporadora" | "endereco">>(
  lista: T[],
  { bairro, busca }: { bairro?: string | null; busca?: string | null },
): T[] {
  const termos = normalizar(busca ?? "").split(/\s+/).filter(Boolean);
  return lista.filter((e) => {
    if (bairro && slugifyBairro(e.bairro) !== bairro) return false;
    if (!termos.length) return true;
    const alvo = normalizar([e.nome, e.bairro, e.incorporadora ?? "", e.endereco ?? ""].join(" "));
    return termos.every((t) => alvo.includes(t));
  });
}

/** Bairros presentes no catálogo, em ordem alfabética, com quantos prédios cada um tem. */
export function bairrosDoCatalogo(lista: Pick<Empreendimento, "bairro">[]): { nome: string; slug: string; total: number }[] {
  const mapa = new Map<string, { nome: string; slug: string; total: number }>();
  for (const e of lista) {
    const slug = slugifyBairro(e.bairro);
    const atual = mapa.get(slug);
    if (atual) atual.total += 1;
    else mapa.set(slug, { nome: e.bairro.trim(), slug, total: 1 });
  }
  return [...mapa.values()].sort((a, b) => comparar(a.nome, b.nome));
}

/** Bairro do prédio na base do Radar (mesmo slug); null quando o bairro não tem dado na base. */
export function bairroNaBase<T extends { name: string }>(bairro: string, base: T[]): T | null {
  const slug = slugifyBairro(bairro);
  return base.find((b) => slugifyBairro(b.name) === slug) ?? null;
}

/** Link de busca no Google Maps (abre em nova aba, só quando a pessoa clica). */
export function linkMapa(e: Pick<Empreendimento, "nome" | "endereco" | "bairro">): string {
  const partes = [e.endereco ? e.endereco : e.nome, e.bairro, "São Paulo - SP"].filter(Boolean);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partes.join(", "))}`;
}

/** "2026-10-30" → "30/10/2026". */
export function dataBR(iso: string | null | undefined): string | null {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

/** Situação com a entrega, quando a fonte informa: "Em obras · entrega dez/2026". */
export function textoSituacao(e: Pick<Empreendimento, "situacao" | "entrega">): string | null {
  const s = e.situacao ? SITUACOES[e.situacao] : null;
  if (s && e.entrega) return `${s} · entrega ${e.entrega}`;
  if (s) return s;
  return e.entrega ? `Entrega ${e.entrega}` : null;
}

/** Linha da fonte: "Página oficial — Incorporadora, consultada em 30/10/2026". */
export function textoFonte(e: Pick<Empreendimento, "fonte_titulo" | "fonte_consultada_em">): string {
  const titulo = e.fonte_titulo || "Página oficial do empreendimento";
  const data = dataBR(e.fonte_consultada_em);
  return data ? `${titulo}, consultada em ${data}` : titulo;
}

/** Itens da ficha (usados no modal e na página do prédio). Campo sem fonte não aparece. */
export function itensFicha(e: Empreendimento): ItemMetadado[] {
  const situacao = textoSituacao(e);
  const itens: (ItemMetadado | null)[] = [
    { rotulo: "Bairro", valor: e.bairro },
    e.endereco ? { rotulo: "Endereço", valor: e.endereco } : null,
    e.incorporadora ? { rotulo: "Incorporadora", valor: e.incorporadora } : null,
    situacao ? { rotulo: "Situação", valor: situacao } : null,
    e.tipologias ? { rotulo: "Unidades", valor: e.tipologias } : null,
  ];
  return itens.filter((i): i is ItemMetadado => i !== null);
}

/** Texto alternativo da foto: o informado pelo admin ou um padrão descritivo. */
export const altFoto = (e: Pick<Empreendimento, "foto_alt" | "nome" | "bairro">) =>
  e.foto_alt?.trim() || `Fachada do ${e.nome}, em ${e.bairro}`;

/** Descrição de SEO de um empreendimento (até 160 caracteres). */
export function descricaoSeo(e: Pick<Empreendimento, "nome" | "bairro" | "incorporadora">): string {
  const texto = `${e.nome}, em ${e.bairro}${e.incorporadora ? ` (${e.incorporadora})` : ""}: localização, diferenciais e os números do bairro para studios de short stay no Radar Bewild.`;
  return texto.length <= 160 ? texto : `${texto.slice(0, 157).trimEnd()}…`;
}

const PAGINA = 1000;

/** Catálogo público: todos os publicados, em páginas de 1.000 com ordem estável. */
export async function listarEmpreendimentosPublicos(): Promise<Empreendimento[]> {
  const todos: Empreendimento[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await db
      .from("empreendimentos")
      .select(COLUNAS_PUBLICAS)
      .eq("status", "publicado")
      .order("nome")
      .order("id")
      .range(de, de + PAGINA - 1);
    if (error) throw error;
    todos.push(...((data ?? []) as Empreendimento[]));
    if (!data || data.length < PAGINA) break;
  }
  return ordenarEmpreendimentos(todos);
}

/** Um empreendimento publicado pelo slug (null quando não existe ou não está publicado). */
export async function buscarEmpreendimento(slug: string): Promise<Empreendimento | null> {
  const { data, error } = await db
    .from("empreendimentos")
    .select(COLUNAS_PUBLICAS)
    .eq("slug", slug)
    .eq("status", "publicado")
    .maybeSingle();
  if (error) throw error;
  return (data as Empreendimento | null) ?? null;
}

/** Admin: todos os status (a RLS só devolve rascunhos e arquivados para o papel admin). */
export async function listarEmpreendimentosAdmin(): Promise<Empreendimento[]> {
  const todos: Empreendimento[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await db
      .from("empreendimentos")
      .select(`${COLUNAS_PUBLICAS},atualizado_em`)
      .order("nome")
      .order("id")
      .range(de, de + PAGINA - 1);
    if (error) throw error;
    todos.push(...((data ?? []) as Empreendimento[]));
    if (!data || data.length < PAGINA) break;
  }
  return ordenarEmpreendimentos(todos);
}

export async function salvarEmpreendimento(entrada: EmpreendimentoEntrada, id?: string): Promise<string> {
  const linha = empreendimentoSchema.parse(entrada);
  const consulta = id
    ? db.from("empreendimentos").update(linha).eq("id", id)
    : db.from("empreendimentos").insert(linha);
  const { data, error } = await consulta.select("id").single();
  if (error) throw error;
  return (data as { id: string }).id;
}

/** Mensagem do erro de gravação para o admin (slug repetido é o caso comum). */
export function mensagemErroSalvar(erro: unknown): string {
  const codigo = (erro as { code?: string } | null)?.code;
  if (codigo === "23505") return "Já existe um empreendimento com este endereço de página. Troque o endereço (slug).";
  if (codigo === "42501") return "Sua conta não tem permissão para salvar empreendimentos.";
  return "Não foi possível salvar. Confira os campos e tente novamente.";
}

export const BUCKET_FOTOS = "empreendimentos";
export const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];
export const FOTO_MAX_BYTES = 5 * 1024 * 1024;
const LADO_MAX_FOTO = 1600;

/** Reduz a foto para no máximo 1.600 px no maior lado e grava em WebP (páginas mais leves no celular). */
async function prepararFoto(arquivo: File): Promise<Blob> {
  if (typeof createImageBitmap !== "function") return arquivo;
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, LADO_MAX_FOTO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/webp", 0.82));
    return blob && blob.size > 0 ? blob : arquivo;
  } catch {
    return arquivo;
  }
}

/** Envia a foto do prédio para o Storage (só admin) e devolve a URL pública. */
export async function enviarFotoEmpreendimento(arquivo: File, slug: string): Promise<string> {
  if (!TIPOS_FOTO.includes(arquivo.type)) throw new Error("Use uma foto JPG, PNG ou WebP.");
  if (arquivo.size > FOTO_MAX_BYTES * 4) throw new Error("A foto passa de 20 MB. Use um arquivo menor.");
  const blob = await prepararFoto(arquivo);
  if (blob.size > FOTO_MAX_BYTES) throw new Error("Mesmo reduzida, a foto passou de 5 MB. Use um arquivo menor.");
  const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
  const caminho = `${slug || "predio"}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(caminho, blob, { contentType: blob.type || arquivo.type, upsert: false, cacheControl: "31536000" });
  if (error) throw error;
  return supabase.storage.from(BUCKET_FOTOS).getPublicUrl(caminho).data.publicUrl;
}
