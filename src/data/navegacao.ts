/**
 * Links públicos de navegação do Radar, compartilhados pela navbar (desktop e
 * celular) e pelo menu do guia no celular. Fonte única para que as rotas
 * públicas apareçam com o mesmo nome em todo lugar.
 */
export interface LinkNavegacao {
  /** Rota interna; âncoras da home usam "/#id". */
  to: string;
  label: string;
  /** Identificador estável para a telemetria interna (cta_clicked). */
  id: string;
}

export const LINKS_PUBLICOS: LinkNavegacao[] = [
  { to: "/", label: "Início", id: "guia" },
  { to: "/mercado", label: "Mercado", id: "mercado" },
  { to: "/mapa", label: "Mapa", id: "mapa" },
  { to: "/ranking", label: "Ranking", id: "ranking" },
  { to: "/comparar", label: "Comparar", id: "comparar" },
  { to: "/projecao", label: "Simular", id: "simular" },
  { to: "/ferramentas", label: "Ferramentas", id: "ferramentas" },
];

/** Atalhos da barra no celular: o fluxo principal explorar → comparar → simular. */
export const ATALHOS_CELULAR = ["mapa", "comparar", "simular"] as const;

/** Link para o simulador da home com o bairro já escolhido (slug na query). */
export function linkSimuladorBairro(slug: string) {
  return `/?bairro=${encodeURIComponent(slug)}#simulador`;
}

/** Link para a projeção do studio com o bairro já escolhido (slug na query). */
export function linkProjecaoBairro(slug: string) {
  return `/projecao?bairro=${encodeURIComponent(slug)}`;
}
