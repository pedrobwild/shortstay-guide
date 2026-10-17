import { Button } from "@/components/ui/button";
import { trackGlobal } from "@/hooks/useGuideAnalytics";

export default function MobileStickyBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex min-h-[56px] gap-2 border-t border-border bg-card px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-sheet lg:hidden">
      <Button asChild className="min-h-[44px] flex-1 font-semibold" onClick={() => trackGlobal("cta_clicked", { cta_id: "simular_agora", section: "sticky_bar" })}>
        <a href="#simulador">Simular agora</a>
      </Button>
      <Button asChild variant="outline" className="min-h-[44px] flex-1 font-semibold" onClick={() => trackGlobal("cta_clicked", { cta_id: "explorar_bairros", section: "sticky_bar" })}>
        <a href="#mapa-bairros">Explorar bairros</a>
      </Button>
    </div>
  );
}
