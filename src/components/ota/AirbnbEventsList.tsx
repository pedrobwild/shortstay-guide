import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Calendar, CalendarDays } from "lucide-react";

/**
 * Evento importado do calendário iCal de uma conexão OTA.
 */
interface CalendarEvent {
  id: string;
  external_event_uid: string | null;
  start_date: string;
  end_date: string;
  summary: string | null;
  synced_at: string;
}

interface AirbnbEventsListProps {
  connectionId: string;
}

/** Formata data ISO (YYYY-MM-DD) para formato legível pt-BR */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

/** Calcula noites entre duas datas */
function calcNights(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Lista os eventos importados do calendário iCal de uma conexão.
 * Mostra datas, resumo e total de eventos.
 */
export default function AirbnbEventsList({ connectionId }: AirbnbEventsListProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("ota_calendar_events")
        .select("id, external_event_uid, start_date, end_date, summary, synced_at")
        .eq("connection_id", connectionId)
        .order("start_date", { ascending: true });

      if (fetchError) throw fetchError;
      setEvents((data as CalendarEvent[]) || []);
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Erro ao carregar eventos", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // --- Estado: carregando ---
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Carregando eventos...
      </div>
    );
  }

  // --- Estado: erro ---
  if (error) {
    return (
      <div className="text-center py-6 space-y-2">
        <p className="text-sm text-destructive">Erro ao carregar eventos.</p>
        <Button variant="outline" size="sm" onClick={fetchEvents}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  // --- Estado: sem eventos ---
  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm space-y-1">
        <CalendarDays className="h-8 w-8 mx-auto opacity-40" />
        <p>Nenhum evento importado ainda.</p>
        <p className="text-xs">Clique em "Sincronizar" para importar o calendário.</p>
      </div>
    );
  }

  // --- Estado: com eventos ---
  return (
    <div className="space-y-3">
      {/* Header com contador e botão atualizar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <Badge variant="secondary" className="mr-2 text-xs">{events.length}</Badge>
          evento{events.length !== 1 ? "s" : ""} importado{events.length !== 1 ? "s" : ""}
        </p>
        <Button variant="ghost" size="sm" onClick={fetchEvents}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Atualizar
        </Button>
      </div>

      {/* Lista de eventos */}
      <div className="space-y-2">
        {events.map((event) => {
          const nights = calcNights(event.start_date, event.end_date);
          return (
            <div
              key={event.id}
              className="rounded-md border border-border bg-card px-4 py-3 flex items-start gap-3"
            >
              {/* Ícone */}
              <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />

              {/* Conteúdo */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {formatDate(event.start_date)} → {formatDate(event.end_date)}
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    ({nights} noite{nights !== 1 ? "s" : ""})
                  </span>
                </p>

                {event.summary && (
                  <p className="text-xs text-muted-foreground truncate">{event.summary}</p>
                )}
              </div>

              {/* Sync info */}
              <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                sync {new Date(event.synced_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
