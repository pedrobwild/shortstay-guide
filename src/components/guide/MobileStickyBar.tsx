import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDeslocamentoChat } from "@/hooks/useDeslocamentoChat";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { cn } from "@/lib/utils";

/**
 * Barra fixa do celular (Simular agora · Explorar bairros). Fica recolhida enquanto as
 * três portas do hero estão na tela: elas já levam ao mapa e à simulação, e a barra
 * cobria a terceira porta. Começa recolhida também no HTML pré-renderizado, para a
 * hidratação bater; sem IntersectionObserver, aparece direto. O botão do chat acompanha.
 */
export default function MobileStickyBar() {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const portas = document.getElementById("portas-hero");
    if (!portas || typeof IntersectionObserver === "undefined") {
      setVisivel(true);
      return;
    }
    // Conta como fora da tela o que já passou para baixo da navbar (56px no celular).
    // Numa rolagem rápida podem chegar várias entradas no mesmo lote: vale a mais recente.
    const io = new IntersectionObserver((entradas) => {
      const ultima = entradas[entradas.length - 1];
      if (ultima) setVisivel(!ultima.isIntersecting);
    }, { rootMargin: "-56px 0px 0px 0px" });
    io.observe(portas);
    return () => io.disconnect();
  }, []);
  // O botão do chat acompanha a barra: acima dela quando aparece, no canto quando recolhida.
  // As duas posições somam a margem inferior do iPhone (barra de início).
  useDeslocamentoChat(visivel ? "calc(80px + env(safe-area-inset-bottom))" : "calc(24px + env(safe-area-inset-bottom))");

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex min-h-[56px] gap-2 border-t border-border bg-card px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-sheet transition-[transform,visibility] [transition-duration:250ms] ease-out motion-reduce:transition-none lg:hidden",
        visivel ? "visible translate-y-0" : "invisible translate-y-full",
      )}
    >
      <Button asChild className="min-h-[44px] flex-1 font-semibold" onClick={() => trackGlobal("cta_clicked", { cta_id: "simular_agora", section: "sticky_bar" })}>
        <a href="#simulador">Simular agora</a>
      </Button>
      <Button asChild variant="outline" className="min-h-[44px] flex-1 font-semibold" onClick={() => trackGlobal("cta_clicked", { cta_id: "explorar_bairros", section: "sticky_bar" })}>
        <a href="#mapa-bairros">Explorar bairros</a>
      </Button>
    </div>
  );
}
