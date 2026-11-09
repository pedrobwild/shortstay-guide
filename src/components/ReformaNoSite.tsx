import { LINKS_REFORMA_SITE } from "@/data/artigosBewild";
import { cn } from "@/lib/utils";

/**
 * Links de retorno do Radar para o bewild.com.br: o índice de custo de reforma e as
 * páginas de reforma por bairro. Entra no rodapé de toda tela pública (RodapeRadar) e
 * no HTML pré-renderizado de toda página (scripts/prerender.mjs).
 * Links normais, na mesma aba: sem nofollow, sem noreferrer e sem UTM (UTM só nos
 * botões de orçamento) — o site enxerga o Radar como origem.
 */
export default function ReformaNoSite({ className }: { className?: string }) {
  return (
    <nav aria-label="Reforma no site da Bewild" className={cn("min-w-0", className)}>
      <p className="font-semibold text-foreground">Reforma no site da Bewild</p>
      <ul className="flex flex-wrap items-center gap-x-4">
        {LINKS_REFORMA_SITE.map((l) => (
          <li key={l.url}>
            <a href={l.url} className="inline-flex min-h-[44px] items-center text-primary underline underline-offset-2">{l.titulo}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
