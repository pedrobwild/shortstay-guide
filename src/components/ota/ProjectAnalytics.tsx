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

interface CostSettings {
  adr: number;
  cleaningPerStay: number;   // BRL por reserva
  managementPct: number;     // 0-100
  condoMonthly: number;      // BRL por mês
  taxesPct: number;          // 0-100 sobre receita bruta
}

const DEFAULT_COSTS: CostSettings = {
  adr: DEFAULT_ADR_BRL,
  cleaningPerStay: 120,
  managementPct: 18,
  condoMonthly: 500,
  taxesPct: 6,
};

const storageKey = (projectId: string) => `bwild:project-costs:${projectId}`;

function loadCosts(projectId: string): CostSettings {
  if (typeof window === "undefined") return DEFAULT_COSTS;
  try {
    const raw = window.localStorage.getItem(storageKey(projectId));
    if (!raw) return DEFAULT_COSTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_COSTS, ...parsed };
  } catch {
    return DEFAULT_COSTS;
  }
}

export default function ProjectAnalytics({ projectId, refreshKey = 0 }: ProjectAnalyticsProps) {
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [costs, setCosts] = useState<CostSettings>(() => loadCosts(projectId));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(projectId), JSON.stringify(costs));
    } catch { /* ignore */ }
  }, [projectId, costs]);

  useEffect(() => {
    setCosts(loadCosts(projectId));
  }, [projectId]);

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

  const { adr } = costs;
  const kpis = useMemo(() => computeKpis(events, adr), [events, adr]);
  const monthlyGross = useMemo(() => occupancyByMonth(events, adr), [events, adr]);

  // Receita líquida agregada
  const monthsCount = monthlyGross.length || 1;
  const grossRevenue = kpis.estimatedRevenueBrl;
  const cleaningTotal = costs.cleaningPerStay * kpis.reservationsCount;
  const managementTotal = grossRevenue * (costs.managementPct / 100);
  const taxesTotal = grossRevenue * (costs.taxesPct / 100);
  const condoTotal = costs.condoMonthly * monthsCount;
  const totalCosts = cleaningTotal + managementTotal + taxesTotal + condoTotal;
  const netRevenue = grossRevenue - totalCosts;
  const netMarginPct = grossRevenue > 0 ? (netRevenue / grossRevenue) * 100 : 0;

  // Receita líquida mês a mês
  const monthly = useMemo(() => {
    return monthlyGross.map((m) => {
      const monthReservations = kpis.bookedNights > 0
        ? (m.bookedNights / kpis.bookedNights) * kpis.reservationsCount
        : 0;
      const monthCleaning = costs.cleaningPerStay * monthReservations;
      const monthMgmt = m.estimatedRevenueBrl * (costs.managementPct / 100);
      const monthTaxes = m.estimatedRevenueBrl * (costs.taxesPct / 100);
      const net = m.estimatedRevenueBrl - monthCleaning - monthMgmt - monthTaxes - costs.condoMonthly;
      return { ...m, netRevenueBrl: net };
    });
  }, [monthlyGross, costs, kpis.bookedNights, kpis.reservationsCount]);

  const stays = useMemo(() => stayLengthDistribution(events), [events]);
  const weekday = useMemo(() => occupancyByWeekday(events), [events]);
  const upcoming = useMemo(() => upcomingStays(events, 60).slice(0, 10), [events]);
  const gaps = useMemo(() => longestGaps(events, 3), [events]);

  const updateCost = <K extends keyof CostSettings>(key: K, value: number) => {
    setCosts((prev) => ({ ...prev, [key]: Math.max(0, value || 0) }));
  };

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
              {events.length} eventos · {kpis.totalNights} noites · {monthsCount} {monthsCount === 1 ? "mês" : "meses"}
            </span>
          </div>
        </div>
      </div>

      {/* Painel de custos editáveis */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">Premissas financeiras</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setCosts(DEFAULT_COSTS)}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Resetar
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <CostInput id="adr-input" label="Diária (ADR)" prefix="R$" step={10}
              value={costs.adr} onChange={(v) => updateCost("adr", v)} />
            <CostInput id="cleaning-input" label="Limpeza / reserva" prefix="R$" step={10}
              value={costs.cleaningPerStay} onChange={(v) => updateCost("cleaningPerStay", v)} />
            <CostInput id="management-input" label="Gestão" suffix="%" step={1}
              value={costs.managementPct} onChange={(v) => updateCost("managementPct", v)} />
            <CostInput id="taxes-input" label="Impostos" suffix="%" step={0.5}
              value={costs.taxesPct} onChange={(v) => updateCost("taxesPct", v)} />
            <CostInput id="condo-input" label="Condomínio / mês" prefix="R$" step={50}
              value={costs.condoMonthly} onChange={(v) => updateCost("condoMonthly", v)} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Valores salvos localmente por projeto. Ajuste para simular cenários reais de operação.
          </p>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<Percent className="h-4 w-4" />} label="Ocupação" value={`${kpis.occupancyPct.toFixed(1)}%`} />
        <KpiCard icon={<DollarSign className="h-4 w-4" />} label="Receita bruta" value={brl(grossRevenue)} />
        <KpiCard
          icon={<Wallet className="h-4 w-4" />}
          label="Receita líquida"
          value={brl(netRevenue)}
          accent
          hint={`Margem ${netMarginPct.toFixed(1)}% · Custos ${brl(totalCosts)}`}
        />
        <KpiCard icon={<Moon className="h-4 w-4" />} label="Estadia média" value={`${kpis.averageStayNights.toFixed(1)} noites`} />
      </div>

      {/* Breakdown de custos */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-medium text-foreground">Composição da receita</h3>
          <div className="space-y-2 text-xs">
            <CostRow label="Receita bruta" value={grossRevenue} positive />
            <CostRow label={`Limpeza (${kpis.reservationsCount} reservas × ${brl(costs.cleaningPerStay)})`} value={-cleaningTotal} />
            <CostRow label={`Gestão (${costs.managementPct}%)`} value={-managementTotal} />
            <CostRow label={`Impostos (${costs.taxesPct}%)`} value={-taxesTotal} />
            <CostRow label={`Condomínio (${monthsCount} × ${brl(costs.condoMonthly)})`} value={-condoTotal} />
            <div className="h-px bg-border my-1" />
            <CostRow label="Receita líquida" value={netRevenue} bold />
          </div>
        </CardContent>
      </Card>

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
