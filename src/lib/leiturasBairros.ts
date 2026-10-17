/**
 * Leituras complementares do /mapa (ranking, cards e comparação de perfis):
 * os critérios internos do mapa anterior (score, perfil de demanda, concorrência,
 * eventos) com os números de mercado da base do Radar — a mesma do painel do
 * bairro, para o mesmo bairro nunca aparecer com dois valores na tela.
 * Bairro fora da base não ganha número de mercado: não há fonte para ele.
 */
import { receitaMensalReferencia } from "@/data/bairrosCurados";
import type { Neighborhood, NeighborhoodMetrics } from "@/data/mapaBairrosData";
import {
  avisoAmostraBairro, fonteCurtaBairro, naturezaBairro, normalizarTexto,
  type BairroBase, type NaturezaBairro,
} from "@/lib/radarUi";

export const SEM_FONTE_LEITURA = "Fora da base do Radar: sem diária e ocupação com fonte";

export interface LeituraBairro extends Omit<Neighborhood, "metrics"> {
  metrics: Omit<NeighborhoodMetrics, "activeListings"> & { activeListings: number | null };
  /** Bairro presente na base do Radar (números de mercado com fonte). */
  naBase: boolean;
  natureza: NaturezaBairro | null;
  /** Aviso de amostra pequena (Mooca). */
  aviso: string | null;
}

export function alinharLeiturasComBase(lista: Neighborhood[], base: BairroBase[]): LeituraBairro[] {
  const porNome = new Map(base.map((b) => [normalizarTexto(b.name), b]));
  return lista.map((n) => {
    const b = porNome.get(normalizarTexto(n.name));
    if (!b) {
      // Sem fonte: zera os números do seed do mapa antigo para nunca chegarem à tela.
      return {
        ...n, avgNightly: 0, avgOccupancy: 0, naBase: false, natureza: null, aviso: null,
        metrics: { ...n.metrics, nightlyRate: 0, nightlyRateRange: [0, 0], occupancy: 0, estimatedROI: 0, activeListings: null, avgRevenueMo: 0, dataSource: SEM_FONTE_LEITURA },
      };
    }
    return {
      ...n,
      name: b.name,
      avgNightly: b.dailyAvg,
      avgOccupancy: b.avgOccupancy,
      naBase: true,
      natureza: naturezaBairro(b),
      aviso: avisoAmostraBairro(b),
      metrics: {
        ...n.metrics,
        nightlyRate: b.dailyAvg,
        nightlyRateRange: [b.dailyMin, b.dailyMax],
        occupancy: b.avgOccupancy,
        activeListings: b.activeListings,
        avgRevenueMo: receitaMensalReferencia(b),
        dataSource: fonteCurtaBairro(b),
      },
    };
  });
}

/**
 * Tag do bairro (chip em português, minúsculo) → chave do filtro de perfil de demanda
 * (DEMAND_FILTERS usa chaves em inglês; comparar tag com chave direto nunca casava).
 */
const TAG_PARA_PERFIL: Record<string, string> = {
  misto: "mixed",
  corporativo: "business",
  turismo: "tourism",
  "turismo premium": "tourism",
  eventos: "events",
  hospitais: "medical",
  "próximo ao metrô": "metro",
};

/** O bairro tem algum dos perfis de demanda escolhidos (chaves de DEMAND_FILTERS)? */
export function temPerfil(n: Pick<Neighborhood, "tags">, perfis: string[]): boolean {
  if (!perfis.length) return false;
  return n.tags.some((t) => {
    const perfil = TAG_PARA_PERFIL[t.toLowerCase()];
    return perfil !== undefined && perfis.includes(perfil);
  });
}
