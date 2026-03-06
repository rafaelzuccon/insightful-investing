import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CandlestickChart, TrendingUp, Layers, Loader2, Sparkles, AlertCircle, ArrowUp, ArrowDown, ChevronDown, Activity, BarChart3, GitBranch } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

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
  onScoreUpdate?: (scores: Partial<Record<AnalysisType, number>>) => void;
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
  if (tipo === "positivo" || tipo === "alta" || tipo === "bullish") return "bg-success";
  if (tipo === "negativo" || tipo === "baixa" || tipo === "bearish") return "bg-destructive";
  return "bg-warning";
};

// Score badge for each analysis
const ScoreBadge = ({ score, label }: { score: number; label: string }) => {
  const color = score >= 7 ? "text-success border-success/30 bg-success/10" : score >= 4 ? "text-warning border-warning/30 bg-warning/10" : "text-destructive border-destructive/30 bg-destructive/10";
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${color}`}>
      <span className="text-[10px] font-medium">{label}</span>
      <span className="font-mono text-sm font-bold">{score.toFixed(1)}</span>
      <span className="text-[9px] opacity-60">/10</span>
    </div>
  );
};

// Candlestick shape for mini charts
const MiniCandlestickShape = (props: any) => {
  const { x, width, payload, priceMin, priceMax } = props;
  if (!payload) return null;
  const { open, high, low, close } = payload;
  const isUp = close >= open;
  const color = isUp ? "hsl(var(--success))" : "hsl(var(--destructive))";
  const candleX = x + width / 2;
  const chartHeight = 130;
  const top = 5;
  const yScale = (v: number) => top + ((priceMax - v) / (priceMax - priceMin)) * chartHeight;

  const bodyTop = yScale(Math.max(open, close));
  const bodyBottom = yScale(Math.min(open, close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

  return (
    <g>
      <line x1={candleX} y1={yScale(high)} x2={candleX} y2={yScale(low)} stroke={color} strokeWidth={1} />
      <rect x={x + 1} y={bodyTop} width={Math.max(width - 2, 2)} height={bodyHeight} fill={color} stroke={color} strokeWidth={0.5} rx={1} />
    </g>
  );
};

const MiniTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const isUp = d.close >= d.open;
  return (
    <div className="bg-card border border-border rounded-lg p-2 shadow-xl text-[10px] space-y-0.5">
      <p className="font-semibold text-foreground">{d.date}</p>
      <p>A: R${d.open.toFixed(2)} | F: <span className={isUp ? "text-success" : "text-destructive"}>R${d.close.toFixed(2)}</span></p>
      <p>Max: R${d.high.toFixed(2)} | Min: R${d.low.toFixed(2)}</p>
    </div>
  );
};

// Mini candlestick chart used inside analysis results
const AnalysisChart = ({ data, referenceLines }: { data: ChartDataPoint[]; referenceLines?: { price: number; color: string; label: string }[] }) => {
  const priceMin = useMemo(() => Math.min(...data.map((d) => d.low)) * 0.995, [data]);
  const priceMax = useMemo(() => Math.max(...data.map((d) => d.high)) * 1.005, [data]);

  return (
    <div className="bg-background/50 rounded-lg border border-border p-1.5 mb-3">
      <ResponsiveContainer width="100%" height={150}>
        <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(data.length / 5)}
          />
          <YAxis
            domain={[priceMin, priceMax]}
            tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v.toFixed(0)}`}
            width={32}
          />
          <Tooltip content={<MiniTooltip />} />
          {referenceLines?.map((rl, i) => (
            <ReferenceLine
              key={i}
              y={rl.price}
              stroke={rl.color}
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{ value: `${rl.label} R$${rl.price.toFixed(0)}`, position: "right", fontSize: 8, fill: rl.color }}
            />
          ))}
          <Bar
            dataKey="high"
            shape={(props: any) => <MiniCandlestickShape {...props} priceMin={priceMin} priceMax={priceMax} />}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Custom dot to mark pattern locations on chart
const PatternMarker = ({ cx, cy, payload, patterns }: any) => {
  if (!patterns || !payload) return null;
  const match = patterns.find((p: any) => p.data === payload.date);
  if (!match) return null;
  const isBullish = match.tipo === "bullish";
  const color = isBullish ? "hsl(var(--success))" : "hsl(var(--destructive))";
  const arrow = isBullish ? "▲" : "▼";
  const yOffset = isBullish ? 12 : -8;
  return (
    <g>
      <text x={cx} y={cy + yOffset} textAnchor="middle" fontSize={10} fill={color} fontWeight="bold">
        {arrow}
      </text>
    </g>
  );
};

// Render structured candlestick analysis with bullish/bearish
const CandlestickResult = ({ data, chartData }: { data: any; chartData: ChartDataPoint[] }) => {
  const patterns = data.padroes || [];
  const bullishCount = patterns.filter((p: any) => p.tipo === "bullish").length;
  const bearishCount = patterns.filter((p: any) => p.tipo === "bearish").length;

  // Build chart data with pattern markers
  const chartWithMarkers = chartData.map((d) => {
    const match = patterns.find((p: any) => p.data === d.date);
    return { ...d, marker: match ? (match.tipo === "bullish" ? d.high * 1.01 : d.low * 0.99) : undefined };
  });

  const priceMin = Math.min(...chartData.map((d) => d.low)) * 0.993;
  const priceMax = Math.max(...chartData.map((d) => d.high)) * 1.007;

  return (
    <div className="space-y-3">
      {/* Chart with pattern markers */}
      <div className="bg-background/50 rounded-lg border border-border p-1.5">
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={chartWithMarkers} margin={{ top: 10, right: 5, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(chartData.length / 5)}
            />
            <YAxis
              domain={[priceMin, priceMax]}
              tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v.toFixed(0)}`}
              width={32}
            />
            <Bar
              dataKey="high"
              shape={(props: any) => <MiniCandlestickShape {...props} priceMin={priceMin} priceMax={priceMax} />}
              isAnimationActive={false}
            />
            {/* Bullish/Bearish markers as scatter-like dots via ReferenceDot would be complex, use custom bar overlay */}
            {patterns.map((p: any, i: number) => {
              const idx = chartData.findIndex((d) => d.date === p.data);
              if (idx === -1) return null;
              const price = p.tipo === "bullish" ? chartData[idx].low : chartData[idx].high;
              return (
                <ReferenceLine
                  key={i}
                  x={p.data}
                  stroke={p.tipo === "bullish" ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  opacity={0.6}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-1 mb-0.5">
          <span className="flex items-center gap-1 text-[9px] text-success font-semibold">
            <span className="w-2 h-0.5 bg-success inline-block" style={{ borderTop: "1px dashed" }} /> Bullish
          </span>
          <span className="flex items-center gap-1 text-[9px] text-destructive font-semibold">
            <span className="w-2 h-0.5 bg-destructive inline-block" style={{ borderTop: "1px dashed" }} /> Bearish
          </span>
        </div>
      </div>

      {/* Score + Bullish / Bearish summary badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {data.score != null && <ScoreBadge score={data.score} label="Score" />}
        {signalBadge(data.sinal)}
        <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold text-success bg-success/10 border-success/20">
          🐂 {bullishCount} Bullish
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold text-destructive bg-destructive/10 border-destructive/20">
          🐻 {bearishCount} Bearish
        </span>
        <span className="text-[10px] text-muted-foreground">
          Confiança: <span className="font-semibold text-foreground">{data.confianca}</span>
        </span>
      </div>

      {/* Bullish summary */}
      {data.resumo_bullish && (
        <div className="flex items-start gap-2 bg-success/5 rounded-lg px-3 py-2 border border-success/15">
          <span className="text-sm mt-0.5">🐂</span>
          <p className="text-[11px] text-success leading-snug">{data.resumo_bullish}</p>
        </div>
      )}

      {/* Bearish summary */}
      {data.resumo_bearish && (
        <div className="flex items-start gap-2 bg-destructive/5 rounded-lg px-3 py-2 border border-destructive/15">
          <span className="text-sm mt-0.5">🐻</span>
          <p className="text-[11px] text-destructive leading-snug">{data.resumo_bearish}</p>
        </div>
      )}

      {/* Pattern list */}
      <div className="space-y-2">
        {patterns.map((p: any, i: number) => (
          <div key={i} className="flex items-start gap-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${tipoBullet(p.tipo)}`} />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">{p.nome}</span>
                <span className={`text-[9px] px-1.5 py-0 rounded-full font-bold uppercase ${
                  p.tipo === "bullish" ? "text-success bg-success/10" : p.tipo === "bearish" ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-secondary"
                }`}>
                  {p.tipo}
                </span>
                {p.data && <span className="text-[9px] text-muted-foreground font-mono">{p.data}</span>}
              </div>
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
};

// Render structured force analysis
const ForcaResult = ({ data, chartData }: { data: any; chartData: ChartDataPoint[] }) => (
  <div className="space-y-3">
    <AnalysisChart data={chartData} />
    <div className="flex items-center gap-2 flex-wrap">
      {data.score != null && <ScoreBadge score={data.score} label="Score" />}
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

// Render structured support/resistance analysis with Fibonacci, Bollinger, Volume
const SuporteResult = ({ data, chartData }: { data: any; chartData: ChartDataPoint[] }) => {
  // Build reference lines from AI-detected levels
  const refLines: { price: number; color: string; label: string }[] = [];
  data.suportes?.forEach((s: any) => refLines.push({ price: s.preco, color: "hsl(var(--success))", label: "S" }));
  data.resistencias?.forEach((r: any) => refLines.push({ price: r.preco, color: "hsl(var(--destructive))", label: "R" }));

  // Fibonacci levels
  if (data.fibonacci?.niveis) {
    data.fibonacci.niveis.forEach((n: any) => {
      refLines.push({ price: n.preco, color: "hsl(45, 100%, 55%)", label: `Fib ${n.nivel}` });
    });
  }

  // Bollinger bands
  if (data.bollinger) {
    refLines.push({ price: data.bollinger.banda_superior, color: "hsl(210, 80%, 60%)", label: "BB↑" });
    refLines.push({ price: data.bollinger.media, color: "hsl(210, 60%, 50%)", label: "SMA20" });
    refLines.push({ price: data.bollinger.banda_inferior, color: "hsl(210, 80%, 60%)", label: "BB↓" });
  }

  // Volume zones
  if (data.volume_analise?.zonas_alto_volume) {
    data.volume_analise.zonas_alto_volume.forEach((z: any) => {
      refLines.push({ price: z.preco_zona, color: "hsl(280, 70%, 60%)", label: z.tipo === "suporte" ? "Vol.S" : "Vol.R" });
    });
  }

  const bollingerPosMap: Record<string, { label: string; color: string }> = {
    acima_superior: { label: "Acima da Banda Superior", color: "text-destructive" },
    proximo_superior: { label: "Próx. Banda Superior", color: "text-warning" },
    meio: { label: "Região Central", color: "text-muted-foreground" },
    proximo_inferior: { label: "Próx. Banda Inferior", color: "text-warning" },
    abaixo_inferior: { label: "Abaixo da Banda Inferior", color: "text-success" },
  };

  const fibRelevanciaColor = (r: string) => {
    if (r === "alta") return "text-primary font-bold";
    if (r === "média") return "text-foreground";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-3">
      <AnalysisChart data={chartData} referenceLines={refLines} />
      
      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[9px]">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-success inline-block" /> Suporte</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-destructive inline-block" /> Resistência</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: "hsl(45, 100%, 55%)" }} /> Fibonacci</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: "hsl(210, 80%, 60%)" }} /> Bollinger</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: "hsl(280, 70%, 60%)" }} /> Volume</span>
      </div>

      <div className="flex items-center gap-2">
        {data.score != null && <ScoreBadge score={data.score} label="Score" />}
        {signalBadge(data.posicao_atual)}
      </div>

      {/* S&R traditional */}
      <div className="grid grid-cols-2 gap-3">
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

      {/* Fibonacci */}
      {data.fibonacci && (
        <div className="bg-background/50 rounded-lg border border-border p-3 space-y-2">
          <p className="text-[10px] font-semibold flex items-center gap-1.5" style={{ color: "hsl(45, 100%, 55%)" }}>
            <GitBranch className="w-3 h-3" /> Retração de Fibonacci
            <span className="text-[9px] text-muted-foreground font-normal ml-1">
              ({data.fibonacci.tendencia === "alta" ? "Tendência de Alta" : "Tendência de Baixa"})
            </span>
          </p>
          <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
            <span>Swing High: <span className="font-mono font-bold text-foreground">R${data.fibonacci.ponto_alto?.toFixed(2)}</span></span>
            <span>Swing Low: <span className="font-mono font-bold text-foreground">R${data.fibonacci.ponto_baixo?.toFixed(2)}</span></span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {data.fibonacci.niveis?.map((n: any, i: number) => (
              <div key={i} className="text-center rounded border border-border px-1 py-1 bg-secondary/30">
                <p className="text-[9px] font-bold" style={{ color: "hsl(45, 100%, 55%)" }}>{n.nivel}</p>
                <p className={`text-[10px] font-mono ${fibRelevanciaColor(n.relevancia)}`}>R${n.preco.toFixed(2)}</p>
                <p className="text-[8px] text-muted-foreground capitalize">{n.relevancia}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground italic">{data.fibonacci.observacao}</p>
        </div>
      )}

      {/* Bollinger Bands */}
      {data.bollinger && (
        <div className="bg-background/50 rounded-lg border border-border p-3 space-y-2">
          <p className="text-[10px] font-semibold flex items-center gap-1.5" style={{ color: "hsl(210, 80%, 60%)" }}>
            <Activity className="w-3 h-3" /> Bandas de Bollinger
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[9px] text-muted-foreground">
              Posição: <span className={`font-semibold ${bollingerPosMap[data.bollinger.posicao_preco]?.color || "text-foreground"}`}>
                {bollingerPosMap[data.bollinger.posicao_preco]?.label || data.bollinger.posicao_preco}
              </span>
            </span>
            <span className="text-[9px] text-muted-foreground">
              Bandas: <span className="font-semibold text-foreground capitalize">{data.bollinger.largura}</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-[9px]">
            <span>BB↑: <span className="font-mono font-bold text-foreground">R${data.bollinger.banda_superior?.toFixed(2)}</span></span>
            <span>SMA20: <span className="font-mono font-bold text-foreground">R${data.bollinger.media?.toFixed(2)}</span></span>
            <span>BB↓: <span className="font-mono font-bold text-foreground">R${data.bollinger.banda_inferior?.toFixed(2)}</span></span>
          </div>
          <p className="text-[10px] text-muted-foreground italic">{data.bollinger.observacao}</p>
        </div>
      )}

      {/* Volume Analysis */}
      {data.volume_analise && (
        <div className="bg-background/50 rounded-lg border border-border p-3 space-y-2">
          <p className="text-[10px] font-semibold flex items-center gap-1.5" style={{ color: "hsl(280, 70%, 60%)" }}>
            <BarChart3 className="w-3 h-3" /> Volume Financeiro
            <span className="text-[9px] text-muted-foreground font-normal ml-1">
              (Tendência: <span className="capitalize font-semibold text-foreground">{data.volume_analise.tendencia_volume}</span>)
            </span>
          </p>
          {data.volume_analise.zonas_alto_volume?.map((z: any, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${z.tipo === "suporte" ? "bg-success" : "bg-destructive"}`} />
              <div>
                <span className="text-xs font-semibold text-foreground">
                  R${z.preco_zona?.toFixed(2)} <span className={`text-[9px] ${z.tipo === "suporte" ? "text-success" : "text-destructive"}`}>({z.tipo})</span>
                </span>
                <p className="text-[11px] text-muted-foreground leading-snug">{z.descricao}</p>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground italic">{data.volume_analise.observacao}</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground border-t border-border pt-2 leading-relaxed">
        {data.conclusao}
      </p>
    </div>
  );
};

const renderAnalysis = (type: AnalysisType, data: any, chartData: ChartDataPoint[]) => {
  if (data?.fallback) {
    return <p className="text-xs text-muted-foreground leading-relaxed">{data.fallback}</p>;
  }
  switch (type) {
    case "candlestick": return <CandlestickResult data={data} chartData={chartData} />;
    case "forca": return <ForcaResult data={data} chartData={chartData} />;
    case "suporte_resistencia": return <SuporteResult data={data} chartData={chartData} />;
  }
};

const ChartAnalysis = ({ ticker, chartData, onScoreUpdate, hidden }: ChartAnalysisProps & { hidden?: boolean }) => {
  const [analyses, setAnalyses] = useState<Partial<Record<AnalysisType, any>>>({});
  const [loading, setLoading] = useState<AnalysisType | null>(null);
  const [openSections, setOpenSections] = useState<Partial<Record<AnalysisType, boolean>>>({});
  const [autoFetchQueue, setAutoFetchQueue] = useState<AnalysisType[]>(["candlestick", "forca", "suporte_resistencia"]);

  // Bubble scores up whenever analyses change
  useEffect(() => {
    if (!onScoreUpdate) return;
    const scores: Partial<Record<AnalysisType, number>> = {};
    for (const key of ["candlestick", "forca", "suporte_resistencia"] as AnalysisType[]) {
      if (analyses[key]?.score != null) {
        scores[key] = analyses[key].score;
      }
    }
    if (Object.keys(scores).length > 0) {
      onScoreUpdate(scores);
    }
  }, [analyses, onScoreUpdate]);

  const requestAnalysis = async (type: AnalysisType) => {
    if (analyses[type]) return;

    setLoading(type);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: { ticker, chartData, analysisType: type },
      });

      if (error) throw error;
      if (data?.error) {
        if (!hidden) {
          toast({ title: "Erro na análise", description: data.error, variant: "destructive" });
        }
        return;
      }

      setAnalyses((prev) => ({ ...prev, [type]: data.analysis }));
    } catch (err) {
      console.error("Chart analysis error:", err);
      if (!hidden) {
        toast({ title: "Erro na análise", description: "Tente novamente.", variant: "destructive" });
      }
    } finally {
      setLoading(null);
    }
  };

  // Auto-fetch analyses sequentially on mount to get scores
  useEffect(() => {
    if (autoFetchQueue.length === 0 || loading) return;
    const next = autoFetchQueue[0];
    if (!analyses[next]) {
      requestAnalysis(next).then(() => {
        setAutoFetchQueue((q) => q.slice(1));
      });
    } else {
      setAutoFetchQueue((q) => q.slice(1));
    }
  }, [autoFetchQueue, loading, analyses]);

  const handleToggle = (type: AnalysisType) => {
    setOpenSections((prev) => ({ ...prev, [type]: !prev[type] }));
    if (!analyses[type] && loading !== type) {
      requestAnalysis(type);
    }
  };

  if (hidden) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-primary" />
        Análise Gráfica I.A.
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          AI
        </span>
      </h4>

      {analysisTypes.map((at) => {
        const Icon = at.icon;
        const isOpen = !!openSections[at.key];
        const isLoading = loading === at.key;
        const hasResult = !!analyses[at.key];

        return (
          <Collapsible key={at.key} open={isOpen} onOpenChange={() => handleToggle(at.key)}>
            <CollapsibleTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary/50 hover:bg-secondary/80 border border-border transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">{at.label}</span>
                  {hasResult && (
                    <Sparkles className="w-3 h-3 text-primary" />
                  )}
                  {isLoading && (
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="mt-1 bg-secondary/30 rounded-xl p-4 border border-border"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3 py-6">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <span className="text-xs text-muted-foreground">Analisando {ticker}...</span>
                      </div>
                    ) : hasResult ? (
                      renderAnalysis(at.key, analyses[at.key], chartData)
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">Não disponível. Tente novamente.</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default ChartAnalysis;
export type { AnalysisType };
