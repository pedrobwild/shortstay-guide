import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2,
  Gauge, Info, LayoutDashboard, Lightbulb, Loader2, Sparkles,
  Wallet, Percent, DollarSign, Target,
} from "lucide-react";
import {
  normalizeEvents, computeKpis, occupancyByMonth, forwardOccupancy,
  seasonalityIndex, weekendVsWeekday, yearOverYear, bookingPatterns,
  breakEvenAnalysis, investmentReturn, longestGaps,
  DEFAULT_ADR_BRL, type RawEvent,
} from "@/lib/projectAnalytics";
import {
  generateDashboardSummary, type Insight, type InsightTone,
} from "@/lib/projectInsights";

interface ExecutiveSummaryProps {
  projectId: string;
  refreshKey?: number;
  onDataChanged?: () => void;
}

interface CostSettings {
  adr: number;
  cleaningPerStay: number;
  managementPct: number;
  condoMonthly: number;
  taxesPct: number;
  propertyValue: number;
}

const DEFAULT_COSTS: CostSettings = {
  adr: DEFAULT_ADR_BRL,
  cleaningPerStay: 120,
  managementPct: 18,
  condoMonthly: 500,
  taxesPct: 6,
  propertyValue: 0,
};

const storageKey = (projectId: string) => `bwild:project-costs:${projectId}`;

function loadCosts(projectId: string): CostSettings {
  if (typeof window === "undefined") return DEFAULT_COSTS;
  try {
    const raw = window.localStorage.getItem(storageKey(projectId));
    if (!raw) return DEFAULT_COSTS;
    return { ...DEFAULT_COSTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_COSTS;
  }
}

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const toneClass = (tone: InsightTone) => {
  switch (tone) {
    case "positive": return "border-primary/40 bg-primary/[0.04] text-primary";
    case "negative": return "border-destructive/40 bg-destructive/[0.04] text-destructive";
    case "warning":  return "border-amber-500/40 bg-amber-500/[0.05] text-amber-700 dark:text-amber-400";
    default:         return "border-border bg-muted/40 text-foreground";
  }
};

const toneIcon = (tone: InsightTone) => {
  switch (tone) {
    case "positive": return <CheckCircle2 className="h-4 w-4" />;
    case "negative": return <ArrowDownRight className="h-4 w-4" />;
    case "warning":  return <AlertTriangle className="h-4 w-4" />;
    default:         return <Info className="h-4 w-4" />;
  }
};

export default function ExecutiveSummary({ projectId, refreshKey = 0, onDataChanged }: ExecutiveSummaryProps) {
  const [projectName, setProjectName] = useState<string>("");
  const [events, setEvents] = useState<ReturnType<typeof normalizeEvents>>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [hasConnection, setHasConnection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creatingDemo, setCreatingDemo] = useState(false);
  const costs = loadCosts(projectId);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const [projectRes, connRes] = await Promise.all([
          supabase.from("projects").select("name").eq("id", projectId).maybeSingle(),
          supabase.from("ota_connections")
            .select("id, last_synced_at")
            .eq("project_id", projectId),
        ]);

        if (cancelled) return;
        if (projectRes.data) setProjectName(projectRes.data.name || "");

        const conns = connRes.data || [];
        setHasConnection(conns.length > 0);
        const synced = conns
          .map((c) => c.last_synced_at)
          .filter((s): s is string => !!s)
          .sort()
          .pop();
        setLastSynced(synced ? new Date(synced) : null);

        if (conns.length === 0) {
          setEvents([]);
          return;
        }

        const ids = conns.map((c) => c.id);
        const { data: evs } = await supabase
          .from("ota_calendar_events")
          .select("id, start_date, end_date, summary, raw_payload")
          .in("connection_id", ids);

        if (!cancelled) setEvents(normalizeEvents((evs || []) as unknown as RawEvent[]));
      } catch (err) {
        console.error("ExecutiveSummary load error", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [projectId, refreshKey]);

  const handleCreateDemo = async () => {
    if (creatingDemo) return;
    setCreatingDemo(true);
    try {
      const { data: conn, error: connErr } = await supabase
        .from("ota_connections")
        .insert({
          project_id: projectId,
          provider: "airbnb",
          connection_type: "ical",
          ical_url: null,
          status: "active",
          is_test: true,
        })
        .select("id")
        .single();
      if (connErr || !conn) throw connErr || new Error("Falha ao criar conexão demo");

      const { data: syncData, error: syncErr } = await supabase.functions.invoke(
        "sync-airbnb-ical",
        { body: { connectionId: conn.id } },
      );
      if (syncErr) throw syncErr;
      if (!syncData?.success) throw new Error(syncData?.error || "Erro na sincronização");

      toast({
        title: "Dashboard pronto!",
        description: `${syncData.eventsImported} eventos fictícios importados.`,
      });
      onDataChanged?.();
    } catch (err) {
      const e = err as { message?: string };
      toast({ title: "Erro ao gerar demo", description: e.message, variant: "destructive" });
    } finally {
      setCreatingDemo(false);
    }
  };

  const summary = useMemo(() => {
    if (events.length === 0) return null;
    const kpis = computeKpis(events, costs.adr);
    const monthly = occupancyByMonth(events, costs.adr);
    const otb30 = forwardOccupancy(events, 30, costs.adr);
    const otb60 = forwardOccupancy(events, 60, costs.adr);
    const seasonality = seasonalityIndex(events);
    const weekendSplit = weekendVsWeekday(events, kpis.windowStart, kpis.windowEnd, costs.adr);
    const yoy = yearOverYear(events, costs.adr);
    const patterns = bookingPatterns(events);
    const monthsCount = monthly.length || 1;

    const grossRevenue = kpis.estimatedRevenueBrl;
    const cleaningTotal = costs.cleaningPerStay * kpis.reservationsCount;
    const managementTotal = grossRevenue * (costs.managementPct / 100);
    const taxesTotal = grossRevenue * (costs.taxesPct / 100);
    const condoTotal = costs.condoMonthly * monthsCount;
    const totalCosts = cleaningTotal + managementTotal + taxesTotal + condoTotal;
    const netRevenue = grossRevenue - totalCosts;
    const netMarginPct = grossRevenue > 0 ? (netRevenue / grossRevenue) * 100 : 0;

    const avgMonthlyOccupancy = monthly.length > 0
      ? monthly.reduce((acc, m) => acc + m.occupancyPct, 0) / monthly.length
      : 0;

    const breakEven = breakEvenAnalysis({
      adr: costs.adr,
      variableRatio: (costs.managementPct + costs.taxesPct) / 100,
      cleaningPerStay: costs.cleaningPerStay,
      monthlyFixedCosts: costs.condoMonthly,
      averageStayNights: kpis.averageStayNights,
      currentMonthlyOccupancyPct: avgMonthlyOccupancy,
    });
    const returns = investmentReturn({
      propertyValueBrl: costs.propertyValue,
      observedGrossBrl: grossRevenue,
      observedNetBrl: netRevenue,
      monthsObserved: monthsCount,
    });
    const longestGap = longestGaps(events, 1)[0] ?? null;
    const dashboard = generateDashboardSummary({
      kpis, monthly, otb30, otb60, seasonality, yoy, patterns,
      breakEven, returns, weekendSplit, longestGap,
      netMarginPct, netRevenueBrl: netRevenue,
      hasPropertyValue: costs.propertyValue > 0,
    });

    const revPar = kpis.totalNights > 0 ? grossRevenue / kpis.totalNights : 0;
    const effectiveAdr = kpis.bookedNights > 0 ? grossRevenue / kpis.bookedNights : 0;

    return {
      kpis, monthly, otb30, otb60, breakEven, returns, dashboard,
      grossRevenue, netRevenue, netMarginPct, revPar, effectiveAdr,
      monthsCount,
    };
  }, [events, costs]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Carregando dashboard...
        </CardContent>
      </Card>
    );
  }

  // Empty state — promove demo
  if (!summary) {
    return (
      <Card className="border-dashed border-primary/40 bg-primary/[0.03]">
        <CardContent className="py-10 px-6 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              {projectName ? `Dashboard de ${projectName}` : "Dashboard de dados"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {hasConnection
                ? "A conexão existe, mas ainda não há eventos sincronizados. Importe um iCal real abaixo ou gere dados de demonstração."
                : "Carregue dados de demonstração com 1 clique para visualizar todos os KPIs e insights, ou conecte o iCal do seu anúncio Airbnb abaixo."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={handleCreateDemo} disabled={creatingDemo}>
              {creatingDemo ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando dashboard...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Gerar dados de demonstração</>
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Os dados demo são fictícios e podem ser apagados a qualquer momento na seção de conexões.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { kpis, monthly, otb30, otb60, breakEven, returns, dashboard } = summary;
  const trendBg = dashboard.trendTone === "positive" ? "bg-primary/10 text-primary"
    : dashboard.trendTone === "negative" ? "bg-destructive/10 text-destructive"
    : "bg-muted text-foreground";
  const healthColor =
    dashboard.healthScore >= 70 ? "hsl(var(--primary))"
    : dashboard.healthScore >= 40 ? "hsl(var(--accent))"
    : "hsl(var(--destructive))";

  return (
    <section className="space-y-4">
      {/* Header */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.04] to-transparent">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  {projectName || "Dashboard do projeto"}
                </h2>
                <Badge className={`${trendBg} border-transparent text-[10px]`}>
                  {dashboard.trendTone === "positive" && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
                  {dashboard.trendTone === "negative" && <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {dashboard.trendLabel}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {kpis.windowStart && kpis.windowEnd
                  ? `Período: ${kpis.windowStart.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })} → ${kpis.windowEnd.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}`
                  : "—"}
                {lastSynced && (
                  <> · Última sincronização: {lastSynced.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</>
                )}
              </p>
            </div>

            {/* Health score gauge */}
            <div className="flex items-center gap-3 self-start">
              <div
                className="relative h-16 w-16 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(${healthColor} ${dashboard.healthScore * 3.6}deg, hsl(var(--muted)) 0deg)`,
                }}
              >
                <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center">
                  <div className="text-center leading-none">
                    <p className="text-base font-bold text-foreground">{dashboard.healthScore}</p>
                    <p className="text-[8px] uppercase tracking-wide text-muted-foreground">saúde</p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-[11px] text-muted-foreground">Health score</p>
                <p className="text-xs text-foreground font-medium">
                  {dashboard.healthScore >= 70 ? "Operação saudável"
                    : dashboard.healthScore >= 40 ? "Atenção em alguns indicadores"
                    : "Requer ações urgentes"}
                </p>
              </div>
            </div>
          </div>

          {/* Hero KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <HeroKpi
              icon={<Percent className="h-4 w-4" />}
              label="Ocupação"
              value={`${kpis.occupancyPct.toFixed(1)}%`}
              hint={`${kpis.bookedNights}n reservadas`}
            />
            <HeroKpi
              icon={<Wallet className="h-4 w-4" />}
              label="Receita líquida"
              value={brl(summary.netRevenue)}
              hint={`Margem ${summary.netMarginPct.toFixed(0)}%`}
              accent
            />
            <HeroKpi
              icon={<Gauge className="h-4 w-4" />}
              label="RevPAR"
              value={brl(summary.revPar)}
              hint={`ADR ${brl(summary.effectiveAdr)}`}
            />
            <HeroKpi
              icon={returns.propertyValueBrl > 0 ? <Target className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
              label={returns.propertyValueBrl > 0 ? "Cap rate" : "Receita bruta"}
              value={returns.propertyValueBrl > 0
                ? `${returns.capRatePct.toFixed(2)}%`
                : brl(summary.grossRevenue)}
              hint={returns.propertyValueBrl > 0
                ? returns.paybackYears !== null ? `Payback ${returns.paybackYears.toFixed(1)} anos` : "Payback —"
                : `${kpis.reservationsCount} reservas`}
            />
          </div>

          {/* Mini sparkline — receita mensal */}
          {monthly.length >= 2 && (
            <div className="h-20 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="executiveSparkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8, fontSize: 12,
                    }}
                    formatter={(v: number) => [brl(v), "Receita bruta"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="estimatedRevenueBrl"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#executiveSparkFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strip de cards secundários */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SecondaryStat
          label="OTB 30 dias"
          value={`${otb30.bookedPct.toFixed(0)}%`}
          hint={`${otb30.bookedNights} de 30 noites`}
          tone={otb30.bookedPct >= 60 ? "positive" : otb30.bookedPct >= 30 ? "info" : "warning"}
        />
        <SecondaryStat
          label="OTB 60 dias"
          value={`${otb60.bookedPct.toFixed(0)}%`}
          hint={`Receita ${brl(otb60.estimatedRevenueBrl)}`}
          tone="info"
        />
        <SecondaryStat
          label="Break-even"
          value={`${breakEven.breakEvenOccupancyPct.toFixed(0)}%`}
          hint={`Margem ${breakEven.marginVsBreakEvenPct >= 0 ? "+" : ""}${breakEven.marginVsBreakEvenPct.toFixed(0)}pp`}
          tone={breakEven.marginVsBreakEvenPct >= 0 ? "positive" : "negative"}
        />
        <SecondaryStat
          label="Estadia média"
          value={`${kpis.averageStayNights.toFixed(1)}n`}
          hint={`${kpis.reservationsCount} reservas`}
          tone="info"
        />
      </div>

      {/* Insights & Recomendações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Destaques do período</h3>
            </div>
            {dashboard.highlights.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">Nenhum sinal relevante no momento.</p>
            ) : (
              <ul className="space-y-2">
                {dashboard.highlights.map((h, i) => <InsightRow key={i} insight={h} />)}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Recomendações de ação</h3>
            </div>
            {dashboard.recommendations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">Operação alinhada — sem ações prioritárias.</p>
            ) : (
              <ul className="space-y-2">
                {dashboard.recommendations.map((r, i) => <InsightRow key={i} insight={r} />)}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function HeroKpi({
  icon, label, value, hint, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 space-y-1 ${accent ? "border-primary/40 bg-primary/[0.05]" : "border-border bg-background"}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <p className={`text-lg font-semibold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground truncate">{hint}</p>}
    </div>
  );
}

function SecondaryStat({
  label, value, hint, tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: InsightTone;
}) {
  const accent =
    tone === "positive" ? "text-primary"
    : tone === "negative" ? "text-destructive"
    : tone === "warning" ? "text-amber-700 dark:text-amber-400"
    : "text-foreground";
  return (
    <Card>
      <CardContent className="p-3 space-y-0.5">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={`text-base font-semibold ${accent}`}>{value}</p>
        {hint && <p className="text-[10px] text-muted-foreground truncate">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function InsightRow({ insight }: { insight: Insight }) {
  return (
    <li className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${toneClass(insight.tone)}`}>
      <span className="shrink-0 mt-0.5">{toneIcon(insight.tone)}</span>
      <div className="min-w-0">
        <p className="font-medium leading-tight">{insight.title}</p>
        <p className="text-[11px] opacity-80 mt-0.5">{insight.detail}</p>
      </div>
    </li>
  );
}
