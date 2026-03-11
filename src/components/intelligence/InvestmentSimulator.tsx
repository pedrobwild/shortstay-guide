/**
 * Simulador de Investimento — Calcula custos de aquisição, financiamento,
 * receita líquida e payback para um studio de short stay.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote, Home, Percent, Clock, TrendingUp, Calculator,
  ChevronDown, ChevronUp, AlertTriangle, ArrowRight, Info,
} from "lucide-react";
import type { BairroAirbnb } from "@/types/intelligence";
import { fmtBRL, fmtPct } from "@/hooks/useIntelligenceData";

// ── Acquisition cost structure ──────────────────────────────────
interface AcquisitionCost {
  label: string;
  pct: number;
  note: string;
}

const ACQUISITION_COSTS: AcquisitionCost[] = [
  { label: "ITBI (Imposto de Transmissão)", pct: 3.0, note: "Taxa municipal obrigatória" },
  { label: "Registro de imóvel", pct: 1.0, note: "Cartório de registro" },
  { label: "Escritura pública", pct: 0.5, note: "Tabelionato de notas" },
  { label: "Corretagem", pct: 5.0, note: "Comissão do corretor (se aplicável)" },
  { label: "Decoração e mobília", pct: 0, note: "Investimento em setup" },
];

// ── Operational cost structure (monthly %) ──────────────────────
const OPERATIONAL_COSTS = [
  { label: "Taxa Airbnb (host)", pct: 3, note: "Comissão da plataforma" },
  { label: "Gestão / administração", pct: 20, note: "Operadora ou autogestão" },
  { label: "Impostos (ISS + Simples)", pct: 6, note: "Varia por regime fiscal" },
  { label: "Manutenção e reposição", pct: 5, note: "Limpeza, reparos, enxoval" },
  { label: "Condomínio + IPTU", pct: 8, note: "Custos fixos do imóvel" },
  { label: "Energia + internet", pct: 3, note: "Custos operacionais" },
];

const TOTAL_OPERATIONAL_PCT = OPERATIONAL_COSTS.reduce((s, c) => s + c.pct, 0); // 45%

// ── PMT calculation (Price table — fixed installment) ───────────
function calcPMT(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

interface SimulatorProps {
  bairros: BairroAirbnb[];
  selectedBairro?: BairroAirbnb;
}

export default function InvestmentSimulator({ bairros, selectedBairro }: SimulatorProps) {
  // ── State ──────────────────────────────────────────────────────
  const [purchasePrice, setPurchasePrice] = useState(450_000);
  const [downPaymentPct, setDownPaymentPct] = useState(30);
  const [interestRate, setInterestRate] = useState(10.5);
  const [financingYears, setFinancingYears] = useState(30);
  const [decorationBudget, setDecorationBudget] = useState(25_000);
  const [includeBrokerage, setIncludeBrokerage] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // ── Bairro reference data ─────────────────────────────────────
  const refBairro = selectedBairro || bairros[0];
  const avgADR = refBairro ? Number(refBairro.adr_medio_studio) : 350;
  const avgOcc = refBairro ? Number(refBairro.ocupacao_media_studio) : 0.75;

  // ── Calculated values ─────────────────────────────────────────
  const results = useMemo(() => {
    const downPayment = purchasePrice * (downPaymentPct / 100);
    const financedAmount = purchasePrice - downPayment;
    const financingMonths = financingYears * 12;
    const monthlyPayment = calcPMT(financedAmount, interestRate / 100, financingMonths);

    // Acquisition costs
    const acquisitionLines = ACQUISITION_COSTS.map(c => ({
      ...c,
      pct: c.label.includes("Corretagem") ? (includeBrokerage ? c.pct : 0) : c.label.includes("Decoração") ? 0 : c.pct,
      value: c.label.includes("Corretagem")
        ? (includeBrokerage ? purchasePrice * (c.pct / 100) : 0)
        : c.label.includes("Decoração")
        ? decorationBudget
        : purchasePrice * (c.pct / 100),
    }));
    const totalAcquisitionCosts = acquisitionLines.reduce((s, c) => s + c.value, 0) + decorationBudget;
    const totalInvested = downPayment + totalAcquisitionCosts;
    const totalProjectCost = purchasePrice + totalAcquisitionCosts - (includeBrokerage ? 0 : purchasePrice * 0.05) + decorationBudget;

    // Revenue
    const grossAnnualRevenue = avgADR * avgOcc * 365;
    const grossMonthlyRevenue = grossAnnualRevenue / 12;
    const netMonthlyRevenue = grossMonthlyRevenue * (1 - TOTAL_OPERATIONAL_PCT / 100);
    const netAnnualRevenue = netMonthlyRevenue * 12;

    // Cash flow
    const monthlyCashFlow = netMonthlyRevenue - monthlyPayment;
    const annualCashFlow = monthlyCashFlow * 12;

    // Payback (on total invested = downpayment + acquisition costs + decoration)
    const paybackMonths = netMonthlyRevenue > 0 ? Math.ceil(totalInvested / netMonthlyRevenue) : Infinity;
    const paybackYears = paybackMonths / 12;

    // Yield on invested capital
    const yieldOnCapital = totalInvested > 0 ? netAnnualRevenue / totalInvested : 0;

    // Total cost of financing
    const totalFinancingCost = monthlyPayment * financingMonths;
    const totalInterestPaid = totalFinancingCost - financedAmount;

    return {
      downPayment,
      financedAmount,
      monthlyPayment,
      acquisitionLines,
      totalAcquisitionCosts: totalAcquisitionCosts + decorationBudget,
      totalInvested,
      grossAnnualRevenue,
      grossMonthlyRevenue,
      netMonthlyRevenue,
      netAnnualRevenue,
      monthlyCashFlow,
      annualCashFlow,
      paybackMonths,
      paybackYears,
      yieldOnCapital,
      totalFinancingCost,
      totalInterestPaid,
      financingMonths,
    };
  }, [purchasePrice, downPaymentPct, interestRate, financingYears, decorationBudget, includeBrokerage, avgADR, avgOcc]);

  const isPositiveCashFlow = results.monthlyCashFlow > 0;

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/[0.04] to-transparent">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-[var(--font-display)]">Simulador de Investimento</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Calcule custos, financiamento e payback do seu studio
              {refBairro && <> · Referência: <strong>{refBairro.bairro}</strong></>}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-6">
        {/* ── INPUTS ──────────────────────────────────────── */}
        <div className="space-y-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5" /> Dados do imóvel
          </p>

          {/* Purchase price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Valor de compra</label>
              <span className="text-sm font-bold font-mono">{fmtBRL(purchasePrice)}</span>
            </div>
            <Slider
              value={[purchasePrice]}
              onValueChange={([v]) => setPurchasePrice(v)}
              min={200_000}
              max={1_500_000}
              step={10_000}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>R$ 200k</span><span>R$ 1.5M</span>
            </div>
          </div>

          {/* Down payment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Entrada</label>
              <span className="text-sm font-bold font-mono">
                {downPaymentPct}% · {fmtBRL(purchasePrice * downPaymentPct / 100)}
              </span>
            </div>
            <Slider
              value={[downPaymentPct]}
              onValueChange={([v]) => setDownPaymentPct(v)}
              min={20}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>20%</span><span>100% (à vista)</span>
            </div>
          </div>

          {/* Interest rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Taxa de juros anual</label>
              <span className="text-sm font-bold font-mono">{interestRate.toFixed(1)}% a.a.</span>
            </div>
            <Slider
              value={[interestRate]}
              onValueChange={([v]) => setInterestRate(v)}
              min={7}
              max={15}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>7%</span><span>15%</span>
            </div>
          </div>

          {/* Financing term */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Prazo do financiamento</label>
              <span className="text-sm font-bold font-mono">{financingYears} anos · {financingYears * 12} meses</span>
            </div>
            <Slider
              value={[financingYears]}
              onValueChange={([v]) => setFinancingYears(v)}
              min={5}
              max={35}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>5 anos</span><span>35 anos</span>
            </div>
          </div>

          {/* Decoration budget */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Decoração e mobília</label>
              <span className="text-sm font-bold font-mono">{fmtBRL(decorationBudget)}</span>
            </div>
            <Slider
              value={[decorationBudget]}
              onValueChange={([v]) => setDecorationBudget(v)}
              min={10_000}
              max={80_000}
              step={5_000}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>R$ 10k</span><span>R$ 80k</span>
            </div>
          </div>

          {/* Brokerage toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeBrokerage}
              onChange={(e) => setIncludeBrokerage(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-foreground/80">Incluir corretagem (5%)</span>
          </label>
        </div>

        {/* ── RESULTS ─────────────────────────────────────── */}
        <div className="border-t border-border/50 pt-5 space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ResultCard
              label="Capital investido"
              value={fmtBRL(results.totalInvested)}
              sub="Entrada + custos + decoração"
              icon={<Banknote className="h-4 w-4 text-primary" />}
            />
            <ResultCard
              label="Parcela mensal"
              value={downPaymentPct === 100 ? "À vista" : fmtBRL(results.monthlyPayment)}
              sub={downPaymentPct === 100 ? "Sem financiamento" : `${results.financingMonths} parcelas`}
              icon={<Home className="h-4 w-4 text-primary" />}
            />
            <ResultCard
              label="Receita líquida/mês"
              value={fmtBRL(results.netMonthlyRevenue)}
              sub={`Bruta: ${fmtBRL(results.grossMonthlyRevenue)}`}
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
            />
            <ResultCard
              label="Payback"
              value={results.paybackYears < 50 ? `${results.paybackYears.toFixed(1)} anos` : "—"}
              sub={results.paybackYears < 50 ? `${results.paybackMonths} meses` : "Não calculável"}
              icon={<Clock className="h-4 w-4 text-primary" />}
              highlight
            />
          </div>

          {/* Cash flow indicator */}
          <Card className={`${isPositiveCashFlow ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Fluxo de caixa mensal {downPaymentPct < 100 ? "(após parcela)" : "(sem financiamento)"}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${isPositiveCashFlow ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {isPositiveCashFlow ? "+" : ""}{fmtBRL(results.monthlyCashFlow)}
                  </p>
                </div>
                <Badge className={`text-xs ${isPositiveCashFlow ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                  {isPositiveCashFlow ? "Cash flow positivo" : "Cash flow negativo"}
                </Badge>
              </div>
              {!isPositiveCashFlow && downPaymentPct < 100 && (
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-2">
                  A parcela do financiamento supera a receita líquida. Considere aumentar a entrada ou buscar taxa menor.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Yield on capital */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/40">
              <p className="text-[10px] text-muted-foreground uppercase">Yield sobre capital</p>
              <p className="text-lg font-bold text-primary">{(results.yieldOnCapital * 100).toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground">ao ano</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/40">
              <p className="text-[10px] text-muted-foreground uppercase">Receita anual líq.</p>
              <p className="text-lg font-bold">{fmtBRL(results.netAnnualRevenue)}</p>
              <p className="text-[10px] text-muted-foreground">{TOTAL_OPERATIONAL_PCT}% de custo operacional</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/40">
              <p className="text-[10px] text-muted-foreground uppercase">Juros totais</p>
              <p className="text-lg font-bold">{downPaymentPct === 100 ? "—" : fmtBRL(results.totalInterestPaid)}</p>
              <p className="text-[10px] text-muted-foreground">{downPaymentPct === 100 ? "À vista" : `em ${financingYears} anos`}</p>
            </div>
          </div>

          {/* ── Detailed breakdown (expandable) ────────────── */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showDetails ? "Ocultar" : "Ver"} detalhamento completo
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden space-y-4"
              >
                {/* Acquisition costs */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Custos de aquisição
                  </p>
                  <div className="space-y-0">
                    {results.acquisitionLines.map((line, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-3 text-sm rounded-md hover:bg-muted/30">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground/80">{line.label}</span>
                          <span className="text-[10px] text-muted-foreground hidden sm:inline">· {line.note}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {line.pct > 0 && <span className="text-[10px] text-muted-foreground">{line.pct}%</span>}
                          <span className="font-mono text-xs">{fmtBRL(line.value)}</span>
                        </div>
                      </div>
                    ))}
                    {/* Decoration line */}
                    <div className="flex items-center justify-between py-1.5 px-3 text-sm rounded-md hover:bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/80">Decoração e mobília</span>
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">· Setup do studio</span>
                      </div>
                      <span className="font-mono text-xs">{fmtBRL(decorationBudget)}</span>
                    </div>
                    <div className="border-t border-dashed border-border/50 mt-1 pt-1">
                      <div className="flex items-center justify-between py-1.5 px-3 text-sm font-semibold">
                        <span>Total custos de aquisição</span>
                        <span className="font-mono">{fmtBRL(results.totalAcquisitionCosts)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operational costs (monthly) */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Custos operacionais (% da receita bruta)
                  </p>
                  <div className="space-y-0">
                    {OPERATIONAL_COSTS.map((cost, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-3 text-sm rounded-md hover:bg-muted/30">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs w-10 text-right text-red-500">−{cost.pct}%</span>
                          <span className="text-foreground/80">{cost.label}</span>
                        </div>
                        <span className="font-mono text-xs text-red-500">
                          −{fmtBRL(results.grossMonthlyRevenue * cost.pct / 100)}/mês
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-dashed border-border/50 mt-1 pt-1">
                      <div className="flex items-center justify-between py-1.5 px-3 text-sm font-semibold">
                        <span>Total deduções: {TOTAL_OPERATIONAL_PCT}%</span>
                        <span className="font-mono text-red-500">
                          −{fmtBRL(results.grossMonthlyRevenue * TOTAL_OPERATIONAL_PCT / 100)}/mês
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financing summary */}
                {downPaymentPct < 100 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Financiamento
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2.5 rounded-lg bg-muted/30">
                        <p className="text-[10px] text-muted-foreground">Valor financiado</p>
                        <p className="font-bold">{fmtBRL(results.financedAmount)}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/30">
                        <p className="text-[10px] text-muted-foreground">Total pago ao banco</p>
                        <p className="font-bold">{fmtBRL(results.totalFinancingCost)}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/30">
                        <p className="text-[10px] text-muted-foreground">Total juros pagos</p>
                        <p className="font-bold text-amber-600 dark:text-amber-400">{fmtBRL(results.totalInterestPaid)}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/30">
                        <p className="text-[10px] text-muted-foreground">Parcela mensal (Price)</p>
                        <p className="font-bold">{fmtBRL(results.monthlyPayment)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reference data */}
          {refBairro && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
              <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Receita baseada nos dados de <strong>{refBairro.bairro}</strong>: diária média {fmtBRL(avgADR)}, 
                ocupação {fmtPct(avgOcc)}. Custos operacionais estimados em {TOTAL_OPERATIONAL_PCT}% da receita bruta. 
                Valores são ilustrativos e podem variar.
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.03]">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-foreground/60 leading-relaxed">
              Simulação ilustrativa. Não constitui recomendação de investimento. Consulte um profissional 
              qualificado antes de tomar decisões financeiras. Taxas, custos e receitas reais podem variar significativamente.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Small result card ───────────────────────────────────────────
function ResultCard({ label, value, sub, icon, highlight }: {
  label: string; value: string; sub: string; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg border ${highlight ? "bg-primary/[0.04] border-primary/20" : "bg-muted/30 border-border/30"}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      </div>
      <p className={`text-base font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
