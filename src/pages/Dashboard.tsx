import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import NewOrderForm from "@/components/orders/NewOrderForm";
import TopUpDialog from "@/components/wallet/TopUpDialog";
import BreakBanner from "@/components/dashboard/BreakBanner";
import {
  Zap,
  Wallet,
  Plus,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  LogOut,
  User,
  Package,
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
  Send,
} from "lucide-react";

const statusConfig = {
  pending: { label: "Pendente", color: "bg-warning/20 text-warning", icon: Clock },
  processing: { label: "Em processamento", color: "bg-accent/20 text-accent", icon: Clock },
  completed: { label: "Concluído", color: "bg-success/20 text-success", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-destructive/20 text-destructive", icon: XCircle },
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [newMessage, setNewMessage] = useState("");
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Fetch profile data
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch orders
  const { data: orders } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          services:service_id (name, platform)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch transactions
  const { data: transactions } = useQuery({
    queryKey: ['user-transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch support messages
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['user-messages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Real-time subscription for messages (listen to all events for full sync with admin)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-support-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!user || !newMessage.trim()) return;

      const { error } = await supabase.from('support_messages').insert({
        user_id: user.id,
        message: newMessage.trim(),
        is_from_admin: false,
        is_read: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem');
    },
  });

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage.mutate();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const balance = Number(profile?.balance || 0);
  const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
  const processingOrders = orders?.filter(o => o.status === 'processing' || o.status === 'pending').length || 0;
  const totalSpent = orders?.filter(o => o.status === 'completed').reduce((sum, o) => sum + Number(o.total_price), 0) || 0;

  const sidebarItems = [
    { id: "overview", name: "Visão Geral", icon: TrendingUp },
    { id: "orders", name: "Meus Pedidos", icon: Package },
    { id: "wallet", name: "Carteira", icon: Wallet },
    { id: "support", name: "Suporte", icon: MessageCircle },
    { id: "profile", name: "Perfil", icon: User },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">
              Social<span className="text-primary">Boost</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
          
          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link to="/admin">
                <Button variant="outline" className="w-full">
                  Painel Admin
                </Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="w-5 h-5 mr-3" />
            Terminar Sessão
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="md:hidden">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
              </Link>
            </div>
            <h1 className="font-display text-xl font-bold hidden md:block">
              {sidebarItems.find((i) => i.id === activeTab)?.name}
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="font-bold text-primary">{balance.toLocaleString()} MZN</span>
              </div>
              <Button variant="default" size="sm" onClick={() => setTopUpDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Saldo
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <BreakBanner />
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Welcome */}
              <div className="p-6 rounded-2xl glass-card premium-border">
                <h2 className="font-display text-xl font-bold mb-2">
                  Olá, {profile?.full_name || 'Utilizador'}! 👋
                </h2>
                <p className="text-muted-foreground">
                  Bem-vindo ao seu painel. Aqui pode gerir os seus pedidos e carregar saldo.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl glass-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Saldo Actual</span>
                  </div>
                  <p className="text-2xl font-bold">{balance.toLocaleString()} MZN</p>
                </div>
                <div className="p-6 rounded-2xl glass-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <span className="text-sm text-muted-foreground">Pedidos Completos</span>
                  </div>
                  <p className="text-2xl font-bold">{completedOrders}</p>
                </div>
                <div className="p-6 rounded-2xl glass-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-sm text-muted-foreground">Em Processamento</span>
                  </div>
                  <p className="text-2xl font-bold">{processingOrders}</p>
                </div>
                <div className="p-6 rounded-2xl glass-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-warning" />
                    </div>
                    <span className="text-sm text-muted-foreground">Total Gasto</span>
                  </div>
                  <p className="text-2xl font-bold">{totalSpent.toLocaleString()} MZN</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="font-display text-lg font-bold mb-4">Acções Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    onClick={() => setOrderDialogOpen(true)}
                    className="p-6 rounded-2xl glass-card premium-border group hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Novo Pedido</h3>
                          <p className="text-sm text-muted-foreground">Escolha um serviço</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <div 
                    onClick={() => setTopUpDialogOpen(true)}
                    className="p-6 rounded-2xl glass-card premium-border group hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                          <Plus className="w-6 h-6 text-success" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Carregar Saldo</h3>
                          <p className="text-sm text-muted-foreground">M-Pesa ou E-Mola</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <div 
                    onClick={() => setActiveTab("support")}
                    className="p-6 rounded-2xl glass-card premium-border group hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                          <MessageCircle className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Suporte</h3>
                          <p className="text-sm text-muted-foreground">Fale connosco</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              {orders && orders.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-bold">Pedidos Recentes</h2>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("orders")}>
                      Ver Todos
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  <div className="rounded-2xl border border-border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-card">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">ID</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Serviço</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Qtd</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                          <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {orders.slice(0, 3).map((order) => {
                          const status = statusConfig[order.status as keyof typeof statusConfig];
                          return (
                            <tr key={order.id} className="hover:bg-card/50 transition-colors">
                              <td className="px-6 py-4 text-sm font-mono">#{order.id.slice(0, 8)}</td>
                              <td className="px-6 py-4 text-sm">{(order.services as any)?.name}</td>
                              <td className="px-6 py-4 text-sm">{order.quantity.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <Badge className={status.color}>
                                  <status.icon className="w-3 h-3 mr-1" />
                                  {status.label}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-sm text-right font-medium">{Number(order.total_price).toLocaleString()} MZN</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              {orders?.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Nenhum pedido ainda</h3>
                  <p className="text-muted-foreground mb-4">Faça o seu primeiro pedido agora!</p>
                  <Link to="/servicos">
                    <Button>Ver Serviços</Button>
                  </Link>
                </div>
              ) : (
              <div className="rounded-2xl border border-border overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-card">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Serviço</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Qtd</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders?.map((order) => {
                        const status = statusConfig[order.status as keyof typeof statusConfig];
                        return (
                          <tr key={order.id} className="hover:bg-card/50 transition-colors">
                            <td className="px-4 py-3 text-sm font-mono">#{order.id.slice(0, 8)}</td>
                            <td className="px-4 py-3 text-sm">{(order.services as any)?.name}</td>
                            <td className="px-4 py-3 text-sm">{order.quantity.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('pt-PT')}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={status.color}>
                                <status.icon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">{Number(order.total_price).toLocaleString()} MZN</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "wallet" && (
            <div className="space-y-8">
              {/* Balance Card */}
              <div className="p-8 rounded-2xl gradient-gold shadow-glow">
                <p className="text-primary-foreground/80 text-sm font-medium mb-2">Saldo Disponível</p>
                <p className="text-4xl font-bold text-primary-foreground mb-4">{balance.toLocaleString()} MZN</p>
                <Button variant="secondary" size="lg" onClick={() => setTopUpDialogOpen(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Saldo
                </Button>
              </div>

              {/* Payment Methods */}
              <div>
                <h2 className="font-display text-lg font-bold mb-4">Métodos de Pagamento</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                    onClick={() => setTopUpDialogOpen(true)}
                    className="p-6 rounded-2xl glass-card premium-border cursor-pointer hover:border-red-500/40 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-red-500">M</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">M-Pesa</h3>
                        <p className="text-sm text-muted-foreground">Vodacom Moçambique</p>
                      </div>
                    </div>
                  </div>
                  <div 
                    onClick={() => setTopUpDialogOpen(true)}
                    className="p-6 rounded-2xl glass-card premium-border cursor-pointer hover:border-orange-500/40 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-orange-500">E</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">E-Mola</h3>
                        <p className="text-sm text-muted-foreground">Movitel Moçambique</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <h2 className="font-display text-lg font-bold mb-4">Histórico de Transacções</h2>
                {transactions?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Sem transacções ainda</p>
                ) : (
                  <div className="space-y-3">
                    {transactions?.map((tx) => (
                      <div key={tx.id} className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            tx.type === 'deposit' || tx.type === 'refund' 
                              ? 'bg-success/20' 
                              : 'bg-destructive/20'
                          }`}>
                            {tx.type === 'deposit' || tx.type === 'refund' ? (
                              <Plus className={`w-5 h-5 ${tx.type === 'deposit' || tx.type === 'refund' ? 'text-success' : 'text-destructive'}`} />
                            ) : (
                              <ShoppingCart className="w-5 h-5 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{tx.type === 'deposit' ? 'Depósito' : tx.type === 'refund' ? 'Estorno' : tx.type === 'order_payment' ? 'Pagamento' : tx.type}</p>
                            <p className="text-sm text-muted-foreground">{tx.description || new Date(tx.created_at).toLocaleDateString('pt-PT')}</p>
                          </div>
                        </div>
                        <p className={`font-bold ${Number(tx.amount) >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {Number(tx.amount) >= 0 ? '+' : ''}{Number(tx.amount).toLocaleString()} MZN
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "support" && (
            <div className="max-w-2xl mx-auto">
              <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[calc(100vh-220px)]">
                {/* Chat Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">Suporte SocialBoostMz</p>
                      <p className="text-sm text-muted-foreground">Estamos aqui para ajudar</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages?.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Inicie uma conversa com o suporte</p>
                        <p className="text-sm mt-2">Pode solicitar refill, tirar dúvidas ou reportar problemas</p>
                      </div>
                    )}
                    {messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.is_from_admin ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            msg.is_from_admin
                              ? 'bg-muted'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${msg.is_from_admin ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Escreva a sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} disabled={sendMessage.isPending || !newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="max-w-lg">
              <div className="p-6 rounded-2xl glass-card space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">{profile?.full_name || 'Utilizador'}</h2>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                    <p className="font-medium">{profile?.phone || 'Não definido'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Membro desde</p>
                    <p className="font-medium">
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Saldo Actual</p>
                    <p className="font-bold text-primary text-xl">{balance.toLocaleString()} MZN</p>
                  </div>
                </div>

                <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Terminar Sessão
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* New Order Dialog */}
      <NewOrderForm 
        open={orderDialogOpen} 
        onOpenChange={setOrderDialogOpen}
      />

      {/* Top Up Dialog */}
      <TopUpDialog
        open={topUpDialogOpen}
        onOpenChange={setTopUpDialogOpen}
      />

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-3 px-2 min-w-0 flex-1 transition-colors ${
                activeTab === item.id
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate">{item.name}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
