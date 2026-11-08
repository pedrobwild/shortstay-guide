/**
 * Pedidos de material na tela do comercial (/admin/pedidos, só admin).
 *
 * Decisão do Pedro (D4, 27/10/2026): nesta rodada não há CRM; a entrega ao
 * comercial é esta aba (lista, status comercial, responsável e CSV).
 * `enviarAoCrm` é o ponto de entrada documentado da integração futura.
 * E-mail e nome aparecem só aqui (rota admin): nunca vão para log nem medição.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Momento } from "@/lib/momento";
import { MATERIAIS, type Material, type OrigemPedido } from "@/lib/pedidosMaterial";

export const STATUS_COMERCIAL = ["novo", "qualificado", "oportunidade", "perdido", "fora_do_perfil"] as const;
export type StatusComercial = (typeof STATUS_COMERCIAL)[number];

export const ROTULO_STATUS: Record<StatusComercial, string> = {
  novo: "Novo",
  qualificado: "Qualificado",
  oportunidade: "Oportunidade",
  perdido: "Perdido",
  fora_do_perfil: "Fora do perfil",
};

export type PedidoAdmin = {
  id: string;
  created_at: string;
  email: string;
  nome: string | null;
  material: Material;
  etapa: Momento | null;
  bairro: string | null;
  boletim: boolean;
  contato_comercial: boolean;
  origem: OrigemPedido;
  status_comercial: StatusComercial;
  responsavel: string | null;
  motivo_perda: string | null;
  atualizado_em: string;
};

export type PatchStatus = {
  status_comercial: StatusComercial;
  responsavel?: string | null;
  motivo_perda?: string | null;
};

/** Tamanho da página (abaixo do cap de 1.000 linhas do PostgREST). */
export const TAMANHO_PAGINA = 200;

// A tabela nova ainda não está em types.ts (gerado); o cast sai quando a Lovable regerar os tipos.
const db = supabase as unknown as SupabaseClient;

export const statusValido = (s: unknown): s is StatusComercial =>
  typeof s === "string" && (STATUS_COMERCIAL as readonly string[]).includes(s);

export const exigeMotivo = (s: StatusComercial) => s === "perdido" || s === "fora_do_perfil";

/** Validação pura: perda e fora do perfil exigem motivo preenchido. */
export function patchValido(p: PatchStatus): boolean {
  if (!statusValido(p.status_comercial)) return false;
  if (exigeMotivo(p.status_comercial)) return (p.motivo_perda ?? "").trim().length > 0;
  return true;
}

// Cursor entra num filtro .or() do PostgREST: só aceita timestamp ISO e uuid.
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const ID_RE = /^[0-9a-fA-F-]{8,40}$/;

export async function listarPedidos(
  params: { status?: StatusComercial | null; desde?: Date | null; soContato?: boolean },
  pagina: { apos?: { created_at: string; id: string } },
): Promise<PedidoAdmin[]> {
  let q = db
    .from("radar_pedidos_material")
    .select("id,created_at,email,nome,material,etapa,bairro,boletim,contato_comercial,origem,status_comercial,responsavel,motivo_perda,atualizado_em")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(TAMANHO_PAGINA);
  if (params.status) {
    if (!statusValido(params.status)) throw new Error("status inválido");
    q = q.eq("status_comercial", params.status);
  }
  if (params.soContato) q = q.eq("contato_comercial", true);
  if (params.desde) q = q.gte("created_at", params.desde.toISOString());
  const apos = pagina.apos;
  if (apos) {
    if (!ISO_RE.test(apos.created_at) || !ID_RE.test(apos.id)) throw new Error("cursor inválido");
    q = q.or(`created_at.lt.${apos.created_at},and(created_at.eq.${apos.created_at},id.lt.${apos.id})`);
  }
  const { data, error } = await q;
  if (error) throw new Error("não foi possível carregar os pedidos");
  return (data ?? []) as PedidoAdmin[];
}

/** Atualiza status, responsável e motivo. Devolve false se o patch for inválido ou o banco recusar. */
export async function atualizarStatus(id: string, patch: PatchStatus): Promise<boolean> {
  if (!patchValido(patch)) return false;
  const { error } = await db
    .from("radar_pedidos_material")
    .update({ ...patch, atualizado_em: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

const dataBR = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });

/** CSV para o comercial: ponto e vírgula e BOM, mesmo formato de demandaParaCsv. */
export function pedidosParaCsv(linhas: PedidoAdmin[]): string {
  const cab = ["data", "e-mail", "nome", "material", "etapa", "bairro", "origem", "boletim", "contato comercial", "status", "responsável", "motivo"];
  // Neutraliza fórmulas de planilha (=, +, -, @, tab, CR) antes de citar.
  const esc = (bruto: string) => {
    const v = /^[=+\-@\t\r]/.test(bruto) ? `'${bruto}` : bruto;
    return /[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  const corpo = linhas.map((p) =>
    [
      dataBR.format(new Date(p.created_at)),
      p.email,
      p.nome ?? "",
      MATERIAIS[p.material]?.titulo ?? p.material,
      p.etapa ?? "",
      p.bairro ?? "",
      p.origem,
      p.boletim ? "sim" : "não",
      p.contato_comercial ? "sim" : "não",
      ROTULO_STATUS[p.status_comercial] ?? p.status_comercial,
      p.responsavel ?? "",
      p.motivo_perda ?? "",
    ]
      .map(esc)
      .join(";"),
  );
  return "﻿" + [cab.join(";"), ...corpo].join("\n");
}

export function resumoPedidos(linhas: PedidoAdmin[]): { total: number; porStatus: Record<StatusComercial, number>; boletim: number; contatoComercial: number } {
  const porStatus = Object.fromEntries(STATUS_COMERCIAL.map((s) => [s, 0])) as Record<StatusComercial, number>;
  let boletim = 0;
  let contatoComercial = 0;
  for (const p of linhas) {
    if (p.status_comercial in porStatus) porStatus[p.status_comercial] += 1;
    if (p.boletim) boletim += 1;
    if (p.contato_comercial) contatoComercial += 1;
  }
  return { total: linhas.length, porStatus, boletim, contatoComercial };
}

/**
 * Ponto de entrada da integração futura com o CRM (D4, 27/10/2026): hoje a
 * entrega ao comercial é a aba /admin/pedidos, então não faz nada.
 */
export function enviarAoCrm(_p: PedidoAdmin): Promise<"sem_crm"> {
  return Promise.resolve("sem_crm");
}
