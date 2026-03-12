import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

// ============================================================
// Edge Function: sync-airbnb-ical
// Finalidade: Sincroniza o calendário iCal de uma conexão Airbnb,
// importando reservas/bloqueios para ota_calendar_events.
//
// Exemplo de chamada:
//   POST /functions/v1/sync-airbnb-ical
//   Body: { "connectionId": "uuid-da-conexao" }
//
// Exemplo de resposta (sucesso):
//   {
//     "success": true,
//     "eventsImported": 12,
//     "connectionId": "uuid-da-conexao",
//     "syncedAt": "2026-03-12T08:50:00.000Z"
//   }
//
// Exemplo de resposta (erro):
//   {
//     "success": false,
//     "error": "Conexão não encontrada"
//   }
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------- Helpers para parse de iCal ----------

/**
 * Converte uma data iCal (ex: "20260315", "20260315T140000Z") para "YYYY-MM-DD".
 */
function parseICalDate(raw: string): string | null {
  if (!raw) return null;
  // Remove parâmetros como VALUE=DATE:
  const cleaned = raw.includes(":") ? raw.split(":").pop()! : raw;
  // Formato YYYYMMDD ou YYYYMMDDTHHMMSSZ
  const match = cleaned.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/**
 * Extrai todos os blocos VEVENT de um conteúdo iCal.
 * Retorna um array de objetos com uid, summary, dtstart, dtend e o bloco bruto.
 */
function parseVEvents(icalContent: string): Array<{
  uid: string | null;
  summary: string | null;
  startDate: string | null;
  endDate: string | null;
  rawBlock: string;
}> {
  const events: Array<{
    uid: string | null;
    summary: string | null;
    startDate: string | null;
    endDate: string | null;
    rawBlock: string;
  }> = [];

  // Normaliza quebras de linha (iCal usa \r\n, mas pode vir \n)
  const normalized = icalContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Desdobra linhas continuadas (linhas que começam com espaço/tab são continuação)
  const unfolded = normalized.replace(/\n[ \t]/g, "");

  // Encontra blocos BEGIN:VEVENT ... END:VEVENT
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
      // Cada linha tem formato PROPRIEDADE;PARAMS:VALOR ou PROPRIEDADE:VALOR
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
      summary,
      startDate: parseICalDate(dtstart || ""),
      endDate: parseICalDate(dtend || ""),
      rawBlock: match[0], // bloco completo incluindo BEGIN/END
    });
  }

  return events;
}

// ---------- Handler principal ----------

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Validar payload de entrada
    const body = await req.json();
    const connectionId = body?.connectionId;

    if (!connectionId) {
      return new Response(
        JSON.stringify({ success: false, error: "connectionId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Inicializar cliente Supabase com service role (acesso admin)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Buscar a conexão no banco
    const { data: connection, error: connError } = await supabase
      .from("ota_connections")
      .select("*")
      .eq("id", connectionId)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ success: false, error: "Conexão não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Validar se tem URL do iCal
    if (!connection.ical_url) {
      return new Response(
        JSON.stringify({ success: false, error: "ical_url não configurada nesta conexão" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Fazer download do conteúdo iCal
    let icalContent: string;
    try {
      const icalResponse = await fetch(connection.ical_url);
      if (!icalResponse.ok) {
        throw new Error(`HTTP ${icalResponse.status}`);
      }
      icalContent = await icalResponse.text();
    } catch (downloadError) {
      // Marcar conexão como erro
      await supabase
        .from("ota_connections")
        .update({ status: "error" })
        .eq("id", connectionId);

      return new Response(
        JSON.stringify({
          success: false,
          error: `Falha ao baixar calendário iCal: ${downloadError.message}`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Parsear os eventos VEVENT do conteúdo iCal
    const parsedEvents = parseVEvents(icalContent);

    // Filtrar apenas eventos com datas válidas
    const validEvents = parsedEvents.filter((e) => e.startDate && e.endDate);

    // 7. Estratégia MVP: apagar eventos antigos e inserir os novos
    //    (simples e sem risco de duplicidade)
    const now = new Date().toISOString();

    // Apagar eventos anteriores desta conexão
    const { error: deleteError } = await supabase
      .from("ota_calendar_events")
      .delete()
      .eq("connection_id", connectionId);

    if (deleteError) {
      console.error("Erro ao apagar eventos antigos:", deleteError);
    }

    // 8. Inserir novos eventos
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
        // Marcar conexão como erro
        await supabase
          .from("ota_connections")
          .update({ status: "error" })
          .eq("id", connectionId);

        return new Response(
          JSON.stringify({
            success: false,
            error: `Erro ao salvar eventos: ${insertError.message}`,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      eventsImported = rows.length;
    }

    // 9. Atualizar conexão: status = active, last_synced_at = agora
    await supabase
      .from("ota_connections")
      .update({ status: "active", last_synced_at: now })
      .eq("id", connectionId);

    // 10. Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        eventsImported,
        eventsTotal: parsedEvents.length,
        eventsSkipped: parsedEvents.length - validEvents.length,
        connectionId,
        syncedAt: now,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro inesperado:", err);
    return new Response(
      JSON.stringify({ success: false, error: `Erro interno: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
