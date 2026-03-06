import { useState } from "react";
import { useRawListings, fmtBRL, fmtPct } from "@/hooks/useIntelligenceData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Database } from "lucide-react";

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
        <div className="container mx-auto px-4 py-6 flex items-center gap-4">
          <Link to="/intelligence"><Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10"><ArrowLeft /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold font-[var(--font-display)]">Base de Listings</h1>
            <p className="text-sm text-primary-foreground/70">Anúncios brutos coletados por scraping/API</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Bairro:</span>
              <Select value={bairroFilter} onValueChange={setBairroFilter}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BAIRROS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary" className="ml-auto">
              <Database className="h-3 w-3 mr-1" />
              {listings?.length ?? 0} registros
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando listings…</div>
            ) : !listings?.length ? (
              <div className="p-8 text-center">
                <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum listing encontrado.</p>
                <p className="text-xs text-muted-foreground mt-1">A base será populada via scraping/API ou importação CSV.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Bairro</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Preço/Noite</TableHead>
                    <TableHead className="text-right">Ocupação</TableHead>
                    <TableHead className="text-right">Receita Anual</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead className="text-right">Reviews</TableHead>
                    <TableHead className="text-center">Superhost</TableHead>
                    <TableHead>Fonte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map(l => (
                    <TableRow key={l.listing_id}>
                      <TableCell className="font-mono text-xs">{l.listing_id}</TableCell>
                      <TableCell>{l.bairro}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{l.titulo}</TableCell>
                      <TableCell><Badge variant="outline">{l.unit_type}</Badge></TableCell>
                      <TableCell className="text-right">{fmtBRL(l.preco_noite_atual)}</TableCell>
                      <TableCell className="text-right">{fmtPct(l.ocupacao_estimada)}</TableCell>
                      <TableCell className="text-right">{fmtBRL(l.receita_anual_estimada)}</TableCell>
                      <TableCell className="text-right">{Number(l.rating_geral).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{l.n_reviews}</TableCell>
                      <TableCell className="text-center">{l.is_superhost ? "⭐" : "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{l.fonte}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default IntelligenceListings;
