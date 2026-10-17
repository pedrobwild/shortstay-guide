import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, Lightbulb, ArrowRight, Shield, ArrowUpRight, Gauge, AlertTriangle, CheckCircle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type BairroAirbnb } from "@/types/intelligence";
import { STRATEGIC_LESSONS } from "@/lib/storytelling";
import { MicroNote } from "./shared";
import { stagger } from "./constantes";

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
      <MicroNote sectionKey="journey_learnings" />
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
                              <p className="text-xs font-semibold text-primary mb-1">📊 Nos dados reais</p>
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
