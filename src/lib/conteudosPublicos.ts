/**
 * Junção dos textos do repositório (publicados por PR) com os do banco (admin e links do site
 * Bewild). O mesmo endereço nunca aparece duas vezes: o arquivo do repositório prevalece.
 * Ordem: mais recente primeiro, empate pelo endereço/id, igual no app e no build.
 */
import {
  POR_PAGINA, buscarConteudoNoBanco, publicadosDoBanco, relacionadosNoBanco,
  type ConteudoRadar, type ItemLista, type TipoConteudo,
} from "@/lib/conteudosRadar";
import { conteudosDoRepositorio } from "@/lib/conteudosRepositorio";

export const itemDeConteudo = (c: ConteudoRadar): ItemLista => ({
  id: c.id, tipo: c.tipo, titulo: c.titulo, slug: c.slug, resumo: c.resumo, url: null, destino: c.destino,
  categoria_id: c.categoria_id, capa_url: c.capa_url, capa_alt: c.capa_alt, publicado_em: c.publicado_em, atualizado_em: c.atualizado_em,
});

const dataDoItem = (i: Pick<ItemLista, "publicado_em" | "atualizado_em">) => i.publicado_em ?? i.atualizado_em;

/** Junta as duas origens, sem repetir endereço (repositório prevalece), da mais recente para a mais antiga. */
export function juntarItens(doRepositorio: ItemLista[], doBanco: ItemLista[]): ItemLista[] {
  const slugs = new Set(doRepositorio.map((i) => i.slug));
  const banco = doBanco.filter((i) => !i.slug || !slugs.has(i.slug));
  return [...doRepositorio, ...banco].sort((a, b) =>
    new Date(dataDoItem(b)).getTime() - new Date(dataDoItem(a)).getTime() || (a.slug ?? a.id).localeCompare(b.slug ?? b.id));
}

/** Lista pública (índice geral ou por tipo), paginada no navegador. Texto do repositório não tem categoria. */
export async function listarConteudosPublicos(
  pagina: number, tipo?: TipoConteudo, categoria?: string,
  repositorio = conteudosDoRepositorio(), doBanco: typeof publicadosDoBanco = publicadosDoBanco,
) {
  const doRepositorio = categoria ? [] : repositorio.filter((c) => !tipo || c.tipo === tipo).map(itemDeConteudo);
  const todos = juntarItens(doRepositorio, await doBanco(tipo, categoria));
  return { itens: todos.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA), total: todos.length };
}

/** Texto do repositório pelo endereço, sem esperar a rede (a página abre na hora). */
export const conteudoDoRepositorio = (slug: string, repositorio = conteudosDoRepositorio()): ConteudoRadar | null =>
  repositorio.find((c) => c.slug === slug) ?? null;

/** Texto publicado pelo endereço: repositório primeiro, depois o banco. null = página não encontrada. */
export async function buscarConteudo(slug: string): Promise<ConteudoRadar | null> {
  return conteudoDoRepositorio(slug) ?? buscarConteudoNoBanco(slug);
}

/** Até três textos do mesmo tipo, das duas origens, fora o atual. */
export async function conteudosRelacionados(atual: Pick<ConteudoRadar, "id" | "tipo" | "slug">, repositorio = conteudosDoRepositorio()): Promise<ItemLista[]> {
  const doRepositorio = repositorio.filter((c) => c.tipo === atual.tipo && c.slug !== atual.slug).map(itemDeConteudo);
  const doBanco = (await relacionadosNoBanco(atual)).filter((i) => i.slug !== atual.slug);
  return juntarItens(doRepositorio, doBanco).slice(0, 3);
}

/** Textos do repositório ligados a uma página de dados (bloco "Leituras relacionadas"). */
export const doRepositorioParaDestino = (destino: string, repositorio = conteudosDoRepositorio()): ItemLista[] =>
  repositorio.filter((c) => c.destino === destino).map(itemDeConteudo);
