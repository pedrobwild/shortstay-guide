import { createContext, useContext, useMemo } from "react";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { useRadarBase } from "@/lib/radarBase";
import type { BairroItem } from "@/data/guide-data";
import { aplicarAjuste, buscarAjuste, mapaAjustes, useBairroAjustes } from "@/lib/bairroAjustes";

/**
 * Diária e ocupação por bairro vêm da base única do banco (`radar_bairro_atual`,
 * via useRadarBase); `bairrosCurados` só é usado como reserva offline, com os ajustes do admin
 * sobrepostos quando existirem (a base curada não é alterada).
 */
type BairroContextValue = {
  bairros: BairroItem[];
  lastUpdated: string | null;
  isLoading: boolean;
};

const VALUE: BairroContextValue = { bairros: BAIRROS_CURADOS, lastUpdated: null, isLoading: false };

const BairroContext = createContext<BairroContextValue>(VALUE);

export function useBairroData() {
  return useContext(BairroContext);
}

export function BairroProvider({ children }: { children: React.ReactNode }) {
  const { data } = useBairroAjustes();
  const radar = useRadarBase();
  const value = useMemo<BairroContextValue>(() => {
    const base = radar.data?.bairros ?? BAIRROS_CURADOS;
    const mapa = mapaAjustes(data);
    return { bairros: base.map((b) => aplicarAjuste(b, buscarAjuste(mapa, b.name))), lastUpdated: null, isLoading: radar.isLoading };
  }, [data, radar.data, radar.isLoading]);
  return <BairroContext.Provider value={value}>{children}</BairroContext.Provider>;
}
