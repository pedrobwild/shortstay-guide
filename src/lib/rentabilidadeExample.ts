import { getBairroCurado, receitaMensalReferencia } from "@/data/bairrosCurados";
import { STUDIO_EXEMPLO_TOTAL } from "@/data/provasBewild";

/** Rendimento sobre o investimento completo do exemplo oficial, sem mudar taxas. */
export function retornoSobreInvestimentoExemplo(receitaLiquidaMensal: number) {
  const anual = receitaLiquidaMensal * 12;
  return { investimento: STUDIO_EXEMPLO_TOTAL, yieldLiquido: anual / STUDIO_EXEMPLO_TOTAL * 100, paybackAnos: anual > 0 ? STUDIO_EXEMPLO_TOTAL / anual : null };
}

/** Premissas de custos do exemplo existente; diária e ocupação vêm da base curada. */
export function exemploRentabilidadePinheiros() {
  const bairro = getBairroCurado("Pinheiros");
  if (!bairro) throw new Error("Pinheiros ausente da base curada");
  const receitaBruta = receitaMensalReferencia(bairro);
  const plataforma = receitaBruta * 0.15;
  const gestao = receitaBruta * 0.18;
  const impostos = receitaBruta * 0.06;
  const condominio = 500;
  const utilidades = 500;
  return {
    bairro, receitaBruta, plataforma, gestao, impostos, condominio, utilidades,
    receitaLiquida: receitaBruta - plataforma - gestao - impostos - condominio - utilidades,
    ...retornoSobreInvestimentoExemplo(receitaBruta - plataforma - gestao - impostos - condominio - utilidades),
    impactoOcupacao: bairro.dailyAvg * 30 * 0.05,
    impactoDiaria: 50 * 30 * bairro.avgOccupancy / 100,
  };
}