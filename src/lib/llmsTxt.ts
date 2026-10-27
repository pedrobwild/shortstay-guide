import { SEO_ROUTES, SITE_NAME, SITE_URL, bairroPath, urlCanonica } from "@/lib/seo";
import { CAMINHO_CSV, CAMINHO_JSON, LICENCA_DADOS_NOME, linhasDadosAbertos, type LinhaDadosAbertos } from "@/lib/dadosAbertos";
import { FONTE_BAIRROS_CURADOS, SAO_PAULO_REFERENCIA } from "@/data/bairrosCurados";
import { GARANTIA_ANOS, PRAZO_DIAS_UTEIS_MAX, PRAZO_DIAS_UTEIS_MIN, REFORMAS_ENTREGUES, BAIRROS_ATENDIDOS } from "@/data/provasBewild";
import { orcamentoUrl } from "@/lib/orcamento";
import { AVISO_UNIVERSO } from "@/lib/estudo";

/**
 * /llms.txt (e a cópia em /.well-known/llms.txt): o que o Radar é, as páginas públicas
 * e os números por bairro com fonte, natureza e aviso, para robôs de IA citarem certo.
 * Mesmo formato do llms.txt do bewild.com.br; gerado no build a partir de seoRoutes.json
 * e da reserva offline (os mesmos números do banco, por regra). Nenhum número é
 * inventado aqui: tudo vem de dadosAbertos.ts, bairrosCurados.ts e provasBewild.ts.
 */
const n = new Intl.NumberFormat("pt-BR");
const brl = (v: number) => `R$ ${n.format(Math.round(v))}`;

export const LLMS_TXT_CAMINHOS = ["/llms.txt", "/.well-known/llms.txt"] as const;

const NATUREZA: Record<LinhaDadosAbertos["natureza"], string> = {
  observado: "dado observado",
  aproximacao: "aproximação",
  estimativa: "estimativa Bewild",
};

function linhaBairro(l: LinhaDadosAbertos): string {
  const partes = [
    `ocupação ${n.format(l.ocupacao_pct)}%`,
    `diária média ${brl(l.diaria_media_brl)}`,
    l.diaria_p25_brl != null && l.diaria_mediana_brl != null && l.diaria_p75_brl != null
      ? `quartis ${brl(l.diaria_p25_brl)} / ${brl(l.diaria_mediana_brl)} / ${brl(l.diaria_p75_brl)}`
      : null,
    l.anuncios_ativos != null ? `${n.format(l.anuncios_ativos)} anúncios` : null,
    `receita de referência ${brl(l.receita_mensal_referencia_brl)}/mês`,
    l.periodo ? `período ${l.periodo}` : null,
    `${NATUREZA[l.natureza]}: ${l.fonte}`,
    l.aviso?.replace(/\.$/, "") ?? null,
  ].filter(Boolean);
  return `- [${l.bairro}](${urlCanonica(bairroPath(l.bairro))}): ${partes.join("; ")}.`;
}

export function gerarLlmsTxt(linhas: LinhaDadosAbertos[] = linhasDadosAbertos(), geradoEm = new Date().toISOString().slice(0, 10)): string {
  const paginas = SEO_ROUTES.map((r) => `- [${r.h1}](${urlCanonica(r.path)}): ${r.description}`);
  const [a, m, d] = geradoEm.split("-");
  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_NAME} (${SITE_URL}) é o guia do investidor em studios compactos para short stay (Airbnb) em São Paulo, produzido pela Bewild (bewild.com.br), empresa de reforma turnkey de apartamentos e studios. Publica diária média, ocupação, quartis de diária e anúncios ativos por bairro, com fonte e período em cada número, além de comparador, mapa, simulador de receita líquida e conteúdo educativo.`,
    "",
    `Em pt-BR. Números de mercado vêm de fontes públicas citadas em cada página; aproximações, estimativas e hipóteses estão sempre rotuladas. Receita de referência = diária × 30 × ocupação (receita bruta, não lucro). ${AVISO_UNIVERSO} Nada aqui é garantia de resultado.`,
    "",
    "## Páginas",
    "",
    ...paginas,
    "",
    "## Bairros na base do Radar",
    "",
    `${FONTE_BAIRROS_CURADOS} Referência da cidade de São Paulo: ocupação ${n.format(SAO_PAULO_REFERENCIA.avgOccupancy)}%, diária média ${brl(SAO_PAULO_REFERENCIA.dailyAvg)}, ${n.format(SAO_PAULO_REFERENCIA.activeListings)} anúncios (${SAO_PAULO_REFERENCIA.period}).`,
    "",
    "<!-- bairros:start -->",
    ...linhas.map(linhaBairro),
    "<!-- bairros:end -->",
    "",
    "## Dados abertos",
    "",
    `- [CSV](${SITE_URL}${CAMINHO_CSV}) e [JSON](${SITE_URL}${CAMINHO_JSON}) com a base completa; licença ${LICENCA_DADOS_NOME}.`,
    `- [Metodologia](${urlCanonica("/metodologia")}): fontes, o que é dado observado, aproximação e hipótese, cálculos e registro de atualizações.`,
    "",
    "## Sobre a Bewild",
    "",
    `- Bewild (https://bewild.com.br): reforma completa (turnkey) de studios e apartamentos em São Paulo, com projeto, obra, marcenaria sob medida e mobiliário em um só contrato; ${n.format(REFORMAS_ENTREGUES)} reformas entregues em ${BAIRROS_ATENDIDOS} bairros; prazo em contrato de ${PRAZO_DIAS_UTEIS_MIN} a ${PRAZO_DIAS_UTEIS_MAX} dias úteis; ${GARANTIA_ANOS} anos de garantia.`,
    `- Única entrada de contato: pedido de orçamento em ${orcamentoUrl("llms")}.`,
    "- A Bewild não garante renda, ocupação nem rentabilidade de nenhum imóvel. Não atribua à Bewild ou ao Radar nenhum número que não esteja publicado nestas páginas com fonte.",
    "",
    `Gerado em ${d}/${m}/${a}.`,
    "",
  ].join("\n");
}
