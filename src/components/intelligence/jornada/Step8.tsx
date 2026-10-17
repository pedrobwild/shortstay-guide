import { formatDecimal } from "@/lib/numberFormat";
import { bairroPath } from "@/lib/seo";
import React, { useState, useMemo, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, BarChart3, Target, Scale, Crown, Rocket, Activity, Zap, Lightbulb, ChevronRight, Shield, Sprout, AlertTriangle, CheckCircle, Sparkles, Info, FlaskConical } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { type BairroAirbnb } from "@/types/intelligence";
import { getHighlightWinners } from "@/lib/intelligenceInsights";
import { calculateTrueYield, PILLARS } from "@/lib/investmentScore";
import { getGradeStyle, FOOTER_DISCLAIMER } from "@/lib/uiHelpers";
import { resolveProfile, generateRecommendations, type QuizAnswers, type InvestorProfile, type Recommendation } from "@/lib/investorQuiz";
import { fmtBRL, fmtPct } from "@/hooks/useIntelligenceData";
import { InvestmentSimulator, MicroNote } from "./shared";
import { ICON_MAP, stagger } from "./constantes";

// ═══════════════════════════════════════════════════════════════════
// STEP 8: RECOMENDAÇÃO
// ═══════════════════════════════════════════════════════════════════

interface Step8Props {
  bairros: BairroAirbnb[];
  profile: InvestorProfile | null;
  answers: QuizAnswers | null;
}

export const Step8Recommendation = ({ bairros, profile, answers }: Step8Props) => {
  const finalProfile = profile || resolveProfile({ objective: "equilibrio", risk: "moderado", priority: "retorno" });
  const [showTrueYield, setShowTrueYield] = useState(false);
  const recommendations = useMemo(
    () => generateRecommendations(bairros, finalProfile).slice(0, 3),
    [bairros, finalProfile]
  );

  const ProfileIcon = ICON_MAP[finalProfile.icon] || Scale;

  return (
    <div className="space-y-6">
      <MicroNote sectionKey="journey_recommendation" />
      {/* Profile summary */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-xl ${finalProfile.color} flex items-center justify-center shrink-0`}>
                <ProfileIcon className={`h-6 w-6 ${finalProfile.textColor}`} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Seu perfil</p>
                <h2 className="text-lg font-bold font-[var(--font-display)]">{finalProfile.name}</h2>
                <p className="text-sm text-foreground/70 leading-relaxed mt-1">{finalProfile.description}</p>
              </div>
            </div>

            {/* Why this profile — based on quiz answers */}
            {answers && (
              <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/40 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" /> Por que este perfil?
                </p>
                <div className="space-y-2">
                  {(() => {
                    const answerExplanations: { question: string; answer: string; impact: string }[] = [];
                    
                    const objLabels: Record<string, { answer: string; impact: string }> = {
                      renda: { answer: "Renda passiva", impact: "Priorizamos bairros com yield alto e ocupação constante para gerar fluxo de caixa mensal." },
                      valorizacao: { answer: "Valorização do patrimônio", impact: "Priorizamos bairros com maior potencial de crescimento e valorização imobiliária a longo prazo." },
                      equilibrio: { answer: "Equilíbrio entre renda e valorização", impact: "Balanceamos retorno atual com potencial futuro, buscando bairros que performam bem nos dois eixos." },
                    };
                    const riskLabels: Record<string, { answer: string; impact: string }> = {
                      conservador: { answer: "Conservador", impact: "Aumentamos o peso de liquidez e demanda estável, reduzindo exposição a bairros com maior volatilidade." },
                      moderado: { answer: "Moderado", impact: "Mantemos um equilíbrio saudável entre retorno e segurança, sem extremos." },
                      arrojado: { answer: "Arrojado", impact: "Maximizamos o peso de retorno, aceitando bairros com maior risco em troca de yield potencialmente superior." },
                    };
                    const prioLabels: Record<string, { answer: string; impact: string }> = {
                      fluxo: { answer: "Fluxo constante de receita", impact: "Reforçamos ocupação e demanda — bairros que ficam vazios por muito tempo são penalizados." },
                      retorno: { answer: "Maior retorno percentual", impact: "O yield bruto ganha peso extra — buscamos o maior retorno sobre cada real investido." },
                      facilidade: { answer: "Facilidade de operação", impact: "Valorizamos bairros com demanda orgânica forte e menor necessidade de gestão ativa." },
                    };

                    if (objLabels[answers.objective]) {
                      answerExplanations.push({ question: "Objetivo", ...objLabels[answers.objective] });
                    }
                    if (riskLabels[answers.risk]) {
                      answerExplanations.push({ question: "Risco", ...riskLabels[answers.risk] });
                    }
                    if (prioLabels[answers.priority]) {
                      answerExplanations.push({ question: "Prioridade", ...prioLabels[answers.priority] });
                    }

                    return answerExplanations.map((exp, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          <Badge variant="outline" className="text-[9px] font-semibold px-1.5 py-0">{exp.question}</Badge>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{exp.answer}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{exp.impact}</p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Weight visualization */}
            <div className="mt-5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">
                Pesos aplicados no seu ranking personalizado
              </p>
              <div className="grid grid-cols-4 gap-2">
                {PILLARS.map(p => {
                  const w = finalProfile.weights[p.key as keyof typeof finalProfile.weights];
                  const Icon = ICON_MAP[p.icon] || TrendingUp;
                  const pctValue = formatDecimal((w * 100), 0);
                  const dominant = Math.max(...Object.values(finalProfile.weights)) === w;
                  return (
                    <div key={p.key} className={`text-center p-2.5 rounded-lg transition-colors ${dominant ? "bg-primary/[0.06] ring-1 ring-primary/20" : "bg-muted/30"}`}>
                      <Icon className={`h-4 w-4 ${p.color} mx-auto mb-1`} />
                      <p className={`text-sm font-bold ${dominant ? "text-primary" : ""}`}>{pctValue}%</p>
                      <p className="text-[10px] text-muted-foreground">{p.label}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                Esses pesos determinam como os bairros são ranqueados para você. O pilar com maior peso tem mais influência 
                no score personalizado — bairros fortes nesse critério sobem no ranking.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── "E se?" — Ranking comparison under different profiles ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {(() => {
          const ALTERNATIVE_PROFILES: { key: string; name: string; shortName: string; icon: React.ElementType; weights: InvestorProfile["weights"] }[] = [
            { key: "conservador", name: "Conservador (liquidez)", shortName: "Conservador", icon: Shield, weights: { retorno: 0.20, demanda: 0.35, operacao: 0.30, futuro: 0.15 } },
            { key: "equilibrado", name: "Equilibrado", shortName: "Equilibrado", icon: Scale, weights: { retorno: 0.35, demanda: 0.25, operacao: 0.20, futuro: 0.20 } },
            { key: "agressivo", name: "Agressivo (yield)", shortName: "Agressivo", icon: Rocket, weights: { retorno: 0.50, demanda: 0.15, operacao: 0.20, futuro: 0.15 } },
            { key: "crescimento", name: "Crescimento (futuro)", shortName: "Crescimento", icon: Sprout, weights: { retorno: 0.15, demanda: 0.25, operacao: 0.20, futuro: 0.40 } },
          ];

          // Rank bairros under each profile
          const rankUnder = (weights: InvestorProfile["weights"]) => {
            const yields = bairros.map(b => Number(b.yield_bruto_airbnb));
            const liquidities = bairros.map(b => Number(b.score_liquidez));
            const occupancies = bairros.map(b => Number(b.ocupacao_media_studio));
            const growths = bairros.map(b => Number(b.score_crescimento_potencial));
            const mm = (arr: number[]) => ({ min: Math.min(...arr), max: Math.max(...arr) });
            const yB = mm(yields), lB = mm(liquidities), oB = mm(occupancies), gB = mm(growths);
            const norm = (v: number, mn: number, mx: number) => mx === mn ? 50 : Math.max(0, Math.min(100, ((v - mn) / (mx - mn)) * 100));

            return bairros
              .map(b => ({
                bairro: b.bairro,
                score: norm(Number(b.yield_bruto_airbnb), yB.min, yB.max) * weights.retorno +
                       norm(Number(b.score_liquidez), lB.min, lB.max) * weights.demanda +
                       norm(Number(b.ocupacao_media_studio), oB.min, oB.max) * weights.operacao +
                       norm(Number(b.score_crescimento_potencial), gB.min, gB.max) * weights.futuro,
              }))
              .sort((a, b) => b.score - a.score)
              .map((item, i) => ({ ...item, rank: i + 1 }));
          };

          const currentRanking = rankUnder(finalProfile.weights);
          const altRankings = ALTERNATIVE_PROFILES.map(p => ({
            ...p,
            ranking: rankUnder(p.weights),
            isCurrent: JSON.stringify(p.weights) === JSON.stringify(finalProfile.weights),
          }));

          // Top 5 from current profile
          const top5 = currentRanking.slice(0, 5);

          return (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-bold">E se o seu perfil fosse diferente?</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Veja como os mesmos bairros mudam de posição dependendo dos pesos aplicados. 
                  Isso mostra por que a escolha do perfil importa na leitura dos dados.
                </p>

                {/* Comparison table */}
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 px-2 font-semibold text-muted-foreground w-28">Bairro</th>
                        {altRankings.map(p => {
                          const PIcon = p.icon;
                          return (
                            <th key={p.key} className={`text-center py-2 px-1.5 font-medium ${p.isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                              <div className="flex flex-col items-center gap-0.5">
                                <PIcon className="h-3.5 w-3.5" />
                                <span className="text-[9px] leading-tight">{p.shortName}</span>
                                {p.isCurrent && <span className="text-[8px] text-primary font-bold">(você)</span>}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {top5.map((item) => (
                        <tr key={item.bairro} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-2 font-semibold text-foreground whitespace-nowrap">{item.bairro}</td>
                          {altRankings.map(p => {
                            const altItem = p.ranking.find(r => r.bairro === item.bairro);
                            const altRank = altItem?.rank ?? 0;
                            const currentRank = item.rank;
                            const diff = currentRank - altRank; // positive = moved up in alt

                            return (
                              <td key={p.key} className={`text-center py-2 px-1.5 ${p.isCurrent ? "bg-primary/[0.03]" : ""}`}>
                                <span className="font-bold">#{altRank}</span>
                                {!p.isCurrent && diff !== 0 && (
                                  <span className={`ml-1 text-[10px] font-medium ${diff > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                                    {diff > 0 ? `↑${diff}` : `↓${Math.abs(diff)}`}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Insight callout */}
                {(() => {
                  // Find the bairro with biggest position swing
                  let maxSwing = 0;
                  let swingBairro = "";
                  let swingFrom = "";
                  let swingTo = "";
                  let swingDiff = 0;

                  top5.forEach(item => {
                    altRankings.forEach(p => {
                      if (p.isCurrent) return;
                      const altItem = p.ranking.find(r => r.bairro === item.bairro);
                      if (!altItem) return;
                      const diff = Math.abs(item.rank - altItem.rank);
                      if (diff > maxSwing) {
                        maxSwing = diff;
                        swingBairro = item.bairro;
                        swingFrom = `#${item.rank}`;
                        swingTo = `#${altItem.rank}`;
                        swingDiff = item.rank - altItem.rank;
                        swingFrom = p.shortName;
                      }
                    });
                  });

                  if (maxSwing >= 2) {
                    return (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/[0.04] border border-primary/10">
                        <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <p className="text-[11px] text-foreground/70 leading-relaxed">
                          <strong>{swingBairro}</strong> é o bairro que mais muda de posição entre os perfis — 
                          variação de até <strong>{maxSwing} posições</strong>. Isso indica que ele performa muito bem 
                          em alguns critérios mas não em outros. {swingDiff > 0 
                            ? "Um perfil mais focado em seus pontos fortes o beneficiaria."
                            : "Seu perfil atual já captura bem o potencial desse bairro."}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </CardContent>
            </Card>
          );
        })()}
      </motion.div>

      {/* ── Investment Simulator ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Suspense fallback={
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Carregando simulador...</CardContent></Card>
        }>
          <InvestmentSimulator
            bairros={bairros}
            selectedBairro={recommendations[0]?.bairro}
          />
        </Suspense>
      </motion.div>

      {/* True Yield toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          🏆 Top 3 bairros para o seu perfil
        </p>
        <button
          onClick={() => setShowTrueYield(!showTrueYield)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-dashed border-primary/30 bg-primary/[0.02] hover:bg-primary/[0.05] transition-colors text-[10px]"
        >
          <FlaskConical className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground font-medium">
            {showTrueYield ? "Ocultar" : "Ver"} True Yield
          </span>
        </button>
      </div>
      
      <div className="space-y-4">
        {recommendations.map((rec, i) => {
          const badgeStyle = getGradeStyle(rec.gradeColor);
          const trueYield = showTrueYield ? calculateTrueYield(rec.bairro) : null;
          return (
            <motion.div key={rec.bairro.bairro} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={stagger(i, 0.1)}>
              <Card className={`${i === 0 ? "ring-2 ring-primary/30 border-primary/20" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-bold ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                        #{i + 1}
                      </span>
                      <div>
                        <p className="text-lg font-bold">{rec.bairro.bairro}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={`${badgeStyle} text-[10px]`}>{rec.grade}</Badge>
                          <Badge variant="outline" className="text-[10px]">{rec.profileLabel}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatDecimal(rec.personalizedScore, 1)}</p>
                      <p className="text-[10px] text-muted-foreground">Score personalizado</p>
                    </div>
                  </div>

                  {/* Key metrics */}
                  <div className={`grid ${showTrueYield ? "grid-cols-4" : "grid-cols-3"} gap-3 mb-4`}>
                    <div className="text-center p-2 rounded-lg bg-muted/40">
                      <p className="text-[10px] text-muted-foreground">Yield</p>
                      <p className="text-sm font-bold">{fmtPct(rec.bairro.yield_bruto_airbnb)}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/40">
                      <p className="text-[10px] text-muted-foreground">Ocupação</p>
                      <p className="text-sm font-bold">{fmtPct(rec.bairro.ocupacao_media_studio)}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/40">
                      <p className="text-[10px] text-muted-foreground">Diária</p>
                      <p className="text-sm font-bold">{fmtBRL(rec.bairro.adr_medio_studio)}</p>
                    </div>
                    {trueYield && (
                      <div className="text-center p-2 rounded-lg bg-primary/[0.06] border border-primary/10">
                        <p className="text-[10px] text-primary/70 flex items-center justify-center gap-0.5">
                          <FlaskConical className="h-2.5 w-2.5" /> True Yield
                        </p>
                        <p className="text-sm font-bold text-primary">{fmtPct(trueYield.trueYield)}</p>
                        <p className={`text-[9px] font-medium ${trueYield.delta > 0 ? "text-emerald-600" : trueYield.delta < -0.005 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {trueYield.delta > 0 ? "+" : ""}{formatDecimal((trueYield.delta * 100), 1)}pp vs Yield
                        </p>
                      </div>
                    )}
                  </div>

                  {/* True Yield insight */}
                  {trueYield && (
                    <div className="mb-3 p-2.5 rounded-lg bg-muted/30 border border-dashed border-primary/15">
                      <p className="text-[11px] text-foreground/70 leading-relaxed">
                        <FlaskConical className="h-3 w-3 text-primary inline mr-1" />
                        {trueYield.comparison}
                      </p>
                    </div>
                  )}

                  {/* Reasons */}
                  <div className="space-y-1.5 mb-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Por que este bairro</p>
                    {rec.reasons.map((r, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-foreground/80">{r}</p>
                      </div>
                    ))}
                  </div>

                  {/* Cautions */}
                  {rec.cautions.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pontos de atenção</p>
                      {rec.cautions.map((c, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-foreground/60">{c}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-border/50">
                    <Link to={bairroPath(rec.bairro.bairro)}>
                      <Button variant="outline" size="sm" className="text-xs w-full gap-1">
                        Ver análise completa de {rec.bairro.bairro} <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ── Leitura final ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={stagger(3, 0.15)} className="space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold font-[var(--font-display)]">Leitura final</h3>
        </div>

        {/* Winners by category */}
        {(() => {
          const winners = getHighlightWinners(bairros);
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {winners.map((w, i) => {
                const IconMap: Record<string, React.ElementType> = { Scale, Crown, Rocket, Activity, TrendingUp, AlertTriangle };
                const Icon = IconMap[w.icon] || Lightbulb;
                const isRisky = w.icon === "AlertTriangle";
                return (
                  <motion.div key={w.category} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={stagger(i, 0.05)}>
                    <Link to={bairroPath(w.bairro)}>
                      <Card className={`h-full hover:shadow-md transition-all group cursor-pointer ${isRisky ? "border-amber-500/20" : "border-border/50"}`}>
                        <CardContent className="p-4 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${isRisky ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{w.category}</p>
                          </div>
                          <p className="text-sm font-bold group-hover:text-primary transition-colors">{w.bairro}</p>
                          <p className="text-[10px] text-muted-foreground">{w.value}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          );
        })()}

        {/* Recommendation by profile intent */}
        <Card className="border-primary/15">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold">Próximo passo para decisão</p>
            </div>
            {(() => {
              const winners = getHighlightWinners(bairros);
              const equilibrio = winners.find(w => w.category.includes("equilíbrio"))?.bairro ?? "—";
              const premium = winners.find(w => w.category.includes("premium"))?.bairro ?? "—";
              const retorno = winners.find(w => w.category.includes("retorno"))?.bairro ?? "—";
              const ocupacao = winners.find(w => w.category.includes("ocupação"))?.bairro ?? "—";
              const risco = winners.find(w => w.category.includes("risco"))?.bairro ?? retorno;
              const crescimento = winners.find(w => w.category.includes("rescimento"))?.bairro ?? "—";

              const profileAdvice = [
                { label: "Se você quer equilíbrio", bairro: equilibrio, text: `${equilibrio} tende a ser a leitura mais forte — retorno consistente com risco controlado.`, icon: Scale },
                { label: "Se você quer retorno", bairro: retorno, text: `${retorno} apresenta o yield mais agressivo da amostra. Avalie a liquidez antes de decidir.`, icon: TrendingUp },
                { label: "Se você quer liquidez", bairro: ocupacao, text: `${ocupacao} mantém ocupação acima da média — fluxo de caixa mais previsível.`, icon: Zap },
                { label: "Se você quer bairro premium", bairro: premium, text: `${premium} se destaca por diárias mais altas e forte percepção de valor.`, icon: Crown },
                { label: "Se você aceita mais risco", bairro: risco, text: `${risco} pode entregar retorno forte, mas exige maior tolerância a incerteza.`, icon: Rocket },
                { label: "Se você pensa no futuro", bairro: crescimento, text: `${crescimento} mostra os melhores sinais de valorização e expansão de demanda.`, icon: Sprout },
              ];

              return (
                <div className="space-y-3">
                  {profileAdvice.map((a, i) => {
                    const Icon = a.icon;
                    return (
                      <motion.div key={a.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={stagger(i, 0.05)}>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-foreground">{a.label}</p>
                            <p className="text-[11px] text-foreground/70 leading-relaxed mt-0.5">{a.text}</p>
                          </div>
                          <Link to={bairroPath(a.bairro)} className="shrink-0 ml-auto self-center">
                            <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2 gap-0.5">
                              Ver <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Narrative closing */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Card className="bg-gradient-to-br from-primary/[0.04] to-transparent border-primary/10">
            <CardContent className="p-6 text-center space-y-3">
              {(() => {
                const winners = getHighlightWinners(bairros);
                const eq = winners.find(w => w.category.includes("equilíbrio"))?.bairro;
                const pr = winners.find(w => w.category.includes("premium"))?.bairro;
                const rt = winners.find(w => w.category.includes("retorno"))?.bairro;
                return (
                  <p className="text-sm text-foreground/80 leading-relaxed italic max-w-xl mx-auto">
                    "Se você busca equilíbrio entre retorno e estabilidade, {eq} tende a ser a leitura mais forte. 
                    Se busca diárias premium e percepção de valor, {pr} pode fazer mais sentido. 
                    Se aceita mais risco por maior retorno, {rt} aparece como alternativa mais agressiva."
                  </p>
                );
              })()}
              <p className="text-[11px] text-muted-foreground">{FOOTER_DISCLAIMER}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/ranking">
          <Button variant="outline" size="sm" className="text-xs gap-1">
            <BarChart3 className="h-3.5 w-3.5" /> Ranking completo
          </Button>
        </Link>
        <Link to="/anuncios">
          <Button variant="outline" size="sm" className="text-xs gap-1">
            <Building2 className="h-3.5 w-3.5" /> Base de listings
          </Button>
        </Link>
      </div>
    </div>
  );
};
