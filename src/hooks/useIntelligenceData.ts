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
      return data as unknown as BairroAirbnb[];
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
      return data as unknown as BairroAirbnb;
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
