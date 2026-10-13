import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { orcamentoUrl, type OrcamentoLocal } from "@/lib/orcamento";
import { trackBudgetClick } from "@/lib/marketingConsent";
import type { ComponentProps } from "react";

export default function OrcamentoButton({ local, ...props }: Omit<ComponentProps<typeof Button>, "asChild" | "children" | "onClick"> & { local: OrcamentoLocal }) {
  return <Button {...props} className={`max-w-full whitespace-normal text-center ${props.className ?? ""}`} asChild onClick={() => trackBudgetClick(local)}><a href={orcamentoUrl(local)} target="_blank" rel="noopener noreferrer">Peça seu orçamento<ArrowUpRight size={16} className="ml-2 shrink-0" /></a></Button>;
}