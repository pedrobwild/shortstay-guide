import type { SizeKey } from "@/data/bairrosCurados";

export type OrcamentoLocal = "final" | "meio" | "barra-celular" | "hero" | "recomendacao" | "plano-acao" | "chat" | "rodape" | "navbar" | "bairro" | "comparar" | "projecao" | "guia" | "llms" | "ferramentas" | "area-exclusiva";

/**
 * Contexto útil para a Bewild (decisão de 27/10/2026): só o nome do bairro e a faixa de área.
 * Nunca valores da simulação nem dado pessoal.
 */
export type ContextoOrcamento = { bairro?: string | null; area?: SizeKey | null };

export function orcamentoUrl(local: OrcamentoLocal, contexto?: ContextoOrcamento) {
  const params = new URLSearchParams({ utm_source: "radar", utm_medium: "referral", utm_campaign: "radar_bewild", utm_content: local });
  if (contexto?.bairro) params.set("bairro", contexto.bairro);
  if (contexto?.area) params.set("area", contexto.area);
  return `https://bewild.com.br/orcamento?${params}`;
}
