export type MesMetrica = { date: string; days_booked?: number; days_available?: number; adr?: number; listing_count?: number };
const numero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Noites disponíveis da AirDNA são o denominador de ocupação; não são calendário público. */
export function agregarAirDNA(ocupacao: MesMetrica[], diaria: MesMetrica[], anuncios: MesMetrica[], inicio: string, fim: string) {
  const meses: string[] = [];
  const cursor = new Date(`${inicio}T00:00:00Z`);
  while (cursor.toISOString().slice(0, 7) <= fim.slice(0, 7)) {
    meses.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  const indexar = (serie: MesMetrica[]) => {
    const mapa = new Map<string, MesMetrica>();
    for (const linha of serie) {
      if (typeof linha.date !== "string") throw new Error("Série AirDNA sem data válida.");
      const mes = linha.date.slice(0, 7);
      if (!meses.includes(mes)) continue;
      if (mapa.has(mes)) throw new Error("Série AirDNA com mês duplicado.");
      mapa.set(mes, linha);
    }
    return mapa;
  };
  const occ = indexar(ocupacao), adr = indexar(diaria), n = indexar(anuncios);
  let reservadas = 0, disponiveis = 0, receita = 0;
  const amostras: number[] = [];
  for (const mes of meses) {
    const o = occ.get(mes), d = adr.get(mes), a = n.get(mes);
    if (!o || !d || !numero(o.days_booked) || !numero(o.days_available) || !numero(d.adr)) throw new Error("AirDNA sem cobertura mensal completa de diária e noites reservadas/disponíveis. Não será estimada a ocupação.");
    if (o.days_available <= 0 || o.days_booked < 0 || o.days_booked > o.days_available || d.adr <= 0) throw new Error("Indicadores AirDNA fora da faixa válida.");
    reservadas += o.days_booked;
    disponiveis += o.days_available;
    receita += d.adr * o.days_booked;
    if (a && numero(a.listing_count) && a.listing_count >= 0) amostras.push(a.listing_count);
  }
  if (reservadas <= 0) throw new Error("Não há noites reservadas suficientes para calcular a diária média.");
  return {
    indicadores: { adr_medio_brl: receita / reservadas, ocupacao_media_pct: reservadas / disponiveis * 100 },
    meses: meses.length,
    amostra_n: amostras.length === meses.length ? Math.round(amostras.reduce((s, v) => s + v, 0) / amostras.length) : null,
    amostra_tipo: "média mensal de anúncios ativos",
  };
}

export function compararIndicadores(novo: { adr_medio_brl: number; ocupacao_media_pct: number }, base: { adr_medio_brl: number; ocupacao_media_pct: number; periodo_inicio: string | null; periodo_fim: string | null } | null, inicio: string, fim: string) {
  if (!base) return { mesmo_periodo: false, diferencas: null, motivo: "Sem coleta GuestFavorites direta para este bairro." };
  if (base.periodo_inicio !== inicio || base.periodo_fim !== fim) return { mesmo_periodo: false, diferencas: null, motivo: "Períodos diferentes; comparação numérica não calculada." };
  return { mesmo_periodo: true, diferencas: { diaria_brl: novo.adr_medio_brl - base.adr_medio_brl, ocupacao_pp: novo.ocupacao_media_pct - base.ocupacao_media_pct }, motivo: "Confira também o recorte de imóveis: as metodologias das fontes podem diferir." };
}