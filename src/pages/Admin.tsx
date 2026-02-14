import { useEffect } from "react";
import { useNavigate, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { LayoutDashboard, ShoppingCart, Users, Settings, MessageSquare, Menu } from "lucide-react";

const mobileNavItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingCart },
  { title: "Utilizadores", url: "/admin/utilizadores", icon: Users },
  { title: "Serviços", url: "/admin/servicos", icon: Settings },
  { title: "Suporte", url: "/admin/suporte", icon: MessageSquare },
];

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>

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
