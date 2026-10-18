import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  FILTROS_USUARIOS, dataBR, dataHoraBR, nomeExibicao, normalizarResumo, normalizarUsuario, podeAlterarAdmin, podeBloquear, situacaoUsuario,
} from "@/lib/adminUsuarios";

const agora = new Date("2026-10-18T08:00:00Z");
const base = { id: "u1", admin: false, bloqueado_ate: null as string | null, email_confirmado: true, ultimo_acesso: "2026-10-17T12:00:00Z" };

describe("gestão de usuários: regras da tela (espelho das guardas do servidor)", () => {
  it("situação: bloqueio > e-mail não confirmado > sem acesso há 30 dias > ativo", () => {
    expect(situacaoUsuario({ ...base, bloqueado_ate: "2126-01-01T00:00:00Z", email_confirmado: false }, agora)).toBe("bloqueado");
    expect(situacaoUsuario({ ...base, bloqueado_ate: "2026-01-01T00:00:00Z" }, agora)).toBe("ativo"); // bloqueio vencido
    expect(situacaoUsuario({ ...base, email_confirmado: false }, agora)).toBe("nao_confirmado");
    expect(situacaoUsuario({ ...base, ultimo_acesso: null }, agora)).toBe("inativo");
    expect(situacaoUsuario({ ...base, ultimo_acesso: "2026-09-10T00:00:00Z" }, agora)).toBe("inativo");
    expect(situacaoUsuario(base, agora)).toBe("ativo");
  });

  it("admin: ninguém tira o próprio acesso, o último admin fica, conta bloqueada não vira admin", () => {
    expect(podeAlterarAdmin({ ...base, admin: true }, "u1", 3)).toEqual({ pode: false, motivo: expect.stringContaining("próprio acesso") });
    expect(podeAlterarAdmin({ ...base, admin: true }, "eu", 1)).toEqual({ pode: false, motivo: expect.stringContaining("pelo menos um") });
    expect(podeAlterarAdmin({ ...base, admin: true }, "eu", 2)).toEqual({ pode: true });
    expect(podeAlterarAdmin({ ...base, bloqueado_ate: "2126-01-01T00:00:00Z" }, "eu", 2, agora)).toEqual({ pode: false, motivo: expect.stringContaining("Desbloqueie") });
    expect(podeAlterarAdmin(base, "eu", 1, agora)).toEqual({ pode: true });
    // Resumo ainda carregando ou com erro: não trava o botão; quem decide é o servidor.
    expect(podeAlterarAdmin({ ...base, admin: true }, "eu", undefined)).toEqual({ pode: true });
  });

  it("bloqueio: não se bloqueia, admin precisa perder o papel antes, desbloquear sempre pode", () => {
    expect(podeBloquear(base, "u1", agora)).toEqual({ pode: false, motivo: expect.stringContaining("própria conta") });
    expect(podeBloquear({ ...base, admin: true }, "eu", agora)).toEqual({ pode: false, motivo: expect.stringContaining("Remova o acesso") });
    expect(podeBloquear(base, "eu", agora)).toEqual({ pode: true });
    expect(podeBloquear({ ...base, bloqueado_ate: "2126-01-01T00:00:00Z" }, "u1", agora)).toEqual({ pode: true });
  });

  it("nome de exibição usa o perfil e cai para o e-mail", () => {
    expect(nomeExibicao({ nome: "  Ana  ", email: "a@x.com" })).toBe("Ana");
    expect(nomeExibicao({ nome: "", email: "carla.souza@x.com" })).toBe("carla.souza");
    expect(nomeExibicao({ nome: null, email: null })).toBe("Sem nome");
  });

  it("normaliza bigint em texto vindo do PostgREST", () => {
    const u = normalizarUsuario({ id: "x", email: "a@x.com", nome: null, criado_em: "2026-10-01T00:00:00Z", email_confirmado: true, admin: false, projetos: 2, total: "57" });
    expect(u.total).toBe(57);
    expect(u.projetos).toBe(2);
    expect(u.bloqueado_ate).toBeNull();
    expect(normalizarResumo({ total: "10", admins: "2" })).toMatchObject({ total: 10, admins: 2, bloqueados: 0 });
    expect(normalizarResumo(undefined).total).toBe(0);
  });

  it("datas em pt-BR (dd/mm/aaaa) no fuso de São Paulo", () => {
    expect(dataBR("2026-10-18T02:30:00Z")).toBe("17/10/2026");
    expect(dataHoraBR("2026-10-18T08:20:00Z")).toBe("18/10/2026, 05:20");
  });
});

describe("gestão de usuários: banco, função e rota", () => {
  const sql = readFileSync("supabase/migrations/20261018090000_admin_gestao_usuarios.sql", "utf8");
  const funcao = readFileSync("supabase/functions/admin-usuarios/index.ts", "utf8");

  it("tabela nova segue GRANT → RLS → POLICY, nessa ordem, sem policy de escrita", () => {
    const g = sql.indexOf("GRANT SELECT ON public.admin_usuarios_auditoria TO authenticated");
    const r = sql.indexOf("ALTER TABLE public.admin_usuarios_auditoria ENABLE ROW LEVEL SECURITY");
    const p = sql.indexOf("CREATE POLICY \"Admins leem a auditoria de usuários\"");
    expect(g).toBeGreaterThan(-1);
    expect(r).toBeGreaterThan(g);
    expect(p).toBeGreaterThan(r);
    expect(sql).not.toMatch(/admin_usuarios_auditoria\s+FOR\s+(INSERT|UPDATE|DELETE|ALL)/i);
    expect(sql).not.toMatch(/REFERENCES auth\.users/);
  });

  it("a policy antiga FOR ALL em user_roles sai: papel de admin só muda pela RPC auditada", () => {
    expect(sql).toContain('DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;');
    expect(sql).toMatch(/CREATE POLICY "Admins leem todos os papéis"\s+ON public\.user_roles FOR SELECT/);
    expect(sql).toContain("REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.admin_usuarios_auditoria FROM anon, authenticated;");
    // Contas excluídas (soft delete) e anônimas não entram na lista nem no resumo.
    expect(sql.match(/u\.deleted_at IS NULL AND NOT coalesce\(u\.is_anonymous, false\)/g)).toHaveLength(2);
    // O estado de bloqueio é lido depois do lock.
    expect(sql.indexOf("pg_advisory_xact_lock")).toBeLessThan(sql.indexOf("INTO v_bloqueado"));
  });

  it("toda função SECURITY DEFINER fixa o search_path, checa has_role admin e não é executável por anon", () => {
    const funcoes = [...sql.matchAll(/CREATE OR REPLACE FUNCTION public\.(\w+)\(([\s\S]*?)\$\$;/g)];
    expect(funcoes.map((f) => f[1])).toEqual(["admin_listar_usuarios", "admin_resumo_usuarios", "admin_definir_admin"]);
    for (const [corpo, nome] of funcoes.map((f) => [f[0], f[1]] as const)) {
      expect(corpo, nome).toContain("SECURITY DEFINER");
      expect(corpo, nome).toContain("SET search_path = public");
      expect(corpo, nome).toMatch(/IF NOT public\.has_role\((auth\.uid\(\)|v_eu), 'admin'::public\.app_role\) THEN\s+RAISE EXCEPTION/);
      expect(sql, nome).toMatch(new RegExp(`REVOKE ALL ON FUNCTION public\\.${nome}\\([^)]*\\) FROM PUBLIC, anon;`));
    }
  });

  it("a lista nunca expõe senha, token ou metadados brutos do Auth", () => {
    const retorno = sql.slice(sql.indexOf("RETURNS TABLE ("), sql.indexOf("LANGUAGE plpgsql"));
    expect(retorno).not.toMatch(/password|token|raw_user_meta_data|raw_app_meta_data|phone/);
  });

  it("os filtros da tela são exatamente os aceitos pela RPC", () => {
    const aceitos = sql.match(/p_filtro NOT IN \(([^)]+)\)/)![1].split(",").map((s) => s.trim().replace(/'/g, ""));
    expect(FILTROS_USUARIOS.map((f) => f.id)).toEqual(aceitos);
  });

  it("Edge Function: valida admin antes de tudo, service role só no servidor e guardas de bloqueio", () => {
    expect(funcao.indexOf("autenticarAdmin(req)")).toBeLessThan(funcao.indexOf("SUPABASE_SERVICE_ROLE_KEY"));
    expect(funcao).toContain("usuario_id === eu");
    expect(funcao).toContain("Remova o acesso de administrador antes de bloquear");
    expect(funcao).toContain("admin_usuarios_auditoria");
    // Auditoria antes da mudança; conferência do papel depois do bloqueio.
    const insere = funcao.indexOf('.from("admin_usuarios_auditoria")\n      .insert');
    const muda = funcao.indexOf("ban_duration: bloquear");
    expect(insere).toBeGreaterThan(-1);
    expect(insere).toBeLessThan(muda);
    expect(funcao.indexOf("if (bloquear && await ehAdmin())", muda)).toBeGreaterThan(muda);
    expect(funcao).toContain("mudou: false");
    for (const f of [readFileSync("src/lib/adminUsuarios.ts", "utf8"), readFileSync("src/pages/AdminUsuarios.tsx", "utf8")]) expect(f).not.toMatch(/service_role|SERVICE_ROLE/i);
  });

  it("rota protegida por AdminRoute e aba no admin", () => {
    expect(readFileSync("src/App.tsx", "utf8")).toContain('<Route path="/admin/usuarios" element={<AdminRoute><AdminUsuarios /></AdminRoute>} />');
    const abas = readFileSync("src/components/admin/AdminTabs.tsx", "utf8");
    const rotas = readFileSync("src/App.tsx", "utf8");
    for (const m of abas.matchAll(/to: "([^"]+)"/g)) expect(rotas, m[1]).toContain(`path="${m[1]}"`);
  });
});
