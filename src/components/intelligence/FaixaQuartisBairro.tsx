import { useMemo } from "react";
import ReguaQuartis from "@/components/estudo/graficos/ReguaQuartis";
import { useBairroData, BairroProvider } from "@/hooks/useBairroData";
import { naturezaBairro } from "@/lib/radarUi";
import { formatBRL } from "@/lib/numberFormat";

const norm = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function Conteudo({ bairro }: { bairro: string }) {
  const { bairros } = useBairroData();
  const item = useMemo(() => bairros.find((b) => norm(b.name) === norm(bairro)), [bairros, bairro]);
  // Sem quartis publicados (ex.: ajuste manual) ou bairro fora da base: não mostra nada.
  if (!item?.dailyQuartiles) return null;
  const [p25, p50, p75] = item.dailyQuartiles;
  return (
    <div className="min-w-0">
      <p className="e-rotulo">Quartis da diária (R$)</p>
      <div className="mt-2 max-w-[560px]">
        <ReguaQuartis quartis={item.dailyQuartiles} media={item.dailyAvg} minha={null} aproximacao={naturezaBairro(item) === "aproximacao"} nomeBairro={item.name} />
      </div>
      <p className="e-legenda mt-1">
        25% mais baratos até {formatBRL(p25)} · mediana {formatBRL(p50)} · 25% mais caros a partir de {formatBRL(p75)}. Faixa: metade dos anúncios; traço tracejado: diária média ({formatBRL(item.dailyAvg)}). Quartis de diária não são faixas de metragem.
      </p>
    </div>
  );
}

/**
 * Quartis de diária do bairro (base aprovada, com ajustes do admin sobrepostos
 * na média — a mesma fonte do guia, para o bairro ter um número só).
 */
export default function FaixaQuartisBairro({ bairro }: { bairro: string }) {
  return <BairroProvider><Conteudo bairro={bairro} /></BairroProvider>;
}
