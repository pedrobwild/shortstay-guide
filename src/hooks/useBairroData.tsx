import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { BAIRRO_DATA, type BairroItem } from "@/data/guide-data";

function mapSupabaseToBairro(row: any): BairroItem {
  const adr = row.adr_medio_studio ?? 300;
  const occ = row.ocupacao_media_studio ?? 75;
  const area = row.area_media_estudio ?? 30;
  const perSqm = +(adr / area).toFixed(1);
  const dailyMin = Math.round(adr * 0.8);
  const dailyMax = Math.round(adr * 1.4);
  const small = Math.round(adr * 0.78);
  const medium = Math.round(adr);
  const large = Math.round(adr * 1.24);
  return {
    name: row.bairro, dailyMin, dailyMax,
    avgOccupancy: Math.round(occ), perSqm,
    avgBySize: { "20–25 m²": small, "26–35 m²": medium, "36–50 m²": large },
  };
}

type BairroContextValue = {
  bairros: BairroItem[];
  lastUpdated: string | null;
  isLoading: boolean;
};

const BairroContext = createContext<BairroContextValue>({
  bairros: BAIRRO_DATA as unknown as BairroItem[],
  lastUpdated: null,
  isLoading: false,
});

export function useBairroData() {
  return useContext(BairroContext);
}

export function BairroProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["bairro_airbnb_sp"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bairro_airbnb_sp")
        .select("bairro, adr_medio_studio, ocupacao_media_studio, area_media_estudio, data_atualizacao")
        .order("bairro");
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const value = useMemo<BairroContextValue>(() => {
    if (isLoading) return { bairros: BAIRRO_DATA as unknown as BairroItem[], lastUpdated: null, isLoading: true };
    if (isError || !data?.length) {
      if (isError) {
        toast({ title: "Usando dados de cache", description: "Não foi possível carregar dados atualizados.", variant: "default" });
      }
      return { bairros: BAIRRO_DATA as unknown as BairroItem[], lastUpdated: null, isLoading: false };
    }
    const mapped = data.map(mapSupabaseToBairro);
    const maxDate = data.reduce((max, r) => {
      const d = r.data_atualizacao;
      return d && d > max ? d : max;
    }, "");
    return { bairros: mapped, lastUpdated: maxDate || null, isLoading: false };
  }, [data, isLoading, isError]);

  return <BairroContext.Provider value={value}>{children}</BairroContext.Provider>;
}
