import { describe, expect, it } from "vitest";
import { destinoAposLogin } from "@/lib/loginDestino";
describe("destino após login", () => {
  it("abre admin para administrador", () => { expect(destinoAposLogin(true)).toBe("/admin"); });
  it("preserva coletas e parâmetros", () => { expect(destinoAposLogin(true, "/admin/coletas?bairro=Mooca#historico")).toBe("/admin/coletas?bairro=Mooca#historico"); });
  it("abre a gestão de usuários para administrador", () => { expect(destinoAposLogin(true, "/admin/usuarios")).toBe("/admin/usuarios"); expect(destinoAposLogin(false, "/admin/usuarios")).toBe("/painel"); });
  it("encaminha usuário comum ao painel", () => { expect(destinoAposLogin(false, "/admin/coletas")).toBe("/painel"); });
  it("recusa destinos externos ou desconhecidos", () => {
    for (const caminho of ["https://bewild.com.br", "//example.com", "/admin/../login", "/admin/falso"]) expect(destinoAposLogin(true, caminho)).toBe("/admin");
  });
});
