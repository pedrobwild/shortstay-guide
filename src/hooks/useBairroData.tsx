import { createContext, useContext } from "react";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import type { BairroItem } from "@/data/guide-data";

/**
 * Diária e ocupação por bairro vêm SÓ de `bairrosCurados` — o mesmo número no
 * HTML pré-renderizado e depois de carregar. O banco não sobrescreve mais.
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
  return <BairroContext.Provider value={VALUE}>{children}</BairroContext.Provider>;
}
