import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import FaixaQuartis from "@/components/guide/FaixaQuartis";
import FonteBairro from "@/components/guide/FonteBairro";
import { useBairroData, BairroProvider } from "@/hooks/useBairroData";

const norm = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function Conteudo({ bairro }: { bairro: string }) {
  const { bairros } = useBairroData();
  const item = useMemo(() => bairros.find((b) => norm(b.name) === norm(bairro)), [bairros, bairro]);
  // Sem quartis publicados (ex.: estimativas Bewild) ou bairro fora da base: não mostra nada.
  if (!item?.dailyQuartiles) return null;
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Faixa de diárias em {item.name}</h2>
          <p className="text-xs text-muted-foreground">Metade dos anúncios cobra entre os 25% mais baratos e os 25% mais caros.</p>
        </div>
        <FaixaQuartis quartis={item.dailyQuartiles} media={item.dailyAvg} />
        <FonteBairro nome={item.name} />
      </CardContent>
    </Card>
  );
}

/**
 * Quartis de diária do bairro (base aprovada, com ajustes do admin sobrepostos
 * na média — a mesma fonte do guia, para o bairro ter um número só).
 */
export default function FaixaQuartisBairro({ bairro }: { bairro: string }) {
  return <BairroProvider><Conteudo bairro={bairro} /></BairroProvider>;
}
