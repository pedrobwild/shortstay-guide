/**
 * Investment Score UI components
 * Phase 4: Visual representation of the central score
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap, CalendarCheck, Sprout, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import type { InvestmentScoreResult } from "@/lib/investmentScore";
import { PILLARS, getGradeExplanation } from "@/lib/investmentScore";
import { getGradeStyle } from "@/lib/uiHelpers";

const PILLAR_ICONS: Record<string, React.ElementType> = {
  TrendingUp, Zap, CalendarCheck, Sprout,
};

// ── Large Score Display (for detail page) ────────────────────────
export const InvestmentScoreHero = ({ result, bairro }: { result: InvestmentScoreResult; bairro: string }) => {
  return (
    <Card className="border-primary/20 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Score circle */}
          <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-primary/[0.04] sm:min-w-[200px]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Investment Score</p>
            <div className="relative">
              <svg viewBox="0 0 120 120" className="h-28 w-28">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(result.score / 100) * 327} 327`}
                  transform="rotate(-90 60 60)"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{result.score.toFixed(1)}</span>
                <span className={`text-lg font-bold ${result.gradeColor}`}>{result.grade}</span>
              </div>
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground mt-1">{result.gradeLabel}</p>
            <p className="text-xs text-muted-foreground mt-1 text-center max-w-[160px]">
              {getGradeExplanation(result.grade).split(".")[0]}.
            </p>
          </div>

          {/* Pillars breakdown */}
          <div className="flex-1 p-5 sm:p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Composição do score</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O Investment Score combina quatro pilares para responder: "esse bairro parece bom para investir?". Cada pilar tem um peso proporcional à sua importância na decisão.
              </p>
            </div>

            <div className="space-y-3">
              {PILLARS.map((pillar, i) => {
                const data = result.pillars[i];
                const Icon = PILLAR_ICONS[pillar.icon] || TrendingUp;
                return (
                  <motion.div
                    key={pillar.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${pillar.color}`} />
                        <span className="text-xs font-medium">{pillar.label}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[200px] text-xs">
                            <p className="font-semibold mb-0.5">{pillar.friendlyName}</p>
                            <p className="text-muted-foreground">{pillar.description}</p>
                            <p className="mt-1 font-medium">Peso: {(pillar.weight * 100).toFixed(0)}%</p>
                          </TooltipContent>
                        </Tooltip>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{(pillar.weight * 100).toFixed(0)}%</Badge>
                      </div>
                      <span className="text-xs font-bold">{data.normalized.toFixed(0)}</span>
                    </div>
                    <Progress value={data.normalized} className="h-1.5" />
                  </motion.div>
                );
              })}
            </div>

            <p className="text-xs text-foreground/70 leading-relaxed pt-2 border-t border-border/50">
              {result.narrative}
            </p>
            {(result.confidenceFactor < 1 || result.liquidityRiskFactor < 1) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {result.confidenceFactor < 1 && (
                  <Badge variant="outline" className="text-[9px] text-amber-700 border-amber-300 bg-amber-50">
                    Confiança: {(result.confidenceFactor * 100).toFixed(0)}%
                  </Badge>
                )}
                {result.liquidityRiskFactor < 1 && (
                  <Badge variant="outline" className="text-[9px] text-orange-700 border-orange-300 bg-orange-50">
                    Risco liquidez: −{((1 - result.liquidityRiskFactor) * 100).toFixed(0)}%
                  </Badge>
                )}
                <Badge variant="outline" className="text-[9px] text-muted-foreground">
                  Score bruto: {result.rawScore.toFixed(1)}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ── Compact Score Badge (for table/ranking) ──────────────────────
export const InvestmentScoreBadge = ({ score, grade, gradeColor }: { score: number; grade: string; gradeColor: string }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-sm font-bold">{score.toFixed(1)}</span>
    <span className={`text-xs font-bold ${gradeColor} bg-current/10 px-1.5 py-0.5 rounded`}>
      <span className={gradeColor}>{grade}</span>
    </span>
  </div>
);

// ── Mini Score Card (for dashboard) ──────────────────────────────
export const InvestmentScoreMini = ({ bairro, score, grade, gradeColor }: { bairro: string; score: number; grade: string; gradeColor: string }) => (
  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
    <span className="text-sm font-medium">{bairro}</span>
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold">{score.toFixed(1)}</span>
      <Badge className={`${gradeColor === "text-emerald-600" ? "bg-emerald-100 text-emerald-800" : gradeColor === "text-blue-600" ? "bg-blue-100 text-blue-800" : gradeColor === "text-amber-600" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"} text-xs`}>
        {grade}
      </Badge>
    </div>
  </div>
);
