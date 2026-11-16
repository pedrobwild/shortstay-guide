/**
 * Links públicos de navegação do Radar, compartilhados pela navbar (desktop e
 * celular) e pelo menu lateral. Fonte única para que as rotas
 * públicas apareçam com o mesmo nome em todo lugar.
 */
export interface LinkNavegacao {
  /** Rota interna; âncoras da home usam "/#id". */
  to: string;
  label: string;
  /** Identificador estável para a telemetria interna (cta_clicked). */
  id: string;
  /** Prefixos de rota em que o item aparece ativo (quando cobre mais de uma tela). */
  ativoEm?: string[];
}

/**
 * Barra principal: quatro itens, um por tarefa (auditoria de UX de 15/11/2026, aprovada pelo
 * Pedro). Antes eram dez links no mesmo nível, por tipo de ferramenta, e a barra não cabia em
 * 1280 px. Nenhuma rota saiu: as demais telas ficam em GRUPOS_MENU (menu lateral) e nos
 * atalhos de cada área (VisoesBairros em /ranking, /mapa e /comparar).
 */
export const LINKS_PUBLICOS: LinkNavegacao[] = [
  { to: "/ranking", label: "Bairros", id: "bairros", ativoEm: ["/ranking", "/mapa", "/comparar", "/mercado", "/bairro"] },
  { to: "/projecao", label: "Simular", id: "simular", ativoEm: ["/projecao", "/ferramentas"] },
  { to: "/reformar", label: "Reforma", id: "reforma", ativoEm: ["/reformar", "/empreendimentos"] },
  { to: "/#guia", label: "Guia", id: "guia_temas", ativoEm: ["/guia", "/posts", "/metodologia"] },
];

/** As visões da área Bairros: a mesma base em lista, no mapa e lado a lado. */
export const VISOES_BAIRROS: LinkNavegacao[] = [
  { to: "/ranking", label: "Lista", id: "ranking" },
  { to: "/mapa", label: "Mapa", id: "mapa" },
  { to: "/comparar", label: "Comparar", id: "comparar" },
];

export interface GrupoMenu {
  titulo: string;
  links: LinkNavegacao[];
}

/**
 * Menu lateral (celular e tablet): todas as telas públicas, agrupadas pela tarefa.
 * "Imóveis" (/imoveis) fica fora enquanto não houver imóvel publicado; a rota continua.
 */
export const GRUPOS_MENU: GrupoMenu[] = [
  {
    titulo: "Bairros",
    links: [
      { to: "/ranking", label: "Ranking dos bairros", id: "ranking" },
      { to: "/mapa", label: "Mapa", id: "mapa" },
      { to: "/comparar", label: "Comparar bairros", id: "comparar" },
      { to: "/mercado", label: "Mercado de São Paulo", id: "mercado" },
      { to: "/eventos", label: "Eventos e diária por bairro", id: "eventos" },
    ],
  },
  {
    titulo: "Simular",
    links: [
      { to: "/projecao", label: "Resultado líquido do studio", id: "simular" },
      { to: "/ferramentas#comprar", label: "Financiamento do imóvel", id: "ferramentas" },
    ],
  },
  {
    titulo: "Reforma",
    links: [
      { to: "/reformar", label: "Planejar a reforma", id: "reforma" },
      { to: "/empreendimentos", label: "Prédios onde a Bewild atua", id: "empreendimentos" },
    ],
  },
  {
    titulo: "Já opero",
    links: [{ to: "/operar", label: "Meu studio contra o bairro", id: "operar" }],
  },
  {
    titulo: "Guia",
    links: [
      { to: "/#guia", label: "Guia por tema", id: "guia_temas" },
      { to: "/posts", label: "Posts", id: "posts" },
      { to: "/metodologia", label: "Metodologia e dados abertos", id: "metodologia" },
    ],
  },
];

/** Atalhos da barra no celular: as três tarefas (escolher o bairro → simular → reformar). */
export const ATALHOS_CELULAR = ["bairros", "simular", "reforma"] as const;

/** Item ativo: pelos prefixos de `ativoEm` quando existem; senão pela própria rota. Âncoras sem `ativoEm` nunca ficam ativas. */
export function linkAtivo(link: LinkNavegacao, pathname: string) {
  const casa = (base: string) => pathname === base || pathname.startsWith(`${base}/`);
  if (link.ativoEm) return link.ativoEm.some(casa);
  if (link.to.includes("#")) return false;
  if (link.to === "/") return pathname === "/";
  return casa(link.to);
}

/** Link para o simulador com o bairro já escolhido (o simulador saiu da home e vive em /projecao). */
export function linkSimuladorBairro(slug: string) {
  return `/projecao?bairro=${encodeURIComponent(slug)}`;
}

/** Link para a projeção do studio com o bairro já escolhido (slug na query). */
export function linkProjecaoBairro(slug: string) {
  return `/projecao?bairro=${encodeURIComponent(slug)}`;
}
