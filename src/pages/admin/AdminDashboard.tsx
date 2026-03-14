import AdminStats from "@/components/admin/AdminStats";
import AdminBreakControl from "@/components/admin/AdminBreakControl";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, MessageSquare, User } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (full_name),
          services (name, platform)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const { data: unreadMessages } = useQuery({
    queryKey: ['admin-unread-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_from_admin', false)
        .eq('is_read', false);

      if (error) throw error;
      return data;
    },
  });

  // Fetch recent support messages for preview
  const { data: recentMessages } = useQuery({
    queryKey: ['admin-recent-messages'],
    queryFn: async () => {
      const { data: msgs, error } = await supabase
        .from('support_messages')
        .select('id, user_id, message, created_at, is_from_admin, is_read')
        .eq('is_from_admin', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (!msgs || msgs.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(msgs.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      return msgs.map(m => ({
        ...m,
        full_name: profileMap.get(m.user_id) || 'Utilizador',
      }));
    },
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-500",
    processing: "bg-blue-500/20 text-blue-500",
    completed: "bg-green-500/20 text-green-500",
    cancelled: "bg-red-500/20 text-red-500",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    processing: "Processando",
    completed: "Concluído",
    cancelled: "Cancelado",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
          Painel Administrativo
        </h1>
        <p className="text-muted-foreground">
          Visão geral do SocialBoostMz
        </p>
      </div>

      <AdminStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AdminBreakControl />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Pedidos Recentes</h2>
            </div>
            <Link to="/admin/pedidos" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum pedido ainda
              </p>
            ) : (
              recentOrders?.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">
                      {(order.profiles as any)?.full_name || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(order.services as any)?.name} • {order.quantity.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={statusColors[order.status]}>
                      {statusLabels[order.status]}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Number(order.total_price).toLocaleString()} MZN
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Support Messages */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Suporte</h2>
              {(unreadMessages as any)?.count > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {(unreadMessages as any).count} novas
                </Badge>
              )}
            </div>
            <Link to="/admin/suporte" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {!recentMessages || recentMessages.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Sem mensagens pendentes</p>
                </div>
              </div>
            ) : (
              recentMessages.map((msg) => (
                <Link
                  key={msg.id}
                  to="/admin/suporte"
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{msg.full_name}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{msg.message}</p>
                  </div>
                  {!msg.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
