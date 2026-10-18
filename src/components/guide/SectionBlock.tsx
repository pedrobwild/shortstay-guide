import { useContext, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import LinkArtigoBewild from "./LinkArtigoBewild";
import type { ArtigoBewild } from "@/data/artigosBewild";
import { ModoPaginaGuia } from "./modoPaginaGuia";

interface SectionBlockProps {
  id: string;
  title: string;
  takeaway: string;
  children: React.ReactNode;
  className?: string;
  /** Análise completa no bewild.com.br, mostrada no fim da seção. */
  artigo?: ArtigoBewild;
  /**
   * Cartão resumido: na home a seção vira um cartão com título, frase de apoio e o
   * link para a página própria (/guia/<tema>), onde o conteúdo completo vive — a home
   * fica curta e o texto não aparece duplicado. Valor = caminho da página.
   * Dentro de uma página de tema (ModoPaginaGuia) a seção é sempre completa.
   */
  resumido?: string;
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
  const pagina = useContext(ModoPaginaGuia);
  if (resumido && !pagina) {
    return (
      <section ref={sectionRef} id={id} className={`scroll-mt-24 py-8 md:py-10 ${className ?? ""}`}>
        <Link
          to={resumido}
          onClick={() => trackGlobal("cta_clicked", { cta_id: "tema_guia", section: id })}
          className="group flex items-start justify-between gap-4 rounded-[4px] border border-border bg-card p-5 transition-colors hover:bg-accent-light md:p-6"
        >
          <span className="min-w-0">
            <h2 className="mb-2 font-display text-[24px] font-bold leading-[1.15] text-foreground text-balance md:text-[30px]">{title}</h2>
            <p className="max-w-[720px] text-[16px] leading-[1.55] text-muted-foreground">{takeaway}</p>
            <span className="mt-3 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-primary underline underline-offset-4">Ler o conteúdo completo<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
          </span>
          <ArrowRight className="mt-2 h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
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
