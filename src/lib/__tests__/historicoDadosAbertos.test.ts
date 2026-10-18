import { describe, expect, it } from "vitest";
import { coletasReserva, montarColetas, montarRegistro, type LinhaHistorico } from "@/lib/historicoRadar";
import { csvDadosAbertos, datasetJsonLd, jsonDadosAbertos, linhasDadosAbertos, textoCitacao } from "@/lib/dadosAbertos";
import { BAIRROS_CURADOS, getBairroCurado } from "@/data/bairrosCurados";

const linha = (o: Partial<LinhaHistorico> & Pick<LinhaHistorico, "bairro" | "indicador" | "valor" | "coletado_em">): LinhaHistorico => ({
  id: `${o.bairro}-${o.indicador}-${o.coletado_em}`, amostra_n: 100, periodo_inicio: "2026-01-01", periodo_fim: "2026-09-30", fonte_id: "guestfavorites", ativo: true, url_origem: null,
  radar_fontes: { nome: "GuestFavorites", tipo: "publica" }, ...o,
});

describe("histórico público do Radar", () => {
  const linhas: LinhaHistorico[] = [
    linha({ bairro: "Pinheiros", indicador: "adr_medio_brl", valor: 300, coletado_em: "2026-10-13", ativo: false }),
    linha({ bairro: "Pinheiros", indicador: "ocupacao_media_pct", valor: 62, coletado_em: "2026-10-13", ativo: false }),
    linha({ bairro: "Pinheiros", indicador: "adr_medio_brl", valor: 299, coletado_em: "2026-10-18" }),
    linha({ bairro: "Pinheiros", indicador: "ocupacao_media_pct", valor: 63, coletado_em: "2026-10-18" }),
    linha({ bairro: "Pinheiros", indicador: "anuncios_ativos", valor: 2452, coletado_em: "2026-10-18" }),
    linha({ bairro: "Santana", indicador: "adr_medio_brl", valor: 229, coletado_em: "2026-10-18" }),
    linha({ bairro: "Santana", indicador: "ocupacao_media_pct", valor: 62, coletado_em: "2026-10-18" }),
    linha({ bairro: "Brooklin", indicador: "adr_medio_brl", valor: 360, coletado_em: "2026-10-13", fonte_id: "estimativa_bewild", radar_fontes: { nome: "Estimativa Bewild", tipo: "estimativa" } }),
    linha({ bairro: "São Paulo", indicador: "adr_medio_brl", valor: 266, coletado_em: "2026-10-13" }),
  ];

  it("agrupa uma coleta por bairro/data/fonte, mais recente primeiro, com os indicadores juntos", () => {
    const coletas = montarColetas(linhas);
    expect(coletas[0]).toMatchObject({ bairro: "Pinheiros", coletadoEm: "2026-10-18", diaria: 299, ocupacao: 63, anuncios: 2452, ativo: true, periodo: "jan–set/2026" });
    expect(coletas.find((c) => c.bairro === "Pinheiros" && c.coletadoEm === "2026-10-13")).toMatchObject({ diaria: 300, ocupacao: 62, ativo: false, anuncios: 100 });
  });

  it("registro: bairro novo na primeira coleta, atualizado nas seguintes; estimativa Bewild e a cidade ficam fora", () => {
    const registro = montarRegistro(montarColetas(linhas));
    expect(registro.map((e) => e.data)).toEqual(["2026-10-18", "2026-10-13"]);
    expect(registro[0]).toMatchObject({ fonteNome: "GuestFavorites", novos: ["Santana"], atualizados: ["Pinheiros"] });
    expect(registro[1]).toMatchObject({ novos: ["Pinheiros"], atualizados: [] });
    expect(registro.some((e) => e.fonteId === "estimativa_bewild")).toBe(false);
    expect(registro.flatMap((e) => [...e.novos, ...e.atualizados])).not.toContain("São Paulo");
  });

  it("reserva offline: uma coleta por bairro com os mesmos números de bairrosCurados.ts", () => {
    const reserva = coletasReserva();
    expect(reserva).toHaveLength(BAIRROS_CURADOS.length);
    const pin = reserva.find((c) => c.bairro === "Pinheiros")!;
    expect(pin).toMatchObject({ diaria: 299, ocupacao: 63, anuncios: 2452, fonteId: "guestfavorites", coletadoEm: "2026-10-18" });
    expect(reserva.find((c) => c.bairro === "Brooklin")).toMatchObject({ fonteId: "aproximacao_itaim_bibi", fonteTipo: "aproximacao" });
    const registro = montarRegistro(reserva);
    const dia18 = registro.find((e) => e.data === "2026-10-18" && e.fonteId === "guestfavorites");
    expect(dia18?.novos).toContain("Consolação"); // a reserva guarda só a coleta em uso: sem histórico, tudo conta como entrada
    expect(registro.find((e) => e.data === "2026-10-13")?.novos).toEqual(["Moema"]);
  });
});

describe("dados abertos", () => {
  it("uma linha por bairro, com natureza, fonte e receita de referência calculada do mesmo jeito do site", () => {
    const linhas = linhasDadosAbertos();
    expect(linhas).toHaveLength(BAIRROS_CURADOS.length);
    const pin = linhas.find((l) => l.bairro === "Pinheiros")!;
    expect(pin).toMatchObject({ natureza: "observado", ocupacao_pct: 63, diaria_media_brl: 299, diaria_p25_brl: 171, diaria_mediana_brl: 232, diaria_p75_brl: 301, anuncios_ativos: 2452, receita_mensal_referencia_brl: 5651, periodo: "jan–set/2026", coletado_em: "2026-10-18" });
    expect(pin.url_fonte).toBe(getBairroCurado("Pinheiros")!.sourceUrl);
    const brooklin = linhas.find((l) => l.bairro === "Brooklin")!;
    expect(brooklin).toMatchObject({ natureza: "aproximacao", anuncios_ativos: null });
    expect(brooklin.aviso).toMatch(/Itaim Bibi/);
    expect(linhas.find((l) => l.bairro === "Mooca")!.aviso).toMatch(/Amostra pequena \(90 anúncios\)/);
    expect(linhas.find((l) => l.bairro === "Consolação")!.natureza).toBe("observado");
  });

  it("CSV com ponto e vírgula, BOM e cabeçalho fixo; JSON com licença e citação", () => {
    const csv = csvDadosAbertos();
    expect(csv.startsWith("﻿bairro;cidade;natureza;fonte;")).toBe(true);
    expect(csv.split("\n")).toHaveLength(BAIRROS_CURADOS.length + 2);
    expect(csv).toContain("Pinheiros;São Paulo;observado;GuestFavorites (dado público);63;299;171;232;301;2452;5651;jan–set/2026;2026-10-18;");
    const json = JSON.parse(jsonDadosAbertos(undefined, "2026-10-18"));
    expect(json.bairros).toHaveLength(BAIRROS_CURADOS.length);
    expect(json.como_citar).toBe(textoCitacao("2026-10-18"));
    expect(json.como_citar).toContain("Acesso em 18/10/2026");
    expect(json.referencia_sao_paulo).toMatchObject({ avgOccupancy: 60, dailyAvg: 265, activeListings: 35077 });
  });

  it("Dataset schema.org aponta para os arquivos e para a organização Bewild", () => {
    const ds = datasetJsonLd("https://radarbewild.com.br");
    expect(ds["@type"]).toBe("Dataset");
    expect(ds.distribution.map((d) => d.contentUrl)).toEqual(["https://radarbewild.com.br/dados/bairros.csv", "https://radarbewild.com.br/dados/bairros.json"]);
    expect(ds.publisher).toEqual({ "@id": "https://bewild.com.br/#org" });
    expect(ds.dateModified).toBe("2026-10-18");
  });
});
