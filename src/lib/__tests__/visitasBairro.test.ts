import { beforeEach, describe, expect, it, vi } from "vitest";
const { insert } = vi.hoisted(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ insert }) } }));
beforeEach(() => { vi.resetModules(); insert.mockClear(); localStorage.clear(); window.history.replaceState({}, "", "/bairro/pinheiros"); });
describe("visitas consentidas de bairro", () => {
  it("não grava sem consentimento ou com recusa", async () => {
    const { registrarVisitaBairro } = await import("@/lib/visitasBairro");
    await registrarVisitaBairro();
    localStorage.setItem("radar_bewild_consent_v1", "refused");
    await registrarVisitaBairro();
    expect(insert).not.toHaveBeenCalled();
  });
  it("grava caminho sem parâmetros e não duplica ao mudar hash", async () => {
    localStorage.setItem("radar_bewild_consent_v1", "accepted");
    window.history.replaceState({}, "", "/bairro/pinheiros?email=privado#dados");
    const { registrarVisitaBairro } = await import("@/lib/visitasBairro");
    await registrarVisitaBairro(); await registrarVisitaBairro();
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0]).toMatchObject({ page: "/bairro/pinheiros", event_type: "page_view", event_data: {} });
  });
  it("não mede admin e conta retorno real ao bairro", async () => {
    localStorage.setItem("radar_bewild_consent_v1", "accepted");
    const { registrarVisitaBairro } = await import("@/lib/visitasBairro");
    await registrarVisitaBairro();
    window.history.replaceState({}, "", "/admin/bairros"); await registrarVisitaBairro();
    expect(insert).toHaveBeenCalledTimes(1);
    window.history.replaceState({}, "", "/bairro/pinheiros"); await registrarVisitaBairro();
    expect(insert).toHaveBeenCalledTimes(2);
  });
});