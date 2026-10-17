import { formatDecimal } from "@/lib/numberFormat";
import { bairroPath } from "@/lib/seo";
import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Scale, Crown, Rocket, Activity, Lightbulb, ArrowRight, AlertTriangle, FlaskConical, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { type BairroAirbnb } from "@/types/intelligence";
import { getHighlightWinners, getBairroProfile } from "@/lib/intelligenceInsights";
import { calculateAllScores, calculateTrueYield } from "@/lib/investmentScore";
import { getGradeStyle } from "@/lib/uiHelpers";
import { fmtBRL, fmtPct, fmtScore } from "@/hooks/useIntelligenceData";
import { MicroNote } from "./shared";
import { stagger } from "./constantes";

// ═══════════════════════════════════════════════════════════════════
// STEP 5: RANKING GUIADO
// ═══════════════════════════════════════════════════════════════════

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { COLUMN_TOOLTIPS } from "@/lib/intelligenceInsights";

const RANKING_COLUMNS = [
  { key: "score", label: "Score", tooltip: COLUMN_TOOLTIPS.investment_score, width: "w-[60px]" },
  { key: "grade", label: "Nota", tooltip: { friendly: "Classificação", tip: "Nota de A+ (excelente) a D (arriscado) baseada no Investment Score." }, width: "w-[44px]" },
  { key: "adr", label: "Diária", tooltip: COLUMN_TOOLTIPS.adr, width: "w-[72px]" },
  { key: "occ", label: "Ocup.", tooltip: COLUMN_TOOLTIPS.ocupacao, width: "w-[52px]" },
  { key: "yield", label: "Yield", tooltip: COLUMN_TOOLTIPS.yield_airbnb, width: "w-[52px]" },
  { key: "delta", label: "Δ Yield", tooltip: COLUMN_TOOLTIPS.delta_yield, width: "w-[56px]" },
  { key: "liq", label: "Liq.", tooltip: COLUMN_TOOLTIPS.liquidez, width: "w-[44px]" },
  { key: "cresc", label: "Cresc.", tooltip: COLUMN_TOOLTIPS.crescimento, width: "w-[48px]" },
  { key: "conf", label: "Conf.", tooltip: COLUMN_TOOLTIPS.confianca, width: "w-[44px]" },
];

const CONFIDENCE_BADGE: Record<string, string> = {
  alto: "bg-success-soft text-success-strong",
  médio: "bg-warning-soft text-warning-strong",
  medio: "bg-warning-soft text-warning-strong",
  baixo: "bg-danger-soft text-danger-strong",
};

export const Step5Compare = ({ bairros, onNext }: { bairros: BairroAirbnb[]; onNext: () => void }) => {
  const ranked = useMemo(() => calculateAllScores(bairros), [bairros]);
  const [showTrueYield, setShowTrueYield] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <MicroNote sectionKey="journey_ranking" />
        {/* Intro */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold font-[var(--font-display)]">Ranking guiado dos bairros</h2>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed mb-2">
                Nem sempre o bairro com a diária mais alta é o melhor investimento. Este ranking prioriza 
                o <strong>equilíbrio entre retorno, demanda, operação e potencial futuro</strong>.
              </p>
              <p className="text-xs text-foreground/60">
                Passe o mouse sobre os cabeçalhos para entender cada coluna. Clique em qualquer bairro para a análise completa.
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

        {/* Ranking table */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(2)}>
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-xs">
              {/* Header */}
              <thead>
                <tr className="bg-muted/40 border-b border-border/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground w-[36px]">#</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground min-w-[120px]">Bairro</th>
                  {RANKING_COLUMNS.map(col => (
                    <th key={col.key} className={`text-center p-3 font-semibold text-muted-foreground ${col.width}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help border-b border-dashed border-muted-foreground/40">
                            {col.label}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          <p className="font-semibold text-xs mb-0.5">{col.tooltip.friendly}</p>
                          <p className="text-xs text-muted-foreground">{col.tooltip.tip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                  ))}
                  {showTrueYield && (
                    <th className="text-center p-3 font-semibold text-primary/80 w-[56px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help border-b border-dashed border-primary/40 flex items-center justify-center gap-0.5">
                            <FlaskConical className="h-3 w-3" /> TY
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          <p className="font-semibold text-xs mb-0.5">{COLUMN_TOOLTIPS.true_yield.friendly}</p>
                          <p className="text-xs text-muted-foreground">{COLUMN_TOOLTIPS.true_yield.tip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                  )}
                  <th className="text-left p-3 font-semibold text-muted-foreground min-w-[140px]">Leitura rápida</th>
                </tr>
              </thead>
              {/* Body */}
              <tbody>
                {ranked.map((item, i) => {
                  const b = item.bairro;
                  const s = item.investmentScore;
                  const profile = getBairroProfile(b, bairros);
                  const badgeStyle = getGradeStyle(s.gradeColor);
                  const trueYield = showTrueYield ? calculateTrueYield(b) : null;
                  const confKey = b.nivel_confianca_dados?.toLowerCase() || "medio";
                  const confBadge = CONFIDENCE_BADGE[confKey] || CONFIDENCE_BADGE.medio;

                  return (
                    <motion.tr
                      key={b.bairro}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={stagger(i, 0.03)}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors group"
                    >
                      <td className="p-3 font-bold text-muted-foreground">{i + 1}</td>
                      <td className="p-3">
                        <Link to={bairroPath(b.bairro)} className="block">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors text-[13px]">
                            {b.bairro}
                          </p>
                          <Badge className={`${profile.color} ${profile.textColor} text-xs mt-0.5`}>{profile.label}</Badge>
                        </Link>
                      </td>
                      <td className="p-3 text-center font-bold text-[13px]">{formatDecimal(s.score, 1)}</td>
                      <td className="p-3 text-center">
                        <Badge className={`${badgeStyle} text-xs`}>{s.grade}</Badge>
                      </td>
                      <td className="p-3 text-center font-medium">{fmtBRL(b.adr_medio_studio)}</td>
                      <td className="p-3 text-center font-medium">{fmtPct(b.ocupacao_media_studio)}</td>
                      <td className="p-3 text-center font-medium">{fmtPct(b.yield_bruto_airbnb)}</td>
                      <td className="p-3 text-center">
                        <span className={Number(b.delta_yield) > 0 ? "text-success-strong font-medium" : "text-muted-foreground"}>
                          {Number(b.delta_yield) > 0 ? "+" : ""}{fmtPct(b.delta_yield)}
                        </span>
                      </td>
                      <td className="p-3 text-center font-medium">{fmtScore(b.score_liquidez)}</td>
                      <td className="p-3 text-center font-medium">{fmtScore(b.score_crescimento_potencial)}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold uppercase ${confBadge}`}>
                          {b.nivel_confianca_dados}
                        </span>
                      </td>
                      {trueYield && (
                        <td className="p-3 text-center">
                          <span className="font-medium text-primary">{fmtPct(trueYield.trueYield)}</span>
                        </td>
                      )}
                      <td className="p-3">
                        <p className="text-xs text-foreground/70 leading-snug italic">{profile.quickRead}</p>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── "O que esta análise mostra" ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(3)} className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4.5 w-4.5 text-primary" />
            <h3 className="text-base font-bold font-[var(--font-display)]">O que esta análise mostra</h3>
          </div>

          {/* Winner cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {getHighlightWinners(bairros).map((h, i) => {
              const IconMap: Record<string, React.ElementType> = { Scale, Crown, Rocket, Activity, TrendingUp, AlertTriangle };
              const Icon = IconMap[h.icon] || Lightbulb;
              const isRisky = h.icon === "AlertTriangle";
              return (
                <motion.div key={h.category} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={stagger(i, 0.06)}>
                  <Card className={`h-full ${isRisky ? "border-warning/20 bg-warning/[0.02]" : "border-border/50"}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isRisky ? "bg-warning-soft text-warning-strong" : "bg-primary/10 text-primary"}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{h.category}</p>
                          <p className="text-sm font-bold">{h.bairro}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">{h.value}</p>
                      <p className="text-xs text-foreground/70 leading-relaxed">{h.narrative}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Closing insight */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={stagger(4)}>
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4">
              <p className="text-xs text-center text-muted-foreground italic">
                "O melhor investimento não é o bairro mais famoso — é aquele que melhor equilibra retorno, demanda e estabilidade para o seu perfil."
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex items-center justify-between">
          <Link to="/ranking">
            <Button variant="outline" size="sm" className="text-xs gap-1">
              Ver ranking detalhado <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
          <Button onClick={onNext} className="gap-2">
            Personalizar por perfil <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};
