import { formatDecimal } from "@/lib/numberFormat";
import { getBairroCurado, fonteBairro, ROTULO_ESTIMATIVA_MERCADO } from "@/data/bairrosCurados";
import { aplicarAjuste, buscarAjuste, carregarAjustes, mapaAjustes, type BairroAjuste } from "@/lib/bairroAjustes";
import { useQuery } from "@tanstack/react-query";
import { carregarRadar } from "@/lib/radarBase";
import type { BairroCurado } from "@/data/bairrosCurados";
import { supabase } from "@/integrations/supabase/client";
import type { BairroAirbnb, RawListing } from "@/types/intelligence";

export function useBairrosData() {
  return useQuery({
    queryKey: ["bairro_airbnb_sp"],
    queryFn: async () => {
      const [{ data, error }, ajustes, radar] = await Promise.all([
        supabase.from("bairro_airbnb_sp").select("*").order("score_rentabilidade", { ascending: false }),
        carregarAjustes(),
        carregarRadar(),
      ]);
      if (error) throw error;
      const mapa = mapaAjustes(ajustes);
      const base = mapaBase(radar.bairros);
      return (data as unknown as BairroAirbnb[]).map((r) => aplicarCurados(r, mapa, base));
    },
  });
}

export function useBairroDetail(bairro: string) {
  return useQuery({
    queryKey: ["bairro_airbnb_sp", bairro],
    queryFn: async () => {
      const [{ data, error }, ajustes, radar] = await Promise.all([
        supabase.from("bairro_airbnb_sp").select("*").eq("bairro", bairro).single(),
        carregarAjustes(),
        carregarRadar(),
      ]);
      if (error) throw error;
      return aplicarCurados(data as unknown as BairroAirbnb, mapaAjustes(ajustes), mapaBase(radar.bairros));
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

export const fmtPct = (v: number) => `${formatDecimal((v * 100), 1)}%`;

export const fmtScore = (v: number) => (v == null ? undefined : formatDecimal(v, 1)) ?? "—";
/**
 * Quando o bairro existe em bairrosCurados, diária média e ocupação vêm de lá
 * (e receita/yield exibidos são recalculados com elas). As demais métricas
 * continuam do banco, rotuladas como estimativa de mercado.
 */
const normNome = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
export function mapaBase(lista: BairroCurado[]): Map<string, BairroCurado> {
  return new Map(lista.map((b) => [normNome(b.name), b]));
}
export function aplicarCurados(row: BairroAirbnb, ajustes?: Map<string, BairroAjuste>, baseRadar?: Map<string, BairroCurado>): BairroAirbnb {
  const base = baseRadar?.get(normNome(row.bairro)) ?? getBairroCurado(row.bairro);
  if (!base) return { ...row, diaria_ocupacao_curadas: false };
  const c = ajustes ? aplicarAjuste(base, buscarAjuste(ajustes, row.bairro)) : base;
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
  const c = getBairroCurado(b.bairro);
  return c
    ? `Diária e ocupação: ${fonteBairro(c)}. Demais métricas: ${rotuloEstimativa(b)}.`
    : `Todas as métricas: ${rotuloEstimativa(b)}.`;
}
