import { useEffect, useRef } from "react";
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
export default function SectionBlock({ id, title, takeaway, children, className, artigo }: SectionBlockProps) {
  const sectionRef = useRastrearSecao<HTMLElement>(id);
  return (
    <section ref={sectionRef} id={id} className={`scroll-mt-24 py-14 md:py-[72px] ${className ?? ""}`}>
      <h2 className="mb-3 font-display text-[28px] font-bold leading-[1.15] text-foreground text-balance md:text-[36px]">{title}</h2>
      <p className="mb-8 max-w-[720px] text-[17px] leading-[1.55] text-muted-foreground">{takeaway}</p>
      {children}
      {artigo && <LinkArtigoBewild artigo={artigo} className="mt-6" />}
    </section>
  );
}
