/**
 * Textos publicados por PR (decisão do Pedro, 18/11/2026): cada arquivo
 * src/content/conteudos/<endereço>.md é um artigo, release ou estudo, com um cabeçalho entre
 * linhas "---" e o corpo em Markdown. Eles entram no app e no build junto com os textos do
 * banco (src/lib/conteudosPublicos.ts), com as mesmas páginas, sitemap, feed e llms.txt.
 *
 * O teste conteudosRepositorio.test.ts lê todos os arquivos e barra cabeçalho incompleto,
 * endereço repetido ou diferente do nome do arquivo, capa sem arquivo ou sem descrição e
 * qualquer aviso editorial ou de estrutura (skill ux-writing-blog) em texto publicado.
 * Passo a passo em docs/conteudos-por-pr.md.
 */
import { z } from "zod";
import { conteudoSchema, ehPublicavel, ordenarConteudos, type ConteudoRadar } from "@/lib/conteudosRadar";
import { avisosDoTexto } from "@/lib/conteudosEscrita";

/** Campos aceitos no cabeçalho; qualquer outro é erro (evita campo digitado errado passar em branco). */
export const CAMPOS_CABECALHO = [
  "tipo", "titulo", "resumo", "palavra_chave", "publicado_em", "atualizado_em", "status", "destino",
  "autor", "capa", "capa_alt", "seo_titulo", "seo_descricao", "canonical_externo",
] as const;
type Campo = (typeof CAMPOS_CABECALHO)[number];

const DATA = /^\d{4}-\d{2}-\d{2}$/;
/** "2026-11-18" → meio-dia em São Paulo, para a data não virar o dia anterior em UTC. */
export const dataDoCabecalho = (dia: string) => `${dia}T12:00:00-03:00`;

export class ErroConteudo extends Error {}

/** Separa cabeçalho e corpo. Cabeçalho: uma linha "campo: valor" por campo; aspas em volta são opcionais. */
export function lerArquivo(texto: string): { campos: Partial<Record<Campo, string>>; corpo: string } {
  const normal = texto.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const m = normal.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new ErroConteudo("O arquivo precisa começar com o cabeçalho entre duas linhas ---.");
  const campos: Partial<Record<Campo, string>> = {};
  for (const [i, linha] of m[1].split("\n").entries()) {
    if (!linha.trim() || linha.trim().startsWith("#")) continue;
    const par = linha.match(/^([a-z_]+):\s*(.*)$/);
    if (!par) throw new ErroConteudo(`Linha ${i + 2} do cabeçalho fora do formato "campo: valor".`);
    const [, chave, bruto] = par;
    if (!(CAMPOS_CABECALHO as readonly string[]).includes(chave)) throw new ErroConteudo(`Campo desconhecido no cabeçalho: "${chave}".`);
    if (chave in campos) throw new ErroConteudo(`Campo repetido no cabeçalho: "${chave}".`);
    const valor = bruto.trim();
    campos[chave as Campo] = /^".*"$/.test(valor) ? valor.slice(1, -1).replace(/\\"/g, '"') : valor;
  }
  return { campos, corpo: m[2].trim() };
}

const cabecalhoSchema = z.object({
  publicado_em: z.string().regex(DATA, "publicado_em no formato AAAA-MM-DD."),
  atualizado_em: z.string().regex(DATA, "atualizado_em no formato AAAA-MM-DD.").optional(),
}).refine((d) => !d.atualizado_em || d.atualizado_em >= d.publicado_em, "atualizado_em não pode ser antes de publicado_em.");

/** Arquivo → texto do Radar, validado pelas mesmas regras do formulário do admin. Lança ErroConteudo com a causa. */
export function conteudoDoArquivo(slug: string, texto: string): ConteudoRadar {
  const { campos, corpo } = lerArquivo(texto);
  const datas = cabecalhoSchema.safeParse(campos);
  if (!datas.success) throw new ErroConteudo(datas.error.issues[0]?.message ?? "Datas inválidas.");
  const r = conteudoSchema.safeParse({
    tipo: campos.tipo, titulo: campos.titulo, slug, resumo: campos.resumo, corpo,
    capa_url: campos.capa, capa_alt: campos.capa_alt, autor_nome: campos.autor,
    seo_titulo: campos.seo_titulo, seo_descricao: campos.seo_descricao, canonical_externo: campos.canonical_externo,
    destino: campos.destino, status: campos.status ?? "publicado", categoria_id: null,
  });
  if (!r.success) {
    const q = r.error.issues[0];
    throw new ErroConteudo(`${q?.path.join(".") || "texto"}: ${q?.message ?? "inválido"}`);
  }
  const d = r.data;
  const publicado = dataDoCabecalho(datas.data.publicado_em);
  return {
    id: `repo:${slug}`, origem: "repositorio",
    tipo: d.tipo, titulo: d.titulo, slug: d.slug, resumo: d.resumo, corpo: d.corpo,
    capa_url: d.capa_url, capa_alt: d.capa_url ? d.capa_alt : null, autor_nome: d.autor_nome,
    seo_titulo: d.seo_titulo, seo_descricao: d.seo_descricao, canonical_externo: d.canonical_externo,
    destino: d.destino, status: d.status, categoria_id: null,
    palavra_chave: campos.palavra_chave?.trim() || null,
    publicado_em: publicado,
    atualizado_em: datas.data.atualizado_em ? dataDoCabecalho(datas.data.atualizado_em) : publicado,
  };
}

/**
 * Avisos que impedem publicar um texto do repositório: os mesmos do formulário do admin e,
 * além deles, a palavra-chave de foco (obrigatória no arquivo) no título de busca, no H1,
 * na abertura e no primeiro subtítulo. Regras em src/lib/conteudosEscrita.ts.
 */
export const avisosDoConteudo = (c: Pick<ConteudoRadar, "tipo" | "titulo" | "resumo" | "corpo" | "seo_titulo" | "palavra_chave">) =>
  avisosDoTexto({ ...c, palavra_chave: c.palavra_chave ?? null });

/** Nome do arquivo → endereço do texto: "src/content/conteudos/meu-texto.md" → "meu-texto". */
export const slugDoCaminho = (caminho: string) => caminho.split("/").pop()!.replace(/\.md$/, "");

// Os arquivos entram no pacote do app e no build pelo Vite (texto puro).
const ARQUIVOS = import.meta.glob("/src/content/conteudos/*.md", { as: "raw", import: "default", eager: true }) as Record<string, string>;

/** Todos os arquivos lidos (inclusive rascunhos). Arquivo inválido fica de fora; o teste o aponta. */
export function arquivosDoRepositorio(arquivos: Record<string, string> = ARQUIVOS): ConteudoRadar[] {
  const lista: ConteudoRadar[] = [];
  for (const [caminho, texto] of Object.entries(arquivos)) {
    try { lista.push(conteudoDoArquivo(slugDoCaminho(caminho), texto)); }
    catch (erro) { if (import.meta.env?.DEV) console.warn(`Conteúdo ${caminho} ignorado: ${(erro as Error).message}`); }
  }
  return lista;
}

/** Textos do repositório que vão ao ar: publicados e sem aviso editorial, do mais recente ao mais antigo. */
export function conteudosDoRepositorio(arquivos?: Record<string, string>): ConteudoRadar[] {
  return ordenarConteudos(arquivosDoRepositorio(arquivos).filter((c) => ehPublicavel(c) && avisosDoConteudo(c).length === 0));
}

/** Endereços já usados por arquivo (inclusive rascunhos): o formulário do admin não deixa repetir. */
export const slugsDoRepositorio = (arquivos: Record<string, string> = ARQUIVOS): Set<string> =>
  new Set(Object.keys(arquivos).map(slugDoCaminho));

export const ARQUIVOS_CONTEUDO = ARQUIVOS;
