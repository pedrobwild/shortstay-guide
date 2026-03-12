import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

// ============================================================
// Calendário visual mensal para eventos importados via iCal.
// Mostra reservas e bloqueios como barras coloridas no grid.
// ============================================================

interface CalendarEvent {
  id: string;
  start_date: string;
  end_date: string;
  summary: string | null;
  connection_id: string;
}

interface AirbnbCalendarGridProps {
  /** ID do projeto — busca eventos de TODAS as conexões desse projeto */
  projectId: string;
  /** Incrementar para forçar reload */
  refreshKey?: number;
}

// ---------- Helpers de data ----------

/** Retorna o primeiro dia do mês (Date local) */
function firstOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/** Retorna quantos dias tem o mês */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Converte "YYYY-MM-DD" para Date local (sem timezone) */
function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Formata nome do mês em pt-BR */
function monthName(month: number): string {
  const names = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return names[month];
}

/** Nomes dos dias da semana abreviados */
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Checa se uma data (dia) está dentro do range [start, end) */
function isDayInRange(day: Date, startStr: string, endStr: string): boolean {
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  return day >= start && day < end;
}

/** Cores para diferenciar eventos (ciclam se houver muitos) */
const EVENT_COLORS = [
  "bg-primary/20 text-primary border-primary/30",
  "bg-accent/20 text-accent-foreground border-accent/30",
  "bg-destructive/15 text-destructive border-destructive/30",
  "bg-secondary text-secondary-foreground border-border",
];

export default function AirbnbCalendarGrid({
  projectId,
  refreshKey = 0,
}: AirbnbCalendarGridProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------- Navegação de meses ----------
  const goToPrev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const goToNext = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };
  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  // ---------- Fetch de eventos ----------
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar IDs das conexões deste projeto
      const { data: conns, error: connErr } = await supabase
        .from("ota_connections")
        .select("id")
        .eq("project_id", projectId);

      if (connErr) throw connErr;
      if (!conns || conns.length === 0) {
        setEvents([]);
        return;
      }

      const connIds = conns.map((c) => c.id);

      const { data, error } = await supabase
        .from("ota_calendar_events")
        .select("id, start_date, end_date, summary, connection_id")
        .in("connection_id", connIds)
        .order("start_date", { ascending: true });

      if (error) throw error;
      setEvents((data as CalendarEvent[]) || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar calendário", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshKey]);

  // ---------- Grid do mês ----------
  const totalDays = daysInMonth(year, month);
  const startWeekday = firstOfMonth(year, month).getDay(); // 0=Dom

  // Mapa: connectionId → índice de cor
  const colorMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    events.forEach((e) => {
      if (!map.has(e.connection_id)) {
        map.set(e.connection_id, idx % EVENT_COLORS.length);
        idx++;
      }
    });
    return map;
  }, [events]);

  // Para cada dia do mês, quais eventos estão ativos
  const daysGrid = useMemo(() => {
    const grid: Array<{ day: number; date: Date; events: CalendarEvent[] }> = [];
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const dayEvents = events.filter((e) => isDayInRange(date, e.start_date, e.end_date));
      grid.push({ day: d, date, events: dayEvents });
    }
    return grid;
  }, [year, month, totalDays, events]);

  // ---------- Hoje ----------
  const isToday = (d: number) =>
    year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Carregando calendário...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header: navegação do mês */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            {monthName(month)} {year}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={goToPrev} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs px-2">
            Hoje
          </Button>
          <Button variant="ghost" size="sm" onClick={goToNext} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid do calendário */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Dias da semana */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/50">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="text-center text-xs font-medium text-muted-foreground py-2">
              {wd}
            </div>
          ))}
        </div>

        {/* Células dos dias */}
        <div className="grid grid-cols-7">
          {/* Espaços vazios antes do primeiro dia */}
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-border bg-muted/20 min-h-[72px]" />
          ))}

          {/* Dias do mês */}
          {daysGrid.map(({ day, events: dayEvents }) => {
            const todayHighlight = isToday(day);
            return (
              <div
                key={day}
                className={`border-b border-r border-border min-h-[72px] p-1 transition-colors ${
                  todayHighlight ? "bg-primary/5" : "hover:bg-muted/30"
                }`}
              >
                {/* Número do dia */}
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                      todayHighlight
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {day}
                  </span>
                </div>

                {/* Eventos desse dia (máximo 2 visíveis + badge "+N") */}
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((ev) => {
                    const colorIdx = colorMap.get(ev.connection_id) ?? 0;
                    const colorClass = EVENT_COLORS[colorIdx];
                    return (
                      <div
                        key={ev.id}
                        className={`text-[10px] leading-tight px-1 py-0.5 rounded border truncate ${colorClass}`}
                        title={ev.summary || "Evento"}
                      >
                        {ev.summary
                          ? ev.summary.length > 16
                            ? ev.summary.substring(0, 14) + "…"
                            : ev.summary
                          : "Evento"}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <span className="text-[10px] text-muted-foreground pl-1">
                      +{dayEvents.length - 2}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda / resumo */}
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">
          Nenhum evento importado. Sincronize uma conexão para ver reservas e bloqueios aqui.
        </p>
      ) : (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            <Badge variant="secondary" className="text-xs mr-1">{events.length}</Badge>
            evento{events.length !== 1 ? "s" : ""} no total
          </span>
          <span>
            Eventos com datas neste mês são destacados no grid.
          </span>
        </div>
      )}
    </div>
  );
}
