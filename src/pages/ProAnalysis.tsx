import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Shield, Target, AlertTriangle, DollarSign, BarChart3, Search, Newspaper, Flame, RefreshCw, Wifi } from "lucide-react";
import { Link } from "react-router-dom";
import { stocksData, type StockAnalysis } from "@/data/stocks";
import NewsSection from "@/components/NewsSection";
import HighRiskSection from "@/components/HighRiskSection";
import StockChart from "@/components/StockChart";
import { useLiveStockData } from "@/hooks/useLiveStockData";

const riskColors = {
  baixo: "text-success bg-success/10 border-success/20",
  médio: "text-warning bg-warning/10 border-warning/20",
  alto: "text-destructive bg-destructive/10 border-destructive/20",
};

const recColors = {
  "compra forte": "text-success bg-success/10",
  compra: "text-primary bg-primary/10",
  neutro: "text-warning bg-warning/10",
  cautela: "text-destructive bg-destructive/10",
};

const StockCard = ({ stock, livePrice, liveChange }: { stock: StockAnalysis; livePrice?: number; liveChange?: number }) => {
  const [expanded, setExpanded] = useState(false);
  const price = livePrice ?? stock.price;
  const change = liveChange ?? stock.change;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-2xl bg-card overflow-hidden hover:border-primary/20 transition-colors"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            <span className="font-mono text-sm font-bold text-primary">{stock.ticker.slice(0, 4)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold font-display">{stock.ticker}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${recColors[stock.recommendation]}`}>
                {stock.recommendation}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{stock.name} • {stock.sector}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="font-mono font-bold">R${price.toFixed(2)}</p>
            <p className={`text-sm font-mono ${change >= 0 ? "text-success" : "text-destructive"}`}>
              {change >= 0 ? "+" : ""}{change.toFixed(2)}%
            </p>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 space-y-6 border-t border-border pt-5">
              {/* Chart */}
              <StockChart ticker={stock.ticker} currentPrice={price} />

              {/* Analysis */}
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Análise Completa
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{stock.analysis}</p>
              </div>

              {/* Fundamentals grid */}
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-primary" /> Indicadores Fundamentais
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: "P/L", value: stock.fundamentals.pl },
                    { label: "ROE", value: `${stock.fundamentals.roe}%` },
                    { label: "DY", value: `${stock.fundamentals.dividendYield}%` },
                    { label: "P/VP", value: stock.fundamentals.pvp },
                    { label: "Margem Líq.", value: `${stock.fundamentals.margemLiquida}%` },
                    { label: "Dív/EBITDA", value: stock.fundamentals.dividaEbitda },
                  ].map((f) => (
                    <div key={f.label} className="bg-secondary/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{f.label}</p>
                      <p className="font-mono font-bold text-sm">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time horizons */}
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-primary" /> Previsões por Prazo
                </h4>
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    { label: "Curto Prazo", data: stock.shortTerm },
                    { label: "Médio Prazo", data: stock.mediumTerm },
                    { label: "Longo Prazo", data: stock.longTerm },
                  ].map((horizon) => (
                    <div key={horizon.label} className="bg-secondary/30 rounded-xl p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold">{horizon.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${riskColors[horizon.data.risk]}`}>
                          Risco {horizon.data.risk}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{horizon.data.outlook}</p>
                      <p className="font-mono text-sm">
                        Alvo: <span className="text-primary font-bold">R${horizon.data.target.toFixed(2)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk simulation */}
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-primary" /> Simulação de Risco — R${stock.riskSimulation.invested.toLocaleString()} investidos
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Melhor cenário</p>
                    <p className="font-mono font-bold text-success">R${stock.riskSimulation.bestCase.toLocaleString()}</p>
                    <p className="text-xs text-success mt-1">
                      +{(((stock.riskSimulation.bestCase - stock.riskSimulation.invested) / stock.riskSimulation.invested) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Cenário provável</p>
                    <p className="font-mono font-bold text-primary">R${stock.riskSimulation.likely.toLocaleString()}</p>
                    <p className="text-xs text-primary mt-1">
                      +{(((stock.riskSimulation.likely - stock.riskSimulation.invested) / stock.riskSimulation.invested) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Pior cenário</p>
                    <p className="font-mono font-bold text-destructive">R${stock.riskSimulation.worstCase.toLocaleString()}</p>
                    <p className="text-xs text-destructive mt-1">
                      {(((stock.riskSimulation.worstCase - stock.riskSimulation.invested) / stock.riskSimulation.invested) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Strengths & Risks */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-success" /> Pontos Fortes
                  </h4>
                  <ul className="space-y-1.5">
                    {stock.strengths.map((s) => (
                      <li key={s} className="text-xs text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" /> Riscos
                  </h4>
                  <ul className="space-y-1.5">
                    {stock.risks.map((r) => (
                      <li key={r} className="text-xs text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ProAnalysis = () => {
  const [tab, setTab] = useState<"analises" | "noticias" | "riscos">("analises");
  const { quotes, lastUpdated, loading, refreshQuotes } = useLiveStockData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("todos");

  const sectors = ["todos", ...Array.from(new Set(stocksData.map((s) => s.sector)))];

  const filtered = stocksData.filter((s) => {
    const matchesSearch = s.ticker.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase());
    const matchesSector = filter === "todos" || s.sector === filter;
    return matchesSearch && matchesSector;
  });

  const formatLastUpdated = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    const d = new Date(dateStr);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold font-display text-lg">Análises Pro</h1>
            <div className="flex items-center gap-2">
              <Wifi className={`w-3 h-3 ${Object.keys(quotes).length > 0 ? "text-success" : "text-muted-foreground"}`} />
              <p className="text-xs text-muted-foreground">
                {Object.keys(quotes).length > 0 ? `Atualizado: ${formatLastUpdated(lastUpdated)}` : "Carregando dados..."}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={refreshQuotes}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
              title="Atualizar cotações"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </button>
            <span className="text-xs px-3 py-1.5 rounded-full font-mono font-semibold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              PRO
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border pb-4">
          <button
            onClick={() => setTab("analises")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "analises" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Análises (20)
          </button>
          <button
            onClick={() => setTab("noticias")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "noticias" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Newspaper className="w-4 h-4" /> Notícias
          </button>
          <button
            onClick={() => setTab("riscos")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "riscos" ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flame className="w-4 h-4" /> Maiores Riscos
          </button>
        </div>

        {tab === "analises" ? (
          <>
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por ticker ou nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:border-primary/50 transition-colors font-mono"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {sectors.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s === "todos" ? "Todos" : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total de Ações", value: "20", icon: BarChart3 },
                { label: "Compra Forte", value: stocksData.filter((s) => s.recommendation === "compra forte").length.toString(), icon: TrendingUp },
                { label: "Compra", value: stocksData.filter((s) => s.recommendation === "compra").length.toString(), icon: Target },
                { label: "Cautela", value: stocksData.filter((s) => s.recommendation === "cautela" || s.recommendation === "neutro").length.toString(), icon: AlertTriangle },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-mono font-bold text-lg">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stock list */}
            <div className="space-y-3">
              {filtered.map((stock) => (
                <StockCard
                  key={stock.ticker}
                  stock={stock}
                  livePrice={quotes[stock.ticker]?.price}
                  liveChange={quotes[stock.ticker]?.change_percent}
                />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <p>Nenhuma ação encontrada.</p>
                </div>
              )}
            </div>
          </>
        ) : tab === "noticias" ? (
          <NewsSection />
        ) : (
          <HighRiskSection liveQuotes={quotes} />
        )}
      </div>
    </div>
  );
};

export default ProAnalysis;
