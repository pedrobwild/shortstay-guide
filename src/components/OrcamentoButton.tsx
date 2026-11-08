import { ArrowUpRight } from "lucide-react";
import NovaAba from "@/components/NovaAba";
import { Button } from "@/components/ui/button";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { trackBudgetClick } from "@/lib/marketingConsent";
import { orcamentoUrl, type ContextoOrcamento, type OrcamentoLocal } from "@/lib/orcamento";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Button>, "asChild" | "children" | "onClick"> & {
  local: OrcamentoLocal;
  /** Texto do botão; o padrão é o CTA oficial "Peça seu orçamento". */
  rotulo?: string;
  /** Seta de link externo ao lado do texto (padrão: sim). */
  icone?: boolean;
  /** Bairro e faixa de área que seguem na URL do pedido; nunca dado pessoal. */
  contexto?: ContextoOrcamento;
};

/** CTA oficial de orçamento: link externo com UTM do local, medido por GA4/Pixel (consentido) e pela telemetria interna. */
export default function OrcamentoButton({ local, rotulo = "Peça seu orçamento", icone = true, contexto, className, ...rest }: Props) {
  const aoClicar = () => {
    trackBudgetClick(local);
    trackGlobal("cta_clicked", { cta_id: "orcamento", local, bairro: contexto?.bairro || null });
  };
  // h-auto/max-w-full/whitespace-normal: rótulos longos quebram linha em vez de estourar a largura (320 px).
  return (
    <Button variant="default" {...rest} className={cn("h-auto min-h-[44px] max-w-full whitespace-normal text-center", className)} asChild>
      <a href={orcamentoUrl(local, contexto)} target="_blank" rel="noopener noreferrer" onClick={aoClicar}>
        {rotulo}
        {icone && (
          <>
            <NovaAba />
            <ArrowUpRight size={14} aria-hidden="true" className="shrink-0" />
          </>
        )}
      </a>
    </Button>
  );
}
