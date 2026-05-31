import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  GitCompareArrows, MapPin, Ruler, Hammer, User, Sparkles, ArrowRight,
  TrendingUp, Wallet, Percent, CalendarClock, Check, Minus,
} from "lucide-react";
import { useBairroData } from "@/hooks/useBairroData";
import type { BairroItem } from "@/data/guide-data";
import {
  buildBwildVsDiyComparison,
  BWILD_VS_DIY_ASSUMPTIONS,
  type ScenarioResult,
} from "@/lib/bwildComparison";
import { trackGlobal } from "@/hooks/useGuideAnalytics";

type SizeKey = keyof BairroItem["avgBySize"];
const SIZE_KEYS: SizeKey[] = ["20–25 m²", "26–35 m²", "36–50 m²"];

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

/**
 * Comparativo lado a lado "fazer sozinho (DIY) vs. com a BWild" do MESMO studio.
 *
 * Ancora o valor da reforma no ROI: dois cenários partindo da base de mercado do
 * bairro/faixa de área, com multiplicadores documentados em
 * `BWILD_VS_DIY_ASSUMPTIONS`. Destaca o delta de receita líquida anual e o
 * payback mais curto — o argumento de fechamento mais concreto.
 *
 * Acessibilidade: nunca usa cor como ÚNICO indicador — cada coluna tem rótulo +
 * ícone, o vencedor de cada métrica recebe um "✓ melhor" textual, e o delta é
 * sempre acompanhado de sinal (+) e rótulo. Empilha no mobile.
 */
export default function BwildVsDiySection() {
  const { bairros } = useBairroData();
  const [bairroName, setBairroName] = useState<string>("");
  const [sizeKey, setSizeKey] = useState<SizeKey>("26–35 m²");
  const [propertyValue, setPropertyValue] = useState<number>(0);

  const selectedBairro = useMemo<BairroItem | undefined>(
    () => bairros.find((b) => b.name === bairroName) ?? bairros[0],
    [bairros, bairroName],
  );

  const comparison = useMemo(() => {
    if (!selectedBairro) return null;
    return buildBwildVsDiyComparison({
      baseAdr: selectedBairro.avgBySize[sizeKey],
      baseOccupancyPct: selectedBairro.avgOccupancy,
      propertyValue,
    });
  }, [selectedBairro, sizeKey, propertyValue]);

  if (!selectedBairro || !comparison) return null;

  const { diy, bwild, delta } = comparison;

  return (
    <section className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <GitCompareArrows className="h-4 w-4 text-primary" />
          Fazer sozinho vs. com a BWild
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          O mesmo studio, dois cenários: à esquerda, anunciado por conta própria, sem reforma
          profissional. À direita, reformado, decorado e operado pela BWild. Veja quanto a mais o
          imóvel rende — já descontada a taxa de gestão.
        </p>
      </div>

      {/* Inputs */}
      <Card className="border-primary/15 bg-primary/[0.02]">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Bairro
              </Label>
              <Select value={selectedBairro.name} onValueChange={setBairroName}>
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
              <Select value={sizeKey} onValueChange={(v) => setSizeKey(v as SizeKey)}>
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
            <div className="space-y-1">
              <Label htmlFor="bwild-diy-property-value" className="text-[11px] text-muted-foreground">
                Valor do imóvel (opcional)
              </Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  R$
                </span>
                <Input
                  id="bwild-diy-property-value"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={10000}
                  value={propertyValue}
                  onChange={(e) => setPropertyValue(Math.max(0, Number(e.target.value) || 0))}
                  className="h-9 text-sm pl-8"
                />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Base de mercado do bairro/faixa: {selectedBairro.avgOccupancy}% de ocupação ·{" "}
            {brl(selectedBairro.avgBySize[sizeKey])}/noite. Informe o valor do imóvel para ver o
            payback de cada cenário.
          </p>
        </CardContent>
      </Card>

      {/* Duas colunas: DIY vs BWild */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScenarioColumn
          scenario={diy}
          variant="diy"
          icon={<User className="h-4 w-4" />}
          subtitle="Sem reforma profissional · auto-gestão"
          comparison={comparison}
        />
        <ScenarioColumn
          scenario={bwild}
          variant="bwild"
          icon={<Hammer className="h-4 w-4" />}
          subtitle={`Reforma + decoração + operação · gestão ${bwild.managementPct}%`}
          comparison={comparison}
        />
      </div>

      {/* Delta em destaque */}
      <Card className="border-primary/40 bg-primary/[0.05]">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              O que a BWild adiciona — por ano
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DeltaCard
              icon={<Wallet className="h-4 w-4" />}
              label="Receita líquida incremental"
              value={`+${brl(delta.netRevenueBrl)}`}
              hint={delta.netRevenueUpliftPct > 0
                ? `+${delta.netRevenueUpliftPct.toFixed(0)}% vs. fazer sozinho`
                : "no período de 12 meses"}
              emphasis
            />
            <DeltaCard
              icon={<Percent className="h-4 w-4" />}
              label="Ocupação adicional"
              value={`+${delta.occupancyPctPoints.toFixed(1)} pp`}
              hint={`+${brl(delta.adrBrl)} na diária média`}
            />
            <DeltaCard
              icon={<CalendarClock className="h-4 w-4" />}
              label="Payback mais curto"
              value={
                delta.paybackYearsShorter !== null
                  ? `−${Math.abs(delta.paybackYearsShorter).toFixed(1)} anos`
                  : "—"
              }
              hint={
                delta.paybackYearsShorter !== null
                  ? `${bwild.paybackYears?.toFixed(1)} anos vs. ${diy.paybackYears?.toFixed(1)} anos`
                  : "Informe o valor do imóvel"
              }
            />
          </div>

          {/* CTA contextual */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground max-w-md">
              Premissas conservadoras baseadas em dados de mercado e cases da BWild
              (ocupação +{((BWILD_VS_DIY_ASSUMPTIONS.bwild.occupancyMultiplier / BWILD_VS_DIY_ASSUMPTIONS.diy.occupancyMultiplier - 1) * 100).toFixed(0)}% e diária premium por reforma/decoração).
            </p>
            <Button
              asChild
              className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
              onClick={() => trackGlobal("cta_clicked", {
                cta_id: "bwild_vs_diy",
                bairro: selectedBairro.name,
                net_uplift_brl: Math.round(delta.netRevenueBrl),
              })}
            >
              <Link to="/#cta-final" className="gap-1.5">
                Quero esse cenário — falar com a BWild
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ScenarioColumn({
  scenario, variant, icon, subtitle, comparison,
}: {
  scenario: ScenarioResult;
  variant: "diy" | "bwild";
  icon: React.ReactNode;
  subtitle: string;
  comparison: ReturnType<typeof buildBwildVsDiyComparison>;
}) {
  const isBwild = variant === "bwild";
  const other = isBwild ? comparison.diy : comparison.bwild;

  // Métricas alinhadas entre as duas colunas (mesma ordem dos dois lados).
  const rows: { key: string; label: string; value: string; raw: number }[] = [
    { key: "occ", label: "Ocupação", value: `${scenario.occupancyPct.toFixed(1)}%`, raw: scenario.occupancyPct },
    { key: "adr", label: "Diária média", value: brl(scenario.adr), raw: scenario.adr },
    { key: "gross", label: "Receita bruta / ano", value: brl(scenario.grossRevenueBrl), raw: scenario.grossRevenueBrl },
    { key: "net", label: "Receita líquida / ano", value: brl(scenario.netRevenueBrl), raw: scenario.netRevenueBrl },
    { key: "margin", label: "Margem líquida", value: `${scenario.netMarginPct.toFixed(0)}%`, raw: scenario.netMarginPct },
    {
      key: "payback",
      label: "Payback",
      value: scenario.paybackYears !== null ? `${scenario.paybackYears.toFixed(1)} anos` : "—",
      // payback: menor é melhor → invertemos o sinal para o cálculo de "vencedor"
      raw: scenario.paybackYears !== null ? -scenario.paybackYears : -Infinity,
    },
  ];

  const otherRaw: Record<string, number> = {
    occ: other.occupancyPct,
    adr: other.adr,
    gross: other.grossRevenueBrl,
    net: other.netRevenueBrl,
    margin: other.netMarginPct,
    payback: other.paybackYears !== null ? -other.paybackYears : -Infinity,
  };

  return (
    <Card
      className={isBwild
        ? "border-primary/40 bg-primary/[0.04]"
        : "border-border"}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={isBwild ? "text-primary" : "text-muted-foreground"}>{icon}</span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{scenario.label}</h3>
              <p className="text-[11px] text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <Badge
            variant={isBwild ? "default" : "outline"}
            className="text-[10px] shrink-0"
          >
            {isBwild ? "Recomendado" : "Referência"}
          </Badge>
        </div>

        <div className="divide-y divide-border/60">
          {rows.map((r) => {
            const isWinner = r.raw > otherRaw[r.key];
            return (
              <div key={r.key} className="flex items-center justify-between gap-2 py-2">
                <span className="text-xs text-muted-foreground">{r.label}</span>
                <span className="flex items-center gap-1.5">
                  <span className={`text-sm font-medium ${isBwild ? "text-foreground" : "text-foreground/90"}`}>
                    {r.value}
                  </span>
                  {/* Indicador textual + ícone (não depende de cor) */}
                  {isWinner ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary">
                      <Check className="h-3 w-3" /> melhor
                    </span>
                  ) : (
                    <Minus className="h-3 w-3 text-muted-foreground/40" aria-label="menor" />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaCard({
  icon, label, value, hint, emphasis,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 space-y-1 ${emphasis ? "border-primary/40 bg-background" : "border-border bg-background/60"}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <p className={`text-lg font-bold ${emphasis ? "text-primary" : "text-foreground"} flex items-center gap-1`}>
        <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
