import AdminOrders from "@/components/admin/AdminOrders";

const AdminOrdersPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
          Gestão de Pedidos
        </h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os pedidos da plataforma
        </p>
      </div>
      <AdminOrders />
    </div>
  );
};

export default AdminOrdersPage;
