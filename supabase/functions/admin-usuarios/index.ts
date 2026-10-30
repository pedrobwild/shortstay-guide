import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { filtrarContas, montarConta, paginar, resumirContas, type ContaRadar, type ProjetoConta, type UsuarioAuth } from "./lista.ts";

/**
 * Cadastro de usuários do Radar. Só admins (JWT + has_role no servidor).
 * Ações: listar (com busca, tipo e resumo), exportar (todas as contas do filtro, para CSV),
 * convidar (e-mail com link para criar senha), mudar papel.
 * Dados de cadastro: nome, e-mail, como a conta foi criada, datas e os projetos criados
 * a partir do simulador. A senha nunca sai do Supabase Auth.
 */
const Filtro = { tipo: z.enum(["todos", "clientes", "admins"]).default("todos"), busca: z.string().trim().max(120).default("") };
const Corpo = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("listar"), pagina: z.number().int().min(1).max(500).default(1), ...Filtro }),
  z.object({ acao: z.literal("exportar"), ...Filtro }),
  z.object({ acao: z.literal("convidar"), email: z.string().trim().toLowerCase().email().max(255), nome: z.string().trim().max(120).default(""), papel: z.enum(["admin", "user"]), redirectTo: z.string().url().max(500) }),
  z.object({ acao: z.literal("papel"), userId: z.string().uuid(), admin: z.boolean() }),
]);

// Cliente com service role; sem os tipos gerados do banco aqui (as consultas usam só colunas conhecidas).
type Db = ReturnType<typeof createClient>;

async function darPapel(db: Db, userId: string, role: "admin" | "user") {
  const { data } = await db.from("user_roles").select("id").eq("user_id", userId).eq("role", role).maybeSingle();
  if (data) return;
  const { error } = await db.from("user_roles").insert({ user_id: userId, role });
  if (error) throw error;
}

const NENHUM = ["00000000-0000-0000-0000-000000000000"];
const LIMITE_CONTAS = 20000;

/** Todas as contas do Auth (páginas de 1.000), com nome do perfil e papel de admin. */
async function todasAsContas(db: Db): Promise<ContaRadar[]> {
  const usuarios: UsuarioAuth[] = [];
  for (let page = 1; usuarios.length < LIMITE_CONTAS; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    usuarios.push(...(data.users as UsuarioAuth[]));
    if (data.users.length < 1000) break;
  }
  const [admins, perfis] = await Promise.all([
    db.from("user_roles").select("user_id").eq("role", "admin"),
    lerEmLotes<{ id: string; full_name: string | null }>(db, "profiles", "id,full_name", "id", usuarios.map((u) => u.id)),
  ]);
  if (admins.error) throw admins.error;
  const ehAdmin = new Set((admins.data ?? []).map((r: { user_id: string }) => r.user_id));
  const nome = new Map(perfis.map((p) => [p.id, p.full_name]));
  return usuarios.map((u) => montarConta(u, nome.get(u.id), ehAdmin.has(u.id)));
}

/** Leitura com .in() em lotes de 200 ids (limite de URL do PostgREST). */
async function lerEmLotes<T>(db: Db, tabela: string, colunas: string, coluna: string, ids: string[]): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const lote = ids.slice(i, i + 200);
    const { data, error } = await db.from(tabela).select(colunas).in(coluna, lote.length ? lote : NENHUM);
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
  }
  return out;
}

/** Projetos de cada conta (nome, bairro e área do simulador), do mais recente ao mais antigo. */
async function comProjetos(db: Db, contas: ContaRadar[]): Promise<ContaRadar[]> {
  const projetos = await lerEmLotes<{ id: string; user_id: string; name: string; created_at: string }>(db, "projects", "id,user_id,name,created_at", "user_id", contas.map((c) => c.id));
  const premissas = await lerEmLotes<{ project_id: string; neighborhood: string | null; area_sqm: string | null }>(db, "project_assumptions", "project_id,neighborhood,area_sqm", "project_id", projetos.map((p) => p.id));
  const porProjeto = new Map(premissas.map((p) => [p.project_id, p]));
  const porConta = new Map<string, ProjetoConta[]>();
  for (const p of [...projetos].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    const a = porProjeto.get(p.id);
    const lista = porConta.get(p.user_id) ?? [];
    lista.push({ nome: p.name, bairro: a?.neighborhood ?? null, area: a?.area_sqm ?? null, criado_em: p.created_at });
    porConta.set(p.user_id, lista);
  }
  return contas.map((c) => ({ ...c, projetos: porConta.get(c.id) ?? [] }));
}

const json = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return json({ error: "Faça login como administrador." }, 401);
    const comoUsuario = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await comoUsuario.auth.getUser();
    if (!u?.user) return json({ error: "Faça login como administrador." }, 401);
    const { data: ehAdmin } = await comoUsuario.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!ehAdmin) return json({ error: "Acesso exclusivo de administrador." }, 403);

    const parsed = Corpo.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Dados inválidos.", detalhes: parsed.error.flatten().fieldErrors }, 400);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const c = parsed.data;

    if (c.acao === "listar" || c.acao === "exportar") {
      const todas = await todasAsContas(admin);
      const filtradas = filtrarContas(todas, c.tipo, c.busca);
      if (c.acao === "exportar") return json({ usuarios: await comProjetos(admin, filtradas) });
      const { itens, temMais } = paginar(filtradas, c.pagina);
      return json({ usuarios: await comProjetos(admin, itens), temMais, encontrados: filtradas.length, resumo: resumirContas(todas, new Date()) });
    }

    if (c.acao === "convidar") {
      // Só domínios aprovados do Radar; qualquer outro cai no endereço oficial.
      const APROVADOS = ["https://radarbewild.com.br", "https://www.radarbewild.com.br", "https://radarbewild.lovable.app", "https://id-preview--7345659b-a580-46ed-a5b8-f36438b36031.lovable.app"];
      let origem = "https://radarbewild.com.br";
      try { const o = new URL(c.redirectTo).origin; if (APROVADOS.includes(o)) origem = o; } catch (_) { /* usa padrão */ }
      const { data, error } = await admin.auth.admin.inviteUserByEmail(c.email, { data: { full_name: c.nome }, redirectTo: `${origem}/reset-password` });
      if (error) return json({ error: /already|registered|exists/i.test(error.message) ? "Este e-mail já tem conta." : "Não foi possível enviar o convite." }, 400);
      await darPapel(admin, data.user.id, "user");
      if (c.papel === "admin") await darPapel(admin, data.user.id, "admin");
      return json({ ok: true });
    }

    if (c.userId === u.user.id && !c.admin) return json({ error: "Você não pode tirar o seu próprio acesso de administrador." }, 400);
    if (c.admin) {
      await darPapel(admin, c.userId, "admin");
    } else {
      const { error } = await admin.from("user_roles").delete().eq("user_id", c.userId).eq("role", "admin");
      if (error) throw error;
    }
    return json({ ok: true });
  } catch (_e) {
    return json({ error: "Erro inesperado. Tente novamente." }, 500);
  }
});
