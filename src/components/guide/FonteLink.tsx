import type { FonteGuia } from "@/data/fontesGuia";
import { cn } from "@/lib/utils";
import NovaAba from "@/components/NovaAba";

/**
 * Link de fonte (título curto + URL de fontesGuia/base do Radar). Alvo de toque
 * de 44px. `carimbo` desenha o texto como etiqueta cinza (carimbo de fonte da
 * direção Híbrida) sem perder o alvo de toque.
 */
export default function FonteLink({ fonte, carimbo = false, className }: { fonte: FonteGuia; carimbo?: boolean; className?: string }) {
  if (carimbo) {
    return (
      <a href={fonte.url} target="_blank" rel="noopener noreferrer" className={cn("group inline-flex min-h-[44px] max-w-full items-center", className)}>
        <span className="rounded-[4px] bg-background px-2 py-[3px] text-xs text-foreground-medium underline decoration-input underline-offset-2 break-words group-hover:decoration-current">
          {fonte.title}
        </span>
        <NovaAba />
      </a>
    );
  }
  return (
    <a href={fonte.url} target="_blank" rel="noopener noreferrer" className={cn("inline-flex min-h-[44px] max-w-full items-center text-xs text-primary underline underline-offset-4 break-words", className)}>
      {fonte.title}<NovaAba />
    </a>
  );
}
