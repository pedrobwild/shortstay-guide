import { describe, expect, it } from "vitest";
import { imovelSchema } from "@/lib/imoveisRadar";

const base = { titulo: "Studio Pinheiros", descricao: "", bairro: "Pinheiros", foto_url: "https://img.exemplo.com/a.jpg", anuncio_url: "https://www.airbnb.com.br/rooms/1", publicado: true };
describe("imovelSchema", () => {
  it("aceita imóvel com foto e anúncio em https", () => expect(imovelSchema.safeParse(base).success).toBe(true));
  it("recusa link de anúncio sem https", () => expect(imovelSchema.safeParse({ ...base, anuncio_url: "http://x.com" }).success).toBe(false));
  it("recusa foto sem https", () => expect(imovelSchema.safeParse({ ...base, foto_url: "javascript:alert(1)" }).success).toBe(false));
});
