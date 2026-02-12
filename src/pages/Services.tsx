import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Facebook, Instagram, Youtube, Twitter, Music2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import NewOrderForm from "@/components/orders/NewOrderForm";

interface DbService {
  id: string;
  name: string;
  platform: string;
  price_per_1000: number;
  min_quantity: number;
  max_quantity: number;
  daily_limit: number;
  estimated_time: string;
  description: string | null;
  is_active: boolean;
}

const platforms = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "from-blue-500 to-blue-600" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "from-pink-500 to-purple-600" },
  { id: "tiktok", name: "TikTok", icon: Music2, color: "from-gray-800 to-gray-900" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "from-red-500 to-red-600" },
  { id: "twitter", name: "Twitter / X", icon: Twitter, color: "from-gray-700 to-gray-800" },
];

const Services = () => {
  const [activePlatform, setActivePlatform] = useState("facebook");
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch services from database
  const { data: dbServices } = useQuery({
    queryKey: ['services-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('platform', { ascending: true });
      if (error) throw error;
      return data as DbService[];
    },
  });

  // Filter services by platform
  const platformServices = dbServices?.filter(s => s.platform === activePlatform) || [];

  const handleOrderClick = (serviceId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setSelectedServiceId(serviceId);
    setOrderDialogOpen(true);
  };

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
              Seleccione a plataforma e o serviço que pretende. Pedido mínimo de apenas <strong className="text-primary">100 unidades</strong>. Preços por 1.000 unidades em MZN.
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
            {platformServices.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                A carregar serviços...
              </div>
            ) : (
              platformServices.map((service, index) => (
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
                      {service.estimated_time}
                    </Badge>
                  </div>

                    <div className="flex items-end justify-between mt-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Preço por 1.000 unidades</p>
                      <p className="text-2xl font-bold text-primary">
                        {Number(service.price_per_1000).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">MZN</span>
                      </p>
                      <p className="text-xs text-success font-medium mt-0.5">
                        Mín. 100 und. = {(Number(service.price_per_1000) / 10).toLocaleString()} MZN
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOrderClick(service.id)}
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Pedir
                    </Button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      Mín: {service.min_quantity.toLocaleString()} • Máx: {service.max_quantity.toLocaleString()} • Limite diário: {service.daily_limit.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-4">
              Pronto para começar? Crie uma conta e carregue o seu saldo.
            </p>
            {user ? (
              <Button variant="hero" size="lg" onClick={() => setOrderDialogOpen(true)}>
                Fazer Novo Pedido
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="hero" size="lg">
                  Criar Conta Grátis
                </Button>
              </Link>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Order Dialog */}
      <NewOrderForm 
        open={orderDialogOpen} 
        onOpenChange={setOrderDialogOpen}
        preselectedServiceId={selectedServiceId}
      />
    </div>
  );
};

export default Services;
