import { formatDecimal } from "@/lib/numberFormat";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, Zap, BookOpen, ArrowRight, Shield, CalendarCheck, ArrowUpRight, Sprout, Gauge, CheckCircle, Banknote, ChevronDown, ChevronUp, FlaskConical, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PILLARS } from "@/lib/investmentScore";
import { STRATEGIC_LESSONS } from "@/lib/storytelling";
import { MicroNote } from "./shared";
import { ICON_MAP, stagger } from "./constantes";

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
      <MicroNote sectionKey="journey_indicators" />
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
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{ind.technicalName}</p>
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
                            <p className="text-xs font-semibold text-primary mb-0.5">Por que importa</p>
                            <p className="text-xs text-foreground/70 leading-relaxed">{ind.whyItMatters}</p>
                          </div>
                          <div className="bg-muted/40 rounded-lg p-2.5">
                            <p className="text-xs text-muted-foreground italic">💡 {ind.example}</p>
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
                      <p className="text-lg font-bold text-primary">{formatDecimal((p.weight * 100), 0)}%</p>
                      <p className="text-xs font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.friendlyName}</p>
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
                      <p className="text-xs font-semibold text-primary mb-1">Por que é útil?</p>
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        Enquanto o Yield Airbnb usa a receita reportada pela plataforma, o True Yield recalcula 
                        o retorno a partir dos dados operacionais reais (diária e ocupação). A diferença entre os dois 
                        pode revelar oportunidades ocultas ou alertar sobre inconsistências.
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded p-2">
                      <p className="text-xs text-muted-foreground italic">
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
          Ver os aprendizados da análise <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
};
