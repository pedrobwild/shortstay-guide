import AirbnbICalPanel from "@/components/ota/AirbnbICalPanel";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Página de gerenciamento de um projeto.
 * Inclui o painel de integração Airbnb iCal.
 */
export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Projeto não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Gestão do Projeto</h1>
        </div>

        {/* Painel de integração Airbnb */}
        <AirbnbICalPanel projectId={projectId} />
      </div>
    </div>
  );
}
