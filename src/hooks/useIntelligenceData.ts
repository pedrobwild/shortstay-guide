import { getBairroCurado, FONTE_BAIRROS_CURADOS, ROTULO_ESTIMATIVA_MERCADO } from "@/data/bairrosCurados";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BairroAirbnb, RawListing } from "@/types/intelligence";

export function useBairrosData() {
  return useQuery({
    queryKey: ["bairro_airbnb_sp"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bairro_airbnb_sp")
        .select("*")
        .order("score_rentabilidade", { ascending: false });
      if (error) throw error;
      return (data as unknown as BairroAirbnb[]).map(aplicarCurados);
    },
  });
}

export function useBairroDetail(bairro: string) {
  return useQuery({
    queryKey: ["bairro_airbnb_sp", bairro],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bairro_airbnb_sp")
        .select("*")
        .eq("bairro", bairro)
        .single();
      if (error) throw error;
      return aplicarCurados(data as unknown as BairroAirbnb);
    },
    enabled: !!bairro,
  });
}

export function useRawListings(bairro?: string) {
  return useQuery({
    queryKey: ["raw_listings", bairro],
    queryFn: async () => {
      let query = supabase.from("raw_listings").select("*").order("data_coleta", { ascending: false }).limit(500);
      if (bairro) query = query.eq("bairro", bairro);
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as RawListing[];
    },
  });
}

// Formatters
export const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

export const fmtScore = (v: number) => v?.toFixed(1) ?? "—";
/**
 * Quando o bairro existe em bairrosCurados, diária média e ocupação vêm de lá
 * (e receita/yield exibidos são recalculados com elas). As demais métricas
 * continuam do banco, rotuladas como estimativa de mercado.
 */
export function aplicarCurados(row: BairroAirbnb): BairroAirbnb {
  const c = getBairroCurado(row.bairro);
  if (!c) return { ...row, diaria_ocupacao_curadas: false };
  const adr = c.dailyAvg;
  const occ = c.avgOccupancy / 100;
  const receitaAnual = Math.round(adr * 30 * occ) * 12;
  const preco = Number(row.preco_m2_residencial_medio) * Number(row.area_media_estudio);
  const yieldAirbnb = preco > 0 ? receitaAnual / preco : row.yield_bruto_airbnb;
  const delta =
    preco > 0 && row.yield_bruto_long_term != null ? yieldAirbnb - Number(row.yield_bruto_long_term) : row.delta_yield;
  return {
    ...row,
    adr_medio_studio: adr,
    ocupacao_media_studio: occ,
    receita_anual_media_studio: receitaAnual,
    yield_bruto_airbnb: yieldAirbnb,
    delta_yield: delta,
    diaria_ocupacao_curadas: true,
  };
}

const fmtData = (iso: string) => {
  const [y, m, d] = (iso ?? "").slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

/** "Estimativa de mercado — base 2025 · 01/01/2025 a 31/12/2025 · confiança alta" */
export function rotuloEstimativa(b: Pick<BairroAirbnb, "periodo_inicio" | "periodo_fim" | "nivel_confianca_dados">): string {
  const partes = [`${ROTULO_ESTIMATIVA_MERCADO}`];
  if (b.periodo_inicio && b.periodo_fim) partes.push(`${fmtData(b.periodo_inicio)} a ${fmtData(b.periodo_fim)}`);
  if (b.nivel_confianca_dados) partes.push(`confiança ${b.nivel_confianca_dados}`);
  return partes.join(" · ");
}

export function rotuloFonteDiariaOcupacao(b: BairroAirbnb): string {
  return b.diaria_ocupacao_curadas
    ? `Diária e ocupação: ${FONTE_BAIRROS_CURADOS}. Demais métricas: ${rotuloEstimativa(b)}.`
    : `Todas as métricas: ${rotuloEstimativa(b)}.`;
}
