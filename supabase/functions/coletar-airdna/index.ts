import { autenticarAdmin, jsonColeta, pedidoComparacao, preflightColeta } from "../_shared/coletaAdmin.ts";
import { agregarAirDNA, compararIndicadores, type MesMetrica } from "../_shared/comparacaoMetricas.ts";

const BASE = "https://api.airdna.co/api/enterprise/v2";
const normalizar = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
class FalhaFonte extends Error {
  constructor(public status: number, public detalhes: string) { super("Não foi possível consultar a AirDNA."); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflightColeta();
  if (req.method !== "POST") return jsonColeta({ error: "Método não permitido." }, 405);
  try {
    const acesso = await autenticarAdmin(req);
    if (acesso.resposta) return acesso.resposta;
    if (!acesso.db) return jsonColeta({ error: "Acesso indisponível." }, 503);
    const parsed = pedidoComparacao.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonColeta({ error: parsed.error.issues[0]?.message ?? "Entrada inválida." }, 400);
    const { bairro, periodo_inicio: inicio, periodo_fim: fim } = parsed.data;
    const { data: existentes, error: bairroError } = await acesso.db.from("radar_observacoes").select("id").eq("bairro", bairro).eq("cidade", "São Paulo").limit(1);
    if (bairroError) return jsonColeta({ error: "Não foi possível conferir o bairro." }, 503);
    if (!existentes?.length) return jsonColeta({ error: "Bairro não cadastrado no Radar." }, 404);
    const chave = Deno.env.get("AIRDNA_API_KEY");
    if (!chave) return jsonColeta({ error: "Acesso AirDNA não configurado." }, 503);
    const consultar = async (path: string, body: unknown) => {
      const response = await fetch(`${BASE}${path}`, { method: "POST", headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
      const text = await response.text();
      if (!response.ok) {
        // Remove a credencial caso o provedor a repita na mensagem.
        const detalhes = text.replaceAll(chave, "[redigido]").slice(0, 2000);
        console.error(`AirDNA [${response.status}]: ${detalhes}`);
        throw new FalhaFonte(response.status, detalhes);
      }
      let dados;
      try { dados = JSON.parse(text); } catch { throw new Error("Resposta AirDNA sem JSON válido."); }
      if (!dados?.payload) throw new Error("Resposta AirDNA sem dados no formato esperado.");
      return dados.payload;
    };
    const busca = await consultar("/market/search", { search_term: `${bairro}, São Paulo`, pagination: { page_size: 25, offset: 0 } });
    const areas = (Array.isArray(busca.results) ? busca.results : []).filter((r: { name?: string; type?: string; parent_market?: { name?: string } }) => r.type === "submarket" && typeof r.name === "string" && normalizar(r.name) === normalizar(bairro) && normalizar(r.parent_market?.name ?? "") === "sao paulo");
    if (areas.length !== 1 || !areas[0]?.id) return jsonColeta({ error: "A AirDNA não retornou um único submercado correspondente ao bairro. Não foi usada aproximação." }, 422);
    const area = areas[0];
    const hoje = new Date(), ini = new Date(`${inicio}T00:00:00Z`);
    const numMonths = Math.min(60, Math.max(12, (hoje.getUTCFullYear() - ini.getUTCFullYear()) * 12 + hoje.getUTCMonth() - ini.getUTCMonth() + 1));
    const filtros = [{ field: "listing_type", type: "select", value: "entire_place" }];
    const pedir = (metrica: string, extra = {}) => consultar(`/market/${encodeURIComponent(String(area.id))}/metrics/${metrica}`, { num_months: numMonths, filters: filtros, ...extra });
    const [occ, adr, anuncios] = await Promise.all([pedir("occupancy"), pedir("adr", { currency: "brl" }), pedir("active_listings_count")]);
    if (![occ.metrics, adr.metrics, anuncios.metrics].every(Array.isArray)) throw new Error("Séries AirDNA fora do formato esperado.");
    const previa = agregarAirDNA(occ.metrics as MesMetrica[], adr.metrics as MesMetrica[], anuncios.metrics as MesMetrica[], inicio, fim);
    // Só leitura: nem altera a base aprovada nem cria propostas de aprovação GuestFavorites.
    const { data: linhas, error: baseError } = await acesso.db.from("radar_observacoes").select("indicador,valor,periodo_inicio,periodo_fim,coletado_em,url_origem,amostra_n").eq("bairro", bairro).eq("cidade", "São Paulo").eq("fonte_id", "guestfavorites").eq("ativo", true).in("indicador", ["adr_medio_brl", "ocupacao_media_pct"]);
    if (baseError) return jsonColeta({ error: "AirDNA respondeu, mas não foi possível ler a referência GuestFavorites." }, 503);
    const diaria = linhas?.find((l) => l.indicador === "adr_medio_brl"), ocupacao = linhas?.find((l) => l.indicador === "ocupacao_media_pct");
    const base = diaria && ocupacao && diaria.periodo_inicio === ocupacao.periodo_inicio && diaria.periodo_fim === ocupacao.periodo_fim && diaria.coletado_em === ocupacao.coletado_em ? { adr_medio_brl: Number(diaria.valor), ocupacao_media_pct: Number(ocupacao.valor), periodo_inicio: diaria.periodo_inicio, periodo_fim: diaria.periodo_fim, coletado_em: diaria.coletado_em, url_origem: diaria.url_origem, amostra_n: diaria.amostra_n } : null;
    return jsonColeta({ fonte: "airdna", bairro, cidade: "São Paulo", periodo_inicio: inicio, periodo_fim: fim, coletado_em: hoje.toISOString(), moeda: "BRL", area: { id: area.id, nome: area.name }, filtros: "imóvel inteiro, todos os tamanhos; cobertura de plataformas conforme contrato AirDNA", metodologia: "Ocupação por noites reservadas/disponíveis; diária ponderada por noites reservadas.", ...previa, guestfavorites: base, comparacao: compararIndicadores(previa.indicadores, base, inicio, fim), persistido: false, url_origem: "https://app.airdna.co/data/performance" });
  } catch (e) {
    if (e instanceof FalhaFonte) return jsonColeta({ error: e.message, provider_status: e.status, details: e.detalhes }, e.status === 429 ? 429 : 502);
    return jsonColeta({ error: e instanceof Error ? e.message : "Falha ao consultar a fonte." }, 502);
  }
});