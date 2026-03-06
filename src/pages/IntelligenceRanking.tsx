import { useState } from "react";
import { useBairrosData, fmtBRL, fmtPct, fmtScore } from "@/hooks/useIntelligenceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, ArrowUpDown } from "lucide-react";
import type { BairroAirbnb } from "@/types/intelligence";

type SortKey = "score_rentabilidade" | "score_liquidez" | "score_crescimento_potencial" | "adr_medio_studio" | "ocupacao_media_studio" | "yield_bruto_airbnb" | "delta_yield";

const confBadge = (nivel: string) => {
  if (nivel === "alto") return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Alto</Badge>;
  if (nivel === "medio") return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Médio</Badge>;
  return <Badge variant="destructive">Baixo</Badge>;
};

const IntelligenceRanking = () => {
  const { data: bairros, isLoading } = useBairrosData();
  const [sortKey, setSortKey] = useState<SortKey>("score_rentabilidade");
  const [filterConf, setFilterConf] = useState<string>("todos");

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Carregando…</div></div>;

  let filtered = bairros ?? [];
  if (filterConf !== "todos") filtered = filtered.filter(b => b.nivel_confianca_dados === filterConf);
  const sorted = [...filtered].sort((a, b) => Number(b[sortKey]) - Number(a[sortKey]));

  const exportCSV = () => {
    const headers = ["bairro","adr_medio_studio","ocupacao_media_studio","yield_bruto_airbnb","delta_yield","score_rentabilidade","score_liquidez","score_crescimento_potencial","nivel_confianca_dados"];
    const rows = sorted.map(b => headers.map(h => b[h as keyof BairroAirbnb]));
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ranking_bairros.csv"; a.click();
  };

  return (
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

      <main className="container mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
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

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Bairro</TableHead>
                  <TableHead className="text-right">ADR</TableHead>
                  <TableHead className="text-right">Ocupação</TableHead>
                  <TableHead className="text-right">Yield Airbnb</TableHead>
                  <TableHead className="text-right">Delta Yield</TableHead>
                  <TableHead className="text-right">Rentab.</TableHead>
                  <TableHead className="text-right">Liquidez</TableHead>
                  <TableHead className="text-right">Cresc.</TableHead>
                  <TableHead className="text-center">Confiança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((b, i) => (
                  <TableRow key={b.bairro} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <Link to={`/intelligence/bairro/${encodeURIComponent(b.bairro)}`} className="font-medium text-primary hover:underline">
                        {b.bairro}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{fmtBRL(b.adr_medio_studio)}</TableCell>
                    <TableCell className="text-right">{fmtPct(b.ocupacao_media_studio)}</TableCell>
                    <TableCell className="text-right">{fmtPct(b.yield_bruto_airbnb)}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">{fmtPct(b.delta_yield)}</TableCell>
                    <TableCell className="text-right font-bold">{fmtScore(b.score_rentabilidade)}</TableCell>
                    <TableCell className="text-right">{fmtScore(b.score_liquidez)}</TableCell>
                    <TableCell className="text-right">{fmtScore(b.score_crescimento_potencial)}</TableCell>
                    <TableCell className="text-center">{confBadge(b.nivel_confianca_dados)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default IntelligenceRanking;
