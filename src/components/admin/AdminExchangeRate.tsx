import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { RefreshCw, Loader2, ArrowRightLeft } from "lucide-react";

const AdminExchangeRate = () => {
  const { data: settings } = usePlatformSettings();
  const queryClient = useQueryClient();
  const [manualRate, setManualRate] = useState("");

  const fetchRateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("provider-api", {
        body: { action: "exchange-rate" },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao buscar taxa");
      return data.rate;
    },
    onSuccess: (rate) => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success(`Taxa actualizada: 1 BRL = ${rate.toFixed(2)} MZN`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveManualRate = useMutation({
    mutationFn: async (rate: number) => {
      const { error } = await supabase
        .from("platform_settings")
        .update({
          exchange_rate_brl_mzn: rate,
          exchange_rate_auto: false,
          exchange_rate_updated_at: new Date().toISOString(),
        } as any)
        .eq("id", "main");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      setManualRate("");
      toast.success("Taxa manual definida");
    },
    onError: () => toast.error("Erro ao guardar taxa"),
  });

  const toggleAutoMode = useMutation({
    mutationFn: async (auto: boolean) => {
      const { error } = await supabase
        .from("platform_settings")
        .update({ exchange_rate_auto: auto } as any)
        .eq("id", "main");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success("Modo actualizado");
    },
  });

  const rate = settings?.exchange_rate_brl_mzn ?? 10.5;
  const isAuto = settings?.exchange_rate_auto ?? true;
  const lastUpdate = settings?.exchange_rate_updated_at;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRightLeft className="w-4 h-4" />
          Taxa de Câmbio BRL → MZN
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-primary">
              1 BRL = {Number(rate).toFixed(2)} MZN
            </div>
            {lastUpdate && (
              <p className="text-xs text-muted-foreground">
                Actualizado: {new Date(lastUpdate).toLocaleString("pt-PT")}
              </p>
            )}
          </div>
          <Badge variant={isAuto ? "default" : "secondary"}>
            {isAuto ? "Automático" : "Manual"}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={isAuto}
            onCheckedChange={(v) => toggleAutoMode.mutate(v)}
          />
          <Label>Taxa automática via API</Label>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRateMutation.mutate()}
            disabled={fetchRateMutation.isPending}
          >
            {fetchRateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" />
            )}
            Actualizar taxa
          </Button>
        </div>

        <div className="flex gap-2 items-end">
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Definir taxa manual</Label>
            <Input
              type="number"
              step="0.01"
              placeholder={Number(rate).toFixed(2)}
              value={manualRate}
              onChange={(e) => setManualRate(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            disabled={!manualRate || saveManualRate.isPending}
            onClick={() => saveManualRate.mutate(parseFloat(manualRate))}
          >
            Definir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminExchangeRate;
