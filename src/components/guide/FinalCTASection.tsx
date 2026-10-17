import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import OrcamentoButton from "@/components/OrcamentoButton";
import { Button } from "@/components/ui/button";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import sectionReforma from "@/assets/section-reforma.jpg";
import { useRastrearSecao } from "./SectionBlock";

/**
 * Próximo passo · Preparar a reforma: fechamento do guia (antes/depois de uma reforma e o
 * pedido de orçamento, com a opção de simular o imóvel primeiro).
 */
export default function FinalCTASection() {
  const ref = useRastrearSecao<HTMLElement>("cta-final");
  return (
    <section ref={ref} id="cta-final" aria-labelledby="cta-final-titulo" className="scroll-mt-24 grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-[72px]">
      <img
        src={sectionReforma}
        alt="Antes e depois de uma reforma de studio"
        className="block aspect-video w-full rounded-[4px] object-cover"
        loading="lazy"
        width={1280}
        height={720}
      />
      <div className="min-w-0">
        <p className="rotulo-secao mb-2.5">Próximo passo · Preparar a reforma</p>
        <h2 id="cta-final-titulo" className="mb-4 font-display text-[28px] font-bold leading-[1.15] text-foreground md:text-[36px]">
          Já escolheu o bairro e validou a conta?
        </h2>
        <p className="mb-7 max-w-[520px] text-[17px] leading-[1.55] text-foreground-medium">
          A Bewild atua com arquitetura e construção e orça a reforma completa do seu studio, do projeto à entrega.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <OrcamentoButton local="final" rotulo="Solicitar orçamento de reforma" icone={false} className="min-h-[48px] px-[22px] text-[15px] font-semibold" />
          <Button asChild variant="outline" className="min-h-[48px] whitespace-normal px-5 text-[15px] font-semibold">
            <Link to="/projecao" onClick={() => trackGlobal("cta_clicked", { cta_id: "simular_primeiro", section: "cta_final" })}>Simular meu imóvel primeiro</Link>
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 text-sm">
          <Link to="/signup" className="inline-flex min-h-[44px] items-center text-primary underline underline-offset-4">Criar acesso para salvar seus cenários</Link>
          <a href="https://bewild.com.br" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1 text-primary underline underline-offset-4">
            Conheça a Bewild<ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
