import { useState } from "react";
import AirbnbConnectionForm from "./AirbnbConnectionForm";
import AirbnbConnectionsList from "./AirbnbConnectionsList";
import AirbnbCalendarGrid from "./AirbnbCalendarGrid";

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

      <AirbnbConnectionForm projectId={projectId} onConnectionCreated={handleChange} />

      <AirbnbConnectionsList projectId={projectId} refreshKey={refreshKey} onDataChanged={handleChange} />

      <AirbnbCalendarGrid projectId={projectId} refreshKey={refreshKey} />
    </div>
  );
}
