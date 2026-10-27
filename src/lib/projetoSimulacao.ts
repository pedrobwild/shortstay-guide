import type { LeadIntent } from "@/lib/leadProvisioning";
import { slugifyBairro } from "@/lib/seo";
import { MARCADOR_REABRIR, normalizarPremissasSimulador, premissasParaQuery, type PremissasSimulador } from "@/lib/simuladorReceita";

/** Versão do modelo de cálculo gravada junto da simulação. Muda quando o modelo mudar (DRE, reforma, indicadores). */
export const VERSAO_CALCULO = "simulador-v1-dre-2026-10-18";

/**
 * Premissas para reabrir um projeto: a `PremissasSimulador` íntegra quando foi guardada;
 * projetos antigos (só bairro e faixa de área) reabrem com o padrão do simulador.
 */
export function premissasDoProjeto(
  row: { premissas_simulador?: unknown; neighborhood?: string | null; area_sqm?: string | null } | null,
): PremissasSimulador {
  return normalizarPremissasSimulador(row?.premissas_simulador ?? { bairro: row?.neighborhood, area: row?.area_sqm });
}

/**
 * Caminho da /projecao com as mesmas premissas (só números e escolhas, nenhum dado pessoal).
 * O marcador `reabrir=1` faz a /projecao aplicar a conta inteira (padrão + o que veio), sem misturar
 * com o rascunho de quem abre, mesmo quando os valores guardados são iguais ao padrão.
 */
export function linkReabrirSimulacao(p: PremissasSimulador): string {
  const q = premissasParaQuery(p, p.bairro ? slugifyBairro(p.bairro) : null);
  return `/projecao?${q ? `${q}&` : ""}${MARCADOR_REABRIR}=1`;
}

/** A coleta vigente é de outro dia que a da simulação guardada? Compara só a data (aaaa-mm-dd); sem data conhecida conta como mudou. */
export function baseMudou(baseColetadaEm: string | null, coletadoEmAtual: string | null): boolean {
  if (!baseColetadaEm || !coletadoEmAtual) return true;
  return baseColetadaEm.slice(0, 10) !== coletadoEmAtual.slice(0, 10);
}

/** O que "Guardar no Painel" leva: bairro e faixa (como antes) mais as premissas íntegras, a versão do cálculo e a coleta vigente. */
export function intentDaSimulacao(p: PremissasSimulador, coletadoEmAtual: string | null): LeadIntent {
  return {
    neighborhood: p.bairro ?? undefined,
    area_sqm: p.area,
    premissas: p,
    versao_calculo: VERSAO_CALCULO,
    base_coletada_em: coletadoEmAtual,
  };
}
