import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ItemMetadado {
  rotulo: string;
  valor: ReactNode;
}

/**
 * Bloco de metadados sem moldura (substitui o carimbo de 1px): fonte, período,
 * coleta e amostra (n), como numa ficha de estudo. Lista de definição semântica.
 */
export default function Metadados({ itens, className, compacto = false }: { itens: ItemMetadado[]; className?: string; compacto?: boolean }) {
  return (
    <dl className={cn("flex flex-wrap", compacto ? "gap-x-6 gap-y-2" : "gap-x-10 gap-y-4", className)}>
      {itens.map((i) => (
        <div key={i.rotulo} className="min-w-0">
          <dt className="e-rotulo">{i.rotulo}</dt>
          <dd className={cn("mt-1", compacto ? "text-[15px] leading-[22px]" : "text-base leading-6")}>{i.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
