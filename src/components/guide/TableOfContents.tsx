import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import bwildLogo from "@/assets/bwild-logo.png";
import { SECTIONS } from "@/data/guide-data";

interface Props {
  activeId: string;
  visitedSections: Set<string>;
}

export default function TableOfContents({ activeId, visitedSections }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <nav
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen overflow-y-auto overflow-x-hidden border-r border-border/60 bg-card/90 backdrop-blur-md z-30 scrollbar-thin py-6 transition-all duration-300 ease-in-out ${expanded ? "w-56 px-3" : "w-[60px] px-2"}`}
    >
      <div className={`mb-6 flex items-center ${expanded ? "px-2" : "justify-center"}`}>
        {expanded ? (
          <img src={bwildLogo} alt="Bwild" className="h-7 w-auto" />
        ) : (
          <img src={bwildLogo} alt="Bwild" className="h-6 w-6 object-contain object-left" style={{ clipPath: "inset(0 60% 0 0)" }} />
        )}
      </div>
      {expanded && (
        <p className="text-[10px] font-body font-bold uppercase tracking-[0.15em] text-muted-foreground/70 mb-3 px-2">Índice</p>
      )}
      <ul className="space-y-0.5 flex-1">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = activeId === s.id;
          const isVisited = visitedSections.has(s.id);
          const isExternal = "href" in s && s.href;
          const baseClass = isActive
            ? "bg-primary text-primary-foreground font-semibold shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60";

          // Dot color
          const dotClass = isActive
            ? "bg-primary"
            : isVisited
            ? "bg-primary/40"
            : "bg-muted-foreground/30";

          const inner = (
            <>
              <Icon size={16} className="shrink-0" />
              {expanded && <span className="truncate text-sm font-body whitespace-nowrap">{s.label}</span>}
              {expanded && isExternal && <ArrowUpRight size={11} className="ml-auto opacity-40 shrink-0" />}
              {expanded && !isExternal && (
                <span className={`ml-auto w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${dotClass}`} />
              )}
            </>
          );
          return (
            <li key={s.id} className="relative group">
              {isExternal ? (
                <Link to={s.href!} className={`flex items-center gap-2.5 rounded-lg transition-all duration-200 ${baseClass} ${expanded ? "px-3 py-2" : "px-0 py-2 justify-center"}`}>{inner}</Link>
              ) : (
                <a href={`#${s.id}`} className={`flex items-center gap-2.5 rounded-lg transition-all duration-200 ${baseClass} ${expanded ? "px-3 py-2" : "px-0 py-2 justify-center"}`}>{inner}</a>
              )}
              {!expanded && (
                <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs font-body px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">{s.label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
