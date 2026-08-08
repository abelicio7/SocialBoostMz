import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero pt-20">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <div className="container relative z-10 px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Column: Text Content */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium animate-fade-in">
              <Zap className="w-4 h-4" />
              <span>Líder em Crescimento Social em Moçambique</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Acelere o Seu{" "}
              <span className="text-gradient-gold">Crescimento</span>
              <br />nas Redes Sociais
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Seguidores, gostos, visualizações e muito mais. Serviços premium com entrega rápida, 
              preços acessíveis e suporte dedicado 24/7.
            </p>

            {/* Tutorial link */}
            <div className="animate-fade-in" style={{ animationDelay: "0.25s" }}>
              <a
                href="https://youtu.be/m1tpmMNzHFw?si=jqrSYYlqIeTQxPYY"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                🎬 Veja o tutorial em vídeo no YouTube
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Link to="/auth">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Começar Agora
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/servicos">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Ver Serviços
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 max-w-2xl mx-auto lg:mx-0 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl glass-card">
                <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-success" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm text-foreground">100% Seguro</p>
                  <p className="text-xs text-muted-foreground">Sem senhas</p>
                </div>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl glass-card">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm text-foreground">Entrega Rápida</p>
                  <p className="text-xs text-muted-foreground">Início em 24h</p>
                </div>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl glass-card">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm text-foreground">+50K Clientes</p>
                  <p className="text-xs text-muted-foreground">Satisfeitos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dashboard Mockup */}
          <div className="lg:col-span-5 flex justify-center items-center relative animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {/* Glow Backlight */}
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-[100px] -z-10 scale-75 animate-pulse-slow" />
            
            {/* Mockup Container */}
            <div className="relative w-full max-w-[420px] aspect-[4/3] rounded-2xl p-1 bg-gradient-to-br from-primary/30 via-border/50 to-accent/30 shadow-card animate-float">
              <div className="w-full h-full rounded-[14px] overflow-hidden bg-card/90 backdrop-blur-md relative border border-border/40">
                <img 
                  src="/dashboard-mockup.png" 
                  alt="SocialBoostMz Dashboard Preview" 
                  className="w-full h-full object-cover object-center opacity-90 hover:opacity-100 transition-opacity duration-500"
                />
                
                {/* Decorative Elements */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
                </div>
                
                <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-lg border border-border px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-gold text-xs">
                  <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                  <span className="font-semibold text-foreground">Carteira Activa: MZN</span>
                </div>
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
