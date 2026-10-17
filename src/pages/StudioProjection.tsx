import AppNavbar from "@/components/AppNavbar";
import RodapeRadar from "@/components/RodapeRadar";
import ProjecaoStudio from "@/components/projecao/ProjecaoStudio";
import { BairroProvider } from "@/hooks/useBairroData";

/**
 * Simulação personalizada do studio do lead — projeção de receita, custos e
 * retorno a partir das premissas de mercado do bairro (com ?bairro= vindo do
 * mapa e da comparação), sem depender de iCal real. É o gatilho de conversão:
 * o cliente vê o potencial do *seu* imóvel e segue para o orçamento da reforma.
 */
export default function StudioProjection() {
  return (
    <BairroProvider>
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <ProjecaoStudio />
        <RodapeRadar className="pb-36 lg:pb-12" />
      </div>
    </BairroProvider>
  );
}
