import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Base única: diária, ocupação, quartis, amostra e fonte vêm da view radar_bairro_atual.
type Curado = { media: number; ocupacao: number; quartis?: number[]; anuncios?: number; periodo?: string; url?: string; gf: boolean; licenciada: boolean; aproximacao: boolean; fonte: string; coleta: string; confianca: string; amostraPequena: boolean; desatualizado: boolean };
const MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const periodo = (i?: string | null, f?: string | null) => i && f ? `${MESES[+i.slice(5,7)-1]}–${MESES[+f.slice(5,7)-1]}/${f.slice(0,4)}` : undefined;
const fmtD = (d: string) => d.split("-").reverse().join("/");
const normNome = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

async function loadBairrosContext(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: bairros, error } = await supabase
    .from("bairro_airbnb_sp")
    .select("*")
    .order("score_rentabilidade", { ascending: false });

  if (error || !bairros?.length) {
    console.error("Error loading bairros:", error);
    return "Dados dos bairros indisponíveis no momento.";
  }

  const { data: radar, error: radarError } = await supabase.from("radar_bairro_atual").select("*").eq("cidade", "São Paulo");
  if (radarError) console.error("Error loading radar:", radarError);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- linhas da view sem tipos gerados no Deno
  const grupos = new Map<string, Record<string, any>>();
  for (const r of radar ?? []) {
    const k = normNome(r.bairro);
    if (!grupos.has(k)) grupos.set(k, {});
    grupos.get(k)![r.indicador] = r;
  }
  const curado = (nome: string): Curado | undefined => {
    const g = grupos.get(normNome(nome));
    const adr = g?.adr_medio_brl, occ = g?.ocupacao_media_pct;
    if (!adr || !occ) return undefined;
    const gfOk = adr.fonte_tipo !== "estimativa";
    const q = [g.adr_p25_brl, g.adr_mediana_brl, g.adr_p75_brl];
    return {
      media: Number(adr.valor), ocupacao: Number(occ.valor), gf: gfOk, fonte: adr.fonte_nome, coleta: adr.coletado_em,
      confianca: adr.confianca === "baixa" || occ.confianca === "baixa" ? "baixa" : adr.confianca === "media" || occ.confianca === "media" ? "média" : "alta",
      licenciada: adr.fonte_tipo === "licenciada",
      aproximacao: adr.fonte_id === "aproximacao_itaim_bibi",
      amostraPequena: ["publica", "licenciada"].includes(adr.fonte_tipo) && (adr.confianca === "baixa" || occ.confianca === "baixa") && adr.amostra_n != null && Number(adr.amostra_n) < 200,
      desatualizado: ["publica", "licenciada"].includes(adr.fonte_tipo) && Number(adr.idade_dias) > 240,
      anuncios: adr.amostra_n != null ? Number(adr.amostra_n) : undefined,
      periodo: periodo(adr.periodo_inicio, adr.periodo_fim), url: adr.url_origem,
      ...((gfOk || adr.fonte_id === "aproximacao_itaim_bibi") && q.every(Boolean) ? { quartis: q.map((x) => Number(x.valor)) } : {}),
    };
  };
  const sp = curado("São Paulo");

  const lines = bairros.map((b) => {
    const c = curado(b.bairro);
    const precoEstudio = (b.preco_m2_residencial_medio ?? 0) * (b.area_media_estudio ?? 30);
    const est = `(estimativa de mercado — base 2025, ${b.periodo_inicio} a ${b.periodo_fim}, confiança ${b.nivel_confianca_dados})`;
    const curadas = c
      ? [
          `- Diária média (ADR): R$${c.media}`,
          `- Ocupação: ${c.ocupacao}%`,
          ...(c.quartis ? [
            `- Diária: 25% mais baratos / mediana / 25% mais caros: R$${c.quartis.join(" / R$")}`,
          ] : []),
          `- Fonte: ${c.fonte}${c.periodo ? `, ${c.periodo}` : ""}${c.url ? ` (${c.url})` : ""}; coleta de ${fmtD(c.coleta)}; confiança ${c.confianca}${c.gf ? (c.licenciada ? " — dado licenciado (AirDNA, API paga), não estimativa" : " — dado público, não estimativa") : c.aproximacao ? " — aproximação pelo Itaim Bibi, distrito que inclui a Vila Olímpia e parte do Brooklin (sem dado público por bairro; não há anúncios ativos por bairro)" : " — estimativa (sem fonte pública atualizada)"}`,
          ...(c.anuncios != null ? [`- Amostra: ${c.anuncios} anúncios${c.amostraPequena ? " — amostra pequena" : ""}`] : []),
          ...(c.desatualizado ? [`- Dado desatualizado: coleta de ${fmtD(c.coleta)} (há mais de 240 dias).`] : []),
          `- Receita mensal de referência (diária média × 30 × ocupação): R$${Math.round(c.media * 30 * c.ocupacao / 100)}`,
        ]
      : [
          `- ADR médio ${est}: R$${Number(b.adr_medio_studio).toFixed(0)}`,
          `- Ocupação média ${est}: ${(Number(b.ocupacao_media_studio) * 100).toFixed(1)}%`,
          `- Receita anual média (studio) ${est}: R$${Number(b.receita_anual_media_studio).toFixed(0)}`,
        ];
    return [
      `## ${b.bairro}`,
      ...curadas,
      `- Demais métricas abaixo: ${est}`,
      `- Preço m² residencial: R$${Number(b.preco_m2_residencial_medio).toFixed(0)}`,
      `- Preço estimado studio (${b.area_media_estudio}m²): R$${precoEstudio.toFixed(0)}`,
      `- Aluguel mensal long-term: R$${Number(b.aluguel_mensal_long_term_medio).toFixed(0)}`,
      ...(c ? [] : [
        `- Yield bruto Airbnb: ${(Number(b.yield_bruto_airbnb) * 100).toFixed(2)}%`,
        `- Delta yield (Airbnb - long-term): ${(Number(b.delta_yield) * 100).toFixed(2)}pp`,
      ]),
      `- Yield bruto long-term: ${(Number(b.yield_bruto_long_term) * 100).toFixed(2)}%`,
      `- Score Rentabilidade: ${Number(b.score_rentabilidade).toFixed(1)}/100`,
      `- Score Liquidez: ${Number(b.score_liquidez).toFixed(1)}/100`,
      `- Score Crescimento Potencial: ${Number(b.score_crescimento_potencial).toFixed(1)}/100`,
      `- Listings total: ${b.n_listings_total} | Studios/1Q: ${b.n_listings_studio_1q} (${(Number(b.pct_studio_1q) * 100).toFixed(1)}%)`,
      `- Rating médio: ${Number(b.rating_medio).toFixed(2)} | Superhosts: ${(Number(b.percentual_superhost) * 100).toFixed(1)}%`,
      `- Grau saturação: ${Number(b.grau_saturacao_index).toFixed(2)} | Risco regulatório: ${Number(b.risco_regulatorio).toFixed(2)}`,
      `- Dias médios venda imóvel: ${b.dias_medio_venda_imovel} | Transações/ano: ${b.numero_transacoes_imobiliarias_ano}`,
    ].join("\n");
  });

  const ref = sp ? `Referência da cidade de São Paulo — ${sp.fonte}, ${sp.periodo ?? ""}, coleta de ${fmtD(sp.coleta)}: ocupação ${sp.ocupacao}%, ADR R$${sp.media}.` : "Referência da cidade indisponível.";
  return `${ref}\n\n${lines.join("\n\n")}`;
}

async function loadListingsStats(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { count } = await supabase
    .from("raw_listings")
    .select("*", { count: "exact", head: true });

  return `Total de listings na base bruta: ${count ?? 0}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, projectContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // O contexto do projeto é construído no front a partir de dados já filtrados
    // por RLS para o usuário logado (nunca consultamos o projeto de outra conta
    // aqui). Tratamos como entrada não confiável: validamos o tipo e limitamos o
    // tamanho para evitar abuso do prompt.
    const projectBlock =
      typeof projectContext === "string" && projectContext.trim().length > 0
        ? projectContext.slice(0, 4000)
        : null;

    // Load real data from database
    const [bairrosContext, listingsStats] = await Promise.all([
      loadBairrosContext(),
      loadListingsStats(),
    ]);

    const SYSTEM_PROMPT = `Você é um consultor especialista em investimento imobiliário para short-stay (aluguel de curta temporada) em São Paulo, Brasil. Seu foco é em studios e apartamentos compactos para plataformas como Airbnb.

Você tem acesso à base única de dados de mercado do Radar Bewild (fonte, período, data de coleta, amostra e confiança por bairro) e a estimativas de mercado — base 2025 da plataforma Short Stay Intelligence. Diferencie sempre as fontes; cite o período e o link do bairro. Apenas fontes do tipo estimativa devem ser chamadas de estimativa (veja a linha "Fonte" de cada bairro). Quando a fonte for AirDNA (dado licenciado), diga "AirDNA" e o período; nunca atribua GuestFavorites a esses bairros nem AirDNA aos demais. Confiança baixa NÃO transforma um dado público em estimativa: a Mooca é dado público GuestFavorites com amostra pequena (85 anúncios), não estimativa. Para fonte pública com confiança baixa e amostra menor que 200, informe "amostra pequena" e o número de anúncios, sem repetir o aviso. Para fonte pública com coleta há mais de 240 dias, informe "dado desatualizado" e a data da coleta. Use esses dados para fundamentar suas respostas com números precisos. Sempre que possível, cite os dados abaixo em vez de inventar números.

# DADOS REAIS DOS BAIRROS (ordenados por Score Rentabilidade)

${bairrosContext}

# ESTATÍSTICAS DA BASE

${listingsStats}

# CONTEXTO DO PROJETO DESTE CLIENTE

${
  projectBlock
    ? `Estes são os dados REAIS do projeto do usuário com quem você está falando. Quando ele perguntar sobre "meu studio", "meu projeto", "minha projeção", "meu bairro" ou "meu ROI", responda EXCLUSIVAMENTE com os números abaixo — são os números dele, não estime nem invente.\n\n${projectBlock}`
    : "O usuário não tem um projeto ativo carregado nesta conversa. Responda com base nos dados gerais de mercado dos bairros acima e convide-o a criar um projeto no painel ou a usar o botão Peça seu orçamento da Bewild para uma proposta."
}

# FÓRMULAS UTILIZADAS

- Preço estimado studio = preço_m2 × área_media_estudio
- Yield bruto Airbnb = receita_anual_media_studio / preço_estimado_studio
- Yield bruto long-term = (aluguel_mensal × 12) / preço_estimado_studio
- Delta yield = yield Airbnb − yield long-term
- Score Rentabilidade (0-100): 40% yield Airbnb + 30% ocupação + 20% delta yield + 10% (1 − saturação)
- Score Liquidez (0-100): 50% velocidade venda + 30% transações + 20% acessibilidade preço
- Score Crescimento (0-100): 35% lançamentos + 25% crescimento ADR + 25% crescimento ocupação + 15% infraestrutura

# DIRETRIZES

- Responda sempre em português brasileiro
- Use os dados reais acima para fundamentar suas respostas — cite números específicos
- Quando houver "CONTEXTO DO PROJETO DESTE CLIENTE", ancore as respostas sobre o projeto/studio dele nesses números (ROI, receita líquida anual, ocupação, payback, bairro, área)
- Quando o usuário perguntar sobre um bairro, use os dados exatos da plataforma
- Seja direto e prático nas recomendações
- Considere o perfil do investidor ao dar recomendações
- Mencione riscos e pontos de atenção (saturação, risco regulatório)
- Seja conciso mas completo

# GUARDRAILS (regras invioláveis)

- NUNCA invente, estime ou arredonde números que não estejam nos dados reais dos bairros ou no contexto do projeto do cliente. Não há "achismo".
- Se um dado não estiver disponível (ex.: ROI sem valor do imóvel informado, ou um bairro fora dos 15 analisados), diga claramente que NÃO tem esse dado e NÃO o invente.
- Se perguntarem sobre algo fora dos 15 bairros analisados, informe que não temos dados para aquele bairro.
- Quando faltar dado, quando o usuário quiser avançar/fechar negócio, ou quando a pergunta exigir análise personalizada além do que os dados permitem, encaminhe ao time humano: convide-o a usar o botão "Peça seu orçamento" no próprio chat, que abre https://bewild.com.br/orcamento?utm_source=radar&utm_medium=referral&utm_campaign=radar_bewild&utm_content=chat. Não ofereça diagnóstico nem prometa resposta em 24 horas. Use sempre a marca Bewild, nunca Bewild ou Bewild.
- Use apenas o contexto do projeto fornecido nesta conversa; nunca presuma dados de outros usuários ou projetos.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro no serviço de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
