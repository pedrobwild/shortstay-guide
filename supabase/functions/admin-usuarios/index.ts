import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

/**
 * Cadastro de usuários do Radar. Só admins (JWT + has_role no servidor).
 * Ações: listar, convidar (e-mail com link para criar senha), mudar papel.
 */
const Corpo = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("listar"), pagina: z.number().int().min(1).max(500).default(1) }),
  z.object({ acao: z.literal("convidar"), email: z.string().trim().toLowerCase().email().max(255), nome: z.string().trim().max(120).default(""), papel: z.enum(["admin", "user"]), redirectTo: z.string().url().max(500) }),
  z.object({ acao: z.literal("papel"), userId: z.string().uuid(), admin: z.boolean() }),
]);

async function darPapel(db: ReturnType<typeof createClient>, userId: string, role: "admin" | "user") {
  const { data } = await db.from("user_roles").select("id").eq("user_id", userId).eq("role", role).maybeSingle();
  if (data) return;
  const { error } = await db.from("user_roles").insert({ user_id: userId, role });
  if (error) throw error;
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

    if (c.acao === "listar") {
      const { data, error } = await admin.auth.admin.listUsers({ page: c.pagina, perPage: 50 });
      if (error) throw error;
      const ids = data.users.map((x) => x.id);
      const [{ data: papeis }, { data: perfis }] = await Promise.all([
        admin.from("user_roles").select("user_id,role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        admin.from("profiles").select("id,full_name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      ]);
      return json({
        usuarios: data.users.map((x) => ({
          id: x.id, email: x.email, nome: perfis?.find((p) => p.id === x.id)?.full_name ?? "",
          admin: !!papeis?.some((p) => p.user_id === x.id && p.role === "admin"),
          criado_em: x.created_at, ultimo_acesso: x.last_sign_in_at, confirmado: !!x.email_confirmed_at,
        })),
        temMais: data.users.length === 50,
      });
    }

    if (c.acao === "convidar") {
      const destino = new URL(c.redirectTo);
      const { data, error } = await admin.auth.admin.inviteUserByEmail(c.email, { data: { full_name: c.nome }, redirectTo: `${destino.origin}/reset-password` });
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
