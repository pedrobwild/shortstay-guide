/**
 * Simulador de receita líquida do guia (seção Mercado): da receita bruta ao que
 * sobra para o investidor, em dois modos — short stay (Airbnb) e locação
 * tradicional. Funções puras, sem React.
 *
 * Números de mercado (diária, ocupação) vêm da base do Radar. Todas as premissas
 * de custo aqui são HIPÓTESES editáveis, rotuladas assim na tela:
 *  - short stay: DRE padrão do guia (Airbnb 3%, gestão 20%, impostos 6%,
 *    manutenção 5%; ver DEDUCOES_PADRAO_PCT em bairroAjustes.ts). As despesas
 *    fixas (condomínio, IPTU, contas) entram em reais, informadas pela pessoa.
 *  - tradicional: a base não tem aluguel por bairro; o aluguel de partida usa a
 *    rentabilidade média de locação de São Paulo (FipeZAP) sobre o valor do
 *    imóvel e a pessoa ajusta.
 */
import { DEFAULT_PROJECTION_COSTS } from "@/lib/projectAnalytics";

export type ModoSimulacao = "short_stay" | "tradicional";

/** Dados do imóvel, comuns aos dois modos (R$ por mês, exceto o valor do imóvel). */
export interface Imovel {
  /** Valor do imóvel em reais (0 = não informado: sem rentabilidade nem prazo de retorno). */
  valorImovel: number;
  condominio: number;
  /** IPTU mensal (carnê anual ÷ 12). */
  iptu: number;
}

/** Premissas de operação do short stay (percentuais sobre a receita bruta; contas em R$/mês). */
export interface PremissasShortStay {
  airbnbPct: number;
  gestaoPct: number;
  impostosPct: number;
  manutencaoPct: number;
  /** Luz, água, gás e internet, pagos pelo anfitrião. */
  contas: number;
}

/** Premissas da locação tradicional. */
export interface PremissasTradicional {
  /** Aluguel mensal contratado, em reais. */
  aluguel: number;
  /** Taxa da imobiliária sobre o aluguel recebido (0 = direto com o inquilino). */
  administracaoPct: number;
  /** Meses por ano sem inquilino. */
  vacanciaMeses: number;
  /** Condomínio e IPTU pagos pelo inquilino enquanto o imóvel está alugado (prática usual do contrato). */
  encargosPeloInquilino: boolean;
  /** Reserva para reparos e pintura entre contratos (% do aluguel). */
  manutencaoPct: number;
  /** Imposto de renda sobre o aluguel (carnê-leão), % do aluguel recebido. */
  irPct: number;
}

/**
 * DRE padrão do guia, mesma origem de DEDUCOES_PADRAO_PCT: Airbnb 3%, gestão 20%,
 * impostos 6%, manutenção 5%. Contas: valor do exemplo do guia (rentabilidadeExample).
 */
export const SHORT_STAY_PADRAO: PremissasShortStay = { airbnbPct: 3, gestaoPct: 20, impostosPct: 6, manutencaoPct: 5, contas: 500 };

/** Condomínio do exemplo da projeção (DEFAULT_PROJECTION_COSTS); IPTU e valor do imóvel a pessoa informa. */
export const IMOVEL_PADRAO: Imovel = { valorImovel: 0, condominio: DEFAULT_PROJECTION_COSTS.condoMonthly, iptu: 0 };

/**
 * Rentabilidade média anual da locação residencial em São Paulo (FipeZAP Locação,
 * dez/2025 — FONTES_GUIA.fipezap; mesmo número da FAQ do guia). Só define o
 * aluguel de partida; a pessoa ajusta para o imóvel dela.
 */
export const RENTABILIDADE_LOCACAO_SP_AA = 6.3;

/** Hipóteses de partida da locação tradicional (editáveis). */
export const TRADICIONAL_PADRAO: Omit<PremissasTradicional, "aluguel"> = {
  administracaoPct: 0,
  vacanciaMeses: 1,
  encargosPeloInquilino: true,
  manutencaoPct: 0,
  irPct: 0,
};

/** Limites e passos dos campos (−/+). */
export const LIMITES = {
  valorImovel: { min: 0, max: 100_000_000, passo: 10_000 },
  condominio: { min: 0, max: 5_000, passo: 50 },
  iptu: { min: 0, max: 5_000, passo: 10 },
  contas: { min: 0, max: 3_000, passo: 50 },
  pct: { min: 0, max: 50, passo: 1 },
  impostosPct: { min: 0, max: 30, passo: 0.5 },
  aluguel: { min: 0, max: 50_000, passo: 100 },
  administracaoPct: { min: 0, max: 20, passo: 0.5 },
  vacanciaMeses: { min: 0, max: 6, passo: 1 },
  irPct: { min: 0, max: 27.5, passo: 0.5 },
} as const;

/** Aluguel mensal de partida: valor do imóvel × rentabilidade média de locação ÷ 12 (arredondado a R$ 50). */
export function aluguelReferencia(valorImovel: number): number {
  if (!(valorImovel > 0)) return 0;
  return Math.round((valorImovel * RENTABILIDADE_LOCACAO_SP_AA / 100 / 12) / 50) * 50;
}

export interface LinhaResultado {
  chave: string;
  rotulo: string;
  /** Valor mensal em reais (positivo; a tela mostra como dedução). */
  valor: number;
  /** Como o valor foi obtido, para a legenda ("3% da receita bruta", "R$ 500/mês"). */
  base: string;
}

export interface Resultado {
  modo: ModoSimulacao;
  /** Receita bruta média por mês. */
  receitaBruta: number;
  deducoes: LinhaResultado[];
  totalDeducoes: number;
  /** Resultado líquido médio por mês (pode ser negativo). */
  liquido: number;
  liquidoAnual: number;
  /** Fração da receita bruta que sobra (0 quando não há receita). */
  margem: number;
}

const arred = (v: number) => Math.round(v);
const pct = (base: number, p: number) => arred(base * p / 100);

/**
 * Short stay: receita bruta = diária (já com o multiplicador de decoração) × 30 × ocupação.
 * Deduções percentuais sobre a bruta + despesas fixas em reais.
 */
export function resultadoShortStay(
  mercado: { diaria: number; ocupacaoPct: number },
  imovel: Imovel,
  p: PremissasShortStay,
): Resultado {
  const receitaBruta = arred(mercado.diaria * 30 * mercado.ocupacaoPct / 100);
  const fixas = [
    { chave: "condominio", rotulo: "Condomínio", valor: arred(imovel.condominio), base: "valor mensal informado" },
    { chave: "iptu", rotulo: "IPTU", valor: arred(imovel.iptu), base: "carnê anual ÷ 12" },
    { chave: "contas", rotulo: "Contas (luz, água, internet)", valor: arred(p.contas), base: "valor mensal informado" },
  ];
  const deducoes: LinhaResultado[] = [
    { chave: "airbnb", rotulo: "Taxa do Airbnb", valor: pct(receitaBruta, p.airbnbPct), base: `${fmtPct(p.airbnbPct)} da receita bruta` },
    { chave: "gestao", rotulo: "Gestão (administradora)", valor: pct(receitaBruta, p.gestaoPct), base: `${fmtPct(p.gestaoPct)} da receita bruta` },
    { chave: "impostos", rotulo: "Impostos", valor: pct(receitaBruta, p.impostosPct), base: `${fmtPct(p.impostosPct)} da receita bruta` },
    { chave: "manutencao", rotulo: "Manutenção e reposição", valor: pct(receitaBruta, p.manutencaoPct), base: `${fmtPct(p.manutencaoPct)} da receita bruta` },
    ...fixas,
  ].filter((d) => d.valor > 0);
  return montar("short_stay", receitaBruta, deducoes);
}

/**
 * Locação tradicional: receita bruta média = aluguel × meses alugados ÷ 12. Nos meses
 * vagos, condomínio e IPTU ficam com o proprietário mesmo quando o contrato os repassa
 * ao inquilino; se o proprietário paga sempre, entram inteiros.
 */
export function resultadoTradicional(imovel: Imovel, p: PremissasTradicional): Resultado {
  const mesesAlugado = Math.max(0, 12 - p.vacanciaMeses);
  const receitaBruta = arred(p.aluguel * mesesAlugado / 12);
  const encargos = imovel.condominio + imovel.iptu;
  const encargosMensais = p.encargosPeloInquilino ? encargos * p.vacanciaMeses / 12 : encargos;
  const baseEncargos = p.encargosPeloInquilino
    ? (p.vacanciaMeses > 0 ? `só nos ${fmtMeses(p.vacanciaMeses)} sem inquilino` : "pagos pelo inquilino")
    : "pagos pelo proprietário o ano todo";
  const deducoes: LinhaResultado[] = [
    { chave: "administracao", rotulo: "Administração (imobiliária)", valor: pct(receitaBruta, p.administracaoPct), base: `${fmtPct(p.administracaoPct)} do aluguel recebido` },
    { chave: "ir", rotulo: "Imposto de renda (carnê-leão)", valor: pct(receitaBruta, p.irPct), base: `${fmtPct(p.irPct)} do aluguel recebido` },
    { chave: "manutencao", rotulo: "Reparos entre contratos", valor: pct(receitaBruta, p.manutencaoPct), base: `${fmtPct(p.manutencaoPct)} do aluguel recebido` },
    { chave: "encargos", rotulo: "Condomínio e IPTU", valor: arred(encargosMensais), base: baseEncargos },
  ].filter((d) => d.valor > 0);
  return montar("tradicional", receitaBruta, deducoes);
}

function montar(modo: ModoSimulacao, receitaBruta: number, deducoes: LinhaResultado[]): Resultado {
  const totalDeducoes = deducoes.reduce((s, d) => s + d.valor, 0);
  const liquido = receitaBruta - totalDeducoes;
  return { modo, receitaBruta, deducoes, totalDeducoes, liquido, liquidoAnual: liquido * 12, margem: receitaBruta > 0 ? liquido / receitaBruta : 0 };
}

/** Rentabilidade líquida anual e prazo de retorno sobre o valor do imóvel (null sem valor ou sem resultado positivo). */
export function indicadores(r: Resultado, valorImovel: number): { rentabilidadeAA: number; paybackAnos: number | null } | null {
  if (!(valorImovel > 0)) return null;
  return { rentabilidadeAA: r.liquidoAnual / valorImovel * 100, paybackAnos: r.liquidoAnual > 0 ? valorImovel / r.liquidoAnual : null };
}

const fmtPct = (v: number) => `${String(v).replace(".", ",")}%`;
const fmtMeses = (n: number) => (n === 1 ? "1 mês" : `${n} meses`);
