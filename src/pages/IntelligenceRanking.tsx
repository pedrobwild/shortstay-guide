import { useState } from "react";
import { useBairrosData, fmtBRL, fmtPct, fmtScore } from "@/hooks/useIntelligenceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Scale, Crown, Rocket, Activity, TrendingUp, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { BairroAirbnb } from "@/types/intelligence";
import IndicatorExplainerSection from "@/components/intelligence/IndicatorExplainerSection";
import { ComparativeNarrativesSection, StrategicLessonsSection, EducationalBanner } from "@/components/intelligence/StorytellingComponents";
import { calculateInvestmentScore } from "@/lib/investmentScore";
import {
  COLUMN_TOOLTIPS,
  MICROCOPY,
  getBairroProfile,
  getHighlightWinners,
  getTableHighlights,
} from "@/lib/intelligenceInsights";

type SortKey = "investment_score" | "score_rentabilidade" | "score_liquidez" | "score_crescimento_potencial" | "adr_medio_studio" | "ocupacao_media_studio" | "yield_bruto_airbnb" | "delta_yield";

const confBadge = (nivel: string) => {
  if (nivel === "alto") return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Alto</Badge>;
  if (nivel === "medio") return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Médio</Badge>;
  return <Badge variant="destructive">Baixo</Badge>;
};

const ICON_MAP: Record<string, any> = { Scale, Crown, Rocket, Activity, TrendingUp };

const HeaderTooltip = ({ colKey }: { colKey: string }) => {
  const info = COLUMN_TOOLTIPS[colKey];
  if (!info) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="inline h-3.5 w-3.5 ml-1 text-muted-foreground/60 cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-xs">
        <p className="font-semibold mb-0.5">{info.friendly}</p>
        <p className="text-muted-foreground">{info.tip}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const IntelligenceRanking = () => {
  const { data: bairros, isLoading } = useBairrosData();
  const [sortKey, setSortKey] = useState<SortKey>("investment_score");
  const [filterConf, setFilterConf] = useState<string>("todos");

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Carregando…</div></div>;

  const allBairros = bairros ?? [];
  // Pre-calculate investment scores for all bairros
  const scoreMap = new Map(allBairros.map(b => [b.bairro, calculateInvestmentScore(b, allBairros)]));

  let filtered = allBairros;
  if (filterConf !== "todos") filtered = filtered.filter(b => b.nivel_confianca_dados === filterConf);

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "investment_score") {
      return (scoreMap.get(b.bairro)?.score ?? 0) - (scoreMap.get(a.bairro)?.score ?? 0);
    }
    return Number(b[sortKey]) - Number(a[sortKey]);
  });

  const highlights = getHighlightWinners(allBairros);
  const tableHighlights = getTableHighlights(allBairros);

  const isHighlighted = (bairro: string, type: string) => tableHighlights.some(h => h.bairro === bairro && h.type === type);

  const exportCSV = () => {
    const headers = ["bairro", "adr_medio_studio", "ocupacao_media_studio", "yield_bruto_airbnb", "delta_yield", "score_rentabilidade", "score_liquidez", "score_crescimento_potencial", "nivel_confianca_dados"];
    const rows = sorted.map(b => headers.map(h => b[h as keyof BairroAirbnb]));
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ranking_bairros.csv"; a.click();
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        <header className="bg-hero-gradient text-primary-foreground">
          <div className="container mx-auto px-4 py-6 flex items-center gap-4">
            <Link to="/intelligence"><Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10"><ArrowLeft /></Button></Link>
            <div>
              <h1 className="text-2xl font-bold font-[var(--font-display)]">Ranking de Bairros</h1>
              <p className="text-sm text-primary-foreground/70">Comparativo completo por scores e métricas</p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">

          {/* ── Insight Cards ─────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {highlights.map((h, i) => {
              const Icon = ICON_MAP[h.icon] || TrendingUp;
              return (
                <motion.div key={h.category} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link to={`/intelligence/bairro/${encodeURIComponent(h.bairro)}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-l-4 border-l-primary/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{h.category}</span>
                        </div>
                        <p className="font-bold text-base">{h.bairro}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{h.value}</p>
                        <p className="text-xs text-foreground/70 mt-1.5 leading-relaxed">{h.narrative}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* ── Comparative narratives (auto-generated from data) ── */}
          <ComparativeNarrativesSection bairros={allBairros} />

          {/* ── Strategic Lessons ─────────────────────────────── */}
          <StrategicLessonsSection bairros={allBairros} />

          {/* ── "Como entender esta análise" (collapsible) ── */}
          <IndicatorExplainerSection />

          <EducationalBanner message="Compare bairros como um investidor, não como um turista." />

          {/* ── Filters ──────────────────────────────────── */}
          <Card>
            <CardContent className="p-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ordenar por:</span>
                <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score_rentabilidade">Score Rentabilidade</SelectItem>
                    <SelectItem value="score_liquidez">Score Liquidez</SelectItem>
                    <SelectItem value="score_crescimento_potencial">Score Crescimento</SelectItem>
                    <SelectItem value="adr_medio_studio">ADR Médio</SelectItem>
                    <SelectItem value="ocupacao_media_studio">Ocupação</SelectItem>
                    <SelectItem value="yield_bruto_airbnb">Yield Airbnb</SelectItem>
                    <SelectItem value="delta_yield">Delta Yield</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Confiança:</span>
                <Select value={filterConf} onValueChange={setFilterConf}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="baixo">Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Exportar CSV</Button>
            </CardContent>
          </Card>

          <EducationalBanner message="Preço alto por noite nem sempre significa melhor negócio." />

          {/* ── Table ─────────────────────────────────────── */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Bairro</TableHead>
                    <TableHead className="text-center">Perfil</TableHead>
                    <TableHead className="text-right">ADR <HeaderTooltip colKey="adr" /></TableHead>
                    <TableHead className="text-right">Ocupação <HeaderTooltip colKey="ocupacao" /></TableHead>
                    <TableHead className="text-right">Yield Airbnb <HeaderTooltip colKey="yield_airbnb" /></TableHead>
                    <TableHead className="text-right">Delta Yield <HeaderTooltip colKey="delta_yield" /></TableHead>
                    <TableHead className="text-right">Rentab. <HeaderTooltip colKey="rentabilidade" /></TableHead>
                    <TableHead className="text-right">Liquidez <HeaderTooltip colKey="liquidez" /></TableHead>
                    <TableHead className="text-right">Cresc. <HeaderTooltip colKey="crescimento" /></TableHead>
                    <TableHead className="text-center">Confiança <HeaderTooltip colKey="confianca" /></TableHead>
                    <TableHead className="text-left min-w-[160px]">Leitura rápida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((b, i) => {
                    const profile = getBairroProfile(b, allBairros);
                    return (
                      <TableRow key={b.bairro} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <Link to={`/intelligence/bairro/${encodeURIComponent(b.bairro)}`} className="font-medium text-primary hover:underline">
                            {b.bairro}
                          </Link>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${profile.color} ${profile.textColor} hover:${profile.color} text-[10px]`}>{profile.label}</Badge>
                        </TableCell>
                        <TableCell className={`text-right ${isHighlighted(b.bairro, "max-adr") ? "font-bold text-primary" : ""}`}>
                          {fmtBRL(b.adr_medio_studio)}
                          {isHighlighted(b.bairro, "max-adr") && <span className="ml-1 text-[9px] text-primary">★</span>}
                        </TableCell>
                        <TableCell className={`text-right ${isHighlighted(b.bairro, "max-occ") ? "font-bold text-primary" : ""}`}>
                          {fmtPct(b.ocupacao_media_studio)}
                          {isHighlighted(b.bairro, "max-occ") && <span className="ml-1 text-[9px] text-primary">★</span>}
                        </TableCell>
                        <TableCell className={`text-right ${isHighlighted(b.bairro, "max-yield") ? "font-bold text-emerald-600" : ""}`}>
                          {fmtPct(b.yield_bruto_airbnb)}
                          {isHighlighted(b.bairro, "max-yield") && <span className="ml-1 text-[9px] text-emerald-600">★</span>}
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600">{fmtPct(b.delta_yield)}</TableCell>
                        <TableCell className="text-right font-bold">{fmtScore(b.score_rentabilidade)}</TableCell>
                        <TableCell className="text-right">{fmtScore(b.score_liquidez)}</TableCell>
                        <TableCell className="text-right">{fmtScore(b.score_crescimento_potencial)}</TableCell>
                        <TableCell className="text-center">{confBadge(b.nivel_confianca_dados)}</TableCell>
                        <TableCell className="text-left">
                          <p className="text-xs text-muted-foreground leading-snug">{profile.quickRead}</p>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ── Consultant-style footer ───────────────────── */}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl mx-auto">
                Alguns bairros cobram mais caro por diária. Outros alugam mais dias. Outros têm imóveis mais baratos e, por isso, rendem mais no final. <strong>O melhor investimento não é só o bairro mais famoso ou a diária mais alta</strong> — é aquele que melhor equilibra preço, ocupação, liquidez e potencial.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                {MICROCOPY.slice(0, 4).map((m, i) => (
                  <span key={i} className="text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">"{m}"</span>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default IntelligenceRanking;
