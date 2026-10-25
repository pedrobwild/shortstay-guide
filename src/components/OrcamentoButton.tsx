import type { Button } from "@/components/ui/button";
import type { OrcamentoLocal } from "@/lib/orcamento";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Button>, "asChild" | "children" | "onClick"> & {
  local: OrcamentoLocal;
  /** Texto do botão; o padrão é o CTA oficial "Peça seu orçamento". */
  rotulo?: string;
  /** Seta de link externo ao lado do texto. */
  icone?: boolean;
};

/** Mantém os pontos de integração, sem exibir CTA nem medir clique de orçamento. */
export default function OrcamentoButton(_props: Props) {
  return null;
}
