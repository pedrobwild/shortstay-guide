import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SAO_PAULO_REFERENCIA } from "@/data/bairrosCurados";
import SectionBlock from "./SectionBlock";
import FonteLink from "@/components/guide/FonteLink";
import { FAQ_DATA } from "@/data/guide-data";
import type { FonteGuia } from "@/data/fontesGuia";
import { ARTIGOS_BEWILD, type ArtigoBewild } from "@/data/artigosBewild";
import LinkArtigoBewild from "./LinkArtigoBewild";
import { RESPOSTA_CUSTO_REFORMA, RESPOSTA_INVESTIMENTO_TOTAL, ESTUDO_REFORMA_URL } from "@/data/provasBewild";

export const FAQ_ITEMS: { q: string; a: string; link?: string; source?: FonteGuia; artigo?: ArtigoBewild }[] = [
  { q: "Quanto custa um studio para short stay em São Paulo?", a: RESPOSTA_INVESTIMENTO_TOTAL, link: ESTUDO_REFORMA_URL },
  { q: "Qual o retorno esperado de um studio em Airbnb?", a: "O retorno depende do bairro, do capital investido e da operação. Consulte diária e ocupação na base curada e simule os custos; não há retorno garantido.", artigo: ARTIGOS_BEWILD.retorno },
  { q: "Preciso de CNPJ para alugar no Airbnb?", a: "Não é obrigatório, mas é recomendado. Com CNPJ (MEI ou Simples), você emite notas fiscais, tem benefícios tributários e passa mais credibilidade." },
  { q: "Condomínio pode proibir Airbnb?", a: "O STJ decidiu que a convenção do condomínio pode restringir locação por temporada. Verifique a convenção antes de comprar e priorize prédios que permitem ou são neutros.", artigo: ARTIGOS_BEWILD.lei },
  { q: "Qual a ocupação média de um studio em São Paulo?", a: `A referência da cidade de São Paulo na GuestFavorites é de ${SAO_PAULO_REFERENCIA.avgOccupancy}% de ocupação, ${SAO_PAULO_REFERENCIA.period}, na coleta de 13/10/2026. Os valores variam por bairro; consulte a fonte e o período de cada um na tabela do guia.`, source: { title: `GuestFavorites — ${SAO_PAULO_REFERENCIA.period}`, url: "https://www.guestfavorites.com" } },
  { q: "Vale a pena contratar uma administradora?", a: "Se você tem 1–2 unidades e tempo disponível, autogestão funciona. Acima de 3 unidades ou sem disponibilidade, uma administradora pode valer a pena. A comissão de administradoras varia por contrato; confirme na proposta.", artigo: ARTIGOS_BEWILD.gestao },
  { q: "Quanto custa a reforma de um studio?", a: RESPOSTA_CUSTO_REFORMA, artigo: ARTIGOS_BEWILD.custoReforma },
  { q: "Qual o melhor bairro para investir em short stay?", a: "Depende do seu orçamento e do perfil de risco: compare diária, ocupação e a fonte de cada número no comparador de bairros do Radar antes de decidir. O ranking completo está na análise da Bewild.", artigo: ARTIGOS_BEWILD.melhoresBairros },
  ...FAQ_DATA.filter((item) => item.source).map((item) =>
    item.q.startsWith("Qual a diferença entre short stay e aluguel tradicional") ? { ...item, artigo: ARTIGOS_BEWILD.shortVsLong } : item),
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
              {item.artigo && <LinkArtigoBewild artigo={item.artigo} />}
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
