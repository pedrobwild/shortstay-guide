import { describe, expect, it } from "vitest";
import { resumirInteresseBairros } from "@/lib/bairrosInteresse";
import type { EventoAcesso } from "@/lib/analyticsAcessos";
const evento = (page: string, event_type = "page_view"): EventoAcesso => ({ id: crypto.randomUUID(), page, event_type, created_at: "2026-10-31T16:00:00Z", session_id: "sessao", device_type: "mobile" });

describe("interesse por bairro", () => {
  it("conta somente imóveis publicados e normaliza bairro digitado", () => {
    const resumo = resumirInteresseBairros([{ bairro: "vila olimpia", publicado: true }, { bairro: "Vila Olímpia", publicado: true }, { bairro: "Vila Olímpia", publicado: false }], [], ["Vila Olímpia"]);
    expect(resumo).toEqual([{ bairro: "Vila Olímpia", publicados: 2, visitas: 0 }]);
  });
  it("conta visualizações da página do bairro sem transformar eventos antigos ou interações em visitas", () => {
    const resumo = resumirInteresseBairros([], [evento("/bairro/pinheiros"), evento("/bairro/pinheiros"), evento("guide"), evento("/bairro/pinheiros", "mercado_used"), evento("/admin/bairros")], ["Pinheiros"]);
    expect(resumo[0].visitas).toBe(2);
  });
  it("ordena bairros por visitas, incluindo os sem visitas", () => {
    const resumo = resumirInteresseBairros([], [evento("/bairro/mooca"), evento("/bairro/mooca"), evento("/bairro/pinheiros")], ["Pinheiros", "Mooca", "Brooklin"]);
    expect(resumo.map(l => [l.bairro, l.visitas])).toEqual([["Mooca", 2], ["Pinheiros", 1], ["Brooklin", 0]]);
  });
  it("mantém imóveis de bairros fora da base sem inventar visitas", () => {
    expect(resumirInteresseBairros([{ bairro: "Bairro novo", publicado: true }, { bairro: "", publicado: true }], [], [])).toEqual([{ bairro: "Bairro novo", publicados: 1, visitas: 0 }, { bairro: "Sem bairro informado", publicados: 1, visitas: 0 }]);
  });
});