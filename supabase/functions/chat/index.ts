import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um consultor especialista em investimento imobiliário para short-stay (aluguel de curta temporada) em São Paulo, Brasil. Seu foco é em studios e apartamentos compactos para plataformas como Airbnb.

Você conhece profundamente:
- Mercado de short-stay em São Paulo: bairros, diárias médias, ocupação, sazonalidade
- Análise de ROI e payback para studios
- Tendências do mercado imobiliário 2025-2026
- Precificação dinâmica e estratégias de revenue management
- Regulamentação e aspectos legais do aluguel por temporada em SP
- Comparação entre bairros: Pinheiros, Itaim Bibi, Jardim Paulista, Consolação, Bela Vista, Moema, Vila Mariana, Barra Funda, Campo Belo, República, Santana, Itaquera
- Dados de mercado: diárias médias por faixa de metragem (20-25m², 26-35m², 36-50m²)
- Impacto de eventos (Lollapalooza, F1, Fashion Week, CCXP) na demanda
- Proximidade do metrô e valorização

Diretrizes:
- Responda sempre em português brasileiro
- Seja direto e prático nas recomendações
- Use dados e números quando possível
- Considere o perfil do investidor ao dar recomendações
- Mencione riscos e pontos de atenção
- Seja conciso mas completo`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
