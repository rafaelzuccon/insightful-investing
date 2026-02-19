import { motion } from "framer-motion";
import { TrendingUp, Shield, Zap } from "lucide-react";

const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80"
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold font-display">RiskAI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
          <a href="#indicators" className="hover:text-foreground transition-colors">Indicadores</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">Entrar</button>
          <button className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Começar Grátis
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
