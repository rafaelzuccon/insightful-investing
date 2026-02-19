import { motion } from "framer-motion";
import { Check, Zap, Crown, Rocket } from "lucide-react";

const plans = [
  {
    name: "Básico",
    price: "Grátis",
    period: "",
    icon: Zap,
    description: "Para começar a explorar",
    features: [
      "5 análises por mês",
      "Indicadores básicos",
      "Notícias limitadas",
      "1 empresa monitorada",
    ],
    cta: "Começar Grátis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$49",
    period: "/mês",
    icon: Crown,
    description: "Para investidores sérios",
    features: [
      "Análises ilimitadas",
      "Todos os indicadores",
      "Notícias em tempo real",
      "50 empresas monitoradas",
      "Alertas personalizados",
      "Análise de sentimento I.A.",
    ],
    cta: "Assinar Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "R$199",
    period: "/mês",
    icon: Rocket,
    description: "Para equipes e gestores",
    features: [
      "Tudo do Pro",
      "API de acesso",
      "Relatórios customizados",
      "Empresas ilimitadas",
      "Suporte prioritário",
      "Dashboard exclusivo",
    ],
    cta: "Falar com vendas",
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="container relative z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            Planos para cada <span className="text-gradient">objetivo</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Crescimento rápido, dividendos ou longo prazo — escolha o plano ideal.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`relative p-8 rounded-2xl border transition-all duration-300 ${
                plan.highlighted
                  ? "border-primary/50 bg-card glow"
                  : "border-border bg-card/50 hover:border-border/80"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  Mais popular
                </div>
              )}

              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <plan.icon className="w-5 h-5 text-primary" />
              </div>

              <h3 className="text-xl font-bold font-display">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.highlighted
                    ? "text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
                style={plan.highlighted ? { background: "var(--gradient-primary)" } : undefined}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
