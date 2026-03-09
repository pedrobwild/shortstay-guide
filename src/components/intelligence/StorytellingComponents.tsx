import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle, Gem, Gauge, Scale, ShieldAlert, ArrowUpDown,
  TrendingUp, AlertTriangle, Lightbulb, BookOpen, Crown, Activity, Rocket, Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import type { BairroAirbnb } from "@/types/intelligence";
import {
  STRATEGIC_LESSONS,
  generateComparativeNarratives,
  type ComparativeNarrative,
} from "@/lib/storytelling";
import { PRODUCT } from "@/lib/productFoundation";
import { getHighlightWinners, getBairroProfile, getAllProfileDefs, type BairroProfileInfo } from "@/lib/intelligenceInsights";
import { calculateAllScores } from "@/lib/investmentScore";
import { Link } from "react-router-dom";

const LESSON_ICONS: Record<string, React.ElementType> = {
  AlertCircle, Gem, Gauge, Scale, ShieldAlert, ArrowUpDown,
};

const NARRATIVE_ICON: Record<string, React.ElementType> = {
  insight: Lightbulb,
  comparison: Scale,
  caution: AlertTriangle,
};

const NARRATIVE_STYLE: Record<string, { border: string; bg: string; dot: string }> = {
  insight: { border: "border-l-primary", bg: "bg-primary/[0.03]", dot: "bg-primary" },
  comparison: { border: "border-l-blue-500", bg: "bg-blue-50/50", dot: "bg-blue-500" },
  caution: { border: "border-l-amber-500", bg: "bg-amber-50/50", dot: "bg-amber-500" },
};

// ── Strategic Lessons Section ────────────────────────────────────
export const StrategicLessonsSection = ({ bairros }: { bairros: BairroAirbnb[] }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Principais aprendizados
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          O que os dados revelam sobre investimento em short stay — e que nem sempre é óbvio.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {STRATEGIC_LESSONS.map((lesson, i) => {
          const Icon = LESSON_ICONS[lesson.icon] || TrendingUp;
          const example = lesson.buildExample(bairros);
          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-border/60 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <p className="text-sm font-semibold text-foreground">{lesson.title}</p>
                  <p className="text-xs text-foreground/70 leading-relaxed">{lesson.explanation}</p>
                  {example && (
                    <div className="bg-muted/40 rounded-md p-2.5 mt-1">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        📊 <span className="font-medium">Na prática:</span> {example}
                      </p>
                    </div>
                  )}
                  <p className="text-xs font-medium text-primary pt-1">→ {lesson.takeaway}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
};

// ── Comparative Narratives (above the table) ─────────────────────
export const ComparativeNarrativesSection = ({ bairros }: { bairros: BairroAirbnb[] }) => {
  const narratives = generateComparativeNarratives(bairros);
  if (!narratives.length) return null;

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          O que esta análise mostra
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {PRODUCT.principle} Insights gerados automaticamente a partir dos dados.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {narratives.map((n, i) => {
          const style = NARRATIVE_STYLE[n.type];
          const Icon = NARRATIVE_ICON[n.type] || Lightbulb;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`flex gap-3 items-start p-3 rounded-lg border-l-4 ${style.border} ${style.bg}`}
            >
              <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-foreground/80 leading-relaxed">{n.text}</p>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
};

// ── Bairro Story Blocks (for detail page) ────────────────────────
export const BairroStoryCard = ({ title, text, type }: { title: string; text: string; type: "positive" | "neutral" | "caution" }) => {
  const styles = {
    positive: { icon: TrendingUp, border: "border-l-emerald-500", bg: "bg-emerald-50/50", iconColor: "text-emerald-600" },
    neutral: { icon: Lightbulb, border: "border-l-blue-400", bg: "bg-blue-50/30", iconColor: "text-blue-500" },
    caution: { icon: AlertTriangle, border: "border-l-amber-500", bg: "bg-amber-50/50", iconColor: "text-amber-600" },
  };
  const s = styles[type];
  return (
    <div className={`p-4 rounded-lg border-l-4 ${s.border} ${s.bg}`}>
      <div className="flex items-start gap-2.5">
        <s.icon className={`h-4 w-4 ${s.iconColor} mt-0.5 shrink-0`} />
        <div>
          <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
          <p className="text-xs text-foreground/70 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
};

// ── Inline educational microcopy ─────────────────────────────────
export const EducationalBanner = ({ message }: { message: string }) => (
  <div className="text-center py-3">
    <p className="text-xs text-muted-foreground italic">"{message}"</p>
  </div>
);
