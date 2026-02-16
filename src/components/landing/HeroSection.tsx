import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4 animate-fade-in">
            <Zap className="w-4 h-4" />
            <span>Líder em Crescimento Social em Moçambique</span>
          </div>


          {/* Headline */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Acelere o Seu{" "}
            <span className="text-gradient-gold">Crescimento</span>
            <br />nas Redes Sociais
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Seguidores, gostos, visualizações e muito mais. Serviços premium com entrega rápida, 
            preços acessíveis e suporte dedicado 24/7.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/auth">
              <Button variant="hero" size="xl">
                Começar Agora
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/servicos">
              <Button variant="outline" size="xl">
                Ver Serviços
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl glass-card">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">100% Seguro</p>
                <p className="text-sm text-muted-foreground">Dados protegidos</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl glass-card">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Entrega Rápida</p>
                <p className="text-sm text-muted-foreground">Início em 24h</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl glass-card">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">+50K Clientes</p>
                <p className="text-sm text-muted-foreground">Satisfeitos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
