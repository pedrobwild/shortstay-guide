import { beforeEach, describe, expect, it, vi } from "vitest";
import { orcamentoUrl } from "@/lib/orcamento";

beforeEach(() => { vi.resetModules(); localStorage.clear(); document.head.innerHTML = ""; window.history.replaceState({}, "", "/"); window.dataLayer = []; delete window.fbq; delete window.gtag; });
describe("medição consentida", () => {
  it("começa com armazenamento negado, sem carregar rastreadores", async () => {
    const m = await import("@/lib/marketingConsent"); m.syncMeasurement();
    expect(m.canMeasure()).toBe(false); expect(document.querySelectorAll("script").length).toBe(0);
    const commands = window.dataLayer?.map((a) => Array.from(a as ArrayLike<unknown>));
    expect(commands?.[0]).toEqual(["consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", functionality_storage: "denied", personalization_storage: "denied", security_storage: "denied" }]);
  });
  it("recusar persiste a decisão e impede eventos", async () => {
    const m = await import("@/lib/marketingConsent"); m.saveConsent("refused"); m.trackBudgetClick("final"); m.trackPageView();
    expect(localStorage.getItem(m.CONSENT_KEY)).toBe("refused"); expect(m.canMeasure()).toBe(false); expect(document.querySelectorAll("script").length).toBe(0);
  });
  it("aceitar carrega os IDs aprovados e envia orçamento e primeira simulação", async () => {
    const m = await import("@/lib/marketingConsent"); m.saveConsent("accepted"); m.trackPageView(); m.trackPageView(); m.trackBudgetClick("hero"); m.trackSimulationUsed(); m.trackSimulationUsed();
    expect(document.getElementById("radar-ga4")?.getAttribute("src")).toContain("G-CE7GKKDG4L");
    expect(window.fbq?.queue).toContainEqual(["init", "644216424824915"]);
    expect(window.fbq?.queue).toContainEqual(["trackCustom", "ClickOrcamento", { local: "hero" }]);
    const commands = window.dataLayer?.map((a) => Array.from(a as ArrayLike<unknown>)) ?? [];
    expect(commands.filter((a) => a[1] === "simulacao_usada")).toHaveLength(1);
    expect(commands.filter((a) => a[1] === "page_view")).toHaveLength(1);
    expect(commands).toContainEqual(["set", "linker", { domains: ["radarbewild.com.br", "bewild.com.br"] }]);
  });
  it.each(["/admin", "/admin/leads", "/painel", "/projetos", "/projeto/123", "/area-exclusiva", "/area-exclusiva/pinheiros"])("não mede %s mesmo com consentimento", async (path) => {
    const m = await import("@/lib/marketingConsent"); localStorage.setItem(m.CONSENT_KEY, "accepted"); window.history.replaceState({}, "", path); m.syncMeasurement(); m.trackBudgetClick("chat");
    expect(m.canMeasure()).toBe(false); expect(document.querySelectorAll("script").length).toBe(0); expect(window.dataLayer).toEqual([]);
  });
  it("interrompe eventos na passagem de público para privado", async () => {
    const m = await import("@/lib/marketingConsent"); m.saveConsent("accepted"); window.history.replaceState({}, "", "/projeto/123"); m.syncMeasurement(); const count = window.fbq?.queue?.length; m.trackPageView(); m.trackSimulationUsed();
    expect(window["ga-disable-G-CE7GKKDG4L"]).toBe(true); expect(window.fbq?.queue?.length).toBe(count);
  });
  it("orçamento usa domínio e parâmetros oficiais", () => {
    const url = new URL(orcamentoUrl("barra-celular"));
    expect(url.origin + url.pathname).toBe("https://bewild.com.br/orcamento");
    expect(Object.fromEntries(url.searchParams)).toEqual({ utm_source: "radar", utm_medium: "referral", utm_campaign: "radar_bewild", utm_content: "barra-celular" });
  });
});