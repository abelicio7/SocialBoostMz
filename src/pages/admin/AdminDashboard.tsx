import AdminStats from "@/components/admin/AdminStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_user_id_fkey (full_name),
          services!orders_service_id_fkey (name, platform)
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
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {(unreadMessages as any)?.count > 0
                  ? `${(unreadMessages as any).count} mensagens por ler`
                  : 'Sem mensagens pendentes'}
              </p>
              <Link to="/admin/suporte">
                <button className="mt-3 text-primary text-sm hover:underline">
                  Abrir suporte
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
