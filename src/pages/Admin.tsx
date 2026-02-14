import { useEffect } from "react";
import { useNavigate, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { LayoutDashboard, ShoppingCart, Users, Settings, MessageSquare, Menu, LogOut, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const mobileNavItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingCart },
  { title: "Utilizadores", url: "/admin/utilizadores", icon: Users },
  { title: "Serviços", url: "/admin/servicos", icon: Settings },
  { title: "Suporte", url: "/admin/suporte", icon: MessageSquare },
];

const Admin = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !isAdmin) {
      navigate("/dashboard");
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const isActive = (url: string) => {
    if (url === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(url);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Mobile Top Bar */}
          <header className="md:hidden sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
                      <Menu className="w-5 h-5" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <SheetHeader className="p-6 border-b border-border">
                      <SheetTitle>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">SB</span>
                          </div>
                          <span className="font-display font-bold text-lg">Admin</span>
                        </div>
                      </SheetTitle>
                    </SheetHeader>
                    <nav className="p-4">
                      <ul className="space-y-1">
                        {mobileNavItems.map((item) => (
                          <li key={item.url}>
                            <Link
                              to={item.url}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                isActive(item.url)
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              <item.icon className="w-5 h-5" />
                              {item.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 pt-4 border-t border-border">
                        <Link to="/dashboard">
                          <Button variant="outline" className="w-full">
                            <Zap className="w-4 h-4 mr-2" />
                            Painel Utilizador
                          </Button>
                        </Link>
                      </div>
                    </nav>
                    <div className="mt-auto p-4 border-t border-border absolute bottom-0 left-0 right-0">
                      <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleSignOut}>
                        <LogOut className="w-5 h-5 mr-3" />
                        Sair
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
                <span className="font-display font-bold">Admin</span>
              </div>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <Zap className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </header>

          <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6 lg:p-8">
            <Outlet />
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border px-2 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around">
            {mobileNavItems.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                className={`flex flex-col items-center gap-1 py-3 px-2 min-w-0 flex-1 transition-colors ${
                  isActive(item.url)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium truncate">{item.title}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
