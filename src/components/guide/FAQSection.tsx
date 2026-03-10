import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SectionBlock from "./SectionBlock";

const FAQ_ITEMS = [
  { q: "Quanto custa um studio para short stay em São Paulo?", a: "O investimento total varia de R$ 250k a R$ 600k dependendo do bairro, metragem e nível de acabamento. Studios de 25–35m² em bairros como Pinheiros, Vila Mariana e Consolação oferecem o melhor custo-benefício." },
  { q: "Qual o retorno esperado de um studio em Airbnb?", a: "O yield bruto varia de 8% a 18% ao ano, dependendo do bairro e operação. Com decoração estratégica e precificação dinâmica, é possível superar 15% em bairros premium." },
  { q: "Preciso de CNPJ para alugar no Airbnb?", a: "Não é obrigatório, mas é recomendado. Com CNPJ (MEI ou Simples), você emite notas fiscais, tem benefícios tributários e passa mais credibilidade." },
  { q: "Condomínio pode proibir Airbnb?", a: "O STJ decidiu que a convenção do condomínio pode restringir locação por temporada. Verifique a convenção antes de comprar e priorize prédios que permitem ou são neutros." },
  { q: "Qual a ocupação média de um studio em São Paulo?", a: "A média geral fica entre 65% e 80%, variando por bairro e temporada. Studios bem operados em bairros premium alcançam 75–85%." },
  { q: "Vale a pena contratar uma administradora?", a: "Se você tem 1–2 unidades e tempo disponível, autogestão funciona. Acima de 3 unidades ou sem disponibilidade, uma administradora (que cobra 15–25% da receita) pode valer a pena." },
  { q: "Quanto custa a reforma de um studio?", a: "Reforma inteligente (sem demolições desnecessárias) custa entre R$ 15k e R$ 40k. Decoração estratégica adiciona R$ 15k–60k dependendo do nível escolhido." },
  { q: "Qual o melhor bairro para investir em short stay?", a: "Depende do seu orçamento e perfil de risco. Pinheiros, Vila Mariana e Consolação oferecem boa relação risco-retorno. Itaim Bibi e Vila Olímpia têm diárias mais altas mas exigem investimento maior." },
];

export default function FAQSection() {
  return (
    <SectionBlock id="faq" title="FAQ — Perguntas Frequentes" takeaway="Respostas diretas para as dúvidas mais comuns de investidores.">
      <Accordion type="multiple" className="font-body">
        {FAQ_ITEMS.map((item, i) => (
          <AccordionItem key={i} value={String(i)}>
            <AccordionTrigger className="text-foreground font-semibold text-left">{item.q}</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionBlock>
  );
}
