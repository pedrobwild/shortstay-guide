import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Percent, DollarSign, Moon, Hash, TrendingUp,
  CalendarClock, CalendarOff, Sparkles, BarChart3, Loader2,
  Wallet, Settings2, RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";
import {
  normalizeEvents, computeKpis, occupancyByMonth, stayLengthDistribution,
  occupancyByWeekday, upcomingStays, longestGaps,
  DEFAULT_ADR_BRL, type NormalizedEvent, type RawEvent,
} from "@/lib/projectAnalytics";

interface ProjectAnalyticsProps {
  projectId: string;
  refreshKey?: number;
}

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const formatRange = (a: Date | null, b: Date | null) => {
  if (!a || !b) return "—";
  const f = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  return `${f(a)} → ${f(b)}`;
};

const formatDate = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });

function occupancyColor(pct: number) {
  if (pct >= 80) return "hsl(var(--primary))";
  if (pct >= 50) return "hsl(var(--primary) / 0.6)";
  return "hsl(var(--primary) / 0.3)";
}

export default function ProjectAnalytics({ projectId, refreshKey = 0 }: ProjectAnalyticsProps) {
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [adr, setAdr] = useState<number>(DEFAULT_ADR_BRL);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const { data: conns, error: cErr } = await supabase
          .from("ota_connections")
          .select("id")
          .eq("project_id", projectId);
        if (cErr) throw cErr;
        const ids = (conns || []).map((c) => c.id);
        if (ids.length === 0) {
          if (!cancelled) setEvents([]);
          return;
        }
        const { data: evs, error: eErr } = await supabase
          .from("ota_calendar_events")
          .select("id, start_date, end_date, summary, raw_payload")
          .in("connection_id", ids);
        if (eErr) throw eErr;
        if (!cancelled) setEvents(normalizeEvents((evs || []) as unknown as RawEvent[]));
      } catch (err) {
        console.error("ProjectAnalytics load error", err);
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [projectId, refreshKey]);

  const kpis = useMemo(() => computeKpis(events, adr), [events, adr]);
  const monthly = useMemo(() => occupancyByMonth(events, adr), [events, adr]);
  const stays = useMemo(() => stayLengthDistribution(events), [events]);
  const weekday = useMemo(() => occupancyByWeekday(events), [events]);
  const upcoming = useMemo(() => upcomingStays(events, 60).slice(0, 10), [events]);
  const gaps = useMemo(() => longestGaps(events, 3), [events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Calculando análises...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-12 text-center space-y-3">
          <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/60" />
          <div>
            <p className="text-sm font-medium text-foreground">Sem dados para analisar ainda</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Conecte um calendário iCal do Airbnb ou crie uma conexão de teste para gerar análises automáticas
              de ocupação, receita e padrões de reserva.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Análises do projeto
          </h2>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {formatRange(kpis.windowStart, kpis.windowEnd)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {events.length} eventos · {kpis.totalNights} noites
            </span>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label htmlFor="adr-input" className="text-xs text-muted-foreground">Diária (ADR)</Label>
            <Input
              id="adr-input"
              type="number"
              min={0}
              step={10}
              value={adr}
              onChange={(e) => setAdr(Math.max(0, Number(e.target.value) || 0))}
              className="w-32 h-9"
            />
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<Percent className="h-4 w-4" />} label="Ocupação" value={`${kpis.occupancyPct.toFixed(1)}%`} />
        <KpiCard icon={<DollarSign className="h-4 w-4" />} label="Receita estimada" value={brl(kpis.estimatedRevenueBrl)} />
        <KpiCard icon={<Moon className="h-4 w-4" />} label="Estadia média" value={`${kpis.averageStayNights.toFixed(1)} noites`} />
        <KpiCard
          icon={<Hash className="h-4 w-4" />}
          label="Reservas / Bloqueios"
          value={`${kpis.reservationsCount} / ${kpis.blockedCount}`}
        />
      </div>

      {/* Ocupação por mês */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Ocupação por mês</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="%" domain={[0, 100]} />
                <Tooltip content={<MonthlyTooltip />} />
                <Bar dataKey="occupancyPct" radius={[4, 4, 0, 0]}>
                  {monthly.map((m) => (
                    <Cell key={m.monthKey} fill={occupancyColor(m.occupancyPct)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Receita estimada por mês */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Receita estimada por mês</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => `R$${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(value: number) => [brl(value), "Receita"]}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="estimatedRevenueBrl"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grid: stays + weekday */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground">Duração das estadias</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stays} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8, fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v} reservas`, "Quantidade"]}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground">Ocupação por dia da semana</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekday} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8, fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v} noites`, "Reservadas"]}
                  />
                  <Bar dataKey="bookedNights" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: upcoming + gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Próximos 60 dias</h3>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Nenhum evento nos próximos 60 dias.</p>
            ) : (
              <ul className="space-y-1.5">
                {upcoming.map((s, i) => (
                  <li
                    key={i}
                    className={
                      s.type === "reservation"
                        ? "rounded-md border border-border bg-primary/5 px-3 py-2 text-xs"
                        : "rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{s.summary || (s.type === "blocked" ? "Bloqueado" : "Reserva")}</span>
                      <span className="shrink-0">{s.nights}n</span>
                    </div>
                    <div className="text-[11px] opacity-80">
                      {formatDate(s.start)} → {formatDate(s.end)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CalendarOff className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Maiores vacâncias</h3>
            </div>
            {gaps.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Sem janelas de vacância significativas.</p>
            ) : (
              <ul className="space-y-1.5">
                {gaps.map((g, i) => (
                  <li key={i} className="rounded-md border border-border px-3 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{g.nights} noites vagas</span>
                      <Badge variant="outline" className="text-[10px]">#{i + 1}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatDate(g.from)} → {formatDate(g.to)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1.5">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function MonthlyTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const m = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground mb-1">{m.monthLabel}</p>
      <p className="text-muted-foreground">Ocupação: <span className="text-foreground font-medium">{m.occupancyPct.toFixed(1)}%</span></p>
      <p className="text-muted-foreground">Reservas: <span className="text-foreground font-medium">{m.bookedNights}n</span> · Bloq: {m.blockedNights}n</p>
      <p className="text-muted-foreground">Receita: <span className="text-foreground font-medium">{brl(m.estimatedRevenueBrl)}</span></p>
    </div>
  );
}
