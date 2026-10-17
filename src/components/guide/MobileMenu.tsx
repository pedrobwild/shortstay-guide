import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { SECTIONS, PHASES } from "@/data/guide-data";
import { cn } from "@/lib/utils";

interface Props {
  activeId: string;
  /** Chamado ao escolher uma seção (fecha o menu lateral da navbar). */
  onNavegar?: () => void;
}

/**
 * Seções do guia agrupadas pelas 4 fases, para o menu lateral da navbar no
 * celular (a navbar global substitui a antiga barra fixa do guia). A fase da
 * seção ativa abre sozinha; links externos (ex.: /mercado) saem do guia.
 */
export default function MenuSecoesGuia({ activeId, onNavegar }: Props) {
  const activePhase = useMemo(() => SECTIONS.find((s) => s.id === activeId)?.phase ?? 0, [activeId]);
  // A fase ativa abre sozinha, mas pode ser fechada; as demais abrem ao toque.
  const [abertas, setAbertas] = useState<Set<number>>(() => new Set());
  const [fechadas, setFechadas] = useState<Set<number>>(() => new Set());
  const aberta = (n: number) => abertas.has(n) || (n === activePhase && !fechadas.has(n));

  const togglePhase = (num: number) => {
    const fechar = aberta(num);
    setAbertas((prev) => { const next = new Set(prev); if (fechar) next.delete(num); else next.add(num); return next; });
    setFechadas((prev) => { const next = new Set(prev); if (fechar) next.add(num); else next.delete(num); return next; });
  };

  const heroSections = SECTIONS.filter((s) => s.phase === 0);
  const sectionsByPhase = PHASES.map((p) => ({ ...p, sections: SECTIONS.filter((s) => s.phase === p.number) }));

  return (
    <div className="font-body">
      <ul className="mb-1 space-y-0.5">
        {heroSections.map((s) => {
          const Icon = s.icon;
          const isActive = activeId === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={onNavegar}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive ? "bg-accent-light font-semibold text-primary" : "text-foreground-medium hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon size={16} className="shrink-0" />
                <span>Início</span>
              </a>
            </li>
          );
        })}
      </ul>

      {sectionsByPhase.map((phase) => {
        const isOpen = aberta(phase.number);
        const isPhaseActive = activePhase === phase.number;
        return (
          <div key={phase.number} className="mb-0.5">
            <button
              type="button"
              onClick={() => togglePhase(phase.number)}
              aria-expanded={isOpen}
              className={cn(
                "flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary",
                isPhaseActive ? "font-semibold text-primary" : "text-foreground",
              )}
            >
              <span className="w-5 shrink-0 text-xs font-semibold tabular-nums text-accent-text">{String(phase.number).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1 truncate leading-tight">{phase.label}</span>
              <ChevronDown size={14} className={cn("shrink-0 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} aria-hidden="true" />
            </button>
            {isOpen && (
              <ul className="mb-2 ml-5 space-y-0.5 border-l border-border pl-3">
                {phase.sections.map((s) => {
                  const Icon = s.icon;
                  const isActive = activeId === s.id;
                  const href = "href" in s ? s.href : undefined;
                  const classe = cn(
                    "flex min-h-[44px] items-center gap-2 rounded-md px-2 py-2 transition-colors",
                    isActive ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground",
                  );
                  const inner = (
                    <>
                      <Icon size={14} className="shrink-0 opacity-60" />
                      <span className="truncate text-[13px]">{s.label}</span>
                      {href && <ArrowUpRight size={10} className="ml-auto shrink-0 opacity-40" />}
                    </>
                  );
                  return (
                    <li key={s.id}>
                      {href
                        ? <Link to={href} onClick={onNavegar} className={classe}>{inner}</Link>
                        : <a href={`#${s.id}`} onClick={onNavegar} aria-current={isActive ? "location" : undefined} className={classe}>{inner}</a>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
