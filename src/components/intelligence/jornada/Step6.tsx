import { formatDecimal } from "@/lib/numberFormat";
import { bairroPath } from "@/lib/seo";
import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Scale, Crown, Rocket, Zap, ChevronRight, ArrowRight, Sprout, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { type BairroAirbnb } from "@/types/intelligence";
import { getBairroProfile } from "@/lib/intelligenceInsights";
import { calculateInvestmentScore } from "@/lib/investmentScore";
import { getGradeStyle } from "@/lib/uiHelpers";
import { resolveProfile, type QuizAnswers, type InvestorProfile } from "@/lib/investorQuiz";
import { fmtBRL, fmtPct } from "@/hooks/useIntelligenceData";
import { MicroNote } from "./shared";
import { stagger } from "./constantes";

// ═══════════════════════════════════════════════════════════════════
// STEP 6: FILTRO POR PERFIL / INTENÇÃO
// ═══════════════════════════════════════════════════════════════════

interface IntentOption {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  filter: (b: BairroAirbnb, all: BairroAirbnb[]) => number; // 0-100 relevance
  caution?: string;
  profileMapping: { objective: string; risk: string; priority: string };
}

const INTENT_OPTIONS: IntentOption[] = [
  {
    id: "equilibrio",
    label: "Quero mais equilíbrio",
    description: "Bairros que combinam retorno, ocupação e liquidez de forma consistente.",
    icon: Scale,
    filter: (b, all) => {
      const r = Number(b.score_rentabilidade), l = Number(b.score_liquidez), c = Number(b.score_crescimento_potencial);
      const avg = (r + l + c) / 3;
      const spread = Math.max(r, l, c) - Math.min(r, l, c);
      return Math.max(0, Math.min(100, avg - spread * 0.5));
    },
    profileMapping: { objective: "equilibrio", risk: "moderado", priority: "retorno" },
  },
  {
    id: "retorno",
    label: "Quero mais retorno",
    description: "Bairros com yield mais agressivo, mesmo que com mais volatilidade.",
    icon: TrendingUp,
    filter: (b) => Number(b.yield_bruto_airbnb) * 1000,
    caution: "Retorno alto pode vir com liquidez menor ou dados menos robustos. Avalie os riscos.",
    profileMapping: { objective: "renda", risk: "agressivo", priority: "retorno" },
  },
  {
    id: "liquidez",
    label: "Quero mais liquidez",
    description: "Bairros com demanda forte e facilidade de manter reservas constantes.",
    icon: Zap,
    filter: (b) => Number(b.score_liquidez),
    profileMapping: { objective: "equilibrio", risk: "conservador", priority: "liquidez" },
  },
  {
    id: "premium",
    label: "Quero bairro premium",
    description: "Bairros com diárias mais altas e forte percepção de valor.",
    icon: Crown,
    filter: (b) => Number(b.adr_medio_studio),
    profileMapping: { objective: "valorizacao", risk: "moderado", priority: "retorno" },
  },
  {
    id: "risco",
    label: "Aceito mais risco por upside",
    description: "Bairros com potencial de retorno alto, mesmo com incertezas.",
    icon: Rocket,
    filter: (b) => {
      const y = Number(b.yield_bruto_airbnb) * 100;
      const c = Number(b.score_crescimento_potencial);
      return y * 0.6 + c * 0.4;
    },
    caution: "Yield alto com liquidez baixa ou dados limitados exige mais cautela na decisão.",
    profileMapping: { objective: "renda", risk: "agressivo", priority: "retorno" },
  },
  {
    id: "crescimento",
    label: "Quero potencial de crescimento",
    description: "Bairros com sinais de valorização e expansão futura da demanda.",
    icon: Sprout,
    filter: (b) => Number(b.score_crescimento_potencial),
    profileMapping: { objective: "valorizacao", risk: "moderado", priority: "crescimento" },
  },
];

interface Step6Props {
  bairros: BairroAirbnb[];
  onComplete: (answers: QuizAnswers, profile: InvestorProfile) => void;
}

export const Step6Profile = ({ bairros, onComplete }: Step6Props) => {
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);

  const intent = INTENT_OPTIONS.find(o => o.id === selectedIntent);

  const filteredBairros = useMemo(() => {
    if (!intent) return [];
    return bairros
      .map(b => ({
        bairro: b,
        relevance: intent.filter(b, bairros),
        profile: getBairroProfile(b, bairros),
        score: calculateInvestmentScore(b, bairros),
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);
  }, [bairros, intent]);

  const handleConfirm = () => {
    if (!intent) return;
    const mapping = intent.profileMapping;
    const quizAnswers: QuizAnswers = {
      objective: mapping.objective,
      risk: mapping.risk,
      priority: mapping.priority,
    };
    const profile = resolveProfile(quizAnswers);
    onComplete(quizAnswers, profile);
  };

  return (
    <div className="space-y-6">
      <MicroNote sectionKey="journey_profile" />
      {/* Intro */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-[var(--font-display)]">Qual é o seu objetivo?</h2>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-2">
              Selecione a intenção que mais se aproxima do que você busca. 
              A análise vai reorganizar os destaques para o seu perfil.
            </p>
            <p className="text-xs text-foreground/60">
              Não existe resposta certa — apenas a que mais combina com o seu momento e apetite.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Intent selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {INTENT_OPTIONS.map((opt, i) => {
          const Icon = opt.icon;
          const isSelected = selectedIntent === opt.id;
          return (
            <motion.div key={opt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={stagger(i, 0.06)}>
              <button
                onClick={() => setSelectedIntent(isSelected ? null : opt.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all h-full ${
                  isSelected
                    ? "border-primary bg-primary/[0.05] shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{opt.description}</p>
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Filtered results */}
      <AnimatePresence mode="wait">
        {intent && filteredBairros.length > 0 && (
          <motion.div
            key={selectedIntent}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              🎯 Bairros mais coerentes com "{intent.label.toLowerCase()}"
            </p>

            {/* Caution banner if applicable */}
            {intent.caution && (
              <Card className="bg-amber-500/[0.05] border-amber-500/20">
                <CardContent className="p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground/70 leading-relaxed">{intent.caution}</p>
                </CardContent>
              </Card>
            )}

            {/* Highlighted bairros */}
            <div className="space-y-2">
              {filteredBairros.map((item, i) => {
                const b = item.bairro;
                const s = item.score;
                const badgeStyle = getGradeStyle(s.gradeColor);
                return (
                  <motion.div
                    key={b.bairro}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={stagger(i, 0.06)}
                  >
                    <Link to={bairroPath(b.bairro)}>
                      <Card className={`hover:shadow-md transition-all group ${i === 0 ? "ring-1 ring-primary/20 border-primary/15" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`text-lg font-bold ${i === 0 ? "text-primary" : "text-muted-foreground"} w-8`}>
                                #{i + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold group-hover:text-primary transition-colors">{b.bairro}</p>
                                  <Badge className={`${item.profile.color} ${item.profile.textColor} text-[9px]`}>
                                    {item.profile.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Diária {fmtBRL(b.adr_medio_studio)} · Ocupação {fmtPct(b.ocupacao_media_studio)} · Yield {fmtPct(b.yield_bruto_airbnb)}
                                </p>
                                <p className="text-[11px] text-foreground/60 mt-1 italic">{item.profile.quickRead}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <div className="text-right">
                                <p className="text-lg font-bold">{formatDecimal(s.score, 1)}</p>
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

            {/* Confirm and proceed */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex justify-end">
              <Button onClick={handleConfirm} className="gap-2">
                Usar "{intent.label.replace("Quero ", "").replace("Aceito ", "")}" como meu perfil <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!selectedIntent && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={stagger(INTENT_OPTIONS.length, 0.06)}>
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="p-5 text-center">
              <p className="text-sm text-muted-foreground">
                Selecione uma intenção acima para ver os bairros mais coerentes com o seu objetivo.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
