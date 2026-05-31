import { supabase } from "@/integrations/supabase/client";

/**
 * Dados capturados no lead que viram a "proposta personalizada" ao criar acesso.
 * Persistimos a intenção quando o signup exige confirmação de email, para
 * concluir o auto-provisionamento assim que o usuário voltar autenticado.
 */
export interface LeadIntent {
  name?: string;
  whatsapp?: string;
  neighborhood?: string;
  area_sqm?: number | null;
  objective?: string;
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
    projectId = existing[0].id as string;
  } else {
    const projectName = intent.neighborhood
      ? `Meu Studio — ${intent.neighborhood}`
      : "Meu Studio";

    const { data: created, error } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name: projectName,
        neighborhood: intent.neighborhood || null,
        area_sqm: intent.area_sqm ?? null,
      })
      .select("id")
      .single();

    if (!error && created) {
      projectId = created.id as string;
    }
  }

  // Vincula o lead capturado à conta (best-effort; depende da policy de update).
  if (intent.whatsapp) {
    await supabase
      .from("guide_leads")
      .update({ user_id: userId })
      .eq("whatsapp", intent.whatsapp)
      .is("user_id", null);
  }

  return { projectId };
}
