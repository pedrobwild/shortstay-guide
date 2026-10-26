/**
 * Artigos da área exclusiva (só para quem tem conta no Radar). O texto vive nos
 * componentes de src/components/exclusivo/; os números saem da base aprovada
 * (bairrosCurados.ts) e do DRE do guia, por src/lib/artigosExclusivos.ts, e o teste
 * artigosExclusivos.test.ts confere que as afirmações continuam valendo para a base.
 */
export const CAMINHO_AREA_EXCLUSIVA = "/area-exclusiva";

export type SlugArtigoExclusivo = "pinheiros" | "brooklin";

export interface ArtigoExclusivo {
  slug: SlugArtigoExclusivo;
  /** Bairro analisado, como aparece na base. */
  bairro: string;
  titulo: string;
  resumo: string;
  /** Data da base usada nas contas (dd/mm/aaaa). */
  baseEm: string;
  leituraMin: number;
}

export const ARTIGOS_EXCLUSIVOS: ArtigoExclusivo[] = [
  {
    slug: "pinheiros",
    bairro: "Pinheiros",
    titulo: "Studio para Airbnb em Pinheiros: o que os dados de 2026 mostram",
    resumo: "Pinheiros está entre as maiores receitas de referência do Radar, mas a diária média descreve um studio entre os 25% mais caros do bairro. Veja a conta a partir do studio típico.",
    baseEm: "18/10/2026",
    leituraMin: 7,
  },
  {
    slug: "brooklin",
    bairro: "Brooklin",
    titulo: "Short stay no Brooklin: o que os dados mostram e o que ainda falta saber",
    resumo: "O Brooklin não tem dado público próprio. Veja até onde vai a aproximação pelo Itaim Bibi e como montar cenários sem cair numa conta otimista.",
    baseEm: "18/10/2026",
    leituraMin: 7,
  },
];

export const caminhoArtigoExclusivo = (slug: SlugArtigoExclusivo) => `${CAMINHO_AREA_EXCLUSIVA}/${slug}`;

export function artigoExclusivoPorSlug(slug: string | undefined): ArtigoExclusivo | undefined {
  return ARTIGOS_EXCLUSIVOS.find((a) => a.slug === slug);
}
