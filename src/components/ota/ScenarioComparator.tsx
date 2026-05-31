import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Layers, Plus, Trash2, ArrowUpRight, ArrowDownRight, Minus,
  Loader2, Sparkles, Wallet, TrendingUp, Building2, Percent,
} from "lucide-react";
import { useBairroData } from "@/hooks/useBairroData";
import { useProjectScenarios, type Scenario } from "@/hooks/useProjectScenarios";
import {
  presetAssumptions, scenarioSummary, pctDelta, scenarioKindLabel,
  SCENARIO_PRESETS, type ScenarioAssumptions, type ScenarioKind,
} from "@/lib/scenarioModel";
import type { ProjectionSummary } from "@/lib/projectAnalytics";
import type { BairroItem } from "@/data/guide-data";

interface ScenarioComparatorProps {
  projectId: string;
}

const SIZE_KEYS: (keyof BairroItem["avgBySize"])[] = ["20–25 m²", "26–35 m²", "36–50 m²"];
const DEFAULT_SIZE: keyof BairroItem["avgBySize"] = "26–35 m²";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

/** Linhas de premissas editáveis por cenário. */
const ASSUMPTION_ROWS: {
  key: keyof ScenarioAssumptions;
  label: string;
  prefix?: string;
  suffix?: string;
  step: number;
}[] = [
  { key: "occupancyPct", label: "Ocupação alvo", suffix: "%", step: 1 },
  { key: "adr", label: "Diária (ADR)", prefix: "R$", step: 10 },
  { key: "cleaningPerStay", label: "Limpeza / reserva", prefix: "R$", step: 10 },
  { key: "managementPct", label: "Gestão", suffix: "%", step: 1 },
  { key: "taxesPct", label: "Impostos", suffix: "%", step: 0.5 },
  { key: "condoMonthly", label: "Condomínio / mês", prefix: "R$", step: 50 },
  { key: "propertyValue", label: "Valor do imóvel", prefix: "R$", step: 10000 },
];

type DeltaKind = "pct" | "pp" | "years";

/** Linhas de KPI calculados (resultado), com regra de delta e direção "melhor". */
const KPI_ROWS: {
  label: string;
  icon: React.ReactNode;
  get: (s: ProjectionSummary) => number | null;
  format: (v: number) => string;
  delta: DeltaKind;
  betterHigher: boolean;
}[] = [
  {
    label: "Receita bruta anual", icon: <TrendingUp className="h-3.5 w-3.5" />,
    get: (s) => s.annualGrossRevenueBrl, format: brl, delta: "pct", betterHigher: true,
  },
  {
    label: "Receita líquida anual", icon: <Wallet className="h-3.5 w-3.5" />,
    get: (s) => s.annualNetRevenueBrl, format: brl, delta: "pct", betterHigher: true,
  },
  {
    label: "Margem líquida", icon: <Percent className="h-3.5 w-3.5" />,
    get: (s) => s.netMarginPct, format: (v) => `${v.toFixed(1)}%`, delta: "pp", betterHigher: true,
  },
  {
    label: "Cap rate (ROI)", icon: <Building2 className="h-3.5 w-3.5" />,
    get: (s) => (s.capRatePct > 0 ? s.capRatePct : null),
    format: (v) => `${v.toFixed(2)}%`, delta: "pp", betterHigher: true,
  },
  {
    label: "Payback", icon: <Building2 className="h-3.5 w-3.5" />,
    get: (s) => s.paybackYears, format: (v) => `${v.toFixed(1)} anos`, delta: "years", betterHigher: false,
  },
];

function formatDelta(kind: DeltaKind, value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const abs = Math.abs(value);
  if (kind === "pct") return `${sign}${abs.toFixed(1)}%`;
  if (kind === "pp") return `${sign}${abs.toFixed(1)}pp`;
  return `${sign}${abs.toFixed(1)} ${abs === 1 ? "ano" : "anos"}`;
}

/** Chip de delta: número + sinal + seta + cor. Nunca depende só da cor. */
function DeltaChip({
  kind, value, betterHigher,
}: {
  kind: DeltaKind;
  value: number;
  betterHigher: boolean;
}) {
  const isFlat = Math.abs(value) < 0.05;
  if (isFlat) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
        <Minus className="h-3 w-3" /> igual
      </span>
    );
  }
  const improved = betterHigher ? value > 0 : value < 0;
  const Icon = value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
        improved ? "text-primary" : "text-destructive"
      }`}
    >
      <Icon className="h-3 w-3" />
      {formatDelta(kind, value)}
    </span>
  );
}

/**
 * Comparador multi-cenário de investimento.
 *
 * Permite ao cliente salvar e comparar cenários (conservador / realista /
 * otimista / custom) lado a lado, com presets pré-preenchidos pela banda de
 * mercado do bairro do projeto. KPIs e deltas (vs. baseline "realista") são
 * recalculados em tempo real. Persiste em `project_scenarios` (RLS por projeto).
 */
export default function ScenarioComparator({ projectId }: ScenarioComparatorProps) {
  const { bairros } = useBairroData();
  const { scenarios, loading, busy, updateScenario, addScenario, addScenarios, removeScenario } =
    useProjectScenarios(projectId);

  // Premissas-base do projeto (bairro/área/valor) para alimentar os presets.
  const [base, setBase] = useState<{
    neighborhood: string | null;
    areaSqm: string | null;
    propertyValue: number;
  }>({ neighborhood: null, areaSqm: null, propertyValue: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("project_assumptions")
          .select("neighborhood, area_sqm, property_value")
          .eq("project_id", projectId)
          .maybeSingle();
        if (!cancelled && data) {
          setBase({
            neighborhood: data.neighborhood ?? null,
            areaSqm: data.area_sqm ?? null,
            propertyValue: data.property_value ?? 0,
          });
        }
      } catch (err) {
        console.error("ScenarioComparator base load error", err);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const bairro = useMemo(
    () => bairros.find((b) => b.name === base.neighborhood),
    [bairros, base.neighborhood],
  );
  const sizeKey = (SIZE_KEYS.includes(base.areaSqm as never)
    ? base.areaSqm
    : DEFAULT_SIZE) as keyof BairroItem["avgBySize"];

  const makePreset = (kind: Exclude<ScenarioKind, "custom">): ScenarioAssumptions =>
    presetAssumptions(kind, bairro, sizeKey, base.propertyValue);

  const seedThreePresets = () =>
    addScenarios(
      SCENARIO_PRESETS.map((p) => ({
        name: p.label,
        kind: p.kind,
        assumptions: makePreset(p.kind),
        neighborhood: base.neighborhood,
        areaSqm: sizeKey,
      })),
    );

  const addPreset = (kind: Exclude<ScenarioKind, "custom">) =>
    addScenario({
      name: scenarioKindLabel(kind),
      kind,
      assumptions: makePreset(kind),
      neighborhood: base.neighborhood,
      areaSqm: sizeKey,
    });

  const addBlank = () =>
    addScenario({
      name: `Cenário ${scenarios.length + 1}`,
      kind: "custom",
      assumptions: makePreset("realista"),
      neighborhood: base.neighborhood,
      areaSqm: sizeKey,
    });

  // Resumo calculado de cada cenário (mesma engine do dashboard).
  const computed = useMemo(
    () => scenarios.map((s) => ({ scenario: s, summary: scenarioSummary(s) })),
    [scenarios],
  );

  // Baseline para os deltas: o cenário "realista", senão o primeiro.
  const baselineIdx = useMemo(() => {
    const realistaIdx = scenarios.findIndex((s) => s.kind === "realista");
    return realistaIdx >= 0 ? realistaIdx : 0;
  }, [scenarios]);
  const baseline = computed[baselineIdx]?.summary ?? null;

  const header = (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Comparador de cenários
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
          Salve e compare cenários de investimento lado a lado. Os presets já vêm preenchidos
          com a banda de mercado do bairro{bairro ? ` (${bairro.name})` : ""} — ajuste qualquer
          premissa e veja os KPIs e variações recalcularem na hora.
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <section className="space-y-4">
        {header}
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Carregando cenários...
        </div>
      </section>
    );
  }

  if (scenarios.length === 0) {
    return (
      <section className="space-y-4">
        {header}
        <Card className="border-dashed border-primary/30 bg-primary/[0.02]">
          <CardContent className="py-10 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Nenhum cenário ainda</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Crie os três cenários clássicos (conservador, realista e otimista) pré-preenchidos
                pela média de mercado do bairro e compare receita, ROI e payback lado a lado.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <Button onClick={seedThreePresets} disabled={busy} className="gap-1.5 w-full sm:w-auto">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Gerar 3 cenários
              </Button>
              <Button onClick={addBlank} variant="outline" disabled={busy} className="gap-1.5 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Cenário em branco
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {header}

      {/* Ações rápidas: adicionar presets / em branco */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Adicionar:</span>
        {SCENARIO_PRESETS.map((p) => (
          <Button
            key={p.kind}
            onClick={() => addPreset(p.kind)}
            variant="outline"
            size="sm"
            disabled={busy}
            className="h-7 gap-1 text-xs"
          >
            <Plus className="h-3 w-3" />
            {p.label}
          </Button>
        ))}
        <Button onClick={addBlank} variant="outline" size="sm" disabled={busy} className="h-7 gap-1 text-xs">
          <Plus className="h-3 w-3" />
          Em branco
        </Button>
      </div>

      {/* Tabela de comparação */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground p-3 align-bottom sticky left-0 bg-card z-10 min-w-[160px]">
                    Premissa
                  </th>
                  {computed.map(({ scenario }, idx) => (
                    <th key={scenario.id} className="p-3 align-bottom min-w-[180px]">
                      <ScenarioHeader
                        scenario={scenario}
                        isBaseline={idx === baselineIdx}
                        canDelete={scenarios.length > 1}
                        onRename={(name) => updateScenario(scenario.id, { name })}
                        onDelete={() => removeScenario(scenario.id)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Seção: premissas editáveis */}
                <SectionRow label="Premissas" span={computed.length + 1} />
                {ASSUMPTION_ROWS.map((row) => (
                  <tr key={row.key} className="border-b border-border/50">
                    <td className="p-3 text-muted-foreground sticky left-0 bg-card z-10">{row.label}</td>
                    {computed.map(({ scenario }) => (
                      <td key={scenario.id} className="p-2">
                        <NumberCell
                          value={scenario[row.key] as number}
                          prefix={row.prefix}
                          suffix={row.suffix}
                          step={row.step}
                          onChange={(v) => updateScenario(scenario.id, { [row.key]: v })}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Seção: resultados calculados */}
                <SectionRow label="Resultado" span={computed.length + 1} />
                {KPI_ROWS.map((row) => {
                  const baseVal = baseline ? row.get(baseline) : null;
                  return (
                    <tr key={row.label} className="border-b border-border/50">
                      <td className="p-3 text-muted-foreground sticky left-0 bg-card z-10">
                        <span className="inline-flex items-center gap-1.5">
                          {row.icon}
                          {row.label}
                        </span>
                      </td>
                      {computed.map(({ scenario, summary }, idx) => {
                        const val = row.get(summary);
                        const isBaseline = idx === baselineIdx;
                        return (
                          <td key={scenario.id} className="p-3">
                            {val === null ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <div className="space-y-0.5">
                                <p className="font-medium text-foreground tabular-nums">{row.format(val)}</p>
                                {isBaseline ? (
                                  <span className="text-[11px] text-muted-foreground">base</span>
                                ) : baseVal !== null ? (
                                  <DeltaChip
                                    kind={row.delta}
                                    value={
                                      row.delta === "pct"
                                        ? pctDelta(val, baseVal)
                                        : val - baseVal
                                    }
                                    betterHigher={row.betterHigher}
                                  />
                                ) : null}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        Deltas comparados ao cenário <span className="font-medium text-foreground">
          {computed[baselineIdx]?.scenario.name ?? "base"}
        </span>. Projeção de 12 meses com sazonalidade de São Paulo. Premissas salvas
        automaticamente por projeto.
      </p>
    </section>
  );
}

/** Cabeçalho de coluna: nome editável + badge do preset + excluir. */
function ScenarioHeader({
  scenario, isBaseline, canDelete, onRename, onDelete,
}: {
  scenario: Scenario;
  isBaseline: boolean;
  canDelete: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <Input
          aria-label="Nome do cenário"
          value={scenario.name}
          onChange={(e) => onRename(e.target.value)}
          className="h-8 text-sm font-medium"
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={!canDelete}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="Excluir cenário"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir cenário?</AlertDialogTitle>
              <AlertDialogDescription>
                O cenário <span className="font-medium text-foreground">{scenario.name}</span> será
                removido permanentemente. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="flex items-center gap-1.5">
        {scenario.kind !== "custom" && (
          <Badge variant="secondary" className="text-[10px] capitalize">{scenario.kind}</Badge>
        )}
        {isBaseline && (
          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            Baseline
          </Badge>
        )}
      </div>
    </div>
  );
}

/** Linha de cabeçalho de seção (Premissas / Resultado). */
function SectionRow({ label, span }: { label: string; span: number }) {
  return (
    <tr className="bg-muted/40">
      <td colSpan={span} className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </td>
    </tr>
  );
}

/** Célula numérica editável (premissa). */
function NumberCell({
  value, onChange, prefix, suffix, step,
}: {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step: number;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          {prefix}
        </span>
      )}
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className={`h-8 text-sm tabular-nums ${prefix ? "pl-8" : ""} ${suffix ? "pr-7" : ""}`}
      />
      {suffix && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
