import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CandlestickChart, TrendingUp, Layers, Loader2, Sparkles, AlertCircle, ArrowUp, ArrowDown, Minus, ShieldCheck } from "lucide-react";
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

const analysisTypes: { key: AnalysisType; label: string; icon: typeof CandlestickChart }[] = [
  { key: "candlestick", label: "Candlestick", icon: CandlestickChart },
  { key: "forca", label: "Força", icon: TrendingUp },
  { key: "suporte_resistencia", label: "S & R", icon: Layers },
];

const signalBadge = (signal: string) => {
  const map: Record<string, { color: string; label: string }> = {
    alta: { color: "text-success bg-success/10 border-success/20", label: "📈 Alta" },
    compradora: { color: "text-success bg-success/10 border-success/20", label: "📈 Compradora" },
    baixa: { color: "text-destructive bg-destructive/10 border-destructive/20", label: "📉 Baixa" },
    vendedora: { color: "text-destructive bg-destructive/10 border-destructive/20", label: "📉 Vendedora" },
    neutro: { color: "text-warning bg-warning/10 border-warning/20", label: "➡️ Neutro" },
    equilibrada: { color: "text-warning bg-warning/10 border-warning/20", label: "⚖️ Equilibrada" },
    aumentando: { color: "text-success bg-success/10 border-success/20", label: "🔺 Aumentando" },
    estável: { color: "text-warning bg-warning/10 border-warning/20", label: "➡️ Estável" },
    diminuindo: { color: "text-destructive bg-destructive/10 border-destructive/20", label: "🔻 Diminuindo" },
    proximo_suporte: { color: "text-success bg-success/10 border-success/20", label: "📍 Próx. Suporte" },
    proximo_resistencia: { color: "text-destructive bg-destructive/10 border-destructive/20", label: "📍 Próx. Resistência" },
    meio_do_canal: { color: "text-warning bg-warning/10 border-warning/20", label: "📍 Meio do Canal" },
  };
  const m = map[signal] || { color: "text-muted-foreground bg-secondary", label: signal };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${m.color}`}>
      {m.label}
    </span>
  );
};

const forcaBadge = (forca: string) => {
  const map: Record<string, string> = {
    forte: "bg-success/15 text-success border-success/20",
    moderado: "bg-warning/15 text-warning border-warning/20",
    fraco: "bg-muted text-muted-foreground border-border",
  };
  return map[forca] || map.fraco;
};

const tipoBullet = (tipo: string) => {
  if (tipo === "positivo" || tipo === "alta") return "bg-success";
  if (tipo === "negativo" || tipo === "baixa") return "bg-destructive";
  return "bg-warning";
};

// Render structured candlestick analysis
const CandlestickResult = ({ data }: { data: any }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 flex-wrap">
      {signalBadge(data.sinal)}
      <span className="text-[10px] text-muted-foreground">
        Confiança: <span className="font-semibold text-foreground">{data.confianca}</span>
      </span>
    </div>
    <div className="space-y-2">
      {data.padroes?.map((p: any, i: number) => (
        <div key={i} className="flex items-start gap-2">
          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${tipoBullet(p.tipo)}`} />
          <div>
            <span className="text-xs font-semibold text-foreground">{p.nome}</span>
            <p className="text-[11px] text-muted-foreground leading-snug">{p.descricao}</p>
          </div>
        </div>
      ))}
    </div>
    <p className="text-xs text-muted-foreground border-t border-border pt-2 leading-relaxed">
      {data.conclusao}
    </p>
  </div>
);

// Render structured force analysis
const ForcaResult = ({ data }: { data: any }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] text-muted-foreground">Força:</span>
      {signalBadge(data.forca_predominante)}
      <span className="text-[10px] text-muted-foreground">Momentum:</span>
      {signalBadge(data.momentum)}
    </div>
    <div className="space-y-2">
      {data.pontos?.map((p: any, i: number) => (
        <div key={i} className="flex items-start gap-2">
          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${tipoBullet(p.tipo)}`} />
          <div>
            <span className="text-xs font-semibold text-foreground">{p.titulo}</span>
            <p className="text-[11px] text-muted-foreground leading-snug">{p.descricao}</p>
          </div>
        </div>
      ))}
    </div>
    <p className="text-xs text-muted-foreground border-t border-border pt-2 leading-relaxed">
      {data.conclusao}
    </p>
  </div>
);

// Render structured support/resistance analysis
const SuporteResult = ({ data }: { data: any }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      {signalBadge(data.posicao_atual)}
    </div>
    <div className="grid grid-cols-2 gap-3">
      {/* Suportes */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-success flex items-center gap-1">
          <ArrowDown className="w-3 h-3" /> Suportes
        </p>
        {data.suportes?.map((s: any, i: number) => (
          <div key={i} className={`rounded-lg border px-2 py-1.5 ${forcaBadge(s.forca)}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold">R${s.preco.toFixed(2)}</span>
              <span className="text-[9px] opacity-70">{s.testes}x testado</span>
            </div>
            <span className="text-[9px] capitalize">{s.forca}</span>
          </div>
        ))}
      </div>
      {/* Resistências */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-destructive flex items-center gap-1">
          <ArrowUp className="w-3 h-3" /> Resistências
        </p>
        {data.resistencias?.map((r: any, i: number) => (
          <div key={i} className={`rounded-lg border px-2 py-1.5 ${forcaBadge(r.forca)}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold">R${r.preco.toFixed(2)}</span>
              <span className="text-[9px] opacity-70">{r.testes}x testado</span>
            </div>
            <span className="text-[9px] capitalize">{r.forca}</span>
          </div>
        ))}
      </div>
    </div>
    <p className="text-xs text-muted-foreground border-t border-border pt-2 leading-relaxed">
      {data.conclusao}
    </p>
  </div>
);

const renderAnalysis = (type: AnalysisType, data: any) => {
  if (data?.fallback) {
    return <p className="text-xs text-muted-foreground leading-relaxed">{data.fallback}</p>;
  }
  switch (type) {
    case "candlestick": return <CandlestickResult data={data} />;
    case "forca": return <ForcaResult data={data} />;
    case "suporte_resistencia": return <SuporteResult data={data} />;
  }
};

const ChartAnalysis = ({ ticker, chartData }: ChartAnalysisProps) => {
  const [selectedType, setSelectedType] = useState<AnalysisType | null>(null);
  const [analyses, setAnalyses] = useState<Partial<Record<AnalysisType, any>>>({});
  const [loading, setLoading] = useState<AnalysisType | null>(null);

  const requestAnalysis = async (type: AnalysisType) => {
    setSelectedType(type);
    if (analyses[type]) return;

    setLoading(type);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: { ticker, chartData, analysisType: type },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Erro na análise", description: data.error, variant: "destructive" });
        return;
      }

      setAnalyses((prev) => ({ ...prev, [type]: data.analysis }));
    } catch (err) {
      console.error("Chart analysis error:", err);
      toast({ title: "Erro na análise", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          Análise Gráfica I.A.
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            AI
          </span>
        </h4>
        <div className="flex items-center gap-1">
          {analysisTypes.map((at) => {
            const Icon = at.icon;
            const isSelected = selectedType === at.key;
            const isLoading = loading === at.key;
            const hasResult = !!analyses[at.key];

            return (
              <button
                key={at.key}
                onClick={(e) => { e.stopPropagation(); requestAnalysis(at.key); }}
                disabled={isLoading}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Icon className="w-3 h-3" />
                )}
                {at.label}
                {hasResult && !isSelected && <Sparkles className="w-2.5 h-2.5 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedType && (
          <motion.div
            key={selectedType}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-secondary/30 rounded-xl p-4 border border-border"
          >
            {loading === selectedType ? (
              <div className="flex items-center justify-center gap-3 py-6">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground">Analisando {ticker}...</span>
              </div>
            ) : analyses[selectedType] ? (
              renderAnalysis(selectedType, analyses[selectedType])
            ) : (
              <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">Não disponível. Tente novamente.</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedType && (
        <div className="bg-secondary/20 rounded-xl border border-dashed border-border py-4 text-center">
          <p className="text-[11px] text-muted-foreground">
            Clique em um tipo acima para gerar análise por I.A.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChartAnalysis;
