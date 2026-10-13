// src/data/provasBewild.ts
//
// Fonte única dos números de custo de reforma, prazo de obra e prova social.
// Nenhum componente, FAQ ou JSON-LD deve escrever esses números à mão:
// importe daqui. Ao atualizar, cite a origem no comentário.

// ── Custo de reforma ─────────────────────────────────────────────
// Origem: estudo "Quanto custa reformar um apartamento ou studio de até 50 m²",
// base de 188 contratos de reforma completa (turnkey) da Bewild em São Paulo, out/2026.
export const ESTUDO_REFORMA_URL =
  "https://bewild.com.br/conteudos/quanto-custa-reformar-apartamento-studio-ate-50-m2";
export const ESTUDO_REFORMA_DATA = "out/2026";

/** Contratos de reforma completa analisados (estudo out/2026). */
export const CONTRATOS_ANALISADOS = 188;
/** Orçamento mediano, R$ (estudo out/2026). */
export const ORCAMENTO_MEDIANO = 71850;
/** Área mediana dos contratos, m² (estudo out/2026). */
export const AREA_MEDIANA_M2 = 27.5;
/** Custo por m², R$ — mediana, percentil 25 e 75 (estudo out/2026). */
export const CUSTO_M2_MEDIANO = 2744;
export const CUSTO_M2_P25 = 2457;
export const CUSTO_M2_P75 = 3125;
/** Nenhum contrato da base ficou abaixo deste valor, R$ (estudo out/2026). */
export const ORCAMENTO_MINIMO_BASE = 55000;

/** O que entra no orçamento da reforma completa (estudo out/2026). */
export const ESCOPO_REFORMA_COMPLETA = [
  "projeto e ART/RRT",
  "obra",
  "marcenaria sob medida",
  "mobiliário",
  "eletrodomésticos",
  "entrega (limpeza, vistoria, fotos)",
  "enxoval (em short stay)",
] as const;

// ── Anatomia de uma proposta real ────────────────────────────────
// Origem: mesmo estudo — proposta real de R$ 87.692,80, set/2026.
export const PROPOSTA_REAL_VALOR = 87692.8;
export const PROPOSTA_REAL_DATA = "set/2026";
/** Participação de cada linha na proposta real, em %. */
export const PROPOSTA_REAL_PCT = {
  marcenaria: 28,
  obraCivilAcabamentos: 27,
  gestaoImpostosLogisticaSeguro: 14,
  eletros: 7.4,
  vidracaria: 7,
  mobiliario: 6.5,
  iluminacao: 3.6,
  projetoArt: 3.4,
  enxoval: 3.1,
} as const;
/** Mobiliário + eletros + iluminação + enxoval (derivado de PROPOSTA_REAL_PCT). */
export const PROPOSTA_REAL_PCT_MOBILIA_ELETROS_ILUM_ENXOVAL =
  PROPOSTA_REAL_PCT.mobiliario +
  PROPOSTA_REAL_PCT.eletros +
  PROPOSTA_REAL_PCT.iluminacao +
  PROPOSTA_REAL_PCT.enxoval;

// ── Prazo em contrato ────────────────────────────────────────────
// Origem: mesmo estudo (prazos contratuais da Bewild).
export const PRAZO_DIAS_UTEIS = {
  ate30SemSacada: 60,
  ate30ComSacada: 65,
  de31a40SemSacada: 70,
  de31a40ComSacada: 75,
} as const;
export const PRAZO_DIAS_UTEIS_MIN = PRAZO_DIAS_UTEIS.ate30SemSacada;
export const PRAZO_DIAS_UTEIS_MAX = PRAZO_DIAS_UTEIS.de31a40ComSacada;
/** Marcenaria: dias úteis de fábrica + montagem, em paralelo com a obra. */
export const MARCENARIA_DIAS_FABRICA = 25;
export const MARCENARIA_DIAS_MONTAGEM = 5;

// ── Contexto do investimento ─────────────────────────────────────
// Origem: mesmo estudo — studio de 27 m² ao preço médio FipeZap de venda
// (R$ 12.143/m², ago/2026), ITBI 3% e reforma mediana.
export const FIPEZAP_M2 = 12143;
export const FIPEZAP_DATA = "ago/2026";
export const STUDIO_EXEMPLO_M2 = 27;
export const STUDIO_EXEMPLO_IMOVEL = 328000; // ≈ R$ 328 mil
export const STUDIO_EXEMPLO_ITBI = 9800; // ≈ R$ 9,8 mil (3%)
export const STUDIO_EXEMPLO_TOTAL = 410000; // ≈ R$ 410 mil com a reforma mediana
export const STUDIO_EXEMPLO_PCT_REFORMA = 18; // a reforma é ~18% do total

// ── Prova social ─────────────────────────────────────────────────
// Origem: números oficiais publicados em bewild.com.br.
export const REFORMAS_ENTREGUES = 160;
export const PROJETOS = 200;
/** Bairros com obra entregue. Escrever "em 27 bairros", nunca "+27". */
export const BAIRROS_ATENDIDOS = 27;

// ── Garantia e atraso ────────────────────────────────────────────
// Origem: fonte de verdade da Bewild, ago/2026.
/** Anos de garantia dos serviços da Bewild. */
export const GARANTIA_ANOS = 5;
/** Texto de garantia reusado nas seções — nunca escrever "1 ano". */
export const TEXTO_GARANTIA = `${GARANTIA_ANOS} anos de garantia`;
/** O contrato da Bewild prevê multa por dia de atraso. */
export const TEXTO_MULTA_ATRASO = "multa por dia de atraso prevista em contrato";



// ── Formatação ───────────────────────────────────────────────────
export const brl = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
export const milReais = (v: number) =>
  "R$ " + (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil";
export const num = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

// ── Textos derivados (reusados em FAQ, JSON-LD e seções) ─────────
export const RESPOSTA_CUSTO_REFORMA =
  `Na análise de ${CONTRATOS_ANALISADOS} contratos de reforma completa da Bewild em São Paulo, ` +
  `o orçamento mediano foi de ${brl(ORCAMENTO_MEDIANO)} para ${num(AREA_MEDIANA_M2)} m², ` +
  `já com projeto, obra, marcenaria sob medida, mobiliário e eletrodomésticos. ` +
  `Metade dos contratos ficou entre ${brl(CUSTO_M2_P25)} e ${brl(CUSTO_M2_P75)} por m², ` +
  `e nenhum ficou abaixo de ${milReais(ORCAMENTO_MINIMO_BASE)}.`;

export const RESPOSTA_INVESTIMENTO_TOTAL =
  `Um studio de ${STUDIO_EXEMPLO_M2} m² ao preço médio de venda FipeZap ` +
  `(${brl(FIPEZAP_M2)}/m², ${FIPEZAP_DATA}) custa cerca de ${milReais(STUDIO_EXEMPLO_IMOVEL)}. ` +
  `Somando ITBI de 3% (≈ ${milReais(STUDIO_EXEMPLO_ITBI)}) e a reforma completa mediana da Bewild ` +
  `(${brl(ORCAMENTO_MEDIANO)}), o total fica em torno de ${milReais(STUDIO_EXEMPLO_TOTAL)} — ` +
  `a reforma é cerca de ${STUDIO_EXEMPLO_PCT_REFORMA}% do investimento.`;

export const TEXTO_PRAZO_OBRA =
  `${PRAZO_DIAS_UTEIS_MIN} a ${PRAZO_DIAS_UTEIS_MAX} dias úteis em contrato, conforme metragem e integração de sacada`;
export const TEXTO_PRAZO_MARCENARIA =
  `${MARCENARIA_DIAS_FABRICA} dias úteis de fábrica + ${MARCENARIA_DIAS_MONTAGEM} de montagem, em paralelo com a obra`;

export const SELO_REFORMAS = `+${REFORMAS_ENTREGUES} reformas entregues`;
export const SELO_PROJETOS = `+${PROJETOS} projetos`;
export const SELO_BAIRROS = `${BAIRROS_ATENDIDOS} bairros com obra entregue`;
