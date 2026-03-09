import { useBairrosData, fmtBRL, fmtPct, fmtScore } from "@/hooks/useIntelligenceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Building2, TrendingUp, BarChart3, Target, ArrowRight, Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

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

  const cards = [
    { label: "Bairros Analisados", value: bairros.length.toString(), icon: Building2, color: "text-primary" },
    { label: "Melhor Rentabilidade", value: bestRent.bairro, sub: fmtScore(bestRent.score_rentabilidade), icon: TrendingUp, color: "text-emerald-600" },
    { label: "Melhor Liquidez", value: bestLiq.bairro, sub: fmtScore(bestLiq.score_liquidez), icon: BarChart3, color: "text-blue-600" },
    { label: "Melhor Crescimento", value: bestCresc.bairro, sub: fmtScore(bestCresc.score_crescimento_potencial), icon: Target, color: "text-amber-600" },
    { label: "ADR Médio", value: fmtBRL(avgADR), icon: Home, color: "text-primary" },
    { label: "Ocupação Média", value: fmtPct(avgOcc), icon: BarChart3, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-hero-gradient text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-[var(--font-display)]">Short Stay Intelligence</h1>
              <p className="mt-2 text-primary-foreground/80">São Paulo — Análise de investimento em short stay</p>
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
                      {c.sub && <p className="text-sm text-muted-foreground">Score {c.sub}</p>}
                    </div>
                    <c.icon className={`h-5 w-5 ${c.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Top 5 Ranking Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Top 5 — Rentabilidade</CardTitle>
            <Link to="/intelligence/ranking">
              <Button variant="ghost" size="sm">
                Ver ranking completo <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bairros.slice(0, 5).map((b, i) => (
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
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{fmtScore(b.score_rentabilidade)}</p>
                      <p className="text-xs text-muted-foreground">Yield {fmtPct(b.yield_bruto_airbnb)}</p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

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
      </main>
    </div>
  );
};

export default IntelligenceDashboard;
