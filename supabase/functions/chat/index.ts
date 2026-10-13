import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Espelho da coleta aprovada de src/data/bairrosCurados.ts, 13/10/2026.
const gf = (media: number, ocupacao: number, quartis: [number, number, number], anuncios: number, periodo: string, slug: string) => ({
  media, ocupacao, quartis, anuncios, periodo, gf: true,
  url: `https://www.guestfavorites.com/airbnb-occupancy-rates-in-${slug}-sao-paulo-brazil`,
});
const BAIRROS_CURADOS = {
  "bela vista": gf(237, 64, [140, 198, 256], 1983, "jan–set/2026", "bela-vista"),
  "brooklin": { media: 360, ocupacao: 75, gf: false },
  "consolacao": { media: 325, ocupacao: 63, gf: false },
  "itaim bibi": gf(359, 59, [180, 279, 404], 3884, "jan–set/2026", "itaim-bibi"),
  "jardim paulista": gf(319, 62, [183, 251, 327], 3147, "jan–set/2026", "jardim-paulista"),
  "liberdade": gf(230, 61, [132, 195, 251], 553, "jan–jul/2026", "liberdade"),
  "moema": gf(263, 61, [167, 225, 288], 2621, "jan–set/2026", "moema"),
  "pinheiros": gf(300, 62, [171, 232, 301], 2424, "jan–set/2026", "pinheiros"),
  "republica": gf(203, 63, [117, 166, 210], 3079, "jan–jul/2026", "republica"),
  "vila mariana": gf(226, 60, [143, 194, 235], 2238, "jan–set/2026", "vila-mariana"),
  "vila olimpia": { media: 415, ocupacao: 79, gf: false },
  "mooca": gf(241, 59, [27, 195, 268], 85, "jan–set/2026", "mooca"),
  "perdizes": gf(254, 53, [174, 217, 276], 1752, "jan–set/2026", "perdizes"),
};
const SAO_PAULO_REFERENCIA = { ocupacao: 60, media: 266, anuncios: 34854, periodo: "jan–set/2026" };
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

  const lines = bairros.map((b) => {
    const c = BAIRROS_CURADOS[normNome(b.bairro) as keyof typeof BAIRROS_CURADOS];
    const precoEstudio = (b.preco_m2_residencial_medio ?? 0) * (b.area_media_estudio ?? 30);
    const est = `(estimativa de mercado — base 2025, ${b.periodo_inicio} a ${b.periodo_fim}, confiança ${b.nivel_confianca_dados})`;
    const curadas = c
      ? [
          `- Diária média (ADR): R$${c.media}`,
          `- Ocupação: ${c.ocupacao}%`,
          ...("quartis" in c ? [
            `- Diária: 25% mais baratos / mediana / 25% mais caros: R$${c.quartis.join(" / R$")}`,
            `- Anúncios ativos: ${c.anuncios}${b.bairro === "Mooca" ? " — amostra pequena (85 anúncios)" : ""}`,
            `- Fonte: GuestFavorites, ${c.periodo} (${c.url}); coleta de 13/10/2026`,
          ] : ["- Fonte: estimativa Bewild (sem fonte pública atualizada)"]),
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

  return `Referência da cidade de São Paulo — GuestFavorites, ${SAO_PAULO_REFERENCIA.periodo}, coleta de 13/10/2026: ocupação ${SAO_PAULO_REFERENCIA.ocupacao}%, ADR R$${SAO_PAULO_REFERENCIA.media}, ${SAO_PAULO_REFERENCIA.anuncios} anúncios.\n\n${lines.join("\n\n")}`;
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

Você tem acesso à coleta pública GuestFavorites de 13/10/2026 e a estimativas de mercado — base 2025 da plataforma Short Stay Intelligence. Diferencie sempre as fontes; cite o período e o link do bairro, e avise sobre a amostra pequena da Mooca. Brooklin, Consolação e Vila Olímpia são estimativa Bewild (sem fonte pública atualizada), nunca GuestFavorites. Use esses dados para fundamentar suas respostas com números precisos. Sempre que possível, cite os dados abaixo em vez de inventar números.

# DADOS REAIS DOS BAIRROS (ordenados por Score Rentabilidade)

${bairrosContext}

# ESTATÍSTICAS DA BASE

${listingsStats}

# CONTEXTO DO PROJETO DESTE CLIENTE

${
  projectBlock
    ? `Estes são os dados REAIS do projeto do usuário com quem você está falando. Quando ele perguntar sobre "meu studio", "meu projeto", "minha projeção", "meu bairro" ou "meu ROI", responda EXCLUSIVAMENTE com os números abaixo — são os números dele, não estime nem invente.\n\n${projectBlock}`
    : "O usuário não tem um projeto ativo carregado nesta conversa. Responda com base nos dados gerais de mercado dos bairros acima e convide-o a criar um projeto no painel ou a falar com um especialista BWild para uma análise personalizada."
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
- Quando faltar dado, quando o usuário quiser avançar/fechar negócio, ou quando a pergunta exigir análise personalizada além do que os dados permitem, encaminhe ao time humano: convide-o a usar o botão "Falar com um especialista BWild" no próprio chat.
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
