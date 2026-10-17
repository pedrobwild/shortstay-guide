export type OrcamentoLocal = "final" | "meio" | "barra-celular" | "hero" | "recomendacao" | "plano-acao" | "chat" | "rodape" | "navbar" | "bairro" | "comparar" | "projecao";

/** Contexto da simulação levado ao pedido de orçamento (só números e escolhas da simulação, nenhum dado pessoal). */
export interface ContextoOrcamento {
  /** Nome do bairro simulado (vai como slug). */
  bairro?: string;
  /** Faixa de área escolhida, ex.: "26–35 m²". */
  area?: string;
  /** Valor do imóvel informado, em reais. */
  valorImovel?: number;
  /** Resultado líquido simulado em 12 meses, em reais. */
  resultadoLiquido?: number;
}

const slug = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * URL oficial do pedido de orçamento com UTM do local do botão. Com contexto
 * (pedido feito a partir da projeção), acrescenta bairro, faixa de área, valor
 * do imóvel e resultado simulado para o pedido começar pelo imóvel da pessoa.
 */
export function orcamentoUrl(local: OrcamentoLocal, contexto?: ContextoOrcamento) {
  const params = new URLSearchParams({ utm_source: "radar", utm_medium: "referral", utm_campaign: "radar_bewild", utm_content: local });
  if (contexto) {
    if (contexto.bairro) params.set("bairro", slug(contexto.bairro));
    if (contexto.area) params.set("area", contexto.area.replace(/[^\d–-]/g, "").replace("–", "-"));
    if (contexto.valorImovel && contexto.valorImovel > 0) params.set("valor_imovel", String(Math.round(contexto.valorImovel)));
    if (contexto.resultadoLiquido !== undefined && Number.isFinite(contexto.resultadoLiquido)) params.set("resultado_12m", String(Math.round(contexto.resultadoLiquido)));
  }
  return `https://bewild.com.br/orcamento?${params}`;
}
