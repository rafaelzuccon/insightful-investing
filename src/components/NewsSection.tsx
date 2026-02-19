import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Newspaper, TrendingUp, TrendingDown, Minus, Clock, ExternalLink, Search, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type LiveNewsItem = {
  id: string;
  ticker: string | null;
  title: string;
  description: string | null;
  url: string | null;
  source: string | null;
  sentiment: string;
  published_at: string;
};

const sentimentConfig: Record<string, any> = {
  positivo: { icon: TrendingUp, color: "text-success", bg: "bg-success/10", border: "border-success/20", label: "Positivo" },
  negativo: { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "Negativo" },
  neutro: { icon: Minus, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", label: "Neutro" },
};

const NewsCard = ({ news, index }: { news: LiveNewsItem; index: number }) => {
  const config = sentimentConfig[news.sentiment] || sentimentConfig.neutro;
  const Icon = config.icon;

  return (
    <motion.a
      href={news.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group block p-5 rounded-xl border border-border bg-card hover:border-primary/20 transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {news.ticker && (
              <>
                <span className="font-mono text-xs font-bold text-primary">{news.ticker}</span>
                <span className="text-xs text-muted-foreground">•</span>
              </>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full border ${config.bg} ${config.border} ${config.color} font-medium`}>
              {config.label}
            </span>
          </div>
          <h3 className="font-semibold text-sm mb-1.5 leading-snug group-hover:text-primary transition-colors">
            {news.title}
          </h3>
          {news.description && (
            <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">{news.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {news.source && <span>{news.source}</span>}
            {news.url && (
              <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3 h-3" /> Ler mais
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.a>
  );
};

const NewsSection = () => {
  const [news, setNews] = useState<LiveNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [tickerFilter, setTickerFilter] = useState<string>("todos");
  const [sentimentFilter, setSentimentFilter] = useState<string>("todos");

  const fetchNews = useCallback(async () => {
    const { data, error } = await supabase
      .from("stock_news")
      .select("*")
      .order("published_at", { ascending: false });

    if (!error && data) {
      setNews(data as LiveNewsItem[]);
    }
    setLoading(false);
  }, []);

  const refreshNews = useCallback(async () => {
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke("fetch-news");
      if (!error) await fetchNews();
    } catch (e) {
      console.error("Refresh error:", e);
    }
    setRefreshing(false);
  }, [fetchNews]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const tickers = ["todos", ...Array.from(new Set(news.filter(n => n.ticker).map(n => n.ticker!)))];

  const filtered = news.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.ticker?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesTicker = tickerFilter === "todos" || n.ticker === tickerFilter;
    const matchesSentiment = sentimentFilter === "todos" || n.sentiment === sentimentFilter;
    return matchesSearch && matchesTicker && matchesSentiment;
  });

  const positiveCount = news.filter((n) => n.sentiment === "positivo").length;
  const negativeCount = news.filter((n) => n.sentiment === "negativo").length;
  const neutralCount = news.filter((n) => n.sentiment === "neutro").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold font-display text-lg">Notícias em Tempo Real</h2>
            <p className="text-xs text-muted-foreground">{news.length} notícias • Atualiza a cada 6h</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-success" /> {positiveCount} positivas
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-destructive" /> {negativeCount} negativas
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-warning" /> {neutralCount} neutras
            </span>
          </div>
          <button
            onClick={refreshNews}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
            title="Atualizar notícias"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar notícias por empresa, ticker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(["todos", "positivo", "negativo", "neutro"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSentimentFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                sentimentFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "todos" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Ticker quick filter */}
      <div className="flex gap-2 flex-wrap">
        {tickers.map((t) => (
          <button
            key={t}
            onClick={() => setTickerFilter(t)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              tickerFilter === t ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {t === "todos" ? "Todas" : t}
          </button>
        ))}
      </div>

      {/* News list */}
      <div className="space-y-3">
        {filtered.map((item, i) => (
          <NewsCard key={item.id} news={item} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma notícia encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsSection;
