/**
 * Journey Step Components — 7 steps of the guided decision journey
 * Each step is a self-contained component that builds on the previous one.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2, TrendingUp, BarChart3, Target, Scale, Crown, Rocket, Activity,
  Zap, BookOpen, Lightbulb, ChevronRight, ArrowRight, Shield, CalendarCheck,
  ArrowUpRight, Sprout, Gauge, AlertTriangle, CheckCircle, Banknote, Sparkles,
  Info, Star, ChevronDown, ChevronUp, FlaskConical, Eye, EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import type { BairroAirbnb } from "@/types/intelligence";
import { PRODUCT, DATA_COMMUNICATION, DISCLAIMERS } from "@/lib/productFoundation";
import {
  getHighlightWinners,
  getBairroProfile,
  INDICATOR_EXPLAINERS,
  SECTION_MICROCOPY,
} from "@/lib/intelligenceInsights";
import { calculateAllScores, calculateInvestmentScore, calculateTrueYield, PILLARS } from "@/lib/investmentScore";
import { getGradeStyle, FOOTER_DISCLAIMER } from "@/lib/uiHelpers";
import {
  STRATEGIC_LESSONS,
  generateComparativeNarratives,
} from "@/lib/storytelling";
import {
  QUIZ_QUESTIONS,
  resolveProfile,
  generateRecommendations,
  type QuizAnswers,
  type InvestorProfile,
  type Recommendation,
} from "@/lib/investorQuiz";
import { fmtBRL, fmtPct, fmtScore } from "@/hooks/useIntelligenceData";

const ICON_MAP: Record<string, React.ElementType> = {
  Scale, Crown, Rocket, Activity, TrendingUp, AlertTriangle, Shield,
  CalendarCheck, ArrowUpRight, Sprout, Gauge, Zap, Banknote, Sparkles,
  DollarSign: Banknote, Target, BookOpen,
};

const stagger = (i: number, base = 0) => ({ delay: base + i * 0.06 });

// ═══════════════════════════════════════════════════════════════════
// STEP 1: CONTEXTUALIZAR
// ═══════════════════════════════════════════════════════════════════

export const Step1Context = ({ bairros, onNext }: { bairros: BairroAirbnb[]; onNext: () => void }) => {
  const avgADR = bairros.reduce((s, b) => s + Number(b.adr_medio_studio), 0) / bairros.length;
  const avgOcc = bairros.reduce((s, b) => s + Number(b.ocupacao_media_studio), 0) / bairros.length;
  const avgYield = bairros.reduce((s, b) => s + Number(b.yield_bruto_airbnb), 0) / bairros.length;
  const avgDelta = bairros.reduce((s, b) => s + Number(b.delta_yield), 0) / bairros.length;

  const BENEFITS = [
    { icon: BarChart3, text: "Entender quais bairros parecem mais atrativos para short stay" },
    { icon: Scale, text: "Comparar retorno e risco lado a lado, sem achismo" },
    { icon: Target, text: "Enxergar onde há melhor equilíbrio entre demanda, ocupação e rentabilidade" },
    { icon: TrendingUp, text: "Avaliar se o Airbnb supera o aluguel tradicional no bairro escolhido" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero opening */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.04] rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-primary/10 text-primary text-[10px] uppercase tracking-wider">
                Guia de investimento
              </Badge>
              <Badge className="bg-muted text-muted-foreground text-[10px]">
                {bairros.length} bairros · 30+ variáveis
              </Badge>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-[var(--font-display)] text-foreground mb-3 leading-tight">
              Análise estratégica de bairros para<br className="hidden md:block" /> investimento em short stay
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4 max-w-2xl">
              Esta ferramenta ajuda você a comparar bairros de São Paulo para investimento em short stay. 
              Em vez de olhar só diária ou só retorno, ela combina <strong>demanda, rentabilidade, liquidez 
              e potencial futuro</strong> para apoiar sua decisão.
            </p>
            <p className="text-sm text-foreground/60 leading-relaxed max-w-2xl">
              Não é apenas uma tabela de dados — é uma <strong>leitura estratégica do mercado</strong>, 
              construída para transformar números complexos em uma jornada clara de decisão.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Como esta análise ajuda você */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={stagger(1)}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Como esta análise ajuda você
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BENEFITS.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={stagger(i, 0.1)}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{b.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* O que é short stay */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={stagger(2)}>
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">O que é short stay?</p>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Em vez de alugar um apartamento por 12 meses para um inquilino, você opera como um 
                  hotel boutique: diárias por noite, em plataformas como Airbnb. O retorno pode ser 
                  significativamente maior — mas o risco e a operação também são diferentes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Market pulse */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={stagger(3)}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          📊 Pulso do mercado — São Paulo
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Diária média", value: fmtBRL(avgADR), sub: "por noite" },
            { label: "Ocupação média", value: fmtPct(avgOcc), sub: "dos dias" },
            { label: "Retorno médio", value: fmtPct(avgYield), sub: "ao ano (Airbnb)" },
            { label: "Prêmio short stay", value: `+${fmtPct(avgDelta)}`, sub: "vs aluguel comum" },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(i, 0.15)}>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{kpi.label}</p>
                  <p className="text-xl font-bold mt-1">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Key narrative */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(4)}>
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">O que você precisa saber antes de começar</p>
                {DATA_COMMUNICATION.narratives.slice(0, 3).map((n, i) => (
                  <p key={i} className="text-xs text-foreground/70 leading-relaxed flex items-start gap-2">
                    <span className="text-primary mt-0.5">→</span> {n}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={stagger(5)} className="flex justify-end">
        <Button onClick={onNext} size="lg" className="gap-2">
          Entendi, vamos começar <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// STEP 2: DESTAQUES
// ═══════════════════════════════════════════════════════════════════

export const Step2Highlights = ({ bairros, onNext }: { bairros: BairroAirbnb[]; onNext: () => void }) => {
  const highlights = getHighlightWinners(bairros);
  const narratives = generateComparativeNarratives(bairros);

  const NARRATIVE_STYLE: Record<string, { border: string; bg: string; icon: React.ElementType }> = {
    insight: { border: "border-l-primary", bg: "bg-primary/[0.03]", icon: Lightbulb },
    comparison: { border: "border-l-blue-500", bg: "bg-blue-500/[0.04]", icon: BarChart3 },
    caution: { border: "border-l-amber-500", bg: "bg-amber-500/[0.04]", icon: AlertTriangle },
  };

  // Map category icons with distinct accent colors for visual triaging
  const CATEGORY_ACCENT: Record<string, string> = {
    "Melhor equilíbrio": "border-l-primary",
    "Bairro premium": "border-l-violet-500",
    "Maior retorno": "border-l-emerald-500",
    "Maior ocupação": "border-l-blue-500",
    "Crescimento consistente": "border-l-amber-500",
    "Alerta de risco": "border-l-red-400",
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-[var(--font-display)]">Resumo executivo</h2>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-2">
              Antes de mergulhar nos números, veja os destaques que a análise identificou automaticamente. 
              Cada bairro tem uma vocação diferente — <strong>o melhor investimento depende do seu perfil</strong>.
            </p>
            <p className="text-xs text-foreground/60 leading-relaxed">
              Esses cards funcionam como uma triagem: ajudam a focar nas oportunidades mais relevantes 
              antes de entrar nos detalhes.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Highlight winner cards */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(1)}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          🏅 Destaques por categoria
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {highlights.map((h, i) => {
            const Icon = ICON_MAP[h.icon] || TrendingUp;
            const accent = Object.entries(CATEGORY_ACCENT).find(([k]) =>
              h.category.toLowerCase().includes(k.toLowerCase())
            )?.[1] || "border-l-primary";
            return (
              <motion.div key={h.category} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(i, 0.08)}>
                <Card className={`h-full hover:shadow-md transition-all group border-l-4 ${accent}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{h.category}</span>
                    </div>
                    <p className="font-bold text-base text-foreground">{h.bairro}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{h.value}</p>
                    <p className="text-xs text-foreground/70 mt-2 leading-relaxed">{h.narrative}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Leitura rápida do mercado */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(2)}>
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Leitura rápida do mercado</p>
                <p className="text-xs text-foreground/60">O que os dados estão dizendo, em linguagem simples.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-primary/[0.04] border border-primary/10">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  <strong className="text-primary">Nem sempre o bairro com diária mais alta é o melhor investimento.</strong>{" "}
                  Os melhores resultados costumam aparecer onde existe equilíbrio entre diária, 
                  ocupação, liquidez e potencial futuro.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { icon: Scale, text: "Bairros equilibrados tendem a performar melhor no longo prazo do que os extremos." },
                  { icon: Shield, text: "Alta diária com baixa ocupação é um risco comum — retorno depende de volume." },
                  { icon: Sprout, text: "Bairros em crescimento podem oferecer entrada mais acessível com upside futuro." },
                  { icon: AlertTriangle, text: "Retorno alto com dados de baixa confiança merece investigação antes da decisão." },
                ].map((item, i) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40">
                      <ItemIcon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <p className="text-[11px] text-foreground/70 leading-relaxed">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* O que os dados revelam — narrativas comparativas */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(3)}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          💡 O que os dados revelam
        </p>
        <div className="space-y-2">
          {narratives.slice(0, 4).map((n, i) => {
            const style = NARRATIVE_STYLE[n.type] || NARRATIVE_STYLE.insight;
            const NIcon = style.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={stagger(i, 0.3)}
                className={`p-3 rounded-lg border-l-4 ${style.border} ${style.bg}`}
              >
                <div className="flex items-start gap-2">
                  <NIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80 leading-relaxed">{n.text}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={stagger(4)} className="flex justify-end">
        <Button onClick={onNext} className="gap-2">
          Agora quero entender os indicadores <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// STEP 3: APRENDA A LER
// ═══════════════════════════════════════════════════════════════════

interface IndicatorCard {
  key: string;
  friendlyName: string;
  technicalName: string;
  explanation: string;
  whyItMatters: string;
  example: string;
  takeaway: string;
  icon: React.ElementType;
}

const STEP3_INDICATORS: IndicatorCard[] = [
  {
    key: "adr",
    friendlyName: "Preço médio da diária",
    technicalName: "ADR",
    explanation: "Mostra quanto, em média, um imóvel consegue cobrar por noite naquele bairro.",
    whyItMatters: "Uma diária mais alta gera mais receita por reserva — mas não garante, sozinha, que o investimento será bom. Se a ocupação for baixa, poucas noites serão vendidas.",
    example: "Pinheiros pode cobrar R$350/noite enquanto Bela Vista cobra R$240. Mas se Bela Vista tiver muito mais noites ocupadas, o retorno final pode ser maior.",
    takeaway: "Diária mais alta ajuda, mas não decide sozinha.",
    icon: Banknote,
  },
  {
    key: "ocupacao",
    friendlyName: "Percentual de dias alugados",
    technicalName: "Ocupação",
    explanation: "Mostra quantos dias, em média, o imóvel fica efetivamente ocupado com hóspedes.",
    whyItMatters: "Imóvel vazio não gera receita. Quanto maior a ocupação, mais constante o fluxo de dinheiro e menor o risco de ficar com dias ociosos.",
    example: "75% de ocupação significa cerca de 22 dias ocupados por mês — cada dia é receita no bolso.",
    takeaway: "Acima de 65% é saudável, acima de 75% é forte.",
    icon: CalendarCheck,
  },
  {
    key: "yield",
    friendlyName: "Retorno anual do imóvel no Airbnb",
    technicalName: "Yield Airbnb",
    explanation: "Mostra quanto o imóvel pode render por ano em relação ao valor do investimento.",
    whyItMatters: "É o indicador mais direto de 'vale a pena investir?'. Um yield de 8% significa que a cada ano o imóvel retorna 8% do que você pagou.",
    example: "Se o yield do Airbnb é 8% e o do aluguel comum é 5%, o short stay rende 60% mais.",
    takeaway: "Quanto maior o yield, mais rápido o investimento se paga.",
    icon: TrendingUp,
  },
  {
    key: "delta",
    friendlyName: "Quanto o Airbnb rende a mais que o aluguel comum",
    technicalName: "Delta Yield",
    explanation: "Compara o retorno do short stay com o aluguel tradicional de 12 meses.",
    whyItMatters: "Se o delta é positivo, operar no Airbnb rende mais do que alugar normalmente. Quanto maior, mais vantajoso é o short stay naquele bairro.",
    example: "Um delta de +3% significa que o Airbnb gera 3 pontos percentuais a mais de retorno anual.",
    takeaway: "Delta positivo = short stay ganha do aluguel tradicional.",
    icon: ArrowUpRight,
  },
  {
    key: "liquidez",
    friendlyName: "Facilidade de gerar demanda",
    technicalName: "Liquidez",
    explanation: "Mostra o quão fácil tende a ser manter o imóvel com reservas constantes naquele bairro.",
    whyItMatters: "Alta liquidez significa que há demanda real e frequente — menos esforço para preencher o calendário.",
    example: "Um bairro com muitas reviews, reservas recorrentes e alta visibilidade tem liquidez forte.",
    takeaway: "Mais liquidez = menos risco de o imóvel ficar parado.",
    icon: Zap,
  },
  {
    key: "crescimento",
    friendlyName: "Potencial futuro do bairro",
    technicalName: "Crescimento",
    explanation: "Mostra se o bairro tem sinais de fortalecimento e valorização futura.",
    whyItMatters: "Investir em um bairro em crescimento pode significar entrada mais acessível hoje e valorização amanhã.",
    example: "Bairros com novas linhas de metrô, revitalização urbana ou aumento de demanda tendem a ter crescimento consistente.",
    takeaway: "Crescimento alto = aposta no futuro com potencial de upside.",
    icon: Sprout,
  },
  {
    key: "confianca",
    friendlyName: "Qualidade dos dados",
    technicalName: "Confiança",
    explanation: "Mostra o quão robusta é a leitura disponível para aquele bairro.",
    whyItMatters: "Dados de alta confiança permitem decisões mais seguras. Dados de baixa confiança pedem cautela adicional antes de investir.",
    example: "Alto = leitura consistente · Médio = útil, com margem de incerteza · Baixo = exploratória.",
    takeaway: "Desconfie de retornos muito altos em bairros com baixa confiança.",
    icon: Shield,
  },
  {
    key: "score",
    friendlyName: "Nota geral de atratividade para investimento",
    technicalName: "Investment Score",
    explanation: "Resume retorno, demanda, operação e potencial futuro em uma nota de 0 a 100.",
    whyItMatters: "Em vez de avaliar 30+ variáveis, o score condensa tudo em um número comparável. Quanto maior, mais o bairro parece atrativo para short stay.",
    example: "Um bairro com score 65 tem equilíbrio forte entre todos os pilares. Um com 38 tem fragilidades importantes.",
    takeaway: "Use o score para triagem rápida, depois aprofunde nos indicadores individuais.",
    icon: Target,
  },
];

export const Step3Learn = ({ onNext }: { onNext: () => void }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Intro */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-[var(--font-display)]">Como entender esta análise</h2>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-2">
              Antes de comparar bairros, é importante entender o que cada indicador significa na prática.
              Pense neles como as "lentes" que usamos para avaliar cada bairro.
            </p>
            <p className="text-xs text-foreground/60 leading-relaxed">
              Clique em qualquer indicador para ver a explicação completa, com exemplos e o que observar.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Indicator cards — expandable, in order */}
      <div className="space-y-2">
        {STEP3_INDICATORS.map((ind, i) => {
          const isOpen = expandedCard === ind.key;
          const Icon = ind.icon;
          return (
            <motion.div key={ind.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={stagger(i, 0.06)}>
              <Card
                className={`cursor-pointer transition-all ${isOpen ? "ring-1 ring-primary/30 shadow-sm" : "hover:shadow-sm hover:bg-muted/20"}`}
                onClick={() => setExpandedCard(isOpen ? null : ind.key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{ind.friendlyName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{ind.technicalName}</p>
                      </div>
                    </div>
                    {isOpen
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-2.5 pt-3 border-t border-border/50">
                          <p className="text-xs text-foreground/80 leading-relaxed">{ind.explanation}</p>
                          <div className="bg-primary/[0.04] rounded-lg p-3">
                            <p className="text-[11px] font-semibold text-primary mb-0.5">Por que importa</p>
                            <p className="text-[11px] text-foreground/70 leading-relaxed">{ind.whyItMatters}</p>
                          </div>
                          <div className="bg-muted/40 rounded-lg p-2.5">
                            <p className="text-[11px] text-muted-foreground italic">💡 {ind.example}</p>
                          </div>
                          <p className="text-xs font-medium text-foreground/80 flex items-start gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            {ind.takeaway}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* How the Investment Score is composed */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(STEP3_INDICATORS.length, 0.06)}>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" /> Como o Investment Score é montado
            </p>
            <p className="text-sm text-foreground/70 leading-relaxed mb-4">
              O score combina 4 pilares com pesos diferentes. Não basta ser bom em um — 
              o bairro precisa ser consistente em vários.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PILLARS.map((p, i) => {
                const PillarIcon = ICON_MAP[p.icon] || TrendingUp;
                return (
                  <motion.div key={p.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={stagger(i, 0.1)}>
                    <div className="text-center p-3 rounded-lg bg-muted/40">
                      <PillarIcon className={`h-5 w-5 ${p.color} mx-auto mb-1.5`} />
                      <p className="text-lg font-bold text-primary">{(p.weight * 100).toFixed(0)}%</p>
                      <p className="text-xs font-medium">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{p.friendlyName}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key lessons */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(STEP3_INDICATORS.length + 1, 0.06)}>
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              📚 Lições-chave antes de comparar
            </p>
            <div className="space-y-2">
              {STRATEGIC_LESSONS.slice(0, 3).map((lesson, i) => (
                <div key={lesson.id} className="flex items-start gap-2">
                  <span className="text-primary text-sm mt-0.5">→</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{lesson.title}</p>
                    <p className="text-xs text-foreground/60">{lesson.takeaway}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* True Yield — Advanced optional layer */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(STEP3_INDICATORS.length + 2, 0.06)}>
        <Card className="border-dashed border-primary/20">
          <CardContent className="p-5">
            <button
              onClick={() => setExpandedCard(expandedCard === "true-yield" ? null : "true-yield")}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  🔬 Camada avançada: True Yield
                </span>
              </div>
              {expandedCard === "true-yield" ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence>
              {expandedCard === "true-yield" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      O <strong>True Yield</strong> é uma estimativa mais direta do retorno anual real do imóvel, 
                      calculada com base na diária média, taxa de ocupação e valor do ativo.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-mono text-center text-foreground/70">
                        True Yield = ADR × Ocupação × 365 ÷ Preço médio do imóvel
                      </p>
                    </div>
                    <div className="bg-primary/[0.04] rounded-lg p-3">
                      <p className="text-[11px] font-semibold text-primary mb-1">Por que é útil?</p>
                      <p className="text-[11px] text-foreground/70 leading-relaxed">
                        Enquanto o Yield Airbnb usa a receita reportada pela plataforma, o True Yield recalcula 
                        o retorno a partir dos dados operacionais reais (diária e ocupação). A diferença entre os dois 
                        pode revelar oportunidades ocultas ou alertar sobre inconsistências.
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded p-2">
                      <p className="text-[11px] text-muted-foreground italic">
                        💡 Exemplo: se o True Yield é 2pp acima do Yield Airbnb, pode indicar que o bairro tem 
                        potencial de retorno maior do que o estimado pela plataforma.
                      </p>
                    </div>
                    <p className="text-xs text-foreground/60">
                      → Esse indicador aparecerá como comparativo opcional nas próximas etapas.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={stagger(STEP3_INDICATORS.length + 3, 0.06)} className="flex justify-end">
        <Button onClick={onNext} className="gap-2">
          Agora quero comparar bairros <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// STEP 4: APRENDIZADOS ESTRATÉGICOS
// ═══════════════════════════════════════════════════════════════════

export const Step4Learnings = ({ bairros, onNext }: { bairros: BairroAirbnb[]; onNext: () => void }) => {
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  const LESSON_ICONS: Record<string, React.ElementType> = {
    AlertCircle: AlertTriangle, Gem: Sparkles, Gauge, Scale, ShieldAlert: Shield, ArrowUpDown: ArrowUpRight,
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-[var(--font-display)]">O que esta análise ensina</h2>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-2">
              Antes de abrir a comparação completa, veja as conclusões estratégicas mais importantes 
              que os dados revelam. Esses aprendizados vão ajudar você a comparar bairros de forma mais inteligente.
            </p>
            <p className="text-xs text-foreground/60">
              Clique em cada aprendizado para ver o exemplo real dos dados.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lesson cards */}
      <div className="space-y-3">
        {STRATEGIC_LESSONS.map((lesson, i) => {
          const isOpen = expandedLesson === lesson.id;
          const Icon = LESSON_ICONS[lesson.icon] || Lightbulb;
          const example = isOpen ? lesson.buildExample(bairros) : null;

          return (
            <motion.div key={lesson.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={stagger(i, 0.08)}>
              <Card
                className={`cursor-pointer transition-all ${isOpen ? "ring-1 ring-primary/30 shadow-sm" : "hover:shadow-sm hover:bg-muted/20"}`}
                onClick={() => setExpandedLesson(isOpen ? null : lesson.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-snug">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{lesson.explanation}</p>
                      </div>
                    </div>
                    {isOpen
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                          {example && (
                            <div className="bg-primary/[0.04] rounded-lg p-3 border border-primary/10">
                              <p className="text-[11px] font-semibold text-primary mb-1">📊 Nos dados reais</p>
                              <p className="text-xs text-foreground/80 leading-relaxed">{example}</p>
                            </div>
                          )}
                          <div className="flex items-start gap-2 bg-muted/40 rounded-lg p-3">
                            <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <p className="text-xs font-medium text-foreground/80">{lesson.takeaway}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Summary insight */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(STRATEGIC_LESSONS.length, 0.08)}>
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Scale className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Conclusão principal</p>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  O melhor investimento em short stay raramente é o bairro mais caro ou mais famoso. 
                  É aquele que <strong>melhor equilibra retorno, demanda e estabilidade</strong> — 
                  e isso só fica claro quando você olha para todos os indicadores juntos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={stagger(STRATEGIC_LESSONS.length + 1, 0.08)} className="flex justify-end">
        <Button onClick={onNext} className="gap-2">
          Agora quero comparar bairros <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// STEP 5: COMPARAR (Ranking table)
// ═══════════════════════════════════════════════════════════════════

export const Step5Compare = ({ bairros, onNext }: { bairros: BairroAirbnb[]; onNext: () => void }) => {
  const ranked = useMemo(() => calculateAllScores(bairros), [bairros]);
  const [showTrueYield, setShowTrueYield] = useState(false);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-[var(--font-display)]">Compare os bairros</h2>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Agora que você sabe ler os indicadores, veja como os {bairros.length} bairros se posicionam 
              no ranking geral. Clique em qualquer bairro para ver a análise completa.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* True Yield toggle */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={stagger(1)}>
        <button
          onClick={() => setShowTrueYield(!showTrueYield)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-primary/30 bg-primary/[0.02] hover:bg-primary/[0.05] transition-colors text-xs"
        >
          <FlaskConical className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground font-medium">
            {showTrueYield ? "Ocultar" : "Mostrar"} True Yield
          </span>
          {showTrueYield ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : <Eye className="h-3 w-3 text-muted-foreground" />}
        </button>
      </motion.div>

      {/* Ranking cards */}
      <div className="space-y-2">
        {ranked.map((item, i) => {
          const b = item.bairro;
          const s = item.investmentScore;
          const profile = getBairroProfile(b, bairros);
          const badgeStyle = getGradeStyle(s.gradeColor);
          const trueYield = showTrueYield ? calculateTrueYield(b) : null;
          return (
            <motion.div
              key={b.bairro}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={stagger(i)}
            >
              <Link to={`/intelligence/bairro/${encodeURIComponent(b.bairro)}`}>
                <Card className="hover:shadow-md transition-all group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg font-bold text-muted-foreground w-8">#{i + 1}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold group-hover:text-primary transition-colors">{b.bairro}</p>
                            <Badge className={`${profile.color} ${profile.textColor} text-[9px]`}>{profile.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Diária {fmtBRL(b.adr_medio_studio)} · Ocupação {fmtPct(b.ocupacao_media_studio)} · Yield {fmtPct(b.yield_bruto_airbnb)}
                          </p>
                          {trueYield && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <FlaskConical className="h-3 w-3 text-primary/60" />
                              <span className="text-[11px] text-primary/80 font-medium">
                                True Yield {fmtPct(trueYield.trueYield)}
                              </span>
                              <span className={`text-[10px] font-medium ${trueYield.delta > 0 ? "text-emerald-600" : trueYield.delta < -0.005 ? "text-amber-600" : "text-muted-foreground"}`}>
                                ({trueYield.delta > 0 ? "+" : ""}{(trueYield.delta * 100).toFixed(1)}pp)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <div className="text-right">
                          <p className="text-lg font-bold">{s.score.toFixed(1)}</p>
                          <Badge className={`${badgeStyle} text-[10px]`}>{s.grade}</Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={stagger(ranked.length)}>
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4">
            <p className="text-xs text-center text-muted-foreground italic">
              "O melhor investimento não é o bairro mais famoso — é aquele que melhor equilibra retorno, demanda e estabilidade para o seu perfil."
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex items-center justify-between">
        <Link to="/intelligence/ranking">
          <Button variant="outline" size="sm" className="text-xs gap-1">
            Ranking completo com tabela <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
        <Button onClick={onNext} className="gap-2">
          Personalizar por perfil <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// STEP 6: QUIZ DE PERFIL
// ═══════════════════════════════════════════════════════════════════

interface Step6Props {
  onComplete: (answers: QuizAnswers, profile: InvestorProfile) => void;
}

export const Step6Profile = ({ onComplete }: Step6Props) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const q = QUIZ_QUESTIONS[currentQ];
  const totalQ = QUIZ_QUESTIONS.length;
  const progress = ((currentQ + 1) / totalQ) * 100;

  const handleSelect = (value: string) => {
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);

    if (currentQ < totalQ - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const quizAnswers: QuizAnswers = {
        objective: newAnswers.objective || "equilibrio",
        risk: newAnswers.risk || "moderado",
        priority: newAnswers.priority || "retorno",
      };
      const profile = resolveProfile(quizAnswers);
      onComplete(quizAnswers, profile);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-[var(--font-display)]">Descubra seu perfil de investidor</h2>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Responda 3 perguntas rápidas para personalizar a recomendação final.
              Não existe resposta certa — apenas a que mais combina com você.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Pergunta {currentQ + 1} de {totalQ}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <Card>
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-foreground mb-1">{q.question}</h3>
              <p className="text-xs text-muted-foreground mb-5">{q.subtitle}</p>
              <div className="space-y-3">
                {q.options.map((opt) => {
                  const Icon = ICON_MAP[opt.icon] || Scale;
                  const isSelected = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/[0.05]"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {currentQ > 0 && (
        <Button variant="ghost" size="sm" onClick={() => setCurrentQ(currentQ - 1)} className="text-xs">
          ← Voltar
        </Button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// STEP 7: EXPLORE
// ═══════════════════════════════════════════════════════════════════

export const Step7Explore = ({ bairros, onNext }: { bairros: BairroAirbnb[]; onNext: () => void }) => {
  const ranked = useMemo(() => calculateAllScores(bairros).slice(0, 5), [bairros]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-[var(--font-display)]">Explore em profundidade</h2>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Escolha um bairro para ver a análise completa: scores detalhados, gráficos de sazonalidade, 
              comparativo short stay vs aluguel, pontos de atenção e para qual perfil de investidor ele faz mais sentido.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ranked.map((item, i) => {
          const b = item.bairro;
          const s = item.investmentScore;
          const profile = getBairroProfile(b, bairros);
          const badgeStyle = getGradeStyle(s.gradeColor);
          return (
            <motion.div key={b.bairro} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(i)}>
              <Link to={`/intelligence/bairro/${encodeURIComponent(b.bairro)}`}>
                <Card className="h-full hover:shadow-md transition-all group cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`${profile.color} ${profile.textColor} text-[10px]`}>{profile.label}</Badge>
                      <Badge className={`${badgeStyle} text-[10px]`}>{s.grade}</Badge>
                    </div>
                    <p className="text-lg font-bold group-hover:text-primary transition-colors">{b.bairro}</p>
                    <p className="text-2xl font-bold mt-1">{s.score.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Yield {fmtPct(b.yield_bruto_airbnb)} · Ocupação {fmtPct(b.ocupacao_media_studio)}
                    </p>
                    <p className="text-xs text-primary mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver análise completa <ChevronRight className="h-3 w-3" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center">
        <Link to="/intelligence/ranking">
          <Button variant="outline" size="sm" className="text-xs gap-1">
            Ver todos os {bairros.length} bairros <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} className="gap-2">
          Ver recomendação personalizada <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// STEP 8: RECOMENDAÇÃO
// ═══════════════════════════════════════════════════════════════════

interface Step8Props {
  bairros: BairroAirbnb[];
  profile: InvestorProfile | null;
  answers: QuizAnswers | null;
}

export const Step8Recommendation = ({ bairros, profile, answers }: Step8Props) => {
  const finalProfile = profile || resolveProfile({ objective: "equilibrio", risk: "moderado", priority: "retorno" });
  const [showTrueYield, setShowTrueYield] = useState(false);
  const recommendations = useMemo(
    () => generateRecommendations(bairros, finalProfile).slice(0, 3),
    [bairros, finalProfile]
  );

  const ProfileIcon = ICON_MAP[finalProfile.icon] || Scale;

  return (
    <div className="space-y-6">
      {/* Profile summary */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-xl ${finalProfile.color} flex items-center justify-center shrink-0`}>
                <ProfileIcon className={`h-6 w-6 ${finalProfile.textColor}`} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Seu perfil</p>
                <h2 className="text-lg font-bold font-[var(--font-display)]">{finalProfile.name}</h2>
                <p className="text-sm text-foreground/70 leading-relaxed mt-1">{finalProfile.description}</p>
              </div>
            </div>

            {/* Weight visualization */}
            <div className="mt-5 grid grid-cols-4 gap-2">
              {PILLARS.map(p => {
                const w = finalProfile.weights[p.key as keyof typeof finalProfile.weights];
                const Icon = ICON_MAP[p.icon] || TrendingUp;
                return (
                  <div key={p.key} className="text-center">
                    <Icon className={`h-4 w-4 ${p.color} mx-auto mb-1`} />
                    <p className="text-sm font-bold">{(w * 100).toFixed(0)}%</p>
                    <p className="text-[10px] text-muted-foreground">{p.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* True Yield toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          🏆 Top 3 bairros para o seu perfil
        </p>
        <button
          onClick={() => setShowTrueYield(!showTrueYield)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-dashed border-primary/30 bg-primary/[0.02] hover:bg-primary/[0.05] transition-colors text-[10px]"
        >
          <FlaskConical className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground font-medium">
            {showTrueYield ? "Ocultar" : "Ver"} True Yield
          </span>
        </button>
      </div>
      
      <div className="space-y-4">
        {recommendations.map((rec, i) => {
          const badgeStyle = getGradeStyle(rec.gradeColor);
          const trueYield = showTrueYield ? calculateTrueYield(rec.bairro) : null;
          return (
            <motion.div key={rec.bairro.bairro} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={stagger(i, 0.1)}>
              <Card className={`${i === 0 ? "ring-2 ring-primary/30 border-primary/20" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-bold ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                        #{i + 1}
                      </span>
                      <div>
                        <p className="text-lg font-bold">{rec.bairro.bairro}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={`${badgeStyle} text-[10px]`}>{rec.grade}</Badge>
                          <Badge variant="outline" className="text-[10px]">{rec.profileLabel}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{rec.personalizedScore.toFixed(1)}</p>
                      <p className="text-[10px] text-muted-foreground">Score personalizado</p>
                    </div>
                  </div>

                  {/* Key metrics */}
                  <div className={`grid ${showTrueYield ? "grid-cols-4" : "grid-cols-3"} gap-3 mb-4`}>
                    <div className="text-center p-2 rounded-lg bg-muted/40">
                      <p className="text-[10px] text-muted-foreground">Yield</p>
                      <p className="text-sm font-bold">{fmtPct(rec.bairro.yield_bruto_airbnb)}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/40">
                      <p className="text-[10px] text-muted-foreground">Ocupação</p>
                      <p className="text-sm font-bold">{fmtPct(rec.bairro.ocupacao_media_studio)}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/40">
                      <p className="text-[10px] text-muted-foreground">Diária</p>
                      <p className="text-sm font-bold">{fmtBRL(rec.bairro.adr_medio_studio)}</p>
                    </div>
                    {trueYield && (
                      <div className="text-center p-2 rounded-lg bg-primary/[0.06] border border-primary/10">
                        <p className="text-[10px] text-primary/70 flex items-center justify-center gap-0.5">
                          <FlaskConical className="h-2.5 w-2.5" /> True Yield
                        </p>
                        <p className="text-sm font-bold text-primary">{fmtPct(trueYield.trueYield)}</p>
                        <p className={`text-[9px] font-medium ${trueYield.delta > 0 ? "text-emerald-600" : trueYield.delta < -0.005 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {trueYield.delta > 0 ? "+" : ""}{(trueYield.delta * 100).toFixed(1)}pp vs Yield
                        </p>
                      </div>
                    )}
                  </div>

                  {/* True Yield insight */}
                  {trueYield && (
                    <div className="mb-3 p-2.5 rounded-lg bg-muted/30 border border-dashed border-primary/15">
                      <p className="text-[11px] text-foreground/70 leading-relaxed">
                        <FlaskConical className="h-3 w-3 text-primary inline mr-1" />
                        {trueYield.comparison}
                      </p>
                    </div>
                  )}

                  {/* Reasons */}
                  <div className="space-y-1.5 mb-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Por que este bairro</p>
                    {rec.reasons.map((r, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-foreground/80">{r}</p>
                      </div>
                    ))}
                  </div>

                  {/* Cautions */}
                  {rec.cautions.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pontos de atenção</p>
                      {rec.cautions.map((c, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-foreground/60">{c}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-border/50">
                    <Link to={`/intelligence/bairro/${encodeURIComponent(rec.bairro.bairro)}`}>
                      <Button variant="outline" size="sm" className="text-xs w-full gap-1">
                        Ver análise completa de {rec.bairro.bairro} <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Closing */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(3, 0.2)}>
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-foreground/70 leading-relaxed italic mb-3">
              "Esta recomendação é baseada no cruzamento do seu perfil com os dados de {bairros.length} bairros. 
              Use como ponto de partida, não como decisão final."
            </p>
            <p className="text-[11px] text-muted-foreground">{FOOTER_DISCLAIMER}</p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/intelligence/ranking">
          <Button variant="outline" size="sm" className="text-xs gap-1">
            <BarChart3 className="h-3.5 w-3.5" /> Ranking completo
          </Button>
        </Link>
        <Link to="/intelligence/listings">
          <Button variant="outline" size="sm" className="text-xs gap-1">
            <Building2 className="h-3.5 w-3.5" /> Base de listings
          </Button>
        </Link>
      </div>
    </div>
  );
};
