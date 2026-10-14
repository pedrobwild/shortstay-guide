export type OrcamentoLocal = "final" | "meio" | "barra-celular" | "hero" | "recomendacao" | "plano-acao" | "chat" | "rodape" | "navbar" | "bairro" | "comparar";
export function orcamentoUrl(local: OrcamentoLocal) {
  const params = new URLSearchParams({ utm_source: "radar", utm_medium: "referral", utm_campaign: "radar_bewild", utm_content: local });
  return `https://bewild.com.br/orcamento?${params}`;
}