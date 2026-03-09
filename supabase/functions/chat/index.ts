import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

  const lines = bairros.map((b: any) => {
    const precoEstudio = (b.preco_m2_residencial_medio ?? 0) * (b.area_media_estudio ?? 30);
    return [
      `## ${b.bairro}`,
      `- ADR médio: R$${Number(b.adr_medio_studio).toFixed(0)}`,
      `- Ocupação média: ${(Number(b.ocupacao_media_studio) * 100).toFixed(1)}%`,
      `- Receita anual média (studio): R$${Number(b.receita_anual_media_studio).toFixed(0)}`,
      `- Preço m² residencial: R$${Number(b.preco_m2_residencial_medio).toFixed(0)}`,
      `- Preço estimado studio (${b.area_media_estudio}m²): R$${precoEstudio.toFixed(0)}`,
      `- Aluguel mensal long-term: R$${Number(b.aluguel_mensal_long_term_medio).toFixed(0)}`,
      `- Yield bruto Airbnb: ${(Number(b.yield_bruto_airbnb) * 100).toFixed(2)}%`,
      `- Yield bruto long-term: ${(Number(b.yield_bruto_long_term) * 100).toFixed(2)}%`,
      `- Delta yield (Airbnb - long-term): ${(Number(b.delta_yield) * 100).toFixed(2)}pp`,
      `- Score Rentabilidade: ${Number(b.score_rentabilidade).toFixed(1)}/100`,
      `- Score Liquidez: ${Number(b.score_liquidez).toFixed(1)}/100`,
      `- Score Crescimento Potencial: ${Number(b.score_crescimento_potencial).toFixed(1)}/100`,
      `- Listings total: ${b.n_listings_total} | Studios/1Q: ${b.n_listings_studio_1q} (${(Number(b.pct_studio_1q) * 100).toFixed(1)}%)`,
      `- Rating médio: ${Number(b.rating_medio).toFixed(2)} | Superhosts: ${(Number(b.percentual_superhost) * 100).toFixed(1)}%`,
      `- Grau saturação: ${Number(b.grau_saturacao_index).toFixed(2)} | Risco regulatório: ${Number(b.risco_regulatorio).toFixed(2)}`,
      `- Dias médios venda imóvel: ${b.dias_medio_venda_imovel} | Transações/ano: ${b.numero_transacoes_imobiliarias_ano}`,
      `- Nível confiança: ${b.nivel_confianca_dados}`,
      `- Período: ${b.periodo_inicio} a ${b.periodo_fim}`,
    ].join("\n");
  });

  return lines.join("\n\n");
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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Load real data from database
    const [bairrosContext, listingsStats] = await Promise.all([
      loadBairrosContext(),
      loadListingsStats(),
    ]);

    const SYSTEM_PROMPT = `Você é um consultor especialista em investimento imobiliário para short-stay (aluguel de curta temporada) em São Paulo, Brasil. Seu foco é em studios e apartamentos compactos para plataformas como Airbnb.

Você tem acesso a DADOS REAIS da plataforma Short Stay Intelligence. Use esses dados para fundamentar suas respostas com números precisos. Sempre que possível, cite os dados abaixo em vez de inventar números.

# DADOS REAIS DOS BAIRROS (ordenados por Score Rentabilidade)

${bairrosContext}

# ESTATÍSTICAS DA BASE

${listingsStats}

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
- Quando o usuário perguntar sobre um bairro, use os dados exatos da plataforma
- Seja direto e prático nas recomendações
- Considere o perfil do investidor ao dar recomendações
- Mencione riscos e pontos de atenção (saturação, risco regulatório)
- Seja conciso mas completo
- Se perguntarem sobre algo fora dos 15 bairros analisados, informe que não temos dados para aquele bairro`;

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
