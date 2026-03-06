import { useParams, Link } from "react-router-dom";
import { useBairroDetail, fmtBRL, fmtPct, fmtScore } from "@/hooks/useIntelligenceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, BarChart3, Target, Building2, Shield, AlertTriangle, Star, Users } from "lucide-react";
import { motion } from "framer-motion";

const ScoreCard = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className={`text-3xl font-bold ${color}`}>{fmtScore(value)}</p>
      <Progress value={value} className="mt-2 h-1.5" />
    </CardContent>
  </Card>
);

const MetricRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

const IntelligenceBairroDetail = () => {
  const { bairro } = useParams<{ bairro: string }>();
  const { data: b, isLoading } = useBairroDetail(decodeURIComponent(bairro || ""));

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Carregando…</div></div>;
  if (!b) return <div className="min-h-screen bg-background flex items-center justify-center"><p>Bairro não encontrado.</p></div>;

  const precoEstudio = Number(b.preco_m2_residencial_medio) * Number(b.area_media_estudio);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-hero-gradient text-primary-foreground">
        <div className="container mx-auto px-4 py-6 flex items-center gap-4">
          <Link to="/intelligence/ranking"><Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10"><ArrowLeft /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold font-[var(--font-display)]">{b.bairro}</h1>
            <p className="text-sm text-primary-foreground/70">{b.periodo_inicio} a {b.periodo_fim} · {b.nivel_confianca_dados === "alto" ? "Alta confiança" : "Confiança média"}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Scores */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ScoreCard label="Rentabilidade" value={b.score_rentabilidade} icon={TrendingUp} color="text-emerald-600" />
          <ScoreCard label="Liquidez" value={b.score_liquidez} icon={BarChart3} color="text-blue-600" />
          <ScoreCard label="Crescimento Potencial" value={b.score_crescimento_potencial} icon={Target} color="text-amber-600" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Volume & Distribution */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Volume de Anúncios</CardTitle></CardHeader>
            <CardContent>
              <MetricRow label="Total de listings" value={b.n_listings_total.toLocaleString("pt-BR")} />
              <MetricRow label="Studios + 1 quarto" value={b.n_listings_studio_1q.toLocaleString("pt-BR")} />
              <MetricRow label="% Studio/1Q" value={fmtPct(b.pct_studio_1q)} />
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Performance</CardTitle></CardHeader>
            <CardContent>
              <MetricRow label="ADR Médio" value={fmtBRL(b.adr_medio_studio)} />
              <MetricRow label="Ocupação Média" value={fmtPct(b.ocupacao_media_studio)} />
              <MetricRow label="Receita Anual Média" value={fmtBRL(b.receita_anual_media_studio)} />
              <MetricRow label="Estadia Média" value={`${b.estadia_media_noites} noites`} />
              <MetricRow label="Reservas 30d+" value={fmtPct(b.porcentagem_reservas_30d_plus)} />
            </CardContent>
          </Card>

          {/* Reputation */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4" /> Reputação</CardTitle></CardHeader>
            <CardContent>
              <MetricRow label="Rating Médio" value={Number(b.rating_medio).toFixed(2)} />
              <MetricRow label="% Superhost" value={fmtPct(b.percentual_superhost)} />
              <MetricRow label="Reviews/Listing" value={Number(b.media_reviews_por_listing).toFixed(1)} />
              <MetricRow label="Política Flexível" value={fmtPct(b.pct_politica_flexivel)} />
              <MetricRow label="Política Moderada" value={fmtPct(b.pct_politica_moderada)} />
              <MetricRow label="Política Rígida" value={fmtPct(b.pct_politica_rigida)} />
            </CardContent>
          </Card>

          {/* Yields */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Yields & Mercado</CardTitle></CardHeader>
            <CardContent>
              <MetricRow label="Preço m² Residencial" value={fmtBRL(b.preco_m2_residencial_medio)} />
              <MetricRow label="Preço Estimado Studio" value={fmtBRL(precoEstudio)} />
              <MetricRow label="Aluguel Long Term" value={fmtBRL(b.aluguel_mensal_long_term_medio)} />
              <MetricRow label="Yield Airbnb" value={fmtPct(b.yield_bruto_airbnb)} />
              <MetricRow label="Yield Long Term" value={fmtPct(b.yield_bruto_long_term)} />
              <MetricRow label="Delta Yield" value={fmtPct(b.delta_yield)} />
            </CardContent>
          </Card>

          {/* Liquidity */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Liquidez Imobiliária</CardTitle></CardHeader>
            <CardContent>
              <MetricRow label="Dias Médio de Venda" value={`${b.dias_medio_venda_imovel} dias`} />
              <MetricRow label="Transações/Ano" value={b.numero_transacoes_imobiliarias_ano.toLocaleString("pt-BR")} />
            </CardContent>
          </Card>

          {/* Risk */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Risco & Saturação</CardTitle></CardHeader>
            <CardContent>
              <MetricRow label="Criminalidade" value={Number(b.indice_criminalidade).toFixed(2)} />
              <MetricRow label="Saturação" value={fmtPct(b.grau_saturacao_index)} />
              <MetricRow label="Risco Regulatório" value={fmtPct(b.risco_regulatorio)} />
              <MetricRow label="Risco Condomínio" value={fmtPct(b.risco_condominio)} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default IntelligenceBairroDetail;
