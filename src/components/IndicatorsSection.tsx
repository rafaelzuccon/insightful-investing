import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const indicators = [
  {
    name: "P/L (Preço/Lucro)",
    description: "Quanto o mercado paga por cada R$1 de lucro. Muito alto = expectativa exagerada, muito baixo = oportunidade.",
    status: "neutral" as const,
  },
  {
    name: "ROE (Retorno sobre Patrimônio)",
    description: "Mede eficiência em gerar lucro com capital próprio. Acima de 15% é considerado bom.",
    status: "up" as const,
  },
  {
    name: "Dividend Yield",
    description: "Para quem busca renda passiva. Mostra quanto paga em dividendos por ano em relação ao preço.",
    status: "up" as const,
  },
  {
    name: "P/VP (Preço/Valor Patrimonial)",
    description: "Muito usado em bancos e empresas tradicionais. Abaixo de 1 pode indicar desconto.",
    status: "neutral" as const,
  },
  {
    name: "Margem Líquida",
    description: "Margem alta indica eficiência. Compare sempre com concorrentes do mesmo setor.",
    status: "up" as const,
  },
  {
    name: "Dívida Líquida / EBITDA",
    description: "Dívida muito alta é risco. Esse indicador mostra quantos anos de lucro operacional para pagar a dívida.",
    status: "down" as const,
  },
];

const statusConfig = {
  up: { icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
  down: { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
  neutral: { icon: Minus, color: "text-warning", bg: "bg-warning/10" },
};

const IndicatorsSection = () => {
  return (
    <section id="indicators" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            Indicadores que <span className="text-gradient">importam</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Métricas essenciais analisadas pela nossa I.A. para cada empresa.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {indicators.map((indicator, i) => {
            const config = statusConfig[indicator.status];
            const Icon = config.icon;
            return (
              <motion.div
                key={indicator.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm font-mono">{indicator.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{indicator.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default IndicatorsSection;
