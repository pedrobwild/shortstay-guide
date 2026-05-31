import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Percent, DollarSign, Moon, TrendingUp, TrendingDown,
  CalendarClock, CalendarOff, Sparkles, BarChart3, Loader2,
  Wallet, Settings2, RotateCcw, Target, Repeat, Building2,
  CalendarRange, Activity, Gauge, ArrowUpRight, ArrowDownRight,
  Hash, Ticket, Sun, Snowflake, MapPin, Ruler, LineChart as LineChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine,
} from "recharts";
import {
  normalizeEvents, computeKpis, occupancyByMonth, stayLengthDistribution,
  occupancyByWeekday, upcomingStays, longestGaps,
  forwardOccupancy, seasonalityIndex, weekendVsWeekday, yearOverYear,
  bookingPatterns, breakEvenAnalysis, investmentReturn,
  generateProjectionEvents, DEFAULT_ADR_BRL, DEFAULT_SP_SEASONALITY,
  type NormalizedEvent, type RawEvent,
} from "@/lib/projectAnalytics";
import { useBairroData } from "@/hooks/useBairroData";
import type { BairroItem } from "@/data/guide-data";

export type ProjectAnalyticsMode = "projection" | "real";

interface ProjectAnalyticsProps {
  projectId?: string;
  refreshKey?: number;
  /** "real" usa eventos do iCal (Supabase); "projection" gera eventos sintéticos de mercado. */
  mode?: ProjectAnalyticsMode;
}

type SizeKey = keyof BairroItem["avgBySize"];
const SIZE_KEYS: SizeKey[] = ["20–25 m²", "26–35 m²", "36–50 m²"];

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
  propertyValue: number;     // valor de aquisição do imóvel (para cap rate / payback)
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

/** Cache otimista/fallback offline em localStorage (leitura síncrona p/ evitar flicker). */
function loadCostsCache(projectId: string): CostSettings {
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

type AssumptionsRow =
  Database["public"]["Tables"]["project_assumptions"]["Row"];

/** Linha do Supabase → premissas financeiras da UI. */
function rowToCosts(row: Partial<AssumptionsRow>): CostSettings {
  return {
    adr: row.adr ?? DEFAULT_COSTS.adr,
    cleaningPerStay: row.cleaning_per_stay ?? DEFAULT_COSTS.cleaningPerStay,
    managementPct: row.management_pct ?? DEFAULT_COSTS.managementPct,
    condoMonthly: row.condo_monthly ?? DEFAULT_COSTS.condoMonthly,
    taxesPct: row.taxes_pct ?? DEFAULT_COSTS.taxesPct,
    propertyValue: row.property_value ?? DEFAULT_COSTS.propertyValue,
  };
}

/** Premissas da UI → payload de upsert do Supabase. */
function costsToRow(
  projectId: string,
  costs: CostSettings,
  neighborhood: string | null,
  areaSqm: string | null,
): Database["public"]["Tables"]["project_assumptions"]["Insert"] {
  return {
    project_id: projectId,
    adr: costs.adr,
    cleaning_per_stay: costs.cleaningPerStay,
    management_pct: costs.managementPct,
    taxes_pct: costs.taxesPct,
    condo_monthly: costs.condoMonthly,
    property_value: costs.propertyValue,
    neighborhood,
    area_sqm: areaSqm,
  };
}

export default function ProjectAnalytics({
  projectId,
  refreshKey = 0,
  mode = "real",
}: ProjectAnalyticsProps) {
  const isProjection = mode === "projection";
  const costsKey = projectId ?? "projection";

  const [realEvents, setRealEvents] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState(!isProjection);
  const [costs, setCosts] = useState<CostSettings>(() => loadCostsCache(costsKey));

  // --- Inputs do lead (modo projeção) ---
  const { bairros } = useBairroData();
  const [bairroName, setBairroName] = useState<string>("");
  const [sizeKey, setSizeKey] = useState<SizeKey>("26–35 m²");
  const [occupancyPct, setOccupancyPct] = useState<number>(0);

  // --- Dados do imóvel (modo real) — metadados para o painel comercial ---
  const [propertyNeighborhood, setPropertyNeighborhood] = useState<string>("");
  const [propertyAreaSqm, setPropertyAreaSqm] = useState<string>("");

  const selectedBairro = useMemo<BairroItem | undefined>(
    () => bairros.find((b) => b.name === bairroName) ?? bairros[0],
    [bairros, bairroName],
  );

  // Inicializa o bairro selecionado assim que os dados chegam
  useEffect(() => {
    if (isProjection && !bairroName && bairros.length > 0) {
      setBairroName(bairros[0].name);
    }
  }, [isProjection, bairroName, bairros]);

  // Aplica defaults de ADR + ocupação do bairro/m² selecionados
  const applyBairroDefaults = (bairro: BairroItem | undefined, size: SizeKey) => {
    if (!bairro) return;
    setCosts((prev) => ({ ...prev, adr: bairro.avgBySize[size] }));
    setOccupancyPct(bairro.avgOccupancy);
  };

  // Recalcula defaults sempre que o bairro selecionado muda (inclusive no load inicial)
  useEffect(() => {
    if (isProjection && selectedBairro) {
      applyBairroDefaults(selectedBairro, sizeKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProjection, selectedBairro?.name]);

  // --- Persistência das premissas financeiras ---
  // Estratégia: Supabase é a fonte de verdade (sobrevive a troca de device);
  // localStorage é cache otimista + fallback offline. Save com debounce de 800ms.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);       // só salva depois de hidratar do servidor
  const lastPersistedRef = useRef<string | null>(null); // evita writes redundantes

  // Bairro/área alimentam o painel comercial. No modo projeção vêm dos selects
  // de mercado; no modo real, dos campos "Dados do imóvel".
  const neighborhood = isProjection ? (bairroName || null) : (propertyNeighborhood || null);
  const areaSqm = isProjection ? sizeKey : (propertyAreaSqm || null);

  // Cache otimista local — escreve a cada mudança (offline-first, sem flicker).
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(costsKey), JSON.stringify(costs));
    } catch { /* ignore */ }
  }, [costsKey, costs]);

  // Hidratação: cache local imediato + leitura autoritativa do Supabase.
  useEffect(() => {
    hydratedRef.current = false;
    setCosts(loadCostsCache(costsKey)); // imediato → sem flicker ao trocar de projeto

    // Projeção não tem projeto → permanece apenas em localStorage.
    if (isProjection || !projectId) {
      hydratedRef.current = true;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("project_assumptions")
          .select("adr, cleaning_per_stay, management_pct, taxes_pct, condo_monthly, property_value, neighborhood, area_sqm")
          .eq("project_id", projectId)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled && data) {
          const loaded = rowToCosts(data);
          const loadedNeighborhood = data.neighborhood ?? null;
          const loadedAreaSqm = data.area_sqm ?? null;
          lastPersistedRef.current = JSON.stringify(
            costsToRow(projectId, loaded, loadedNeighborhood, loadedAreaSqm),
          );
          setCosts(loaded);
          if (loadedNeighborhood) setPropertyNeighborhood(loadedNeighborhood);
          if (loadedAreaSqm) setPropertyAreaSqm(loadedAreaSqm);
        }
      } catch (err) {
        // Rede falhou → mantém o que veio do localStorage (fallback offline).
        console.error("project_assumptions load error", err);
      } finally {
        if (!cancelled) hydratedRef.current = true;
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costsKey, isProjection, projectId]);

  // Persistência debounced no Supabase (800ms) — só para projetos reais.
  useEffect(() => {
    if (isProjection || !projectId || !hydratedRef.current) return;
    const row = costsToRow(projectId, costs, neighborhood, areaSqm);
    const sig = JSON.stringify(row);
    if (sig === lastPersistedRef.current) return; // nada mudou desde a hidratação/último save

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("project_assumptions")
          .upsert(row, { onConflict: "project_id" });
        if (error) throw error;
        lastPersistedRef.current = sig;
      } catch (err) {
        // Rede falhou: o localStorage já tem o valor (fallback). Re-tenta na próxima edição.
        console.error("project_assumptions save error", err);
      }
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [costs, neighborhood, areaSqm, isProjection, projectId]);

  useEffect(() => {
    if (isProjection || !projectId) {
      setLoading(false);
      return;
    }
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
          if (!cancelled) setRealEvents([]);
          return;
        }
        const { data: evs, error: eErr } = await supabase
          .from("ota_calendar_events")
          .select("id, start_date, end_date, summary, raw_payload")
          .in("connection_id", ids);
        if (eErr) throw eErr;
        if (!cancelled) setRealEvents(normalizeEvents((evs || []) as unknown as RawEvent[]));
      } catch (err) {
        console.error("ProjectAnalytics load error", err);
        if (!cancelled) setRealEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [isProjection, projectId, refreshKey]);

  // Eventos sintéticos de projeção (12 meses) a partir das premissas de mercado
  const projectionEvents = useMemo(
    () =>
      isProjection
        ? generateProjectionEvents({
            occupancyPct,
            avgStayNights: 3,
            months: 12,
            seasonality: DEFAULT_SP_SEASONALITY,
          })
        : [],
    [isProjection, occupancyPct],
  );

  const events = isProjection ? projectionEvents : realEvents;

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

  // OTB — Ocupação futura (próximos 30 / 60 / 90 dias)
  const otb30 = useMemo(() => forwardOccupancy(events, 30, adr), [events, adr]);
  const otb60 = useMemo(() => forwardOccupancy(events, 60, adr), [events, adr]);
  const otb90 = useMemo(() => forwardOccupancy(events, 90, adr), [events, adr]);

  // Sazonalidade
  const seasonality = useMemo(() => seasonalityIndex(events), [events]);

  // Weekend vs weekday
  const weekendSplit = useMemo(
    () => weekendVsWeekday(events, kpis.windowStart, kpis.windowEnd, adr),
    [events, kpis.windowStart, kpis.windowEnd, adr],
  );

  // Year-over-Year
  const yoy = useMemo(() => yearOverYear(events, adr), [events, adr]);

  // Padrões de reserva
  const patterns = useMemo(() => bookingPatterns(events), [events]);

  // KPIs derivados
  const revPar = kpis.totalNights > 0 ? grossRevenue / kpis.totalNights : 0;
  const effectiveAdr = kpis.bookedNights > 0 ? grossRevenue / kpis.bookedNights : 0;
  const avgBookingValue = kpis.reservationsCount > 0 ? grossRevenue / kpis.reservationsCount : 0;
  const avgMonthlyOccupancy = monthly.length > 0
    ? monthly.reduce((acc, m) => acc + m.occupancyPct, 0) / monthly.length
    : 0;

  // Break-even (custos fixos mensais e variáveis sobre a receita)
  const breakEven = useMemo(() => breakEvenAnalysis({
    adr: costs.adr,
    variableRatio: (costs.managementPct + costs.taxesPct) / 100,
    cleaningPerStay: costs.cleaningPerStay,
    monthlyFixedCosts: costs.condoMonthly,
    averageStayNights: kpis.averageStayNights,
    currentMonthlyOccupancyPct: avgMonthlyOccupancy,
  }), [costs, kpis.averageStayNights, avgMonthlyOccupancy]);

  // Análise de retorno do investimento
  const returns = useMemo(() => investmentReturn({
    propertyValueBrl: costs.propertyValue,
    observedGrossBrl: grossRevenue,
    observedNetBrl: netRevenue,
    monthsObserved: monthsCount,
  }), [costs.propertyValue, grossRevenue, netRevenue, monthsCount]);

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

  if (!isProjection && events.length === 0) {
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
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/projecao">
              <LineChartIcon className="h-3.5 w-3.5" />
              Ver projeção de mercado
            </Link>
          </Button>
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
            {isProjection ? "Projeção do seu studio" : "Análises do projeto"}
          </h2>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {isProjection ? (
              <Badge className="text-xs gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 border-amber-500/30 dark:text-amber-400">
                <LineChartIcon className="h-3 w-3" />
                Projeção de mercado
              </Badge>
            ) : (
              <Badge className="text-xs gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 border-emerald-500/30 dark:text-emerald-400">
                <Activity className="h-3 w-3" />
                Dados reais
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {formatRange(kpis.windowStart, kpis.windowEnd)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {isProjection
                ? `Estimativa · ${kpis.totalNights} noites · ${monthsCount} ${monthsCount === 1 ? "mês" : "meses"}`
                : `${events.length} eventos · ${kpis.totalNights} noites · ${monthsCount} ${monthsCount === 1 ? "mês" : "meses"}`}
            </span>
          </div>
        </div>
      </div>

      {/* Inputs do lead — modo projeção */}
      {isProjection && (
        <Card className="border-amber-500/30 bg-amber-500/[0.03]">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-medium text-foreground">Seu imóvel</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Bairro
                </Label>
                <Select
                  value={selectedBairro?.name ?? ""}
                  onValueChange={(v) => setBairroName(v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione o bairro" />
                  </SelectTrigger>
                  <SelectContent>
                    {bairros.map((b) => (
                      <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> Faixa de área
                </Label>
                <Select
                  value={sizeKey}
                  onValueChange={(v) => {
                    const next = v as SizeKey;
                    setSizeKey(next);
                    applyBairroDefaults(selectedBairro, next);
                  }}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <CostInput
                id="property-value-input"
                label="Valor do imóvel"
                prefix="R$"
                step={10000}
                value={costs.propertyValue}
                onChange={(v) => updateCost("propertyValue", v)}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Premissas de ADR e ocupação são preenchidas com a média de mercado do bairro/faixa de área
              ({selectedBairro?.avgOccupancy ?? 0}% ocupação · {brl(selectedBairro?.avgBySize[sizeKey] ?? 0)}/noite).
              Ajuste tudo nas premissas abaixo — os números recalculam em tempo real.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dados do imóvel — modo real (metadados p/ painel comercial) */}
      {!isProjection && (
        <Card className="border-primary/15 bg-primary/[0.02]">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">Dados do imóvel</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Bairro
                </Label>
                <Select value={propertyNeighborhood} onValueChange={setPropertyNeighborhood}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione o bairro" />
                  </SelectTrigger>
                  <SelectContent>
                    {bairros.map((b) => (
                      <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> Faixa de área
                </Label>
                <Select value={propertyAreaSqm} onValueChange={setPropertyAreaSqm}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione a faixa" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Bairro e faixa de área qualificam o lead no painel comercial da BWild. Salvos automaticamente.
            </p>
          </CardContent>
        </Card>
      )}

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
              onClick={() => {
                setCosts(DEFAULT_COSTS);
                if (isProjection) applyBairroDefaults(selectedBairro, sizeKey);
              }}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Resetar
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
            {isProjection ? (
              <CostInput id="occupancy-input" label="Ocupação alvo" suffix="%" step={1}
                value={occupancyPct}
                onChange={(v) => setOccupancyPct(Math.min(100, Math.max(0, v || 0)))} />
            ) : (
              <CostInput id="property-input" label="Valor do imóvel" prefix="R$" step={10000}
                value={costs.propertyValue} onChange={(v) => updateCost("propertyValue", v)} />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isProjection
              ? "Premissas de mercado pré-preenchidas pelo bairro. Ajuste a ocupação alvo e a diária para simular cenários — a projeção recalcula automaticamente."
              : "Premissas salvas automaticamente na nuvem por projeto (com cache offline). Valor do imóvel destrava cap rate, yield e payback."}
          </p>
        </CardContent>
      </Card>

      {/* KPIs principais */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Visão geral</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={<Percent className="h-4 w-4" />} label="Ocupação"
            value={`${kpis.occupancyPct.toFixed(1)}%`}
            hint={`${kpis.bookedNights}n reservadas · ${kpis.blockedNights}n bloqueadas`} />
          <KpiCard icon={<DollarSign className="h-4 w-4" />} label="Receita bruta"
            value={brl(grossRevenue)}
            hint={`${kpis.bookedNights} noites × ${brl(adr)}`} />
          <KpiCard
            icon={<Wallet className="h-4 w-4" />}
            label="Receita líquida"
            value={brl(netRevenue)}
            accent
            hint={`Margem ${netMarginPct.toFixed(1)}% · Custos ${brl(totalCosts)}`}
          />
          <KpiCard icon={<Moon className="h-4 w-4" />} label="Estadia média"
            value={`${kpis.averageStayNights.toFixed(1)} noites`}
            hint={`${kpis.reservationsCount} reservas no período`} />
        </div>
      </div>

      {/* KPIs de performance — métricas hoteleiras */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Performance</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={<Gauge className="h-4 w-4" />} label="RevPAR"
            value={brl(revPar)}
            hint="Receita por noite disponível" />
          <KpiCard icon={<DollarSign className="h-4 w-4" />} label="ADR efetivo"
            value={brl(effectiveAdr)}
            hint="Receita / noites reservadas" />
          <KpiCard icon={<Ticket className="h-4 w-4" />} label="Ticket médio"
            value={brl(avgBookingValue)}
            hint="Receita / nº de reservas" />
          <KpiCard icon={<Hash className="h-4 w-4" />} label="Reservas"
            value={`${kpis.reservationsCount}`}
            hint={`${patterns.backToBackCount} back-to-back · ${patterns.weekendArrivalsPct.toFixed(0)}% chegam fim de semana`} />
        </div>
      </div>

      {/* KPIs de demanda futura — OTB */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Demanda futura (OTB)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <OtbCard label="Próximos 30 dias" otb={otb30} />
          <OtbCard label="Próximos 60 dias" otb={otb60} />
          <OtbCard label="Próximos 90 dias" otb={otb90} />
        </div>
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Receita por mês</h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" /> Bruta
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-accent" /> Líquida
              </span>
            </div>
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
                  formatter={(value: number, name: string) => [brl(value), name === "estimatedRevenueBrl" ? "Bruta" : "Líquida"]}
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
                <Line
                  type="monotone"
                  dataKey="netRevenueBrl"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={{ r: 3, fill: "hsl(var(--accent))" }}
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

      {/* Sazonalidade */}
      {seasonality.length >= 2 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Sazonalidade</h3>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Índice 1.0 = média do período observado
              </span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonality} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v) => v.toFixed(1)} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8, fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "index") return [`${value.toFixed(2)}x`, "Índice"];
                      return [`${value.toFixed(1)}%`, "Ocupação"];
                    }}
                  />
                  <ReferenceLine y={1} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Bar dataKey="index" radius={[4, 4, 0, 0]}>
                    {seasonality.map((m) => (
                      <Cell
                        key={m.month}
                        fill={m.index >= 1 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.5)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Meses acima da linha tracejada performam acima da média; abaixo são oportunidades para campanhas e ajustes de preço.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Year-over-Year */}
      {yoy.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Comparação ano sobre ano (YoY)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="text-left font-medium py-2">Mês</th>
                    <th className="text-right font-medium py-2">Ocup. anterior</th>
                    <th className="text-right font-medium py-2">Ocup. atual</th>
                    <th className="text-right font-medium py-2">Δ</th>
                    <th className="text-right font-medium py-2">Receita anterior</th>
                    <th className="text-right font-medium py-2">Receita atual</th>
                    <th className="text-right font-medium py-2">Δ %</th>
                  </tr>
                </thead>
                <tbody>
                  {yoy.map((m) => (
                    <tr key={m.monthKey} className="border-b border-border/50">
                      <td className="py-2 font-medium text-foreground">{m.monthLabel}</td>
                      <td className="py-2 text-right text-muted-foreground">{m.previousOccupancyPct.toFixed(1)}%</td>
                      <td className="py-2 text-right">{m.currentOccupancyPct.toFixed(1)}%</td>
                      <td className={`py-2 text-right font-medium ${m.occupancyDeltaPct >= 0 ? "text-primary" : "text-destructive"}`}>
                        {m.occupancyDeltaPct >= 0 ? "+" : ""}{m.occupancyDeltaPct.toFixed(1)}pp
                      </td>
                      <td className="py-2 text-right text-muted-foreground">{brl(m.previousRevenueBrl)}</td>
                      <td className="py-2 text-right">{brl(m.currentRevenueBrl)}</td>
                      <td className={`py-2 text-right font-medium ${m.revenueDeltaPct >= 0 ? "text-primary" : "text-destructive"}`}>
                        {m.revenueDeltaPct >= 0 ? "+" : ""}{m.revenueDeltaPct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Padrões de reserva + Weekend split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Padrões de reserva</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <PatternStat label="Back-to-back" value={`${patterns.backToBackCount}`}
                hint={`${patterns.backToBackRatePct.toFixed(0)}% das transições sem gap`} />
              <PatternStat label="Gap médio" value={`${patterns.averageGapNights.toFixed(1)}n`}
                hint={`Mediana ${patterns.medianGapNights.toFixed(1)}n`} />
              <PatternStat label="Taxa de bloqueio" value={`${patterns.blockRatePct.toFixed(1)}%`}
                hint={`${patterns.blockedCount} bloqueios`} />
              <PatternStat label="Chegada fim de semana" value={`${patterns.weekendArrivalsPct.toFixed(0)}%`}
                hint={`Sex/Sáb`} />
              <PatternStat label="Estadia mais longa" value={`${patterns.longestStayNights}n`} />
              <PatternStat label="Estadia mais curta" value={`${patterns.shortestStayNights}n`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Fim de semana × Semana</h3>
            </div>
            <div className="space-y-3 text-xs">
              <SplitBar
                leftLabel="Fim de semana (Sex/Sáb)"
                rightLabel="Semana (Dom-Qui)"
                leftValue={weekendSplit.weekendNights}
                rightValue={weekendSplit.weekdayNights}
                leftColor="hsl(var(--primary))"
                rightColor="hsl(var(--muted-foreground) / 0.5)"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border p-2 space-y-0.5">
                  <p className="text-[11px] text-muted-foreground">Ocupação fim de semana</p>
                  <p className="text-sm font-medium text-foreground">{weekendSplit.weekendOccupancyPct.toFixed(1)}%</p>
                  <p className="text-[10px] text-muted-foreground">{brl(weekendSplit.weekendRevenueBrl)}</p>
                </div>
                <div className="rounded-md border border-border p-2 space-y-0.5">
                  <p className="text-[11px] text-muted-foreground">Ocupação dia de semana</p>
                  <p className="text-sm font-medium text-foreground">{weekendSplit.weekdayOccupancyPct.toFixed(1)}%</p>
                  <p className="text-[10px] text-muted-foreground">{brl(weekendSplit.weekdayRevenueBrl)}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Compare a ocupação efetiva de cada categoria — útil para decidir descontos em dias de semana ou prêmio em finais de semana.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Break-even + ROI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Break-even operacional</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contribuição por noite</span>
                <span className="font-medium text-foreground">{brl(breakEven.contributionPerNight)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Noites/mês para zerar custos fixos</span>
                <span className="font-medium text-foreground">{breakEven.breakEvenNightsPerMonth.toFixed(1)}n</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ocupação mínima necessária</span>
                <span className="font-medium text-foreground">{breakEven.breakEvenOccupancyPct.toFixed(1)}%</span>
              </div>
              <div className="h-px bg-border my-1" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ocupação média atual</span>
                <span className="font-medium text-foreground">{breakEven.currentMonthlyOccupancyPct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Margem vs break-even</span>
                <Badge
                  variant={breakEven.marginVsBreakEvenPct >= 0 ? "default" : "destructive"}
                  className="text-[10px]"
                >
                  {breakEven.marginVsBreakEvenPct >= 0 ? "+" : ""}{breakEven.marginVsBreakEvenPct.toFixed(1)}pp
                </Badge>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Considera contribuição por noite após gestão, impostos e limpeza, contra custo fixo mensal informado.
            </p>
          </CardContent>
        </Card>

        <Card className={costs.propertyValue > 0 ? "border-primary/30 bg-primary/[0.03]" : ""}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Retorno do investimento</h3>
            </div>
            {costs.propertyValue <= 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Informe o <span className="font-medium text-foreground">Valor do imóvel</span> nas premissas
                para calcular cap rate, yield e payback.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receita bruta anualizada</span>
                  <span className="font-medium text-foreground">{brl(returns.annualizedGrossRevenueBrl)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receita líquida anualizada</span>
                  <span className="font-medium text-foreground">{brl(returns.annualizedNetRevenueBrl)}</span>
                </div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Yield bruto</span>
                  <span className="font-medium text-foreground">{returns.grossYieldPct.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cap rate (yield líquido)</span>
                  <span className="font-medium text-primary">{returns.capRatePct.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payback estimado</span>
                  <span className="font-medium text-foreground">
                    {returns.paybackYears !== null ? `${returns.paybackYears.toFixed(1)} anos` : "—"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Anualizado a partir de {monthsCount} {monthsCount === 1 ? "mês observado" : "meses observados"}.
                </p>
              </div>
            )}
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

function KpiCard({
  icon, label, value, accent, hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <Card className={accent ? "border-primary/40 bg-primary/[0.04]" : ""}>
      <CardContent className="p-4 space-y-1.5">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className={`text-xl font-semibold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function CostInput({
  id, label, value, onChange, prefix, suffix, step = 1,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[11px] text-muted-foreground">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`h-9 text-sm ${prefix ? "pl-8" : ""} ${suffix ? "pr-7" : ""}`}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function CostRow({
  label, value, positive, bold,
}: {
  label: string;
  value: number;
  positive?: boolean;
  bold?: boolean;
}) {
  const isNegative = value < 0;
  const color = bold
    ? value >= 0 ? "text-primary" : "text-destructive"
    : positive
      ? "text-foreground"
      : isNegative
        ? "text-muted-foreground"
        : "text-foreground";
  return (
    <div className={`flex items-center justify-between gap-3 ${bold ? "font-semibold text-sm" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={color}>
        {isNegative ? "− " : ""}{brl(Math.abs(value))}
      </span>
    </div>
  );
}

function OtbCard({ label, otb }: { label: string; otb: ReturnType<typeof forwardOccupancy> }) {
  const pct = otb.bookedPct;
  const tone =
    pct >= 60 ? "border-primary/40 bg-primary/[0.05]" :
    pct >= 30 ? "border-border" :
    "border-dashed border-muted-foreground/30";
  return (
    <Card className={tone}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Badge variant="secondary" className="text-[10px]">{otb.bookedNights}n</Badge>
        </div>
        <p className="text-xl font-semibold text-foreground">{pct.toFixed(1)}%</p>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Disponível: {otb.availableNights}n</span>
          <span>Receita: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(otb.estimatedRevenueBrl)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function PatternStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-border p-2.5 space-y-0.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SplitBar({
  leftLabel, rightLabel, leftValue, rightValue, leftColor, rightColor,
}: {
  leftLabel: string;
  rightLabel: string;
  leftValue: number;
  rightValue: number;
  leftColor: string;
  rightColor: string;
}) {
  const total = leftValue + rightValue;
  const leftPct = total > 0 ? (leftValue / total) * 100 : 0;
  const rightPct = total > 0 ? (rightValue / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{leftLabel}</span>
        <span className="text-muted-foreground">{rightLabel}</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden flex bg-muted">
        <div style={{ width: `${leftPct}%`, background: leftColor }} className="transition-all" />
        <div style={{ width: `${rightPct}%`, background: rightColor }} className="transition-all" />
      </div>
      <div className="flex justify-between text-[11px] text-foreground font-medium">
        <span>{leftValue}n · {leftPct.toFixed(0)}%</span>
        <span>{rightValue}n · {rightPct.toFixed(0)}%</span>
      </div>
    </div>
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
      <p className="text-muted-foreground">Bruta: <span className="text-foreground font-medium">{brl(m.estimatedRevenueBrl)}</span></p>
      {typeof m.netRevenueBrl === "number" && (
        <p className="text-muted-foreground">Líquida: <span className="text-foreground font-medium">{brl(m.netRevenueBrl)}</span></p>
      )}
    </div>
  );
}
