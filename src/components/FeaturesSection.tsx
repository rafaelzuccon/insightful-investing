import { motion } from "framer-motion";
import {
  TrendingUp, DollarSign, PieChart, Newspaper,
  ShieldCheck, Users, BarChart3, Brain,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Análise por I.A.",
    description: "Algoritmos avançados avaliam riscos de subir ou cair em tempo real usando machine learning.",
  },
  {
    icon: BarChart3,
    title: "Fundamentos Financeiros",
    description: "Receita, lucro, margem líquida, endividamento e fluxo de caixa analisados automaticamente.",
  },
  {
    icon: PieChart,
    title: "Indicadores Completos",
    description: "P/L, ROE, Dividend Yield, P/VP e dezenas de métricas atualizadas em tempo real.",
  },
  {
    icon: Newspaper,
    title: "Notícias em Tempo Real",
    description: "Todas as notícias envolvendo a empresa agregadas e analisadas por sentimento.",
  },
  {
    icon: ShieldCheck,
    title: "Vantagem Competitiva",
    description: "Identifique líderes de mercado como Petrobras, Itaú e WEG com análise setorial.",
  },
  {
    icon: DollarSign,
    title: "Cenário Econômico",
    description: "Impacto de juros, inflação e concorrência no desempenho das ações.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="container relative z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            Tudo que você precisa para <span className="text-gradient">investir melhor</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Análise completa de empresas com inteligência artificial, fundamentos e notícias.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all duration-300 card-glow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 font-display">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
