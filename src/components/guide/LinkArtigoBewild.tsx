import type { ArtigoBewild } from "@/data/artigosBewild";
import { cn } from "@/lib/utils";

/** Link discreto para a análise em artigo no bewild.com.br (link normal, sem UTM). */
export default function LinkArtigoBewild({ artigo, prefixo = "Leia a análise completa:", className }: { artigo: ArtigoBewild; prefixo?: string; className?: string }) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {prefixo}{" "}
      <a href={artigo.url} className="inline-flex min-h-[44px] items-center font-medium text-primary underline underline-offset-4">
        {artigo.titulo}
      </a>
    </p>
  );
}
