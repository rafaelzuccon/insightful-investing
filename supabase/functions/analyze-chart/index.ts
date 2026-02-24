import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker, chartData, analysisType } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um analista técnico especializado em ações da B3 (bolsa brasileira). 
Responda SEMPRE em português brasileiro. Seja direto e técnico.
Use formatação com emojis para deixar a análise visualmente organizada.`;

    const analysisPrompts: Record<string, string> = {
      candlestick: `Analise os seguintes dados de candlestick da ação ${ticker} e identifique padrões de candlestick (como Doji, Martelo, Engolfo, Estrela da Manhã/Noite, Spinning Top, Marubozu, Harami, etc).

Para cada padrão encontrado:
- Nome do padrão
- Onde aparece (últimos candles)
- Se é sinal de alta ou baixa
- Confiabilidade do sinal (alta/média/baixa)
- O que sugere para os próximos dias

Dados dos últimos candles (date, open, high, low, close, volume):
${JSON.stringify(chartData)}

Finalize com uma conclusão geral dos padrões encontrados.`,

      forca: `Analise os seguintes dados de candlestick da ação ${ticker} focando em CANDLES DE FORÇA na análise gráfica.

Identifique:
- Candles com corpo grande (marubozu ou quase-marubozu) que indicam força compradora ou vendedora
- Sequências de candles na mesma direção que demonstram momentum
- Volume acima da média que confirma a força do movimento
- Candles de exaustão (corpo pequeno após sequência de corpo grande)
- Divergência entre tamanho do corpo e volume (sinal de alerta)

Para cada candle de força identificado:
- Data e tipo (comprador/vendedor)
- Tamanho relativo do corpo vs sombras
- Volume relativo
- Significado para a tendência

Dados (date, open, high, low, close, volume):
${JSON.stringify(chartData)}

Conclua com: a força predominante atual é compradora ou vendedora? O momentum está aumentando ou diminuindo?`,

      suporte_resistencia: `Analise os seguintes dados de candlestick da ação ${ticker} e identifique os principais níveis de SUPORTE e RESISTÊNCIA.

Identifique:
- Níveis de preço onde o ativo encontrou suporte (parou de cair) e quantas vezes testou
- Níveis de preço onde o ativo encontrou resistência (parou de subir) e quantas vezes testou
- Zonas de congestão (faixas de preço onde houve muita negociação)
- Se algum suporte foi rompido (vira resistência) ou vice-versa
- Proximidade do preço atual em relação aos suportes/resistências

Forneça:
- 2-3 níveis de suporte mais relevantes com preço exato
- 2-3 níveis de resistência mais relevantes com preço exato
- Análise de rompimento potencial
- Alvos caso rompa suporte ou resistência

Dados (date, open, high, low, close, volume):
${JSON.stringify(chartData)}

Conclua com: o preço atual está mais próximo de suporte ou resistência? Qual o cenário mais provável?`,
    };

    const userPrompt = analysisPrompts[analysisType];
    if (!userPrompt) throw new Error(`Invalid analysis type: ${analysisType}`);

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
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes para análise por I.A." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "Análise indisponível.";

    return new Response(
      JSON.stringify({ analysis: content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-chart error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
