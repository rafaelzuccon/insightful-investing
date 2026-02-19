import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Brain } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      {/* Glow effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "var(--gradient-glow)" }}
      />

      <div className="container relative z-10 mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8"
          >
            <Brain className="w-4 h-4" />
            Inteligência Artificial Avançada
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 font-display">
            Analise riscos com{" "}
            <span className="text-gradient">precisão de I.A.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Nossa inteligência artificial analisa fundamentos, indicadores e notícias
            em tempo real para prever tendências de ações na bolsa de valores.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-primary-foreground font-semibold text-lg glow"
              style={{ background: "var(--gradient-primary)" }}
            >
              Comece sua análise
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <button className="flex items-center gap-2 px-8 py-4 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors">
              <BarChart3 className="w-5 h-5" />
              Ver demonstração
            </button>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16"
          >
            {[
              { value: "500+", label: "Empresas analisadas" },
              { value: "97%", label: "Precisão da I.A." },
              { value: "24/7", label: "Monitoramento" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-bold text-gradient">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
