import { describe, it, expect } from "vitest";
import { chaveExternaValida } from "../../../supabase/functions/coletar-guestfavorites/authExterna";
describe("autenticação do agendador externo", () => {
  it("nega chamadas sem chave configurada", async () => { expect(await chaveExternaValida("teste", undefined)).toBe(false); });
  it("nega chave ausente ou incorreta", async () => { expect(await chaveExternaValida(null, "teste")).toBe(false); expect(await chaveExternaValida("outra", "teste")).toBe(false); });
  it("aceita somente a chave exata", async () => { expect(await chaveExternaValida("teste", "teste")).toBe(true); });
});