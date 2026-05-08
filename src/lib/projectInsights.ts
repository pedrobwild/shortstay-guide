/**
 * Geração de insights e recomendações executivas a partir das análises do projeto.
 * Funções puras, sem dependências de React ou Supabase.
 */
import type {
  ProjectKpis, MonthlyOccupancy, ForwardWindowOccupancy,
  SeasonalityMonth, YoYMonth, BookingPatterns, BreakEvenAnalysis,
  InvestmentReturn, WeekendSplit, VacancyGap,
} from "./projectAnalytics";

export type InsightTone = "positive" | "negative" | "warning" | "info";

export interface Insight {
  tone: InsightTone;
  title: string;
  detail: string;
  weight: number;            // 0-100, prioridade para ordenação
}

export interface DashboardSummary {
  highlights: Insight[];
  recommendations: Insight[];
  trendLabel: string;        // "Em crescimento" / "Estável" / "Em queda"
  trendTone: InsightTone;
  healthScore: number;       // 0-100 — saúde geral da operação
}

interface SummaryInput {
  kpis: ProjectKpis;
  monthly: MonthlyOccupancy[];
  otb30: ForwardWindowOccupancy;
  otb60: ForwardWindowOccupancy;
  seasonality: SeasonalityMonth[];
  yoy: YoYMonth[];
  patterns: BookingPatterns;
  breakEven: BreakEvenAnalysis;
  returns: InvestmentReturn;
  weekendSplit: WeekendSplit;
  longestGap: VacancyGap | null;
  netMarginPct: number;
  netRevenueBrl: number;
  hasPropertyValue: boolean;
}

const fmtBrl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

/**
 * Gera resumo executivo: insights priorizados, recomendações e health score.
 */
export function generateDashboardSummary(input: SummaryInput): DashboardSummary {
  const insights: Insight[] = [];
  const recommendations: Insight[] = [];

  // ─── OTB 30 dias ────────────────────────────────────────────────
  if (input.otb30.bookedPct < 30) {
    insights.push({
      tone: "warning",
      title: `OTB 30d em ${input.otb30.bookedPct.toFixed(0)}%`,
      detail: `Apenas ${input.otb30.bookedNights} de 30 noites já reservadas para o próximo mês.`,
      weight: 90,
    });
    recommendations.push({
      tone: "warning",
      title: "Ative ofertas de last-minute",
      detail: "Reduza ADR em 10-15% para os próximos 14 dias e/ou abra estadia mínima de 1 noite.",
      weight: 90,
    });
  } else if (input.otb30.bookedPct >= 70) {
    insights.push({
      tone: "positive",
      title: `OTB 30d forte (${input.otb30.bookedPct.toFixed(0)}%)`,
      detail: `${input.otb30.bookedNights} noites reservadas — receita projetada ${fmtBrl(input.otb30.estimatedRevenueBrl)}.`,
      weight: 70,
    });
    recommendations.push({
      tone: "positive",
      title: "Suba o ADR para datas remanescentes",
      detail: "Demanda alta — testar +8% nos dias ainda disponíveis nos próximos 30 dias.",
      weight: 70,
    });
  }

  // ─── Break-even ─────────────────────────────────────────────────
  if (input.breakEven.marginVsBreakEvenPct < 0) {
    insights.push({
      tone: "negative",
      title: "Operação abaixo do break-even",
      detail: `Faltam ${Math.abs(input.breakEven.marginVsBreakEvenPct).toFixed(1)}pp para cobrir os custos fixos mensais.`,
      weight: 100,
    });
    recommendations.push({
      tone: "negative",
      title: "Reveja custos fixos ou aumente ocupação",
      detail: `Meta: chegar a ${input.breakEven.breakEvenOccupancyPct.toFixed(0)}% de ocupação ou reduzir condomínio/gestão.`,
      weight: 100,
    });
  } else if (input.breakEven.marginVsBreakEvenPct >= 15) {
    insights.push({
      tone: "positive",
      title: "Operação saudável",
      detail: `+${input.breakEven.marginVsBreakEvenPct.toFixed(1)}pp acima do break-even — caixa sobrando.`,
      weight: 60,
    });
  }

  // ─── YoY (mais recente) ─────────────────────────────────────────
  if (input.yoy.length > 0) {
    const recent = input.yoy[input.yoy.length - 1];
    if (recent.revenueDeltaPct >= 10) {
      insights.push({
        tone: "positive",
        title: `${recent.monthLabel}: receita +${recent.revenueDeltaPct.toFixed(0)}% YoY`,
        detail: `${fmtBrl(recent.currentRevenueBrl)} vs. ${fmtBrl(recent.previousRevenueBrl)} no mesmo mês ano passado.`,
        weight: 80,
      });
    } else if (recent.revenueDeltaPct <= -10) {
      insights.push({
        tone: "negative",
        title: `${recent.monthLabel}: receita ${recent.revenueDeltaPct.toFixed(0)}% YoY`,
        detail: `Queda relevante vs. ${fmtBrl(recent.previousRevenueBrl)} no mesmo mês ano passado.`,
        weight: 85,
      });
      recommendations.push({
        tone: "negative",
        title: "Investigue queda YoY",
        detail: `Compare ADR, fotos do anúncio e disponibilidade vs. ${recent.monthLabel} do ano anterior.`,
        weight: 80,
      });
    }
  }

  // ─── Sazonalidade ───────────────────────────────────────────────
  if (input.seasonality.length >= 3) {
    const best = input.seasonality.reduce((a, b) => (a.index > b.index ? a : b));
    const worst = input.seasonality.reduce((a, b) => (a.index < b.index ? a : b));
    insights.push({
      tone: "info",
      title: `Pico ${best.monthLabel} · Vale ${worst.monthLabel}`,
      detail: `${best.monthLabel} ${(best.index).toFixed(2)}x média · ${worst.monthLabel} ${(worst.index).toFixed(2)}x média.`,
      weight: 50,
    });
    if (worst.index < 0.6) {
      recommendations.push({
        tone: "info",
        title: `Foque marketing em ${worst.monthLabel}`,
        detail: `Mês historicamente fraco — campanhas de longa estadia, parcerias locais ou desconto agressivo.`,
        weight: 55,
      });
    }
  }

  // ─── Padrões de reserva ─────────────────────────────────────────
  if (input.patterns.backToBackRatePct >= 30) {
    insights.push({
      tone: "info",
      title: `Back-to-back em ${input.patterns.backToBackRatePct.toFixed(0)}% das transições`,
      detail: "Operação puxada — equipe de limpeza precisa de janela apertada.",
      weight: 45,
    });
    recommendations.push({
      tone: "warning",
      title: "Garanta protocolo de check-in/out",
      detail: "Defina janela mínima de 4h entre saída e entrada e tenha um plano B de limpeza.",
      weight: 50,
    });
  }
  if (input.patterns.blockRatePct >= 20) {
    insights.push({
      tone: "warning",
      title: `${input.patterns.blockRatePct.toFixed(0)}% das noites bloqueadas`,
      detail: "Alto índice de bloqueios reduz noites disponíveis e receita.",
      weight: 60,
    });
  }

  // ─── Vacâncias longas ───────────────────────────────────────────
  if (input.longestGap && input.longestGap.nights >= 7) {
    insights.push({
      tone: "warning",
      title: `Vacância de ${input.longestGap.nights} noites detectada`,
      detail: "Janela longa de noites vagas — oportunidade para estadia média.",
      weight: 55,
    });
    recommendations.push({
      tone: "info",
      title: "Ofereça desconto progressivo para 7+ noites",
      detail: "Faixas: 7+ com 10% off, 14+ com 15% off para ocupar gaps.",
      weight: 60,
    });
  }

  // ─── Weekend skew ───────────────────────────────────────────────
  const weekendOcc = input.weekendSplit.weekendOccupancyPct;
  const weekdayOcc = input.weekendSplit.weekdayOccupancyPct;
  const totalAvail = input.weekendSplit.weekendNights + input.weekendSplit.weekdayNights;
  if (totalAvail > 0 && weekendOcc - weekdayOcc >= 25) {
    insights.push({
      tone: "info",
      title: "Forte concentração em fim de semana",
      detail: `Ocupação fim de semana ${weekendOcc.toFixed(0)}% vs. semana ${weekdayOcc.toFixed(0)}%.`,
      weight: 40,
    });
    recommendations.push({
      tone: "info",
      title: "Crie pacote dia de semana",
      detail: "Desconto de 15% para entrada Dom/Seg/Ter — abre estadias mais longas.",
      weight: 45,
    });
  }

  // ─── Cap rate / payback ─────────────────────────────────────────
  if (input.hasPropertyValue) {
    if (input.returns.capRatePct >= 8) {
      insights.push({
        tone: "positive",
        title: `Cap rate ${input.returns.capRatePct.toFixed(2)}%`,
        detail: `Yield líquido acima do CDI — ${fmtBrl(input.returns.annualizedNetRevenueBrl)} anuais sobre ${fmtBrl(input.returns.propertyValueBrl)}.`,
        weight: 75,
      });
    } else if (input.returns.capRatePct < 4 && input.returns.capRatePct > 0) {
      insights.push({
        tone: "warning",
        title: `Cap rate baixo (${input.returns.capRatePct.toFixed(2)}%)`,
        detail: "Yield líquido abaixo da renda fixa — revise diária, custos ou valor de aquisição.",
        weight: 75,
      });
      recommendations.push({
        tone: "warning",
        title: "Reavalie estratégia de pricing",
        detail: "Teste +10% no ADR e revise gestão/condomínio. Compare com listings semelhantes do bairro.",
        weight: 70,
      });
    }
  }

  // ─── ADR baseline ───────────────────────────────────────────────
  const effectiveAdr = input.kpis.bookedNights > 0
    ? input.kpis.estimatedRevenueBrl / input.kpis.bookedNights
    : 0;
  if (effectiveAdr > 0) {
    insights.push({
      tone: "info",
      title: `ADR efetivo ${fmtBrl(effectiveAdr)}`,
      detail: `Margem líquida ${input.netMarginPct.toFixed(0)}% — receita líquida total ${fmtBrl(input.netRevenueBrl)}.`,
      weight: 30,
    });
  }

  // ─── Health score ───────────────────────────────────────────────
  // Composto: ocupação (40%), margem vs BE (30%), OTB 30d (20%), capRate (10%, se houver)
  const occScore = Math.min(100, input.kpis.occupancyPct);
  const beScore = Math.max(0, Math.min(100, 50 + input.breakEven.marginVsBreakEvenPct * 2));
  const otbScore = Math.min(100, input.otb30.bookedPct + 20);
  const capScore = input.hasPropertyValue
    ? Math.max(0, Math.min(100, input.returns.capRatePct * 12))
    : null;
  const healthScore = capScore !== null
    ? occScore * 0.35 + beScore * 0.3 + otbScore * 0.2 + capScore * 0.15
    : occScore * 0.4 + beScore * 0.35 + otbScore * 0.25;

  // ─── Trend ──────────────────────────────────────────────────────
  let trendLabel = "Operação estável";
  let trendTone: InsightTone = "info";
  if (input.monthly.length >= 3) {
    const recent = input.monthly.slice(-3);
    const trendDelta = recent[2].occupancyPct - recent[0].occupancyPct;
    if (trendDelta >= 5) {
      trendLabel = "Em crescimento";
      trendTone = "positive";
    } else if (trendDelta <= -5) {
      trendLabel = "Em desaceleração";
      trendTone = "negative";
    }
  }

  insights.sort((a, b) => b.weight - a.weight);
  recommendations.sort((a, b) => b.weight - a.weight);

  return {
    highlights: insights.slice(0, 5),
    recommendations: recommendations.slice(0, 3),
    trendLabel,
    trendTone,
    healthScore: Math.round(healthScore),
  };
}
