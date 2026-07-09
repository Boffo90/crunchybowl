import Link from "next/link";
import { ShoppingBag, DollarSign, Users, TrendingUp } from "lucide-react";
// Lecturas con service role: el middleware ya restringe /admin/* al email admin,
// y la sesion del admin no pasa las politicas RLS de pedidos/perfiles ajenos.
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCLP } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hoyISO = hoy.toISOString();

  const { data: pedidosHoy } = await supabase
    .from("pedidos")
    .select("id, total, estado")
    .gte("created_at", hoyISO);

  const { data: pendientes } = await supabase
    .from("pedidos")
    .select("id, numero, nombre, total, tipo_entrega, estado, created_at")
    .in("estado", ["pendiente", "pagado", "preparando", "listo", "en_camino"])
    .order("created_at", { ascending: false })
    .limit(10);

  const { count: totalClientes } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("rol", "cliente");

  const ventasHoy = (pedidosHoy ?? [])
    .filter((p) => p.estado !== "cancelado")
    .reduce((acc, p) => acc + p.total, 0);
  const cantidadHoy = (pedidosHoy ?? []).filter((p) => p.estado !== "cancelado").length;

  const estadoBadge: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-800",
    pagado: "bg-blue-100 text-blue-800",
    preparando: "bg-purple-100 text-purple-800",
    listo: "bg-green-100 text-green-800",
    en_camino: "bg-indigo-100 text-indigo-800",
    entregado: "bg-gray-100 text-gray-800",
    cancelado: "bg-red-100 text-red-800",
  };

  return (
    <div className="p-6 md:p-10">
      <h1 className="mb-8 font-display text-4xl font-bold text-crunchy-dark">Dashboard</h1>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-kawaii bg-white p-6 shadow-kawaii">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-full bg-crunchy-pink-soft p-2">
              <ShoppingBag className="h-5 w-5 text-crunchy-accent" />
            </div>
            <p className="text-sm text-crunchy-muted">Pedidos hoy</p>
          </div>
          <p className="text-3xl font-bold text-crunchy-dark">{cantidadHoy}</p>
        </div>

        <div className="rounded-kawaii bg-white p-6 shadow-kawaii">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-full bg-crunchy-pink-soft p-2">
              <DollarSign className="h-5 w-5 text-crunchy-accent" />
            </div>
            <p className="text-sm text-crunchy-muted">Ventas hoy</p>
          </div>
          <p className="text-3xl font-bold text-crunchy-dark">{formatCLP(ventasHoy)}</p>
        </div>

        <div className="rounded-kawaii bg-white p-6 shadow-kawaii">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-full bg-crunchy-pink-soft p-2">
              <Users className="h-5 w-5 text-crunchy-accent" />
            </div>
            <p className="text-sm text-crunchy-muted">Clientes</p>
          </div>
          <p className="text-3xl font-bold text-crunchy-dark">{totalClientes ?? 0}</p>
        </div>

        <div className="rounded-kawaii bg-white p-6 shadow-kawaii">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-full bg-crunchy-pink-soft p-2">
              <TrendingUp className="h-5 w-5 text-crunchy-accent" />
            </div>
            <p className="text-sm text-crunchy-muted">Pendientes</p>
          </div>
          <p className="text-3xl font-bold text-crunchy-dark">{pendientes?.length ?? 0}</p>
        </div>
      </div>

      <div className="rounded-kawaii bg-white p-6 shadow-kawaii">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-crunchy-dark">Pedidos activos</h2>
          <Link href={ROUTES.ADMIN_PEDIDOS} className="text-sm font-semibold text-crunchy-accent hover:underline">
            Ver todos
          </Link>
        </div>

        {!pendientes || pendientes.length === 0 ? (
          <p className="py-12 text-center text-crunchy-muted">No hay pedidos activos ahora.</p>
        ) : (
          <div className="space-y-3">
            {pendientes.map((p) => (
              <Link
                key={p.id}
                href={ROUTES.ADMIN_PEDIDO(p.id)}
                className="flex flex-col gap-3 rounded-2xl border border-crunchy-pink-soft p-4 hover:bg-crunchy-cream sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-crunchy-dark">#{p.numero}</p>
                    <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (estadoBadge[p.estado] ?? "bg-gray-100 text-gray-800")}>
                      {p.estado}
                    </span>
                  </div>
                  <p className="text-sm text-crunchy-muted">{p.nombre}</p>
                  <p className="text-xs text-crunchy-muted">
                    {new Date(p.created_at).toLocaleString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {" - "}{p.tipo_entrega}
                  </p>
                </div>
                <p className="text-xl font-bold text-crunchy-accent">{formatCLP(p.total)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
