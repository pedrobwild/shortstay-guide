import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, ChevronLeft, ChevronRight, CalendarDays,
  LayoutGrid, List, Calendar, Moon,
} from "lucide-react";

// ============================================================
// Calendário visual + lista para eventos importados via iCal.
// Suporta toggle entre grid mensal e lista, e popover de detalhes.
// ============================================================

interface CalendarEvent {
  id: string;
  start_date: string;
  end_date: string;
  summary: string | null;
  connection_id: string;
}

interface AirbnbCalendarGridProps {
  projectId: string;
  refreshKey?: number;
}

// ---------- Helpers ----------

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateBR(str: string): string {
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}

function calcNights(start: string, end: string): number {
  const ms = parseLocalDate(end).getTime() - parseLocalDate(start).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function monthName(month: number): string {
  return [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ][month];
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function isDayInRange(day: Date, startStr: string, endStr: string): boolean {
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  return day >= start && day < end;
}

const EVENT_COLORS = [
  "bg-primary/20 text-primary border-primary/30",
  "bg-accent/20 text-accent-foreground border-accent/30",
  "bg-destructive/15 text-destructive border-destructive/30",
  "bg-secondary text-secondary-foreground border-border",
];

// ---------- Subcomponente: Popover de detalhes do evento ----------

function EventPopover({
  event,
  colorClass,
  label,
}: {
  event: CalendarEvent;
  colorClass: string;
  label: string;
}) {
  const nights = calcNights(event.start_date, event.end_date);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`text-[10px] leading-tight px-1 py-0.5 rounded border truncate w-full text-left cursor-pointer hover:opacity-80 transition-opacity ${colorClass}`}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-2" side="top" align="start">
        <p className="text-sm font-medium text-foreground">
          {event.summary || "Evento sem título"}
        </p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDateBR(event.start_date)} → {formatDateBR(event.end_date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Moon className="h-3.5 w-3.5 shrink-0" />
            <span>{nights} noite{nights !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------- Subcomponente: Vista em lista ----------

function EventsListView({
  events,
  colorMap,
}: {
  events: CalendarEvent[];
  colorMap: Map<string, number>;
}) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm space-y-1">
        <CalendarDays className="h-8 w-8 mx-auto opacity-40" />
        <p>Nenhum evento importado.</p>
        <p className="text-xs">Sincronize uma conexão para ver reservas e bloqueios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((ev) => {
        const nights = calcNights(ev.start_date, ev.end_date);
        const colorIdx = colorMap.get(ev.connection_id) ?? 0;
        const colorClass = EVENT_COLORS[colorIdx];
        return (
          <div
            key={ev.id}
            className="rounded-md border border-border bg-card px-4 py-3 flex items-start gap-3"
          >
            <div className={`w-1 self-stretch rounded-full shrink-0 ${colorClass.split(" ")[0]}`} />
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {formatDateBR(ev.start_date)} → {formatDateBR(ev.end_date)}
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  ({nights} noite{nights !== 1 ? "s" : ""})
                </span>
              </p>
              {ev.summary && (
                <p className="text-xs text-muted-foreground">{ev.summary}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Componente principal ----------

export default function AirbnbCalendarGrid({
  projectId,
  refreshKey = 0,
}: AirbnbCalendarGridProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "list">("calendar");

  // Navegação
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

  // Fetch
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
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

  // Color map
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

  // Grid data
  const totalDays = daysInMonth(year, month);
  const startWeekday = new Date(year, month, 1).getDay();

  const daysGrid = useMemo(() => {
    const grid: Array<{ day: number; date: Date; events: CalendarEvent[] }> = [];
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const dayEvents = events.filter((e) => isDayInRange(date, e.start_date, e.end_date));
      grid.push({ day: d, date, events: dayEvents });
    }
    return grid;
  }, [year, month, totalDays, events]);

  const isToday = (d: number) =>
    year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            {monthName(month)} {year}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {/* Toggle de visualização */}
          <div className="flex border border-border rounded-md mr-2">
            <Button
              variant={view === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("calendar")}
              className="rounded-r-none h-8 px-2"
              aria-label="Visualização calendário"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="rounded-l-none h-8 px-2"
              aria-label="Visualização lista"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Navegação de mês (só no modo calendário) */}
          {view === "calendar" && (
            <>
              <Button variant="ghost" size="sm" onClick={goToPrev} aria-label="Mês anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="text-xs px-2">
                Hoje
              </Button>
              <Button variant="ghost" size="sm" onClick={goToNext} aria-label="Próximo mês">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Conteúdo: calendário ou lista */}
      {view === "calendar" ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* Dias da semana */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-center text-xs font-medium text-muted-foreground py-2">
                {wd}
              </div>
            ))}
          </div>

          {/* Células */}
          <div className="grid grid-cols-7">
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="border-b border-r border-border bg-muted/20 min-h-[72px]" />
            ))}

            {daysGrid.map(({ day, events: dayEvents }) => {
              const todayHighlight = isToday(day);
              return (
                <div
                  key={day}
                  className={`border-b border-r border-border min-h-[72px] p-1 transition-colors ${
                    todayHighlight ? "bg-primary/5" : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        todayHighlight ? "bg-primary text-primary-foreground" : "text-foreground"
                      }`}
                    >
                      {day}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const colorIdx = colorMap.get(ev.connection_id) ?? 0;
                      const colorClass = EVENT_COLORS[colorIdx];
                      const label = ev.summary
                        ? ev.summary.length > 14 ? ev.summary.substring(0, 12) + "…" : ev.summary
                        : "Evento";
                      return (
                        <EventPopover
                          key={ev.id}
                          event={ev}
                          colorClass={colorClass}
                          label={label}
                        />
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
      ) : (
        <EventsListView events={events} colorMap={colorMap} />
      )}

      {/* Rodapé */}
      {events.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            <Badge variant="secondary" className="text-xs mr-1">{events.length}</Badge>
            evento{events.length !== 1 ? "s" : ""} no total
          </span>
          {view === "calendar" && (
            <span>Clique em um evento para ver detalhes.</span>
          )}
        </div>
      )}
    </div>
  );
}
