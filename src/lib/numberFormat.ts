/** Apenas apresentação: não arredonda nem altera os valores usados nos cálculos. */
const formatters = new Map<number, Intl.NumberFormat>();

export function formatDecimal(value: number, digits = 1): string {
  let formatter = formatters.get(digits);
  if (!formatter) {
    formatter = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    formatters.set(digits, formatter);
  }
  return formatter.format(value);
}

/** Recebe pontos percentuais (62), não a fração (0,62). */
export const formatPercent = (value: number, digits = 1) => `${formatDecimal(value, digits)}%`;

/**
 * Reais inteiros para exibição: "R$ 5.580". Negativos usam o sinal de menos
 * tipográfico antes do símbolo: "−R$ 31.392". Só apresentação.
 */
export function formatBRL(value: number): string {
  const inteiro = Math.round(value);
  const sinal = inteiro < 0 ? "−" : "";
  return `${sinal}R$ ${formatDecimal(Math.abs(inteiro), 0)}`;
}
