import { Check } from "lucide-react";
import { NOTA_SELO_BEWILD, TEXTO_SELO_BEWILD } from "@/lib/empreendimentos";
import { cn } from "@/lib/utils";

/** Selo "A Bewild já atua neste prédio" (sem contagem de unidades, decisão do Pedro de 30/10/2026). */
export default function SeloBewild({ className, comNota = false }: { className?: string; comNota?: boolean }) {
  return (
    <span className={cn("inline-flex flex-col gap-1", className)}>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-[2px] border border-tinta px-1.5 py-[1px] text-[12px] font-semibold leading-5 text-tinta" title={NOTA_SELO_BEWILD}>
        <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
        {TEXTO_SELO_BEWILD}
      </span>
      {comNota && <span className="e-legenda">{NOTA_SELO_BEWILD}</span>}
    </span>
  );
}
