import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  History,
  Package,
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

const mockOrders = [
  { id: "#001234", service: "Seguidores Instagram", quantity: 1000, status: "completed", date: "2024-01-15", price: 75 },
  { id: "#001235", service: "Gostos Facebook", quantity: 500, status: "processing", date: "2024-01-15", price: 15 },
  { id: "#001236", service: "Views TikTok", quantity: 5000, status: "pending", date: "2024-01-14", price: 75 },
  { id: "#001237", service: "Subscritores YouTube", quantity: 200, status: "cancelled", date: "2024-01-13", price: 20 },
];

const mockTransactions = [
  { id: 1, type: "deposit", amount: 500, method: "M-Pesa", date: "2024-01-15", status: "completed" },
  { id: 2, type: "order", amount: -75, service: "Seguidores Instagram", date: "2024-01-15" },
  { id: 3, type: "deposit", amount: 1000, method: "E-Mola", date: "2024-01-10", status: "completed" },
  { id: 4, type: "refund", amount: 20, reason: "Pedido cancelado", date: "2024-01-13" },
];

const statusConfig = {
  pending: { label: "Pendente", color: "bg-warning/20 text-warning", icon: Clock },
  processing: { label: "Em processamento", color: "bg-accent/20 text-accent", icon: Clock },
  completed: { label: "Concluído", color: "bg-success/20 text-success", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-destructive/20 text-destructive", icon: XCircle },
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const balance = 1445;

  const sidebarItems = [
    { id: "overview", name: "Visão Geral", icon: TrendingUp },
    { id: "orders", name: "Meus Pedidos", icon: Package },
    { id: "wallet", name: "Carteira", icon: Wallet },
    { id: "support", name: "Suporte", icon: MessageCircle },
    { id: "profile", name: "Perfil", icon: User },
  ];

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
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground">
              <LogOut className="w-5 h-5 mr-3" />
              Terminar Sessão
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
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
              <Button variant="default" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Saldo
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-8">
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
                  <p className="text-2xl font-bold">24</p>
                </div>
                <div className="p-6 rounded-2xl glass-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-sm text-muted-foreground">Em Processamento</span>
                  </div>
                  <p className="text-2xl font-bold">2</p>
                </div>
                <div className="p-6 rounded-2xl glass-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-warning" />
                    </div>
                    <span className="text-sm text-muted-foreground">Total Gasto</span>
                  </div>
                  <p className="text-2xl font-bold">5,250 MZN</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="font-display text-lg font-bold mb-4">Acções Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link to="/servicos">
                    <div className="p-6 rounded-2xl glass-card premium-border group hover:scale-[1.02] transition-all cursor-pointer">
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
                  </Link>
                  <div className="p-6 rounded-2xl glass-card premium-border group hover:scale-[1.02] transition-all cursor-pointer">
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
                  <div className="p-6 rounded-2xl glass-card premium-border group hover:scale-[1.02] transition-all cursor-pointer">
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
                      {mockOrders.slice(0, 3).map((order) => {
                        const status = statusConfig[order.status as keyof typeof statusConfig];
                        return (
                          <tr key={order.id} className="hover:bg-card/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono">{order.id}</td>
                            <td className="px-6 py-4 text-sm">{order.service}</td>
                            <td className="px-6 py-4 text-sm">{order.quantity.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <Badge className={status.color}>
                                <status.icon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-medium">{order.price} MZN</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <div className="rounded-2xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-card">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Serviço</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Quantidade</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Data</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockOrders.map((order) => {
                      const status = statusConfig[order.status as keyof typeof statusConfig];
                      return (
                        <tr key={order.id} className="hover:bg-card/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono">{order.id}</td>
                          <td className="px-6 py-4 text-sm">{order.service}</td>
                          <td className="px-6 py-4 text-sm">{order.quantity.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{order.date}</td>
                          <td className="px-6 py-4">
                            <Badge className={status.color}>
                              <status.icon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-medium">{order.price} MZN</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "wallet" && (
            <div className="space-y-8">
              {/* Balance Card */}
              <div className="p-8 rounded-2xl gradient-gold shadow-glow">
                <p className="text-primary-foreground/80 text-sm font-medium mb-2">Saldo Disponível</p>
                <p className="text-4xl font-bold text-primary-foreground mb-4">{balance.toLocaleString()} MZN</p>
                <Button variant="secondary" size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Saldo
                </Button>
              </div>

              {/* Payment Methods */}
              <div>
                <h2 className="font-display text-lg font-bold mb-4">Métodos de Pagamento</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl glass-card premium-border cursor-pointer hover:border-primary/40 transition-all">
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
                  <div className="p-6 rounded-2xl glass-card premium-border cursor-pointer hover:border-primary/40 transition-all">
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
                <div className="space-y-3">
                  {mockTransactions.map((tx) => (
                    <div key={tx.id} className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          tx.type === "deposit" ? "bg-success/20" : tx.type === "refund" ? "bg-accent/20" : "bg-muted"
                        }`}>
                          {tx.type === "deposit" ? (
                            <Plus className="w-5 h-5 text-success" />
                          ) : tx.type === "refund" ? (
                            <History className="w-5 h-5 text-accent" />
                          ) : (
                            <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {tx.type === "deposit" ? `Depósito via ${tx.method}` : 
                             tx.type === "refund" ? `Estorno: ${tx.reason}` :
                             tx.service}
                          </p>
                          <p className="text-sm text-muted-foreground">{tx.date}</p>
                        </div>
                      </div>
                      <p className={`font-bold ${tx.amount > 0 ? "text-success" : "text-foreground"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount} MZN
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "support" && (
            <div className="max-w-2xl">
              <div className="p-6 rounded-2xl glass-card mb-6">
                <h2 className="font-display text-lg font-bold mb-2">Chat de Suporte</h2>
                <p className="text-muted-foreground mb-6">
                  Envie uma mensagem e a nossa equipa responderá em breve. 
                  Também pode solicitar refill aqui.
                </p>

                <div className="h-64 rounded-xl bg-background border border-border p-4 mb-4 overflow-y-auto">
                  <div className="text-center text-sm text-muted-foreground py-8">
                    Nenhuma mensagem ainda. Inicie uma conversa!
                  </div>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Escreva a sua mensagem..."
                    className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                  <Button variant="default">Enviar</Button>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-accent/10 border border-accent/20">
                <h3 className="font-semibold text-accent mb-2">Precisa de Refill?</h3>
                <p className="text-sm text-muted-foreground">
                  Se houve uma queda nos números entregues, envie uma mensagem com o ID do pedido 
                  e um screenshot como prova. Processamos refills até 48h após a conclusão.
                </p>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="max-w-xl space-y-6">
              <div className="p-6 rounded-2xl glass-card">
                <h2 className="font-display text-lg font-bold mb-6">Dados da Conta</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Nome</label>
                    <input
                      type="text"
                      defaultValue="João Silva"
                      className="w-full mt-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <input
                      type="email"
                      defaultValue="joao@email.com"
                      className="w-full mt-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Telefone</label>
                    <input
                      type="tel"
                      defaultValue="+258 84 123 4567"
                      className="w-full mt-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <Button variant="default" className="w-full">
                    Guardar Alterações
                  </Button>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20">
                <h3 className="font-semibold text-destructive mb-2">Zona de Perigo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Eliminar a conta é uma acção permanente. Todo o saldo será perdido.
                </p>
                <Button variant="destructive" size="sm">
                  Eliminar Conta
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
