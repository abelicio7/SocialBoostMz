import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { DollarSign, RefreshCw, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AdminProviderBalance = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: settings } = usePlatformSettings();
  const exchangeRate = settings?.exchange_rate_brl_mzn ?? 10.5;

  const { data: balanceData, refetch, isLoading } = useQuery({
    queryKey: ["provider-balance"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("provider-api", {
        body: { action: "balance" },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao buscar saldo");
      return data.data as { balance: string; currency: string };
    },
    staleTime: 60000,
    retry: 1,
  });

  const balanceBRL = Number(balanceData?.balance || 0);
  const balanceMZN = balanceBRL * exchangeRate;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Saldo actualizado");
    } catch {
      toast.error("Erro ao actualizar saldo");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl glass-card premium-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Saldo do Fornecedor</h3>
            <p className="text-xs text-muted-foreground">Baratos Sociais</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="h-8 w-8"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing || isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-8 bg-muted rounded w-2/3" />
          <div className="h-6 bg-muted rounded w-1/2" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              R$ {balanceBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-muted-foreground">BRL</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-muted-foreground">
              ≈ {balanceMZN.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} MZN
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t border-border">
            <TrendingDown className="w-3 h-3" />
            <span>Taxa: 1 BRL = {exchangeRate} MZN</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProviderBalance;
