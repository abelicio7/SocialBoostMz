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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, RefreshCw, Wallet, Ban, CheckCircle } from "lucide-react";

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [balanceDialog, setBalanceDialog] = useState<{ open: boolean; userId: string; currentBalance: number }>({
    open: false,
    userId: "",
    currentBalance: 0,
  });
  const [balanceAmount, setBalanceAmount] = useState("");
  const queryClient = useQueryClient();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const toggleBlock = useMutation({
    mutationFn: async ({ userId, isBlocked }: { userId: string; isBlocked: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !isBlocked })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Estado do utilizador actualizado');
    },
    onError: () => {
      toast.error('Erro ao actualizar utilizador');
    },
  });

  const adjustBalance = useMutation({
    mutationFn: async ({ userId, amount, currentBalance }: { userId: string; amount: number; currentBalance: number }) => {
      const newBalance = currentBalance + amount;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Create transaction record
      const { error: txError } = await supabase.from('wallet_transactions').insert({
        user_id: userId,
        amount: Math.abs(amount),
        type: amount > 0 ? 'deposit' : 'withdrawal',
        description: `Ajuste manual de saldo pelo administrador`,
      });

      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setBalanceDialog({ open: false, userId: "", currentBalance: 0 });
      setBalanceAmount("");
      toast.success('Saldo ajustado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao ajustar saldo');
    },
  });

  const filteredUsers = users?.filter(user => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower)
    );
  });

  const handleAdjustBalance = () => {
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error('Insira um valor válido');
      return;
    }
    adjustBalance.mutate({
      userId: balanceDialog.userId,
      amount,
      currentBalance: balanceDialog.currentBalance,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar utilizadores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Registo</TableHead>
              <TableHead>Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  A carregar...
                </TableCell>
              </TableRow>
            ) : filteredUsers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum utilizador encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.full_name || 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 8)}</p>
                    </div>
                  </TableCell>
                  <TableCell>{user.phone || 'N/A'}</TableCell>
                  <TableCell className="font-medium text-primary">
                    {Number(user.balance).toLocaleString()} MZN
                  </TableCell>
                  <TableCell>
                    {user.is_blocked ? (
                      <Badge className="bg-red-500/20 text-red-500">Bloqueado</Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-500">Activo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('pt-PT')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBalanceDialog({
                          open: true,
                          userId: user.id,
                          currentBalance: Number(user.balance),
                        })}
                      >
                        <Wallet className="w-4 h-4 mr-1" />
                        Saldo
                      </Button>
                      <Button
                        variant={user.is_blocked ? "default" : "destructive"}
                        size="sm"
                        onClick={() => toggleBlock.mutate({ userId: user.id, isBlocked: user.is_blocked })}
                        disabled={toggleBlock.isPending}
                      >
                        {user.is_blocked ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Desbloquear
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4 mr-1" />
                            Bloquear
                          </>
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

      {/* Balance Adjustment Dialog */}
      <Dialog open={balanceDialog.open} onOpenChange={(open) => setBalanceDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Saldo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground">Saldo actual:</p>
              <p className="text-2xl font-bold text-primary">{balanceDialog.currentBalance.toLocaleString()} MZN</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor a adicionar/remover (MZN)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Ex: 500 ou -200"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use valores positivos para adicionar e negativos para remover.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialog({ open: false, userId: "", currentBalance: 0 })}>
              Cancelar
            </Button>
            <Button onClick={handleAdjustBalance} disabled={adjustBalance.isPending}>
              {adjustBalance.isPending ? "A processar..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
