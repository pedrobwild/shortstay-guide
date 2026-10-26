import { describe, expect, it } from "vitest";
import { noticiaSchema } from "@/lib/noticiasRadar";
import { destinoAposLogin } from "@/lib/loginDestino";
const entrada = { titulo: "Como avaliar um studio", resumo: "", url: "https://bewild.com.br/conteudos/como-avaliar-studio-antes-de-comprar", destino: "/ranking", status: "rascunho" };
describe("notícias por links do Bewild", () => {
  it("aceita artigos do Bewild", () => { expect(noticiaSchema.safeParse(entrada).success).toBe(true); });
  it("recusa outros sites e endereços disfarçados", () => {
    for (const url of ["https://example.com/artigo", "https://bewild.com.br.evil.com/conteudos/artigo", "javascript:alert(1)", "https://bewild.com.br@evil.com/conteudos/artigo"]) expect(noticiaSchema.safeParse({ ...entrada, url }).success).toBe(false);
  });
  it("não aceita UTM em links editoriais", () => { expect(noticiaSchema.safeParse({ ...entrada, url: entrada.url + "?utm_source=radar" }).success).toBe(false); });
  it("associa somente a páginas existentes do Radar", () => { expect(noticiaSchema.safeParse({ ...entrada, destino: "/bairro/inventado" }).success).toBe(false); });
  it("permite retomar Notícias somente como admin", () => {
    expect(destinoAposLogin(true, "/admin/noticias")).toBe("/admin/noticias");
    expect(destinoAposLogin(false, "/admin/noticias")).toBe("/area-exclusiva");
  });
});