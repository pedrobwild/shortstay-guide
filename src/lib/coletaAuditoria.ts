import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export const CAMPOS_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
/** Só os parâmetros da tela atual; sem cookies, persistência ou envio a rastreadores. */
export function utmsAcessoColeta(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  return Object.fromEntries(CAMPOS_UTM.flatMap((chave) => {
    const valor = params.get(chave)?.trim();
    return valor ? [[chave, valor.slice(0, 256)]] : [];
  }));
}

export function registrarColetaAuditada(coleta: Json, utms: Record<string, string>) {
  return supabase.rpc("admin_registrar_coleta_radar_auditada", { p_coleta: coleta, p_utms: utms });
}

export type AuditoriaColeta = { autor_nome: string; registrado_em: string; utms: Json };

export function rotuloUtms(utms: Json): string {
  if (!utms || typeof utms !== "object" || Array.isArray(utms)) return "Sem UTMs no acesso";
  return CAMPOS_UTM.flatMap((chave) => typeof utms[chave] === "string" ? [`${chave}=${utms[chave]}`] : []).join(" · ") || "Sem UTMs no acesso";
}