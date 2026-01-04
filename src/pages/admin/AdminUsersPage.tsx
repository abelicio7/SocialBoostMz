import AdminUsers from "@/components/admin/AdminUsers";

const AdminUsersPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
          Gestão de Utilizadores
        </h1>
        <p className="text-muted-foreground">
          Gerencie utilizadores, saldos e permissões
        </p>
      </div>
      <AdminUsers />
    </div>
  );
};

export default AdminUsersPage;
