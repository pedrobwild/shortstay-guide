/**
 * Monta o bloco de contexto do projeto do cliente que é injetado no prompt da
 * edge function `chat`, para que o consultor responda ancorado nos números do
 * próprio investidor ("qual o ROI do meu studio?", "quanto rende no meu
 * bairro?") em vez de respostas genéricas.
 *
 * Funções puras (sem React/Supabase): o contexto é construído no front a partir
 * de dados já filtrados por RLS para o usuário logado — assim a edge function
 * nunca consulta o projeto de outro usuário, e não há vazamento entre contas.
 */

import type { ProjectionSummary } from "@/lib/projectAnalytics";

export interface ProjectChatContextInput {
  hasProject: boolean;
  projectName: string | null;
  neighborhood: string | null;
  areaSqm: string | null;
  hasPropertyValue: boolean;
  projection: ProjectionSummary | null;
  /** Status da negociação inferido do funil (rótulo + próximo passo). */
  dealLabel: string | null;
  nextStepLabel: string | null;
}

export interface ProjectChatContext {
  /** Há um projeto com projeção configurada para ancorar respostas. */
  hasContext: boolean;
  /** Bloco em markdown pronto para o system prompt (vazio se sem contexto). */
  context: string;
}

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);

const pct = (v: number, digits = 1) => `${v.toFixed(digits)}%`;

/**
 * Constrói o contexto textual do projeto ativo do cliente. Sempre devolve uma
 * string utilizável: quando não há projeto/projeção, devolve uma orientação
 * curta para o bot (sem números), de modo que ele não invente métricas.
 */
export function buildProjectChatContext(
  input: ProjectChatContextInput,
): ProjectChatContext {
  if (!input.hasProject || !input.projectName) {
    return {
      hasContext: false,
      context:
        "O usuário ainda NÃO tem um projeto ativo na plataforma. Responda com base " +
        "apenas nos dados gerais de mercado dos bairros acima e convide-o a criar um " +
        "projeto no painel ou a falar com um especialista BWild para uma análise " +
        "personalizada do seu studio.",
    };
  }

  const lines: string[] = [`- Projeto: ${input.projectName}`];

  if (input.neighborhood) {
    lines.push(`- Bairro do projeto: ${input.neighborhood}`);
  }
  if (input.areaSqm) {
    lines.push(`- Faixa de área do studio: ${input.areaSqm}`);
  }

  const p = input.projection;
  const hasProjection = !!input.neighborhood && !!p;

  if (hasProjection && p) {
    lines.push(
      `- Ocupação média projetada: ${pct(p.occupancyPct, 0)}`,
      `- Diária média (ADR) projetada: ${brl(p.adr)}`,
      `- Receita bruta anual projetada: ${brl(p.annualGrossRevenueBrl)}`,
      `- Receita líquida anual projetada: ${brl(p.annualNetRevenueBrl)}`,
      `- Margem líquida projetada: ${pct(p.netMarginPct)}`,
      `- Yield bruto: ${pct(p.grossYieldPct, 2)}`,
    );

    if (input.hasPropertyValue) {
      lines.push(`- ROI líquido (cap rate): ${pct(p.capRatePct, 2)} ao ano`);
      lines.push(
        p.paybackYears != null
          ? `- Payback estimado: ${p.paybackYears.toFixed(1)} anos`
          : `- Payback estimado: indisponível (receita líquida não positiva)`,
      );
    } else {
      lines.push(
        "- ROI (cap rate) e payback: INDISPONÍVEIS — o valor do imóvel ainda não " +
          "foi informado no projeto. NÃO estime esses números; oriente o usuário a " +
          "informar o valor do imóvel no painel para liberá-los.",
      );
    }
  } else {
    lines.push(
      "- A projeção ainda NÃO foi configurada (falta escolher bairro/área). NÃO " +
        "invente projeção; oriente o usuário a configurar a projeção no painel.",
    );
  }

  if (input.dealLabel) {
    lines.push(`- Status da negociação: ${input.dealLabel}`);
  }
  if (input.nextStepLabel) {
    lines.push(`- Próximo passo sugerido no painel: ${input.nextStepLabel}`);
  }

  return {
    hasContext: hasProjection,
    context: lines.join("\n"),
  };
}
