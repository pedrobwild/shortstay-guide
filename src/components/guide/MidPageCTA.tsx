import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { Link } from "react-router-dom";

export default function MidPageCTA({ variant = "default" }: { variant?: "default" | "slim" }) {
  const isSlim = variant === "slim";
  return (
    <div className={isSlim ? "py-4" : "py-8"}>
      <Card className="bg-hero-gradient border-0">
        <CardContent className={`${isSlim ? "p-6" : "p-8"} flex flex-col sm:flex-row items-center justify-between gap-4`}>
          <div>
            <p className="font-display text-lg font-bold text-primary-foreground">Quer saber quanto seu studio pode render?</p>
            {!isSlim && <p className="text-base text-primary-foreground/80 font-body mt-1">Compare cenários, simule receita e descubra o potencial real do seu imóvel.</p>}
            <p className="text-sm text-primary-foreground/70 font-body mt-1">Use nossa análise inteligente ou solicite um diagnóstico personalizado.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button asChild size="sm" className="bg-accent text-accent-foreground font-body" onClick={() => trackGlobal("cta_clicked", { cta_id: "simular_agora", section: `midpage_${variant}` })}>
              <Link to="/intelligence">Simular agora</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-body" onClick={() => trackGlobal("cta_clicked", { cta_id: "diagnostico", section: `midpage_${variant}` })}>
              <a href="#cta-final">Diagnóstico grátis</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
