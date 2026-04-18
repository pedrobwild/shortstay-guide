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

// ---------- Gerador de eventos mockados (demo realista) ----------

/** PRNG determinística (FNV-1a hash + mulberry32) por connectionId */
function seededRng(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let a = h || 1;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addDaysUtc(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
function isoDate(d: Date): string { return d.toISOString().split("T")[0]; }

// Sazonalidade por mês (0=Jan). Pico dez/jan e jul, baixa fev/mar/mai/set.
const SEASONALITY = [
  1.25, 0.85, 0.80, 0.95, 0.80, 0.95,
  1.20, 0.95, 0.80, 0.95, 1.00, 1.30,
];

const FIRST_NAMES = [
  "Ana","Bruno","Camila","Daniel","Eduardo","Fernanda","Gabriel","Helena",
  "Igor","Julia","Lucas","Mariana","Nicolas","Olivia","Pedro","Raquel",
  "Sofia","Thiago","Vitor","Yasmin","Arthur","Beatriz","Caio","Diana",
];

const BLOCK_REASONS = [
  "Blocked — Manutenção",
  "Blocked — Limpeza profunda",
  "Blocked — Uso pessoal",
  "Not available",
];

/**
 * Gera ~18 meses de eventos demo (12 passados + 6 futuros) com sazonalidade,
 * ~75% de ocupação e mistura de reservas e bloqueios. Determinístico por connectionId.
 */
function generateMockEvents(connectionId: string, now: string) {
  const rng = seededRng(connectionId);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const windowStart = addDaysUtc(today, -365);
  const windowEnd = addDaysUtc(today, 180);

  type Row = {
    connection_id: string;
    external_event_uid: string;
    start_date: string;
    end_date: string;
    summary: string;
    raw_payload: Record<string, unknown>;
    synced_at: string;
  };

  const stayBuckets: { nights: number; w: number }[] = [
    { nights: 1,  w: 0.05 },
    { nights: 2,  w: 0.22 },
    { nights: 3,  w: 0.28 },
    { nights: 4,  w: 0.18 },
    { nights: 5,  w: 0.10 },
    { nights: 6,  w: 0.05 },
    { nights: 7,  w: 0.06 },
    { nights: 10, w: 0.03 },
    { nights: 14, w: 0.02 },
    { nights: 21, w: 0.01 },
  ];
  const totalW = stayBuckets.reduce((s, b) => s + b.w, 0);
  const pickStay = () => {
    let r = rng() * totalW;
    for (const b of stayBuckets) { r -= b.w; if (r <= 0) return b.nights; }
    return 3;
  };

  const rows: Row[] = [];
  let cursor = new Date(windowStart);
  let idx = 0;
  while (cursor < windowEnd) {
    const bias = SEASONALITY[cursor.getUTCMonth()];
    const startProb = 0.55 * bias;

    if (rng() < startProb) {
      const nights = pickStay();
      const endDate = addDaysUtc(cursor, nights);
      if (endDate > windowEnd) break;
      const isBlock = rng() < 0.08;
      const summary = isBlock
        ? BLOCK_REASONS[Math.floor(rng() * BLOCK_REASONS.length)]
        : `Reserved — ${FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]}`;
      idx++;
      rows.push({
        connection_id: connectionId,
        external_event_uid: `demo-${idx.toString().padStart(4, "0")}`,
        start_date: isoDate(cursor),
        end_date: isoDate(endDate),
        summary,
        raw_payload: { source: "mock", type: isBlock ? "blocked" : "reservation", nights },
        synced_at: now,
      });
      const gap = Math.floor(rng() * 2);
      cursor = addDaysUtc(endDate, gap);
    } else {
      cursor = addDaysUtc(cursor, 1);
    }
  }
  return rows;
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
