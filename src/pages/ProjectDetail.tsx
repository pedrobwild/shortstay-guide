import { useState } from "react";
import AirbnbICalPanel from "@/components/ota/AirbnbICalPanel";
import ExecutiveSummary from "@/components/ota/ExecutiveSummary";
import ProjectAnalytics from "@/components/ota/ProjectAnalytics";
import AppNavbar from "@/components/AppNavbar";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Página de gerenciamento de um projeto.
 * Inclui dashboard executivo, painel de integração Airbnb iCal e análises detalhadas.
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

  const handleDataChanged = () => setAnalyticsKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Header */}
        <div>
          <Link to="/projetos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Gestão do Projeto</h1>
        </div>

        {/* Dashboard executivo */}
        <ExecutiveSummary
          projectId={projectId}
          refreshKey={analyticsKey}
          onDataChanged={handleDataChanged}
        />

        {/* Painel de integração Airbnb */}
        <AirbnbICalPanel
          projectId={projectId}
          onDataChanged={handleDataChanged}
        />

        {/* Dashboard de análises detalhadas */}
        <ProjectAnalytics projectId={projectId} refreshKey={analyticsKey} />
      </div>
    </div>
  );
}
