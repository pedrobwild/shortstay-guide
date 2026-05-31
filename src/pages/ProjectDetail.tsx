import { useState } from "react";
import AirbnbICalPanel from "@/components/ota/AirbnbICalPanel";
import ProjectAnalytics from "@/components/ota/ProjectAnalytics";
import ScenarioComparator from "@/components/ota/ScenarioComparator";
import AppNavbar from "@/components/AppNavbar";
import { BairroProvider } from "@/hooks/useBairroData";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Página de gerenciamento de um projeto.
 *
 * Foco: ajudar o cliente a entender o potencial de receita do imóvel
 * (integração de calendários, dashboard de análises e comparador de
 * cenários). O cronograma da reforma vive em outro contexto e não entra
 * aqui para não poluir a leitura da projeção.
 */
export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const [analyticsKey, setAnalyticsKey] = useState(0);

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Projeto não encontrado.</p>
      </div>
    );
  }

  return (
    <BairroProvider>
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
          {/* Header */}
          <div>
            <Link to="/projetos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Gestão do Projeto</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Potencial de receita, calendários e cenários de investimento do imóvel.
            </p>
          </div>

          {/* Painel de integração Airbnb */}
          <AirbnbICalPanel
            projectId={projectId}
            onDataChanged={() => setAnalyticsKey((k) => k + 1)}
          />

          {/* Dashboard de análises */}
          <ProjectAnalytics projectId={projectId} refreshKey={analyticsKey} />

          {/* Comparador multi-cenário de investimento */}
          <div className="border-t border-border pt-8">
            <ScenarioComparator projectId={projectId} />
          </div>
        </div>
      </div>
    </BairroProvider>
  );
}

