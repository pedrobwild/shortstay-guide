import { formatDecimal } from "@/lib/numberFormat";
import FonteLink from "@/components/guide/FonteLink";
import { FONTES_GUIA } from "@/data/fontesGuia";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { Lightbulb, Wrench, Star } from "lucide-react";
import sectionReforma from "@/assets/section-reforma.jpg";
import SectionBlock from "./SectionBlock";
import { fmt } from "@/data/guide-data";
import { PROPOSTA_REAL_PCT, PROPOSTA_REAL_VALOR, PROPOSTA_REAL_DATA, milReais, ORCAMENTO_MEDIANO, CONTRATOS_ANALISADOS, ESTUDO_REFORMA_URL, STUDIO_EXEMPLO_IMOVEL, STUDIO_EXEMPLO_ITBI, STUDIO_EXEMPLO_TOTAL, STUDIO_EXEMPLO_PCT_REFORMA, STUDIO_EXEMPLO_M2, FIPEZAP_M2, FIPEZAP_DATA } from "@/data/provasBewild";

export default function ReformaSection() {
  const pisoData = { vinilico: [{ item: "Material", valor: 66, area: 25 }, { item: "Instalação", valor: 25, area: 25 }, { item: "Preparação", valor: 12, area: 25 }], porcelanato: [{ item: "Material", valor: 110, area: 25 }, { item: "Instalação", valor: 85, area: 25 }, { item: "Preparação", valor: 40, area: 25 }] };
  const totalVinilico = pisoData.vinilico.reduce((s, r) => s + r.valor * r.area, 0);
  const totalPorcelanato = pisoData.porcelanato.reduce((s, r) => s + r.valor * r.area, 0);
  const diffPiso = totalPorcelanato - totalVinilico;

  return (
    <SectionBlock id="reforma" title="Reforma Inteligente" takeaway="Quanto investir e como comparar escolhas de materiais e serviços.">
      <div className="rounded-2xl overflow-hidden mb-8 shadow-sm ring-1 ring-border"><img src={sectionReforma} alt="Antes e depois de reforma de studio" className="w-full h-40 md:h-64 object-cover" loading="lazy" width={800} height={256} /></div>
      <div className="mb-6 space-y-2 font-body">
        <p className="text-sm text-foreground">Exemplo calculado com o estudo de {CONTRATOS_ANALISADOS} contratos: studio de {STUDIO_EXEMPLO_M2} m² × R$ {fmt(FIPEZAP_M2)}/m² (FipeZAP, {FIPEZAP_DATA}) = R$ {fmt(STUDIO_EXEMPLO_IMOVEL)} pelo imóvel. ITBI de 3% (hipótese): R$ {fmt(STUDIO_EXEMPLO_ITBI)}. Reforma completa mediana: R$ {fmt(ORCAMENTO_MEDIANO)}, já incluindo mobiliário e eletros. Total: R$ {fmt(STUDIO_EXEMPLO_TOTAL)}; reforma: {formatDecimal(STUDIO_EXEMPLO_PCT_REFORMA, 1)}% do investimento.</p>
        <FonteLink fonte={{ title: "Bewild — estudo de 188 contratos", url: ESTUDO_REFORMA_URL }} />
        <p className="text-xs text-muted-foreground">Os comparativos de materiais e serviços abaixo são hipóteses de exemplo, não preços extraídos do estudo. Confirme cada item no orçamento; não é possível recalculá-los com as medianas agregadas.</p>
      </div>
      <Tabs defaultValue="piso" className="font-body">
        <TabsList className="mb-4 h-auto flex flex-wrap justify-start"><TabsTrigger value="piso" className="min-h-[44px] px-4">Piso (25m²)</TabsTrigger><TabsTrigger value="marcenaria" className="min-h-[44px] px-4">Marcenaria</TabsTrigger><TabsTrigger value="iluminacao" className="min-h-[44px] px-4">Iluminação vs Bancada</TabsTrigger></TabsList>
        <TabsContent value="piso">
          <Card className="border-border"><CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><h3 className="font-display font-bold text-foreground mb-3">Vinílico</h3><table className="w-full text-sm"><thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Item</th><th className="text-right py-2 text-muted-foreground font-medium">R$/m²</th><th className="text-right py-2 text-muted-foreground font-medium">Subtotal</th></tr></thead><tbody>{pisoData.vinilico.map((r) => <tr key={r.item} className="border-b border-border/50"><td className="py-2 text-foreground">{r.item}</td><td className="py-2 text-right text-muted-foreground">R$ {r.valor}</td><td className="py-2 text-right text-foreground font-medium">R$ {fmt(r.valor * r.area)}</td></tr>)}<tr><td className="pt-3 font-bold text-foreground">Total</td><td></td><td className="pt-3 text-right font-bold text-primary text-lg">R$ {fmt(totalVinilico)}</td></tr></tbody></table></div>
              <div><h3 className="font-display font-bold text-foreground mb-3">Porcelanato</h3><table className="w-full text-sm"><thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Item</th><th className="text-right py-2 text-muted-foreground font-medium">R$/m²</th><th className="text-right py-2 text-muted-foreground font-medium">Subtotal</th></tr></thead><tbody>{pisoData.porcelanato.map((r) => <tr key={r.item} className="border-b border-border/50"><td className="py-2 text-foreground">{r.item}</td><td className="py-2 text-right text-muted-foreground">R$ {r.valor}</td><td className="py-2 text-right text-foreground font-medium">R$ {fmt(r.valor * r.area)}</td></tr>)}<tr><td className="pt-3 font-bold text-foreground">Total</td><td></td><td className="pt-3 text-right font-bold text-primary text-lg">R$ {fmt(totalPorcelanato)}</td></tr></tbody></table></div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Comparativo de custo total</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3"><span className="text-sm w-28 text-muted-foreground">Vinílico</span><div className="flex-1 bg-muted rounded-full h-6 overflow-hidden"><motion.div className="h-full bg-primary rounded-full flex items-center justify-end pr-2" initial={{ width: 0 }} whileInView={{ width: `${(totalVinilico / totalPorcelanato) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.6 }}><span className="text-xs text-primary-foreground font-bold">R$ {fmt(totalVinilico)}</span></motion.div></div></div>
                <div className="flex items-center gap-3"><span className="text-sm w-28 text-muted-foreground">Porcelanato</span><div className="flex-1 bg-muted rounded-full h-6 overflow-hidden"><motion.div className="h-full bg-accent rounded-full flex items-center justify-end pr-2" initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}><span className="text-xs text-accent-foreground font-bold">R$ {fmt(totalPorcelanato)}</span></motion.div></div></div>
              </div>
              <div className="bg-gold-light/50 border border-gold/20 rounded-xl p-4 flex items-center gap-2"><Lightbulb className="text-gold flex-shrink-0" size={16} /><p className="text-sm text-foreground">Diferença: <span className="font-bold">+R$ {fmt(diffPiso)}</span> pelo porcelanato. Neste exemplo hipotético, o vinílico tem menor custo; confirme resistência, uso e instalação com o fabricante.</p></div>
            </div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="marcenaria">
          <Card className="border-border"><CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-border"><CardContent className="p-5 text-center"><p className="text-3xl font-display font-bold text-primary">R$ 24.000</p><p className="text-sm text-muted-foreground mt-1">Armários fechados</p><Badge className="mt-2 bg-gold-light text-foreground border-0 font-body">Mais proteção</Badge></CardContent></Card>
              <Card className="border-border"><CardContent className="p-5 text-center"><p className="text-3xl font-display font-bold text-primary">R$ 19.000</p><p className="text-sm text-muted-foreground mt-1">Armários abertos / nichos</p><Badge className="mt-2 bg-gold-light text-foreground border-0 font-body">Mais estético</Badge></CardContent></Card>
            </div>
            <div className="bg-gold-light/50 border border-gold/20 rounded-xl p-4 flex items-start gap-3"><Lightbulb className="text-gold mt-0.5 flex-shrink-0" size={20} /><div><p className="font-semibold text-foreground text-sm mb-1">Marcenaria é o que aparece no anúncio</p><p className="text-sm text-muted-foreground">Equilibre estética e funcionalidade. Compare armários fechados e nichos abertos conforme armazenamento, manutenção e composição visual, sem presumir ganho de cliques.</p></div></div>
            <p className="text-xs text-muted-foreground">Na reforma completa, a marcenaria é a maior linha do orçamento: {formatDecimal(PROPOSTA_REAL_PCT.marcenaria, 0)}% de uma proposta real de {milReais(PROPOSTA_REAL_VALOR)} ({PROPOSTA_REAL_DATA}).</p>
            <FonteLink fonte={{ title: "Bewild — análise da proposta", url: ESTUDO_REFORMA_URL }} />
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="iluminacao">
          <Card className="border-border"><CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-primary/30 border-2"><CardContent className="p-5 text-center"><Lightbulb className="mx-auto mb-2 text-primary" size={28} /><p className="text-3xl font-display font-bold text-primary">R$ 2.800</p><p className="text-sm text-muted-foreground mt-1">Iluminação LED completa</p><p className="text-xs text-muted-foreground mt-1">Marcenaria + teto + fitas</p><Badge className="mt-2 bg-primary text-primary-foreground border-0 font-body">Hipótese de custo</Badge></CardContent></Card>
              <Card className="border-border"><CardContent className="p-5 text-center"><Wrench className="mx-auto mb-2 text-muted-foreground" size={28} /><p className="text-3xl font-display font-bold text-foreground">R$ 5.200</p><p className="text-sm text-muted-foreground mt-1">Trocar bancadas (quartzo)</p><p className="text-xs text-muted-foreground mt-1">Demolição + material 2,8–3,2m</p><Badge variant="secondary" className="mt-2 font-body">Custo elevado</Badge></CardContent></Card>
            </div>
            <div className="bg-gold-subtle rounded-lg p-4 flex items-start gap-3"><Star className="text-accent mt-0.5 flex-shrink-0" size={20} /><div><p className="font-semibold text-foreground text-sm mb-1">Decisão do investidor</p><p className="text-sm text-muted-foreground">Compare iluminação e bancada conforme as necessidades do imóvel e o orçamento real. Os custos deste exemplo não demonstram qual opção traz maior retorno.</p></div></div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
      <Accordion type="multiple" className="mt-4 font-body">
        <AccordionItem value="vinilico-roi"><AccordionTrigger className="text-primary font-semibold">O que verificar ao escolher vinílico</AccordionTrigger><AccordionContent><p className="text-sm text-muted-foreground leading-relaxed">A Durafloor orienta a instalação conforme o produto e as condições do contrapiso. Confira preparo da base, método de instalação e indicação de uso antes de definir o cronograma. Essa orientação não comprova retorno financeiro nem equivalência de percepção entre vinílico e porcelanato.</p><FonteLink fonte={FONTES_GUIA.vinilico} /></AccordionContent></AccordionItem>
        <AccordionItem value="porcelanato"><AccordionTrigger className="text-primary font-semibold">Quando porcelanato faz sentido</AccordionTrigger><AccordionContent><p className="text-sm text-muted-foreground leading-relaxed">Compare revestimentos pela indicação de uso, resistência à água, manutenção e estado do piso existente. Não presuma que um material será compensado por uma diária maior; confirme a adequação técnica com o responsável pelo projeto.</p></AccordionContent></AccordionItem>
      </Accordion>
    </SectionBlock>
  );
}
