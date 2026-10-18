import { supabase } from "@/integrations/supabase/client";

/**
 * Gestão de usuários cadastrados (/admin/usuarios). A lista e o resumo vêm das RPCs
 * admin_listar_usuarios / admin_resumo_usuarios (só admin; e-mail e datas de auth.users);
 * dar/tirar admin é a RPC admin_definir_admin (guardas no banco); bloquear/desbloquear é a
 * Edge Function admin-usuarios (API de administração do Auth). Tudo auditado em
 * admin_usuarios_auditoria. As regras abaixo espelham as guardas do servidor só para a
 * tela explicar antes do clique — quem decide é sempre o banco/a função.
 *
 * As RPCs e a tabela ainda não estão em types.ts (arquivo gerado); o cliente é usado de
 * forma solta, como em coletasPendentes.ts, até a próxima geração dos tipos.
 */
export const FILTROS_USUARIOS = [
  { id: "todos", rotulo: "Todos" },
  { id: "admins", rotulo: "Administradores" },
  { id: "bloqueados", rotulo: "Bloqueados" },
  { id: "nao_confirmados", rotulo: "E-mail não confirmado" },
  { id: "inativos", rotulo: "Sem acesso há 30 dias" },
] as const;
export type FiltroUsuarios = (typeof FILTROS_USUARIOS)[number]["id"];

export const POR_PAGINA = 50;
export const DIAS_INATIVO = 30;

export type UsuarioAdmin = {
  id: string;
  email: string | null;
  nome: string | null;
  criado_em: string;
  ultimo_acesso: string | null;
  email_confirmado: boolean;
  bloqueado_ate: string | null;
  admin: boolean;
  projetos: number;
  lead_bairro: string | null;
  lead_criado_em: string | null;
  total: number;
};

export type ResumoUsuarios = {
  total: number;
  admins: number;
  bloqueados: number;
  nao_confirmados: number;
  novos_7d: number;
  ativos_30d: number;
};

export type AcaoAuditoria = "promover_admin" | "remover_admin" | "bloquear" | "desbloquear";
export type RegistroAuditoria = { id: string; acao: AcaoAuditoria; motivo: string | null; feito_por: string; feito_em: string };

export const ROTULO_ACAO: Record<AcaoAuditoria, string> = {
  promover_admin: "Recebeu acesso de administrador",
  remover_admin: "Perdeu o acesso de administrador",
  bloquear: "Conta bloqueada",
  desbloquear: "Conta desbloqueada",
};

export type SituacaoUsuario = "bloqueado" | "nao_confirmado" | "inativo" | "ativo";

export const ROTULO_SITUACAO: Record<SituacaoUsuario, string> = {
  bloqueado: "Bloqueado",
  nao_confirmado: "E-mail não confirmado",
  inativo: "Sem acesso recente",
  ativo: "Ativo",
};

/** Situação mostrada na lista: bloqueio pesa mais que e-mail, que pesa mais que inatividade. */
export function situacaoUsuario(u: Pick<UsuarioAdmin, "bloqueado_ate" | "email_confirmado" | "ultimo_acesso">, agora = new Date()): SituacaoUsuario {
  if (u.bloqueado_ate && new Date(u.bloqueado_ate) > agora) return "bloqueado";
  if (!u.email_confirmado) return "nao_confirmado";
  if (!u.ultimo_acesso || agora.getTime() - new Date(u.ultimo_acesso).getTime() > DIAS_INATIVO * 86_400_000) return "inativo";
  return "ativo";
}

export type Permissao = { pode: true } | { pode: false; motivo: string };

/**
 * Espelho das guardas de admin_definir_admin, para a tela explicar antes do clique.
 * totalAdmins indefinido (resumo carregando ou com erro): não trava — o servidor decide.
 */
export function podeAlterarAdmin(u: Pick<UsuarioAdmin, "id" | "admin" | "bloqueado_ate">, meuId: string | undefined, totalAdmins: number | undefined, agora = new Date()): Permissao {
  if (u.admin) {
    if (u.id === meuId) return { pode: false, motivo: "Você não pode remover o seu próprio acesso de administrador." };
    if (totalAdmins !== undefined && totalAdmins <= 1) return { pode: false, motivo: "O Radar precisa de pelo menos um administrador." };
    return { pode: true };
  }
  if (u.bloqueado_ate && new Date(u.bloqueado_ate) > agora) return { pode: false, motivo: "Desbloqueie a conta antes de dar acesso de administrador." };
  return { pode: true };
}

/** Espelho das guardas da Edge Function admin-usuarios. Desbloquear é sempre permitido. */
export function podeBloquear(u: Pick<UsuarioAdmin, "id" | "admin" | "bloqueado_ate">, meuId: string | undefined, agora = new Date()): Permissao {
  if (u.bloqueado_ate && new Date(u.bloqueado_ate) > agora) return { pode: true };
  if (u.id === meuId) return { pode: false, motivo: "Você não pode bloquear a sua própria conta." };
  if (u.admin) return { pode: false, motivo: "Remova o acesso de administrador antes de bloquear esta conta." };
  return { pode: true };
}

/** Nome para exibir: o nome do perfil ou a parte do e-mail antes do @. */
export function nomeExibicao(u: Pick<UsuarioAdmin, "nome" | "email">): string {
  if (u.nome?.trim()) return u.nome.trim();
  if (u.email) return u.email.split("@")[0];
  return "Sem nome";
}

const numero = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

/** Normaliza a linha da RPC (bigint chega como string pelo PostgREST). */
export function normalizarUsuario(l: Record<string, unknown>): UsuarioAdmin {
  return {
    id: String(l.id),
    email: (l.email as string | null) ?? null,
    nome: (l.nome as string | null) ?? null,
    criado_em: String(l.criado_em),
    ultimo_acesso: (l.ultimo_acesso as string | null) ?? null,
    email_confirmado: Boolean(l.email_confirmado),
    bloqueado_ate: (l.bloqueado_ate as string | null) ?? null,
    admin: Boolean(l.admin),
    projetos: numero(l.projetos),
    lead_bairro: (l.lead_bairro as string | null) ?? null,
    lead_criado_em: (l.lead_criado_em as string | null) ?? null,
    total: numero(l.total),
  };
}

export function normalizarResumo(l: Record<string, unknown> | undefined): ResumoUsuarios {
  return {
    total: numero(l?.total), admins: numero(l?.admins), bloqueados: numero(l?.bloqueados),
    nao_confirmados: numero(l?.nao_confirmados), novos_7d: numero(l?.novos_7d), ativos_30d: numero(l?.ativos_30d),
  };
}

/** Mensagem de erro legível (RPC, função ou rede). */
export function mensagemErro(e: unknown): string {
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") return (e as { message: string }).message;
  return "Não foi possível concluir. Tente de novo.";
}

type Resposta = { data: unknown; error: { message: string } | null };
type ClienteSolto = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<Resposta>;
  from: (t: string) => { select: (c: string) => { eq: (col: string, v: string) => { order: (col: string, o: { ascending: boolean }) => { limit: (n: number) => Promise<Resposta> } } } };
};
const solto = () => supabase as unknown as ClienteSolto;

export async function listarUsuarios(params: { busca: string; filtro: FiltroUsuarios; pagina: number }): Promise<{ usuarios: UsuarioAdmin[]; total: number }> {
  const { data, error } = await solto().rpc("admin_listar_usuarios", {
    p_busca: params.busca.trim() || null,
    p_filtro: params.filtro,
    p_limite: POR_PAGINA,
    p_offset: Math.max(0, params.pagina) * POR_PAGINA,
  });
  if (error) throw new Error(error.message);
  const usuarios = ((data ?? []) as Record<string, unknown>[]).map(normalizarUsuario);
  return { usuarios, total: usuarios[0]?.total ?? 0 };
}

export async function resumoUsuarios(): Promise<ResumoUsuarios> {
  const { data, error } = await solto().rpc("admin_resumo_usuarios");
  if (error) throw new Error(error.message);
  return normalizarResumo(((data ?? []) as Record<string, unknown>[])[0]);
}

export async function historicoUsuario(usuarioId: string): Promise<RegistroAuditoria[]> {
  const { data, error } = await solto().from("admin_usuarios_auditoria").select("id,acao,motivo,feito_por,feito_em").eq("usuario_id", usuarioId).order("feito_em", { ascending: false }).limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistroAuditoria[];
}

/** true = mudou (e foi auditado); false = a conta já estava assim (outra pessoa mudou antes). */
export async function definirAdmin(usuarioId: string, admin: boolean, motivo: string): Promise<boolean> {
  const { data, error } = await solto().rpc("admin_definir_admin", { p_usuario: usuarioId, p_admin: admin, p_motivo: motivo.trim() || null });
  if (error) throw new Error(error.message);
  return data === true;
}

/** true = mudou (e foi auditado); false = a conta já estava assim. */
export async function alterarBloqueio(usuarioId: string, bloquear: boolean, motivo: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("admin-usuarios", {
    body: { acao: bloquear ? "bloquear" : "desbloquear", usuario_id: usuarioId, ...(motivo.trim() ? { motivo: motivo.trim() } : {}) },
  });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const corpo = ctx && typeof ctx.json === "function" ? await ctx.json().catch(() => null) : null;
    throw new Error((corpo as { error?: string } | null)?.error ?? error.message);
  }
  return (data as { mudou?: boolean } | null)?.mudou !== false;
}

const FMT_DATA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
const FMT_DATA_HORA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
/** "18/10/2026" no fuso de São Paulo. */
export const dataBR = (iso: string) => FMT_DATA.format(new Date(iso));
/** "18/10/2026, 05:20" no fuso de São Paulo. */
export const dataHoraBR = (iso: string) => FMT_DATA_HORA.format(new Date(iso));
