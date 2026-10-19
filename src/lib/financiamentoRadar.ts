import { slugifyBairro } from "@/lib/seo";
import type { BairroRadar } from "@/lib/radarBase";
import { IMOVEL_PADRAO, SHORT_STAY_PADRAO, resultadoShortStay } from "@/lib/simuladorReceita";

/** Usa só a base aprovada; nenhum dado de hospedagem vira preço de compra ou juros. */
export function bairroFinanciamento(bairros: BairroRadar[], nome: string) {
  if (!nome.trim()) return undefined;
  return bairros.find((b) => slugifyBairro(b.name) === slugifyBairro(nome));
}

export const DESPESAS_FINANCIAMENTO = {
  condominio: IMOVEL_PADRAO.condominio,
  iptu: IMOVEL_PADRAO.iptu,
  contas: SHORT_STAY_PADRAO.contas,
};

export function projetarFinanciamentoRadar(
  bairro: Pick<BairroRadar, "dailyAvg" | "avgOccupancy">,
  parcela: number,
  despesas = DESPESAS_FINANCIAMENTO,
) {
  if (!Number.isFinite(bairro.dailyAvg) || bairro.dailyAvg <= 0 ||
      !Number.isFinite(bairro.avgOccupancy) || bairro.avgOccupancy < 0 || bairro.avgOccupancy > 100) return null;
  const resultado = resultadoShortStay(
    { diaria: bairro.dailyAvg, ocupacaoPct: bairro.avgOccupancy },
    { ...IMOVEL_PADRAO, condominio: despesas.condominio, iptu: despesas.iptu },
    { ...SHORT_STAY_PADRAO, contas: despesas.contas },
  );
  return { ...resultado, aposParcela: resultado.liquido - parcela };
}