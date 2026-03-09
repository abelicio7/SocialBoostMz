import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Key, Plus, Copy, Trash2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ApiKeyForm {
  user_email: string;
  name: string;
  discount_percent: number;
  daily_limit: number;
}

const AdminApiKeys = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<ApiKeyForm>({
    user_email: "",
    name: "",
    discount_percent: 0,
    daily_limit: 1000,
  });

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["admin-api-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get profiles for user names
      const userIds = [...new Set(data.map((k: any) => k.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

      return data.map((k: any) => ({
        ...k,
        user_name: profileMap.get(k.user_id) || "Desconhecido",
      }));
    },
  });

  const createKey = useMutation({
    mutationFn: async (formData: ApiKeyForm) => {
      // Find user by email using admin query
      const { data: users, error: userErr } = await supabase
        .from("profiles")
        .select("id")
        .limit(100);

      if (userErr) throw new Error("Erro ao buscar utilizadores");

      // We need to look up the user by email through auth - use a workaround via edge function or just ask for user_id
      // For simplicity, search by name match
      const { data: authUsers } = await supabase.rpc("has_role", {
        _user_id: "00000000-0000-0000-0000-000000000000",
        _role: "user" as any,
      });

      // Actually let's just use supabase admin to find user - we'll look by name in profiles
      const { data: matchedProfiles, error: profileErr } = await supabase
        .from("profiles")
        .select("id, full_name")
        .ilike("full_name", `%${formData.user_email}%`);

      if (profileErr || !matchedProfiles || matchedProfiles.length === 0) {
        throw new Error("Utilizador não encontrado. Pesquise pelo nome completo.");
      }

      if (matchedProfiles.length > 1) {
        throw new Error(`Múltiplos utilizadores encontrados: ${matchedProfiles.map((p: any) => p.full_name).join(", ")}. Seja mais específico.`);
      }

      const userId = matchedProfiles[0].id;

      const { error } = await supabase
        .from("api_keys")
        .insert({
          user_id: userId,
          name: formData.name,
          discount_percent: formData.discount_percent,
          daily_limit: formData.daily_limit,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
      toast.success("API Key criada com sucesso!");
      setDialogOpen(false);
      setForm({ user_email: "", name: "", discount_percent: 0, daily_limit: 1000 });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("api_keys")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
      toast.success("Estado actualizado");
    },
  });

  const deleteKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
      toast.success("API Key eliminada");
    },
  });

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API Key copiada!");
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const maskKey = (key: string) => key.substring(0, 6) + "•".repeat(20) + key.substring(key.length - 4);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Keys de Revenda</h2>
          <p className="text-muted-foreground">Gerir chaves de API para revendedores</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova API Key
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Utilizador</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Pedidos Hoje</TableHead>
                <TableHead>Activa</TableHead>
                <TableHead>Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : !apiKeys?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma API Key criada
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map((key: any) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>{key.user_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {visibleKeys.has(key.id) ? key.api_key : maskKey(key.api_key)}
                        </code>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleKeyVisibility(key.id)}>
                          {visibleKeys.has(key.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyKey(key.api_key)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{key.discount_percent}%</Badge>
                    </TableCell>
                    <TableCell>{key.requests_today} / {key.daily_limit}</TableCell>
                    <TableCell>
                      <Switch
                        checked={key.is_active}
                        onCheckedChange={(checked) => toggleActive.mutate({ id: key.id, is_active: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja eliminar esta API Key?")) {
                            deleteKey.mutate(key.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Aplicação</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Loja do João"
              />
            </div>
            <div>
              <Label>Nome do Utilizador (pesquisa)</Label>
              <Input
                value={form.user_email}
                onChange={(e) => setForm({ ...form, user_email: e.target.value })}
                placeholder="Pesquise pelo nome completo"
              />
            </div>
            <div>
              <Label>Desconto (%)</Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={form.discount_percent}
                onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Limite Diário de Pedidos</Label>
              <Input
                type="number"
                min={1}
                value={form.daily_limit}
                onChange={(e) => setForm({ ...form, daily_limit: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => createKey.mutate(form)} disabled={!form.name || !form.user_email}>
              Criar API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApiKeys;
