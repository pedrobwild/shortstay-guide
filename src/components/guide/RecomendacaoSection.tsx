import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Target, TrendingUp, Shield, AlertTriangle, CheckCircle2,
  ArrowRight, ExternalLink, Lightbulb, BarChart3, Zap,
} from "lucide-react";
import SectionBlock from "./SectionBlock";
import { useGuideDecision } from "@/hooks/useGuideDecision";
import { useBairrosData, fmtBRL, fmtPct } from "@/hooks/useIntelligenceData";
import { generateRecommendations, type Recommendation } from "@/lib/investorQuiz";
import { getBairroProfile } from "@/lib/intelligenceInsights";

export default function RecomendacaoSection() {
  const { investorProfile, quizAnswers, hasProfile, unitScore } = useGuideDecision();
  const { data: bairros } = useBairrosData();

  const recommendations = useMemo(() => {
    if (!bairros?.length || !investorProfile) return [];
    return generateRecommendations(bairros, investorProfile).slice(0, 3);
  }, [bairros, investorProfile]);

  if (!hasProfile) {
    return (
      <SectionBlock
        id="recomendacao"
        title="Recomendação Personalizada"
        takeaway="Complete o diagnóstico de perfil na Fase 2 para desbloquear recomendações personalizadas."
      >
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-8 text-center">
            <Target className="mx-auto text-muted-foreground/40 mb-3" size={40} />
            <p className="text-muted-foreground font-body text-sm">
              Responda o quiz de perfil acima para receber recomendações personalizadas de bairros.
            </p>
            <a href="#diagnostico" className="inline-block mt-3">
              <Button variant="outline" size="sm">
                <ArrowRight size={14} className="mr-1.5" /> Ir para o diagnóstico
              </Button>
            </a>
          </CardContent>
        </Card>
      </SectionBlock>
    );
  }

  return (
    <SectionBlock
      id="recomendacao"
      title="Recomendação Personalizada"
      takeaway={`Com base no seu perfil "${investorProfile!.name}", estes são os bairros mais aderentes à sua estratégia.`}
    >
      {/* Profile reminder */}
      <div className="flex items-center gap-2 mb-6 bg-primary/5 rounded-lg px-4 py-2.5">
        <Badge className={`${investorProfile!.color} ${investorProfile!.textColor} font-body text-xs`}>
          {investorProfile!.name}
        </Badge>
        <span className="text-xs text-muted-foreground font-body">
          Pesos: Retorno {Math.round(investorProfile!.weights.retorno * 100)}% · Demanda {Math.round(investorProfile!.weights.demanda * 100)}% · Operação {Math.round(investorProfile!.weights.operacao * 100)}% · Futuro {Math.round(investorProfile!.weights.futuro * 100)}%
        </span>
      </div>

      {/* Top 3 Recommendations */}
      <div className="space-y-4 mb-8">
        {recommendations.map((rec, i) => (
          <RecommendationCard key={rec.bairro.bairro} rec={rec} rank={i + 1} bairros={bairros!} />
        ))}
      </div>

      {/* Unit Score Integration */}
      {unitScore && unitScore.total > 0 && (
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Lightbulb className="text-primary" size={18} />
              <h4 className="font-display font-bold text-foreground text-sm">
                Cruzamento: Perfil × Unidade
              </h4>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              {unitScore.pct >= 80
                ? "A unidade que você avaliou tem score alto. Combinada com os bairros recomendados, o cenário é favorável para avançar."
                : unitScore.pct >= 50
                ? "A unidade tem pontos positivos, mas alguns critérios precisam de atenção. Revise os itens pendentes antes de decidir."
                : "A unidade avaliada tem gaps importantes. Considere buscar uma unidade com melhor aderência ao perfil de short stay."
              }
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${unitScore.pct}%` }}
                />
              </div>
              <span className="text-xs font-mono text-foreground font-semibold">{unitScore.total}/{unitScore.max}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA to Intelligence */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/intelligence" className="flex-1">
          <Button className="w-full" variant="default" size="lg">
            <BarChart3 size={16} className="mr-2" />
            Explorar Intelligence completo
            <ExternalLink size={12} className="ml-2 opacity-60" />
          </Button>
        </Link>
        <a href="#simulador" className="flex-1">
          <Button className="w-full" variant="outline" size="lg">
            <Zap size={16} className="mr-2" />
            Simular receita do bairro #1
          </Button>
        </a>
      </div>
    </SectionBlock>
  );
}

function RecommendationCard({
  rec, rank, bairros,
}: { rec: Recommendation; rank: number; bairros: any[] }) {
  const profile = getBairroProfile(rec.bairro, bairros);
  const medalColors = ["bg-amber-500", "bg-gray-400", "bg-amber-700"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: rank * 0.1 }}
    >
      <Card className={`border-border ${rank === 1 ? "ring-2 ring-primary/20 shadow-lg" : ""}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Rank medal */}
            <div className={`h-10 w-10 rounded-full ${medalColors[rank - 1]} flex items-center justify-center shrink-0 text-white font-display font-bold text-sm`}>
              #{rank}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-display font-bold text-foreground text-lg">{rec.bairro.bairro}</h4>
                <Badge className={`${profile.color} ${profile.textColor} font-body text-[10px]`}>
                  {profile.label}
                </Badge>
                <Badge variant="outline" className="font-body text-[10px]">
                  <span className={rec.gradeColor}>{rec.grade}</span> · {rec.personalizedScore.toFixed(0)}pts
                </Badge>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-3">
                <MetricPill label="Yield" value={fmtPct(rec.bairro.yield_bruto_airbnb)} />
                <MetricPill label="Ocupação" value={fmtPct(rec.bairro.ocupacao_media_studio)} />
                <MetricPill label="ADR" value={fmtBRL(Number(rec.bairro.adr_medio_studio))} />
                <MetricPill label="Liquidez" value={Number(rec.bairro.score_liquidez).toFixed(0)} />
              </div>

              {/* Reasons */}
              {rec.reasons.length > 0 && (
                <div className="space-y-1 mb-2">
                  {rec.reasons.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm font-body">
                      <CheckCircle2 size={13} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cautions */}
              {rec.cautions.length > 0 && (
                <div className="space-y-1">
                  {rec.cautions.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm font-body">
                      <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2 text-center">
      <p className="text-sm font-display font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground font-body">{label}</p>
    </div>
  );
}
