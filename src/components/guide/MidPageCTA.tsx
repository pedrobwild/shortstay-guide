import { Button } from "@/components/ui/button";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { Link } from "react-router-dom";

/** Chamada no meio do guia: bloco aberto por régua de 2px, sem gradiente. */
export default function MidPageCTA({ variant = "default" }: { variant?: "default" | "slim" }) {
  const isSlim = variant === "slim";
  return (
    <div className={isSlim ? "py-4" : "py-8"}>
      <div className="regua flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-[22px] font-semibold leading-tight text-foreground">Quer saber quanto seu studio pode render?</p>
          {!isSlim && <p className="mt-1 text-base text-muted-foreground font-body">Compare cenários, simule receita e descubra o potencial real do seu imóvel.</p>}
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <Button asChild className="min-h-[44px] px-[18px] font-semibold" onClick={() => trackGlobal("cta_clicked", { cta_id: "simular_agora", section: `midpage_${variant}` })}>
            <Link to="/mercado">Simular agora</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-[44px] px-[18px] font-semibold" onClick={() => trackGlobal("cta_clicked", { cta_id: "ferramentas", section: `midpage_${variant}` })}>
            <Link to="/ferramentas">Ferramentas</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
