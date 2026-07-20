import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AvisoPedidosNuevos } from "@/components/admin/AvisoPedidosNuevos";
import { ROUTES } from "@/lib/routes";
import { esAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    redirect(ROUTES.LOGIN);
  }

  if (!esAdmin(user.email)) redirect(ROUTES.HOME);

  return (
    <div className="flex min-h-screen bg-crunchy-cream">
      <AdminSidebar nombreAdmin={user.email ?? "Admin"} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <AvisoPedidosNuevos />
    </div>
  );
}
