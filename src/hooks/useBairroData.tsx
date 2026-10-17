import { createContext, useCallback, useContext, useMemo } from "react";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { bairrosReserva, useRadarBase } from "@/lib/radarBase";
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
  /** A base do banco não respondeu: os números exibidos vêm da reserva offline (coleta de 13/10/2026). */
  offline: boolean;
  /** Lê a base de novo (botão "Tentar novamente"). */
  recarregar: () => void;
};

const VALUE: BairroContextValue = { bairros: BAIRROS_CURADOS, lastUpdated: null, isLoading: false, offline: false, recarregar: () => {} };

const BairroContext = createContext<BairroContextValue>(VALUE);

export function useBairroData() {
  return useContext(BairroContext);
}

export function BairroProvider({ children }: { children: React.ReactNode }) {
  const { data } = useBairroAjustes();
  const radar = useRadarBase();
  const { refetch } = radar;
  const recarregar = useCallback(() => { void refetch(); }, [refetch]);
  const value = useMemo<BairroContextValue>(() => {
    // Enquanto a base carrega (e na pré-renderização), a reserva offline já traz fonte e data de coleta.
    const base = radar.data?.bairros ?? bairrosReserva();
    const mapa = mapaAjustes(data);
    return {
      bairros: base.map((b) => aplicarAjuste(b, buscarAjuste(mapa, b.name))),
      lastUpdated: null,
      isLoading: radar.isLoading,
      offline: Boolean(radar.data?.offline),
      recarregar,
    };
  }, [data, radar.data, radar.isLoading, recarregar]);
  return <BairroContext.Provider value={value}>{children}</BairroContext.Provider>;
}
