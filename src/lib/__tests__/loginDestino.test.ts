import { describe, expect, it } from "vitest";
import { destinoAposLogin } from "@/lib/loginDestino";
describe("destino após login", () => {
  it("abre admin para administrador", () => { expect(destinoAposLogin(true)).toBe("/admin"); });
  it("preserva coletas e parâmetros", () => { expect(destinoAposLogin(true, "/admin/coletas?bairro=Mooca#historico")).toBe("/admin/coletas?bairro=Mooca#historico"); });
  it("encaminha usuário comum ao painel", () => { expect(destinoAposLogin(false, "/admin/coletas")).toBe("/painel"); });
  it("preserva SEO após login somente para admin", () => {
    expect(destinoAposLogin(true, "/admin/seo?bairro=Mooca")).toBe("/admin/seo?bairro=Mooca");
    expect(destinoAposLogin(false, "/admin/seo")).toBe("/painel");
  });
  it("recusa destinos externos ou desconhecidos", () => {
    for (const caminho of ["https://bewild.com.br", "//example.com", "/admin/../login", "/admin/falso"]) expect(destinoAposLogin(true, caminho)).toBe("/admin");
  });
});
