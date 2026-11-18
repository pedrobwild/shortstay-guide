/**
 * Conteúdos próprios do Radar (decisão do Pedro, 18/11/2026): artigos, releases de imprensa
 * e estudos com página por texto em /conteudos/<slug>. Vivem na mesma tabela dos links para
 * o site Bewild (radar_noticias), diferenciados por `tipo`; o tipo "link" continua valendo
 * pelas regras de src/lib/noticiasRadar.ts.
 *
 * Regras puras (slug, validação, SEO, avisos editoriais) ficam aqui para valerem igual no
 * app, no admin e no build (scripts/prerender.mjs via src/entry-server.tsx).
 */
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DESTINOS_NOTICIAS } from "@/lib/noticiasRadar";
import { SITE_URL, TITULO_VISIVEL_MAX } from "@/lib/seo";

export const TIPOS_CONTEUDO = {
  artigo: { rotulo: "Artigo", plural: "Artigos", caminho: "artigos", descricao: "Leituras de mercado e análises do Radar Bewild sobre studios e short stay em São Paulo." },
  release: { rotulo: "Release", plural: "Releases", caminho: "releases", descricao: "Comunicados e material de imprensa do Radar Bewild, com os dados e as fontes de cada número." },
  estudo: { rotulo: "Estudo", plural: "Estudos", caminho: "estudos", descricao: "Estudos do Radar Bewild com recorte, período, método e limites declarados." },
} as const;
export type TipoConteudo = keyof typeof TIPOS_CONTEUDO;
export const TIPOS_CONTEUDO_LISTA = Object.keys(TIPOS_CONTEUDO) as TipoConteudo[];

export const CAMINHO_CONTEUDOS = "/conteudos";
export const CAMINHO_FEED = "/conteudos/rss.xml";
export const POR_PAGINA = 12;
export const BUCKET_CONTEUDOS = "conteudos";

/** Segmentos que já são endereço dentro de /conteudos e não podem virar slug de texto. */
/** Pasta das capas dos textos do repositório (public/conteudos/imagens). */
export const PASTA_IMAGENS = "imagens";
export const SLUGS_RESERVADOS = [...TIPOS_CONTEUDO_LISTA.map((t) => TIPOS_CONTEUDO[t].caminho), "rss", "rss.xml", "pagina", PASTA_IMAGENS];
export const SLUG_CONTEUDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MAX = 90;
export const DESCRICAO_SEO_MAX = 160;

/** "Diária em Pinheiros: o que mudou?" → "diaria-em-pinheiros-o-que-mudou". */
export function slugificar(titulo: string): string {
  return titulo
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/, "");
}

export const caminhoConteudo = (slug: string) => `${CAMINHO_CONTEUDOS}/${slug}`;
export const caminhoTipo = (tipo: TipoConteudo) => `${CAMINHO_CONTEUDOS}/${TIPOS_CONTEUDO[tipo].caminho}`;
export const tipoPeloCaminho = (segmento: string | undefined): TipoConteudo | null =>
  TIPOS_CONTEUDO_LISTA.find((t) => TIPOS_CONTEUDO[t].caminho === segmento) ?? null;

/** Capa: só imagem enviada ao bucket do Radar (nada de hotlink de terceiros). */
export const capaDoBucket = (url: string) => new RegExp(`^https://\\S+/storage/v1/object/public/${BUCKET_CONTEUDOS}/\\S+$`).test(url);
/** Endereço absoluto da capa (Open Graph e dado estruturado exigem URL completa; a capa do repositório é um caminho do site). */
export const urlAbsolutaCapa = (url: string) => (url.startsWith("/") ? `${SITE_URL}${url}` : url);
/** Capa de texto do repositório: arquivo em public/conteudos/imagens, servido pelo próprio site. */
export const capaLocal = (url: string) => /^\/conteudos\/imagens\/[a-z0-9][a-z0-9-]*\.(jpg|jpeg|png|webp)$/.test(url);
const CANONICAL_BEWILD = /^https:\/\/(www\.)?bewild\.com\.br\/[a-z0-9][a-z0-9/-]*$/;

const opcional = (max: number, mensagem: string) => z.string().trim().max(max, mensagem).nullable().optional().transform((v) => v || null);

export const conteudoSchema = z.object({
  tipo: z.enum(["artigo", "release", "estudo"]),
  titulo: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres.").max(180, "O título pode ter até 180 caracteres."),
  slug: z.string().trim().max(SLUG_MAX, `O endereço pode ter até ${SLUG_MAX} caracteres.`)
    .regex(SLUG_CONTEUDO, "Use só letras minúsculas sem acento, números e hífens no endereço.")
    .refine((s) => !SLUGS_RESERVADOS.includes(s), "Este endereço já é usado pelo Radar. Escolha outro."),
  resumo: z.string().trim().min(40, "Escreva um resumo de pelo menos 40 caracteres: ele vira a descrição na busca.").max(600, "O resumo pode ter até 600 caracteres."),
  corpo: z.string().trim().min(200, "O texto precisa de pelo menos 200 caracteres.").max(60_000, "O texto pode ter até 60.000 caracteres."),
  capa_url: z.string().trim().nullable().optional().transform((v) => v || null)
    .refine((v) => v === null || capaDoBucket(v) || capaLocal(v), "Envie a capa pelo formulário (a imagem fica guardada no Radar)."),
  capa_alt: opcional(200, "A descrição da imagem pode ter até 200 caracteres."),
  autor_nome: opcional(80, "O nome do autor pode ter até 80 caracteres."),
  seo_titulo: opcional(TITULO_VISIVEL_MAX, `O título de busca pode ter até ${TITULO_VISIVEL_MAX} caracteres.`),
  seo_descricao: opcional(DESCRICAO_SEO_MAX, `A descrição de busca pode ter até ${DESCRICAO_SEO_MAX} caracteres.`),
  canonical_externo: z.string().trim().nullable().optional().transform((v) => v || null)
    .refine((v) => v === null || CANONICAL_BEWILD.test(v), "Use o endereço https://bewild.com.br/… da versão original, sem parâmetros."),
  destino: z.string().refine((v) => DESTINOS_NOTICIAS.some((d) => d.caminho === v), "Escolha uma página do Radar."),
  status: z.enum(["rascunho", "publicado", "arquivado"]),
  categoria_id: z.string().uuid().nullable().optional(),
}).superRefine((d, ctx) => {
  if (d.capa_url && !d.capa_alt) ctx.addIssue({ code: "custom", path: ["capa_alt"], message: "Descreva a imagem de capa em uma frase (texto alternativo)." });
});
export type ConteudoEntrada = z.input<typeof conteudoSchema>;

export interface ConteudoRadar {
  id: string;
  /** De onde veio o texto: arquivo em src/content/conteudos (publicado por PR) ou banco (admin). Ausente = banco. */
  origem?: "repositorio" | "banco";
  /** Palavra-chave de foco (só nos textos do repositório; ver conteudosEscrita.ts). */
  palavra_chave?: string | null;
  tipo: TipoConteudo;
  titulo: string;
  slug: string;
  resumo: string;
  corpo: string;
  capa_url: string | null;
  capa_alt: string | null;
  autor_nome: string | null;
  seo_titulo: string | null;
  seo_descricao: string | null;
  canonical_externo: string | null;
  destino: string;
  status: "rascunho" | "publicado" | "arquivado";
  categoria_id: string | null;
  publicado_em: string | null;
  atualizado_em: string;
}

/** Colunas lidas pelo público (app e build). Rascunho nunca entra: a consulta filtra por status. */
export const COLUNAS_CONTEUDO =
  "id,tipo,titulo,slug,resumo,corpo,capa_url,capa_alt,autor_nome,seo_titulo,seo_descricao,canonical_externo,destino,status,categoria_id,publicado_em,atualizado_em";

/** Corta no último espaço antes do limite e fecha com reticências; texto curto volta igual. */
export function encurtar(texto: string, max: number): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= max) return limpo;
  const corte = limpo.slice(0, max - 1);
  return `${corte.slice(0, Math.max(corte.lastIndexOf(" "), max - 30)).replace(/[\s,;:.–-]+$/, "")}…`;
}

/** Head da página do texto: título e descrição de busca quando preenchidos; senão, título e resumo. */
export function paginaSeoConteudo(c: Pick<ConteudoRadar, "slug" | "titulo" | "resumo" | "seo_titulo" | "seo_descricao">) {
  return {
    path: caminhoConteudo(c.slug),
    title: c.seo_titulo || c.titulo,
    description: c.seo_descricao || encurtar(c.resumo, DESCRICAO_SEO_MAX),
    h1: c.titulo,
  };
}

/** Publicado, com endereço seguro para virar arquivo no build. */
export const ehPublicavel = (c: Pick<ConteudoRadar, "status" | "slug" | "tipo">) =>
  c.status === "publicado" && c.tipo in TIPOS_CONTEUDO && SLUG_CONTEUDO.test(c.slug) && !SLUGS_RESERVADOS.includes(c.slug);

/**
 * Indexável no Radar: publicável e sem versão original no site Bewild. Com `canonical_externo`
 * a página existe, mas aponta o canonical para o site e fica fora do sitemap, do feed e do
 * llms.txt — é a trava para os dois domínios não disputarem a mesma busca.
 */
export const ehIndexavel = (c: Pick<ConteudoRadar, "status" | "slug" | "tipo" | "canonical_externo">) => ehPublicavel(c) && !c.canonical_externo;

/** Mais recente primeiro; empate resolvido pelo slug para a ordem ser estável entre builds. */
export function ordenarConteudos<T extends Pick<ConteudoRadar, "publicado_em" | "atualizado_em" | "slug">>(lista: T[]): T[] {
  const data = (c: T) => c.publicado_em ?? c.atualizado_em;
  return [...lista].sort((a, b) => data(b).localeCompare(data(a)) || a.slug.localeCompare(b.slug));
}

/** Leitura a ~200 palavras por minuto, mínimo de 1. */
export function tempoLeituraMin(corpo: string): number {
  const palavras = corpo.replace(/[#*_>`[\]()!-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}

const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "long", year: "numeric" });
/** "18 de novembro de 2026", no fuso de São Paulo. */
export const dataExtenso = (iso: string) => DATA_LONGA.format(new Date(iso));
/** Atualização só aparece quando caiu em outro dia que a publicação. */
export function foiAtualizado(c: Pick<ConteudoRadar, "publicado_em" | "atualizado_em">): boolean {
  return Boolean(c.publicado_em) && dataExtenso(c.publicado_em as string) !== dataExtenso(c.atualizado_em);
}

// ---------- Avisos editoriais ----------
export type CodigoAviso = "marca" | "termo" | "promessa" | "numero_sem_fonte";
export interface AvisoEditorial { codigo: CodigoAviso; mensagem: string }

/**
 * As mesmas expressões barradas no código pelo teste tomGuia.test.ts. Montadas em partes para
 * este arquivo não conter as expressões que ele mesmo ajuda a barrar.
 */
export const TERMOS_BARRADOS = [["máquina", "reservas"], ["maquina", "reservas"], ["máquina", "dinheiro"], ["garantia", "retorno"]].map(([a, b]) => `${a} de ${b}`).concat(["lucro", "garantido"].join(" "));
const PROMESSAS = [/\bgarant(e|imos|ido|ida)s?\b[^.\n]{0,60}\b(retorno|renda|lucro|ocupa[cç][aã]o|rentabilidade|reservas?)\b/i, /\b(retorno|renda|lucro) cert[oa]\b/i, /\bsem risco\b/i];
const MARCA_ERRADA = /\bB[Ww]ild\b/;
/** Número de mercado: valor em reais, percentual ou contagem com milhar. Ano e dia do mês não contam. */
const NUMERO_DE_MERCADO = /R\$\s?\d|\d+(?:[.,]\d+)?\s?%|\b\d{1,3}(?:\.\d{3})+\b/;
const TEM_LINK = /\[[^\]]+\]\((https?:\/\/|\/)[^)]+\)/;

/**
 * Confere o texto contra as regras do Radar antes de publicar: marca, expressões de venda,
 * promessa de resultado e número de mercado sem link de fonte no mesmo parágrafo. É uma
 * triagem de texto, não substitui a leitura de quem publica.
 */
export function avisosEditoriais(texto: string): AvisoEditorial[] {
  const avisos: AvisoEditorial[] = [];
  const minusculo = texto.toLowerCase();
  if (MARCA_ERRADA.test(texto)) avisos.push({ codigo: "marca", mensagem: "A marca aparece escrita de outro jeito. No Radar ela é sempre “Bewild”." });
  const termo = TERMOS_BARRADOS.find((t) => minusculo.includes(t));
  if (termo) avisos.push({ codigo: "termo", mensagem: `A expressão “${termo}” não é usada no Radar.` });
  if (PROMESSAS.some((p) => p.test(texto))) avisos.push({ codigo: "promessa", mensagem: "O texto promete resultado. Descreva o dado e o objetivo, sem garantir retorno, renda ou ocupação." });
  const blocos = texto.split(/\n\s*\n/);
  // Nota de rodapé com link conta como fonte: "[^1]" no parágrafo e "[^1]: [Fonte](https://…)" no fim.
  const notasComFonte = new Set(blocos.flatMap((b) => [...b.matchAll(/^\[\^([^\]]+)\]:(.*)$/gm)].filter((m) => TEM_LINK.test(m[2])).map((m) => m[1])));
  const temFonte = (b: string) => TEM_LINK.test(b) || [...b.matchAll(/\[\^([^\]]+)\](?!:)/g)].some((m) => notasComFonte.has(m[1]));
  // Tabela: a fonte pode estar no título ("Tabela: …") logo antes ou na linha "Fonte: …" logo depois.
  const ehTabela = (b: string) => /^\s*\|/.test(b);
  const semFonte = blocos.filter((b, i) => NUMERO_DE_MERCADO.test(b) && !/^\[\^[^\]]+\]:/.test(b.trim()) && !temFonte(b)
    && !(ehTabela(b) && [blocos[i - 1], blocos[i + 1]].some((v) => v !== undefined && temFonte(v))));
  if (semFonte.length) {
    avisos.push({ codigo: "numero_sem_fonte", mensagem: `${semFonte.length === 1 ? "Há 1 parágrafo" : `Há ${semFonte.length} parágrafos`} com número e sem link de fonte. Começa em: “${encurtar(semFonte[0], 70)}”` });
  }
  return avisos;
}

// ---------- Leituras e escrita ----------
// As colunas novas de radar_noticias (migration 20261118090000) ainda não estão no types.ts
// gerado; até ele ser regenerado, a tabela é lida por um cliente sem o tipo do esquema.
const tabela = () => (supabase as unknown as SupabaseClient).from("radar_noticias");
/** Coluna que ainda não existe no banco (código publicado antes de a migration 20261118090000 rodar). */
export const colunaAusente = (erro: unknown) => (erro as { code?: string } | null)?.code === "42703";

const COLUNAS_LISTA = "id,tipo,titulo,slug,resumo,url,destino,status,categoria_id,capa_url,capa_alt,publicado_em,atualizado_em";

/**
 * Todos os itens publicados do banco (textos do admin e links do site Bewild), em páginas de
 * 1.000 com ordem estável. A lista pública junta estes com os textos do repositório
 * (src/lib/conteudosPublicos.ts) e pagina no navegador.
 */
export async function publicadosDoBanco(tipo?: TipoConteudo, categoria?: string): Promise<ItemLista[]> {
  const todos: ItemLista[] = [];
  for (let de = 0; ; de += 1000) {
    let consulta = tabela().select(COLUNAS_LISTA).eq("status", "publicado")
      .order("publicado_em", { ascending: false, nullsFirst: false }).order("atualizado_em", { ascending: false }).order("id");
    if (tipo) consulta = consulta.eq("tipo", tipo);
    if (categoria) consulta = consulta.eq("categoria_id", categoria);
    const { data, error } = await consulta.range(de, de + 999);
    if (error && colunaAusente(error)) {
      // Antes da migration só existem links: a lista geral segue funcionando; os índices por tipo ficam vazios.
      if (tipo) return [];
      let antiga = tabela().select("id,titulo,resumo,url,destino,status,categoria_id,atualizado_em").eq("status", "publicado").order("atualizado_em", { ascending: false }).order("id");
      if (categoria) antiga = antiga.eq("categoria_id", categoria);
      const r = await antiga.range(0, 999);
      if (r.error) throw r.error;
      return (r.data ?? []).map((l) => ({ ...l, tipo: "link", slug: null, capa_url: null, capa_alt: null, publicado_em: null })) as unknown as ItemLista[];
    }
    if (error) throw error;
    const pagina = (data ?? []) as unknown as ItemLista[];
    todos.push(...pagina);
    if (pagina.length < 1000) return todos;
  }
}
export type ItemLista = Pick<ConteudoRadar, "id" | "titulo" | "resumo" | "destino" | "categoria_id" | "capa_url" | "capa_alt" | "publicado_em" | "atualizado_em"> & {
  tipo: TipoConteudo | "link";
  slug: string | null;
  url: string | null;
};

/** Texto publicado no banco pelo endereço; rascunho, arquivado ou inexistente devolvem null. */
export async function buscarConteudoNoBanco(slug: string): Promise<ConteudoRadar | null> {
  if (!SLUG_CONTEUDO.test(slug)) return null;
  const { data, error } = await tabela().select(COLUNAS_CONTEUDO).eq("slug", slug).eq("status", "publicado").neq("tipo", "link").limit(1).maybeSingle();
  if (error && colunaAusente(error)) return null;
  if (error) throw error;
  return (data as unknown as ConteudoRadar | null) ?? null;
}

/** Até quatro textos do mesmo tipo no banco, mais recentes, fora o atual (a junção com o repositório escolhe três). */
export async function relacionadosNoBanco(atual: Pick<ConteudoRadar, "id" | "tipo">): Promise<ItemLista[]> {
  const { data, error } = await tabela()
    .select(COLUNAS_LISTA)
    .eq("status", "publicado").eq("tipo", atual.tipo).neq("id", atual.id)
    .order("publicado_em", { ascending: false, nullsFirst: false }).order("id").limit(4);
  if (error && colunaAusente(error)) return [];
  if (error) throw error;
  return (data ?? []) as unknown as ItemLista[];
}

/** Lista do admin: todos os status, com o corpo para editar. */
export async function listarConteudosAdmin(pagina: number, status: string) {
  let consulta = tabela().select(`${COLUNAS_CONTEUDO},url`, { count: "exact" }).order("atualizado_em", { ascending: false }).order("id");
  if (status !== "todos") consulta = consulta.eq("status", status);
  const { data, count, error } = await consulta.range(pagina * 20, pagina * 20 + 19);
  if (error) throw error;
  return { itens: (data ?? []) as unknown as (Omit<ConteudoRadar, "tipo" | "slug" | "corpo"> & { tipo: TipoConteudo | "link"; slug: string | null; corpo: string | null; url: string | null })[], total: count ?? 0 };
}

export async function salvarConteudo(entrada: ConteudoEntrada, id?: string): Promise<string> {
  const d = conteudoSchema.parse(entrada);
  const linha = {
    tipo: d.tipo, titulo: d.titulo, slug: d.slug, resumo: d.resumo, corpo: d.corpo,
    capa_url: d.capa_url, capa_alt: d.capa_url ? d.capa_alt : null, autor_nome: d.autor_nome,
    seo_titulo: d.seo_titulo, seo_descricao: d.seo_descricao, canonical_externo: d.canonical_externo,
    destino: d.destino, status: d.status, categoria_id: d.categoria_id ?? null, url: null,
  };
  const { data, error } = await (id ? tabela().update(linha).eq("id", id) : tabela().insert(linha)).select("id").single();
  if (error || !data) throw new Error((error as { code?: string } | null)?.code === "23505" ? "Já existe um texto com este endereço. Mude o endereço e salve de novo." : "Não foi possível salvar. Confira seu acesso e tente novamente.");
  return (data as { id: string }).id;
}

const EXTENSOES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const CAPA_MAX_BYTES = 5 * 1024 * 1024;

/** Envia a capa ao bucket público do Radar e devolve o endereço público da imagem. */
export async function enviarCapa(arquivo: File, slug: string): Promise<string> {
  const extensao = EXTENSOES[arquivo.type];
  if (!extensao) throw new Error("Use uma imagem JPG, PNG ou WebP.");
  if (arquivo.size > CAPA_MAX_BYTES) throw new Error("A imagem pode ter até 5 MB.");
  const caminho = `${SLUG_CONTEUDO.test(slug) ? slug : "capa"}-${Date.now()}.${extensao}`;
  const { error } = await supabase.storage.from(BUCKET_CONTEUDOS).upload(caminho, arquivo, { contentType: arquivo.type, cacheControl: "31536000" });
  if (error) throw new Error("Não foi possível enviar a imagem. Confira seu acesso e tente novamente.");
  return supabase.storage.from(BUCKET_CONTEUDOS).getPublicUrl(caminho).data.publicUrl;
}
