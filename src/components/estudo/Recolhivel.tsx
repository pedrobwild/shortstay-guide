import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ChevronDown } from "lucide-react";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { cn } from "@/lib/utils";

/**
 * Bloco recolhido no celular (páginas curtas, decisão do Pedro em 16/11/2026): abaixo de
 * 1024px o bloco vira uma linha de 56px que abre com um toque; a partir de 1024px fica
 * aberto como sempre, sem botão. O conteúdo continua no HTML (pré-render e busca leem
 * tudo) e só é escondido por classe; sem JavaScript, o <noscript> do index.html o mostra.
 * Link para o bloco, ou para algo dentro dele (#id), abre o bloco antes de rolar.
 */
export function useRecolhivel<T extends HTMLElement = HTMLElement>(id: string, aoAbrir?: () => void): { aberto: boolean; alternar: () => void; ref: RefObject<T> } {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<T>(null);
  const aoAbrirRef = useRef(aoAbrir);
  aoAbrirRef.current = aoAbrir;

  // Bloco que já tem um "abrir" próprio por dentro (<details data-abre-junto> ou `aoAbrir`) abre os dois no mesmo toque.
  useEffect(() => {
    if (!aberto) return;
    ref.current?.querySelectorAll<HTMLDetailsElement>("details[data-abre-junto]").forEach((d) => { d.open = true; });
    aoAbrirRef.current?.();
  }, [aberto]);

  useEffect(() => {
    const abrirSeAlvo = (hash: string) => {
      const alvoId = decodeURIComponent(hash.replace(/^#/, ""));
      if (!alvoId || !ref.current) return;
      const alvo = document.getElementById(alvoId);
      if (!alvo || !ref.current.contains(alvo)) return;
      setAberto(true);
      // O alvo pode estar dentro do conteúdo que acabou de aparecer: rola depois de pintar.
      requestAnimationFrame(() => alvo.scrollIntoView({ block: "start" }));
    };
    abrirSeAlvo(window.location.hash);
    const aoMudarHash = () => abrirSeAlvo(window.location.hash);
    // Links do roteador e clique repetido no mesmo link não disparam hashchange.
    const aoClicar = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!link || link.pathname !== window.location.pathname) return;
      abrirSeAlvo(link.hash);
    };
    window.addEventListener("hashchange", aoMudarHash);
    document.addEventListener("click", aoClicar);
    return () => { window.removeEventListener("hashchange", aoMudarHash); document.removeEventListener("click", aoClicar); };
  }, []);

  const alternar = useCallback(() => {
    setAberto((atual) => {
      if (!atual) trackGlobal("cta_clicked", { cta_id: `abrir_${id}`, section: "recolhivel" });
      return !atual;
    });
  }, [id]);

  return { aberto, alternar, ref };
}

/** Classe do conteúdo: escondido no celular enquanto fechado, sempre visível no desktop. */
export const classeConteudoRecolhivel = (aberto: boolean) => cn("e-recolhe", !aberto && "hidden lg:block");

/** Trecho (não seção) recolhido no celular: mesma linha de toque, aberto no desktop. */
export function TrechoRecolhido({ id, rotulo, resumo, className, children }: { id: string; rotulo: string; resumo?: string; className?: string; children: ReactNode }) {
  const { aberto, alternar, ref } = useRecolhivel<HTMLDivElement>(id);
  return (
    <div ref={ref} id={id} data-recolhida="" className={cn("scroll-mt-20", className)}>
      <div className="border-y border-border lg:hidden">
        <BotaoRecolhivel id={id} rotulo={rotulo} resumo={resumo} aberto={aberto} alternar={alternar} />
      </div>
      <div id={`${id}-conteudo`} className={cn("pt-6 lg:pt-0", classeConteudoRecolhivel(aberto))}>{children}</div>
    </div>
  );
}

/** Linha de toque do bloco no celular (some a partir de 1024px). */
export function BotaoRecolhivel({ id, rotulo, resumo, aberto, alternar }: { id: string; rotulo: string; resumo?: string; aberto: boolean; alternar: () => void }) {
  return (
    <button
      type="button"
      aria-expanded={aberto}
      aria-controls={`${id}-conteudo`}
      onClick={alternar}
      className="e-recolhe-botao flex min-h-[56px] w-full items-center justify-between gap-4 py-3 text-left lg:hidden"
    >
      <span className="min-w-0">
        <span className="block text-[16px] font-semibold leading-snug">{rotulo}</span>
        {resumo && <span className="e-legenda block text-pretty">{resumo}</span>}
      </span>
      <ChevronDown aria-hidden="true" className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", aberto && "rotate-180")} />
    </button>
  );
}
