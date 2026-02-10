import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertTriangle, Wallet, ShoppingCart, Loader2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  platform: string;
  price_per_1000: number;
  min_quantity: number;
  max_quantity: number;
  daily_limit: number;
  estimated_time: string;
  description: string | null;
}

interface NewOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedServiceId?: string;
}

const NewOrderForm = ({ open, onOpenChange, preselectedServiceId }: NewOrderFormProps) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState<number>(1000);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch services
  const { data: services } = useQuery({
    queryKey: ['active-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('platform', { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
  });

  // Fetch profile for balance
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Set preselected service
  useEffect(() => {
    if (preselectedServiceId) {
      setSelectedServiceId(preselectedServiceId);
    }
  }, [preselectedServiceId]);

  // Get selected service details
  const selectedService = services?.find(s => s.id === selectedServiceId);
  
  // Calculate price
  const calculatePrice = () => {
    if (!selectedService) return 0;
    return (quantity / 1000) * Number(selectedService.price_per_1000);
  };

  const totalPrice = calculatePrice();
  const balance = Number(profile?.balance || 0);
  const hasEnoughBalance = balance >= totalPrice;

  // Create order mutation
  const createOrder = useMutation({
    mutationFn: async () => {
      if (!user || !selectedService) throw new Error("Dados inválidos");
      if (!link.trim()) throw new Error("Insira o link");
      if (quantity < selectedService.min_quantity || quantity > selectedService.max_quantity) {
        throw new Error(`Quantidade deve estar entre ${selectedService.min_quantity} e ${selectedService.max_quantity}`);
      }
      if (!hasEnoughBalance) throw new Error("Saldo insuficiente");

      // 1. Debit balance
      const newBalance = balance - totalPrice;
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user.id);
      
      if (balanceError) throw balanceError;

      // 2. Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          service_id: selectedService.id,
          quantity,
          link: link.trim(),
          total_price: totalPrice,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) {
        // Rollback balance
        await supabase
          .from('profiles')
          .update({ balance: balance })
          .eq('id', user.id);
        throw orderError;
      }

      // 3. Create transaction record
      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        amount: -totalPrice,
        type: 'order_payment',
        description: `Pagamento pedido #${order.id.slice(0, 8)} - ${selectedService.name}`,
        order_id: order.id,
      });

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Pedido criado com sucesso! Aguarde aprovação.');
      onOpenChange(false);
      setLink("");
      setQuantity(1000);
      setSelectedServiceId("");
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar pedido');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Faça login para continuar');
      navigate('/auth');
      return;
    }
    createOrder.mutate();
  };

  // Group services by platform
  const groupedServices = services?.reduce((acc, service) => {
    if (!acc[service.platform]) {
      acc[service.platform] = [];
    }
    acc[service.platform].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const platformLabels: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    twitter: "Twitter / X",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Novo Pedido
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo pedido. O valor será debitado do seu saldo.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          <form id="new-order-form" onSubmit={handleSubmit} className="space-y-6 pb-2">
            {/* Balance Display */}
            <div className="p-4 rounded-xl bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Saldo disponível</span>
              </div>
              <span className="font-bold text-primary">{balance.toLocaleString()} MZN</span>
            </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="service">Serviço</Label>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger id="service">
                  <SelectValue placeholder="Seleccione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {groupedServices && Object.entries(groupedServices).map(([platform, platformServices]) => (
                    <div key={platform}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        {platformLabels[platform] || platform}
                      </div>
                      {platformServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {Number(service.price_per_1000).toLocaleString()} MZN/1000
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Link Input */}
            <div className="space-y-2">
              <Label htmlFor="link">Link do Perfil/Publicação</Label>
              <Input
                id="link"
                type="url"
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Insira o link do perfil ou publicação onde deseja receber o serviço
              </p>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min={selectedService?.min_quantity || 100}
                max={selectedService?.max_quantity || 100000}
                step={100}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
              {selectedService && (
                <p className="text-xs text-muted-foreground">
                  Mín: {selectedService.min_quantity.toLocaleString()} • Máx: {selectedService.max_quantity.toLocaleString()} • Entrega: {selectedService.estimated_time}
                </p>
              )}
            </div>

            {/* Price Summary */}
            {selectedService && (
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Serviço</span>
                  <span>{selectedService.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantidade</span>
                  <span>{quantity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preço por 1000</span>
                  <span>{Number(selectedService.price_per_1000).toLocaleString()} MZN</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className={hasEnoughBalance ? "text-primary" : "text-destructive"}>
                    {totalPrice.toLocaleString()} MZN
                  </span>
                </div>
              </div>
            )}

            {/* Insufficient Balance Warning */}
            {selectedService && !hasEnoughBalance && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">
                  Saldo insuficiente. Carregue mais {(totalPrice - balance).toLocaleString()} MZN.
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Pode ocorrer queda de até 10% após entrega. Garantia de refill até 48h.
              </p>
            </div>
          </form>
        </div>

        <DialogFooter className="pt-4 border-t border-border flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            type="submit"
            form="new-order-form"
            disabled={!selectedService || !link.trim() || !hasEnoughBalance || createOrder.isPending}
          >
            {createOrder.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A processar...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Confirmar Pedido
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewOrderForm;
