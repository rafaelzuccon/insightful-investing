import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Shield, Target, AlertTriangle, DollarSign, BarChart3, Search, Flame,
} from "lucide-react";
import { highRiskStocks } from "@/data/highRiskStocks";
import type { StockAnalysis } from "@/data/stocks";

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

const HighRiskCard = ({ stock }: { stock: StockAnalysis }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="border border-destructive/15 rounded-2xl bg-card overflow-hidden hover:border-destructive/30 transition-colors"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <span className="font-mono text-sm font-bold text-destructive">{stock.ticker.slice(0, 4)}</span>
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
            <p className="font-mono font-bold">R${stock.price.toFixed(2)}</p>
            <p className={`text-sm font-mono ${stock.change >= 0 ? "text-success" : "text-destructive"}`}>
              {stock.change >= 0 ? "+" : ""}{stock.change}%
            </p>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </div>
      </button>

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
              {/* Risk warning */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive mb-1">Investimento de Alto Risco</p>
                  <p className="text-xs text-muted-foreground">Esta ação apresenta risco elevado de perda. Invista apenas o que está disposto a perder completamente. Não recomendado para investidores conservadores.</p>
                </div>
              </div>

              {/* Analysis */}
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Análise Completa
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{stock.analysis}</p>
              </div>

              {/* Fundamentals */}
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-primary" /> Indicadores
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: "P/L", value: stock.fundamentals.pl },
                    { label: "ROE", value: `${stock.fundamentals.roe}%` },
                    { label: "DY", value: `${stock.fundamentals.dividendYield}%` },
                    { label: "P/VP", value: stock.fundamentals.pvp },
                    { label: "Margem", value: `${stock.fundamentals.margemLiquida}%` },
                    { label: "Dív/EBITDA", value: stock.fundamentals.dividaEbitda },
                  ].map((f) => (
                    <div key={f.label} className="bg-secondary/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{f.label}</p>
                      <p className="font-mono font-bold text-sm">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horizons */}
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-primary" /> Previsões por Prazo
                </h4>
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    { label: "Curto Prazo", data: stock.shortTerm },
                    { label: "Médio Prazo", data: stock.mediumTerm },
                    { label: "Longo Prazo", data: stock.longTerm },
                  ].map((h) => (
                    <div key={h.label} className="bg-secondary/30 rounded-xl p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold">{h.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${riskColors[h.data.risk]}`}>
                          Risco {h.data.risk}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{h.data.outlook}</p>
                      <p className="font-mono text-sm">
                        Alvo: <span className="text-primary font-bold">R${h.data.target.toFixed(2)}</span>
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
                    <p className="text-xs text-muted-foreground mb-1">Provável</p>
                    <p className="font-mono font-bold text-primary">R${stock.riskSimulation.likely.toLocaleString()}</p>
                    <p className="text-xs text-primary mt-1">
                      {(((stock.riskSimulation.likely - stock.riskSimulation.invested) / stock.riskSimulation.invested) * 100).toFixed(0)}%
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
                        <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" /> {s}
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
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" /> {r}
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

const HighRiskSection = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("todos");

  const sectors = ["todos", ...Array.from(new Set(highRiskStocks.map((s) => s.sector)))];

  const filtered = highRiskStocks.filter((s) => {
    const matchesSearch = s.ticker.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase());
    const matchesSector = filter === "todos" || s.sector === filter;
    return matchesSearch && matchesSector;
  });

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      <div className="flex items-start gap-3 p-5 rounded-2xl bg-destructive/5 border border-destructive/20">
        <Flame className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold font-display text-destructive mb-1">Zona de Alto Risco</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Estas são empresas menores com potencial de crescimento explosivo, mas com risco significativamente maior.
            Muitas podem dar prejuízo ou até falir. Invista apenas uma pequena parte do seu portfólio (5-10% no máximo)
            e esteja preparado para perder 100% do capital investido.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
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
                filter === s ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "todos" ? "Todos" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Ações de Risco", value: highRiskStocks.length.toString(), icon: Flame },
          { label: "Compra Forte", value: highRiskStocks.filter((s) => s.recommendation === "compra forte").length.toString(), icon: TrendingUp },
          { label: "Compra", value: highRiskStocks.filter((s) => s.recommendation === "compra").length.toString(), icon: Target },
          { label: "Cautela", value: highRiskStocks.filter((s) => s.recommendation === "cautela").length.toString(), icon: AlertTriangle },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <stat.icon className="w-5 h-5 text-destructive" />
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
        {filtered.map((stock, i) => (
          <motion.div
            key={stock.ticker}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <HighRiskCard stock={stock} />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p>Nenhuma ação encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HighRiskSection;
