import { createContext, useContext, useMemo } from "react";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import type { BairroItem } from "@/data/guide-data";
import { aplicarAjuste, buscarAjuste, mapaAjustes, useBairroAjustes } from "@/lib/bairroAjustes";

/**
 * Diária e ocupação por bairro vêm de `bairrosCurados`, com os ajustes do admin
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
  const value = useMemo<BairroContextValue>(() => {
    if (!data?.length) return VALUE;
    const mapa = mapaAjustes(data);
    return { ...VALUE, bairros: BAIRROS_CURADOS.map((b) => aplicarAjuste(b, buscarAjuste(mapa, b.name))) };
  }, [data]);
  return <BairroContext.Provider value={value}>{children}</BairroContext.Provider>;
}
