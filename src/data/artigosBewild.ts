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
  melhoresBairros: a("Os melhores bairros para short stay em São Paulo", "melhores-bairros-short-stay-sao-paulo"),
  gestao: a("Gestão própria ou gestora", "gestao-propria-vs-gestora"),
  shortVsLong: a("Short stay ou long stay no studio compacto", "short-stay-ou-long-stay-studio-compacto"),
  custoReforma: a("Quanto custa reformar um studio de até 50 m²", "quanto-custa-reformar-apartamento-studio-ate-50-m2"),
  lei: a("Studios no Airbnb em São Paulo: o que a lei permite", "studios-airbnb-sao-paulo-o-que-a-lei-permite"),
  retorno: a("Quanto rende um studio de short stay em São Paulo", "quanto-rende-studio-short-stay-sao-paulo"),
} as const;

/** Depoimento publicado do case em destaque. */
export const DEPOIMENTO_VIVIAN_URL = "https://bewild.com.br/videos/depoimento-vivian";

/** Bairros com página própria de reforma no site; os demais vão para a página geral. */
const REFORMA_COM_PAGINA = new Set([
  "bela-vista", "brooklin", "campo-belo", "consolacao", "moema", "perdizes", "pinheiros",
  "republica", "vila-mariana", "vila-nova-conceicao", "vila-olimpia",
]);
export const REFORMA_GERAL_URL = "https://bewild.com.br/reforma-de-studio-sao-paulo";

export function reformaBairroUrl(bairro: string): string {
  const slug = slugifyBairro(bairro);
  return REFORMA_COM_PAGINA.has(slug) ? `https://bewild.com.br/reforma/${slug}` : REFORMA_GERAL_URL;
}
export const ancoraReformaBairro = (bairro: string) => `Reforma de studio em ${bairro}: projetos entregues e orçamento`;
