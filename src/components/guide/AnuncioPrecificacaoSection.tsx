import FonteLink from "@/components/guide/FonteLink";
import { FONTES_GUIA } from "@/data/fontesGuia";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { Camera, FileText, DollarSign, CalendarCheck, TrendingUp, Star, ArrowRight, Lightbulb, Zap, BarChart3 } from "lucide-react";
import SectionBlock from "./SectionBlock";

/* ── Listing anatomy ── */
const LISTING_ANATOMY = [
  {
    source: FONTES_GUIA.ranking,
    step: 1,
    title: "Foto de capa irresistível",
    desc: "A foto de capa é a primeira coisa que o hóspede vê na busca, e o Airbnb diz que fotos de qualidade ajudam no posicionamento. Use luz natural, enquadramento amplo e um elemento visual marcante.",
    icon: Camera,
    impact: "Crítico",
    tips: ["Fotografe entre 10h–14h com luz natural", "Mostre o ambiente inteiro, não detalhes", "Inclua um elemento memorável (quadro, luminária, vista)"],
  },
  {
    step: 2,
    title: "Título com localização + diferencial",
    desc: "O título aparece nas buscas. Inclua bairro, metrô próximo e o diferencial principal.",
    icon: FileText,
    impact: "Alto",
    tips: ["Ex: 'Studio Design · Pinheiros · 2min Metrô'", "Evite superlativos genéricos ('maravilhoso', 'incrível')", "Destaque o que te diferencia dos vizinhos"],
  },
  {
    step: 3,
    title: "Descrição orientada a benefícios",
    desc: "Não liste features — venda a experiência. Mostre como cada item resolve uma necessidade real.",
    icon: Star,
    impact: "Médio",
    tips: ["'Wi-Fi 300Mbps ideal para trabalho remoto' > 'Tem Wi-Fi'", "Organize por blocos: localização, conforto, trabalho", "Inclua distâncias a pé para pontos relevantes"],
  },
  {
    source: FONTES_GUIA.ranking,
    step: 4,
    title: "Amenidades 100% preenchidas",
    desc: "Informe apenas amenidades reais para que o hóspede possa filtrar a busca pelos recursos de que precisa.",
    icon: BarChart3,
    impact: "Médio",
    tips: ["Marque todas as amenidades reais, inclusive as óbvias", "Confira as amenidades filtráveis (Wi-Fi, cozinha, AC)", "Cada amenidade é um possível filtro do hóspede"],
  },
];

/* ── Pricing strategy phases ── */
const PRICING_PHASES = [
  {
    phase: "Lançamento",
    period: "Mês 1–2",
    strategy: "Entrada agressiva: -20% do mercado",
    desc: "Priorize volume de reservas e reviews. Acompanhe as avaliações e a resposta dos hóspedes, sem assumir um limiar fixo de posicionamento.",
    color: "bg-amber-500",
  },
  {
    phase: "Estabilização",
    period: "Mês 3–4",
    strategy: "Subida gradual: +5% a cada 15 dias",
    desc: "Com reviews positivas, comece a subir. Monitore a taxa de conversão — se cair, volte um degrau.",
    color: "bg-primary/70",
  },
  {
    phase: "Operação normal",
    period: "Mês 5+",
    strategy: "Preço dinâmico automático",
    desc: "Use PriceLabs, Beyond ou Wheelhouse. Defina piso, teto e regras de estadia mínima por temporada.",
    color: "bg-primary",
  },
  {
    phase: "Picos",
    period: "Eventos e feriados",
    strategy: "+30% a +50% sobre base",
    desc: "Carnaval, F1, Lollapalooza, feriados prolongados e eventos corporativos. Antecipe a precificação.",
    color: "bg-emerald-500",
  },
];

/* ── Seasonality ── */
const SEASONALITY = [
  { period: "Alta", months: "Mar, Jun, Jul, Out, Nov, Dez", occupancy: "Demanda potencialmente maior", pricing: "Revisar conforme procura", color: "bg-primary/10 text-primary" },
  { period: "Média", months: "Fev, Abr, Mai, Ago, Set", occupancy: "Demanda variável", pricing: "Base", color: "bg-muted text-muted-foreground" },
  { period: "Baixa", months: "Jan (pós-feriados)", occupancy: "Demanda potencialmente menor", pricing: "Revisar conforme procura", color: "bg-amber-100 text-amber-800" },
];

/* ── Rate optimization tips ── */
const RATE_TIPS = [
  { title: "Fotos profissionais", impact: "+19% de reservas", desc: "Segundo o Airbnb, anúncios com fotos profissionais tiveram em média 19% mais reservas (2024–2025).", icon: Camera, source: FONTES_GUIA.fotografia },
  { title: "Estadia mínima inteligente", impact: "Eficiência", desc: "Hipótese de regra: mínimo de 2 noites em semana e 3 em feriados. Avalie o efeito nas trocas de hóspedes e no calendário antes de adotar.", icon: CalendarCheck },
  { title: "Título e descrição otimizados", impact: "Clareza", desc: "Teste A/B de títulos e reescreva a descrição a cada trimestre.", icon: FileText },
  { title: "Preço dinâmico", impact: "Ajuste à demanda", desc: "Avalie ferramentas de ajuste de preços e acompanhe suas regras e resultados, sem pressupor ganho de receita.", icon: Zap },
];

export default function AnuncioPrecificacaoSection() {
  return (
    <SectionBlock
      id="anuncio-pricing"
      title="Anúncio e Precificação"
      takeaway="O produto físico é metade da equação. A outra metade é como você captura a receita."
    >
      {/* ── Listing Anatomy ── */}
      <h3 className="font-display text-xl font-bold text-foreground mb-4">Anatomia de um anúncio que converte</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {LISTING_ANATOMY.map((item, i) => (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="border-border h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="text-primary" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="secondary" className="font-body text-xs">#{item.step}</Badge>
                      <Badge className="bg-primary/10 text-primary font-body text-[10px]">{item.impact}</Badge>
                    </div>
                    <p className="font-semibold text-foreground text-sm font-body mb-1">{item.title}</p>
                    <p className="text-sm text-muted-foreground font-body leading-snug mb-3">{item.desc}</p>
                    {item.source && <FonteLink fonte={item.source} />}
                    <ul className="space-y-1">
                      {item.tips.map((tip, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground font-body">
                          <ArrowRight size={10} className="mt-1 shrink-0 text-primary/50" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Pricing Strategy Timeline ── */}
      <h3 className="font-display text-xl font-bold text-foreground mb-2">Estratégia de precificação por fase</h3>
      <p className="text-muted-foreground text-sm font-body mb-4">Hipótese de estratégia: períodos e ajustes de preço abaixo são premissas ilustrativas, não resultados observados. Adapte-os à sua operação.</p>

      <div className="relative mb-10">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
        <div className="space-y-4">
          {PRICING_PHASES.map((p, i) => (
            <motion.div
              key={p.phase}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative md:pl-14"
            >
              {/* Timeline dot */}
              <div className={`hidden md:flex absolute left-3 top-4 h-5 w-5 rounded-full ${p.color} items-center justify-center`}>
                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
              </div>
              <Card className="border-border">
                <CardContent className="p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <Badge className={`${p.color} text-primary-foreground font-body text-xs w-fit`}>{p.phase}</Badge>
                    <span className="text-xs text-muted-foreground font-body">{p.period}</span>
                  </div>
                  <p className="font-semibold text-foreground text-sm font-body mb-1">{p.strategy}</p>
                  <p className="text-sm text-muted-foreground font-body">{p.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Seasonality ── */}
      <h3 className="font-display text-xl font-bold text-foreground mb-4">Sazonalidade em São Paulo</h3>
      <p className="text-sm text-muted-foreground mb-4">Calendário ilustrativo: confirme a demanda e as datas antes de ajustar preços. Não representa uma série mensal observada.</p>
      <Card className="border-border mb-10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-xs sm:text-sm font-body [&_th]:px-2 [&_td]:px-2 [&_th]:break-words [&_td]:break-words">
              <thead className="bg-secondary">
                <tr>
                  {["Período", "Meses", "Ocupação esperada", "Ajuste de preço"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SEASONALITY.map((s) => (
                  <tr key={s.period} className="border-t border-border">
                    <td className="px-4 py-3"><Badge className={`${s.color} font-body text-xs`}>{s.period}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{s.months}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.occupancy}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{s.pricing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── How to raise rates ── */}
      <h3 className="font-display text-xl font-bold text-foreground mb-4">Como testar a diária e acompanhar a ocupação</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {RATE_TIPS.map((tip, i) => (
          <motion.div
            key={tip.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="border-border h-full">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <tip.icon className="text-primary" size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-foreground text-sm font-body">{tip.title}</p>
                    <Badge variant="secondary" className="text-[10px] font-body">{tip.impact}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-body leading-snug">{tip.desc}</p>
                  {tip.source && <FonteLink fonte={tip.source} />}
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
          <p className="font-display font-bold text-foreground text-sm mb-1">Preço é o último ajuste, não o primeiro</p>
          <p className="text-sm text-muted-foreground font-body">Antes de mexer no preço, garanta que fotos, título, descrição e amenidades estejam otimizados. O Airbnb considera fotos, preço e avaliações no posicionamento. Um anúncio completo não garante conversão nem dispensa testar o preço.</p>
          <FonteLink fonte={FONTES_GUIA.ranking} />
        </div>
      </div>

      <Accordion type="multiple" className="font-body">
        <AccordionItem value="ferramentas">
          <AccordionTrigger className="text-primary font-semibold min-h-[48px]">Ferramentas de preço dinâmico recomendadas</AccordionTrigger>
          <AccordionContent>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p><strong className="text-foreground">PriceLabs</strong> — Consulte recursos, integrações e condições diretamente com o fornecedor antes de contratar.</p>
              <p><strong className="text-foreground">Beyond Pricing</strong> — Verifique cobertura dos mercados e adequação à sua operação antes de contratar.</p>
              <p><strong className="text-foreground">Wheelhouse</strong> — Compare as opções de controle de regras e personalização com as necessidades da operação.</p>
              <p className="mt-2"><strong className="text-foreground">Custo e resultado</strong>: confirme o preço com cada fornecedor e avalie o efeito das regras na sua operação; não há ganho de receita garantido.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="eventos">
          <AccordionTrigger className="text-primary font-semibold min-h-[48px]">Calendário de eventos de São Paulo</AccordionTrigger>
          <AccordionContent>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p><strong className="text-foreground">Carnaval (Fev/Mar)</strong> — Confirme datas e procura observada. Mínimo de 3–4 noites é uma hipótese de regra, não recomendação universal.</p>
              <p><strong className="text-foreground">F1 GP São Paulo (Nov)</strong> — Confirme datas, acesso ao local e procura observada antes de ajustar a diária de qualquer bairro.</p>
              <p><strong className="text-foreground">São Paulo Fashion Week (Abr/Out)</strong> — Confira datas e locais da programação e acompanhe a procura na região do imóvel.</p>
              <p><strong className="text-foreground">Eventos corporativos</strong> — Feiras no Expo Center Norte, convenções no WTC. Confira a programação e acompanhe a procura, sem assumir demanda constante.</p>
              <p><strong className="text-foreground">Feriados prolongados</strong> — Tiradentes, Corpus Christi, 7 de Setembro. Acompanhe procura e reservas; feriados não garantem ocupação alta.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </SectionBlock>
  );
}
