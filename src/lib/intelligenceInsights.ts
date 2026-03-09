import type { BairroAirbnb } from "@/types/intelligence";
import { fmtBRL, fmtPct, fmtScore } from "@/hooks/useIntelligenceData";

// ── Column tooltips ──────────────────────────────────────────────
export const COLUMN_TOOLTIPS: Record<string, { friendly: string; tip: string }> = {
  adr: { friendly: "Preço médio da diária", tip: "Quanto, em média, um imóvel cobra por noite neste bairro." },
  ocupacao: { friendly: "% de dias alugados", tip: "Percentual de dias em que o imóvel fica ocupado no mês." },
  yield_airbnb: { friendly: "Retorno anual no Airbnb", tip: "Quanto o imóvel pode render por ano em relação ao valor investido." },
  delta_yield: { friendly: "Ganho extra vs aluguel comum", tip: "Diferença entre o retorno do Airbnb e o aluguel tradicional." },
  rentabilidade: { friendly: "Score geral de retorno", tip: "Nota que combina diária, ocupação, retorno e saturação." },
  liquidez: { friendly: "Facilidade de operar", tip: "Quanto o bairro tem de demanda, reservas e velocidade comercial." },
  crescimento: { friendly: "Potencial futuro", tip: "Sinais de valorização e expansão futura da demanda." },
  confianca: { friendly: "Qualidade dos dados", tip: "Alto = leitura consistente · Médio = útil, com incerteza · Baixo = exploratória." },
};

// ── Indicator explainer cards (for the didactic section) ────────
export interface IndicatorExplainer {
  key: string;
  title: string;
  friendlyTitle: string;
  explanation: string;
  example: string;
  keyMessage: string;
  icon: string; // lucide icon name mapped in component
}

export const INDICATOR_EXPLAINERS: IndicatorExplainer[] = [
  {
    key: "adr",
    title: "ADR",
    friendlyTitle: "Preço médio da diária",
    explanation: "Mostra quanto, em média, um imóvel consegue cobrar por noite no bairro. Quanto maior o ADR, mais cara tende a ser a diária.",
    example: "Pinheiros pode cobrar mais por noite do que Bela Vista, mas isso não significa automaticamente melhor investimento.",
    keyMessage: "Diária mais alta ajuda, mas não decide sozinha.",
    icon: "DollarSign",
  },
  {
    key: "ocupacao",
    title: "Ocupação",
    friendlyTitle: "Percentual de dias alugados",
    explanation: "Mostra quantos dias, em média, o imóvel fica ocupado. Se a ocupação é 70%, significa que o imóvel fica alugado na maior parte do mês.",
    example: "Um bairro com 75% de ocupação mantém o imóvel alugado cerca de 22 dias por mês.",
    keyMessage: "Quanto maior a ocupação, menos tempo o imóvel fica vazio.",
    icon: "CalendarCheck",
  },
  {
    key: "yield_airbnb",
    title: "Yield Airbnb",
    friendlyTitle: "Retorno anual do imóvel no Airbnb",
    explanation: "Mostra quanto o imóvel pode render por ano em relação ao valor do investimento. Quanto maior esse número, melhor tende a ser o retorno financeiro.",
    example: "Um yield de 12% significa que o imóvel gera, em receita bruta, 12% do seu valor por ano.",
    keyMessage: "É um dos indicadores mais importantes para saber se o investimento vale a pena.",
    icon: "TrendingUp",
  },
  {
    key: "delta_yield",
    title: "Delta Yield",
    friendlyTitle: "Quanto o Airbnb rende a mais que o aluguel comum",
    explanation: "Compara o retorno do short stay com o aluguel tradicional. Se o delta yield for positivo e alto, significa que o Airbnb está gerando um prêmio relevante.",
    example: "Um delta de 5 pontos percentuais indica que o short stay supera o aluguel tradicional em 5% ao ano.",
    keyMessage: "Ajuda a responder se faz sentido operar no modelo short stay ou seguir no aluguel tradicional.",
    icon: "ArrowUpRight",
  },
  {
    key: "rentabilidade",
    title: "Rentabilidade",
    friendlyTitle: "Score geral de retorno",
    explanation: "É uma nota que combina diária, ocupação, retorno e outras variáveis para mostrar quais bairros parecem mais fortes em geração de resultado.",
    example: "Um score de 80 indica que o bairro está entre os melhores em equilíbrio de retorno.",
    keyMessage: "Quanto maior a rentabilidade, melhor o equilíbrio entre receita e atratividade do investimento.",
    icon: "Target",
  },
  {
    key: "liquidez",
    title: "Liquidez",
    friendlyTitle: "Facilidade de girar a operação",
    explanation: "Representa o quanto o bairro tende a ter demanda, reservas e velocidade comercial. Pode ser interpretado como facilidade de conseguir resultado e fluxo.",
    example: "Um bairro com alta liquidez tende a ter reservas mais constantes e menos períodos vazios.",
    keyMessage: "Nem sempre o bairro com maior retorno é o mais fácil de operar.",
    icon: "Zap",
  },
  {
    key: "crescimento",
    title: "Crescimento",
    friendlyTitle: "Potencial futuro do bairro",
    explanation: "Mostra se o bairro tem sinais de valorização, amadurecimento ou expansão futura da demanda.",
    example: "Um score alto de crescimento indica que o bairro pode valer mais no futuro.",
    keyMessage: "É o indicador que ajuda a enxergar o que pode melhorar ao longo do tempo.",
    icon: "Sprout",
  },
  {
    key: "confianca",
    title: "Confiança",
    friendlyTitle: "Qualidade dos dados",
    explanation: "Mostra o quão confiável é a leitura disponível para aquele bairro. Alto = dados mais consistentes. Médio = leitura útil, mas com mais incerteza. Baixo = análise mais exploratória.",
    example: "Bairros com confiança alta possuem maior volume de dados, o que torna a leitura mais segura.",
    keyMessage: "Confiança alta significa leitura mais consistente.",
    icon: "ShieldCheck",
  },
];

// ── Bairro Profile ───────────────────────────────────────────────
export type BairroProfile = "equilibrado" | "premium" | "alta-ocupacao" | "alto-retorno" | "arriscado" | "crescimento";

export interface BairroProfileInfo {
  profile: BairroProfile;
  label: string;
  color: string; // tailwind bg class using semantic tokens
  textColor: string;
  quickRead: string;
}

export function getBairroProfile(b: BairroAirbnb, allBairros: BairroAirbnb[]): BairroProfileInfo {
  const maxADR = Math.max(...allBairros.map(x => Number(x.adr_medio_studio)));
  const maxYield = Math.max(...allBairros.map(x => Number(x.yield_bruto_airbnb)));
  const maxOcc = Math.max(...allBairros.map(x => Number(x.ocupacao_media_studio)));

  const rent = Number(b.score_rentabilidade);
  const liq = Number(b.score_liquidez);
  const cresc = Number(b.score_crescimento_potencial);
  const adr = Number(b.adr_medio_studio);
  const yld = Number(b.yield_bruto_airbnb);
  const occ = Number(b.ocupacao_media_studio);

  // balanced = good across all three scores
  const avgScore = (rent + liq + cresc) / 3;
  const scoreSpread = Math.max(rent, liq, cresc) - Math.min(rent, liq, cresc);

  if (adr >= maxADR * 0.92) {
    return { profile: "premium", label: "Premium", color: "bg-violet-100", textColor: "text-violet-800", quickRead: "Diárias premium" };
  }
  if (yld >= maxYield * 0.95 && liq < 60) {
    return { profile: "arriscado", label: "Mais arriscado", color: "bg-red-100", textColor: "text-red-800", quickRead: "Mais retorno com mais risco" };
  }
  if (yld >= maxYield * 0.90) {
    return { profile: "alto-retorno", label: "Alto retorno", color: "bg-emerald-100", textColor: "text-emerald-800", quickRead: "Maior retorno potencial" };
  }
  if (occ >= maxOcc * 0.95) {
    return { profile: "alta-ocupacao", label: "Alta ocupação", color: "bg-blue-100", textColor: "text-blue-800", quickRead: "Alta ocupação" };
  }
  if (cresc >= 70 && cresc > rent) {
    return { profile: "crescimento", label: "Crescimento forte", color: "bg-amber-100", textColor: "text-amber-800", quickRead: "Boa aposta de crescimento" };
  }
  // default: equilibrado
  return { profile: "equilibrado", label: "Equilibrado", color: "bg-primary/10", textColor: "text-primary", quickRead: "Melhor equilíbrio geral" };
}

// ── Highlight winners ────────────────────────────────────────────
export interface HighlightWinner {
  category: string;
  icon: string;
  bairro: string;
  value: string;
  narrative: string;
}

export function getHighlightWinners(bairros: BairroAirbnb[]): HighlightWinner[] {
  if (!bairros.length) return [];

  const best = (fn: (b: BairroAirbnb) => number) => bairros.reduce((a, b) => fn(a) > fn(b) ? a : b);

  const bestEquilibrio = (() => {
    // balanced = highest average of three scores with lowest spread
    return bairros.reduce((a, b) => {
      const avgA = (Number(a.score_rentabilidade) + Number(a.score_liquidez) + Number(a.score_crescimento_potencial)) / 3;
      const avgB = (Number(b.score_rentabilidade) + Number(b.score_liquidez) + Number(b.score_crescimento_potencial)) / 3;
      const spreadA = Math.max(Number(a.score_rentabilidade), Number(a.score_liquidez), Number(a.score_crescimento_potencial)) - Math.min(Number(a.score_rentabilidade), Number(a.score_liquidez), Number(a.score_crescimento_potencial));
      const spreadB = Math.max(Number(b.score_rentabilidade), Number(b.score_liquidez), Number(b.score_crescimento_potencial)) - Math.min(Number(b.score_rentabilidade), Number(b.score_liquidez), Number(b.score_crescimento_potencial));
      const scoreA = avgA - spreadA * 0.3;
      const scoreB = avgB - spreadB * 0.3;
      return scoreA > scoreB ? a : b;
    });
  })();

  const bestRent = best(b => Number(b.yield_bruto_airbnb));
  const bestPremium = best(b => Number(b.adr_medio_studio));
  const bestOcc = best(b => Number(b.ocupacao_media_studio));
  const bestCresc = best(b => Number(b.score_crescimento_potencial));

  return [
    {
      category: "Melhor equilíbrio geral",
      icon: "Scale",
      bairro: bestEquilibrio.bairro,
      value: `Score médio ${fmtScore((Number(bestEquilibrio.score_rentabilidade) + Number(bestEquilibrio.score_liquidez) + Number(bestEquilibrio.score_crescimento_potencial)) / 3)}`,
      narrative: `${bestEquilibrio.bairro} combina boa ocupação, yield forte e leitura geral positiva.`,
    },
    {
      category: "Bairro premium",
      icon: "Crown",
      bairro: bestPremium.bairro,
      value: `ADR ${fmtBRL(bestPremium.adr_medio_studio)}`,
      narrative: `${bestPremium.bairro} tem as diárias mais altas e forte percepção de valor.`,
    },
    {
      category: "Maior retorno potencial",
      icon: "Rocket",
      bairro: bestRent.bairro,
      value: `Yield ${fmtPct(bestRent.yield_bruto_airbnb)}`,
      narrative: `${bestRent.bairro} mostra o yield mais alto, mas com leitura de risco maior.`,
    },
    {
      category: "Maior tração operacional",
      icon: "Activity",
      bairro: bestOcc.bairro,
      value: `Ocupação ${fmtPct(bestOcc.ocupacao_media_studio)}`,
      narrative: `${bestOcc.bairro} se destaca pela ocupação forte e boa eficiência operacional.`,
    },
    {
      category: "Crescimento consistente",
      icon: "TrendingUp",
      bairro: bestCresc.bairro,
      value: `Score ${fmtScore(bestCresc.score_crescimento_potencial)}`,
      narrative: `${bestCresc.bairro} combina estabilidade atual com boa perspectiva futura.`,
    },
  ];
}

// ── Auto-generated narrative insights ────────────────────────────
export function generateNarrativeInsights(bairros: BairroAirbnb[]): string[] {
  if (!bairros.length) return [];
  const winners = getHighlightWinners(bairros);
  const insights: string[] = [];

  // find equilibrado
  const eq = winners.find(w => w.category === "Melhor equilíbrio geral");
  if (eq) insights.push(`${eq.bairro} aparece como o bairro mais equilibrado da amostra, combinando boa ocupação, yield forte e boa rentabilidade geral.`);

  const premium = winners.find(w => w.category === "Bairro premium");
  if (premium) insights.push(`${premium.bairro} se destaca pelas diárias mais altas, reforçando o perfil premium do bairro, embora isso não resulte necessariamente no maior retorno percentual.`);

  // find high occ
  const occ = winners.find(w => w.category === "Maior tração operacional");
  if (occ) insights.push(`${occ.bairro} chama atenção pela ocupação forte e yield elevado, sugerindo boa tração operacional.`);

  // find high yield but low liquidity
  const ret = winners.find(w => w.category === "Maior retorno potencial");
  if (ret) {
    const retB = bairros.find(b => b.bairro === ret.bairro);
    if (retB && Number(retB.score_liquidez) < 65) {
      insights.push(`${ret.bairro} mostra o maior retorno potencial da tabela, mas com liquidez menor e confiança intermediária, o que pede leitura mais cautelosa.`);
    } else if (retB) {
      insights.push(`${ret.bairro} mostra o maior retorno potencial da tabela com ${fmtPct(retB.yield_bruto_airbnb)} de yield bruto.`);
    }
  }

  const cresc = winners.find(w => w.category === "Crescimento consistente");
  if (cresc) insights.push(`${cresc.bairro} aparece como uma alternativa consistente, com bom equilíbrio entre crescimento, ocupação e estabilidade.`);

  return insights;
}

// ── Bairro detail narrative builders ─────────────────────────────
export function buildHeaderNarrative(b: BairroAirbnb, profile: BairroProfileInfo): string {
  const map: Record<BairroProfile, string> = {
    equilibrado: `${b.bairro} se destaca como um dos bairros mais equilibrados para short stay na amostra, combinando boa ocupação, retorno forte e leitura geral positiva.`,
    premium: `${b.bairro} é o bairro com perfil premium da análise, com as diárias mais altas e forte percepção de valor entre investidores e hóspedes.`,
    "alta-ocupacao": `${b.bairro} se destaca pela alta ocupação, indicando forte demanda de hóspedes e boa tração operacional no short stay.`,
    "alto-retorno": `${b.bairro} apresenta o maior retorno potencial da amostra, com yield bruto elevado que pode atrair investidores com apetite por rentabilidade.`,
    arriscado: `${b.bairro} mostra retorno potencialmente elevado, mas indicadores de liquidez e risco pedem uma leitura mais cautelosa.`,
    crescimento: `${b.bairro} aparece como uma aposta de crescimento, com sinais de valorização e expansão futura da demanda por short stay.`,
  };
  return map[profile.profile];
}

export function buildLeigosResumo(b: BairroAirbnb, profile: BairroProfileInfo): string[] {
  const items: string[] = [];
  items.push(`Cobra diária média de ${fmtBRL(b.adr_medio_studio)} por noite`);
  items.push(`Mantém ocupação de ${fmtPct(b.ocupacao_media_studio)} dos dias`);
  items.push(`Yield bruto de ${fmtPct(b.yield_bruto_airbnb)} ao ano no Airbnb`);
  if (Number(b.delta_yield) > 0.02) {
    items.push(`O Airbnb rende ${fmtPct(b.delta_yield)} a mais que o aluguel tradicional`);
  }
  if (profile.profile === "equilibrado") items.push("Parece mais equilibrado do que bairros mais caros");
  if (profile.profile === "premium") items.push("Posicionamento premium com diárias acima da média");
  return items;
}

export function buildExplicaResultado(b: BairroAirbnb): string[] {
  const items: string[] = [];
  if (Number(b.ocupacao_media_studio) > 0.65) items.push("Ocupação consistente acima de 65%");
  if (Number(b.delta_yield) > 0) items.push("Delta yield positivo — Airbnb supera aluguel tradicional");
  if (Number(b.score_rentabilidade) > 60) items.push("Boa rentabilidade geral");
  if (Number(b.score_liquidez) > 55) items.push("Liquidez razoável a boa");
  if (Number(b.score_crescimento_potencial) > 60) items.push("Bom potencial de crescimento futuro");
  if (Number(b.percentual_superhost) > 0.3) items.push(`${fmtPct(b.percentual_superhost)} dos hosts são superhosts`);
  return items;
}

export function buildPontosAtencao(b: BairroAirbnb, allBairros: BairroAirbnb[]): string[] {
  const items: string[] = [];
  const maxADR = Math.max(...allBairros.map(x => Number(x.adr_medio_studio)));
  if (Number(b.adr_medio_studio) < maxADR * 0.7) items.push("Diária abaixo da média dos bairros premium");
  if (Number(b.score_crescimento_potencial) < 50) items.push("Crescimento pode ser inferior a regiões em expansão");
  if (b.nivel_confianca_dados !== "alto") items.push("Confiança dos dados é intermediária, o que pode afetar a leitura");
  if (Number(b.grau_saturacao_index) > 0.6) items.push("Grau de saturação relativamente alto");
  if (Number(b.risco_regulatorio) > 0.5) items.push("Risco regulatório acima da média");
  if (Number(b.score_liquidez) < 50) items.push("Liquidez mais baixa — pode ser mais difícil manter ocupação estável");
  if (items.length === 0) items.push("Nenhum ponto crítico identificado com os dados atuais");
  return items;
}

export function buildShortVsLongNarrative(b: BairroAirbnb): string {
  const delta = Number(b.delta_yield);
  if (delta > 0.04) return `O Airbnb gera um retorno consideravelmente superior ao aluguel tradicional neste bairro (${fmtPct(delta)} a mais), reforçando o potencial de short stay. Ainda assim, esse ganho deve ser interpretado junto com liquidez e risco.`;
  if (delta > 0.01) return `O short stay tem uma vantagem moderada sobre o aluguel tradicional (${fmtPct(delta)} a mais). A decisão pode depender do perfil do investidor e da disposição para operar ativamente.`;
  return `A diferença entre short stay e aluguel tradicional é pequena neste bairro (${fmtPct(delta)}). Para investidores que preferem simplicidade, o aluguel tradicional pode fazer mais sentido.`;
}

export function buildInvestorProfile(profile: BairroProfileInfo): string[] {
  const map: Record<BairroProfile, string[]> = {
    equilibrado: ["Investidor que busca equilíbrio entre retorno e estabilidade", "Quem prefere menor risco operacional", "Primeiro investimento em short stay"],
    premium: ["Investidor que busca posicionamento nobre", "Quem prioriza ticket médio alto", "Perfil mais conservador com imóvel valorizado"],
    "alta-ocupacao": ["Investidor que busca fluxo constante de receita", "Quem prioriza menos dias vazios", "Perfil que valoriza previsibilidade"],
    "alto-retorno": ["Investidor que busca maximizar rentabilidade", "Perfil mais agressivo, aceita mais variação", "Quem prioriza retorno sobre ticket"],
    arriscado: ["Investidor com apetite por risco maior", "Perfil especulativo, busca retorno acima do mercado", "Requer acompanhamento mais próximo da operação"],
    crescimento: ["Investidor com visão de médio/longo prazo", "Quem aposta em valorização futura", "Perfil que aceita retorno menor hoje por ganho futuro"],
  };
  return map[profile.profile];
}

// ── Microcopy quotes ─────────────────────────────────────────────
export const MICROCOPY = [
  "Entenda o que realmente move o retorno no short stay.",
  "Compare bairros como um investidor, não como um turista.",
  "Preço alto por noite nem sempre significa melhor negócio.",
  "O melhor investimento está no equilíbrio, não apenas na diária.",
  "Use os scores como leitura estratégica, não como verdade absoluta.",
  "Confiança alta significa leitura mais consistente.",
  "Delta yield mostra quando o Airbnb supera o aluguel tradicional.",
];

// ── Key education messages ───────────────────────────────────────
export const EDUCATION_MESSAGES = [
  { title: "Diária premium ≠ maior rentabilidade", text: "Cobrar mais por noite não garante melhor retorno final. O que importa é o equilíbrio entre diária, ocupação e preço do imóvel." },
  { title: "Os melhores retornos nem sempre estão nos bairros mais óbvios", text: "Bairros intermediários podem gerar melhor retorno percentual porque o imóvel custa menos para comprar." },
  { title: "Retorno alto com liquidez baixa pode significar mais risco", text: "Não adianta o retorno parecer ótimo no papel se for mais difícil manter ocupação ou estabilidade." },
  { title: "O melhor investimento está no equilíbrio", text: "O melhor resultado costuma aparecer onde existe equilíbrio entre preço da diária, ocupação, retorno do imóvel e potencial do bairro." },
];

// ── Table highlights ─────────────────────────────────────────────
export interface TableHighlight {
  bairro: string;
  type: "max-adr" | "max-occ" | "max-yield" | "best-balance" | "max-risk";
}

export function getTableHighlights(bairros: BairroAirbnb[]): TableHighlight[] {
  if (!bairros.length) return [];
  const best = (fn: (b: BairroAirbnb) => number) => bairros.reduce((a, b) => fn(a) > fn(b) ? a : b);
  const worst = (fn: (b: BairroAirbnb) => number) => bairros.reduce((a, b) => fn(a) < fn(b) ? a : b);

  return [
    { bairro: best(b => Number(b.adr_medio_studio)).bairro, type: "max-adr" },
    { bairro: best(b => Number(b.ocupacao_media_studio)).bairro, type: "max-occ" },
    { bairro: best(b => Number(b.yield_bruto_airbnb)).bairro, type: "max-yield" },
    { bairro: getHighlightWinners(bairros)[0]?.bairro ?? "", type: "best-balance" },
  ];
}
