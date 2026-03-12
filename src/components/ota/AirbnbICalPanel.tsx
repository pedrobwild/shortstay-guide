import { useState } from "react";
import AirbnbConnectionForm from "./AirbnbConnectionForm";
import AirbnbConnectionsList from "./AirbnbConnectionsList";

/**
 * Painel completo de integração Airbnb iCal para um projeto.
 * Junta o formulário de cadastro + lista de conexões.
 *
 * Uso:
 *   <AirbnbICalPanel projectId="uuid-do-projeto" />
 */
interface AirbnbICalPanelProps {
  projectId: string;
}

export default function AirbnbICalPanel({ projectId }: AirbnbICalPanelProps) {
  // refreshKey é incrementado para forçar reload da lista
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Integração Airbnb (iCal)</h2>
        <p className="text-sm text-muted-foreground">
          Conecte o calendário iCal do seu anúncio no Airbnb para importar reservas e bloqueios automaticamente.
        </p>
      </div>

      {/* Formulário para adicionar nova conexão */}
      <AirbnbConnectionForm
        projectId={projectId}
        onConnectionCreated={() => setRefreshKey((k) => k + 1)}
      />

      {/* Lista de conexões existentes */}
      <AirbnbConnectionsList projectId={projectId} refreshKey={refreshKey} />
    </div>
  );
}
