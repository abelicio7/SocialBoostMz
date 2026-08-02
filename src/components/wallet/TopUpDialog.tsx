import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Smartphone, Wallet, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PaymentMethod = "mpesa" | "emola";

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

const TopUpDialog = ({ open, onOpenChange }: TopUpDialogProps) => {
  const [step, setStep] = useState<"amount" | "payment" | "processing" | "success" | "failed">("amount");
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string>("");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Realtime subscription + polling fallback for pending payment status (E-Mola)
  useEffect(() => {
    if (!pendingPaymentId || !user) return;

    const handleResolved = (status: "success" | "failed") => {
      if (status === "success") {
        setStep("success");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["user-transactions"] });
        toast.success("Recarga confirmada!");
        if (typeof window !== "undefined" && (window as any).fbq) {
          (window as any).fbq("track", "Purchase", { value: amount, currency: "MZN" });
        }
      } else {
        setStep("failed");
        toast.error("Pagamento não foi confirmado.");
      }
      setPendingPaymentId(null);
    };

    const channel = supabase
      .channel(`pending-${pendingPaymentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pending_payments",
          filter: `payment_id=eq.${pendingPaymentId}`,
        },
        (payload) => {
          const newStatus = (payload.new as any)?.status;
          if (newStatus === "success" || newStatus === "failed") handleResolved(newStatus);
        }
      )
      .subscribe();

    // Polling fallback (every 5s) — covers webhook delivery failures
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke("check-payment-status", {
          body: { payment_id: pendingPaymentId },
        });
        if (data?.status === "success" || data?.status === "failed") handleResolved(data.status);
      } catch (e) {
        console.error("poll error", e);
      }
    }, 5000);

    // Timeout fallback after 3 minutes
    timeoutRef.current = setTimeout(() => {
      setStep("failed");
      setPendingPaymentId(null);
      toast.error("Tempo esgotado. Se confirmou no telefone, o saldo aparecerá em instantes.");
    }, 180_000);

    return () => {
      supabase.removeChannel(channel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pendingPaymentId, user, amount, queryClient]);


  const processPayment = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Utilizador não autenticado");

      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          userId: user.id,
          amount: amount,
          phone: phone,
          method: method,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      if (data.status === "pending" && data.payment_id) {
        setPendingPaymentId(data.payment_id);
        setProcessingMessage(
          "Confirme o pagamento no seu telefone. O saldo será actualizado automaticamente quando confirmar."
        );
        return;
      }

      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-transactions"] });
      toast.success("Recarga efectuada com sucesso!");

      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Purchase", {
          value: amount,
          currency: "MZN",
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao processar pagamento");
      setStep("payment");
    },
  });

  const handleClose = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    setStep("amount");
    setAmount(500);
    setCustomAmount("");
    setPhone("");
    setMethod("mpesa");
    setPendingPaymentId(null);
    setProcessingMessage("");
    onOpenChange(false);
  };

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 50) {
      setAmount(numValue);
    }
  };

  const handleContinueToPayment = () => {
    if (amount < 50) {
      toast.error("Valor mínimo de recarga é 50 MZN");
      return;
    }
    setStep("payment");
  };

  const handleSubmitPayment = () => {
    if (!phone) {
      toast.error("Por favor, insira o número de telefone");
      return;
    }

    // Validate phone format
    const validMpesa = /^8[45]\d{7}$/.test(phone);
    const validEmola = /^8[67]\d{7}$/.test(phone);

    if (method === "mpesa" && !validMpesa) {
      toast.error("Número M-Pesa inválido (deve começar com 84 ou 85)");
      return;
    }

    if (method === "emola" && !validEmola) {
      toast.error("Número E-Mola inválido (deve começar com 86 ou 87)");
      return;
    }

    setStep("processing");
    processPayment.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            {step === "amount" && "Carregar Saldo"}
            {step === "payment" && "Método de Pagamento"}
            {step === "processing" && "Processando..."}
            {step === "success" && "Recarga Concluída!"}
            {step === "failed" && "Pagamento Não Confirmado"}
          </DialogTitle>
        </DialogHeader>

        {step === "amount" && (
          <div className="space-y-6">
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                Selecione ou insira o valor a carregar
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleAmountSelect(preset)}
                    className={cn(
                      "p-3 rounded-xl border text-center font-semibold transition-all",
                      amount === preset && !customAmount
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    {preset.toLocaleString()} MZN
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="custom-amount" className="text-sm text-muted-foreground">
                Ou insira outro valor (mínimo 50 MZN)
              </Label>
              <div className="relative mt-2">
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder="Outro valor"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pr-16"
                  min={50}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  MZN
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground">Valor a carregar</p>
              <p className="text-2xl font-bold text-primary">{amount.toLocaleString()} MZN</p>
            </div>

            <Button onClick={handleContinueToPayment} className="w-full" size="lg">
              Continuar
            </Button>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-6">
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                Escolha o método de pagamento
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMethod("mpesa")}
                  className={cn(
                    "p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                    method === "mpesa"
                      ? "border-red-500 bg-red-500/10"
                      : "border-border bg-card hover:border-red-500/50"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-border/50 flex items-center justify-center overflow-hidden p-1">
                    <img src="/mpesa.png" alt="M-Pesa" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-medium">M-Pesa</span>
                  <span className="text-xs text-muted-foreground">84/85</span>
                </button>
                <button
                  onClick={() => setMethod("emola")}
                  className={cn(
                    "p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                    method === "emola"
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-border bg-card hover:border-orange-500/50"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-border/50 flex items-center justify-center overflow-hidden p-1">
                    <img src="/emola.png" alt="E-Mola" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-medium">E-Mola</span>
                  <span className="text-xs text-muted-foreground">86/87</span>
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Número de Telefone</Label>
              <div className="relative mt-2">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder={method === "mpesa" ? "84/85XXXXXXX" : "86/87XXXXXXX"}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  className="pl-10"
                  maxLength={9}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Introduza o número {method === "mpesa" ? "M-Pesa" : "E-Mola"} para receber o pedido de pagamento
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor a carregar</span>
                <span className="font-semibold">{amount.toLocaleString()} MZN</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Método</span>
                <span className="font-semibold">{method === "mpesa" ? "M-Pesa" : "E-Mola"}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("amount")} className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleSubmitPayment} className="flex-1" size="lg">
                Pagar Agora
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {pendingPaymentId ? "Aguardando Confirmação" : "Processando Pagamento"}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                {processingMessage || "Aguarde a confirmação no seu telefone..."}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Verifique o seu {method === "mpesa" ? "M-Pesa" : "E-Mola"} e confirme o pagamento
            </p>
          </div>
        )}

        {step === "failed" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Pagamento Não Confirmado</h3>
              <p className="text-muted-foreground text-sm mt-1">
                O pagamento não foi confirmado a tempo. Se confirmou no telefone, o saldo aparecerá em instantes.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full" size="lg">
              Fechar
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Recarga Efectuada com Sucesso!</h3>
              <p className="text-muted-foreground text-sm mt-1">
                O seu saldo foi actualizado.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground">Valor carregado</p>
              <p className="text-2xl font-bold text-success">+{amount.toLocaleString()} MZN</p>
            </div>
            <Button onClick={handleClose} className="w-full" size="lg">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TopUpDialog;
