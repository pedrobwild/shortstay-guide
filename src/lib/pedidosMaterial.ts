/**
 * Pedido de material por e-mail (captura leve, sem senha nem WhatsApp).
 *
 * Grava, com o consentimento registrado (versão do texto), uma linha em
 * public.radar_pedidos_material: anon só insere, e só nas colunas do registro
 * abaixo; leitura e status comercial são do papel admin. Um pedido por e-mail
 * e material (índice único → código 23505, tratado como sucesso).
 *
 * Decisão do Pedro (27/10/2026, D3): ainda não há provedor de e-mail. A tela
 * entrega o material (MATERIAIS[...].caminho) e `enviarMaterial` é o ponto de
 * entrada do envio quando houver provedor. O e-mail nunca vai para GA4, Pixel
 * nem guide_events.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Momento } from "@/lib/momento";

/** Muda quando o texto do consentimento mudar; fica gravada em cada linha. */
export const CONSENTIMENTO_MATERIAL_VERSAO = "2026-10-27";

/** Proposta do texto (D6, 27/10/2026): o Pedro valida antes de publicar. */
export const TEXTO_CONSENTIMENTO_MATERIAL =
  "A Bewild usa seu e-mail só para enviar este material e, se você marcar, as próximas análises do Radar Bewild. " +
  "Você pode cancelar a qualquer momento pelo link no e-mail. Política de privacidade: bewild.com.br/privacidade.";

export const MATERIAIS = {
  checklist_compra: { titulo: "Checklist antes de comprar o studio", caminho: "/guia/checklist" },
} as const;
export type Material = keyof typeof MATERIAIS;

export type OrigemPedido = "guia" | "bairro" | "comparar" | "projecao";

/** Linha enviada ao banco: exatamente as colunas com GRANT INSERT na migration. */
export interface RegistroPedido {
  email: string;
  nome: string | null;
  material: Material;
  etapa: Momento | null;
  bairro: string | null;
  boletim: boolean;
  consentimento_versao: string;
  origem: OrigemPedido;
  sessao: string | null;
}

/** E-mail plausível: sem espaços, um só @, algo antes dele e domínio com ponto; até 254 caracteres. */
export function emailValido(e: string): boolean {
  const v = (e ?? "").trim();
  if (v.length < 5 || v.length > 254 || /\s/.test(v)) return false;
  const partes = v.split("@");
  if (partes.length !== 2) return false;
  const [local, dominio] = partes;
  return local.length > 0 && /^[^.]+(\.[^.]+)+$/.test(dominio);
}

const textoOuNulo = (v: string | null | undefined, max: number) => {
  const t = (v ?? "").trim().replace(/\s+/g, " ");
  return t ? t.slice(0, max) : null;
};

/** Normaliza o que a pessoa digitou e fixa a versão do consentimento. */
export function montarPedido(
  d: { email: string; nome?: string; material: Material; etapa?: Momento | null; bairro?: string | null; boletim: boolean; origem: OrigemPedido },
  sessao: string | null,
): RegistroPedido {
  return {
    email: d.email.trim(),
    nome: textoOuNulo(d.nome, 80),
    material: d.material,
    etapa: d.etapa ?? null,
    bairro: textoOuNulo(d.bairro, 80),
    boletim: d.boletim,
    consentimento_versao: CONSENTIMENTO_MATERIAL_VERSAO,
    origem: d.origem,
    sessao,
  };
}

// O cliente gerado (types.ts) ainda não conhece a tabela nova; quando o Lovable
// regerar os tipos depois da migration, este cast pode sair.
const db = supabase as unknown as SupabaseClient;

/**
 * Registra o pedido. "duplicado" = o mesmo e-mail já pediu este material
 * (a tela trata como sucesso). O log de erro nunca leva o e-mail.
 */
export async function registrarPedido(r: RegistroPedido): Promise<"ok" | "duplicado" | "erro"> {
  try {
    const { error } = await db.from("radar_pedidos_material").insert(r);
    if (!error) return "ok";
    if ((error as { code?: string }).code === "23505") return "duplicado";
    console.warn("[pedidosMaterial] não foi possível registrar o pedido", (error as { code?: string }).code ?? "");
    return "erro";
  } catch {
    console.warn("[pedidosMaterial] não foi possível registrar o pedido (rede)");
    return "erro";
  }
}

/**
 * Envio do material por e-mail. Por D3 (27/10/2026) ainda não há provedor:
 * resolve sem enviar e a tela entrega o link. Quando houver provedor, o envio
 * (e a marcação de `entregue_em`, do lado do servidor) entra aqui.
 */
export function enviarMaterial(_r: RegistroPedido): Promise<void> {
  return Promise.resolve();
}
