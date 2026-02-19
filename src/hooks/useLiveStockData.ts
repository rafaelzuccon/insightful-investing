import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type StockQuote = {
  ticker: string;
  name: string;
  price: number;
  change_percent: number;
  market_cap: number | null;
  volume: number | null;
  updated_at: string;
};

export const useLiveStockData = () => {
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cached quotes from DB
  const fetchCachedQuotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("stock_quotes")
      .select("*");

    if (error) {
      console.error("Error fetching cached quotes:", error);
      return;
    }

    if (data && data.length > 0) {
      const map: Record<string, StockQuote> = {};
      data.forEach((q: any) => {
        map[q.ticker] = {
          ticker: q.ticker,
          name: q.name,
          price: Number(q.price),
          change_percent: Number(q.change_percent),
          market_cap: q.market_cap ? Number(q.market_cap) : null,
          volume: q.volume ? Number(q.volume) : null,
          updated_at: q.updated_at,
        };
      });
      setQuotes(map);

      // Find most recent update
      const latest = data.reduce((a: any, b: any) =>
        new Date(a.updated_at) > new Date(b.updated_at) ? a : b
      );
      setLastUpdated(latest.updated_at);
    }
  }, []);

  // Trigger a refresh via edge function
  const refreshQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-stocks");
      if (error) throw error;
      if (data?.success) {
        await fetchCachedQuotes();
      } else {
        throw new Error(data?.error || "Failed to fetch stocks");
      }
    } catch (e: any) {
      console.error("Refresh error:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchCachedQuotes]);

  // Check if data needs refresh (older than 6 hours)
  const needsRefresh = useCallback(() => {
    if (!lastUpdated) return true;
    const sixHours = 6 * 60 * 60 * 1000;
    return Date.now() - new Date(lastUpdated).getTime() > sixHours;
  }, [lastUpdated]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      await fetchCachedQuotes();
    };
    init();
  }, [fetchCachedQuotes]);

  // Auto-refresh if data is stale
  useEffect(() => {
    if (Object.keys(quotes).length === 0 || needsRefresh()) {
      refreshQuotes();
    }
  }, [lastUpdated]);

  return { quotes, lastUpdated, loading, error, refreshQuotes, needsRefresh };
};
