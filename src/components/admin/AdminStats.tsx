import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShoppingCart, Wallet, TrendingUp } from "lucide-react";

const AdminStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, ordersRes, pendingOrdersRes, revenueRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('total_price').eq('status', 'completed'),
      ]);

      const totalRevenue = revenueRes.data?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalOrders: ordersRes.count || 0,
        pendingOrders: pendingOrdersRes.count || 0,
        totalRevenue,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const statCards = [
    {
      title: "Total Utilizadores",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Total Pedidos",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Pedidos Pendentes",
      value: stats?.pendingOrders || 0,
      icon: TrendingUp,
      color: "from-yellow-500 to-yellow-600",
    },
    {
      title: "Receita Total",
      value: `${(stats?.totalRevenue || 0).toLocaleString()} MZN`,
      icon: Wallet,
      color: "from-primary to-warning",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 rounded-2xl glass-card animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div
          key={stat.title}
          className="p-6 rounded-2xl glass-card premium-border group hover:scale-[1.02] transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;
