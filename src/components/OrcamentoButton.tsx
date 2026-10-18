import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { orcamentoUrl, type OrcamentoLocal } from "@/lib/orcamento";
import { trackBudgetClick } from "@/lib/marketingConsent";
import type { ComponentProps } from "react";
import NovaAba from "@/components/NovaAba";

type Props = Omit<ComponentProps<typeof Button>, "asChild" | "children" | "onClick"> & {
  local: OrcamentoLocal;
  /** Texto do botão; o padrão é o CTA oficial "Peça seu orçamento". */
  rotulo?: string;
  /** Seta de link externo ao lado do texto. */
  icone?: boolean;
};

/**
 * Única entrada de lead do Radar: o pedido de orçamento da Bewild (bewild.com.br/orcamento
 * com UTM do local). O clique só é medido com consentimento (trackBudgetClick).
 */
export default function OrcamentoButton({ local, rotulo = "Peça seu orçamento", icone = true, ...props }: Props) {
  return (
    <Button {...props} className={`max-w-full whitespace-normal text-center ${props.className ?? ""}`} asChild onClick={() => trackBudgetClick(local)}>
      <a href={orcamentoUrl(local)} target="_blank" rel="noopener noreferrer">
        {rotulo}<NovaAba />{icone && <ArrowUpRight size={16} className="ml-2 shrink-0" aria-hidden="true" />}
      </a>
    </Button>
  );
}
