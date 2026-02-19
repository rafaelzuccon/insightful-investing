import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TICKERS = [
  "PETR4", "VALE3", "ITUB4", "WEGE3", "BBAS3", "RENT3", "ABEV3", "ELET3",
  "SUZB3", "BBDC4", "MGLU3", "B3SA3", "RADL3", "VIVT3", "TOTS3", "HAPV3",
  "CSAN3", "SBSP3", "PRIO3", "ENEV3",
  "CASH3", "LWSA3", "MBLY3", "AZUL4", "IRBR3", "SMFT3", "COGN3", "AERI3",
  "PETZ3", "BHIA3", "MOVI3", "INTB3",
];

const COMPANY_NAMES: Record<string, string> = {
  PETR4: "Petrobras", VALE3: "Vale", ITUB4: "Itaú", WEGE3: "WEG",
  BBAS3: "Banco do Brasil", RENT3: "Localiza", ABEV3: "Ambev", ELET3: "Eletrobras",
  SUZB3: "Suzano", BBDC4: "Bradesco", MGLU3: "Magazine Luiza", B3SA3: "B3",
  RADL3: "Raia Drogasil", VIVT3: "Vivo", TOTS3: "Totvs", HAPV3: "Hapvida",
  CSAN3: "Cosan", SBSP3: "Sabesp", PRIO3: "PetroRio", ENEV3: "Eneva",
  CASH3: "Méliuz", LWSA3: "LWSA", MBLY3: "Mobly", AZUL4: "Azul",
  IRBR3: "IRB Brasil", SMFT3: "Smart Fit", COGN3: "Cogna", AERI3: "Aeris",
  PETZ3: "Petz", BHIA3: "Casas Bahia", MOVI3: "Movida", INTB3: "Intelbras",
};

function detectSentiment(title: string): string {
  const lower = title.toLowerCase();
  const positive = ["alta", "sobe", "lucro", "cresce", "recorde", "valoriza", "dividendo", "positiv", "supera", "avança", "melhora"];
  const negative = ["queda", "cai", "prejuízo", "recua", "perde", "negativ", "desvaloriza", "risco", "rebaixa", "piora", "endivid"];
  
  if (positive.some(w => lower.includes(w))) return "positivo";
  if (negative.some(w => lower.includes(w))) return "negativo";
  return "neutro";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Search for news about top companies in batches
    const allNews: any[] = [];
    
    // Search for general market news + specific companies
    const queries = [
      "ações brasileiras B3 bolsa hoje",
      "Petrobras Vale Itaú ações mercado",
      "small caps brasileiras investimento",
      "dividendos ações brasileiras 2026",
    ];

    for (const query of queries) {
      try {
        console.log(`Searching: ${query}`);
        const response = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit: 8,
            lang: "pt",
            country: "br",
            tbs: "qdr:d",
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Firecrawl error [${response.status}]: ${errText}`);
          continue;
        }

        const data = await response.json();
        if (data.data) {
          allNews.push(...data.data);
        }
      } catch (e) {
        console.error(`Error searching "${query}":`, e);
      }
    }

    console.log(`Found ${allNews.length} news articles`);

    // Match news to tickers and deduplicate
    const seen = new Set<string>();
    const rows: any[] = [];

    for (const article of allNews) {
      const title = article.title || "";
      const url = article.url || "";
      
      if (!title || seen.has(title)) continue;
      seen.add(title);

      // Find matching ticker
      let matchedTicker: string | null = null;
      for (const [ticker, name] of Object.entries(COMPANY_NAMES)) {
        if (title.toLowerCase().includes(name.toLowerCase()) || title.includes(ticker)) {
          matchedTicker = ticker;
          break;
        }
      }

      // Extract source from URL
      let source = "Mercado";
      try {
        source = new URL(url).hostname.replace("www.", "").split(".")[0];
        source = source.charAt(0).toUpperCase() + source.slice(1);
      } catch {}

      rows.push({
        ticker: matchedTicker,
        title: title.slice(0, 300),
        description: (article.description || "").slice(0, 500),
        url,
        source,
        sentiment: detectSentiment(title),
        published_at: new Date().toISOString(),
      });
    }

    // Clear old news and insert new ones
    if (rows.length > 0) {
      await supabase.from("stock_news").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      const { error } = await supabase.from("stock_news").insert(rows);
      if (error) {
        console.error("Insert error:", error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: rows.length, updated_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
