import { formatPercent, formatDecimal } from "@/lib/numberFormat";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { ArrowDown, TrendingUp, TrendingDown, Minus, AlertCircle, Lightbulb, DollarSign, Percent, Building2, Zap } from "lucide-react";
import SectionBlock from "./SectionBlock";
import { ARTIGOS_BEWILD } from "@/data/artigosBewild";
import { exemploRentabilidadePinheiros, liquidoCenario, retornoSobreInvestimentoExemplo } from "@/lib/rentabilidadeExample";
import { ESTUDO_REFORMA_URL, STUDIO_EXEMPLO_IMOVEL, STUDIO_EXEMPLO_ITBI, ORCAMENTO_MEDIANO } from "@/data/provasBewild";
import { DRE_GUIA, TEXTO_INVESTIMENTO_TOTAL } from "@/data/dreGuia";
import FonteLink from "@/components/guide/FonteLink";
import FonteBairro from "@/components/guide/FonteBairro";

const exemplo = exemploRentabilidadePinheiros();
const brlExemplo = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const pct = (p: number) => formatPercent(p, 0);
/** Cenário didático: receita bruta = diária × 30 × ocupação; líquido pela mesma conta do exemplo e do simulador. */
const cenario = (ocupacaoPct: number, diaria: number) => {
  const receitaBruta = diaria * 30 * ocupacaoPct / 100;
  const receitaLiquida = liquidoCenario(receitaBruta);
  const retorno = retornoSobreInvestimentoExemplo(receitaLiquida);
  return {
    ocupacao: pct(ocupacaoPct), adr: brlExemplo(diaria), receitaBruta: brlExemplo(receitaBruta), receitaLiquida: brlExemplo(receitaLiquida),
    yield: `${formatDecimal(retorno.yieldLiquido, 1)}%`, payback: retorno.paybackAnos === null ? "—" : `${formatDecimal(retorno.paybackAnos, 1)} anos`,
  };
};

/* ── Waterfall data: mesmas linhas e percentuais do DRE padrão do guia (dreGuia.ts) ── */
const WATERFALL = [
  { label: "Receita bruta", desc: "Diária média × 30 × ocupação", example: brlExemplo(exemplo.receitaBruta), type: "revenue" as const },
  { label: "Taxa do Airbnb", desc: `${pct(DRE_GUIA.airbnbPct)} — hipótese: comissão cobrada do anfitrião`, example: `- ${brlExemplo(exemplo.plataforma)}`, type: "cost" as const },
  { label: "Gestão (administradora)", desc: `${pct(DRE_GUIA.gestaoPct)} — hipótese de gestão terceirizada`, example: `- ${brlExemplo(exemplo.gestao)}`, type: "cost" as const },
  { label: "Impostos", desc: `${pct(DRE_GUIA.impostosPct)} — hipótese tributária`, example: `- ${brlExemplo(exemplo.impostos)}`, type: "cost" as const },
  { label: "Manutenção e reposição", desc: `${pct(DRE_GUIA.manutencaoPct)} — hipótese: reparos e enxoval`, example: `- ${brlExemplo(exemplo.manutencao)}`, type: "cost" as const },
  { label: "Condomínio", desc: "Hipótese de custo fixo mensal", example: `- ${brlExemplo(exemplo.condominio)}`, type: "fixed" as const },
  { label: "Contas (luz, água, internet)", desc: "Hipótese: contas pagas pelo anfitrião; IPTU informado no simulador", example: `- ${brlExemplo(exemplo.utilidades)}`, type: "fixed" as const },
  { label: "Receita líquida", desc: "O que sobra no bolso", example: brlExemplo(exemplo.receitaLiquida), type: "result" as const },
];

/* ── Scenarios ── */
const SCENARIOS = [
  {
    key: "conservador",
    label: "Conservador",
    icon: TrendingDown,
    color: "border-amber-500/30 bg-amber-500/[0.03]",
    badgeColor: "bg-amber-100 text-amber-800",
    metrics: cenario(65, 280),
    desc: "Primeiros meses, baixa temporada ou bairro menos aquecido.",
  },
  {
    key: "base",
    label: "Base",
    icon: Minus,
    color: "border-primary/30 bg-primary/[0.03]",
    badgeColor: "bg-primary/10 text-primary",
    metrics: cenario(75, 350),
    desc: "Operação estabilizada com boa gestão e produto adequado.",
  },
  {
    key: "agressivo",
    label: "Otimista",
    icon: TrendingUp,
    color: "border-emerald-500/30 bg-emerald-500/[0.03]",
    badgeColor: "bg-emerald-100 text-emerald-800",
    metrics: cenario(85, 420),
    desc: "Studio premium, fotos profissionais, preço dinâmico e localização top.",
  },
];

/* ── Sensitivity drivers ── */
const SENSITIVITY = [
  { driver: "Ocupação", impact: "Alto", desc: `Cada 5pp de ocupação = ~${brlExemplo(exemplo.impactoOcupacao)}/mês de receita bruta`, icon: Percent, color: "text-primary" },
  { driver: "Diária média (ADR)", impact: "Alto", desc: `Cada R$ 50 a mais na diária = ~${brlExemplo(exemplo.impactoDiaria)}/mês bruto a ${formatPercent(exemplo.bairro.avgOccupancy, 0)} de ocupação`, icon: DollarSign, color: "text-primary" },
  { driver: "Condomínio", impact: "Médio", desc: "Custo fixo que não escala — condomínios > R$ 1.200 comprimem margem", icon: Building2, color: "text-amber-600" },
  { driver: "Gestão (administradora)", impact: "Médio", desc: `Na hipótese de gestão de ${pct(DRE_GUIA.gestaoPct)}, a operação própria evita essa comissão, mas exige tempo e processo`, icon: Zap, color: "text-amber-600" },
];

type ActiveScenario = "conservador" | "base" | "agressivo";

export default function RentabilidadeSection() {
  const [activeScenario, setActiveScenario] = useState<ActiveScenario>("base");
  const scenario = SCENARIOS.find((s) => s.key === activeScenario) ?? SCENARIOS[1];

  return (
    <SectionBlock
      artigo={ARTIGOS_BEWILD.custosOperacao}
      id="rentabilidade"
      title="A Matemática do Investimento"
      takeaway="Entenda como a conta é formada antes de abrir o simulador. Receita bruta ≠ o que vai para o bolso."
    >
      {/* ── Revenue Waterfall ── */}
      <h3 className="font-display text-xl font-bold text-foreground mb-4">Da receita bruta ao bolso: a cascata do retorno</h3>
      <Card className="border-border mb-10">
        <CardContent className="p-5 md:p-6">
          <div className="space-y-0">
            {WATERFALL.map((item, i) => {
              const isRevenue = item.type === "revenue";
              const isResult = item.type === "result";
              const isCost = item.type === "cost" || item.type === "fixed";

              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                >
                  {isResult && <div className="border-t-2 border-primary/30 my-3" />}
                  <div className={`flex items-center gap-3 py-2.5 px-3 rounded-lg ${isResult ? "bg-primary/5" : isRevenue ? "bg-muted/30" : ""}`}>
                    {isCost && <ArrowDown size={12} className="text-destructive/60 shrink-0" />}
                    {isRevenue && <TrendingUp size={12} className="text-primary shrink-0" />}
                    {isResult && <DollarSign size={14} className="text-primary shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-body ${isResult ? "font-bold text-foreground" : "font-medium text-foreground"}`}>{item.label}</p>
                      <p className="text-xs text-muted-foreground font-body">{item.desc}</p>
                    </div>
                    <span className={`text-sm font-mono font-semibold shrink-0 ${isResult ? "text-primary" : isCost ? "text-destructive/70" : "text-foreground"}`}>
                      {item.example}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-4 bg-muted/50 rounded-lg p-3 flex items-start gap-2.5">
            <AlertCircle size={14} className="text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground font-body">
              Hipótese de exemplo baseada em studio de 30m² em {exemplo.bairro.name}, ADR {brlExemplo(exemplo.bairro.dailyAvg)}, ocupação {formatPercent(exemplo.bairro.avgOccupancy, 0)}. A taxa de limpeza não entra na conta porque é paga pelo hóspede. Valores reais variam por unidade e operação.
            </p>
          </div>
          <FonteBairro nome={exemplo.bairro.name} />
        </CardContent>
      </Card>

      {/* ── Scenarios ── */}
      <h3 className="font-display text-xl font-bold text-foreground mb-2">Cenários de retorno</h3>
      <p className="text-muted-foreground text-sm font-body mb-4">Hipóteses de exemplo, não previsões de mercado. Clique para comparar os cenários; os valores não são garantidos. Receita líquida pela mesma conta da cascata acima; rentabilidade e prazo de retorno sobre {brlExemplo(exemplo.investimento)} de investimento total ({TEXTO_INVESTIMENTO_TOTAL}): imóvel de {brlExemplo(STUDIO_EXEMPLO_IMOVEL)} + ITBI hipotético de {brlExemplo(STUDIO_EXEMPLO_ITBI)} + reforma turnkey mediana de {brlExemplo(ORCAMENTO_MEDIANO)} (estudo de 188 contratos).</p>
      <p className="text-muted-foreground text-sm font-body mb-2">No exemplo de Pinheiros com os dados curados, receita líquida de {brlExemplo(exemplo.receitaLiquida)}/mês: {formatDecimal(exemplo.yieldLiquido, 1)}% ao ano e prazo estimado de retorno de {formatDecimal(exemplo.paybackAnos ?? 0, 1)} anos, sem valorização nem financiamento.</p>
      <FonteLink fonte={{ title: "Bewild — estudo de 188 contratos", url: ESTUDO_REFORMA_URL }} />

      <div className="flex flex-wrap gap-2 mb-4">
        {SCENARIOS.map((s) => (
          <Button
            key={s.key}
            size="sm"
            variant={activeScenario === s.key ? "default" : "outline"}
            onClick={() => setActiveScenario(s.key as ActiveScenario)}
            className={`min-h-[44px] px-4 ${activeScenario === s.key ? "bg-primary text-primary-foreground" : ""}`}
          >
            <s.icon size={14} className="mr-1.5" />
            {s.label}
          </Button>
        ))}
      </div>

      <Card className={`border-2 ${scenario.color} mb-10`}>
        <CardContent className="p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={`${scenario.badgeColor} font-body text-xs`}>{scenario.label}</Badge>
            <p className="text-sm text-muted-foreground font-body">{scenario.desc}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            {Object.entries(scenario.metrics).map(([key, val]) => {
              const labels: Record<string, string> = {
                ocupacao: "Ocupação",
                adr: "Diária média",
                receitaBruta: "Receita bruta/mês",
                receitaLiquida: "Receita líquida/mês",
                yield: "Rentabilidade anual",
                payback: "Prazo estimado de retorno",
              };
              return (
                <div key={key} className="py-2">
                  <p className="text-xl md:text-2xl font-display font-bold text-foreground">{val}</p>
                  <p className="text-xs text-muted-foreground font-body">{labels[key]}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Sensitivity ── */}
      <h3 className="font-display text-xl font-bold text-foreground mb-4">O que mais mexe no retorno</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {SENSITIVITY.map((s, i) => (
          <motion.div
            key={s.driver}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="border-border h-full">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <s.icon className={s.color} size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-foreground text-sm font-body">{s.driver}</p>
                    <Badge variant="secondary" className="text-[10px] font-body">{s.impact}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-body leading-snug">{s.desc}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Key Insight ── */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-start gap-3 mb-4">
        <Lightbulb className="text-primary mt-0.5 flex-shrink-0" size={20} />
        <div>
          <p className="font-display font-bold text-foreground text-sm mb-1">O segredo está na composição, não em um fator isolado</p>
          <p className="text-sm text-muted-foreground font-body">Em uma hipótese ilustrativa, um studio com ADR médio mas 85% de ocupação pode render mais que um com diária alta e 60% de ocupação. Da mesma forma, um condomínio barato em bairro bom pode compensar uma diária menor. Use o simulador para testar seus cenários específicos.</p>
        </div>
      </div>

      <Accordion type="multiple" className="font-body">
        <AccordionItem value="roi-vs-yield">
          <AccordionTrigger className="text-primary font-semibold min-h-[48px]">Rentabilidade, prazo de retorno e os termos técnicos (yield, ROI, payback)</AccordionTrigger>
          <AccordionContent>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p><strong className="text-foreground">Rentabilidade bruta</strong> (yield bruto) = receita anual bruta ÷ valor do imóvel. Útil para comparações rápidas entre ativos e regiões. Não considera custos operacionais.</p>
              <p><strong className="text-foreground">Rentabilidade líquida</strong> (yield líquido) = receita anual líquida ÷ valor do imóvel. Mais realista, mas depende de premissas de custo que variam por operação.</p>
              <p><strong className="text-foreground">Rentabilidade anual do Radar</strong> (ROI, Return on Investment) = receita líquida anual ÷ investimento total ({TEXTO_INVESTIMENTO_TOTAL}). É a métrica usada no exemplo, nos cenários e no simulador.</p>
              <p><strong className="text-foreground">Prazo estimado de retorno</strong> (payback simples) = investimento total ÷ receita líquida anual. Indica em quantos anos o investimento se paga, sem valorização nem financiamento. Avalie o resultado conforme o risco e o capital investido; não há uma faixa universal.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="custos-ocultos">
          <AccordionTrigger className="text-primary font-semibold min-h-[48px]">Custos que investidores iniciantes esquecem</AccordionTrigger>
          <AccordionContent>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>• <strong className="text-foreground">ITBI</strong>: 3% do valor do imóvel — hipótese do exemplo; confirme a incidência</p>
              <p>• <strong className="text-foreground">Registro e escritura</strong>: ~{formatDecimal(1.5)}% adicional — hipótese do exemplo</p>
              <p>• <strong className="text-foreground">Fundo de reserva</strong>: cobrado em muitos condomínios além da taxa ordinária</p>
              <p>• <strong className="text-foreground">Reposição de enxoval</strong>: toalhas, roupas de cama e itens de cozinha a cada 6-12 meses</p>
              <p>• <strong className="text-foreground">Manutenção corretiva</strong>: 5% da receita anual — hipótese de reserva para reparos</p>
              <p>• <strong className="text-foreground">Vacância sazonal</strong>: períodos de menor demanda podem reduzir a ocupação; teste essa hipótese no simulador</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </SectionBlock>
  );
}
