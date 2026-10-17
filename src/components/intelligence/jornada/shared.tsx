/**
 * Componentes comuns às etapas da jornada de /mercado (antes dentro de JourneySteps.tsx).
 */
import type React from "react";
import { lazy } from "react";
import { Lightbulb, AlertTriangle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { SECTION_MICROCOPY } from "@/lib/intelligenceInsights";

export const InvestmentSimulator = lazy(() => import("@/components/intelligence/InvestmentSimulator"));

// ── Inline microcopy note for journey transitions ────────────────
const MICRO_ICONS: Record<string, React.ElementType> = { insight: Lightbulb, caution: AlertTriangle, opportunity: Sparkles };
const MICRO_STYLES: Record<string, string> = {
  insight: "border-primary/20 bg-primary/[0.02] text-foreground/70",
  caution: "border-warning/20 bg-warning/[0.02] text-foreground/70",
  opportunity: "border-success/20 bg-success/[0.02] text-foreground/70",
};
export const MicroNote = ({ sectionKey }: { sectionKey: string }) => {
  const note = SECTION_MICROCOPY[sectionKey];
  if (!note) return null;
  const Icon = MICRO_ICONS[note.type] || Lightbulb;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
      <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border ${MICRO_STYLES[note.type]}`}>
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" />
        <p className="text-xs leading-relaxed italic">{note.message}</p>
      </div>
    </motion.div>
  );
};
