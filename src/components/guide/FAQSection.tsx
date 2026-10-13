import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SAO_PAULO_REFERENCIA } from "@/data/bairrosCurados";
import SectionBlock from "./SectionBlock";
import FonteLink from "@/components/guide/FonteLink";
import { FAQ_DATA } from "@/data/guide-data";
import type { FonteGuia } from "@/data/fontesGuia";
import { RESPOSTA_CUSTO_REFORMA, RESPOSTA_INVESTIMENTO_TOTAL, ESTUDO_REFORMA_URL } from "@/data/provasBewild";

export const FAQ_ITEMS: { q: string; a: string; link?: string; source?: FonteGuia }[] = [
  { q: "Quanto custa um studio para short stay em São Paulo?", a: RESPOSTA_INVESTIMENTO_TOTAL, link: ESTUDO_REFORMA_URL },
  { q: "Qual o retorno esperado de um studio em Airbnb?", a: "O yield bruto varia de 8% a 18% ao ano, dependendo do bairro e operação. Com decoração estratégica e precificação dinâmica, é possível superar 15% em bairros premium." },
  { q: "Preciso de CNPJ para alugar no Airbnb?", a: "Não é obrigatório, mas é recomendado. Com CNPJ (MEI ou Simples), você emite notas fiscais, tem benefícios tributários e passa mais credibilidade." },
  { q: "Condomínio pode proibir Airbnb?", a: "O STJ decidiu que a convenção do condomínio pode restringir locação por temporada. Verifique a convenção antes de comprar e priorize prédios que permitem ou são neutros." },
  { q: "Qual a ocupação média de um studio em São Paulo?", a: `A referência da cidade de São Paulo na GuestFavorites é de ${SAO_PAULO_REFERENCIA.avgOccupancy}% de ocupação, ${SAO_PAULO_REFERENCIA.period}, na coleta de 13/10/2026. Os valores variam por bairro; consulte a fonte e o período de cada um na tabela do guia.` },
  { q: "Vale a pena contratar uma administradora?", a: "Se você tem 1–2 unidades e tempo disponível, autogestão funciona. Acima de 3 unidades ou sem disponibilidade, uma administradora (que cobra 15–25% da receita) pode valer a pena." },
  { q: "Quanto custa a reforma de um studio?", a: RESPOSTA_CUSTO_REFORMA, link: ESTUDO_REFORMA_URL },
  { q: "Qual o melhor bairro para investir em short stay?", a: "Depende do seu orçamento e perfil de risco. Pinheiros, Vila Mariana e Consolação oferecem boa relação risco-retorno. Itaim Bibi e Vila Olímpia têm diárias mais altas mas exigem investimento maior." },
  ...FAQ_DATA.filter((item) => item.source),
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
              {item.source && <FonteLink fonte={item.source} />}
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center text-sm font-medium text-primary underline underline-offset-4">
                  ver a análise completa
                </a>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionBlock>
  );
}
