import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import type { PremissasSimulador } from "@/lib/simuladorReceita";

/**
 * Dados capturados no lead que viram a "proposta personalizada" ao criar acesso.
 * Persistimos a intenção quando o signup exige confirmação de email, para
 * concluir o auto-provisionamento assim que o usuário voltar autenticado.
 */
export interface LeadIntent {
  name?: string;
  whatsapp?: string;
  neighborhood?: string;
  area_sqm?: string;
  objective?: string;
  /** Simulação inteira (só números e escolhas, nenhum dado pessoal) vinda de "Guardar no Painel". */
  premissas?: PremissasSimulador;
  /** Versão do modelo de cálculo quando a simulação foi guardada. */
  versao_calculo?: string;
  /** Data (aaaa-mm-dd) da coleta de diária e ocupação vigente quando a pessoa guardou. */
  base_coletada_em?: string | null;
}

/**
 * Linha de `project_assumptions` a partir da intenção. As colunas `premissas_simulador`,
 * `versao_calculo` e `base_coletada_em` só entram quando há simulação; o cast existe porque
 * o `types.ts` gerado ainda não as conhece (regenera depois da migration 20261027120000).
 */
function linhaPremissas(projectId: string, intent: LeadIntent): TablesInsert<"project_assumptions"> {
  const base = {
    project_id: projectId,
    neighborhood: intent.neighborhood || null,
    area_sqm: intent.area_sqm || null,
  };
  if (!intent.premissas) return base;
  return {
    ...base,
    premissas_simulador: intent.premissas,
    versao_calculo: intent.versao_calculo ?? null,
    base_coletada_em: intent.base_coletada_em ?? null,
  } as unknown as TablesInsert<"project_assumptions">;
}

const PENDING_KEY = "bwild_pending_lead_provision";

export function savePendingProvision(intent: LeadIntent) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(intent));
  } catch {
    // storage indisponível (ex.: modo privado) — segue sem persistir
  }
}

export function loadPendingProvision(): LeadIntent | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as LeadIntent) : null;
  } catch {
    return null;
  }
}

export function clearPendingProvision() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

export interface ProvisionResult {
  projectId: string | null;
}

/**
 * Auto-provisiona um projeto pré-populado com bairro/m² do lead e vincula o
 * registro de lead à conta recém-criada. Idempotente: se o usuário já tem um
 * projeto, reutiliza o mais recente em vez de criar duplicatas.
 *
 * O bairro/m² ficam em `project_assumptions` (premissas da projeção), já que
 * `projects` guarda apenas nome/dono.
 */
export async function provisionProjectForLead(
  userId: string,
  intent: LeadIntent
): Promise<ProvisionResult> {
  let projectId: string | null = null;

  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (existing && existing.length > 0) {
    projectId = existing[0].id;
  } else {
    const projectName = intent.neighborhood
      ? `Meu Studio — ${intent.neighborhood}`
      : "Meu Studio";

    const { data: created, error } = await supabase
      .from("projects")
      .insert({ user_id: userId, name: projectName })
      .select("id")
      .single();

    if (!error && created) {
      projectId = created.id;

      // Pré-popula as premissas da projeção (best-effort: depende da policy).
      if (intent.neighborhood || intent.area_sqm || intent.premissas) {
        await supabase.from("project_assumptions").insert(linhaPremissas(projectId, intent));
      }
    }
  }

  // Vincula leads anteriores (mesmo WhatsApp) à conta recém-criada.
  if (intent.whatsapp) {
    await supabase
      .from("guide_leads")
      .update({ user_id: userId })
      .eq("whatsapp", intent.whatsapp)
      .is("user_id", null);
  }

  return { projectId };
}

/**
 * Guarda uma simulação do guia como novo projeto de quem já está logado
 * (botão "Guardar no Painel"). Diferente do auto-provisionamento, sempre cria
 * um projeto novo, porque a pessoa pediu explicitamente para guardar esta conta.
 * Premissas: a simulação inteira quando existe (`intent.premissas`); senão, só bairro e m².
 */
export async function criarProjetoDaSimulacao(userId: string, intent: LeadIntent): Promise<ProvisionResult> {
  const nome = intent.neighborhood ? `Meu Studio — ${intent.neighborhood}` : "Meu Studio";
  const { data: criado, error } = await supabase
    .from("projects")
    .insert({ user_id: userId, name: nome })
    .select("id")
    .single();
  if (error || !criado) return { projectId: null };
  if (intent.neighborhood || intent.area_sqm || intent.premissas) {
    await supabase.from("project_assumptions").insert(linhaPremissas(criado.id, intent));
  }
  return { projectId: criado.id };
}
