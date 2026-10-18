import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import LinkArtigoBewild from "./LinkArtigoBewild";
import type { ArtigoBewild } from "@/data/artigosBewild";

interface SectionBlockProps {
  id: string;
  title: string;
  takeaway: string;
  children: React.ReactNode;
  className?: string;
  /** Análise completa no bewild.com.br, mostrada no fim da seção. */
  artigo?: ArtigoBewild;
  /**
   * Cartão resumido: a home mostra título e frase de apoio e o conteúdo completo
   * abre sob demanda (details/summary nativo: o texto continua no HTML, indexável
   * e acessível sem JavaScript). Texto do botão opcional.
   */
  resumido?: boolean | string;
}

/** Registra "section_enter" (telemetria interna, só com consentimento) na primeira vez que a seção aparece. */
export function useRastrearSecao<T extends HTMLElement>(id: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          trackGlobal("section_enter", { section_id: id });
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [id]);
  return ref;
}

/** Seção do guia: título em Playfair, frase de apoio e conteúdo. Sem animação de entrada (só funcionais). */
export default function SectionBlock({ id, title, takeaway, children, className, artigo, resumido }: SectionBlockProps) {
  const sectionRef = useRastrearSecao<HTMLElement>(id);
  if (resumido) {
    const rotulo = typeof resumido === "string" ? resumido : "Ler o conteúdo completo";
    return (
      <section ref={sectionRef} id={id} className={`scroll-mt-24 py-10 md:py-14 ${className ?? ""}`}>
        <details className="group rounded-[4px] border border-border bg-card p-5 md:p-6" onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) trackGlobal("section_expand", { section_id: id }); }}>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">
              <h2 className="mb-2 font-display text-[24px] font-bold leading-[1.15] text-foreground text-balance md:text-[30px]">{title}</h2>
              <p className="max-w-[720px] text-[16px] leading-[1.55] text-muted-foreground">{takeaway}</p>
              <span className="mt-3 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-primary underline underline-offset-4">
                <span className="group-open:hidden">{rotulo}</span><span className="hidden group-open:inline">Recolher</span>
              </span>
            </span>
            <ChevronDown className="mt-2 h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-6 border-t border-border pt-6">
            {children}
            {artigo && <LinkArtigoBewild artigo={artigo} className="mt-6" />}
          </div>
        </details>
      </section>
    );
  }
  return (
    <section ref={sectionRef} id={id} className={`scroll-mt-24 py-14 md:py-[72px] ${className ?? ""}`}>
      <h2 className="mb-3 font-display text-[28px] font-bold leading-[1.15] text-foreground text-balance md:text-[36px]">{title}</h2>
      <p className="mb-8 max-w-[720px] text-[17px] leading-[1.55] text-muted-foreground">{takeaway}</p>
      {children}
      {artigo && <LinkArtigoBewild artigo={artigo} className="mt-6" />}
    </section>
  );
}
