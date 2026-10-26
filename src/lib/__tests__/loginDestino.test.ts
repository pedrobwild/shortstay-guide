import { describe, expect, it } from "vitest";
import { destinoAposLogin } from "@/lib/loginDestino";
describe("destino após login", () => {
  it("retoma a página pública de posts após login sem conceder escrita", () => {
    expect(destinoAposLogin(true, "/posts#enviar")).toBe("/posts#enviar");
    expect(destinoAposLogin(false, "/posts")).toBe("/posts");
  });
  it("retoma analytics com parâmetros somente para administrador", () => {
    expect(destinoAposLogin(true, "/admin/analytics?dias=7#eventos")).toBe("/admin/analytics?dias=7#eventos");
    expect(destinoAposLogin(false, "/admin/analytics")).toBe("/area-exclusiva");
  });
  it("abre admin para administrador", () => { expect(destinoAposLogin(true)).toBe("/admin"); });
  it("preserva coletas e parâmetros", () => { expect(destinoAposLogin(true, "/admin/coletas?bairro=Mooca#historico")).toBe("/admin/coletas?bairro=Mooca#historico"); });
  it("encaminha usuário comum à área exclusiva", () => { expect(destinoAposLogin(false, "/admin/coletas")).toBe("/area-exclusiva"); expect(destinoAposLogin(false)).toBe("/area-exclusiva"); });
  it("preserva SEO após login somente para admin", () => {
    expect(destinoAposLogin(true, "/admin/seo?bairro=Mooca")).toBe("/admin/seo?bairro=Mooca");
    expect(destinoAposLogin(false, "/admin/seo")).toBe("/area-exclusiva");
  });
  it("recusa destinos externos ou desconhecidos", () => {
    for (const caminho of ["https://bewild.com.br", "//example.com", "/admin/../login", "/admin/falso"]) expect(destinoAposLogin(true, caminho)).toBe("/admin");
  });
  it("preserva Google após login para admin", () => {
    expect(destinoAposLogin(true, "/admin/google")).toBe("/admin/google");
  });
  it("não encaminha usuário comum à tela Google", () => {
    expect(destinoAposLogin(false, "/admin/google")).toBe("/area-exclusiva");
  });
  it("retoma o artigo exclusivo pedido antes do login, para qualquer conta", () => {
    expect(destinoAposLogin(false, "/area-exclusiva/pinheiros")).toBe("/area-exclusiva/pinheiros");
    expect(destinoAposLogin(true, "/area-exclusiva/brooklin#fontes-metodo")).toBe("/area-exclusiva/brooklin#fontes-metodo");
    expect(destinoAposLogin(false, "/area-exclusiva")).toBe("/area-exclusiva");
  });
  it("recusa artigo exclusivo desconhecido", () => {
    expect(destinoAposLogin(false, "/area-exclusiva/falso")).toBe("/area-exclusiva");
    expect(destinoAposLogin(true, "/area-exclusiva/../admin")).toBe("/admin");
  });
  it("mantém painel e projetos para quem vem do simulador", () => {
    expect(destinoAposLogin(false, "/painel")).toBe("/painel");
    expect(destinoAposLogin(false, "/projetos")).toBe("/projetos");
  });
});
