import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

// ============================================================
// Edge Function: sync-airbnb-ical
// Suporta conexões reais (download iCal) e conexões de teste
// (gera eventos mockados sem precisar de URL real).
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
      summary: summary ? summary.substring(0, 500) : null,
      startDate: parseICalDate(dtstart || ""),
      endDate: parseICalDate(dtend || ""),
      rawBlock: match[0].substring(0, 2000),
    });
  }

  return events;
}

// ---------- Gerador de eventos mockados ----------

/**
 * Gera eventos de teste com datas futuras.
 * Usado quando a conexão é de teste (is_test = true).
 */
function generateMockEvents(connectionId: string, now: string) {
  // Cria datas baseadas em "hoje + X dias" para sempre serem futuras
  const today = new Date();
  const addDays = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  return [
    {
      connection_id: connectionId,
      external_event_uid: "mock-reserva-001",
      start_date: addDays(5),
      end_date: addDays(8),
      summary: "Reserva Teste 1 — Hóspede fictício",
      raw_payload: { source: "mock", type: "reservation" },
      synced_at: now,
    },
    {
      connection_id: connectionId,
      external_event_uid: "mock-reserva-002",
      start_date: addDays(15),
      end_date: addDays(17),
      summary: "Reserva Teste 2 — Estadia curta",
      raw_payload: { source: "mock", type: "reservation" },
      synced_at: now,
    },
    {
      connection_id: connectionId,
      external_event_uid: "mock-bloqueio-001",
      start_date: addDays(25),
      end_date: addDays(27),
      summary: "Bloqueio Teste — Manutenção",
      raw_payload: { source: "mock", type: "blocked" },
      synced_at: now,
    },
    {
      connection_id: connectionId,
      external_event_uid: "mock-reserva-003",
      start_date: addDays(35),
      end_date: addDays(40),
      summary: "Reserva Teste 3 — Estadia longa",
      raw_payload: { source: "mock", type: "reservation" },
      synced_at: now,
    },
    {
      connection_id: connectionId,
      external_event_uid: "mock-bloqueio-002",
      start_date: addDays(50),
      end_date: addDays(52),
      summary: "Bloqueio Teste — Uso pessoal",
      raw_payload: { source: "mock", type: "blocked" },
      synced_at: now,
    },
  ];
}

// ---------- Handler ----------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Método não permitido" }, 405);
  }

  try {
    // 1. Validar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ success: false, error: "Não autenticado" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ success: false, error: "Token inválido" }, 401);
    }
    const userId = user.id;

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

    if (!isValidUUID(connectionId)) {
      return jsonResponse({ success: false, error: "connectionId inválido" }, 400);
    }

    // 3. Cliente com service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Buscar conexão e verificar ownership
    const { data: connection, error: connError } = await supabase
      .from("ota_connections")
      .select("*, projects!inner(user_id)")
      .eq("id", connectionId)
      .single();

    if (connError || !connection) {
      return jsonResponse({ success: false, error: "Conexão não encontrada" }, 404);
    }

    if (connection.projects?.user_id !== userId) {
      return jsonResponse({ success: false, error: "Acesso negado" }, 403);
    }

    const now = new Date().toISOString();

    // ============================================================
    // MODO TESTE: gera eventos mockados sem download externo
    // ============================================================
    if (connection.is_test) {
      // Apagar eventos antigos desta conexão de teste
      await supabase
        .from("ota_calendar_events")
        .delete()
        .eq("connection_id", connectionId);

      const mockRows = generateMockEvents(connectionId, now);

      const { error: insertError } = await supabase
        .from("ota_calendar_events")
        .insert(mockRows);

      if (insertError) {
        await supabase
          .from("ota_connections")
          .update({ status: "error" })
          .eq("id", connectionId);
        return jsonResponse({ success: false, error: `Erro ao salvar eventos mock: ${insertError.message}` }, 500);
      }

      await supabase
        .from("ota_connections")
        .update({ status: "active", last_synced_at: now })
        .eq("id", connectionId);

      return jsonResponse({
        success: true,
        isTest: true,
        eventsImported: mockRows.length,
        eventsTotal: mockRows.length,
        eventsSkipped: 0,
        connectionId,
        syncedAt: now,
      }, 200);
    }

    // ============================================================
    // MODO REAL: download e parse do iCal
    // ============================================================

    // 5. Validar ical_url
    if (!connection.ical_url) {
      return jsonResponse({ success: false, error: "ical_url não configurada" }, 400);
    }

    try {
      const parsed = new URL(connection.ical_url);
      if (parsed.protocol !== "https:") {
        return jsonResponse({ success: false, error: "ical_url deve usar HTTPS" }, 400);
      }
    } catch {
      return jsonResponse({ success: false, error: "ical_url inválida" }, 400);
    }

    // 6. Download do iCal
    let icalContent: string;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const icalResponse = await fetch(connection.ical_url, {
        signal: controller.signal,
        headers: { "User-Agent": "Bwild-iCal-Sync/1.0" },
      });
      clearTimeout(timeout);

      if (!icalResponse.ok) {
        throw new Error(`HTTP ${icalResponse.status}`);
      }

      const contentLength = icalResponse.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) {
        throw new Error("Arquivo iCal muito grande (>2MB)");
      }

      icalContent = await icalResponse.text();

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

    // 7. Validar conteúdo
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

    // 9. Apagar antigos e inserir novos
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

    // 10. Atualizar status
    await supabase
      .from("ota_connections")
      .update({ status: "active", last_synced_at: now })
      .eq("id", connectionId);

    return jsonResponse({
      success: true,
      isTest: false,
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
