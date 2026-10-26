/**
 * Lista de contas do Radar para o admin (/admin/usuarios). Módulo puro, sem imports:
 * a Edge Function admin-usuarios usa uma cópia idêntica em
 * supabase/functions/admin-usuarios/lista.ts (o teste usuariosAdmin.test.ts confere),
 * e a tela usa os tipos e o CSV daqui. Senha nunca sai do Supabase Auth.
 */

export type TipoConta = "todos" | "clientes" | "admins";

/** Como a conta foi criada: cadastro feito pela pessoa no site ou convite enviado pelo admin. */
export type OrigemConta = "cadastro" | "convite";

export interface ProjetoConta {
  nome: string;
  bairro: string | null;
  area: string | null;
  criado_em: string;
}

export interface ContaRadar {
  id: string;
  email: string;
  nome: string;
  admin: boolean;
  origem: OrigemConta;
  /** De onde veio o cadastro feito no site ("simulador", "area-exclusiva"); null em contas antigas ou convites. */
  origem_cadastro: string | null;
  criado_em: string;
  ultimo_acesso: string | null;
  confirmado: boolean;
  confirmado_em: string | null;
  projetos: ProjetoConta[];
}

export interface ResumoContas {
  total: number;
  clientes: number;
  admins: number;
  /** Contas criadas nos últimos 7 dias. */
  ultimos7dias: number;
}

/** Usuário como vem do Supabase Auth (só os campos usados). */
export interface UsuarioAuth {
  id: string;
  email?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  invited_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

export const POR_PAGINA = 50;

const texto = (v: unknown) => (typeof v === "string" ? v : "");
const normal = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Monta a conta a partir do usuário do Auth, do perfil e dos papéis. O nome do perfil prevalece; o do cadastro é a reserva. */
export function montarConta(u: UsuarioAuth, nomePerfil: string | null | undefined, admin: boolean, projetos: ProjetoConta[] = []): ContaRadar {
  const meta = u.user_metadata ?? {};
  return {
    id: u.id,
    email: u.email ?? "",
    nome: (nomePerfil ?? "").trim() || texto(meta.full_name).trim(),
    admin,
    origem: u.invited_at ? "convite" : "cadastro",
    origem_cadastro: texto(meta.origem_cadastro) || null,
    criado_em: u.created_at,
    ultimo_acesso: u.last_sign_in_at ?? null,
    confirmado: !!u.email_confirmed_at,
    confirmado_em: u.email_confirmed_at ?? null,
    projetos,
  };
}

/** Filtra por tipo e busca (e-mail ou nome, sem acento), do cadastro mais recente ao mais antigo. */
export function filtrarContas(contas: ContaRadar[], tipo: TipoConta, busca = ""): ContaRadar[] {
  const b = normal(busca);
  return contas
    .filter((c) => (tipo === "clientes" ? !c.admin : tipo === "admins" ? c.admin : true))
    .filter((c) => !b || normal(c.email).includes(b) || normal(c.nome).includes(b))
    .sort((a, z) => z.criado_em.localeCompare(a.criado_em) || a.email.localeCompare(z.email));
}

export function paginar<T>(itens: T[], pagina: number, porPagina = POR_PAGINA): { itens: T[]; temMais: boolean } {
  const inicio = (Math.max(1, pagina) - 1) * porPagina;
  return { itens: itens.slice(inicio, inicio + porPagina), temMais: inicio + porPagina < itens.length };
}

export function resumirContas(contas: ContaRadar[], agora: Date): ResumoContas {
  const limite = agora.getTime() - 7 * 24 * 60 * 60 * 1000;
  return {
    total: contas.length,
    clientes: contas.filter((c) => !c.admin).length,
    admins: contas.filter((c) => c.admin).length,
    ultimos7dias: contas.filter((c) => new Date(c.criado_em).getTime() >= limite).length,
  };
}

const ROTULO_ORIGEM_CADASTRO: Record<string, string> = { simulador: "Simulador", "area-exclusiva": "Área exclusiva" };
export const rotuloOrigemCadastro = (v: string | null) => (v ? ROTULO_ORIGEM_CADASTRO[v] ?? v : "");

/** "Studio Pinheiros · Pinheiros · 27 m²" (área com unidade só quando ainda não tem). */
export function descricaoProjeto(p: ProjetoConta): string {
  const area = p.area ? (/m²/.test(p.area) ? p.area : `${p.area} m²`) : "";
  return [p.nome, p.bairro, area].filter(Boolean).join(" · ");
}

/** Data e hora em pt-BR (fuso de São Paulo); vazio quando não há. */
export function dataHora(v: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Célula CSV: aspas quando precisa e neutraliza fórmula (=, +, -, @) para quem abre no Excel. */
function celula(v: string): string {
  const seguro = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[";\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

/** CSV com ponto e vírgula (abre direto no Excel em pt-BR), com BOM para os acentos. */
export function contasCsv(contas: ContaRadar[]): string {
  const cab = ["Nome", "E-mail", "Acesso", "Como entrou", "Origem do cadastro", "Cadastro em", "E-mail confirmado em", "Último acesso", "Projetos"];
  const linhas = contas.map((c) => [
    c.nome,
    c.email,
    c.admin ? "Administrador" : "Cliente",
    c.origem === "convite" ? "Convite do admin" : "Cadastro no site",
    rotuloOrigemCadastro(c.origem_cadastro),
    dataHora(c.criado_em),
    dataHora(c.confirmado_em),
    dataHora(c.ultimo_acesso),
    c.projetos.map(descricaoProjeto).join(" | "),
  ]);
  return "﻿" + [cab, ...linhas].map((l) => l.map(celula).join(";")).join("\r\n");
}
