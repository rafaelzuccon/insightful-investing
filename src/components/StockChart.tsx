import { useState, useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { CandlestickChart, LineChart as LineChartIcon } from "lucide-react";

export type CandleData = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

// Seeded random for consistent data per ticker
export const seededRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  };
};

export const generateCandlestickData = (
  ticker: string,
  currentPrice: number,
  days: number = 60
): CandleData[] => {
  const rng = seededRandom(ticker);
  const data: CandleData[] = [];
  let price = currentPrice * (0.85 + rng() * 0.15);

  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const volatility = 0.015 + rng() * 0.025;
    const drift = (currentPrice - price) / (i + 10) * 0.3;
    const change = drift + (rng() - 0.48) * price * volatility;

    const open = price;
    const close = price + change;
    const highExtra = Math.abs(change) * (0.2 + rng() * 1.2);
    const lowExtra = Math.abs(change) * (0.2 + rng() * 1.2);
    const high = Math.max(open, close) + highExtra;
    const low = Math.min(open, close) - lowExtra;
    const volume = Math.round(500000 + rng() * 3000000);

    data.push({
      date: `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume,
    });

    price = close;
  }

  return data;
};

// Custom candlestick shape
const CandlestickShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;

  const { open, high, low, close } = payload;
  const isUp = close >= open;
  const color = isUp ? "hsl(var(--success))" : "hsl(var(--destructive))";

  const yScale = props.yScale || ((v: number) => y);
  const candleX = x + width / 2;
  const wickWidth = 1;

  const bodyTop = yScale(Math.max(open, close));
  const bodyBottom = yScale(Math.min(open, close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

  return (
    <g>
      {/* Wick */}
      <line
        x1={candleX}
        y1={yScale(high)}
        x2={candleX}
        y2={yScale(low)}
        stroke={color}
        strokeWidth={wickWidth}
      />
      {/* Body */}
      <rect
        x={x + 1}
        y={bodyTop}
        width={Math.max(width - 2, 2)}
        height={bodyHeight}
        fill={isUp ? color : color}
        stroke={color}
        strokeWidth={0.5}
        rx={1}
        opacity={isUp ? 0.9 : 0.9}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const isUp = d.close >= d.open;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs space-y-1">
      <p className="font-semibold text-foreground">{d.date}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-muted-foreground">Abertura:</span>
        <span className="font-mono text-right">R${d.open.toFixed(2)}</span>
        <span className="text-muted-foreground">Máxima:</span>
        <span className="font-mono text-right text-success">R${d.high.toFixed(2)}</span>
        <span className="text-muted-foreground">Mínima:</span>
        <span className="font-mono text-right text-destructive">R${d.low.toFixed(2)}</span>
        <span className="text-muted-foreground">Fechamento:</span>
        <span className={`font-mono text-right font-bold ${isUp ? "text-success" : "text-destructive"}`}>
          R${d.close.toFixed(2)}
        </span>
      </div>
      <p className="text-muted-foreground pt-1 border-t border-border mt-1">
        Vol: {(d.volume / 1000000).toFixed(1)}M
      </p>
    </div>
  );
};

type StockChartProps = {
  ticker: string;
  currentPrice: number;
  className?: string;
};

const StockChart = ({ ticker, currentPrice, className = "" }: StockChartProps) => {
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const [period, setPeriod] = useState<number>(30);

  const fullData = useMemo(
    () => generateCandlestickData(ticker, currentPrice, 90),
    [ticker, currentPrice]
  );

  const data = useMemo(() => fullData.slice(-period), [fullData, period]);

  const priceMin = useMemo(
    () => Math.min(...data.map((d) => d.low)) * 0.995,
    [data]
  );
  const priceMax = useMemo(
    () => Math.max(...data.map((d) => d.high)) * 1.005,
    [data]
  );

  const firstClose = data[0]?.close ?? 0;
  const lastClose = data[data.length - 1]?.close ?? 0;
  const periodChange = firstClose ? ((lastClose - firstClose) / firstClose) * 100 : 0;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            {chartType === "candle" ? (
              <CandlestickChart className="w-4 h-4 text-primary" />
            ) : (
              <LineChartIcon className="w-4 h-4 text-primary" />
            )}
            Histórico de Preço
          </h4>
          <span className={`text-xs font-mono font-bold ${periodChange >= 0 ? "text-success" : "text-destructive"}`}>
            {periodChange >= 0 ? "+" : ""}{periodChange.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Period buttons */}
          {[
            { label: "15D", value: 15 },
            { label: "1M", value: 30 },
            { label: "3M", value: 90 },
          ].map((p) => (
            <button
              key={p.label}
              onClick={(e) => { e.stopPropagation(); setPeriod(p.value); }}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                period === p.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
          {/* Chart type toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setChartType(chartType === "candle" ? "line" : "candle"); }}
            className="ml-1 p-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            {chartType === "candle" ? (
              <LineChartIcon className="w-3.5 h-3.5" />
            ) : (
              <CandlestickChart className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-xl p-2 border border-border">
        <ResponsiveContainer width="100%" height={200}>
          {chartType === "candle" ? (
            <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval={Math.floor(data.length / 5)}
              />
              <YAxis
                domain={[priceMin, priceMax]}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v.toFixed(0)}`}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={currentPrice}
                stroke="hsl(var(--primary))"
                strokeDasharray="3 3"
                strokeWidth={1}
                opacity={0.5}
              />
              <Bar
                dataKey="high"
                shape={(props: any) => {
                  const yAxis = props.background;
                  // Get y scale from the chart
                  const yScale = (value: number) => {
                    const range = priceMax - priceMin;
                    const chartHeight = 190;
                    const top = 5;
                    return top + ((priceMax - value) / range) * chartHeight;
                  };
                  return <CandlestickShape {...props} yScale={yScale} />;
                }}
                isAnimationActive={false}
              />
            </ComposedChart>
          ) : (
            <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`gradient-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={periodChange >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={periodChange >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval={Math.floor(data.length / 5)}
              />
              <YAxis
                domain={[priceMin, priceMax]}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v.toFixed(0)}`}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={currentPrice}
                stroke="hsl(var(--primary))"
                strokeDasharray="3 3"
                strokeWidth={1}
                opacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke={periodChange >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;
