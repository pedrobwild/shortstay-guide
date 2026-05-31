/** Helpers de formatação compartilhados pelo painel admin de leads. */

export const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

export const fmtDateTime = (iso: string | null) =>
  iso ? dateTimeFmt.format(new Date(iso)) : "—";

export const fmtDate = (iso: string | null) =>
  iso ? dateFmt.format(new Date(iso)) : "—";

/**
 * Monta o link wa.me a partir do WhatsApp do lead. Mantém só dígitos e
 * prefixa o DDI 55 (Brasil) quando o número não traz código de país.
 */
export function whatsappHref(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

/** Rótulos legíveis dos event_type da telemetria, para a timeline. */
export const EVENT_LABELS: Record<string, string> = {
  page_view: "Abriu o guia",
  scroll_25: "Rolou 25%",
  scroll_50: "Rolou 50%",
  scroll_75: "Rolou 75%",
  scroll_100: "Leu até o fim",
  section_enter: "Entrou em seção",
  persona_toggle: "Alternou persona (quiz)",
  mercado_used: "Usou dados de mercado",
  simulator_used: "Usou o simulador",
  export_simulation: "Exportou a simulação",
  cta_clicked: "Clicou em CTA",
  chatbot_opened: "Abriu o assistente",
  chatbot_message: "Enviou mensagem ao assistente",
  chatbot_cta_specialist: "Pediu especialista (chatbot)",
  lead_submitted: "Enviou o formulário",
  lead_access_created: "Criou acesso exclusivo",
};
