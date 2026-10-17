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
import { formatPercent } from "@/lib/numberFormat";
import type { SizeKey } from "@/data/bairrosCurados";
import { DECORATION_LEVELS } from "@/data/guide-data";

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
  /** Percentual acompanha a receita do mês; fixo é igual todo mês. */
  tipo: "percentual" | "fixo";
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
  const fixo = "fixo" as const, percentual = "percentual" as const;
  const fixas: LinhaResultado[] = [
    { chave: "condominio", rotulo: "Condomínio", valor: arred(imovel.condominio), base: "valor mensal informado", tipo: fixo },
    { chave: "iptu", rotulo: "IPTU", valor: arred(imovel.iptu), base: "carnê anual ÷ 12", tipo: fixo },
    { chave: "contas", rotulo: "Contas (luz, água, internet)", valor: arred(p.contas), base: "valor mensal informado", tipo: fixo },
  ];
  const deducoes: LinhaResultado[] = [
    { chave: "airbnb", rotulo: "Taxa do Airbnb", valor: pct(receitaBruta, p.airbnbPct), base: `${fmtPct(p.airbnbPct)} da receita bruta`, tipo: percentual },
    { chave: "gestao", rotulo: "Gestão (administradora)", valor: pct(receitaBruta, p.gestaoPct), base: `${fmtPct(p.gestaoPct)} da receita bruta`, tipo: percentual },
    { chave: "impostos", rotulo: "Impostos", valor: pct(receitaBruta, p.impostosPct), base: `${fmtPct(p.impostosPct)} da receita bruta`, tipo: percentual },
    { chave: "manutencao", rotulo: "Manutenção e reposição", valor: pct(receitaBruta, p.manutencaoPct), base: `${fmtPct(p.manutencaoPct)} da receita bruta`, tipo: percentual },
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
    ? (p.vacanciaMeses === 1 ? "só no mês sem inquilino" : p.vacanciaMeses > 1 ? `só nos ${p.vacanciaMeses} meses sem inquilino` : "pagos pelo inquilino")
    : "pagos pelo proprietário o ano todo";
  const deducoes: LinhaResultado[] = [
    { chave: "administracao", rotulo: "Administração (imobiliária)", valor: pct(receitaBruta, p.administracaoPct), base: `${fmtPct(p.administracaoPct)} do aluguel recebido`, tipo: "percentual" as const },
    { chave: "ir", rotulo: "Imposto de renda (carnê-leão)", valor: pct(receitaBruta, p.irPct), base: `${fmtPct(p.irPct)} do aluguel recebido`, tipo: "percentual" as const },
    { chave: "manutencao", rotulo: "Reparos entre contratos", valor: pct(receitaBruta, p.manutencaoPct), base: `${fmtPct(p.manutencaoPct)} do aluguel recebido`, tipo: "percentual" as const },
    { chave: "encargos", rotulo: "Condomínio e IPTU", valor: arred(encargosMensais), base: baseEncargos, tipo: "fixo" as const },
  ].filter((d) => d.valor > 0);
  return montar("tradicional", receitaBruta, deducoes);
}

function montar(modo: ModoSimulacao, receitaBruta: number, deducoes: LinhaResultado[]): Resultado {
  const totalDeducoes = deducoes.reduce((s, d) => s + d.valor, 0);
  const liquido = receitaBruta - totalDeducoes;
  return { modo, receitaBruta, deducoes, totalDeducoes, liquido, liquidoAnual: liquido * 12, margem: receitaBruta > 0 ? liquido / receitaBruta : 0 };
}

/**
 * Rentabilidade líquida anual e prazo de retorno sobre o investimento (valor do imóvel
 * + reforma, quando informada). Null sem valor do imóvel; payback null sem resultado positivo.
 */
export function indicadores(r: Resultado, valorImovel: number, reforma = 0): { investimento: number; rentabilidadeAA: number; paybackAnos: number | null } | null {
  if (!(valorImovel > 0)) return null;
  const investimento = valorImovel + Math.max(0, reforma);
  return { investimento, rentabilidadeAA: r.liquidoAnual / investimento * 100, paybackAnos: r.liquidoAnual > 0 ? investimento / r.liquidoAnual : null };
}

const fmtPct = (v: number) => formatPercent(v, Number.isInteger(v) ? 0 : 1);

/* ───────────────────────── Premissas completas (home e /projecao) ───────────────────────── */

export const DECORACOES = ["basico", "premium", "alto"] as const;
export type Decoracao = (typeof DECORACOES)[number];
/** Diária média do bairro × multiplicador do nível de decoração (DECORATION_LEVELS, hipótese). */
export function diariaComDecoracao(dailyAvg: number, decoracao: Decoracao): number {
  const nivel = DECORATION_LEVELS.find((d) => d.value === decoracao) ?? DECORATION_LEVELS[0];
  return Math.round(dailyAvg * nivel.multiplier);
}
export const FAIXAS_AREA: SizeKey[] = ["20–25 m²", "26–35 m²", "36–50 m²"];

/** Tudo o que a pessoa escolhe no simulador: é o que vai para o link, o rascunho e os cenários. */
export interface PremissasSimulador {
  modo: ModoSimulacao;
  /** Nome do bairro (null = padrão da tela). */
  bairro: string | null;
  area: SizeKey;
  decoracao: Decoracao;
  /** Diária ajustada pela pessoa; null = diária média do bairro × decoração. */
  diaria: number | null;
  /** Ocupação ajustada; null = média do bairro. */
  ocupacao: number | null;
  imovel: Imovel;
  /** Investimento em reforma, em reais (0 = não informado): entra no prazo de retorno. */
  reforma: number;
  shortStay: PremissasShortStay;
  /** Aluguel digitado; null = referência FipeZAP sobre o valor do imóvel. */
  aluguel: number | null;
  tradicional: Omit<PremissasTradicional, "aluguel">;
}

export const PREMISSAS_SIMULADOR_PADRAO: PremissasSimulador = {
  modo: "short_stay",
  bairro: null,
  area: "26–35 m²",
  decoracao: "basico",
  diaria: null,
  ocupacao: null,
  imovel: IMOVEL_PADRAO,
  reforma: 0,
  shortStay: SHORT_STAY_PADRAO,
  aluguel: null,
  tradicional: TRADICIONAL_PADRAO,
};

export const LIMITES_MERCADO = {
  diaria: { min: 80, max: 1500, passo: 10 },
  ocupacao: { min: 30, max: 95, passo: 1 },
  reforma: { min: 0, max: 5_000_000, passo: 5_000 },
} as const;

const num = (v: unknown, { min, max }: { min: number; max: number }) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : undefined;
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

/** Valida um objeto vindo do navegador ou de um link: fora do formato ou dos limites, volta ao padrão. */
export function normalizarPremissasSimulador(bruto: unknown): PremissasSimulador {
  const o = obj(bruto), im = obj(o.imovel), ss = obj(o.shortStay), tr = obj(o.tradicional);
  const d = PREMISSAS_SIMULADOR_PADRAO;
  return {
    modo: o.modo === "tradicional" ? "tradicional" : "short_stay",
    bairro: typeof o.bairro === "string" && o.bairro.trim() ? o.bairro : null,
    area: FAIXAS_AREA.includes(o.area as SizeKey) ? (o.area as SizeKey) : d.area,
    decoracao: DECORACOES.includes(o.decoracao as Decoracao) ? (o.decoracao as Decoracao) : d.decoracao,
    diaria: num(o.diaria, LIMITES_MERCADO.diaria) ?? null,
    ocupacao: num(o.ocupacao, LIMITES_MERCADO.ocupacao) ?? null,
    imovel: {
      valorImovel: num(im.valorImovel, LIMITES.valorImovel) ?? d.imovel.valorImovel,
      condominio: num(im.condominio, LIMITES.condominio) ?? d.imovel.condominio,
      iptu: num(im.iptu, LIMITES.iptu) ?? d.imovel.iptu,
    },
    reforma: num(o.reforma, LIMITES_MERCADO.reforma) ?? 0,
    shortStay: {
      airbnbPct: num(ss.airbnbPct, LIMITES.impostosPct) ?? d.shortStay.airbnbPct,
      gestaoPct: num(ss.gestaoPct, LIMITES.pct) ?? d.shortStay.gestaoPct,
      impostosPct: num(ss.impostosPct, LIMITES.impostosPct) ?? d.shortStay.impostosPct,
      manutencaoPct: num(ss.manutencaoPct, LIMITES.pct) ?? d.shortStay.manutencaoPct,
      contas: num(ss.contas, LIMITES.contas) ?? d.shortStay.contas,
    },
    aluguel: num(o.aluguel, LIMITES.aluguel) ?? null,
    tradicional: {
      administracaoPct: num(tr.administracaoPct, LIMITES.administracaoPct) ?? d.tradicional.administracaoPct,
      vacanciaMeses: num(tr.vacanciaMeses, LIMITES.vacanciaMeses) ?? d.tradicional.vacanciaMeses,
      encargosPeloInquilino: typeof tr.encargosPeloInquilino === "boolean" ? tr.encargosPeloInquilino : d.tradicional.encargosPeloInquilino,
      manutencaoPct: num(tr.manutencaoPct, LIMITES.pct) ?? d.tradicional.manutencaoPct,
      irPct: num(tr.irPct, LIMITES.irPct) ?? d.tradicional.irPct,
    },
  };
}

/* Link compartilhável: só números e escolhas, nenhum dado pessoal. Chaves curtas na query. */
const CHAVES_QUERY: [URLQuery, string][] = [
  ["modo", "modo"], ["area", "area"], ["dec", "decoracao"], ["diaria", "diaria"], ["occ", "ocupacao"],
  ["valor", "imovel.valorImovel"], ["cond", "imovel.condominio"], ["iptu", "imovel.iptu"], ["reforma", "reforma"],
  ["airbnb", "shortStay.airbnbPct"], ["gestao", "shortStay.gestaoPct"], ["imp", "shortStay.impostosPct"], ["manut", "shortStay.manutencaoPct"], ["contas", "shortStay.contas"],
  ["aluguel", "aluguel"], ["adm", "tradicional.administracaoPct"], ["vac", "tradicional.vacanciaMeses"], ["enc", "tradicional.encargosPeloInquilino"],
  ["rep", "tradicional.manutencaoPct"], ["ir", "tradicional.irPct"],
];
type URLQuery = "modo" | "area" | "dec" | "diaria" | "occ" | "valor" | "cond" | "iptu" | "reforma" | "airbnb" | "gestao" | "imp" | "manut" | "contas" | "aluguel" | "adm" | "vac" | "enc" | "rep" | "ir";
const ler = (o: unknown, caminho: string) => caminho.split(".").reduce<unknown>((acc, k) => obj(acc)[k], o);
const escrever = (o: Record<string, unknown>, caminho: string, v: unknown) => {
  const partes = caminho.split("."); let alvo = o;
  for (const k of partes.slice(0, -1)) alvo = (alvo[k] = obj(alvo[k])) as Record<string, unknown>;
  alvo[partes[partes.length - 1]] = v;
};

/** Query string (sem "?") com o que difere do padrão, mais o bairro como slug. */
export function premissasParaQuery(p: PremissasSimulador, slugBairro: string | null): string {
  const q = new URLSearchParams();
  if (slugBairro) q.set("bairro", slugBairro);
  for (const [chave, caminho] of CHAVES_QUERY) {
    const v = ler(p, caminho), padrao = ler(PREMISSAS_SIMULADOR_PADRAO, caminho);
    if (v === null || v === undefined || v === padrao) continue;
    q.set(chave, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
  }
  return q.toString();
}

/** Lê um link do simulador (novo formato e o anterior: m, occ, diaria, boost, reforma). Devolve só o que veio. */
export function lerPremissasDaQuery(search: string): { slugBairro: string | null; premissas: Partial<PremissasSimulador>; veioAlgo: boolean } {
  const q = new URLSearchParams(search);
  const bruto: Record<string, unknown> = {};
  let veio = false;
  for (const [chave, caminho] of CHAVES_QUERY) {
    const v = q.get(chave);
    if (v === null) continue;
    veio = true;
    if (chave === "modo" || chave === "area" || chave === "dec") escrever(bruto, caminho, v);
    else if (chave === "enc") escrever(bruto, caminho, v === "1");
    else if (/^-?\d+(\.\d+)?$/.test(v)) escrever(bruto, caminho, Number(v));
  }
  // Formato anterior do simulador da home: m (metragem), boost (0/10/20/30).
  const m = q.get("m");
  if (m && /^\d+$/.test(m)) { veio = true; const n = Number(m); escrever(bruto, "area", n <= 25 ? "20–25 m²" : n <= 35 ? "26–35 m²" : "36–50 m²"); }
  const boost = q.get("boost");
  if (boost && /^\d+$/.test(boost) && bruto.decoracao === undefined) { veio = true; escrever(bruto, "decoracao", Number(boost) >= 30 ? "alto" : Number(boost) >= 20 ? "premium" : "basico"); }
  const normal = normalizarPremissasSimulador(bruto);
  const premissas: Partial<PremissasSimulador> = {};
  for (const k of Object.keys(bruto) as (keyof PremissasSimulador)[]) (premissas as Record<string, unknown>)[k] = normal[k];
  const slug = q.get("bairro");
  return { slugBairro: slug && slug.trim() ? slug.trim().toLowerCase() : null, premissas, veioAlgo: veio };
}

/* Rascunho no navegador (só números e escolhas). */
export const CHAVE_RASCUNHO = "bwild:simulador:v1";
/** Rascunho da versão anterior de /projecao (bairro, área, valor do imóvel, condomínio, diária e ocupação ajustadas). */
export const CHAVE_RASCUNHO_PROJECAO = "bwild:projecao:v2";
/** Custos da versão mais antiga do painel de projeção (valor do imóvel, gestão, impostos, condomínio). */
export const CHAVE_CUSTOS_ANTIGA = "bwild:project-costs:projection";
type Armazenamento = Pick<Storage, "getItem" | "setItem">;

export function lerRascunho(armazenamento: Armazenamento | null | undefined): PremissasSimulador {
  if (!armazenamento) return PREMISSAS_SIMULADOR_PADRAO;
  try {
    const atual = armazenamento.getItem(CHAVE_RASCUNHO);
    if (atual) return normalizarPremissasSimulador(JSON.parse(atual));
    const anterior = armazenamento.getItem(CHAVE_RASCUNHO_PROJECAO);
    if (anterior) {
      const a = obj(JSON.parse(anterior));
      return normalizarPremissasSimulador({
        bairro: a.bairro, area: a.area, diaria: a.diaria, ocupacao: a.ocupacao,
        imovel: { valorImovel: a.valorImovel, condominio: a.condominio },
        shortStay: { gestaoPct: a.gestao, impostosPct: a.impostos },
      });
    }
    const custos = armazenamento.getItem(CHAVE_CUSTOS_ANTIGA);
    if (custos) {
      const c = obj(JSON.parse(custos));
      return normalizarPremissasSimulador({ imovel: { valorImovel: c.propertyValue, condominio: c.condoMonthly }, shortStay: { gestaoPct: c.managementPct, impostosPct: c.taxesPct } });
    }
  } catch { /* rascunho ilegível: segue com os padrões */ }
  return PREMISSAS_SIMULADOR_PADRAO;
}

export function salvarRascunho(p: PremissasSimulador, armazenamento: Armazenamento | null | undefined) {
  try { armazenamento?.setItem(CHAVE_RASCUNHO, JSON.stringify(p)); } catch { /* navegador sem armazenamento */ }
}

export function armazenamentoLocal(): Armazenamento | null {
  try { return typeof window !== "undefined" ? window.localStorage : null; } catch { return null; }
}

/* Mês a mês: a mesma receita anual distribuída pela sazonalidade (modelo ilustrativo, não dado observado). */
export interface MesSimulado { chave: string; rotulo: string; ano: number; bruta: number; custos: number; liquido: number }
const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/**
 * Reparte receita bruta × 12 pelos pesos mensais (índice 0 = janeiro). As deduções
 * percentuais acompanham a receita do mês; as fixas são iguais todo mês. A soma dos
 * 12 meses bate com o resultado anual do simulador.
 */
export function mesAMes(r: Resultado, pesos: number[], inicio: Date): MesSimulado[] {
  const soma = pesos.reduce((s, w) => s + w, 0) || 1;
  const percentuais = r.deducoes.filter((d) => d.tipo === "percentual").reduce((s, d) => s + d.valor, 0);
  const fixos = r.deducoes.filter((d) => d.tipo === "fixo").reduce((s, d) => s + d.valor, 0);
  const fracaoVariavel = r.receitaBruta > 0 ? percentuais / r.receitaBruta : 0;
  const anual = r.receitaBruta * 12;
  return Array.from({ length: 12 }, (_, i) => {
    const data = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + i, 1));
    const mes = data.getUTCMonth(), ano = data.getUTCFullYear();
    const bruta = Math.round(anual * (pesos[mes] ?? 1) / soma);
    const custos = Math.round(bruta * fracaoVariavel) + fixos;
    return { chave: `${ano}-${String(mes + 1).padStart(2, "0")}`, rotulo: MESES_CURTOS[mes], ano, bruta, custos, liquido: bruta - custos };
  });
}

/* Cenários salvos no navegador (só premissas e resultado; nenhum dado pessoal). */
export const CHAVE_CENARIOS = "bwild:simulador:cenarios";
/** Chave dos cenários do simulador anterior da home (migrados na primeira leitura). */
export const CHAVE_CENARIOS_ANTIGA = "bwild_guide_scenarios";
export const MAX_CENARIOS = 5;

export interface CenarioSalvo {
  id: string;
  nome: string;
  premissas: PremissasSimulador;
  /** Resultado no momento em que foi salvo (a tela recalcula ao carregar). */
  receitaBruta: number;
  liquido: number;
  criadoEm: number;
}

/** Cenário do simulador anterior (bairro, metragem, ocupação, diária, boost, reforma) no formato novo. */
function migrarCenarioAntigo(c: Record<string, unknown>): CenarioSalvo | null {
  if (typeof c.bairro !== "string") return null;
  const metragem = Number(c.metragem);
  const boost = Number(c.rateBoost) || 0;
  const diaria = Number(c.diariaAtual);
  const premissas = normalizarPremissasSimulador({
    bairro: c.bairro,
    area: Number.isFinite(metragem) ? (metragem <= 25 ? "20–25 m²" : metragem <= 35 ? "26–35 m²" : "36–50 m²") : undefined,
    ocupacao: c.ocupacao,
    diaria: Number.isFinite(diaria) && diaria > 0 ? diaria : undefined,
    decoracao: boost >= 30 ? "alto" : boost >= 20 ? "premium" : "basico",
    reforma: Number(c.reformaBudget) || 0,
  });
  return { id: String(c.id ?? crypto.randomUUID()), nome: String(c.name ?? c.bairro), premissas, receitaBruta: Number(c.receitaMensal) || 0, liquido: 0, criadoEm: 0 };
}

export function lerCenarios(armazenamento: Armazenamento | null | undefined): CenarioSalvo[] {
  if (!armazenamento) return [];
  try {
    const atual = armazenamento.getItem(CHAVE_CENARIOS);
    if (atual) {
      const lista = JSON.parse(atual);
      if (!Array.isArray(lista)) return [];
      return lista.filter((c) => c && typeof c === "object" && typeof c.id === "string").map((c): CenarioSalvo => ({
        id: c.id,
        nome: typeof c.nome === "string" ? c.nome : "Cenário",
        premissas: normalizarPremissasSimulador(c.premissas),
        receitaBruta: Number.isFinite(c.receitaBruta) ? Number(c.receitaBruta) : 0,
        liquido: Number.isFinite(c.liquido) ? Number(c.liquido) : 0,
        criadoEm: Number.isFinite(c.criadoEm) ? Number(c.criadoEm) : 0,
      }));
    }
    const antigo = armazenamento.getItem(CHAVE_CENARIOS_ANTIGA);
    if (antigo) {
      const lista = JSON.parse(antigo);
      const migrados = Array.isArray(lista) ? lista.map((c) => migrarCenarioAntigo(obj(c))).filter((c): c is CenarioSalvo => c !== null) : [];
      if (migrados.length) armazenamento.setItem(CHAVE_CENARIOS, JSON.stringify(migrados));
      return migrados;
    }
  } catch { /* armazenamento ilegível */ }
  return [];
}

export function salvarCenarios(lista: CenarioSalvo[], armazenamento: Armazenamento | null | undefined) {
  try { armazenamento?.setItem(CHAVE_CENARIOS, JSON.stringify(lista)); } catch { /* armazenamento indisponível: segue só na tela */ }
}

/** Resultado de um cenário com a base atual (cenários migrados chegam sem líquido). */
export function recalcularCenario(c: CenarioSalvo, bairros: { name: string; dailyAvg: number; avgOccupancy: number }[]): CenarioSalvo {
  const p = c.premissas;
  const bairro = bairros.find((b) => b.name === p.bairro);
  if (!bairro) return c;
  const diaria = p.diaria ?? diariaComDecoracao(bairro.dailyAvg, p.decoracao);
  const ocupacao = p.ocupacao ?? bairro.avgOccupancy;
  const r = p.modo === "tradicional"
    ? resultadoTradicional(p.imovel, { ...p.tradicional, aluguel: p.aluguel ?? aluguelReferencia(p.imovel.valorImovel) })
    : resultadoShortStay({ diaria, ocupacaoPct: ocupacao }, p.imovel, p.shortStay);
  return { ...c, receitaBruta: r.receitaBruta, liquido: r.liquido };
}
