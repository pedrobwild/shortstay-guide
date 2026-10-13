import { z } from "zod";

const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida");
export const coletaSchema = z.object({
  bairro: z.string().trim().min(2).max(100),
  fonte_id: z.literal("guestfavorites"),
  periodo_inicio: data,
  periodo_fim: data,
  coletado_em: data,
  publicado_em: z.union([data, z.literal("")]),
  amostra_n: z.number().int().nonnegative(),
  url_origem: z.string().url().max(2000).refine((v) => /^https:\/\/(www\.)?guestfavorites\.com\//.test(v), "Use um link HTTPS da GuestFavorites"),
  observacao: z.string().max(4000),
  indicadores: z.object({
    adr_medio_brl: z.number().positive(),
    ocupacao_media_pct: z.number().min(0).max(100),
    adr_p25_brl: z.number().nonnegative().optional(),
    adr_mediana_brl: z.number().nonnegative().optional(),
    adr_p75_brl: z.number().nonnegative().optional(),
    receita_anual_brl: z.number().nonnegative().optional(),
  }),
}).superRefine((v, ctx) => {
  const hoje = new Date().toISOString().slice(0, 10);
  if (v.periodo_inicio > v.periodo_fim || v.periodo_fim > v.coletado_em || v.coletado_em > hoje || (v.publicado_em && v.publicado_em > v.coletado_em)) ctx.addIssue({ code: "custom", message: "Revise o período e as datas de coleta/publicação" });
  const q = [v.indicadores.adr_p25_brl, v.indicadores.adr_mediana_brl, v.indicadores.adr_p75_brl];
  if (q.some((x) => x !== undefined) && !q.every((x) => x !== undefined)) ctx.addIssue({ code: "custom", message: "Preencha os três quartis ou deixe os três vazios" });
  const [p25, med, p75] = q;
  if (p25 !== undefined && med !== undefined && p75 !== undefined && (p25 > med || med > p75)) ctx.addIssue({ code: "custom", message: "Os quartis devem estar em ordem crescente" });
});

export const indicadoresColeta = [
  ["adr_medio_brl", "Diária média (R$)"],
  ["ocupacao_media_pct", "Ocupação média (%)"],
  ["adr_p25_brl", "Diária — 25% mais baratos (R$)"],
  ["adr_mediana_brl", "Diária — mediana (R$)"],
  ["adr_p75_brl", "Diária — 25% mais caros (R$)"],
  ["receita_anual_brl", "Receita anual (R$)"],
] as const;
export const numeroColeta = (s: string) => Number(s.replace(/\s/g, "").replace(/\./g, "").replace(",", "."));