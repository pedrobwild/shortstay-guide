import type { ReactNode } from "react";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Legenda única do Radar para a natureza de cada número:
 * ● dado observado · ◌ estimativa Bewild · ▨ hipótese de simulação · ajustado por você.
 * Os símbolos são formas em CSS (não dependem da fonte) e ficam fora da leitura de tela.
 */
export type TipoNatureza = "observado" | "estimativa" | "hipotese" | "ajustado";

export const TEXTO_NATUREZA: Record<TipoNatureza, string> = {
  observado: "Dado observado",
  estimativa: "Estimativa Bewild",
  hipotese: "Hipótese",
  ajustado: "Ajustado por você",
};

export function SimboloNatureza({ tipo, className }: { tipo: TipoNatureza; className?: string }) {
  if (tipo === "observado") return <span aria-hidden="true" className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current", className)} />;
  if (tipo === "estimativa") return <span aria-hidden="true" className={cn("inline-block h-2 w-2 shrink-0 rounded-full border border-dashed border-current", className)} />;
  if (tipo === "hipotese") {
    return (
      <span
        aria-hidden="true"
        className={cn("inline-block h-2 w-2 shrink-0 border border-current bg-[repeating-linear-gradient(135deg,currentColor_0_1px,transparent_1px_3px)]", className)}
      />
    );
  }
  return null;
}

export default function NaturezaTag({
  tipo,
  children,
  tamanho = "md",
  className,
}: {
  tipo: TipoNatureza;
  children?: ReactNode;
  /** "sm" = 11px, usado ao lado de campos do formulário. */
  tamanho?: "md" | "sm";
  className?: string;
}) {
  return (
    <span className={cn(badgeVariants({ variant: tipo }), "whitespace-nowrap", tamanho === "sm" && "px-[7px] py-0.5 text-[11px]", className)}>
      <SimboloNatureza tipo={tipo} />
      {children ?? TEXTO_NATUREZA[tipo]}
    </span>
  );
}
