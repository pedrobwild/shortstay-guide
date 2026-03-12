import { useState } from "react";
import AirbnbConnectionForm from "./AirbnbConnectionForm";
import AirbnbConnectionsList from "./AirbnbConnectionsList";
import AirbnbCalendarGrid from "./AirbnbCalendarGrid";

/**
 * Painel completo de integração Airbnb iCal para um projeto.
 * Junta o formulário de cadastro + lista de conexões + calendário visual.
 */
interface AirbnbICalPanelProps {
  projectId: string;
}

export default function AirbnbICalPanel({ projectId }: AirbnbICalPanelProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleChange = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Integração Airbnb (iCal)</h2>
        <p className="text-sm text-muted-foreground">
          Conecte o calendário iCal do seu anúncio no Airbnb para importar reservas e bloqueios automaticamente.
        </p>
      </div>

      {/* Formulário para adicionar nova conexão */}
      <AirbnbConnectionForm projectId={projectId} onConnectionCreated={handleChange} />

      {/* Lista de conexões existentes */}
      <AirbnbConnectionsList projectId={projectId} refreshKey={refreshKey} />

      {/* Calendário visual mensal */}
      <AirbnbCalendarGrid projectId={projectId} refreshKey={refreshKey} />
    </div>
  );
}
