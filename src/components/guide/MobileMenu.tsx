import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu, ArrowUpRight } from "lucide-react";
import bwildLogo from "@/assets/bwild-logo.png";
import { SECTIONS, PHASES } from "@/data/guide-data";

interface Props {
  activeId: string;
  sectionIndex: number;
  sectionCount: number;
}

export default function MobileMenu({ activeId, sectionIndex, sectionCount }: Props) {
  const [open, setOpen] = useState(false);

  const sectionsByPhase = PHASES.map((p) => ({
    ...p,
    sections: SECTIONS.filter((s) => s.phase === p.number),
  }));

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-nav px-4 py-3 flex items-center justify-between">
      <img src={bwildLogo} alt="Bwild" className="h-7 w-auto" />
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-body bg-muted/60 rounded-full px-2.5 py-0.5">
          {sectionIndex}/{sectionCount} seções
        </span>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="hover:bg-muted/50"><Menu size={22} /></Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/60">
            <SheetTitle className="flex items-center gap-2"><img src={bwildLogo} alt="Bwild" className="h-7 w-auto" /></SheetTitle>
          </SheetHeader>
          <nav className="px-3 py-4 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-thin">
            {sectionsByPhase.map((phase) => (
              <div key={phase.number}>
                <p className="text-[10px] font-body font-bold uppercase tracking-[0.15em] text-primary/50 mt-4 mb-2 px-2 first:mt-0">
                  {phase.number}. {phase.label}
                </p>
                <ul className="space-y-0.5">
                  {phase.sections.map((s) => {
                    const Icon = s.icon;
                    const isActive = activeId === s.id;
                    const isExternal = "href" in s && s.href;
                    return (
                      <li key={s.id}>
                        {isExternal ? (
                          <Link to={s.href!} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/60">
                            <Icon size={14} className="shrink-0" /><span className="truncate">{s.label}</span><ArrowUpRight size={11} className="ml-auto opacity-40 shrink-0" />
                          </Link>
                        ) : (
                          <a href={`#${s.id}`} onClick={() => setOpen(false)} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-200 ${isActive ? "bg-primary text-primary-foreground font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}>
                            <Icon size={14} className="shrink-0" /><span className="truncate">{s.label}</span>
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
