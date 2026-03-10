import { Button } from "@/components/ui/button";
import { trackGlobal } from "@/hooks/useGuideAnalytics";

export default function MobileStickyBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-card/95 backdrop-blur border-t border-border px-4 py-3 flex gap-2">
      <Button asChild className="flex-1 bg-primary text-primary-foreground" onClick={() => trackGlobal("cta_clicked", { cta_id: "simular_agora", section: "sticky_bar" })}>
        <a href="#simulador">Simular agora</a>
      </Button>
      <Button asChild variant="outline" className="flex-1" onClick={() => trackGlobal("cta_clicked", { cta_id: "diagnostico", section: "sticky_bar" })}>
        <a href="#cta-final">Diagnóstico grátis</a>
      </Button>
    </div>
  );
}
