import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { autenticarAdmin, jsonColeta as json, preflightColeta as preflight } from "../_shared/coletaAdmin.ts";

/**
 * Bloquear e desbloquear o acesso de uma conta (/admin/usuarios). Só admins chamam (JWT +
 * has_role, como as demais funções de admin). A API de administração do Auth exige a
 * service role, que fica só aqui no servidor. Dar/tirar admin não passa por aqui: é a RPC
 * admin_definir_admin.
 *
 * Guardas: ninguém se bloqueia; conta admin precisa perder o papel antes (assim o Radar
 * nunca fica sem admin por um bloqueio). Pedido que não muda nada (bloquear quem já está
 * bloqueado) responde mudou:false e não grava auditoria.
 *
 * Ordem: a auditoria é gravada ANTES da mudança e apagada se a mudança falhar — nunca há
 * bloqueio sem registro. Depois de bloquear, o papel é conferido de novo: se alguém deu
 * admin à conta no meio do caminho, o bloqueio é desfeito (409).
 *
 * O bloqueio impede novos logins e a renovação da sessão; uma sessão já aberta termina
 * quando o token atual expira (jwt_expiry do projeto; padrão de 1 hora).
 */
const BLOQUEIO_SEM_PRAZO = "876000h"; // ~100 anos: bloqueio até alguém desbloquear

const pedido = z.object({
  acao: z.enum(["bloquear", "desbloquear"]),
  usuario_id: z.string().uuid(),
  motivo: z.string().trim().max(300).optional(),
}).strict();

const bloqueadoAgora = (u: { banned_until?: string | null } | null | undefined) =>
  !!u?.banned_until && new Date(u.banned_until) > new Date();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  try {
    const acesso = await autenticarAdmin(req);
    if (acesso.resposta) return acesso.resposta;
    if (!acesso.usuario) return json({ error: "Sessão inválida." }, 401);
    const eu = acesso.usuario.id;

    const corpo = pedido.safeParse(await req.json().catch(() => null));
    if (!corpo.success) return json({ error: "Pedido inválido." }, 400);
    const { acao, usuario_id, motivo } = corpo.data;
    const bloquear = acao === "bloquear";
    if (usuario_id === eu) return json({ error: "Você não pode bloquear a sua própria conta." }, 400);

    const url = Deno.env.get("SUPABASE_URL"), service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !service) return json({ error: "Configuração de acesso indisponível." }, 503);
    const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

    const ehAdmin = async () => {
      const { data, error } = await db.from("user_roles").select("id").eq("user_id", usuario_id).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return !!data;
    };

    const { data: alvo, error: alvoErro } = await db.auth.admin.getUserById(usuario_id);
    if (alvoErro || !alvo?.user) return json({ error: "Usuário não encontrado." }, 404);
    const estavaBloqueado = bloqueadoAgora(alvo.user as { banned_until?: string | null });
    if (estavaBloqueado === bloquear) return json({ ok: true, mudou: false, bloqueado_ate: estavaBloqueado ? (alvo.user as { banned_until?: string }).banned_until : null });
    if (bloquear && await ehAdmin()) return json({ error: "Remova o acesso de administrador antes de bloquear esta conta." }, 409);

    // 1) Registro primeiro.
    const { data: registro, error: audErro } = await db.from("admin_usuarios_auditoria")
      .insert({ usuario_id, acao, motivo: motivo || null, feito_por: eu }).select("id").single();
    if (audErro || !registro) throw audErro ?? new Error("auditoria sem id");
    const desfazerRegistro = () => db.from("admin_usuarios_auditoria").delete().eq("id", registro.id);

    // 2) A mudança; se falhar, o registro sai.
    const { data: atualizado, error: updErro } = await db.auth.admin.updateUserById(usuario_id, { ban_duration: bloquear ? BLOQUEIO_SEM_PRAZO : "none" });
    if (updErro) { await desfazerRegistro(); throw updErro; }

    // 3) Corrida com "dar admin": se a conta virou admin entre a checagem e o bloqueio, desfaz.
    if (bloquear && await ehAdmin()) {
      await db.auth.admin.updateUserById(usuario_id, { ban_duration: "none" });
      await desfazerRegistro();
      return json({ error: "A conta recebeu acesso de administrador agora há pouco. Remova o acesso antes de bloquear." }, 409);
    }

    const banido = (atualizado.user as { banned_until?: string | null }).banned_until ?? null;
    return json({ ok: true, mudou: true, bloqueado_ate: banido && new Date(banido) > new Date() ? banido : null });
  } catch (e) {
    console.error("[admin-usuarios]", e instanceof Error ? e.message : String(e));
    return json({ error: "Não foi possível concluir. Tente de novo." }, 500);
  }
});
