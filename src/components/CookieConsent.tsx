import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isMeasurementAllowedPath, readConsent, saveConsent, syncMeasurement, trackPageView, type ConsentChoice } from "@/lib/marketingConsent";
import { registrarVisitaBairro } from "@/lib/visitasBairro";

export default function CookieConsent() {
  const location = useLocation();
  const [choice, setChoice] = useState<ConsentChoice | null>(readConsent);
  useEffect(() => {
    syncMeasurement(); trackPageView(); void registrarVisitaBairro();
    const update = () => { setChoice(readConsent()); trackPageView(); void registrarVisitaBairro(); };
    window.addEventListener("radar-consent-change", update);
    return () => window.removeEventListener("radar-consent-change", update);
  }, [location.pathname, location.search, location.hash]);
  const decide = (value: ConsentChoice) => { saveConsent(value); setChoice(readConsent()); };
  if (choice || !isMeasurementAllowedPath(location.pathname)) return null;
  return <section role="dialog" aria-label="Preferências de cookies" className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-background shadow-lg px-5 py-5 font-body">
    <div className="mx-auto max-w-5xl flex flex-col sm:flex-row sm:items-center gap-4">
      <p className="text-sm text-muted-foreground flex-1">Com sua autorização, usamos cookies para medir visitas, simulações e pedidos de orçamento. Você pode recusar. <a href="https://bewild.com.br/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex min-h-[44px] items-center">Política de privacidade</a></p>
      <div className="flex gap-3"><Button variant="outline" className="min-h-[44px] flex-1" onClick={() => decide("refused")}>Recusar</Button><Button className="min-h-[44px] flex-1" onClick={() => decide("accepted")}>Aceitar</Button></div>
    </div>
  </section>;
}