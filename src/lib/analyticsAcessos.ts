import { supabase } from "@/integrations/supabase/client";

export type EventoAcesso = { id: string; event_data?: unknown; created_at: string | null; event_type: string; device_type: string | null; session_id: string | null; page: string | null };
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
      .select("id,created_at,event_type,device_type,session_id,page,event_data")
      .gte("created_at", inicio.toISOString()).lte("created_at", fim)
      .order("created_at", { ascending: false }).order("id", { ascending: false })
      .range(offset, offset + 999);
    if (error) throw error;
    linhas.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) return linhas;
  }
}
/** Classifica a origem pelo endereço de quem indicou a visita, só pelo domínio (nunca guarda a URL completa). */
export function classificarOrigem(referrer: unknown): string {
  if (typeof referrer !== "string" || !referrer.trim()) return "Acesso direto";
  let host: string;
  try { host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, ""); } catch { return "Não identificada"; }
  if (host.endsWith("radarbewild.com.br") || host.endsWith("radarbewild.com")) return "Navegação interna";
  if (host.includes("lovable")) return "Prévia de edição (equipe)";
  if (/(^|\.)google\./.test(host)) return "Google";
  if (host.endsWith("bing.com")) return "Bing";
  if (host.endsWith("bewild.com.br") || host.endsWith("bwild.com.br")) return "Site Bewild";
  if (/instagram|facebook|fb\.|l\.messenger/.test(host)) return "Instagram/Facebook";
  if (host.includes("linkedin") || host === "lnkd.in") return "LinkedIn";
  if (host.includes("whatsapp") || host === "wa.me") return "WhatsApp";
  return host;
}

export function agruparOrigens(eventos: { event_type: string; event_data?: unknown }[]) {
  const grupos = new Map<string, number>();
  for (const e of eventos) {
    if (e.event_type !== "page_view") continue;
    const ref = e.event_data && typeof e.event_data === "object" ? (e.event_data as Record<string, unknown>).referrer : undefined;
    const nome = classificarOrigem(ref);
    grupos.set(nome, (grupos.get(nome) ?? 0) + 1);
  }
  return [...grupos].map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
}

export type Contato = { id: string; created_at: string | null; neighborhood: string | null; objective: string | null; source: string | null };

export async function carregarContatos(dias: number): Promise<Contato[]> {
  const inicio = new Date(Date.now() - dias * 86400000).toISOString();
  const linhas: Contato[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("guide_leads").select("id,created_at,neighborhood,objective,source")
      .gte("created_at", inicio).order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 999);
    if (error) throw error;
    linhas.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) return linhas;
  }
}

/** Contas criadas dentro da janela, separando clientes de administradores. */
export function contasNoPeriodo(contas: { criado_em: string; admin: boolean }[], dias: number, agora = new Date()) {
  const limite = agora.getTime() - dias * 86400000;
  const novas = contas.filter(c => new Date(c.criado_em).getTime() >= limite);
  return { total: contas.length, novas: novas.length, novosClientes: novas.filter(c => !c.admin).length };
}
