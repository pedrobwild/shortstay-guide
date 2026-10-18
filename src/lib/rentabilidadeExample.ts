import { getBairroCurado, receitaMensalReferencia } from "@/data/bairrosCurados";
import { STUDIO_EXEMPLO_TOTAL } from "@/data/provasBewild";
import { DESPESAS_EXEMPLO, liquidoDetalhado } from "@/data/dreGuia";

/**
 * Rendimento sobre o investimento completo do exemplo oficial (imóvel ao preço
 * FipeZap + ITBI hipotético + reforma mediana), sem mudar taxas. Mesma definição
 * de investimento total do simulador (imóvel + reforma + ITBI, quando informado).
 */
export function retornoSobreInvestimentoExemplo(receitaLiquidaMensal: number) {
  const anual = receitaLiquidaMensal * 12;
  return { investimento: STUDIO_EXEMPLO_TOTAL, yieldLiquido: anual / STUDIO_EXEMPLO_TOTAL * 100, paybackAnos: anual > 0 ? STUDIO_EXEMPLO_TOTAL / anual : null };
}

/**
 * Exemplo didático de Pinheiros: diária e ocupação da base curada; deduções do
 * DRE padrão do guia (src/data/dreGuia.ts) e despesas em reais do exemplo —
 * exatamente a conta que o simulador faz com as premissas padrão.
 */
export function exemploRentabilidadePinheiros() {
  const bairro = getBairroCurado("Pinheiros");
  if (!bairro) throw new Error("Pinheiros ausente da base curada");
  const receitaBruta = receitaMensalReferencia(bairro);
  const conta = liquidoDetalhado(receitaBruta, DESPESAS_EXEMPLO);
  const { condominio, contas: utilidades } = DESPESAS_EXEMPLO;
  return {
    bairro, receitaBruta,
    plataforma: conta.airbnb, gestao: conta.gestao, impostos: conta.impostos, manutencao: conta.manutencao, condominio, utilidades,
    receitaLiquida: conta.liquido,
    ...retornoSobreInvestimentoExemplo(conta.liquido),
    impactoOcupacao: bairro.dailyAvg * 30 * 0.05,
    impactoDiaria: 50 * 30 * bairro.avgOccupancy / 100,
  };
}

/** Receita líquida de um cenário (bruta → DRE padrão → despesas do exemplo), para cenários didáticos. */
export function liquidoCenario(receitaBruta: number): number {
  return liquidoDetalhado(receitaBruta, DESPESAS_EXEMPLO).liquido;
}
