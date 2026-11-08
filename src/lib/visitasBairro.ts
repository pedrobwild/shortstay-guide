import { canMeasure } from "@/lib/marketingConsent";
import { SEO_BAIRROS, bairroPath } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";

const caminhos = new Set(SEO_BAIRROS.map(bairroPath));
let ultimaPagina = "";
let sessao: string | undefined;

/** Apenas páginas conhecidas, sem query string, identidade ou URL de origem completa. */
export async function registrarVisitaBairro() {
  if (!canMeasure()) { ultimaPagina = ""; return; }
  const pagina = window.location.pathname.replace(/\/$/, "");
  if (!caminhos.has(pagina)) { ultimaPagina = ""; return; }
  if (ultimaPagina === pagina) return;
  ultimaPagina = pagina;
  sessao ??= crypto.randomUUID();
  const largura = window.innerWidth;
  try {
    const { error } = await supabase.from("guide_events").insert({
      event_type: "page_view", page: pagina, session_id: sessao,
      device_type: largura < 768 ? "mobile" : largura <= 1024 ? "tablet" : "desktop",
      event_data: {}, created_at: new Date().toISOString(),
    });
    if (error && ultimaPagina === pagina) ultimaPagina = "";
  } catch { if (ultimaPagina === pagina) ultimaPagina = ""; }
}