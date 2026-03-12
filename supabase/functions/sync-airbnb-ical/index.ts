import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

// ============================================================
// Edge Function: sync-airbnb-ical
// Segurança: valida autenticação, verifica ownership do projeto,
// valida inputs, limita tamanho do download.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Helper: resposta JSON padronizada */
function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Valida formato UUID v4 */
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ---------- iCal Parser ----------

function parseICalDate(raw: string): string | null {
  if (!raw) return null;
  const cleaned = raw.includes(":") ? raw.split(":").pop()! : raw;
  const match = cleaned.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  // Validação básica de data
  const m = parseInt(month), d = parseInt(day);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${year}-${month}-${day}`;
}

function parseVEvents(icalContent: string) {
  const events: Array<{
    uid: string | null;
    summary: string | null;
    startDate: string | null;
    endDate: string | null;
    rawBlock: string;
  }> = [];

  const normalized = icalContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const unfolded = normalized.replace(/\n[ \t]/g, "");
  const regex = /BEGIN:VEVENT\n([\s\S]*?)END:VEVENT/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(unfolded)) !== null) {
    const block = match[1];
    const lines = block.split("\n");

    let uid: string | null = null;
    let summary: string | null = null;
    let dtstart: string | null = null;
    let dtend: string | null = null;

    for (const line of lines) {
      if (line.startsWith("UID:") || line.startsWith("UID;")) {
        uid = line.substring(line.indexOf(":") + 1).trim();
      } else if (line.startsWith("SUMMARY:") || line.startsWith("SUMMARY;")) {
        summary = line.substring(line.indexOf(":") + 1).trim();
      } else if (line.startsWith("DTSTART")) {
        dtstart = line.substring(line.indexOf(":") + 1).trim();
      } else if (line.startsWith("DTEND")) {
        dtend = line.substring(line.indexOf(":") + 1).trim();
      }
    }

    events.push({
      uid,
      summary: summary ? summary.substring(0, 500) : null, // Limita tamanho
      startDate: parseICalDate(dtstart || ""),
      endDate: parseICalDate(dtend || ""),
      rawBlock: match[0].substring(0, 2000), // Limita payload bruto
    });
  }

  return events;
}

// ---------- Handler ----------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // SEGURANÇA: aceitar apenas POST
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Método não permitido" }, 405);
  }

  try {
    // 1. Validar autenticação do usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ success: false, error: "Não autenticado" }, 401);
    }

    // Cliente autenticado (para verificar ownership)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar token do usuário
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ success: false, error: "Token inválido" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // 2. Validar payload
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ success: false, error: "JSON inválido" }, 400);
    }

    const connectionId = body?.connectionId;
    if (!connectionId || typeof connectionId !== "string") {
      return jsonResponse({ success: false, error: "connectionId é obrigatório" }, 400);
    }

    // Validar formato UUID
    if (!isValidUUID(connectionId)) {
      return jsonResponse({ success: false, error: "connectionId inválido" }, 400);
    }

    // 3. Cliente com service role para operações de dados
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Buscar conexão e verificar ownership via projeto
    const { data: connection, error: connError } = await supabase
      .from("ota_connections")
      .select("*, projects!inner(user_id)")
      .eq("id", connectionId)
      .single();

    if (connError || !connection) {
      return jsonResponse({ success: false, error: "Conexão não encontrada" }, 404);
    }

    // SEGURANÇA: verificar se o usuário é dono do projeto
    if (connection.projects?.user_id !== userId) {
      return jsonResponse({ success: false, error: "Acesso negado" }, 403);
    }

    // 5. Validar ical_url
    if (!connection.ical_url) {
      return jsonResponse({ success: false, error: "ical_url não configurada" }, 400);
    }

    // Validar que é HTTPS
    try {
      const parsed = new URL(connection.ical_url);
      if (parsed.protocol !== "https:") {
        return jsonResponse({ success: false, error: "ical_url deve usar HTTPS" }, 400);
      }
    } catch {
      return jsonResponse({ success: false, error: "ical_url inválida" }, 400);
    }

    // 6. Download do iCal com timeout e limite de tamanho
    let icalContent: string;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const icalResponse = await fetch(connection.ical_url, {
        signal: controller.signal,
        headers: { "User-Agent": "Bwild-iCal-Sync/1.0" },
      });
      clearTimeout(timeout);

      if (!icalResponse.ok) {
        throw new Error(`HTTP ${icalResponse.status}`);
      }

      // Limite: 2MB
      const contentLength = icalResponse.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) {
        throw new Error("Arquivo iCal muito grande (>2MB)");
      }

      icalContent = await icalResponse.text();

      // Verificação pós-download
      if (icalContent.length > 2 * 1024 * 1024) {
        throw new Error("Arquivo iCal muito grande (>2MB)");
      }
    } catch (downloadError: any) {
      await supabase
        .from("ota_connections")
        .update({ status: "error" })
        .eq("id", connectionId);

      const msg = downloadError.name === "AbortError"
        ? "Timeout ao baixar calendário (>15s)"
        : `Falha ao baixar calendário: ${downloadError.message}`;

      return jsonResponse({ success: false, error: msg }, 502);
    }

    // 7. Validar conteúdo iCal
    if (!icalContent.includes("BEGIN:VCALENDAR")) {
      await supabase
        .from("ota_connections")
        .update({ status: "error" })
        .eq("id", connectionId);

      return jsonResponse({ success: false, error: "Conteúdo não é um calendário iCal válido" }, 422);
    }

    // 8. Parse dos eventos
    const parsedEvents = parseVEvents(icalContent);
    const validEvents = parsedEvents.filter((e) => e.startDate && e.endDate);

    // 9. Apagar antigos e inserir novos (estratégia MVP)
    const now = new Date().toISOString();

    const { error: deleteError } = await supabase
      .from("ota_calendar_events")
      .delete()
      .eq("connection_id", connectionId);

    if (deleteError) {
      console.error("Erro ao apagar eventos antigos:", deleteError);
    }

    let eventsImported = 0;

    if (validEvents.length > 0) {
      const rows = validEvents.map((e) => ({
        connection_id: connectionId,
        external_event_uid: e.uid,
        start_date: e.startDate!,
        end_date: e.endDate!,
        summary: e.summary,
        raw_payload: { raw: e.rawBlock },
        synced_at: now,
      }));

      const { error: insertError } = await supabase
        .from("ota_calendar_events")
        .insert(rows);

      if (insertError) {
        await supabase
          .from("ota_connections")
          .update({ status: "error" })
          .eq("id", connectionId);

        return jsonResponse({ success: false, error: `Erro ao salvar eventos: ${insertError.message}` }, 500);
      }

      eventsImported = rows.length;
    }

    // 10. Atualizar status e last_synced_at
    await supabase
      .from("ota_connections")
      .update({ status: "active", last_synced_at: now })
      .eq("id", connectionId);

    return jsonResponse({
      success: true,
      eventsImported,
      eventsTotal: parsedEvents.length,
      eventsSkipped: parsedEvents.length - validEvents.length,
      connectionId,
      syncedAt: now,
    }, 200);
  } catch (err: any) {
    console.error("Erro inesperado:", err);
    return jsonResponse({ success: false, error: "Erro interno do servidor" }, 500);
  }
});
