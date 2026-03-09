import { useParams, Link } from "react-router-dom";
import { useBairroDetail, fmtBRL, fmtPct, fmtScore } from "@/hooks/useIntelligenceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, BarChart3, Target, Building2, Shield, AlertTriangle, Star, Users } from "lucide-react";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

// Seasonal multipliers to simulate monthly variation (Jan–Dec)
const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const ADR_SEASONALITY = [0.92, 0.88, 0.95, 0.97, 0.93, 0.90, 1.02, 1.00, 1.05, 1.08, 1.12, 1.18];
const OCC_SEASONALITY = [0.95, 0.90, 0.93, 0.96, 0.92, 0.88, 1.04, 1.02, 1.06, 1.10, 1.12, 1.14];

function generateMonthlyData(adr: number, occ: number) {
  return MONTH_LABELS.map((month, i) => ({
    month,
    adr: Math.round(adr * ADR_SEASONALITY[i]),
    ocupacao: parseFloat((occ * OCC_SEASONALITY[i] * 100).toFixed(1)),
    receita: Math.round((adr * ADR_SEASONALITY[i]) * 30 * (occ * OCC_SEASONALITY[i])),
  }));
}

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
  const monthlyData = generateMonthlyData(Number(b.adr_medio_studio), Number(b.ocupacao_media_studio));

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

        {/* Charts Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Radar Chart - Scores */}
          <Card>
            <CardHeader><CardTitle className="text-base">Radar de Scores</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{
                score: { label: "Score", color: "hsl(var(--primary))" }
              }} className="aspect-square max-h-[300px] mx-auto">
                <RadarChart data={[
                  { metric: "Rentabilidade", value: b.score_rentabilidade, fullMark: 100 },
                  { metric: "Liquidez", value: b.score_liquidez, fullMark: 100 },
                  { metric: "Crescimento", value: b.score_crescimento_potencial, fullMark: 100 },
                  { metric: "Ocupação", value: (b.ocupacao_media_studio ?? 0) * 100, fullMark: 100 },
                  { metric: "Reputação", value: (Number(b.rating_medio) / 5) * 100, fullMark: 100 },
                  { metric: "Segurança", value: Math.max(0, 100 - (Number(b.indice_criminalidade) * 100)), fullMark: 100 },
                ]}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Bar Chart - Yields */}
          <Card>
            <CardHeader><CardTitle className="text-base">Comparativo de Yields</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{
                airbnb: { label: "Yield Airbnb", color: "hsl(142 76% 36%)" },
                longTerm: { label: "Yield Long Term", color: "hsl(221 83% 53%)" },
                delta: { label: "Delta", color: "hsl(45 93% 47%)" },
              }} className="max-h-[300px]">
                <BarChart data={[
                  { name: "Airbnb", value: (b.yield_bruto_airbnb ?? 0) * 100, fill: "hsl(142 76% 36%)" },
                  { name: "Long Term", value: (b.yield_bruto_long_term ?? 0) * 100, fill: "hsl(221 83% 53%)" },
                  { name: "Delta", value: (b.delta_yield ?? 0) * 100, fill: "hsl(45 93% 47%)" },
                ]}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${Number(value).toFixed(2)}%`} />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Bar Chart - Performance Metrics */}
          <Card>
            <CardHeader><CardTitle className="text-base">Métricas de Performance</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{
                metric: { label: "Valor", color: "hsl(var(--primary))" }
              }} className="max-h-[300px]">
                <BarChart data={[
                  { name: "ADR (R$)", value: Number(b.adr_medio_studio), fill: "hsl(var(--primary))" },
                  { name: "Receita/mês (R$k)", value: Number(b.receita_anual_media_studio) / 12000, fill: "hsl(262 83% 58%)" },
                  { name: "Reviews/listing", value: Number(b.media_reviews_por_listing), fill: "hsl(var(--accent-foreground))" },
                  { name: "Estadia (noites)", value: Number(b.estadia_media_noites), fill: "hsl(45 93% 47%)" },
                ]} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={110} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Bar Chart - Risk */}
          <Card>
            <CardHeader><CardTitle className="text-base">Indicadores de Risco</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{
                risk: { label: "Risco", color: "hsl(0 84% 60%)" }
              }} className="max-h-[300px]">
                <BarChart data={[
                  { name: "Saturação", value: (b.grau_saturacao_index ?? 0) * 100, fill: "hsl(0 84% 60%)" },
                  { name: "Reg.", value: (b.risco_regulatorio ?? 0) * 100, fill: "hsl(25 95% 53%)" },
                  { name: "Condomínio", value: (b.risco_condominio ?? 0) * 100, fill: "hsl(45 93% 47%)" },
                  { name: "Crime", value: Number(b.indice_criminalidade) * 100, fill: "hsl(0 72% 51%)" },
                ]}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${Number(value).toFixed(1)}%`} />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
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
