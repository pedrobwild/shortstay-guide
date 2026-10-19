/**
 * Temas do conteúdo educativo do guia com página própria (/guia/<slug>). Na home
 * cada tema aparece como cartão resumido com o link para a página; o conteúdo
 * completo vive só na página (indexável e sem duplicar a home).
 * Os textos de SEO de cada página ficam em seoRoutes.json (routes).
 */
export const TEMAS_GUIA = [
  { slug: "hospede", secaoId: "reservas", titulo: "O que influencia a escolha do hóspede", resumo: "Os 6 fatores que pesam na decisão de reserva e no desempenho do studio." },
  { slug: "anti-checklist", secaoId: "antichecklist", titulo: "Anti-checklist: o que não fazer", resumo: "Erros que comprometem a rentabilidade — aprenda antes de cometer." },
  { slug: "decoracao", secaoId: "decoracao", titulo: "Decoração estratégica", resumo: "Design que ajuda a converter: estética, funcionalidade e rentabilidade." },
  { slug: "tendencias", secaoId: "tendencias", titulo: "Tendências 2026", resumo: "Práticas para planejar produto e operação, sem garantia de desempenho." },
  { slug: "anuncio-e-precificacao", secaoId: "anuncio-pricing", titulo: "Anúncio e precificação", resumo: "Como montar o anúncio e definir a diária com base nos dados do bairro." },
  // Redesign Estudo aberto (out/2026): seções que saíram da home ganharam página própria.
  { slug: "escolha-do-ativo", secaoId: "escolha-ativo", titulo: "Escolha do imóvel", resumo: "Metragem, andar, prédio e localização: o que avaliar antes de comprar o studio." },
  { slug: "rentabilidade", secaoId: "rentabilidade", titulo: "Como ler a rentabilidade", resumo: "Da receita bruta ao resultado líquido, com o DRE do guia e o investimento total." },
  { slug: "reforma", secaoId: "reforma", titulo: "Reforma inteligente", resumo: "Quanto investir na reforma e como comparar materiais e serviços." },
  { slug: "checklist", secaoId: "checklist", titulo: "Checklist do investidor", resumo: "Avalie a sua preparação antes de investir." },
] as const;
export type SlugTemaGuia = (typeof TEMAS_GUIA)[number]["slug"];
export const caminhoTema = (slug: SlugTemaGuia) => `/guia/${slug}`;
export const temaPorSlug = (slug: string) => TEMAS_GUIA.find((t) => t.slug === slug);
