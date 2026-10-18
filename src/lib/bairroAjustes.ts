import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BairroCurado } from "@/data/bairrosCurados";

/**
 * Ajustes manuais do admin sobre diária e ocupação. Ficam numa lista separada:
 * a base curada (bairrosCurados.ts) e o case Pinheiros (rentabilidadeExample)
 * nunca são alterados — o ajuste só se sobrepõe na exibição.
 */
export type BairroAjuste = { bairro: string; diaria: number; ocupacao: number; fonte: string; updated_at?: string };

const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function mapaAjustes(lista: BairroAjuste[] | null | undefined): Map<string, BairroAjuste> {
  return new Map((lista ?? []).map((a) => [norm(a.bairro), a]));
}

export function buscarAjuste(mapa: Map<string, BairroAjuste>, bairro: string | null | undefined) {
  return bairro ? mapa.get(norm(bairro)) : undefined;
}

/** Devolve uma cópia do bairro com diária/ocupação do ajuste; o original fica intacto. */
export function aplicarAjuste(b: BairroCurado, a: BairroAjuste | undefined): BairroCurado {
  if (!a) return b;
  const fator = b.dailyAvg > 0 ? a.diaria / b.dailyAvg : 1;
  return {
    ...b,
    dailyAvg: a.diaria,
    dailyMin: Math.round(b.dailyMin * fator),
    dailyMax: Math.round(b.dailyMax * fator),
    avgOccupancy: a.ocupacao,
    dailyQuartiles: null,
    ocupacaoFonte: "bewild",
    period: null,
    sourceUrl: /^https?:\/\//.test(a.fonte) ? a.fonte : null,
  };
}

export async function carregarAjustes(): Promise<BairroAjuste[]> {
  const { data, error } = await supabase.from("bairro_ajustes").select("bairro, diaria, ocupacao, fonte, updated_at");
  if (error) return [];
  return (data ?? []).map((r) => ({ ...r, diaria: Number(r.diaria), ocupacao: Number(r.ocupacao) }));
}

export function useBairroAjustes() {
  return useQuery({ queryKey: ["bairro_ajustes"], queryFn: carregarAjustes, staleTime: 5 * 60 * 1000 });
}

/** Deduções padrão do DRE do guia: fonte única em src/data/dreGuia.ts (reexportadas para quem já importa daqui). */
export { DEDUCOES_PADRAO_PCT, resultadoLiquidoMensal } from "@/data/dreGuia";

/** Nível de decoração conforme o boost escolhido no simulador. */
export function rotuloDecoracao(boostPct: number): string {
  if (boostPct >= 30) return "Alto padrão (+30%)";
  if (boostPct >= 20) return "Premium (+20%)";
  if (boostPct >= 10) return "Básica melhorada (+10%)";
  return "Sem melhoria";
}
