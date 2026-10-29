import { describe, it, expect } from "vitest";
import { classificarOrigem, contasNoPeriodo } from "@/lib/analyticsAcessos";

describe("origens das visitas", () => {
  it("sem endereço de origem é acesso direto", () => expect(classificarOrigem("")).toBe("Acesso direto"));
  it("Google vira Google", () => expect(classificarOrigem("https://www.google.com.br/")).toBe("Google"));
  it("prévia do editor é da equipe e não mostra o link", () => expect(classificarOrigem("https://x.lovableproject.com/?__lovable_token=abc")).toBe("Prévia de edição (equipe)"));
});
describe("contas no período", () => {
  it("conta só as criadas na janela e separa admins", () => {
    const agora = new Date("2026-10-29T12:00:00Z");
    const r = contasNoPeriodo([{ criado_em: "2026-10-28T00:00:00Z", admin: false }, { criado_em: "2026-10-27T00:00:00Z", admin: true }, { criado_em: "2026-01-01T00:00:00Z", admin: false }], 7, agora);
    expect(r).toEqual({ total: 3, novas: 2, novosClientes: 1 });
  });
});
