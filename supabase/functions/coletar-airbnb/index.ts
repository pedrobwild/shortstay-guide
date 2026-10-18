import { autenticarAdmin, jsonColeta, pedidoComparacao, preflightColeta } from "../_shared/coletaAdmin.ts";

/** Airbnb não disponibiliza uma API pública de ocupação por bairro. Sem scraping ou inferência de bloqueios. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflightColeta();
  if (req.method !== "POST") return jsonColeta({ error: "Método não permitido." }, 405);
  try {
    const acesso = await autenticarAdmin(req);
    if (acesso.resposta) return acesso.resposta;
    const parsed = pedidoComparacao.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonColeta({ error: parsed.error.issues[0]?.message ?? "Entrada inválida." }, 400);
    return jsonColeta({ fonte: "airbnb", status: "integracao_autorizada_necessaria", error: "Coleta direta de diária e ocupação por bairro indisponível: é necessário acesso autorizado a dados de mercado Airbnb.", indicadores: null, persistido: false, alternativa: "coletar-airdna", observacao: "Calendário indisponível pode significar bloqueio ou reserva; não é ocupação observada." }, 501);
  } catch {
    return jsonColeta({ error: "Não foi possível verificar o acesso." }, 503);
  }
});