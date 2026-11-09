// Links para as análises em artigo e páginas de reforma do bewild.com.br.
// O Radar fica com dados e ferramentas; a análise e o serviço ficam no site.
// Link normal: sem nofollow e sem UTM (UTM só nos botões de orçamento).
import { slugifyBairro } from "@/lib/seo";

export type ArtigoBewild = { titulo: string; url: string };

const C = "https://bewild.com.br/conteudos";
const a = (titulo: string, slug: string): ArtigoBewild => ({ titulo, url: `${C}/${slug}` });

export const ARTIGOS_BEWILD = {
  reservas: a("O que faz o hóspede escolher o seu studio", "o-que-move-reservas-studio-airbnb"),
  antiChecklist: a("O que não reformar no studio de short stay", "o-que-nao-reformar-no-studio-short-stay"),
  piso: a("Piso vinílico ou porcelanato no studio", "piso-vinilico-ou-porcelanato-studio"),
  avaliarUnidade: a("Como avaliar um studio antes de comprar", "como-avaliar-studio-antes-de-comprar"),
  custosOperacao: a("Os custos de operar um studio de short stay", "custos-de-operar-studio-short-stay"),
  precificacao: a("Como precificar um studio no Airbnb em São Paulo", "como-precificar-studio-airbnb-sao-paulo"),
  melhoresBairros: a("os melhores bairros para short stay em São Paulo", "melhores-bairros-short-stay-sao-paulo"),
  gestao: a("Gestão própria ou gestora", "gestao-propria-vs-gestora"),
  shortVsLong: a("Short stay ou long stay no studio compacto", "short-stay-ou-long-stay-studio-compacto"),
  custoReforma: a("Quanto custa reformar um studio de até 50 m²", "quanto-custa-reformar-apartamento-studio-ate-50-m2"),
  lei: a("Studios no Airbnb em São Paulo: o que a lei permite", "studios-airbnb-sao-paulo-o-que-a-lei-permite"),
  retorno: a("Quanto rende um studio de short stay em São Paulo", "quanto-rende-studio-short-stay-sao-paulo"),
} as const;

/** Depoimento publicado do case em destaque. */
export const DEPOIMENTO_VIVIAN_URL = "https://bewild.com.br/videos/depoimento-vivian";

/**
 * Índice Bewild de custo de reforma (bewild.com.br/indice-de-custo-de-reforma): a tabela
 * por metragem do mesmo estudo de provasBewild.ts. A âncora não leva número — os números
 * vivem só em provasBewild.ts.
 */
export const INDICE_CUSTO: ArtigoBewild = {
  titulo: "Custo de reforma por m² em São Paulo: índice Bewild",
  url: "https://bewild.com.br/indice-de-custo-de-reforma",
};

/**
 * Páginas /reforma/<bairro> que existem no bewild.com.br (sitemap do site, conferido em
 * 09/11/2026), com a preposição que o site usa no H1 ("no Brooklin", "na Paulista").
 * Página nova de bairro no site entra aqui; o teste linksBewild.test.ts trava a lista.
 * Higienópolis, Paulista, Vila Clementino e Vila Madalena não têm página de bairro no
 * Radar, mas entram no bloco de retorno e nas páginas de prédio desses bairros.
 */
export const BAIRROS_REFORMA_SITE = [
  { slug: "bela-vista", rotulo: "Reforma na Bela Vista" },
  { slug: "brooklin", rotulo: "Reforma no Brooklin" },
  { slug: "butanta", rotulo: "Reforma no Butantã" },
  { slug: "campo-belo", rotulo: "Reforma no Campo Belo" },
  { slug: "consolacao", rotulo: "Reforma na Consolação" },
  { slug: "higienopolis", rotulo: "Reforma em Higienópolis" },
  { slug: "moema", rotulo: "Reforma em Moema" },
  { slug: "paulista", rotulo: "Reforma na Paulista" },
  { slug: "perdizes", rotulo: "Reforma em Perdizes" },
  { slug: "pinheiros", rotulo: "Reforma em Pinheiros" },
  { slug: "republica", rotulo: "Reforma na República" },
  { slug: "vila-clementino", rotulo: "Reforma na Vila Clementino" },
  { slug: "vila-madalena", rotulo: "Reforma na Vila Madalena" },
  { slug: "vila-mariana", rotulo: "Reforma na Vila Mariana" },
  { slug: "vila-nova-conceicao", rotulo: "Reforma na Vila Nova Conceição" },
  { slug: "vila-olimpia", rotulo: "Reforma na Vila Olímpia" },
] as const;

const urlReformaBairro = (slug: string) => `https://bewild.com.br/reforma/${slug}`;
export const REFORMA_GERAL_URL = "https://bewild.com.br/reforma-de-studio-sao-paulo";

/** Página de reforma do bairro no site, quando existe (null: o site não tem página desse bairro). */
export function paginaReformaBairro(bairro: string): { slug: string; rotulo: string; url: string } | null {
  const slug = slugifyBairro(bairro);
  const pagina = BAIRROS_REFORMA_SITE.find((b) => b.slug === slug);
  return pagina ? { ...pagina, url: urlReformaBairro(pagina.slug) } : null;
}

/** Bairro com página própria vai para ela; os demais, para a página geral de reforma de studio. */
export function reformaBairroUrl(bairro: string): string {
  return paginaReformaBairro(bairro)?.url ?? REFORMA_GERAL_URL;
}
export const ancoraReformaBairro = (bairro: string) => `Reforma de studio em ${bairro}: projetos entregues e orçamento`;

/**
 * Links de retorno do Radar para o site, presentes em toda página pública (bloco
 * ReformaNoSite no rodapé e no HTML pré-renderizado): o índice de custo e as páginas de
 * reforma por bairro. scripts/prerender.mjs barra o build se alguma página sair sem eles.
 */
export const LINKS_REFORMA_SITE: ArtigoBewild[] = [
  INDICE_CUSTO,
  ...BAIRROS_REFORMA_SITE.map((b) => ({ titulo: b.rotulo, url: urlReformaBairro(b.slug) })),
];
