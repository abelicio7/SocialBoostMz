import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Coffee, Play, Clock } from "lucide-react";

const AdminBreakControl = () => {
  const { data: settings, isLoading } = usePlatformSettings();
  const queryClient = useQueryClient();
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("30");
  const [message, setMessage] = useState("");

  const toggleBreak = useMutation({
    mutationFn: async (activate: boolean) => {
      if (activate) {
        const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
        if (totalMinutes <= 0) {
          throw new Error("Defina um tempo válido");
        }
        const breakEnd = new Date(Date.now() + totalMinutes * 60 * 1000).toISOString();

        const { error } = await supabase
          .from("platform_settings")
          .update({
            is_on_break: true,
            break_end_time: breakEnd,
            break_message: message || "Estamos em intervalo. Voltamos em breve!",
            updated_at: new Date().toISOString(),
          })
          .eq("id", "main");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("platform_settings")
          .update({
            is_on_break: false,
            break_end_time: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", "main");

        if (error) throw error;
      }
    },
    onSuccess: (_, activate) => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success(activate ? "Plataforma em intervalo" : "Plataforma reactivada!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao alterar estado");
    },
  });

  if (isLoading) return null;

  const isOnBreak = settings?.is_on_break;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Coffee className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Modo Intervalo</h2>
      </div>

      {isOnBreak ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-warning font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Plataforma em intervalo
            </p>
            {settings?.break_end_time && (
              <p className="text-sm text-muted-foreground mt-1">
                Retorno previsto: {new Date(settings.break_end_time).toLocaleString("pt-PT")}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Mensagem: {settings?.break_message}
            </p>
          </div>
          <Button
            onClick={() => toggleBreak.mutate(false)}
            disabled={toggleBreak.isPending}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            Reactivar Plataforma
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Active o modo intervalo para pausar temporariamente a plataforma para os utilizadores.
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Horas</label>
              <Input
                type="number"
                min="0"
                max="72"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Minutos</label>
              <Input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Mensagem (opcional)
            </label>
            <Textarea
              placeholder="Estamos em intervalo. Voltamos em breve!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => toggleBreak.mutate(true)}
            disabled={toggleBreak.isPending}
            className="w-full border-warning text-warning hover:bg-warning/10"
          >
            <Coffee className="w-4 h-4 mr-2" />
            Activar Intervalo
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminBreakControl;
