import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Facebook, Instagram, Youtube, Twitter, Music2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const platforms = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "from-blue-500 to-blue-600" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "from-pink-500 to-purple-600" },
  { id: "tiktok", name: "TikTok", icon: Music2, color: "from-gray-800 to-gray-900" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "from-red-500 to-red-600" },
  { id: "twitter", name: "Twitter / X", icon: Twitter, color: "from-gray-700 to-gray-800" },
];

const services = {
  facebook: [
    { id: 1, name: "Seguidores para Páginas", price: 350, quantity: 1000, time: "1-24h", description: "Seguidores reais para a sua página" },
    { id: 2, name: "Curtidas", price: 100, quantity: 1000, time: "1-12h", description: "Curtidas para as suas publicações" },
    { id: 3, name: "Reação Amei", price: 120, quantity: 1000, time: "1-12h", description: "Reações de amor nas publicações" },
  ],
  instagram: [
    { id: 1, name: "Curtidas", price: 145, quantity: 1000, time: "1-12h", description: "Curtidas para o seu conteúdo" },
    { id: 2, name: "Respostagem", price: 200, quantity: 1000, time: "1-24h", description: "Respostagens do seu conteúdo" },
    { id: 3, name: "Alcance + Impressões + Visitas no Perfil", price: 170, quantity: 1000, time: "1-24h", description: "Aumente o alcance e impressões" },
  ],
  tiktok: [
    { id: 1, name: "Seguidores", price: 370, quantity: 1000, time: "1-24h", description: "Seguidores activos no TikTok" },
    { id: 2, name: "Visualizações", price: 100, quantity: 1000, time: "1-6h", description: "Visualizações nos seus vídeos" },
    { id: 3, name: "Curtidas", price: 130, quantity: 1000, time: "1-12h", description: "Curtidas nos seus vídeos" },
  ],
  youtube: [
    { id: 1, name: "Visualizações", price: 250, quantity: 1000, time: "1-24h", description: "Visualizações nos vídeos (máx 10k/dia)" },
  ],
  twitter: [
    { id: 1, name: "Seguidores", price: 480, quantity: 1000, time: "1-24h", description: "Seguidores activos no Twitter/X" },
    { id: 2, name: "Curtidas", price: 150, quantity: 1000, time: "1-12h", description: "Curtidas nos tweets" },
    { id: 3, name: "Visualizações em Vídeos", price: 120, quantity: 1000, time: "1-6h", description: "Visualizações nos vídeos" },
    { id: 4, name: "Retweets", price: 250, quantity: 1000, time: "1-24h", description: "Retweets nos seus posts" },
  ],
};

const Services = () => {
  const [activePlatform, setActivePlatform] = useState("facebook");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Catálogo de Serviços
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Escolha a Sua Rede Social
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Seleccione a plataforma e o serviço que pretende. Todos os preços são em MZN.
            </p>
          </div>

          {/* Platform Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setActivePlatform(platform.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activePlatform === platform.id
                    ? "bg-primary text-primary-foreground shadow-gold"
                    : "bg-card border border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                <platform.icon className="w-5 h-5" />
                {platform.name}
              </button>
            ))}
          </div>

          {/* Warning Banner */}
          <div className="max-w-4xl mx-auto mb-8 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-warning">Aviso:</strong> Pode ocorrer uma queda de até 10% após a entrega. 
              Garantia de refill até 48h após conclusão.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {services[activePlatform as keyof typeof services].map((service, index) => (
              <div
                key={service.id}
                className="p-6 rounded-2xl glass-card premium-border group hover:scale-[1.02] transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    <Clock className="w-3 h-3 mr-1" />
                    {service.time}
                  </Badge>
                </div>

                <div className="flex items-end justify-between mt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Por {service.quantity.toLocaleString()}</p>
                    <p className="text-2xl font-bold text-primary">
                      {service.price} <span className="text-sm font-normal text-muted-foreground">MZN</span>
                    </p>
                  </div>
                  <Link to="/auth">
                    <Button variant="outline" size="sm">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Pedir
                    </Button>
                  </Link>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Mín: 100 • Máx: 100.000 • Limite diário: 200.000
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-4">
              Pronto para começar? Crie uma conta e carregue o seu saldo.
            </p>
            <Link to="/auth">
              <Button variant="hero" size="lg">
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Services;
