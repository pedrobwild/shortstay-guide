import { useState, useMemo } from "react";
import { useBairrosData, fmtBRL, fmtPct, fmtScore } from "@/hooks/useIntelligenceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, TrendingUp, HelpCircle, ChevronRight, BarChart3, Filter, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import type { BairroAirbnb } from "@/types/intelligence";
import { ComparativeNarrativesSection, ContextualNote } from "@/components/intelligence/StorytellingComponents";
import { calculateInvestmentScore } from "@/lib/investmentScore";
import { getGradeStyle, FOOTER_DISCLAIMER } from "@/lib/uiHelpers";
import {
  COLUMN_TOOLTIPS,
  getBairroProfile,
  getTableHighlights,
} from "@/lib/intelligenceInsights";

type SortKey = "investment_score" | "score_rentabilidade" | "score_liquidez" | "score_crescimento_potencial" | "adr_medio_studio" | "ocupacao_media_studio" | "yield_bruto_airbnb" | "delta_yield";

const confBadge = (nivel: string) => {
  if (nivel === "alto") return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">Alto</Badge>;
  if (nivel === "medio") return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px]">Médio</Badge>;
  return <Badge variant="destructive" className="text-[10px]">Baixo</Badge>;
};

const HeaderTooltip = ({ colKey }: { colKey: string }) => {
  const info = COLUMN_TOOLTIPS[colKey];
  if (!info) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="inline h-3 w-3 ml-0.5 text-muted-foreground/50 cursor-help" />
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

  const allBairros = bairros ?? [];
  const scoreMap = useMemo(
    () => new Map(allBairros.map(b => [b.bairro, calculateInvestmentScore(b, allBairros)])),
    [allBairros]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 w-full max-w-sm px-4">
          <div className="h-6 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted/60 rounded animate-pulse w-2/3" />
          <div className="h-64 bg-muted/40 rounded-lg animate-pulse mt-4" />
        </div>
      </div>
    );
  }

  let filtered = allBairros;
  if (filterConf !== "todos") filtered = filtered.filter(b => b.nivel_confianca_dados === filterConf);

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "investment_score") {
      return (scoreMap.get(b.bairro)?.score ?? 0) - (scoreMap.get(a.bairro)?.score ?? 0);
    }
    return Number(b[sortKey]) - Number(a[sortKey]);
  });

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
        {/* Hero */}
        <header className="bg-hero-gradient text-primary-foreground">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-primary-foreground/50 text-xs mb-3">
                  <Link to="/intelligence" className="hover:text-primary-foreground/80 transition-colors">Intelligence</Link>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-primary-foreground/80">Ranking</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold font-[var(--font-display)]">Ranking de Bairros</h1>
                <p className="text-sm text-primary-foreground/70 mt-1">
                  {allBairros.length} bairros comparados por Investment Score, yield, ocupação e mais
                </p>
              </div>
              <Link to="/intelligence">
                <Button variant="secondary" size="sm" className="shadow-lg">
                  <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Sticky filter bar */}
        <div className="sticky top-0 z-30 glass-nav">
          <div className="container mx-auto px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investment_score">Investment Score</SelectItem>
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
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <Select value={filterConf} onValueChange={setFilterConf}>
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="baixo">Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1" />
              <Badge variant="secondary" className="text-[10px]">{sorted.length} bairros</Badge>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportCSV}>
                <Download className="h-3.5 w-3.5 mr-1" /> CSV
              </Button>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 py-6 space-y-6">

          {/* Insights section — compact */}
          <ComparativeNarrativesSection bairros={allBairros} />

          <ContextualNote sectionKey="before_table" />

          {/* Table */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-8 font-semibold">#</TableHead>
                      <TableHead className="font-semibold">Bairro</TableHead>
                      <TableHead className="text-center font-semibold">Score <HeaderTooltip colKey="investment_score" /></TableHead>
                      <TableHead className="text-center font-semibold">Grade</TableHead>
                      <TableHead className="text-center font-semibold">Perfil</TableHead>
                      <TableHead className="text-right font-semibold">ADR <HeaderTooltip colKey="adr" /></TableHead>
                      <TableHead className="text-right font-semibold">Occ <HeaderTooltip colKey="ocupacao" /></TableHead>
                      <TableHead className="text-right font-semibold">Yield <HeaderTooltip colKey="yield_airbnb" /></TableHead>
                      <TableHead className="text-right font-semibold">Δ Yield <HeaderTooltip colKey="delta_yield" /></TableHead>
                      <TableHead className="text-right font-semibold">Rent. <HeaderTooltip colKey="rentabilidade" /></TableHead>
                      <TableHead className="text-right font-semibold">Liq. <HeaderTooltip colKey="liquidez" /></TableHead>
                      <TableHead className="text-right font-semibold">Cresc. <HeaderTooltip colKey="crescimento" /></TableHead>
                      <TableHead className="text-center font-semibold">Conf. <HeaderTooltip colKey="confianca" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((b, i) => {
                      const profile = getBairroProfile(b, allBairros);
                      const invScore = scoreMap.get(b.bairro);
                      const badgeStyle = getGradeStyle(invScore?.gradeColor ?? "");
                      return (
                        <TableRow key={b.bairro} className="group hover:bg-muted/40">
                          <TableCell className="font-bold text-muted-foreground text-xs">{i + 1}</TableCell>
                          <TableCell>
                            <Link
                              to={`/intelligence/bairro/${encodeURIComponent(b.bairro)}`}
                              className="font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group/link"
                            >
                              {b.bairro}
                              <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </Link>
                          </TableCell>
                          <TableCell className="text-center">
                            {invScore && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center gap-1 cursor-help">
                                    <span className="text-sm font-bold">{invScore.score.toFixed(1)}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-[240px] text-xs space-y-1.5 p-3">
                                  <p className="font-semibold">Composição do score</p>
                                  {invScore.pillars.map(p => (
                                    <div key={p.key} className="flex justify-between">
                                      <span className="text-muted-foreground capitalize">{p.key === "operacao" ? "Operação" : p.key === "futuro" ? "Futuro" : p.key.charAt(0).toUpperCase() + p.key.slice(1)}</span>
                                      <span className="font-medium">{p.normalized.toFixed(0)}/100</span>
                                    </div>
                                  ))}
                                  {invScore.confidenceFactor < 1 && <p className="text-amber-600 pt-1">Ajuste confiança: −{((1 - invScore.confidenceFactor) * 100).toFixed(0)}%</p>}
                                  {invScore.liquidityRiskFactor < 1 && <p className="text-orange-600">Ajuste liquidez: −{((1 - invScore.liquidityRiskFactor) * 100).toFixed(0)}%</p>}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {invScore && (
                              <Badge className={`${badgeStyle} text-[10px] px-1.5`}>{invScore.grade}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className={`${profile.color} ${profile.textColor} hover:${profile.color} text-[10px] cursor-help`}>{profile.label}</Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                                <p className="font-semibold mb-0.5">{profile.label}</p>
                                <p className="text-muted-foreground">{profile.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className={`text-right tabular-nums ${isHighlighted(b.bairro, "max-adr") ? "font-bold text-primary" : ""}`}>
                            {fmtBRL(b.adr_medio_studio)}
                            {isHighlighted(b.bairro, "max-adr") && <span className="ml-0.5 text-[9px] text-primary">★</span>}
                          </TableCell>
                          <TableCell className={`text-right tabular-nums ${isHighlighted(b.bairro, "max-occ") ? "font-bold text-primary" : ""}`}>
                            {fmtPct(b.ocupacao_media_studio)}
                            {isHighlighted(b.bairro, "max-occ") && <span className="ml-0.5 text-[9px] text-primary">★</span>}
                          </TableCell>
                          <TableCell className={`text-right tabular-nums ${isHighlighted(b.bairro, "max-yield") ? "font-bold text-emerald-600" : ""}`}>
                            {fmtPct(b.yield_bruto_airbnb)}
                            {isHighlighted(b.bairro, "max-yield") && <span className="ml-0.5 text-[9px] text-emerald-600">★</span>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium text-emerald-600">{fmtPct(b.delta_yield)}</TableCell>
                          <TableCell className="text-right tabular-nums font-bold">{fmtScore(b.score_rentabilidade)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtScore(b.score_liquidez)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtScore(b.score_crescimento_potencial)}</TableCell>
                          <TableCell className="text-center">{confBadge(b.nivel_confianca_dados)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Compact footer */}
          <footer className="border-t border-border/40 pt-6 pb-4 text-center">
            <p className="text-xs text-foreground/60 leading-relaxed max-w-2xl mx-auto mb-3">
              O melhor investimento não é só o bairro mais famoso ou a diária mais alta — é aquele que melhor equilibra preço, ocupação, liquidez e potencial.
            </p>
            <p className="text-[11px] text-muted-foreground/60 leading-relaxed max-w-2xl mx-auto">{FOOTER_DISCLAIMER}</p>
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default IntelligenceRanking;
