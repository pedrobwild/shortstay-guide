import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { contasCsv, descricaoProjeto, filtrarContas, montarConta, paginar, resumirContas, type UsuarioAuth } from "@/lib/usuariosAdmin";

const base = (over: Partial<UsuarioAuth>): UsuarioAuth => ({ id: "u1", email: "a@x.com", created_at: "2026-10-20T12:00:00Z", ...over });

describe("contas do admin", () => {
  it("a Edge Function usa uma cópia idêntica do módulo", () => {
    expect(readFileSync("supabase/functions/admin-usuarios/lista.ts", "utf8")).toBe(readFileSync("src/lib/usuariosAdmin.ts", "utf8"));
  });

  it("monta a conta: nome do perfil prevalece, origem por convite ou cadastro", () => {
    const cadastro = montarConta(base({ user_metadata: { full_name: "Maria Silva", origem_cadastro: "area-exclusiva" }, email_confirmed_at: "2026-10-20T12:05:00Z" }), "", false);
    expect(cadastro).toMatchObject({ nome: "Maria Silva", origem: "cadastro", origem_cadastro: "area-exclusiva", confirmado: true });
    const convite = montarConta(base({ invited_at: "2026-10-19T10:00:00Z" }), "Perfil", true);
    expect(convite).toMatchObject({ nome: "Perfil", origem: "convite", origem_cadastro: null, confirmado: false, admin: true });
  });

  it("filtra por tipo e busca sem acento, do mais recente ao mais antigo", () => {
    const contas = [
      montarConta(base({ id: "1", email: "joao@x.com", created_at: "2026-10-01T00:00:00Z" }), "João", false),
      montarConta(base({ id: "2", email: "ana@y.com", created_at: "2026-10-25T00:00:00Z" }), "Ana", false),
      montarConta(base({ id: "3", email: "admin@bewild.com.br", created_at: "2026-10-10T00:00:00Z" }), "Admin", true),
    ];
    expect(filtrarContas(contas, "todos").map((c) => c.id)).toEqual(["2", "3", "1"]);
    expect(filtrarContas(contas, "clientes").map((c) => c.id)).toEqual(["2", "1"]);
    expect(filtrarContas(contas, "admins").map((c) => c.id)).toEqual(["3"]);
    expect(filtrarContas(contas, "todos", "JOAO").map((c) => c.id)).toEqual(["1"]);
    expect(filtrarContas(contas, "todos", "@y.com").map((c) => c.id)).toEqual(["2"]);
    expect(resumirContas(contas, new Date("2026-10-26T12:00:00Z"))).toEqual({ total: 3, clientes: 2, admins: 1, ultimos7dias: 1 });
  });

  it("pagina em blocos de 50", () => {
    const itens = Array.from({ length: 120 }, (_, i) => i);
    expect(paginar(itens, 1)).toMatchObject({ temMais: true });
    expect(paginar(itens, 3).itens).toEqual([100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119]);
    expect(paginar(itens, 3).temMais).toBe(false);
  });

  it("CSV em pt-BR com ponto e vírgula, BOM e células perigosas neutralizadas", () => {
    const c = montarConta(base({ user_metadata: { full_name: "=HYPERLINK(1)", origem_cadastro: "simulador" } }), "", false, [{ nome: "Studio; teste", bairro: "Pinheiros", area: "27", criado_em: "2026-10-20T12:00:00Z" }]);
    const csv = contasCsv([c]);
    expect(csv.startsWith("﻿Nome;E-mail;Acesso")).toBe(true);
    expect(csv).toContain("'=HYPERLINK(1)");
    expect(csv).toContain("Cadastro no site;Simulador;20/10/2026");
    expect(csv).toContain('"Studio; teste · Pinheiros · 27 m²"');
    expect(descricaoProjeto({ nome: "X", bairro: null, area: "26–35 m²", criado_em: "" })).toBe("X · 26–35 m²");
  });
});
