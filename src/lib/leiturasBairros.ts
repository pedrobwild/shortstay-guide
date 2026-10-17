/**
 * Leituras complementares do /mapa (ranking, cards e comparação de perfis):
 * os critérios internos do mapa anterior (score, perfil de demanda, concorrência,
 * eventos) com os números de mercado da base do Radar — a mesma do painel do
 * bairro, para o mesmo bairro nunca aparecer com dois valores na tela.
 * Só entram bairros da base do Radar: fora dela não há diária nem ocupação com fonte.
 */
import { receitaMensalReferencia } from "@/data/bairrosCurados";
import type { Neighborhood, NeighborhoodMetrics } from "@/data/mapaBairrosData";
import {
  avisoAmostraBairro, fonteCurtaBairro, naturezaBairro, normalizarTexto,
  type BairroBase, type NaturezaBairro,
} from "@/lib/radarUi";

export interface LeituraBairro extends Omit<Neighborhood, "metrics"> {
  metrics: Omit<NeighborhoodMetrics, "activeListings"> & { activeListings: number | null };
  natureza: NaturezaBairro;
  /** Aviso de amostra pequena (Mooca). */
  aviso: string | null;
}

/** Leituras dos bairros que estão na base do Radar, com os números da base; os demais ficam de fora. */
export function alinharLeiturasComBase(lista: Neighborhood[], base: BairroBase[]): LeituraBairro[] {
  const porNome = new Map(base.map((b) => [normalizarTexto(b.name), b]));
  return lista.flatMap((n) => {
    const b = porNome.get(normalizarTexto(n.name));
    if (!b) return [];
    return [{
      ...n,
      name: b.name,
      avgNightly: b.dailyAvg,
      avgOccupancy: b.avgOccupancy,
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
    }];
  });
}

/** Nomes que estão na base do Radar, com a grafia da base (bairros próximos de eventos, destaques). */
export function nomesNaBase(nomes: string[], base: Pick<BairroBase, "name">[]): string[] {
  const porNome = new Map(base.map((b) => [normalizarTexto(b.name), b.name]));
  return nomes.flatMap((nome) => {
    const daBase = porNome.get(normalizarTexto(nome));
    return daBase ? [daBase] : [];
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
