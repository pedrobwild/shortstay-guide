import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import ProjectAnalytics from "@/components/ota/ProjectAnalytics";
import BwildVsDiySection from "@/components/ota/BwildVsDiySection";
import { BairroProvider } from "@/hooks/useBairroData";

/**
 * Simulação personalizada do studio do lead — projeção de receita, ocupação e
 * ROI a partir das premissas de mercado do bairro + faixa de m², sem depender
 * de iCal real. É o gatilho de conversão: o cliente vê o potencial do *seu*
 * imóvel antes de existir qualquer reserva.
 */
export default function StudioProjection() {
  return (
    <BairroProvider>
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Projeção do seu studio
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Estime receita, ocupação e retorno do seu imóvel com base na média de mercado do
              bairro. Informe o bairro, a faixa de área e o valor do imóvel para ver a projeção
              completa — sem precisar conectar nenhum calendário.
            </p>
          </div>

          {/* Dashboard em modo projeção */}
          <ProjectAnalytics mode="projection" />

          {/* Comparativo "fazer sozinho vs. com a BWild" — ancora o ROI da reforma */}
          <div className="border-t border-border pt-8">
            <BwildVsDiySection />
          </div>
        </div>
      </div>
    </BairroProvider>
  );
}
