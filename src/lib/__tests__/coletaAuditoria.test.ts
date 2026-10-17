import { describe, it, expect, vi } from "vitest";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn().mockResolvedValue({ data: 3, error: null }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
import { registrarColetaAuditada, utmsAcessoColeta, rotuloUtms } from "@/lib/coletaAuditoria";

describe("auditoria operacional de coletas", () => {
  it("usa UTMs do acesso ao Radar, sem capturar outros parâmetros", () => {
    expect(utmsAcessoColeta("?utm_source=radar&utm_medium=referral&utm_campaign=outubro&utm_content=admin&utm_term=mercado&token=privado")).toEqual({ utm_source: "radar", utm_medium: "referral", utm_campaign: "outubro", utm_content: "admin", utm_term: "mercado" });
  });
  it("não inventa UTMs quando o acesso não as tem", () => {
    expect(utmsAcessoColeta("?bairro=Mooca")).toEqual({});
    expect(rotuloUtms({})).toBe("Sem UTMs no acesso");
  });
  it("envia coleta e UTMs juntas sem aceitar autoria ou horário do navegador", async () => {
    const coleta = { bairro: "Mooca" };
    await registrarColetaAuditada(coleta, { utm_source: "radar" });
    expect(rpc).toHaveBeenCalledWith("admin_registrar_coleta_radar_auditada", { p_coleta: coleta, p_utms: { utm_source: "radar" } });
  });
});