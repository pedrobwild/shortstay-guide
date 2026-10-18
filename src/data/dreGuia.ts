/**
 * DRE padrão do guia — fonte única das deduções do short stay.
 *
 * Toda conta pública do Radar que parte da receita bruta (exemplo de Pinheiros,
 * cenários, simulador da home e da /projecao, simulador do painel, admin de
 * simulações, jornada) lê daqui. Nenhum componente repete estes percentuais.
 *
 * Origem: DRE padrão do guia; gestão em 18% por decisão do Pedro (18/10/2026),
 * mesmo valor do painel de projeção (DEFAULT_PROJECTION_COSTS). Todos são
 * HIPÓTESES editáveis pela pessoa — nunca estatística de mercado.
 */

/** Percentuais sobre a receita bruta mensal. */
export const DRE_GUIA = {
  /** Taxa do Airbnb cobrada do anfitrião. */
  airbnbPct: 3,
  /** Gestão (administradora). */
  gestaoPct: 18,
  /** Impostos (ISS + Simples). */
  impostosPct: 6,
  /** Manutenção e reposição. */
  manutencaoPct: 5,
  /** Custos fixos do imóvel (condomínio + IPTU); na conta em reais, a pessoa informa. */
  fixosPct: 8,
  /** Contas (luz, água, gás, internet); na conta em reais, a pessoa informa. */
  contasPct: 3,
} as const;

/** Deduções que incidem como percentual da receita bruta (o que o simulador aplica em %). */
export const DRE_PERCENTUAIS_PCT = DRE_GUIA.airbnbPct + DRE_GUIA.gestaoPct + DRE_GUIA.impostosPct + DRE_GUIA.manutencaoPct;

/** Deduções totais do DRE (percentuais + fixos + contas). */
export const DEDUCOES_PADRAO_PCT = DRE_PERCENTUAIS_PCT + DRE_GUIA.fixosPct + DRE_GUIA.contasPct;

/** Despesas em reais do exemplo do guia (hipóteses): condomínio e contas mensais. */
export const DESPESAS_EXEMPLO = { condominio: 500, contas: 500 } as const;

/** Resultado líquido mensal pela regra resumida (receita bruta × (1 − deduções totais)). */
export function resultadoLiquidoMensal(receitaBrutaMensal: number): number {
  return Math.round(receitaBrutaMensal * (1 - DEDUCOES_PADRAO_PCT / 100));
}

/**
 * Conta detalhada do guia: percentuais do DRE sobre a receita bruta mais as
 * despesas fixas em reais (condomínio, IPTU e contas). É a mesma conta do simulador,
 * com cada linha arredondada ao real, para os dois mostrarem o mesmo número.
 */
export function liquidoDetalhado(receitaBruta: number, despesas: { condominio: number; iptu?: number; contas: number } = DESPESAS_EXEMPLO) {
  const pct = (p: number) => Math.round(receitaBruta * (p / 100));
  const airbnb = pct(DRE_GUIA.airbnbPct);
  const gestao = pct(DRE_GUIA.gestaoPct);
  const impostos = pct(DRE_GUIA.impostosPct);
  const manutencao = pct(DRE_GUIA.manutencaoPct);
  const fixos = despesas.condominio + (despesas.iptu ?? 0) + despesas.contas;
  return { airbnb, gestao, impostos, manutencao, fixos, liquido: receitaBruta - airbnb - gestao - impostos - manutencao - fixos };
}

const pctTexto = (p: number) => `${new Intl.NumberFormat("pt-BR").format(p)}%`;

/** Linhas do DRE para telas e textos (rótulo acessível + termo técnico na explicação). */
export const DRE_LINHAS = [
  { chave: "airbnb", rotulo: "Taxa do Airbnb", pct: DRE_GUIA.airbnbPct, nota: "Comissão da plataforma, cobrada do anfitrião" },
  { chave: "gestao", rotulo: "Gestão (administradora)", pct: DRE_GUIA.gestaoPct, nota: "Operadora ou autogestão" },
  { chave: "impostos", rotulo: "Impostos", pct: DRE_GUIA.impostosPct, nota: "ISS + Simples; varia por regime fiscal" },
  { chave: "manutencao", rotulo: "Manutenção e reposição", pct: DRE_GUIA.manutencaoPct, nota: "Pequenos reparos e enxoval" },
  { chave: "fixos", rotulo: "Condomínio + IPTU", pct: DRE_GUIA.fixosPct, nota: "Custos fixos do imóvel" },
  { chave: "contas", rotulo: "Contas (luz, água, internet)", pct: DRE_GUIA.contasPct, nota: "Pagas pelo anfitrião" },
] as const;

/** Resumo dos percentuais que o simulador aplica (sem os fixos, que entram em reais). */
export const TEXTO_DRE_PERCENTUAIS =
  `Airbnb ${pctTexto(DRE_GUIA.airbnbPct)}, gestão ${pctTexto(DRE_GUIA.gestaoPct)}, impostos ${pctTexto(DRE_GUIA.impostosPct)} e manutenção ${pctTexto(DRE_GUIA.manutencaoPct)} da receita bruta`;

/** Resumo completo do DRE, com os fixos e as contas. */
export const TEXTO_DRE_COMPLETO =
  `${TEXTO_DRE_PERCENTUAIS}; fixos ${pctTexto(DRE_GUIA.fixosPct)} e contas ${pctTexto(DRE_GUIA.contasPct)} — total ${pctTexto(DEDUCOES_PADRAO_PCT)}`;

/** Definição única de investimento total usada em rentabilidade e prazo de retorno. */
export const TEXTO_INVESTIMENTO_TOTAL = "valor do imóvel + reforma (+ ITBI, quando informado)";

/** Investimento total: valor do imóvel + reforma + ITBI (quando informado). */
export function investimentoTotal(partes: { imovel: number; reforma?: number; itbi?: number }): number {
  return Math.max(0, partes.imovel) + Math.max(0, partes.reforma ?? 0) + Math.max(0, partes.itbi ?? 0);
}
