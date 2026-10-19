import type { Momento } from "@/lib/momento";

/**
 * Os três perfis do Radar (direcionamento 2a, out/2026): quem vai comprar, quem vai
 * reformar e quem já opera o studio. Cada perfil usa a chave de momento já gravada
 * no navegador (momento.ts), para quem escolheu antes continuar no mesmo caminho:
 * procurando → 01 Vou comprar · reformar → 02 Vou reformar · tenho → 03 Já opero.
 * Textos e ferramentas aqui; os números de referência vêm da base na tela.
 */
export interface FerramentaPerfil {
  rotulo: string;
  to: string;
}

export interface PerfilRadar {
  numero: "01" | "02" | "03";
  momento: Momento;
  /** Rótulo curto: "Vou comprar". */
  rotulo: string;
  /** Situação da pessoa. */
  situacao: string;
  /** Perguntas que o Radar responde para esse perfil. */
  perguntas: string[];
  ferramentas: FerramentaPerfil[];
  /** Botão principal do perfil. */
  acao: { rotulo: string; to: string };
}

export const PERFIS_RADAR: PerfilRadar[] = [
  {
    numero: "01",
    momento: "procurando",
    rotulo: "Vou comprar",
    situacao: "Buscando um imóvel para comprar.",
    perguntas: [
      "Em qual bairro um studio rende mais?",
      "Quanto custa o financiamento?",
      "A conta fecha antes da compra?",
    ],
    ferramentas: [
      { rotulo: "Ranking dos 28 bairros", to: "/ranking" },
      { rotulo: "Mapa", to: "/mapa" },
      { rotulo: "Comparar bairros", to: "/comparar" },
      { rotulo: "Financiamento", to: "/ferramentas#comprar" },
    ],
    acao: { rotulo: "Ver o ranking", to: "/ranking" },
  },
  {
    numero: "02",
    momento: "reformar",
    rotulo: "Vou reformar",
    situacao: "Já tem o imóvel e precisa reformar.",
    perguntas: [
      "Quanto custa a reforma?",
      "Quanto tempo leva?",
      "O que faz um studio performar?",
    ],
    ferramentas: [
      { rotulo: "Estimativa de reforma por área", to: "/ferramentas#reformar" },
      { rotulo: "O que influencia o hóspede", to: "/guia/hospede" },
      { rotulo: "Decoração estratégica", to: "/guia/decoracao" },
    ],
    acao: { rotulo: "Estimar a reforma", to: "/ferramentas#reformar" },
  },
  {
    numero: "03",
    momento: "tenho",
    rotulo: "Já opero",
    situacao: "Já opera o studio.",
    perguntas: [
      "Diária e ocupação estão no nível do bairro?",
      "Quanto sobra depois dos custos?",
    ],
    ferramentas: [
      { rotulo: "Meu studio contra o bairro", to: "/ferramentas#operar" },
      { rotulo: "Simular o resultado líquido", to: "/projecao" },
      { rotulo: "Anúncio e precificação", to: "/guia/anuncio-e-precificacao" },
    ],
    acao: { rotulo: "Comparar meu studio", to: "/ferramentas#operar" },
  },
];

export const perfilDoMomento = (m: Momento | null) => PERFIS_RADAR.find((p) => p.momento === m) ?? null;
