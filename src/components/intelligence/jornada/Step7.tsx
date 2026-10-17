import { formatDecimal } from "@/lib/numberFormat";
import { bairroPath } from "@/lib/seo";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronRight, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { type BairroAirbnb } from "@/types/intelligence";
import { getBairroProfile } from "@/lib/intelligenceInsights";
import { calculateAllScores } from "@/lib/investmentScore";
import { getGradeStyle } from "@/lib/uiHelpers";
import { fmtPct } from "@/hooks/useIntelligenceData";
import { MicroNote } from "./shared";
import { stagger } from "./constantes";

// ═══════════════════════════════════════════════════════════════════
// STEP 7: EXPLORE
// ═══════════════════════════════════════════════════════════════════

export const Step7Explore = ({ bairros, onNext }: { bairros: BairroAirbnb[]; onNext: () => void }) => {
  const ranked = useMemo(() => calculateAllScores(bairros).slice(0, 5), [bairros]);

  return (
    <div className="space-y-6">
      <MicroNote sectionKey="journey_explore" />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-[var(--font-display)]">Explore em profundidade</h2>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Escolha um bairro para ver a análise completa: scores detalhados, gráficos de sazonalidade, 
              comparativo short stay vs aluguel, pontos de atenção e para qual perfil de investidor ele faz mais sentido.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ranked.map((item, i) => {
          const b = item.bairro;
          const s = item.investmentScore;
          const profile = getBairroProfile(b, bairros);
          const badgeStyle = getGradeStyle(s.gradeColor);
          return (
            <motion.div key={b.bairro} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(i)}>
              <Link to={bairroPath(b.bairro)}>
                <Card className="h-full hover:shadow-md transition-all group cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`${profile.color} ${profile.textColor} text-xs`}>{profile.label}</Badge>
                      <Badge className={`${badgeStyle} text-xs`}>{s.grade}</Badge>
                    </div>
                    <p className="text-lg font-bold group-hover:text-primary transition-colors">{b.bairro}</p>
                    <p className="text-2xl font-bold mt-1">{formatDecimal(s.score, 1)}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Yield {fmtPct(b.yield_bruto_airbnb)} · Ocupação {fmtPct(b.ocupacao_media_studio)}
                    </p>
                    <p className="text-xs text-primary mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver análise completa <ChevronRight className="h-3 w-3" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center">
        <Link to="/ranking">
          <Button variant="outline" size="sm" className="text-xs gap-1">
            Ver todos os {bairros.length} bairros <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} className="gap-2">
          Ver recomendação personalizada <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
