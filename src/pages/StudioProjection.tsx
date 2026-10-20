import AppNavbar from "@/components/AppNavbar";
import RodapeRadar from "@/components/RodapeRadar";
import ProjecaoStudio from "@/components/projecao/ProjecaoStudio";
import { BairroProvider } from "@/hooks/useBairroData";
import { GuideDecisionProvider } from "@/hooks/useGuideDecision";

/**
 * /projecao (Simular) no redesign "Estudo aberto": premissas editáveis, resultado
 * líquido, receita repartida (Fig. 1), DRE linha a linha (Tab. 1), investimento e o
 * case real. A navbar rola com a página, como nas outras telas de dados; o rodapé
 * ganha folga embaixo no celular por causa da barra fixa do resultado.
 */
export default function StudioProjection() {
  return (
    <BairroProvider>
      <GuideDecisionProvider>
        <div className="min-h-screen bg-background font-body text-foreground">
          <AppNavbar fixo={false} />
          <ProjecaoStudio />
          <RodapeRadar className="pb-36 lg:pb-12" />
        </div>
      </GuideDecisionProvider>
    </BairroProvider>
  );
}
