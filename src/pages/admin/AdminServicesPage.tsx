import AdminServices from "@/components/admin/AdminServices";

const AdminServicesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
          Gestão de Serviços
        </h1>
        <p className="text-muted-foreground">
          Configure os serviços disponíveis na plataforma
        </p>
      </div>
      <AdminServices />
    </div>
  );
};

export default AdminServicesPage;
