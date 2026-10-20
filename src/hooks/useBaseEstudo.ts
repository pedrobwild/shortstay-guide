import { SAO_PAULO_REFERENCIA } from "@/data/bairrosCurados";
import { useBairroData } from "@/hooks/useBairroData";
import { useRadarBase } from "@/lib/radarBase";

/**
 * Base das telas do Estudo aberto: os 28 bairros com os ajustes do admin sobrepostos
 * (BairroProvider, que precisa envolver a tela) e a referência de São Paulo da mesma
 * coleta (view radar_bairro_atual; reserva offline quando o banco não responde).
 */
export function useBaseEstudo() {
  const { bairros, isLoading, offline, recarregar } = useBairroData();
  const radar = useRadarBase();
  const cidade = radar.data?.cidade ?? SAO_PAULO_REFERENCIA;
  return { bairros, cidade, isLoading, offline, recarregar };
}
