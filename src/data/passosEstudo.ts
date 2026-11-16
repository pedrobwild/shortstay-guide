/**
 * O estudo em 3 passos (decisão do Pedro, 15–16/11/2026): escolher o bairro, fazer a
 * conta e planejar a reforma. É a mesma ordem da barra do site (Bairros · Simular ·
 * Reforma); aqui ela ganha número, para a pessoa saber onde está e o que vem depois.
 * As telas são as de sempre: quem chega para consultar um dado usa a página normalmente.
 */
export interface PassoEstudo {
  numero: 1 | 2 | 3;
  /** Ação do passo: "Escolha o bairro". */
  rotulo: string;
  /** Nome curto, para a faixa: "Bairro". */
  curto: string;
  /** O que a pessoa leva do passo. */
  resumo: string;
  to: string;
  /** Rotas em que o passo está em curso. */
  ativoEm: string[];
}

export const PASSOS_ESTUDO: PassoEstudo[] = [
  {
    numero: 1,
    rotulo: "Escolha o bairro",
    curto: "Bairro",
    resumo: "Diária, ocupação e receita de referência, com fonte e data.",
    to: "/ranking",
    ativoEm: ["/ranking", "/mapa", "/comparar", "/mercado", "/bairro"],
  },
  {
    numero: 2,
    rotulo: "Faça a conta",
    curto: "Conta",
    resumo: "Quanto sobra por mês depois dos custos, com hipóteses que você ajusta.",
    to: "/projecao",
    ativoEm: ["/projecao"],
  },
  {
    numero: 3,
    rotulo: "Planeje a reforma",
    curto: "Reforma",
    resumo: "Custo pela área, prazo em contrato e obras entregues pela Bewild.",
    to: "/reformar",
    ativoEm: ["/reformar"],
  },
];

/** Passo em curso na rota, ou null quando a tela não faz parte do estudo. */
export function passoDaRota(pathname: string): PassoEstudo | null {
  const casa = (base: string) => pathname === base || pathname.startsWith(`${base}/`);
  return PASSOS_ESTUDO.find((p) => p.ativoEm.some(casa)) ?? null;
}

/** Passo seguinte, ou null no último. */
export function proximoPasso(passo: PassoEstudo): PassoEstudo | null {
  return PASSOS_ESTUDO.find((p) => p.numero === passo.numero + 1) ?? null;
}

/** Destino do passo; a conta leva o bairro atual quando há um. */
export function destinoDoPasso(passo: PassoEstudo, slugBairro?: string | null): string {
  return passo.numero === 2 && slugBairro ? `${passo.to}?bairro=${encodeURIComponent(slugBairro)}` : passo.to;
}

/** Consulta direta na home: para quem já conhece o Radar e volta para ver um dado. */
export const ATALHOS_CONSULTA = [
  { to: "/ranking", rotulo: "Bairros", resumo: "Lista, mapa e comparação dos bairros", id: "consulta_bairros" },
  { to: "/eventos", rotulo: "Eventos", resumo: "Datas e efeito na diária por bairro", id: "consulta_eventos" },
  { to: "/#guia", rotulo: "Guia do investidor", resumo: "Compra, reforma e operação", id: "consulta_guia" },
  { to: "/metodologia", rotulo: "Dados e método", resumo: "Fontes, datas e base aberta", id: "consulta_dados" },
] as const;
