import { describe, expect, it } from "vitest";
import { BAIRROS_CURADOS, fonteBairro, rotuloOcupacao } from "@/data/bairrosCurados";
import { alertasFonteRadar, montarBairros, notaFontesComplementares, type LinhaRadar } from "@/lib/radarBase";
import { coletaSchema } from "@/lib/radarColetas";

// Valores FICTÍCIOS, só para testar rótulos e regras. Nunca usar como dado de mercado.
const linhaAirdna = (indicador: string, valor: number, extra: Partial<LinhaRadar> = {}): LinhaRadar => ({
  indicador, valor, bairro: "Brooklin", amostra_n: 150, periodo_inicio: "2026-01-01", periodo_fim: "2026-09-30",
  fonte_id: "airdna", fonte_nome: "AirDNA", fonte_tipo: "licenciada", url_origem: "https://app.airdna.co/data/performance",
  coletado_em: "2026-10-16", confianca: "baixa", idade_dias: 0, ...extra,
});

describe("AirDNA nos bairros sem fonte pública", () => {
  const [brooklin] = montarBairros([linhaAirdna("adr_medio_brl", 100), linhaAirdna("ocupacao_media_pct", 50)]);

  it("rotula como AirDNA, nunca como GuestFavorites nem estimativa", () => {
    expect(brooklin).toMatchObject({ ocupacaoFonte: "airdna", estimativa: false, fonteNome: "AirDNA", period: "jan–set/2026" });
    expect(fonteBairro(brooklin)).toBe("AirDNA, jan–set/2026");
    expect(rotuloOcupacao(brooklin)).toBe("50% (AirDNA)");
    expect(fonteBairro(brooklin)).not.toMatch(/GuestFavorites/);
  });

  it("aplica aviso de amostra pequena e de dado desatualizado como em fonte pública", () => {
    expect(alertasFonteRadar(brooklin)).toEqual({ estimativa: false, amostraPequena: true, desatualizado: false });
    const [velho] = montarBairros([linhaAirdna("adr_medio_brl", 100, { idade_dias: 300, amostra_n: 500, confianca: "baixa" }), linhaAirdna("ocupacao_media_pct", 50, { amostra_n: 500 })]);
    expect(alertasFonteRadar(velho).desatualizado).toBe(true);
  });

  it("nota de fontes reflete a base exibida", () => {
    const base = BAIRROS_CURADOS.map((b) => (b.name === "Brooklin" ? { ...b, ocupacaoFonte: "airdna" as const, period: "jan–set/2026" } : b));
    expect(notaFontesComplementares(base)).toBe("Brooklin: AirDNA (dado licenciado), jan–set/2026. Vila Olímpia: aproximação pelo Itaim Bibi, distrito que inclui a Vila Olímpia e parte do Brooklin (sem dado público por bairro). Consolação: estimativa Bewild (sem fonte pública atualizada).");
    expect(notaFontesComplementares(BAIRROS_CURADOS)).toBe("Brooklin e Vila Olímpia: aproximação pelo Itaim Bibi, distrito que inclui a Vila Olímpia e parte do Brooklin (sem dado público por bairro). Consolação: estimativa Bewild (sem fonte pública atualizada).");
  });
});

describe("coleta AirDNA", () => {
  const coleta = { bairro: "Brooklin", fonte_id: "airdna", periodo_inicio: "2026-01-01", periodo_fim: "2026-09-30", coletado_em: "2026-10-16", publicado_em: "", amostra_n: 150, url_origem: "https://app.airdna.co/data/performance", observacao: "", indicadores: { adr_medio_brl: 100, ocupacao_media_pct: 50 } };

  it("aceita os três bairros sem fonte pública", () => {
    for (const bairro of ["Brooklin", "Consolação", "Vila Olímpia"]) expect(coletaSchema.safeParse({ ...coleta, bairro }).success).toBe(true);
  });
  it("recusa AirDNA em bairro com GuestFavorites", () => {
    expect(coletaSchema.safeParse({ ...coleta, bairro: "Pinheiros" }).success).toBe(false);
  });
  it("exige link da própria fonte", () => {
    expect(coletaSchema.safeParse({ ...coleta, url_origem: "https://www.guestfavorites.com/x" }).success).toBe(false);
    expect(coletaSchema.safeParse({ ...coleta, url_origem: "https://airdna.co.evil.com/x" }).success).toBe(false);
    expect(coletaSchema.safeParse({ ...coleta, fonte_id: "guestfavorites", bairro: "Pinheiros", url_origem: "https://app.airdna.co/x" }).success).toBe(false);
  });
});
