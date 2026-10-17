import { formatDecimal } from "@/lib/numberFormat";
import FonteLink from "@/components/guide/FonteLink";
import { FONTES_GUIA } from "@/data/fontesGuia";
import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lightbulb } from "lucide-react";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { useBairroData } from "@/hooks/useBairroData";
import SectionBlock from "./SectionBlock";
import { DECORATION_LEVELS, fmt } from "@/data/guide-data";
import FonteBairro from "@/components/guide/FonteBairro";
import { VariacaoColetaResumo } from "@/components/guide/VariacaoColeta";
import { FONTE_BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { notaFontesComplementares } from "@/lib/radarBase";

export default function MercadoSection() {
  const { bairros } = useBairroData();
  const [bairro, setBairro] = useState<string>(bairros[0]?.name ?? "");
  const [decoracao, setDecoracao] = useState<string>("basico");
  const [ocupacao, setOcupacao] = useState([bairros[0]?.avgOccupancy ?? 75]);

  const selected = bairros.find((b) => b.name === bairro) ?? bairros[0];
  useEffect(() => { if (selected) setOcupacao([selected.avgOccupancy]); }, [selected]);
  const decLevel = DECORATION_LEVELS.find((d) => d.value === decoracao) ?? DECORATION_LEVELS[0];

  const result = useMemo(() => {
    const mult = decLevel.multiplier;
    const min = Math.round(selected.dailyMin * mult);
    const max = Math.round(selected.dailyMax * mult);
    const avgDaily = selected.dailyAvg * mult;
    const nights = 30 * (ocupacao[0] / 100);
    const receitaMensal = Math.round(avgDaily * nights);
    const receitaAnual = receitaMensal * 12;
    return { min, max, receitaMensal, receitaAnual };
  }, [selected, decLevel, ocupacao]);

  const mercadoTracked = useRef(false);
  useEffect(() => {
    if (mercadoTracked.current) return;
    const t = setTimeout(() => { trackGlobal("mercado_used", { bairro, decoracao }); mercadoTracked.current = true; }, 3000);
    return () => clearTimeout(t);
  }, [bairro, decoracao]);

  return (
    <SectionBlock id="mercado" title="Mercado e Precificação — São Paulo" takeaway="Diárias médias, ocupação e receita por bairro atualizado.">
      <Badge variant="secondary" className="mb-4 text-xs font-body">Fonte: {FONTE_BAIRROS_CURADOS}</Badge>
      <h3 className="font-display text-xl font-bold text-foreground mb-4">🎯 Meta de Diária</h3>
      <Card className="border-border">
        <CardContent className="p-6 space-y-5 font-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Bairro</label>
              <Select value={bairro} onValueChange={setBairro}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{bairros.map((b) => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <FonteBairro nome={selected.name} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Nível de decoração — hipótese</label>
            <Select value={decoracao} onValueChange={setDecoracao}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DECORATION_LEVELS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Ocupação estimada: <span className="font-bold text-primary">{formatDecimal(ocupacao[0], 0)}%</span></label>
            <Slider value={ocupacao} onValueChange={setOcupacao} min={50} max={90} step={1} />
          </div>
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-2xl font-display font-bold text-primary">R$ {fmt(result.min)}</p><p className="text-xs text-muted-foreground">Diária mín.</p></div>
            <div><p className="text-2xl font-display font-bold text-primary">R$ {fmt(result.max)}</p><p className="text-xs text-muted-foreground">Diária máx.</p></div>
            <div><p className="text-2xl font-display font-bold text-primary">R$ {fmt(result.receitaMensal)}</p><p className="text-xs text-muted-foreground">Receita / mês</p></div>
            <div><p className="text-2xl font-display font-bold text-primary">R$ {fmt(result.receitaAnual)}</p><p className="text-xs text-muted-foreground">Receita / ano</p></div>
          </div>
          <div className="bg-gold-light/50 border border-gold/20 rounded-xl p-4 flex items-start gap-3">
            <Lightbulb className="text-gold mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-foreground text-sm mb-1">Para alcançar o topo da faixa, priorize:</p>
              <p className="text-sm text-muted-foreground">Marcenaria planejada + iluminação cênica + fotos profissionais. Segundo o Airbnb, anúncios com fotos profissionais tiveram em média 19% mais reservas (2024–2025).</p>
              <FonteLink fonte={FONTES_GUIA.fotografia} />
            </div>
          </div>
        </CardContent>
      </Card>
      <VariacaoColetaResumo />
      <Accordion type="multiple" className="mt-4 font-body">
        <AccordionItem value="metodologia">
          <AccordionTrigger className="text-primary font-semibold">Metodologia de cálculo</AccordionTrigger>
          <AccordionContent><p className="text-sm text-muted-foreground leading-relaxed">As faixas correspondem aos 25% mais baratos e 25% mais caros na GuestFavorites; bairros sem fonte pública atualizada usam estimativa Bewild. A receita usa a diária média (ADR), não o ponto médio dos quartis. O multiplicador de decoração é uma hipótese: Básico ({formatDecimal(1, 1)}×) mantém valores base, Premium ({formatDecimal(1.2, 1)}×) reflete studios com acabamento e fotos acima da média, Alto padrão ({formatDecimal(1.45, 2)}×) reflete studios com design autoral e operação profissional.</p></AccordionContent>
        </AccordionItem>
        <AccordionItem value="coleta">
          <AccordionTrigger className="text-primary font-semibold">Como os dados são coletados</AccordionTrigger>
          <AccordionContent><p className="text-sm text-muted-foreground leading-relaxed">{FONTE_BAIRROS_CURADOS} {notaFontesComplementares(bairros)}</p></AccordionContent>
        </AccordionItem>
        <AccordionItem value="limitacoes">
          <AccordionTrigger className="text-primary font-semibold">Limitações</AccordionTrigger>
          <AccordionContent><p className="text-sm text-muted-foreground leading-relaxed">Valores são estimativas baseadas em médias de mercado e não constituem garantia de resultado. Resultados reais dependem de fatores como execução da reforma, qualidade das fotos, gestão operacional, sazonalidade, concorrência local e posicionamento na plataforma. Use como referência para tomada de decisão, não como projeção financeira definitiva.</p></AccordionContent>
        </AccordionItem>
      </Accordion>
    </SectionBlock>
  );
}
