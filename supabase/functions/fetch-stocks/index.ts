import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// All tickers from both regular and high-risk lists
const TICKERS = [
  "PETR4", "VALE3", "ITUB4", "WEGE3", "BBAS3", "RENT3", "ABEV3", "ELET3",
  "SUZB3", "BBDC4", "MGLU3", "B3SA3", "RADL3", "VIVT3", "TOTS3", "HAPV3",
  "CSAN3", "SBSP3", "PRIO3", "ENEV3",
  // High risk
  "CASH3", "LWSA3", "MBLY3", "AZUL4", "IRBR3", "SMFT3", "COGN3", "AERI3",
  "PETZ3", "BHIA3", "MOVI3", "INTB3",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BRAPI_TOKEN = Deno.env.get("BRAPI_API_TOKEN");
    if (!BRAPI_TOKEN) {
      throw new Error("BRAPI_API_TOKEN is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch quotes in batches of 10
    const results: any[] = [];
    const batchSize = 10;

    for (let i = 0; i < TICKERS.length; i += batchSize) {
      const batch = TICKERS.slice(i, i + batchSize);
      const tickerStr = batch.join(",");

      const url = `https://brapi.dev/api/quote/${tickerStr}?token=${BRAPI_TOKEN}`;
      console.log(`Fetching batch: ${tickerStr}`);

      const response = await fetch(url);
      if (!response.ok) {
        const errText = await response.text();
        console.error(`Brapi error [${response.status}]: ${errText}`);
        continue;
      }

      const data = await response.json();
      if (data.results) {
        results.push(...data.results);
      }
    }

    console.log(`Fetched ${results.length} stock quotes`);

    // Upsert into database
    const rows = results.map((q: any) => ({
      ticker: q.symbol,
      name: q.longName || q.shortName || q.symbol,
      price: q.regularMarketPrice || 0,
      change_percent: q.regularMarketChangePercent || 0,
      market_cap: q.marketCap || null,
      volume: q.regularMarketVolume || null,
      updated_at: new Date().toISOString(),
    }));

    if (rows.length > 0) {
      const { error } = await supabase
        .from("stock_quotes")
        .upsert(rows, { onConflict: "ticker" });

      if (error) {
        console.error("Upsert error:", error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: rows.length,
        updated_at: new Date().toISOString(),
      }),
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
