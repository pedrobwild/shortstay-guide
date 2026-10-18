import { BAIRROS_CURADOS, SAO_PAULO_REFERENCIA, receitaMensalReferencia, type BairroCurado } from "@/data/bairrosCurados";
import { bairrosReserva, type BairroRadar } from "@/lib/radarBase";

/**
 * Dados abertos do Radar: a mesma base de 28 bairros exibida no site, em CSV e JSON
 * (/dados/bairros.csv e /dados/bairros.json, gerados no build a partir da reserva offline,
 * que por regra tem os mesmos números do banco) e o Dataset schema.org. Nenhum número é
 * calculado aqui além da receita mensal de referência (diária × 30 × ocupação).
 */
export const CAMINHO_CSV = "/dados/bairros.csv";
export const CAMINHO_JSON = "/dados/bairros.json";
export const LICENCA_DADOS = "https://creativecommons.org/licenses/by/4.0/";
export const LICENCA_DADOS_NOME = "CC BY 4.0 — uso livre com citação do Radar Bewild e da fonte original (GuestFavorites)";

export type LinhaDadosAbertos = {
  bairro: string;
  cidade: "São Paulo";
  natureza: "observado" | "aproximacao" | "estimativa";
  fonte: string;
  ocupacao_pct: number;
  diaria_media_brl: number;
  diaria_p25_brl: number | null;
  diaria_mediana_brl: number | null;
  diaria_p75_brl: number | null;
  anuncios_ativos: number | null;
  receita_mensal_referencia_brl: number;
  periodo: string | null;
  coletado_em: string | null;
  url_fonte: string | null;
  aviso: string | null;
};

const FONTE: Record<BairroCurado["ocupacaoFonte"], { nome: string; natureza: LinhaDadosAbertos["natureza"] }> = {
  guestfavorites: { nome: "GuestFavorites (dado público)", natureza: "observado" },
  airdna: { nome: "AirDNA (dado licenciado)", natureza: "observado" },
  aproximacao: { nome: "Aproximação pelo Itaim Bibi (GuestFavorites)", natureza: "aproximacao" },
  bewild: { nome: "Estimativa Bewild (sem fonte pública)", natureza: "estimativa" },
};

export function avisoLinha(b: Pick<BairroCurado, "ocupacaoFonte" | "activeListings">): string | null {
  if (b.ocupacaoFonte === "aproximacao") return "Sem dado público por bairro: usa os números do distrito do Itaim Bibi.";
  if (b.ocupacaoFonte === "bewild") return "Estimativa interna, sem fonte pública.";
  if (b.activeListings !== null && b.activeListings < 200) return `Amostra pequena (${b.activeListings} anúncios).`;
  return null;
}

type Entrada = BairroCurado & Partial<Pick<BairroRadar, "coletadoEm">>;

export function linhasDadosAbertos(bairros: Entrada[] = bairrosReserva()): LinhaDadosAbertos[] {
  return [...bairros].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map((b) => ({
    bairro: b.name, cidade: "São Paulo", natureza: FONTE[b.ocupacaoFonte].natureza, fonte: FONTE[b.ocupacaoFonte].nome,
    ocupacao_pct: b.avgOccupancy, diaria_media_brl: b.dailyAvg,
    diaria_p25_brl: b.dailyQuartiles?.[0] ?? null, diaria_mediana_brl: b.dailyQuartiles?.[1] ?? null, diaria_p75_brl: b.dailyQuartiles?.[2] ?? null,
    anuncios_ativos: b.ocupacaoFonte === "aproximacao" ? null : b.activeListings,
    receita_mensal_referencia_brl: receitaMensalReferencia(b),
    periodo: b.period, coletado_em: b.coletadoEm ?? null, url_fonte: b.sourceUrl, aviso: avisoLinha(b),
  }));
}

const COLUNAS: (keyof LinhaDadosAbertos)[] = ["bairro", "cidade", "natureza", "fonte", "ocupacao_pct", "diaria_media_brl", "diaria_p25_brl", "diaria_mediana_brl", "diaria_p75_brl", "anuncios_ativos", "receita_mensal_referencia_brl", "periodo", "coletado_em", "url_fonte", "aviso"];
const celula = (v: unknown) => { if (v === null || v === undefined) return ""; const s = String(v); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

/** CSV com ponto e vírgula (abre direto no Excel pt-BR) e BOM para acentos; números inteiros, sem formatação local. */
export function csvDadosAbertos(linhas: LinhaDadosAbertos[] = linhasDadosAbertos()): string {
  return "﻿" + [COLUNAS.join(";"), ...linhas.map((l) => COLUNAS.map((c) => celula(l[c])).join(";"))].join("\n") + "\n";
}

export function jsonDadosAbertos(linhas: LinhaDadosAbertos[] = linhasDadosAbertos(), geradoEm = new Date().toISOString().slice(0, 10)): string {
  return JSON.stringify({
    nome: "Radar Bewild — base de bairros para short stay em São Paulo",
    descricao: "Ocupação, diária média, quartis de diária e anúncios ativos por bairro. Dados observados da GuestFavorites; aproximações e estimativas identificadas no campo natureza.",
    licenca: LICENCA_DADOS, como_citar: textoCitacao(geradoEm), metodologia: "https://radarbewild.com.br/metodologia", gerado_em: geradoEm,
    referencia_sao_paulo: { ...SAO_PAULO_REFERENCIA, fonte: "GuestFavorites (dado público)" },
    bairros: linhas,
  }, null, 2);
}

export function textoCitacao(data: string): string {
  const [a, m, d] = data.split("-");
  return `Radar Bewild (Bewild). Base de bairros para short stay em São Paulo — dados GuestFavorites. Disponível em radarbewild.com.br/metodologia. Acesso em ${d}/${m}/${a}.`;
}

/** Dataset schema.org (Google Dataset Search) para /metodologia e /ranking. */
export function datasetJsonLd(siteUrl = "https://radarbewild.com.br") {
  const datas = [...new Set(BAIRROS_CURADOS.map((b) => b.coletadoEm ?? "2026-10-13"))].sort();
  return {
    "@context": "https://schema.org", "@type": "Dataset", "@id": `${siteUrl}/metodologia#dataset`,
    name: "Radar Bewild — base de bairros para short stay em São Paulo",
    description: "Ocupação média, diária média (ADR), quartis de diária e anúncios ativos de studios/apartamentos no Airbnb por bairro de São Paulo. Dados observados da GuestFavorites, com aproximações e estimativas identificadas.",
    url: `${siteUrl}/metodologia`, sameAs: `${siteUrl}/ranking`, inLanguage: "pt-BR", isAccessibleForFree: true, license: LICENCA_DADOS,
    creator: { "@id": "https://bewild.com.br/#org" }, publisher: { "@id": "https://bewild.com.br/#org" },
    dateModified: datas[datas.length - 1], temporalCoverage: "2026-01/2026-09",
    spatialCoverage: { "@type": "Place", name: "São Paulo, SP, Brasil" },
    keywords: ["short stay", "Airbnb", "São Paulo", "ocupação", "diária média", "studio", "bairros"],
    variableMeasured: ["ocupacao_pct", "diaria_media_brl", "diaria_p25_brl", "diaria_mediana_brl", "diaria_p75_brl", "anuncios_ativos", "receita_mensal_referencia_brl"],
    distribution: [
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${siteUrl}${CAMINHO_CSV}` },
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${siteUrl}${CAMINHO_JSON}` },
    ],
    isBasedOn: { "@type": "Dataset", name: "GuestFavorites — Airbnb occupancy rates in São Paulo", url: "https://www.guestfavorites.com" },
  };
}
