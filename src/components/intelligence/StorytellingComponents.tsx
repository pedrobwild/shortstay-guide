import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle, Gem, Gauge, Scale, ShieldAlert, ArrowUpDown,
  TrendingUp, AlertTriangle, Lightbulb, BookOpen, Crown, Activity, Rocket, Zap, Info, Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import type { BairroAirbnb } from "@/types/intelligence";
import {
  STRATEGIC_LESSONS,
  generateComparativeNarratives,
  type ComparativeNarrative,
} from "@/lib/storytelling";
import { PRODUCT } from "@/lib/productFoundation";
import { getHighlightWinners, getBairroProfile, getAllProfileDefs, type BairroProfileInfo, SECTION_MICROCOPY } from "@/lib/intelligenceInsights";
import { calculateAllScores } from "@/lib/investmentScore";
import { getGradeStyle } from "@/lib/uiHelpers";
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
export const EducationalBanner = ({ message, type = "neutral" }: { message: string; type?: "neutral" | "insight" | "caution" | "opportunity" }) => {
  const styles = {
    neutral: "text-muted-foreground",
    insight: "text-primary/70",
    caution: "text-amber-600/80",
    opportunity: "text-emerald-600/80",
  };
  const icons = {
    neutral: null,
    insight: <Lightbulb className="h-3 w-3 inline mr-1" />,
    caution: <Shield className="h-3 w-3 inline mr-1" />,
    opportunity: <Zap className="h-3 w-3 inline mr-1" />,
  };
  return (
    <div className="text-center py-3">
      <p className={`text-xs italic ${styles[type]}`}>{icons[type]}"{message}"</p>
    </div>
  );
};

// ── Contextual note (for section transitions) ────────────────────
export const ContextualNote = ({ sectionKey }: { sectionKey: string }) => {
  const note = SECTION_MICROCOPY[sectionKey];
  if (!note) return null;
  return <EducationalBanner message={note.message} type={note.type} />;
};

// ── "O que esta análise mostra" section ─────────────────────────

const HIGHLIGHT_ICONS: Record<string, React.ElementType> = {
  Scale, Crown, Rocket, Activity, TrendingUp, AlertTriangle,
};

export const AnalysisSummarySection = ({ bairros }: { bairros: BairroAirbnb[] }) => {
  if (!bairros.length) return null;

  const highlights = getHighlightWinners(bairros);
  const ranked = calculateAllScores(bairros);
  const top3 = ranked.slice(0, 3);

  // Group bairros by profile
  const profileGroups = new Map<string, { profile: BairroProfileInfo; bairros: string[] }>();
  bairros.forEach(b => {
    const p = getBairroProfile(b, bairros);
    const existing = profileGroups.get(p.profile);
    if (existing) {
      existing.bairros.push(b.bairro);
    } else {
      profileGroups.set(p.profile, { profile: p, bairros: [b.bairro] });
    }
  });

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">O que esta análise mostra</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
          Com base nos dados de {bairros.length} bairros analisados, estas são as principais conclusões que o sistema identificou automaticamente.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Highlight winners as compact cards */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Destaques por categoria</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {highlights.map((h, i) => {
              const Icon = HIGHLIGHT_ICONS[h.icon] || TrendingUp;
              return (
                <motion.div key={h.category} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/intelligence/bairro/${encodeURIComponent(h.bairro)}`}>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer">
                      <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{h.category}</p>
                        <p className="font-bold text-sm">{h.bairro}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{h.value}</p>
                        <p className="text-xs text-foreground/70 mt-1 leading-relaxed">{h.narrative}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Top 3 by Investment Score */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Top 3 — Investment Score ajustado</p>
          <div className="space-y-2">
            {top3.map((item, i) => {
              const profile = getBairroProfile(item.bairro, bairros);
              const badgeStyle = getGradeStyle(item.investmentScore.gradeColor);
              return (
                <motion.div key={item.bairro.bairro} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
                  <Link to={`/intelligence/bairro/${encodeURIComponent(item.bairro.bairro)}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                        <div>
                          <p className="font-semibold text-sm">{item.bairro.bairro}</p>
                          <p className="text-xs text-muted-foreground">{profile.quickRead}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{item.investmentScore.score.toFixed(1)}</span>
                        <Badge className={`${gradeStyles[item.investmentScore.gradeColor] || "bg-muted"} text-[10px]`}>
                          {item.investmentScore.grade}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Profile distribution */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Distribuição por perfil</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(profileGroups.entries()).map(([key, { profile, bairros: names }]) => (
              <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40">
                <Badge className={`${profile.color} ${profile.textColor} text-[10px]`}>{profile.label}</Badge>
                <span className="text-xs text-muted-foreground">{names.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Closing narrative */}
        <div className="border-t border-border/50 pt-4">
          <p className="text-xs text-foreground/70 leading-relaxed italic">
            "O melhor investimento não é necessariamente o bairro mais caro ou com a maior diária — é aquele que melhor equilibra retorno, demanda, estabilidade operacional e potencial de crescimento para o seu perfil."
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
