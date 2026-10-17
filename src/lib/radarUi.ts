/**
 * Regras de apresentação do Radar (direção Híbrida): natureza do dado, escala de
 * cor da receita de referência, tamanho dos marcadores, filtros do mapa e textos
 * derivados da base. Funções puras — nenhum número novo é criado aqui: tudo sai
 * da base de bairros (radarBase/bairrosCurados) ou de SAO_PAULO_REFERENCIA.
 */
import { avisoAmostra, receitaMensalReferencia, SAO_PAULO_REFERENCIA, type BairroCurado } from "@/data/bairrosCurados";
import { geoBairro } from "@/data/bairrosGeo";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";

/** Bairro como chega da base: BairroCurado com os campos extras do banco quando houver. */
export type BairroBase = BairroCurado & {
  fonteNome?: string;
  fonteTipo?: string;
  coletadoEm?: string | null;
};

export type NaturezaBairro = "observado" | "estimativa";

/** Observado = coleta GuestFavorites (pública) ou AirDNA (licenciada); estimativa = valores Bewild ou ajuste manual. */
export function naturezaBairro(b: Pick<BairroCurado, "ocupacaoFonte">): NaturezaBairro {
  return b.ocupacaoFonte === "bewild" ? "estimativa" : "observado";
}

/** Ajuste manual do admin (bairro_ajustes) sobre um bairro que tinha fonte observada. */
export function ajusteManual(b: BairroBase): boolean {
  return b.ocupacaoFonte === "bewild" && b.fonteTipo !== undefined && b.fonteTipo !== "estimativa";
}

const dataBR = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

/** Carimbo curto da fonte: "GuestFavorites · jan–set/2026 · coleta 13/10/2026". */
export function fonteCurtaBairro(b: BairroBase): string {
  if (ajusteManual(b)) return "Ajuste manual da Bewild";
  if (naturezaBairro(b) === "estimativa") return "Sem fonte pública atualizada";
  const partes = [b.fonteNome ?? (b.ocupacaoFonte === "airdna" ? "AirDNA" : "GuestFavorites")];
  if (b.period) partes.push(b.period);
  if (b.coletadoEm) partes.push(`coleta ${dataBR(b.coletadoEm)}`);
  return partes.join(" · ");
}

/** Receita mensal de referência de São Paulo (diária × 30 × ocupação), da mesma coleta. */
export const RECEITA_REFERENCIA_SP = receitaMensalReferencia(SAO_PAULO_REFERENCIA);

/* ─── Escala sequencial de cor da receita de referência (só dado observado) ─── */

/** Limites visuais da legenda do mapa (critério de visualização, não estatística). */
export const FAIXAS_ESCALA_RECEITA = [4200, 4600, 5000, 5700] as const;
export type PassoEscala = 1 | 2 | 3 | 4 | 5;

export function passoEscalaReceita(receita: number): PassoEscala {
  const i = FAIXAS_ESCALA_RECEITA.findIndex((limite) => receita < limite);
  return (i === -1 ? 5 : i + 1) as PassoEscala;
}

/** Cor do token da escala (para estilo inline): "hsl(var(--escala-3))". */
export const corEscalaReceita = (receita: number) => `hsl(var(--escala-${passoEscalaReceita(receita)}))`;

/** Extremos da legenda: menor e maior receita observada, arredondados para a centena. */
export function extremosLegendaReceita(bairros: Pick<BairroCurado, "ocupacaoFonte" | "dailyAvg" | "avgOccupancy">[]): [number, number] | null {
  const valores = bairros.filter((b) => naturezaBairro(b) === "observado").map(receitaMensalReferencia);
  if (!valores.length) return null;
  return [Math.floor(Math.min(...valores) / 100) * 100, Math.ceil(Math.max(...valores) / 100) * 100];
}

/** Marcador do mapa: 12 + √anúncios ÷ 62 × 20 px; estimativa (ou sem amostra) fica com 18 px. */
export function tamanhoMarcador(b: Pick<BairroCurado, "ocupacaoFonte" | "activeListings">): number {
  if (naturezaBairro(b) === "estimativa" || !b.activeListings) return 18;
  return Math.round(12 + (Math.sqrt(b.activeListings) / 62) * 20);
}

/**
 * Aparência do marcador de um bairro: cor da escala de receita (observado) ou
 * fundo branco com contorno tracejado âmbar (estimativa). `escala` reduz o
 * tamanho (0,7 no mapa compacto da home; 0,8 no celular).
 */
export function estiloMarcador(b: BairroCurado, escala = 1) {
  const tamanho = Math.round(tamanhoMarcador(b) * escala);
  const estimativa = naturezaBairro(b) === "estimativa";
  return {
    width: `${tamanho}px`,
    height: `${tamanho}px`,
    background: estimativa ? "hsl(var(--card) / 0.9)" : corEscalaReceita(receitaMensalReferencia(b)),
    border: estimativa ? "2px dashed hsl(var(--estimate))" : "2px solid hsl(var(--card))",
  };
}

/* ─── Filtros do mapa ─── */

export type FiltroFonte = "todas" | "observados";
export const RECEITAS_MINIMAS = [0, 4500, 5500] as const;
export interface FiltrosMapa {
  busca: string;
  fonte: FiltroFonte;
  receitaMin: number;
}
export const FILTROS_INICIAIS: FiltrosMapa = { busca: "", fonte: "todas", receitaMin: 0 };

export const normalizarTexto = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export const temFiltroAtivo = (f: FiltrosMapa) => normalizarTexto(f.busca) !== "" || f.fonte !== "todas" || f.receitaMin > 0;

export function passaFiltros(b: BairroCurado, f: FiltrosMapa): boolean {
  const q = normalizarTexto(f.busca);
  if (q && !normalizarTexto(b.name).includes(q)) return false;
  if (f.fonte === "observados" && naturezaBairro(b) === "estimativa") return false;
  return receitaMensalReferencia(b) >= f.receitaMin;
}

/** Bairros em ordem decrescente de receita de referência (desempate pelo nome). */
export function ordenarPorReceita<T extends BairroCurado>(bairros: T[]): { bairro: T; receita: number }[] {
  return bairros
    .map((bairro) => ({ bairro, receita: receitaMensalReferencia(bairro) }))
    .sort((a, b) => b.receita - a.receita || a.bairro.name.localeCompare(b.bairro.name, "pt-BR"));
}

const POR_EXTENSO = ["", "A", "As duas", "As três", "As quatro", "As cinco"];

/**
 * Nota das estimativas Bewild, montada a partir da base exibida
 * (ex.: "As três estimativas Bewild ficam acima da média e não têm fonte pública atualizada — leia com cautela.").
 */
export function notaEstimativas(bairros: BairroCurado[]): string | null {
  const estimativas = bairros.filter((b) => naturezaBairro(b) === "estimativa");
  const n = estimativas.length;
  if (!n) return null;
  const sujeito = n === 1 ? "A estimativa Bewild" : `${POR_EXTENSO[n] ?? `As ${n}`} estimativas Bewild`;
  const todasAcima = estimativas.every((b) => receitaMensalReferencia(b) > RECEITA_REFERENCIA_SP);
  const posicao = todasAcima ? (n === 1 ? " fica acima da média e" : " ficam acima da média e") : "";
  return `${sujeito}${posicao} ${n === 1 ? "não tem" : "não têm"} fonte pública atualizada — leia com cautela.`;
}

const juntarNomes = (nomes: string[]) => (nomes.length <= 1 ? nomes.join("") : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`);
function maisFrequente(valores: string[]): string | null {
  const contagem = new Map<string, number>();
  for (const v of valores) if (v) contagem.set(v, (contagem.get(v) ?? 0) + 1);
  return [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
}

/**
 * Textos de "Fontes e atualização" montados a partir da base exibida, para não
 * ficarem desatualizados quando entra uma coleta nova (períodos, data da coleta,
 * bairros com AirDNA, estimativas e ajustes manuais).
 */
export function textosFontes(bairros: BairroBase[]): { observado: string; estimativa: string; hipotese: string } {
  const gf = bairros.filter((b) => b.ocupacaoFonte === "guestfavorites");
  const airdna = bairros.filter((b) => b.ocupacaoFonte === "airdna");
  const ajustes = bairros.filter((b) => naturezaBairro(b) === "estimativa" && ajusteManual(b));
  const estimativas = bairros.filter((b) => naturezaBairro(b) === "estimativa" && !ajusteManual(b));

  const periodo = maisFrequente(gf.map((b) => b.period ?? ""));
  const outros = new Map<string, string[]>();
  for (const b of gf) if (b.period && b.period !== periodo) outros.set(b.period, [...(outros.get(b.period) ?? []), b.name]);
  const coleta = maisFrequente(gf.map((b) => (b.coletadoEm ? dataBR(b.coletadoEm) : "")));
  let observado = "Diária, ocupação, quartis e amostra de anúncios da GuestFavorites.";
  const detalhes = [
    coleta ? `Coleta de ${coleta}` : "",
    periodo ? `período ${periodo}${outros.size ? ` (${[...outros].map(([p, nomes]) => `${juntarNomes(nomes)}: ${p}`).join("; ")})` : ""}` : "",
  ].filter(Boolean);
  if (detalhes.length) {
    const t = detalhes.join("; ");
    observado += ` ${t.charAt(0).toUpperCase()}${t.slice(1)}.`;
  }
  const porPeriodoAirdna = new Map<string, string[]>();
  for (const b of airdna) porPeriodoAirdna.set(b.period ?? "", [...(porPeriodoAirdna.get(b.period ?? "") ?? []), b.name]);
  for (const [p, nomes] of porPeriodoAirdna) observado += ` ${juntarNomes(nomes)}: AirDNA (dado licenciado)${p ? `, ${p}` : ""}.`;

  const partesEstimativa = [
    estimativas.length
      ? `${juntarNomes(estimativas.map((b) => b.name))} ${estimativas.length === 1 ? "usa" : "usam"} valores Bewild anteriores, sem fonte pública atualizada.`
      : "Nenhum bairro desta base usa valores Bewild sem fonte pública.",
    ajustes.length ? `Ajustes manuais (${juntarNomes(ajustes.map((b) => b.name))}) também são sinalizados.` : "Ajustes manuais também são sinalizados.",
  ];
  return {
    observado,
    estimativa: partesEstimativa.join(" "),
    hipotese: "Custos de limpeza, gestão, impostos e condomínio são premissas editáveis. Simulações são hipóteses, não retorno garantido.",
  };
}

/** Aviso de amostra pequena (menos de 200 anúncios; Mooca sempre). */
export function avisoAmostraBairro(b: BairroCurado): string | null {
  if (b.activeListings != null && b.activeListings < 200) return `amostra pequena (${formatDecimal(b.activeListings, 0)} anúncios)`;
  return avisoAmostra(b);
}

/** Texto para bairro sem quartis publicados (estimativa mostra a faixa Bewild). */
export function textoSemQuartis(b: BairroCurado): string {
  if (naturezaBairro(b) === "estimativa" && b.dailyMin < b.dailyMax) {
    return `Sem quartis publicados. Estimativa Bewild de ${formatBRL(b.dailyMin)} a ${formatBRL(b.dailyMax)} por diária.`;
  }
  return "Sem quartis publicados para este bairro.";
}

/** Fim da escala comum dos quartis na comparação: R$ 450 ou o maior P75, arredondado para R$ 50. */
export function fimEscalaQuartis(bairros: Pick<BairroCurado, "dailyQuartiles">[], minimo = 450): number {
  const maior = Math.max(minimo, ...bairros.flatMap((b) => (b.dailyQuartiles ? [b.dailyQuartiles[2]] : [])));
  return Math.ceil(maior / 50) * 50;
}

/**
 * Número digitado em português ("1.500", "6,5", "R$ 120", "18%") → 1500, 6.5, 120, 18.
 * Devolve null quando não há número. Só para campos de entrada; a exibição usa numberFormat.
 */
export function lerNumeroDigitado(texto: string): number | null {
  let t = texto.replace(/[^\d,.-]/g, "");
  if (!/\d/.test(t)) return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Cores das séries da comparação (até 3 bairros). */
export const COR_SERIE = ["hsl(var(--serie-1))", "hsl(var(--serie-2))", "hsl(var(--serie-3))"] as const;

/**
 * Posições do mapa esquemático (0–100% em x e y) a partir do centro de cada
 * bairro, com margem nas bordas. Bairros sem posição conhecida ficam de fora.
 */
export function posicoesEsquema(nomes: string[], margem = 0.08): Map<string, { x: number; y: number }> {
  const pontos = nomes.flatMap((nome) => {
    const g = geoBairro(nome);
    return g ? [{ nome, lat: g.lat, lng: g.lng }] : [];
  });
  const saida = new Map<string, { x: number; y: number }>();
  if (!pontos.length) return saida;
  const lats = pontos.map((p) => p.lat), lngs = pontos.map((p) => p.lng);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const util = 1 - 2 * margem;
  for (const p of pontos) {
    const x = maxLng > minLng ? (p.lng - minLng) / (maxLng - minLng) : 0.5;
    const y = maxLat > minLat ? (maxLat - p.lat) / (maxLat - minLat) : 0.5;
    saida.set(p.nome, { x: (margem + x * util) * 100, y: (margem + y * util) * 100 });
  }
  return saida;
}
