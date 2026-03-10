import { useState } from "react";
import { useRawListings, fmtBRL, fmtPct } from "@/hooks/useIntelligenceData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowLeft, Database, ChevronRight, Filter, ExternalLink } from "lucide-react";

const BAIRROS = [
  "Todos", "Vila Mariana", "Pinheiros", "Consolação", "Bela Vista", "Itaim Bibi",
  "Moema", "Brooklin", "República", "Liberdade", "Vila Olímpia", "Barra Funda",
  "Jardim Paulista", "Campo Belo", "Perdizes", "Vila Nova Conceição"
];

const IntelligenceListings = () => {
  const [bairroFilter, setBairroFilter] = useState("Todos");
  const { data: listings, isLoading } = useRawListings(bairroFilter === "Todos" ? undefined : bairroFilter);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-hero-gradient text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-primary-foreground/50 text-xs mb-3">
                <Link to="/intelligence" className="hover:text-primary-foreground/80 transition-colors">Intelligence</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-primary-foreground/80">Listings</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold font-[var(--font-display)]">Base de Listings</h1>
              <p className="text-sm text-primary-foreground/70 mt-1">Anúncios brutos coletados por scraping/API</p>
            </div>
            <Link to="/intelligence">
              <Button variant="secondary" size="sm" className="shadow-lg">
                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Sticky filter */}
      <div className="sticky top-0 z-30 glass-nav">
        <div className="container mx-auto px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={bairroFilter} onValueChange={setBairroFilter}>
              <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BAIRROS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Badge variant="secondary" className="text-[10px]">
              <Database className="h-3 w-3 mr-1" />
              {listings?.length ?? 0} registros
            </Badge>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="space-y-3 max-w-xs mx-auto">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted/60 rounded animate-pulse w-3/4 mx-auto" />
                  <div className="h-32 bg-muted/30 rounded-lg animate-pulse mt-4" />
                </div>
              </div>
            ) : !listings?.length ? (
              <div className="p-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Database className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-foreground font-medium mb-1">Nenhum listing encontrado</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">A base será populada via scraping/API ou importação CSV.</p>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">ID</TableHead>
                      <TableHead className="font-semibold">Bairro</TableHead>
                      <TableHead className="font-semibold">Título</TableHead>
                      <TableHead className="font-semibold">Tipo</TableHead>
                      <TableHead className="text-right font-semibold">Preço/Noite</TableHead>
                      <TableHead className="text-right font-semibold">Ocupação</TableHead>
                      <TableHead className="text-right font-semibold">Receita Anual</TableHead>
                      <TableHead className="text-right font-semibold">Rating</TableHead>
                      <TableHead className="text-right font-semibold">Reviews</TableHead>
                      <TableHead className="text-center font-semibold">Superhost</TableHead>
                      <TableHead className="font-semibold">Fonte</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.map(l => (
                      <TableRow key={l.listing_id} className="group hover:bg-muted/40">
                        <TableCell className="font-mono text-[11px] text-muted-foreground">{l.listing_id}</TableCell>
                        <TableCell className="font-medium">
                          <Link
                            to={`/intelligence/bairro/${encodeURIComponent(l.bairro)}`}
                            className="hover:text-primary transition-colors inline-flex items-center gap-1"
                          >
                            {l.bairro}
                            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="truncate block text-sm">{l.titulo || "—"}</span>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{l.unit_type}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums">{fmtBRL(l.preco_noite_atual)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtPct(l.ocupacao_estimada)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtBRL(l.receita_anual_estimada)}</TableCell>
                        <TableCell className="text-right tabular-nums">{Number(l.rating_geral).toFixed(2)}</TableCell>
                        <TableCell className="text-right tabular-nums">{l.n_reviews}</TableCell>
                        <TableCell className="text-center">{l.is_superhost ? <Badge className="bg-amber-100 text-amber-800 text-[10px]">⭐ SH</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">{l.fonte}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default IntelligenceListings;
