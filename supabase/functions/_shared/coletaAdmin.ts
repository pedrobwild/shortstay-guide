import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

export const jsonColeta = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
export const preflightColeta = () => new Response("ok", { headers: corsHeaders });
export async function autenticarAdmin(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return { resposta: jsonColeta({ error: "Faça login como administrador." }, 401) };
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) return { resposta: jsonColeta({ error: "Configuração de acesso indisponível." }, 503) };
  const db = createClient(url, key, { global: { headers: { Authorization: auth } } });
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return { resposta: jsonColeta({ error: "Sessão inválida." }, 401) };
  const { data: admin, error: roleError } = await db.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
  if (roleError || admin !== true) return { resposta: jsonColeta({ error: "Acesso exclusivo de administrador." }, 403) };
  return { db };
}
const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => {
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}, "Data inválida.");
export const pedidoComparacao = z.object({
  bairro: z.string().trim().min(2).max(100),
  periodo_inicio: data,
  periodo_fim: data,
}).strict().superRefine((v, ctx) => {
  const fim = new Date(`${v.periodo_fim}T00:00:00Z`);
  const hoje = new Date().toISOString().slice(0, 10);
  if (v.periodo_inicio > v.periodo_fim || v.periodo_fim > hoje || !v.periodo_inicio.endsWith("-01") || new Date(fim.getTime() + 86400000).getUTCDate() !== 1 || v.periodo_fim.slice(0, 7) >= hoje.slice(0, 7)) ctx.addIssue({ code: "custom", message: "Informe meses completos e encerrados, em ordem cronológica." });
  const inicio = new Date(`${v.periodo_inicio}T00:00:00Z`);
  const meses = (fim.getUTCFullYear() - inicio.getUTCFullYear()) * 12 + fim.getUTCMonth() - inicio.getUTCMonth() + 1;
  const idade = (new Date().getUTCFullYear() - inicio.getUTCFullYear()) * 12 + new Date().getUTCMonth() - inicio.getUTCMonth();
  if (meses > 60 || idade >= 60) ctx.addIssue({ code: "custom", message: "A consulta AirDNA cobre no máximo os últimos 60 meses." });
});