import { TEXTO_DRE_PERCENTUAIS } from "@/data/dreGuia";
import { formatDecimal } from "@/lib/numberFormat";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useBairroData } from "@/hooks/useBairroData";
import SectionBlock from "./SectionBlock";
import { VariacaoColetaResumo } from "@/components/guide/VariacaoColeta";
import { FONTE_BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { notaFontesComplementares } from "@/lib/radarBase";

export default function MercadoSection() {
  const { bairros } = useBairroData();
  return (
    <SectionBlock id="mercado" title="Mercado e Precificação — São Paulo" takeaway="Diárias médias, ocupação e receita por bairro atualizado.">
      <Badge variant="secondary" className="mb-4 text-xs font-body">Fonte: {FONTE_BAIRROS_CURADOS}</Badge>
      <p className="mb-4 text-sm text-muted-foreground font-body">
        Diária, ocupação e faixa de preço de cada bairro estão no ranking e no mapa acima. Para ver o que sobra por mês no seu imóvel,{" "}
        <a href="#simulador" className="inline-flex min-h-[44px] items-center font-semibold text-primary underline underline-offset-4">use o simulador de receita líquida</a>.
      </p>
      <VariacaoColetaResumo />
      <Accordion type="multiple" className="mt-4 font-body">
        <AccordionItem value="metodologia">
          <AccordionTrigger className="text-primary font-semibold">Metodologia de cálculo</AccordionTrigger>
          <AccordionContent><p className="text-sm text-muted-foreground leading-relaxed">As faixas correspondem aos 25% mais baratos e 25% mais caros na GuestFavorites; Brooklin e Vila Olímpia usam a aproximação pelo Itaim Bibi (sem dado público por bairro), com a estimativa Bewild (dados anteriores, sem fonte pública) como referência extra; Consolação usa estimativa Bewild (sem fonte pública atualizada). A receita usa a diária média (ADR), não o ponto médio dos quartis. O multiplicador de decoração é uma hipótese: Básico ({formatDecimal(1, 1)}×) mantém valores base, Premium ({formatDecimal(1.2, 1)}×) reflete studios com acabamento e fotos acima da média, Alto padrão ({formatDecimal(1.45, 2)}×) reflete studios com design autoral e operação profissional. Os custos do short stay partem do DRE padrão do guia ({TEXTO_DRE_PERCENTUAIS}) e das despesas fixas que a pessoa informa (condomínio, IPTU, contas); limpeza fica fora por ser cobrada do hóspede. Na locação tradicional, o aluguel de partida aplica a rentabilidade média de locação de São Paulo (FipeZAP, {formatDecimal(6.3, 1)}% ao ano) ao valor do imóvel; vacância, administração, imposto de renda e reparos são hipóteses editáveis. Nenhuma simulação é garantia de resultado.</p></AccordionContent>
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
