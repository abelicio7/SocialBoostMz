import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Megaphone, Trash2, Save } from "lucide-react";

const AdminAnnouncementControl = () => {
  const { data: settings, isLoading } = usePlatformSettings();
  const queryClient = useQueryClient();
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (settings?.dashboard_announcement) {
      setAnnouncement(settings.dashboard_announcement);
    } else {
      setAnnouncement("");
    }
  }, [settings]);

  const updateAnnouncement = useMutation({
    mutationFn: async (text: string | null) => {
      const { error } = await supabase
        .from("platform_settings")
        .update({
          dashboard_announcement: text ? text.trim() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "main");

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      if (variables) {
        toast.success("Comunicado publicado com sucesso!");
      } else {
        toast.success("Comunicado removido com sucesso!");
        setAnnouncement("");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar comunicado");
    },
  });

  if (isLoading) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Comunicado da Dashboard</h2>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Escreva uma mensagem importante para exibir no topo da Dashboard de todos os utilizadores da plataforma (ex: avisos de manutenção, indisponibilidade de carteiras).
        </p>

        <div>
          <Textarea
            placeholder="Ex: Atenção! Os depósitos via e-Mola encontram-se temporariamente indisponíveis devido a manutenção no provedor. Por favor, utilize M-Pesa."
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            rows={3}
            className="bg-card border-border"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => updateAnnouncement.mutate(announcement)}
            disabled={updateAnnouncement.isPending}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Publicar Comunicado
          </Button>

          {settings?.dashboard_announcement && (
            <Button
              variant="outline"
              onClick={() => updateAnnouncement.mutate(null)}
              disabled={updateAnnouncement.isPending}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remover
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncementControl;
