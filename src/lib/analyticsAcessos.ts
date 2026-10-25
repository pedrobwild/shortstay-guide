import { supabase } from "@/integrations/supabase/client";

export type EventoAcesso = { id: string; created_at: string | null; event_type: string; device_type: string | null; session_id: string | null; page: string | null };
const dia = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

export function resumirAcessos(eventos: EventoAcesso[]) {
  const visitas = eventos.filter(e => e.event_type === "page_view");
  const agrupar = (linhas: EventoAcesso[], chave: (e: EventoAcesso) => string) => {
    const grupos = new Map<string, number>();
    linhas.forEach(e => { const nome = chave(e); grupos.set(nome, (grupos.get(nome) ?? 0) + 1); });
    return [...grupos].map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
  };
  return {
    visualizacoes: visitas.length,
    sessoes: new Set(visitas.map(e => e.session_id).filter(Boolean)).size,
    interacoes: eventos.length - visitas.length,
    porDia: agrupar(visitas.filter(e => e.created_at), e => dia(e.created_at ?? "")).sort((a, b) => a.nome.localeCompare(b.nome)),
    aparelhos: agrupar(visitas, e => e.device_type ?? "Não registrado"),
    paginas: agrupar(visitas, e => e.page === "guide" ? "Guia (registro anterior)" : e.page ?? "Não registrada"),
    eventos: agrupar(eventos, e => e.event_type),
  };
}

export async function carregarAcessos(dias: number): Promise<EventoAcesso[]> {
  const inicio = new Date();
  inicio.setTime(inicio.getTime() - dias * 86400000);
  const fim = new Date().toISOString();
  const linhas: EventoAcesso[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("guide_events")
      .select("id,created_at,event_type,device_type,session_id,page")
      .gte("created_at", inicio.toISOString()).lte("created_at", fim)
      .order("created_at", { ascending: false }).order("id", { ascending: false })
      .range(offset, offset + 999);
    if (error) throw error;
    linhas.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) return linhas;
  }
}