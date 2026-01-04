import { Wallet, Clock, Headphones, RefreshCw, Lock, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Wallet Integrada",
    description: "Carregue o seu saldo com M-Pesa ou E-Mola e faça pedidos instantaneamente.",
  },
  {
    icon: Clock,
    title: "Entrega Rápida",
    description: "Maioria dos pedidos inicia a partir de 10 minutos após confirmação do pagamento.",
  },
  {
    icon: Headphones,
    title: "Suporte 24/7",
    description: "Chat interno para suporte directo. Estamos sempre aqui para ajudar.",
  },
  {
    icon: RefreshCw,
    title: "Garantia Refill",
    description: "Reposição gratuita até 48h após conclusão, mediante comprovativo.",
  },
  {
    icon: Lock,
    title: "Pagamento Seguro",
    description: "Integração directa com M-Pesa e E-Mola. Saldo confirmado automaticamente.",
  },
  {
    icon: TrendingUp,
    title: "Resultados Reais",
    description: "Crescimento orgânico e natural para o seu perfil ou página.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 md:py-32 bg-card/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Porquê Escolher-nos
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Vantagens <span className="text-gradient-gold">Premium</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Oferecemos a melhor experiência de crescimento nas redes sociais em Moçambique.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-background border border-border hover:border-primary/30 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
