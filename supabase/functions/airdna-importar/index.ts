import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

// ============================================================
// Edge Function: airdna-importar
// Consulta a AirDNA Enterprise API v2 e devolve uma PRÉVIA da coleta de um
// bairro sem fonte pública. Não grava nada: o admin confere e registra pela
// RPC auditada (admin_registrar_coleta_radar_auditada).
// Chave: segredo AIRDNA_API_KEY (Lovable Cloud → Secrets). Nunca vai ao frontend.
// Doc: https://docs.airdna.co/ (POST /market/search; POST /market/{id}/metrics/{metrica})
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BASE = "https://api.airdna.co/api/enterprise/v2";
const BAIRROS = ["Brooklin", "Consolação", "Vila Olímpia"] as const;
// Mesmo recorte para os três bairros: imóvel inteiro (exclui quartos e camas compartilhadas).
const FILTROS = [{ field: "listing_type", type: "select", value: "entire_place" }];
const ROTULO_FILTROS = "imóvel inteiro (entire_place), todos os tamanhos";
const DATA = /^\d{4}-\d{2}-\d{2}$/;

type Mes = { date: string; [k: string]: unknown };
class ErroAirdna extends Error { constructor(msg: string, public status = 502) { super(msg); } }

async function airdna(caminho: string, corpo: unknown, chave: string) {
  const r = await fetch(`${BASE}${caminho}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const dados = await r.json().catch(() => null);
  if (r.status === 401) throw new ErroAirdna("A AirDNA recusou a chave (AIRDNA_API_KEY inválida ou expirada).");
  if (r.status === 404) throw new ErroAirdna("A AirDNA não encontrou dados para esta área e período.", 404);
  if (r.status === 429) throw new ErroAirdna("Limite de consultas da AirDNA atingido. Tente mais tarde.", 429);
  if (!r.ok) throw new ErroAirdna(`A AirDNA respondeu com erro (${r.status}).`);
  return dados?.payload;
}

const norm = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ erro: "Método não permitido." }, 405);

  // 1) Só administradores (mesma regra das coletas).
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ erro: "Faça login como administrador." }, 401);
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) return json({ erro: "Sessão inválida." }, 401);
  const { data: admin } = await supabase.rpc("has_role", { _user_id: user.user.id, _role: "admin" });
  if (!admin) return json({ erro: "Acesso exclusivo de administrador." }, 403);

  // 2) Entrada.
  const corpo = await req.json().catch(() => null);
  const bairro = BAIRROS.find((b) => b === corpo?.bairro);
  const ini = String(corpo?.periodo_inicio ?? ""), fim = String(corpo?.periodo_fim ?? "");
  const hoje = new Date().toISOString().slice(0, 10);
  if (!bairro) return json({ erro: "AirDNA só cobre Brooklin, Consolação e Vila Olímpia." }, 400);
  if (!DATA.test(ini) || !DATA.test(fim) || ini > fim || fim > hoje) return json({ erro: "Informe um período válido." }, 400);

  const chave = Deno.env.get("AIRDNA_API_KEY");
  if (!chave) return json({ erro: "Segredo AIRDNA_API_KEY não configurado no backend." }, 500);

  try {
    // 3) Área: submercado de São Paulo com o nome do bairro.
    const busca = await airdna("/market/search", { search_term: `${bairro}, São Paulo`, pagination: { page_size: 25, offset: 0 } }, chave);
    const resultados: Array<{ id: string; name: string; type: string; parent_market?: { name?: string } }> = busca?.results ?? [];
    const area = resultados.find((r) => r.type === "submarket" && norm(r.name).includes(norm(bairro)) && norm(r.parent_market?.name ?? "").includes("sao paulo"));
    if (!area) {
      const opcoes = resultados.slice(0, 5).map((r) => `${r.name} (${r.type})`).join("; ");
      return json({ erro: `Nenhum submercado da AirDNA corresponde a ${bairro}.${opcoes ? ` Resultados: ${opcoes}.` : ""}` }, 404);
    }

    // 4) Séries mensais. A API não aceita data inicial: pede-se de 12 a 60 meses e filtra-se o período.
    const [ai, mi] = ini.split("-").map(Number);
    const [ah, mh] = hoje.split("-").map(Number);
    const numMonths = Math.min(60, Math.max(12, (ah - ai) * 12 + (mh - mi) + 1));
    const pedir = (m: string, extra: Record<string, unknown> = {}) =>
      airdna(`/market/${area.id}/metrics/${m}`, { num_months: numMonths, filters: FILTROS, ...extra }, chave);
    const [occ, adr, anuncios] = await Promise.all([pedir("occupancy"), pedir("adr", { currency: "brl" }), pedir("active_listings_count")]);

    const noPeriodo = (s: Mes[] | undefined) => (s ?? []).filter((m) => m.date >= ini.slice(0, 7) && m.date <= fim.slice(0, 7));
    const occM = noPeriodo(occ?.metrics), adrM = noPeriodo(adr?.metrics), nM = noPeriodo(anuncios?.metrics);
    if (!occM.length || !adrM.length) throw new ErroAirdna("A AirDNA não devolveu meses dentro do período escolhido.", 404);

    // 5) Agregação: ocupação = noites reservadas ÷ noites disponíveis; diária ponderada pelas noites reservadas.
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    const booked = new Map(occM.map((m) => [m.date, num(m.days_booked)]));
    const somaDisp = occM.reduce((s, m) => s + (num(m.days_available) ?? 0), 0);
    const somaRes = occM.reduce((s, m) => s + (num(m.days_booked) ?? 0), 0);
    const ocupacao = somaDisp > 0 ? (somaRes / somaDisp) * 100 : occM.reduce((s, m) => s + (num(m.occupancy_rate) ?? 0), 0) / occM.length;
    let peso = 0, somaAdr = 0;
    for (const m of adrM) { const v = num(m.adr); const w = booked.get(m.date) ?? 0; if (v != null && w > 0) { somaAdr += v * w; peso += w; } }
    const adrMedia = peso > 0 ? somaAdr / peso : adrM.reduce((s, m) => s + (num(m.adr) ?? 0), 0) / adrM.length;
    const listagens = nM.map((m) => num(m.listing_count)).filter((v): v is number => v != null);
    const amostra = listagens.length ? listagens.reduce((s, v) => s + v, 0) / listagens.length : 0;

    if (!(adrMedia > 0) || !(ocupacao >= 0 && ocupacao <= 100)) throw new ErroAirdna("A AirDNA devolveu valores fora da faixa esperada; confira antes de registrar.");

    return json({
      bairro,
      area: { id: area.id, nome: area.name, tipo: area.type },
      periodo_inicio: ini,
      periodo_fim: fim,
      amostra_n: Math.round(amostra),
      indicadores: { adr_medio_brl: Math.round(adrMedia), ocupacao_media_pct: Math.round(ocupacao * 10) / 10 },
      meses: occM.length,
      filtros: ROTULO_FILTROS,
      url_origem: "https://app.airdna.co/data/performance",
    });
  } catch (e) {
    const status = e instanceof ErroAirdna ? e.status : 500;
    console.error("airdna-importar:", e instanceof Error ? e.message : e);
    return json({ erro: e instanceof ErroAirdna ? e.message : "Falha ao consultar a AirDNA." }, status);
  }
});
