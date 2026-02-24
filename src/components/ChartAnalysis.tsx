import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CandlestickChart, TrendingUp, Layers, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type AnalysisType = "candlestick" | "forca" | "suporte_resistencia";

type ChartDataPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type ChartAnalysisProps = {
  ticker: string;
  chartData: ChartDataPoint[];
};

const analysisTypes: { key: AnalysisType; label: string; icon: typeof CandlestickChart; description: string }[] = [
  {
    key: "candlestick",
    label: "Padrões Candlestick",
    icon: CandlestickChart,
    description: "Doji, Martelo, Engolfo, Estrela da Manhã...",
  },
  {
    key: "forca",
    label: "Candles de Força",
    icon: TrendingUp,
    description: "Momentum, volume e força direcional",
  },
  {
    key: "suporte_resistencia",
    label: "Suporte & Resistência",
    icon: Layers,
    description: "Níveis-chave, zonas e rompimentos",
  },
];

const ChartAnalysis = ({ ticker, chartData }: ChartAnalysisProps) => {
  const [selectedType, setSelectedType] = useState<AnalysisType | null>(null);
  const [analyses, setAnalyses] = useState<Partial<Record<AnalysisType, string>>>({});
  const [loading, setLoading] = useState<AnalysisType | null>(null);

  const requestAnalysis = async (type: AnalysisType) => {
    setSelectedType(type);

    // If already cached, don't re-fetch
    if (analyses[type]) return;

    setLoading(type);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: { ticker, chartData, analysisType: type },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Erro na análise",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setAnalyses((prev) => ({ ...prev, [type]: data.analysis }));
    } catch (err) {
      console.error("Chart analysis error:", err);
      toast({
        title: "Erro na análise",
        description: "Não foi possível gerar a análise. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-primary" />
        Análise Gráfica por I.A.
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          AI
        </span>
      </h4>

      {/* Analysis type selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        {analysisTypes.map((at) => {
          const Icon = at.icon;
          const isSelected = selectedType === at.key;
          const isLoading = loading === at.key;
          const hasResult = !!analyses[at.key];

          return (
            <button
              key={at.key}
              onClick={(e) => {
                e.stopPropagation();
                requestAnalysis(at.key);
              }}
              disabled={isLoading}
              className={`relative text-left p-3 rounded-xl border transition-all ${
                isSelected
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-secondary/30 hover:border-primary/20"
              } ${isLoading ? "opacity-70" : ""}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-xs font-semibold ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                  {at.label}
                </span>
                {hasResult && (
                  <Sparkles className="w-3 h-3 text-primary ml-auto" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">{at.description}</p>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Analysis result */}
      <AnimatePresence mode="wait">
        {selectedType && (
          <motion.div
            key={selectedType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-secondary/30 rounded-xl p-4 border border-border"
          >
            {loading === selectedType ? (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Analisando gráfico com I.A....</span>
              </div>
            ) : analyses[selectedType] ? (
              <div className="prose prose-sm prose-invert max-w-none">
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {analyses[selectedType]}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Análise não disponível. Tente novamente.</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedType && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Selecione um tipo de análise gráfica acima para gerar insights por I.A.
        </p>
      )}
    </div>
  );
};

export default ChartAnalysis;
