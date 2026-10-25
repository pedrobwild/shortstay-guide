import { describe, expect, it } from "vitest";
import { resumirAcessos, type EventoAcesso } from "@/lib/analyticsAcessos";
const evento = (id: string, tipo: string, sessao: string | null): EventoAcesso => ({ id, event_type: tipo, session_id: sessao, created_at: "2026-10-25T01:00:00Z", page: "guide", device_type: "mobile" });
describe("resumo de acessos registrados", () => {
  it("conta visualizações e sessões sem tratar interações como visitas", () => {
    const resumo = resumirAcessos([evento("1", "page_view", "a"), evento("2", "page_view", "a"), evento("3", "simulator_used", "b"), evento("4", "page_view", null)]);
    expect(resumo.visualizacoes).toBe(3);
    expect(resumo.sessoes).toBe(1);
    expect(resumo.interacoes).toBe(1);
    expect(resumo.aparelhos).toEqual([{ nome: "mobile", total: 3 }]);
  });
  it("agrupa pelo dia de São Paulo", () => {
    expect(resumirAcessos([evento("1", "page_view", "a")]).porDia).toEqual([{ nome: "2026-10-24", total: 1 }]);
  });
  it("não inventa dados quando não há eventos", () => {
    const resumo = resumirAcessos([]);
    expect(resumo.visualizacoes).toBe(0);
    expect(resumo.sessoes).toBe(0);
    expect(resumo.porDia).toEqual([]);
  });
});