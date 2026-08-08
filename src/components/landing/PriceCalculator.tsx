import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Clock, HelpCircle, AlertCircle, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
  { id: "facebook", name: "Facebook" },
  { id: "instagram", name: "Instagram" },
  { id: "tiktok", name: "TikTok" },
  { id: "youtube", name: "YouTube" },
  { id: "twitter", name: "Twitter / X" },
];

const PriceCalculator = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("facebook");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1000);
  const { user } = useAuth();

  // Fetch active services
  const { data: services, isLoading } = useQuery({
    queryKey: ["calculator-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("platform", { ascending: true });
      if (error) throw error;
      return data as DbService[];
    },
  });

  // Filter services by active platform
  const platformServices = services?.filter((s) => s.platform === selectedPlatform) || [];

  // Reset selected service when platform changes
  useEffect(() => {
    if (platformServices.length > 0) {
      // Prefer first service
      setSelectedServiceId(platformServices[0].id);
      setQuantity(Math.max(1000, platformServices[0].min_quantity));
    } else {
      setSelectedServiceId("");
    }
  }, [selectedPlatform, services]);

  const activeService = platformServices.find((s) => s.id === selectedServiceId);

  // Handle quantity changes with constraints
  const handleQuantityChange = (val: number) => {
    if (!activeService) return;
    setQuantity(val);
  };

  const calculatePrice = () => {
    if (!activeService) return 0;
    return (quantity * activeService.price_per_1000) / 1000;
  };

  // Validate quantities
  const isMinInvalid = activeService ? quantity < activeService.min_quantity : false;
  const isMaxInvalid = activeService ? quantity > activeService.max_quantity : false;
  const hasErrors = isMinInvalid || isMaxInvalid;

  return (
    <section className="py-20 md:py-32 relative bg-gradient-to-b from-background via-card/20 to-background overflow-hidden border-t border-border/40">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="container relative z-10 px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Simulador de Preço
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Calcule o Seu Investimento
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Simule o custo exato em Meticais (MZN) antes de fazer o seu pedido. Transparente e sem custos ocultos.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Card */}
          <Card className="lg:col-span-7 glass-card premium-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Calculator className="w-5 h-5 text-primary animate-pulse-slow" />
                Configurar Pedido
              </CardTitle>
              <CardDescription>
                Escolha a rede social, o serviço desejado e a quantidade pretendida.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Platform Selector */}
              <div className="space-y-2">
                <Label htmlFor="platform">Rede Social</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger id="platform" className="bg-background/50 border-border/80">
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {platforms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Selector */}
              <div className="space-y-2">
                <Label htmlFor="service">Serviço</Label>
                <Select
                  value={selectedServiceId}
                  onValueChange={setSelectedServiceId}
                  disabled={isLoading || platformServices.length === 0}
                >
                  <SelectTrigger id="service" className="bg-background/50 border-border/80">
                    <SelectValue placeholder={isLoading ? "A carregar serviços..." : "Selecione o serviço"} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {platformServices.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-sm">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity Input */}
              {activeService && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="quantity">Quantidade</Label>
                    <span className="text-xs text-muted-foreground">
                      Mín: {activeService.min_quantity.toLocaleString()} • Máx: {activeService.max_quantity.toLocaleString()}
                    </span>
                  </div>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity || ""}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                    min={activeService.min_quantity}
                    max={activeService.max_quantity}
                    className={`bg-background/50 border-border/80 ${
                      hasErrors ? "border-destructive/60 focus-visible:ring-destructive" : ""
                    }`}
                  />
                  {isMinInvalid && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      A quantidade mínima permitida para este serviço é {activeService.min_quantity.toLocaleString()}.
                    </p>
                  )}
                  {isMaxInvalid && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      A quantidade máxima permitida para este serviço é {activeService.max_quantity.toLocaleString()}.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
            {activeService && (
              <CardFooter className="bg-muted/30 border-t border-border/30 rounded-b-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Entrega Estimada: <strong>{activeService.estimated_time}</strong></span>
                </div>
                {activeService.description && (
                  <p className="text-xs text-muted-foreground italic text-left max-w-xs line-clamp-1">
                    {activeService.description}
                  </p>
                )}
              </CardFooter>
            )}
          </Card>

          {/* Pricing Result Card */}
          <Card className="lg:col-span-5 bg-gradient-to-br from-card to-background border-primary/20 shadow-glow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg text-muted-foreground uppercase tracking-widest font-semibold">
                Total Estimado
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="py-6">
                <span className="text-5xl md:text-6xl font-extrabold text-gradient-gold block">
                  {calculatePrice().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-muted-foreground font-semibold text-lg mt-2 block">
                  Meticais (MZN)
                </span>
              </div>

              {activeService && (
                <div className="p-4 rounded-xl bg-background/60 border border-border/50 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Preço por 1.000:</span>
                    <span className="font-semibold text-foreground">{Number(activeService.price_per_1000).toLocaleString()} MZN</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantidade simulada:</span>
                    <span className="font-semibold text-primary">{quantity.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border/40 pt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Plataforma:</span>
                    <span className="font-semibold text-foreground capitalize">{selectedPlatform}</span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="pb-8 pt-2">
              <Link to={user ? "/dashboard" : "/auth"} className="w-full">
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="w-full text-base font-semibold py-6"
                  disabled={hasErrors || !activeService}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Encomendar Agora
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PriceCalculator;
