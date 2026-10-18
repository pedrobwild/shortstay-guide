import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { URL_BAIRRO_GF, URL_CIDADE_GF, lerPaginaGuestFavorites, type LeituraGuestFavorites } from "./parser.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { chaveExternaValida } from "./authExterna.ts";

declare const EdgeRuntime: { waitUntil: (tarefa: Promise<unknown>) => void };

/**
 * Coleta assistida da GuestFavorites. Só admins chamam (JWT + has_role). Lê a página
 * pública de cada bairro da base (e a da cidade), compara com a observação ativa e grava
 * PROPOSTAS em radar_coletas_pendentes. Nada entra em radar_observacoes aqui: o admin
 * aprova ou descarta em /admin/coletas (admin_aprovar_coleta_pendente usa a RPC de
 * sempre, com as mesmas validações e o histórico preservado).
 *
 * Regras: só a fonte "guestfavorites"; bairros de aproximação/estimativa (Brooklin, Vila
 * Olímpia) ficam de fora — não têm página própria. Página sem leitura completa vira
 * proposta com status "erro" (fica registrado que a leitura falhou, sem número inventado).
 */
const CIDADE = "São Paulo";
const INDICADORES = ["adr_medio_brl", "ocupacao_media_pct", "adr_p25_brl", "adr_mediana_brl", "adr_p75_brl", "anuncios_ativos"] as const;

type LinhaAtual = { bairro: string; indicador: string; valor: number; fonte_id: string; periodo_inicio: string | null; periodo_fim: string | null; coletado_em: string; amostra_n: number | null };

function indicadoresDe(l: LeituraGuestFavorites): Record<string, number> {
  const ind: Record<string, number> = { adr_medio_brl: l.adrBrl, ocupacao_media_pct: l.ocupacaoPct };
  if (l.quartis) { ind.adr_p25_brl = l.quartis[0]; ind.adr_mediana_brl = l.quartis[1]; ind.adr_p75_brl = l.quartis[2]; }
  return ind;
}

/** true quando algum número, o período ou a amostra mudou em relação à observação ativa. */
function mudou(l: LeituraGuestFavorites, atual: Record<string, number> | null, atualPeriodo: { inicio: string | null; fim: string | null } | null, atualN: number | null): boolean {
  if (!atual) return true;
  const novo = { ...indicadoresDe(l), anuncios_ativos: l.anuncios };
  for (const k of INDICADORES) if (Number(atual[k] ?? NaN) !== Number(novo[k] ?? NaN)) return true;
  if (atualN !== l.anuncios) return true;
  if (atualPeriodo?.inicio !== l.periodoInicio || atualPeriodo?.fim !== l.periodoFim) return true;
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anon || !service) return json({ error: "Configuração da coleta indisponível." }, 503);
    const externa = await chaveExternaValida(req.headers.get("x-coleta-key"), Deno.env.get("GUESTFAVORITES_SCHEDULE_KEY"));
    const auth = req.headers.get("Authorization") ?? "";
    if (!externa && !auth.startsWith("Bearer ")) return json({ error: "Faça login como administrador." }, 401);

    // Quem chama: valida o JWT e o papel de admin com o cliente do próprio usuário.
    if (!externa) {
    const comoUsuario = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: userData, error: userErr } = await comoUsuario.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sessão inválida." }, 401);
    const { data: ehAdmin } = await comoUsuario.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!ehAdmin) return json({ error: "Acesso exclusivo de administrador." }, 403);
    }

    const db = createClient(url, service);
    const { data: execucaoId, error: inicioErro } = await db.rpc("iniciar_execucao_guestfavorites", { p_origem: externa ? "externa" : "manual" });
    if (inicioErro) throw inicioErro;
    if (!execucaoId) return json({ error: "Já existe uma leitura em andamento." }, 409);
    const executar = async () => {
    try {
    const hoje = new Date().toISOString().slice(0, 10);

    // Bairros da base com fonte GuestFavorites (aproximação/estimativa não têm página própria) + a cidade.
    const { data: atuais, error: atuaisErr } = await db
      .from("radar_bairro_atual")
      .select("bairro, indicador, valor, fonte_id, periodo_inicio, periodo_fim, coletado_em, amostra_n")
      .eq("cidade", CIDADE);
    if (atuaisErr) throw atuaisErr;
    const porBairro = new Map<string, LinhaAtual[]>();
    for (const l of (atuais ?? []) as LinhaAtual[]) porBairro.set(l.bairro, [...(porBairro.get(l.bairro) ?? []), l]);

    const alvos = [...porBairro.entries()]
      .filter(([, ls]) => ls.some((l) => l.fonte_id === "guestfavorites"))
      .map(([bairro]) => ({ bairro, url: bairro === CIDADE ? URL_CIDADE_GF : URL_BAIRRO_GF(bairro) }));

    const resultado = { lidos: 0, propostas: 0, semMudanca: 0, erros: [] as string[], bairros: [] as { bairro: string; status: string }[] };
    for (const alvo of alvos) {
      let leitura: LeituraGuestFavorites | null = null;
      let erro: string | null = null;
      try {
        const r = await fetch(alvo.url, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "RadarBewild/1.0 (coleta assistida; contato: bewild.com.br)" } });
        if (!r.ok) erro = `HTTP ${r.status}`;
        else leitura = lerPaginaGuestFavorites(await r.text());
        if (!erro && !leitura) erro = "página sem os campos esperados";
      } catch (e) {
        erro = e instanceof Error ? e.message : String(e);
      }
      resultado.lidos += 1;
      const linhas = porBairro.get(alvo.bairro) ?? [];
      const atualGf = linhas.filter((l) => l.fonte_id === "guestfavorites");
      const atual: Record<string, number> | null = atualGf.length ? Object.fromEntries(atualGf.map((l) => [l.indicador, Number(l.valor)])) : null;
      const atualPeriodo = atualGf[0] ? { inicio: atualGf[0].periodo_inicio, fim: atualGf[0].periodo_fim } : null;
      const atualN = atualGf[0]?.amostra_n ?? null;

      if (erro || !leitura) {
        resultado.erros.push(`${alvo.bairro}: ${erro}`);
        resultado.bairros.push({ bairro: alvo.bairro, status: "erro" });
        continue;
      }
      if (!mudou(leitura, atual, atualPeriodo, atualN)) {
        resultado.semMudanca += 1;
        resultado.bairros.push({ bairro: alvo.bairro, status: "sem mudança" });
        continue;
      }
      const proposta = {
        bairro: alvo.bairro, cidade: CIDADE, fonte_id: "guestfavorites",
        periodo_inicio: leitura.periodoInicio, periodo_fim: leitura.periodoFim,
        coletado_em: hoje, publicado_em: leitura.atualizadoEm, amostra_n: leitura.anuncios, url_origem: alvo.url,
        indicadores: indicadoresDe(leitura),
        atual: atual ? { ...atual, periodo_inicio: atualPeriodo?.inicio, periodo_fim: atualPeriodo?.fim, coletado_em: atualGf[0]?.coletado_em } : null,
        status: "pendente",
      };
      // Uma decisão do admin não pode voltar a pendente ao repetir a leitura.
      const { data: existente, error: consultaErro } = await db.from("radar_coletas_pendentes").select("status")
        .eq("bairro", alvo.bairro).eq("cidade", CIDADE).eq("fonte_id", "guestfavorites")
        .eq("periodo_inicio", leitura.periodoInicio).eq("periodo_fim", leitura.periodoFim).eq("coletado_em", hoje).maybeSingle();
      if (consultaErro) throw consultaErro;
      if (existente && existente.status !== "pendente") continue;
      // Uma proposta por bairro/período/dia: repetir a leitura no mesmo dia só atualiza a pendente.
      const { error: upErr } = await db.from("radar_coletas_pendentes").upsert(proposta, { onConflict: "bairro,cidade,fonte_id,periodo_inicio,periodo_fim,coletado_em" });
      if (upErr) {
        resultado.erros.push(`${alvo.bairro}: ${upErr.message}`);
        resultado.bairros.push({ bairro: alvo.bairro, status: "erro" });
        continue;
      }
      resultado.propostas += 1;
      resultado.bairros.push({ bairro: alvo.bairro, status: "proposta" });
    }
    const { error: fimErro } = await db.from("radar_coleta_execucoes").update({ status: resultado.erros.length ? "parcial" : "concluida", finalizado_em: new Date().toISOString(), lidos: resultado.lidos, propostas: resultado.propostas, sem_mudanca: resultado.semMudanca, erros: resultado.erros }).eq("id", execucaoId);
    if (fimErro) throw fimErro;
    return resultado;
    } catch (e) {
      await db.from("radar_coleta_execucoes").update({ status: "erro", finalizado_em: new Date().toISOString(), erros: ["Não foi possível concluir a leitura. Tente novamente."] }).eq("id", execucaoId);
      throw e;
    }
    };
    if (externa) {
      EdgeRuntime.waitUntil(executar().catch(() => console.error("[coletar-guestfavorites] execução externa não concluída")));
      return json({ status: "aceita", execucao_id: execucaoId }, 202);
    }
    return json(await executar());
  } catch (e) {
    console.error("[coletar-guestfavorites]", e);
    return json({ error: e instanceof Error ? e.message : "Erro inesperado" }, 500);
  }
});
