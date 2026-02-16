import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Comece Agora</span>
          </div>

          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Pronto Para <span className="text-gradient-gold">Crescer</span>?
          </h2>

          <p className="text-lg text-muted-foreground mb-4 max-w-xl mx-auto">
            Junte-se a milhares de moçambicanos que já estão a impulsionar 
            as suas redes sociais com o SocialBoostMz.
          </p>


          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button variant="hero" size="xl">
                Criar Conta Grátis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/servicos">
              <Button variant="glass" size="xl">
                Ver Preços
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Sem cartão de crédito. Carregue saldo apenas quando precisar.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
