import { LINKS_REFORMA_SITE } from "@/data/artigosBewild";

/**
 * Endereços de retorno para o bewild.com.br (índice de custo e páginas de reforma por
 * bairro) que NÃO aparecem como href no HTML de uma página. Lista vazia = página em
 * ordem. Usada pelo scripts/prerender.mjs, que interrompe o build quando falta algum:
 * toda página pública do Radar precisa devolver o visitante (e o robô) ao site.
 */
export function linksDeRetornoAusentes(html: string): string[] {
  return LINKS_REFORMA_SITE.map((l) => l.url).filter((url) => !html.includes(`href="${url}"`));
}
