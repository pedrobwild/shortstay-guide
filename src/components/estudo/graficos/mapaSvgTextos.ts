import type { BairroCurado } from "@/data/bairrosCurados";
import { valorIndicador, type IndicadorMapa } from "@/lib/estudoMapa";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { descricaoNatureza } from "@/lib/radarUi";
import { temAmostraPequena } from "@/lib/estudo";

/* Cores e textos da Fig. 1 do /mapa (MapaBairrosSvg), compartilhados com a legenda da página. */

/** Escala do mapa: ciano 200 / 400 / 600 / 900 (4 classes por quartil). */
export const COR_CLASSE: Record<1 | 2 | 3 | 4, string> = {
  1: "hsl(var(--ciano-200))",
  2: "hsl(var(--ciano-400))",
  3: "hsl(var(--ciano-600))",
  4: "hsl(var(--ciano-900))",
};
export const CONTORNO = "hsl(var(--foreground) / 0.55)";
export const GRADE = "hsl(var(--foreground) / 0.08)";
export const TINTA_70 = "hsl(var(--tinta-70))";

export function textoIndicador(valor: number, indicador: IndicadorMapa): string {
  if (indicador === "ocupacao") return `${formatDecimal(valor, Number.isInteger(valor) ? 0 : 1)}%`;
  return formatBRL(valor);
}

const NOME_INDICADOR: Record<IndicadorMapa, string> = {
  receita: "receita de referência",
  diaria: "diária média",
  ocupacao: "ocupação média",
};
const SUFIXO_INDICADOR: Record<IndicadorMapa, string> = { receita: " por mês", diaria: "", ocupacao: "" };

/** Texto do botão de cada círculo: bairro, valor do indicador, amostra e natureza do dado. */
export function rotuloAcessivel(b: BairroCurado, indicador: IndicadorMapa): string {
  const valor = `${NOME_INDICADOR[indicador]} ${textoIndicador(valorIndicador(b, indicador), indicador)}${SUFIXO_INDICADOR[indicador]}`;
  const amostra = b.activeListings != null && b.ocupacaoFonte !== "aproximacao" ? `, ${formatDecimal(b.activeListings, 0)} anúncios` : "";
  return `${b.name}: ${valor}${amostra}${descricaoNatureza(b)}${temAmostraPequena(b) ? ", amostra pequena" : ""}`;
}

