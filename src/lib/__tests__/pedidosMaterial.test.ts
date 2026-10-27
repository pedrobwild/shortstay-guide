import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockInsert, mockFrom } = vi.hoisted(() => {
  const mockInsert = vi.fn();
  const mockFrom = vi.fn(() => ({ insert: mockInsert }));
  return { mockInsert, mockFrom };
});

vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mockFrom } }));

import {
  CONSENTIMENTO_MATERIAL_VERSAO,
  MATERIAIS,
  TEXTO_CONSENTIMENTO_MATERIAL,
  emailValido,
  enviarMaterial,
  montarPedido,
  registrarPedido,
} from "@/lib/pedidosMaterial";

const r = montarPedido(
  { email: "pedro@bewild.com.br", material: "checklist_compra", etapa: null, bairro: null, boletim: true, origem: "bairro" },
  null,
);

beforeEach(() => {
  mockInsert.mockReset();
  mockFrom.mockClear();
});

describe("pedido de material", () => {
  it("valida e-mail", () => {
    expect(emailValido(" pedro@bewild.com.br ")).toBe(true);
    expect(emailValido("pedro@")).toBe(false);
    expect(emailValido("sem-arroba")).toBe(false);
    expect(emailValido("a@@b.com")).toBe(false);
    expect(emailValido("pedro@bewild")).toBe(false);
    expect(emailValido("pe dro@bewild.com")).toBe(false);
    expect(emailValido(`${"a".repeat(250)}@b.com`)).toBe(false);
  });

  it("monta o pedido normalizado, com a versão do consentimento e sem campos extras", () => {
    const r = montarPedido({ email: " Pedro@X.com ", nome: "  ", material: "checklist_compra", etapa: "procurando", bairro: "Mooca", boletim: false, origem: "guia" }, "s1");
    expect(r).toEqual({ email: "Pedro@X.com", nome: null, material: "checklist_compra", etapa: "procurando", bairro: "Mooca", boletim: false, consentimento_versao: "2026-10-27", origem: "guia", sessao: "s1" });
  });

  it("nome e bairro são aparados e limitados a 80 caracteres; ausentes viram nulo", () => {
    const p = montarPedido({ email: "a@b.co", nome: "  Ana   Maria ", material: "checklist_compra", boletim: true, origem: "comparar" }, null);
    expect(p.nome).toBe("Ana Maria");
    expect(p.etapa).toBeNull();
    expect(p.bairro).toBeNull();
    expect(p.sessao).toBeNull();
    expect(p.consentimento_versao).toBe(CONSENTIMENTO_MATERIAL_VERSAO);
    const longo = montarPedido({ email: "a@b.co", nome: "x".repeat(120), material: "checklist_compra", bairro: "y".repeat(120), boletim: false, origem: "guia" }, null);
    expect(longo.nome).toHaveLength(80);
    expect(longo.bairro).toHaveLength(80);
  });

  it("grava em radar_pedidos_material e devolve ok", async () => {
    mockInsert.mockResolvedValueOnce({ error: null });
    expect(await registrarPedido(r)).toBe("ok");
    expect(mockFrom).toHaveBeenCalledWith("radar_pedidos_material");
    expect(mockInsert).toHaveBeenCalledWith(r);
  });

  it("pedido repetido do mesmo e-mail conta como entregue", async () => {
    mockInsert.mockResolvedValueOnce({ error: { code: "23505" } });
    expect(await registrarPedido(r)).toBe("duplicado");
  });

  it("outro erro (ou exceção) vira erro, sem expor o e-mail no log", async () => {
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockInsert.mockResolvedValueOnce({ error: { code: "42501", message: "permission denied" } });
    expect(await registrarPedido(r)).toBe("erro");
    mockInsert.mockRejectedValueOnce(new Error("rede"));
    expect(await registrarPedido(r)).toBe("erro");
    expect(JSON.stringify(aviso.mock.calls)).not.toContain("pedro@bewild.com.br");
    aviso.mockRestore();
  });

  it("enviarMaterial ainda não envia nada (sem provedor de e-mail) e resolve", async () => {
    await expect(enviarMaterial(r)).resolves.toBeUndefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("o checklist é entregue na tela, em /guia/checklist", () => {
    expect(MATERIAIS.checklist_compra.caminho).toBe("/guia/checklist");
  });

  it("o texto do consentimento não promete prazo nem diagnóstico", () => {
    expect(TEXTO_CONSENTIMENTO_MATERIAL).not.toMatch(/24 horas|diagnóstico gratuito/i);
    expect(TEXTO_CONSENTIMENTO_MATERIAL).toContain("bewild.com.br/privacidade");
  });
});
