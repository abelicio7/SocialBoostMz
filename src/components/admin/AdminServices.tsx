import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, ToggleLeft, ToggleRight, RefreshCw, Download, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface ServiceFormData {
  platform: string;
  name: string;
  description: string;
  price_per_1000: string;
  min_quantity: string;
  max_quantity: string;
  daily_limit: string;
  estimated_time: string;
  provider_service_id: string;
  provider_price: string;
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
  provider_service_id: "",
  provider_price: "",
};

const platforms = [
  { id: "facebook", name: "Facebook" },
  { id: "instagram", name: "Instagram" },
  { id: "tiktok", name: "TikTok" },
  { id: "youtube", name: "YouTube" },
  { id: "twitter", name: "Twitter / X" },
];

interface ProviderService {
  service: number;
  name: string;
  type: string;
  rate: string;
  min: string;
  max: string;
  category: string;
  refill?: boolean;
  cancel?: boolean;
}

const AdminServices = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(defaultFormData);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [selectedImports, setSelectedImports] = useState<Set<number>>(new Set());
  const [importPrices, setImportPrices] = useState<Record<number, string>>({});
  const [importPlatforms, setImportPlatforms] = useState<Record<number, string>>({});
  const [loadingProvider, setLoadingProvider] = useState(false);
  const [searchImport, setSearchImport] = useState("");
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
      const serviceData: Record<string, unknown> = {
        platform: data.platform,
        name: data.name,
        description: data.description,
        price_per_1000: parseFloat(data.price_per_1000),
        min_quantity: parseInt(data.min_quantity),
        max_quantity: parseInt(data.max_quantity),
        daily_limit: parseInt(data.daily_limit),
        estimated_time: data.estimated_time,
        provider_service_id: data.provider_service_id || null,
        provider_price: data.provider_price ? parseFloat(data.provider_price) : null,
      };

      if (data.id) {
        const { error } = await supabase.from('services').update(serviceData).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert(serviceData);
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
    onError: () => toast.error('Erro ao guardar serviço'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('services').update({ is_active: !isActive }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Erro ao actualizar estado'),
  });

  const importMutation = useMutation({
    mutationFn: async (servicesToImport: ProviderService[]) => {
      const inserts = servicesToImport.map((s) => {
        const platform = importPlatforms[s.service] || guessPlatform(s.category, s.name);
        const myPrice = importPrices[s.service] || s.rate;
        return {
          name: s.name,
          platform,
          description: `${s.category} - ${s.type}`,
          price_per_1000: parseFloat(myPrice),
          min_quantity: parseInt(s.min),
          max_quantity: parseInt(s.max),
          provider_service_id: s.service.toString(),
          provider_price: parseFloat(s.rate),
          estimated_time: "1-24h",
        };
      });

      const { error } = await supabase.from('services').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      setImportDialogOpen(false);
      setSelectedImports(new Set());
      setImportPrices({});
      setImportPlatforms({});
      toast.success('Serviços importados com sucesso!');
    },
    onError: (e) => toast.error(`Erro ao importar: ${e.message}`),
  });

  const fetchProviderServices = async () => {
    setLoadingProvider(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/provider-api/services`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProviderServices(json.data);
        setImportDialogOpen(true);
      } else {
        toast.error("Erro ao buscar serviços do fornecedor");
      }
    } catch (e) {
      toast.error("Erro de conexão com o fornecedor");
    } finally {
      setLoadingProvider(false);
    }
  };

  const guessPlatform = (category: string, name: string): string => {
    const text = `${category} ${name}`.toLowerCase();
    if (text.includes("instagram")) return "instagram";
    if (text.includes("facebook") || text.includes("fb")) return "facebook";
    if (text.includes("tiktok") || text.includes("tik tok")) return "tiktok";
    if (text.includes("youtube") || text.includes("yt")) return "youtube";
    if (text.includes("twitter") || text.includes(" x ") || text.includes("tweet")) return "twitter";
    return "facebook";
  };

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
      provider_service_id: service.provider_service_id || "",
      provider_price: service.provider_price?.toString() || "",
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

  const toggleImportSelection = (serviceId: number) => {
    setSelectedImports((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  const handleImport = () => {
    const selected = providerServices.filter((s) => selectedImports.has(s.service));
    if (selected.length === 0) {
      toast.error("Seleccione pelo menos um serviço");
      return;
    }
    importMutation.mutate(selected);
  };

  const existingProviderIds = new Set(
    services?.map((s: any) => s.provider_service_id).filter(Boolean) || []
  );

  const filteredProviderServices = providerServices.filter((s) => {
    const text = `${s.name} ${s.category}`.toLowerCase();
    return text.includes(searchImport.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Gestão de Serviços</h2>
        <div className="flex gap-3">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={fetchProviderServices} disabled={loadingProvider}>
            {loadingProvider ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Importar do Fornecedor
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
              <TableHead>Meu Preço/1000</TableHead>
              <TableHead>Custo Fornecedor</TableHead>
              <TableHead>Lucro</TableHead>
              <TableHead>Limites</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">A carregar...</TableCell>
              </TableRow>
            ) : services?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum serviço encontrado
                </TableCell>
              </TableRow>
            ) : (
              services?.map((service: any) => {
                const providerCost = service.provider_price ? Number(service.provider_price) : null;
                const myPrice = Number(service.price_per_1000);
                const profit = providerCost !== null ? myPrice - providerCost : null;
                const profitPercent = providerCost !== null && providerCost > 0
                  ? ((profit! / providerCost) * 100).toFixed(0)
                  : null;

                return (
                  <TableRow key={service.id}>
                    <TableCell className="capitalize font-medium">{service.platform}</TableCell>
                    <TableCell>
                      <div>{service.name}</div>
                      {service.provider_service_id && (
                        <span className="text-xs text-muted-foreground">ID: {service.provider_service_id}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {myPrice.toLocaleString()} MZN
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {providerCost !== null ? `${providerCost.toLocaleString()} MZN` : "—"}
                    </TableCell>
                    <TableCell>
                      {profit !== null ? (
                        <span className={profit > 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                          {profit > 0 ? "+" : ""}{profit.toLocaleString()} MZN ({profitPercent}%)
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {service.min_quantity.toLocaleString()} - {service.max_quantity.toLocaleString()}
                    </TableCell>
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
                        <Button variant="outline" size="sm" onClick={() => toggleActive.mutate({ id: service.id, isActive: service.is_active })}>
                          {service.is_active ? (
                            <ToggleRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select value={formData.platform} onValueChange={(v) => setFormData(p => ({ ...p, platform: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do Serviço *</Label>
              <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Seguidores" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Descrição do serviço" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meu Preço/1000 (MZN) *</Label>
                <Input type="number" value={formData.price_per_1000} onChange={(e) => setFormData(p => ({ ...p, price_per_1000: e.target.value }))} placeholder="350" />
              </div>
              <div className="space-y-2">
                <Label>Custo Fornecedor/1000</Label>
                <Input type="number" value={formData.provider_price} onChange={(e) => setFormData(p => ({ ...p, provider_price: e.target.value }))} placeholder="Auto" disabled={!!formData.provider_service_id} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ID Serviço Fornecedor</Label>
              <Input value={formData.provider_service_id} onChange={(e) => setFormData(p => ({ ...p, provider_service_id: e.target.value }))} placeholder="Ex: 1234" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mínimo</Label>
                <Input type="number" value={formData.min_quantity} onChange={(e) => setFormData(p => ({ ...p, min_quantity: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Máximo</Label>
                <Input type="number" value={formData.max_quantity} onChange={(e) => setFormData(p => ({ ...p, max_quantity: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Limite Diário</Label>
                <Input type="number" value={formData.daily_limit} onChange={(e) => setFormData(p => ({ ...p, daily_limit: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tempo Estimado</Label>
                <Input value={formData.estimated_time} onChange={(e) => setFormData(p => ({ ...p, estimated_time: e.target.value }))} placeholder="1-24h" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import from Provider Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Importar Serviços do Fornecedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Pesquisar serviços..."
                value={searchImport}
                onChange={(e) => setSearchImport(e.target.value)}
                className="max-w-sm"
              />
              <span className="text-sm text-muted-foreground">
                {selectedImports.size} seleccionados de {filteredProviderServices.length}
              </span>
            </div>
            <ScrollArea className="h-[50vh] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10"></TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Custo/1000</TableHead>
                    <TableHead>Meu Preço/1000 (MZN)</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Min-Max</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviderServices.map((s) => {
                    const alreadyImported = existingProviderIds.has(s.service.toString());
                    return (
                      <TableRow key={s.service} className={alreadyImported ? "opacity-50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedImports.has(s.service)}
                            disabled={alreadyImported}
                            onCheckedChange={() => toggleImportSelection(s.service)}
                          />
                        </TableCell>
                        <TableCell className="text-xs">{s.service}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{s.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.category}</TableCell>
                        <TableCell className="text-sm">{s.rate}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-24 h-8 text-sm"
                            placeholder={s.rate}
                            value={importPrices[s.service] || ""}
                            onChange={(e) => setImportPrices((p) => ({ ...p, [s.service]: e.target.value }))}
                            disabled={alreadyImported}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={importPlatforms[s.service] || guessPlatform(s.category, s.name)}
                            onValueChange={(v) => setImportPlatforms((p) => ({ ...p, [s.service]: v }))}
                            disabled={alreadyImported}
                          >
                            <SelectTrigger className="w-28 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {platforms.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs">{s.min}-{s.max}</TableCell>
                        <TableCell>
                          {alreadyImported ? (
                            <Badge variant="secondary">Já importado</Badge>
                          ) : (
                            <Badge className="bg-green-500/20 text-green-500">Disponível</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleImport} disabled={importMutation.isPending || selectedImports.size === 0}>
              {importMutation.isPending ? "A importar..." : `Importar ${selectedImports.size} Serviço(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServices;
