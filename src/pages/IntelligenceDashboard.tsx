import { useBairrosData, fmtBRL, fmtPct, fmtScore } from "@/hooks/useIntelligenceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Building2, TrendingUp, BarChart3, Target, ArrowRight, Home, ArrowLeft, Scale, Crown, Rocket, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { getHighlightWinners } from "@/lib/intelligenceInsights";
import { calculateAllScores } from "@/lib/investmentScore";
import IndicatorExplainerSection from "@/components/intelligence/IndicatorExplainerSection";
import { getGradeStyle, FOOTER_DISCLAIMER } from "@/lib/uiHelpers";
import { ComparativeNarrativesSection, StrategicLessonsSection, EducationalBanner, ContextualNote } from "@/components/intelligence/StorytellingComponents";

const ICON_MAP: Record<string, any> = { Scale, Crown, Rocket, Activity, TrendingUp };

const IntelligenceDashboard = () => {
  const { data: bairros, isLoading } = useBairrosData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando dados…</div>
      </div>
    );
  }

  if (!bairros?.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum dado disponível.</p>
      </div>
    );
  }

  const bestRent = bairros.reduce((a, b) => (a.score_rentabilidade > b.score_rentabilidade ? a : b));
  const bestLiq = bairros.reduce((a, b) => (a.score_liquidez > b.score_liquidez ? a : b));
  const bestCresc = bairros.reduce((a, b) => (a.score_crescimento_potencial > b.score_crescimento_potencial ? a : b));
  const avgADR = bairros.reduce((s, b) => s + Number(b.adr_medio_studio), 0) / bairros.length;
  const avgOcc = bairros.reduce((s, b) => s + Number(b.ocupacao_media_studio), 0) / bairros.length;

  const highlights = getHighlightWinners(bairros);

  const cards = [
    { label: "Bairros Analisados", value: bairros.length.toString(), icon: Building2, color: "text-primary" },
    { label: "Melhor Rentabilidade", value: bestRent.bairro, sub: fmtScore(bestRent.score_rentabilidade), icon: TrendingUp, color: "text-emerald-600" },
    { label: "Melhor Liquidez", value: bestLiq.bairro, sub: fmtScore(bestLiq.score_liquidez), icon: BarChart3, color: "text-blue-600" },
    { label: "Melhor Crescimento", value: bestCresc.bairro, sub: fmtScore(bestCresc.score_crescimento_potencial), icon: Target, color: "text-amber-600" },
    { label: "ADR Médio", value: fmtBRL(avgADR), sub: "Preço médio da diária", icon: Home, color: "text-primary" },
    { label: "Ocupação Média", value: fmtPct(avgOcc), sub: "% de dias alugados", icon: BarChart3, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-hero-gradient text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-[var(--font-display)]">Short Stay Intelligence</h1>
              <p className="mt-2 text-primary-foreground/80">São Paulo — Análise de investimento em short stay</p>
              <p className="mt-1 text-sm text-primary-foreground/60">Entenda o que realmente move o retorno no short stay.</p>
            </div>
            <Link to="/">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</p>
                      <p className="text-2xl font-bold mt-1">{c.value}</p>
                      {c.sub && <p className="text-sm text-muted-foreground">{c.sub}</p>}
                    </div>
                    <c.icon className={`h-5 w-5 ${c.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── Comparative Narratives ──────────────────── */}
        <ComparativeNarrativesSection bairros={bairros} />

        {/* ── Highlight winners as cards ──────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {highlights.map((h, i) => {
            const Icon = ICON_MAP[h.icon] || TrendingUp;
            return (
              <motion.div key={h.category} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                <Link to={`/intelligence/bairro/${encodeURIComponent(h.bairro)}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-l-4 border-l-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{h.category}</span>
                      </div>
                      <p className="font-bold">{h.bairro}</p>
                      <p className="text-xs text-muted-foreground">{h.value}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <ContextualNote sectionKey="profile_intro" />

        {/* Top 5 by Investment Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Top 5 — Investment Score</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Ranking combinando retorno, demanda, operação e potencial futuro</p>
            </div>
            <Link to="/intelligence/ranking">
              <Button variant="ghost" size="sm">
                Ver ranking completo <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const ranked = calculateAllScores(bairros);
                return ranked.slice(0, 5).map((item, i) => {
                  const b = item.bairro;
                  const s = item.investmentScore;
                  const badgeStyle = getGradeStyle(s.gradeColor);
                  return (
                    <Link key={b.bairro} to={`/intelligence/bairro/${encodeURIComponent(b.bairro)}`} className="block">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                          <div>
                            <p className="font-medium">{b.bairro}</p>
                            <p className="text-xs text-muted-foreground">ADR {fmtBRL(b.adr_medio_studio)} · Ocupação {fmtPct(b.ocupacao_media_studio)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{s.score.toFixed(1)}</span>
                          <Badge className={`${badgeStyle} text-xs`}>{s.grade}</Badge>
                        </div>
                      </motion.div>
                    </Link>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>

        {/* ── Didactic explainer ────────────────────── */}
        <IndicatorExplainerSection compact />

        {/* ── Strategic Lessons ──────────────────────── */}
        <StrategicLessonsSection bairros={bairros} />

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/intelligence/ranking">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Ranking Completo</p>
                  <p className="text-xs text-muted-foreground">Todos os bairros comparados</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/intelligence/listings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5 flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Base de Listings</p>
                  <p className="text-xs text-muted-foreground">Anúncios brutos coletados</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/intelligence/ranking">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5 flex items-center gap-3">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Comparar Bairros</p>
                  <p className="text-xs text-muted-foreground">Scores lado a lado</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* ── Disclaimer ──────────────────────────────── */}
        <footer className="border-t border-border/40 pt-6 pb-2 text-center">
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed max-w-2xl mx-auto">{FOOTER_DISCLAIMER}</p>
        </footer>
      </main>
    </div>
  );
};

export default IntelligenceDashboard;
