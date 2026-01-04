import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";

interface ServiceFormData {
  platform: string;
  name: string;
  description: string;
  price_per_1000: string;
  min_quantity: string;
  max_quantity: string;
  daily_limit: string;
  estimated_time: string;
}

const defaultFormData: ServiceFormData = {
  platform: "facebook",
  name: "",
  description: "",
  price_per_1000: "",
  min_quantity: "100",
  max_quantity: "100000",
  daily_limit: "200000",
  estimated_time: "1-24h",
};

const platforms = [
  { id: "facebook", name: "Facebook" },
  { id: "instagram", name: "Instagram" },
  { id: "tiktok", name: "TikTok" },
  { id: "youtube", name: "YouTube" },
  { id: "twitter", name: "Twitter / X" },
];

const AdminServices = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(defaultFormData);
  const queryClient = useQueryClient();

  const { data: services, isLoading, refetch } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('platform', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ServiceFormData & { id?: string }) => {
      const serviceData = {
        platform: data.platform,
        name: data.name,
        description: data.description,
        price_per_1000: parseFloat(data.price_per_1000),
        min_quantity: parseInt(data.min_quantity),
        max_quantity: parseInt(data.max_quantity),
        daily_limit: parseInt(data.daily_limit),
        estimated_time: data.estimated_time,
      };

      if (data.id) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert(serviceData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      setDialogOpen(false);
      setEditingId(null);
      setFormData(defaultFormData);
      toast.success(editingId ? 'Serviço actualizado' : 'Serviço criado');
    },
    onError: () => {
      toast.error('Erro ao guardar serviço');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success('Estado actualizado');
    },
    onError: () => {
      toast.error('Erro ao actualizar estado');
    },
  });

  const openEditDialog = (service: any) => {
    setEditingId(service.id);
    setFormData({
      platform: service.platform,
      name: service.name,
      description: service.description || "",
      price_per_1000: service.price_per_1000.toString(),
      min_quantity: service.min_quantity.toString(),
      max_quantity: service.max_quantity.toString(),
      daily_limit: service.daily_limit.toString(),
      estimated_time: service.estimated_time,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.price_per_1000) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    saveMutation.mutate({ ...formData, id: editingId || undefined });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Gestão de Serviços</h2>
        <div className="flex gap-3">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Serviço
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Plataforma</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Preço/1000</TableHead>
              <TableHead>Limites</TableHead>
              <TableHead>Tempo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  A carregar...
                </TableCell>
              </TableRow>
            ) : services?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum serviço encontrado
                </TableCell>
              </TableRow>
            ) : (
              services?.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="capitalize font-medium">{service.platform}</TableCell>
                  <TableCell>{service.name}</TableCell>
                  <TableCell className="font-medium text-primary">
                    {Number(service.price_per_1000).toLocaleString()} MZN
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {service.min_quantity.toLocaleString()} - {service.max_quantity.toLocaleString()}
                  </TableCell>
                  <TableCell>{service.estimated_time}</TableCell>
                  <TableCell>
                    {service.is_active ? (
                      <Badge className="bg-green-500/20 text-green-500">Activo</Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-500">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(service)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive.mutate({ id: service.id, isActive: service.is_active })}
                      >
                        {service.is_active ? (
                          <ToggleRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Service Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select value={formData.platform} onValueChange={(v) => setFormData(p => ({ ...p, platform: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do Serviço *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Seguidores"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Descrição do serviço"
              />
            </div>
            <div className="space-y-2">
              <Label>Preço por 1000 (MZN) *</Label>
              <Input
                type="number"
                value={formData.price_per_1000}
                onChange={(e) => setFormData(p => ({ ...p, price_per_1000: e.target.value }))}
                placeholder="350"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mínimo</Label>
                <Input
                  type="number"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData(p => ({ ...p, min_quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Máximo</Label>
                <Input
                  type="number"
                  value={formData.max_quantity}
                  onChange={(e) => setFormData(p => ({ ...p, max_quantity: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Limite Diário</Label>
                <Input
                  type="number"
                  value={formData.daily_limit}
                  onChange={(e) => setFormData(p => ({ ...p, daily_limit: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tempo Estimado</Label>
                <Input
                  value={formData.estimated_time}
                  onChange={(e) => setFormData(p => ({ ...p, estimated_time: e.target.value }))}
                  placeholder="1-24h"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServices;
