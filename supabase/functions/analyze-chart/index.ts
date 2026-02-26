import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = {
  candlestick: [
    {
      type: "function",
      function: {
        name: "candlestick_analysis",
        description: "Retorna análise de padrões candlestick encontrados, incluindo Bullish e Bearish",
        parameters: {
          type: "object",
          properties: {
            sinal: {
              type: "string",
              enum: ["alta", "baixa", "neutro"],
              description: "Sinal predominante dos padrões encontrados",
            },
            confianca: {
              type: "string",
              enum: ["alta", "média", "baixa"],
              description: "Confiabilidade geral da análise",
            },
            padroes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string", description: "Nome do padrão (ex: Doji, Martelo, Engulfing)" },
                  tipo: { type: "string", enum: ["bullish", "bearish", "neutro"] },
                  descricao: { type: "string", description: "Explicação curta em 1 frase" },
                  data: { type: "string", description: "Data onde o padrão ocorre (formato DD/MM do gráfico)" },
                },
                required: ["nome", "tipo", "descricao", "data"],
                additionalProperties: false,
              },
              description: "Top 3-5 padrões mais relevantes encontrados, incluindo bullish e bearish",
            },
            resumo_bullish: { type: "string", description: "Resumo em 1 frase dos sinais bullish encontrados" },
            resumo_bearish: { type: "string", description: "Resumo em 1 frase dos sinais bearish encontrados" },
            conclusao: { type: "string", description: "Conclusão em no máximo 2 frases curtas" },
          },
          required: ["sinal", "confianca", "padroes", "resumo_bullish", "resumo_bearish", "conclusao"],
          additionalProperties: false,
        },
      },
    },
  ],
  forca: [
    {
      type: "function",
      function: {
        name: "forca_analysis",
        description: "Retorna análise de candles de força",
        parameters: {
          type: "object",
          properties: {
            forca_predominante: {
              type: "string",
              enum: ["compradora", "vendedora", "equilibrada"],
            },
            momentum: {
              type: "string",
              enum: ["aumentando", "estável", "diminuindo"],
            },
            pontos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string", description: "Título curto do ponto (ex: 'Marubozu de alta em 12/02')" },
                  descricao: { type: "string", description: "Explicação em 1 frase" },
                  tipo: { type: "string", enum: ["positivo", "negativo", "neutro"] },
                },
                required: ["titulo", "descricao", "tipo"],
                additionalProperties: false,
              },
              description: "2-4 observações mais relevantes",
            },
            conclusao: { type: "string", description: "Conclusão em no máximo 2 frases curtas" },
          },
          required: ["forca_predominante", "momentum", "pontos", "conclusao"],
          additionalProperties: false,
        },
      },
    },
  ],
  suporte_resistencia: [
    {
      type: "function",
      function: {
        name: "suporte_resistencia_analysis",
        description: "Retorna análise de suporte e resistência",
        parameters: {
          type: "object",
          properties: {
            posicao_atual: {
              type: "string",
              enum: ["proximo_suporte", "proximo_resistencia", "meio_do_canal"],
            },
            suportes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  preco: { type: "number" },
                  forca: { type: "string", enum: ["forte", "moderado", "fraco"] },
                  testes: { type: "number", description: "Quantas vezes testou" },
                },
                required: ["preco", "forca", "testes"],
                additionalProperties: false,
              },
              description: "2-3 suportes principais",
            },
            resistencias: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  preco: { type: "number" },
                  forca: { type: "string", enum: ["forte", "moderado", "fraco"] },
                  testes: { type: "number" },
                },
                required: ["preco", "forca", "testes"],
                additionalProperties: false,
              },
              description: "2-3 resistências principais",
            },
            conclusao: { type: "string", description: "Conclusão em no máximo 2 frases curtas" },
          },
          required: ["posicao_atual", "suportes", "resistencias", "conclusao"],
          additionalProperties: false,
        },
      },
    },
  ],
};

const toolChoices: Record<string, any> = {
  candlestick: { type: "function", function: { name: "candlestick_analysis" } },
  forca: { type: "function", function: { name: "forca_analysis" } },
  suporte_resistencia: { type: "function", function: { name: "suporte_resistencia_analysis" } },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker, chartData, analysisType } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um analista técnico de ações da B3. Seja conciso e direto. Analise apenas os dados fornecidos.`;

    const prompts: Record<string, string> = {
      candlestick: `Identifique 3-5 padrões de candlestick nos dados de ${ticker}, classificando cada um como BULLISH (alta) ou BEARISH (baixa). Inclua a data exata (DD/MM) onde cada padrão aparece. Identifique padrões como: Hammer, Inverted Hammer, Engulfing (bullish/bearish), Doji, Morning/Evening Star, Shooting Star, Hanging Man, Three White Soldiers, Three Black Crows, etc. Dados: ${JSON.stringify(chartData)}`,
      forca: `Analise os candles de força (corpo grande, volume, momentum) nos dados de ${ticker}. Dados: ${JSON.stringify(chartData)}`,
      suporte_resistencia: `Identifique suportes e resistências nos dados de ${ticker}. Dados: ${JSON.stringify(chartData)}`,
    };

    const userPrompt = prompts[analysisType];
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
          tools: tools[analysisType as keyof typeof tools],
          tool_choice: toolChoices[analysisType],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    
    // Extract structured data from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let analysis: any;
    
    if (toolCall?.function?.arguments) {
      try {
        analysis = JSON.parse(toolCall.function.arguments);
      } catch {
        analysis = null;
      }
    }
    
    // Fallback to plain text
    if (!analysis) {
      const content = data.choices?.[0]?.message?.content ?? "";
      analysis = { fallback: content };
    }

    return new Response(
      JSON.stringify({ analysis, type: analysisType }),
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
