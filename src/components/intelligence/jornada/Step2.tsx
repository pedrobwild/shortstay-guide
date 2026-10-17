import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Scale, BookOpen, Lightbulb, ArrowRight, Shield, Sprout, AlertTriangle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { type BairroAirbnb } from "@/types/intelligence";
import { getHighlightWinners } from "@/lib/intelligenceInsights";
import { generateComparativeNarratives } from "@/lib/storytelling";
import { MicroNote } from "./shared";
import { ICON_MAP, stagger } from "./constantes";

// ═══════════════════════════════════════════════════════════════════
// STEP 2: DESTAQUES
// ═══════════════════════════════════════════════════════════════════

export const Step2Highlights = ({ bairros, onNext }: { bairros: BairroAirbnb[]; onNext: () => void }) => {
  const highlights = getHighlightWinners(bairros);
  const narratives = generateComparativeNarratives(bairros);

  const NARRATIVE_STYLE: Record<string, { border: string; bg: string; icon: React.ElementType }> = {
    insight: { border: "border-l-primary", bg: "bg-primary/[0.03]", icon: Lightbulb },
    comparison: { border: "border-l-info", bg: "bg-info/[0.04]", icon: BarChart3 },
    caution: { border: "border-l-warning", bg: "bg-warning/[0.04]", icon: AlertTriangle },
  };

  // Map category icons with distinct accent colors for visual triaging
  const CATEGORY_ACCENT: Record<string, string> = {
    "Melhor equilíbrio": "border-l-primary",
    "Bairro premium": "border-l-cat-1",
    "Maior retorno": "border-l-success",
    "Maior ocupação": "border-l-info",
    "Crescimento consistente": "border-l-warning",
    "Alerta de risco": "border-l-danger",
  };

  return (
    <div className="space-y-6">
      <MicroNote sectionKey="journey_highlights" />
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
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{h.category}</span>
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
                      <p className="text-xs text-foreground/70 leading-relaxed">{item.text}</p>
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
