import { useMemo, useRef } from "react";
import { useBairrosData, fmtBRL, fmtPct, fmtScore } from "@/hooks/useIntelligenceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Building2, TrendingUp, BarChart3, Target, ArrowRight, Home, ArrowLeft,
  Scale, Crown, Rocket, Activity, Zap, BookOpen, Lightbulb, ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { getHighlightWinners, getBairroProfile } from "@/lib/intelligenceInsights";
import { calculateAllScores } from "@/lib/investmentScore";
import IndicatorExplainerSection from "@/components/intelligence/IndicatorExplainerSection";
import MethodologySection from "@/components/intelligence/MethodologySection";
import { getGradeStyle, FOOTER_DISCLAIMER } from "@/lib/uiHelpers";
import {
  ComparativeNarrativesSection,
  StrategicLessonsSection,
  ContextualNote,
} from "@/components/intelligence/StorytellingComponents";

const ICON_MAP: Record<string, any> = { Scale, Crown, Rocket, Activity, TrendingUp };

const SECTION_NAV = [
  { id: "overview", label: "Visão geral", icon: Zap },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "ranking", label: "Ranking", icon: BarChart3 },
  { id: "methodology", label: "Metodologia", icon: BookOpen },
];

const SectionLabel = ({ number, title, subtitle }: { number: string; title: string; subtitle: string }) => (
  <div className="flex items-start gap-3 mb-5">
    <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
      {number}
    </span>
    <div>
      <h2 className="text-lg font-bold text-foreground font-[var(--font-display)]">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  </div>
);

const IntelligenceDashboard = () => {
  const { data: bairros, isLoading } = useBairrosData();

  const ranked = useMemo(() => (bairros?.length ? calculateAllScores(bairros) : []), [bairros]);
  const highlights = useMemo(() => (bairros?.length ? getHighlightWinners(bairros) : []), [bairros]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <div className="h-8 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 bg-muted/70 rounded animate-pulse w-3/4" />
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
          </div>
        </div>
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
  const top1 = ranked[0];

  return (
    <div className="min-h-screen bg-background">
      {/* ── HERO ──────────────────────────────────────────── */}
      <header className="bg-hero-gradient text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(200_60%_35%_/_0.3),_transparent_70%)]" />
        <div className="container mx-auto px-4 py-10 md:py-14 relative z-10">
          <div className="flex items-start justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 text-[10px] uppercase tracking-wider">
                  {bairros.length} bairros · 30+ variáveis
                </Badge>
                {bairros[0] && (
                  <Badge className="bg-primary-foreground/10 text-primary-foreground/70 border-primary-foreground/10 text-[10px]">
                    {bairros[0].periodo_inicio} – {bairros[0].periodo_fim}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-[var(--font-display)] leading-tight">
                Short Stay Intelligence
              </h1>
              <p className="mt-3 text-primary-foreground/80 text-base md:text-lg leading-relaxed max-w-xl">
                Análise quantitativa dos melhores bairros de São Paulo para investimento em studios de short stay.
              </p>
              <p className="mt-2 text-sm text-primary-foreground/50">
                Dados reais · Score ponderado · Perfis estratégicos
              </p>
            </div>
            <Link to="/" className="shrink-0">
              <Button variant="secondary" size="sm" className="shadow-lg">
                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
            </Link>
          </div>

          {/* Hero highlight: #1 bairro */}
          {top1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 inline-flex items-center gap-4 bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-primary-foreground/10"
            >
              <div>
                <p className="text-[10px] uppercase tracking-widest text-primary-foreground/50">Melhor Investment Score</p>
                <p className="text-xl font-bold">{top1.bairro.bairro}</p>
              </div>
              <div className="h-8 w-px bg-primary-foreground/20" />
              <div className="text-center">
                <p className="text-2xl font-bold">{top1.investmentScore.score.toFixed(1)}</p>
                <Badge className={`${getGradeStyle(top1.investmentScore.gradeColor)} text-[10px]`}>
                  {top1.investmentScore.grade}
                </Badge>
              </div>
              <Link to={`/intelligence/bairro/${encodeURIComponent(top1.bairro.bairro)}`}>
                <Button size="sm" variant="secondary" className="ml-2">
                  Ver análise <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </header>

      {/* ── Section Nav (sticky) ──────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-2">
            {SECTION_NAV.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap"
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </a>
            ))}
            <div className="flex-1" />
            <Link to="/intelligence/ranking">
              <Button variant="outline" size="sm" className="text-xs shrink-0">
                Ranking completo <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 space-y-12">

        {/* ════════════════════════════════════════════════════
            SECTION 1 — VISÃO GERAL
            ════════════════════════════════════════════════════ */}
        <section id="overview">
          <SectionLabel number="1" title="Visão geral do mercado" subtitle="Principais indicadores agregados dos bairros analisados" />

          {/* KPI Cards — 2 rows: leaders + averages */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {[
              { label: "Melhor Rentabilidade", value: bestRent.bairro, sub: fmtScore(bestRent.score_rentabilidade), icon: TrendingUp, color: "text-emerald-600" },
              { label: "Melhor Liquidez", value: bestLiq.bairro, sub: fmtScore(bestLiq.score_liquidez), icon: BarChart3, color: "text-blue-600" },
              { label: "Melhor Crescimento", value: bestCresc.bairro, sub: fmtScore(bestCresc.score_crescimento_potencial), icon: Target, color: "text-amber-600" },
            ].map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{c.label}</p>
                        <p className="text-xl font-bold mt-1 truncate">{c.value}</p>
                        <p className="text-xs text-muted-foreground">{c.sub}</p>
                      </div>
                      <c.icon className={`h-4 w-4 ${c.color} shrink-0`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">ADR Médio</p>
                  <p className="text-xl font-bold mt-1">{fmtBRL(avgADR)}</p>
                  <p className="text-xs text-muted-foreground">Preço médio da diária</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Ocupação Média</p>
                  <p className="text-xl font-bold mt-1">{fmtPct(avgOcc)}</p>
                  <p className="text-xs text-muted-foreground">% de dias alugados</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Bairros Analisados</p>
                  <p className="text-xl font-bold mt-1">{bairros.length}</p>
                  <p className="text-xs text-muted-foreground">São Paulo capital</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Highlight winners row */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">🏆 Destaques por categoria</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {highlights.map((h, i) => {
                const Icon = ICON_MAP[h.icon] || TrendingUp;
                return (
                  <motion.div key={h.category} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.04 }}>
                    <Link to={`/intelligence/bairro/${encodeURIComponent(h.bairro)}`}>
                      <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full group border-l-4 border-l-primary/30 hover:border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{h.category}</span>
                          </div>
                          <p className="font-bold group-hover:text-primary transition-colors">{h.bairro}</p>
                          <p className="text-xs text-muted-foreground">{h.value}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            SECTION 2 — INSIGHTS
            ════════════════════════════════════════════════════ */}
        <section id="insights">
          <SectionLabel number="2" title="Insights da análise" subtitle="O que os dados revelam — gerado automaticamente" />
          <div className="space-y-6">
            <ComparativeNarrativesSection bairros={bairros} />
            <StrategicLessonsSection bairros={bairros} />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            SECTION 3 — RANKING
            ════════════════════════════════════════════════════ */}
        <section id="ranking">
          <SectionLabel number="3" title="Investment Score — Top 5" subtitle="Ranking ponderado combinando retorno, demanda, operação e crescimento" />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <p className="text-xs text-muted-foreground">
                Score = Yield (35%) + Liquidez (25%) + Ocupação (20%) + Crescimento (20%) · Ajuste de risco incluído
              </p>
              <Link to="/intelligence/ranking">
                <Button variant="ghost" size="sm" className="text-primary">
                  Ver ranking completo <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {ranked.slice(0, 5).map((item, i) => {
                  const b = item.bairro;
                  const s = item.investmentScore;
                  const profile = getBairroProfile(b, bairros);
                  const badgeStyle = getGradeStyle(s.gradeColor);
                  return (
                    <Link key={b.bairro} to={`/intelligence/bairro/${encodeURIComponent(b.bairro)}`} className="block">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium group-hover:text-primary transition-colors">{b.bairro}</p>
                              <Badge variant="secondary" className="text-[9px] font-normal hidden sm:inline-flex">{profile.label}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              ADR {fmtBRL(b.adr_medio_studio)} · Occ {fmtPct(b.ocupacao_media_studio)} · Yield {(Number(b.yield_bruto_airbnb) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-lg font-bold">{s.score.toFixed(1)}</span>
                          <Badge className={`${badgeStyle} text-xs`}>{s.grade}</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <ContextualNote sectionKey="profile_intro" />
        </section>

        {/* ════════════════════════════════════════════════════
            SECTION 4 — METODOLOGIA & APRENDIZADO
            ════════════════════════════════════════════════════ */}
        <section id="methodology">
          <SectionLabel number="4" title="Metodologia e aprendizado" subtitle="Como esta análise foi construída e como interpretar os indicadores" />
          <div className="space-y-6">
            <MethodologySection bairros={bairros} />
            <IndicatorExplainerSection compact />
          </div>
        </section>

        {/* ── Quick Links ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/intelligence/ranking">
            <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full group">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold group-hover:text-primary transition-colors">Ranking Completo</p>
                  <p className="text-xs text-muted-foreground">Todos os {bairros.length} bairros comparados</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/intelligence/listings">
            <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full group">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold group-hover:text-primary transition-colors">Base de Listings</p>
                  <p className="text-xs text-muted-foreground">Anúncios brutos coletados</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/intelligence/ranking">
            <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full group">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold group-hover:text-primary transition-colors">Comparar Bairros</p>
                  <p className="text-xs text-muted-foreground">Scores lado a lado</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* ── Disclaimer ──────────────────────────────────── */}
        <footer className="border-t border-border/40 pt-6 pb-4 text-center">
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed max-w-2xl mx-auto">{FOOTER_DISCLAIMER}</p>
        </footer>
      </main>
    </div>
  );
};

export default IntelligenceDashboard;
