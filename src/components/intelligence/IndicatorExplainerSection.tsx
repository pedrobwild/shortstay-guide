import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INDICATOR_EXPLAINERS } from "@/lib/intelligenceInsights";
import { PRODUCT } from "@/lib/productFoundation";
import { BookOpen, ChevronDown, ChevronUp, DollarSign, CalendarCheck, TrendingUp, ArrowUpRight, Target, Zap, Sprout, ShieldCheck, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP: Record<string, React.ElementType> = {
  DollarSign, CalendarCheck, TrendingUp, ArrowUpRight, Target, Zap, Sprout, ShieldCheck,
};

interface Props {
  /** Start open or collapsed */
  defaultOpen?: boolean;
  /** Compact mode hides "common mistake" and "how to read" */
  compact?: boolean;
}

const IndicatorExplainerSection = ({ defaultOpen = false, compact = false }: Props) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader className="cursor-pointer pb-2" onClick={() => setOpen(!open)}>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Como entender esta análise
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {open ? "Veja o significado de cada indicador em linguagem simples" : "Clique para ver o significado de cada indicador"}
        </p>
      </CardHeader>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <CardContent className="pt-0 space-y-4">
              {/* Intro text */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {PRODUCT.mission.split("—")[0].trim()}. Abaixo, cada indicador explicado de forma simples para que você possa interpretar os dados com confiança.
              </p>

              <div className={`grid grid-cols-1 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"} gap-3`}>
                {INDICATOR_EXPLAINERS.map((ind) => {
                  const Icon = ICON_MAP[ind.icon] || TrendingUp;
                  return (
                    <div key={ind.key} className="border border-border/60 rounded-lg p-4 space-y-2 bg-card">
                      {/* Header */}
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{ind.title}</p>
                          <p className="text-sm font-semibold text-foreground">{ind.friendlyTitle}</p>
                        </div>
                      </div>

                      {/* What it is */}
                      <p className="text-xs text-foreground/80 leading-relaxed">{ind.whatItIs}</p>

                      {/* Why it matters */}
                      <div className="bg-primary/[0.04] rounded-md p-2.5">
                        <p className="text-[11px] font-semibold text-primary mb-0.5">Por que importa</p>
                        <p className="text-[11px] text-foreground/70 leading-relaxed">{ind.whyItMatters}</p>
                      </div>

                      {/* How to read (non-compact only) */}
                      {!compact && (
                        <div className="bg-muted/40 rounded-md p-2.5">
                          <p className="text-[11px] font-semibold text-foreground mb-0.5">Como ler</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{ind.howToRead}</p>
                        </div>
                      )}

                      {/* Example */}
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-[11px] text-muted-foreground italic">💡 {ind.example}</p>
                      </div>

                      {/* Common mistake (non-compact only) */}
                      {!compact && (
                        <div className="flex gap-1.5 items-start">
                          <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-amber-700 leading-relaxed">{ind.commonMistake}</p>
                        </div>
                      )}

                      {/* Key message */}
                      <p className="text-xs font-medium text-foreground/80 pt-1 border-t border-border/40">→ {ind.keyMessage}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default IndicatorExplainerSection;
