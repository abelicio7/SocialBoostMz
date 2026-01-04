import AdminSupport from "@/components/admin/AdminSupport";

const AdminSupportPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
          Suporte ao Cliente
        </h1>
        <p className="text-muted-foreground">
          Responda às mensagens dos utilizadores
        </p>
      </div>
      <AdminSupport />
    </div>
  );
};

export default AdminSupportPage;
