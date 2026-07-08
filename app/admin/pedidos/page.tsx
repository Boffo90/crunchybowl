import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCLP } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";

const estadoBadge: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  pagado: "bg-blue-100 text-blue-800",
  preparando: "bg-purple-100 text-purple-800",
  listo: "bg-green-100 text-green-800",
  en_camino: "bg-indigo-100 text-indigo-800",
  entregado: "bg-gray-100 text-gray-800",
  cancelado: "bg-red-100 text-red-800",
};

export default async function AdminPedidosPage() {
  const supabase = createClient();
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id, numero, nombre, telefono, total, tipo_entrega, estado, metodo_pago, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-6 md:p-10">
      <h1 className="mb-8 font-display text-4xl font-bold text-crunchy-dark">Pedidos</h1>

      <div className="rounded-kawaii bg-white shadow-kawaii">
        {!pedidos || pedidos.length === 0 ? (
          <p className="py-12 text-center text-crunchy-muted">Aun no hay pedidos.</p>
        ) : (
          <div className="divide-y divide-crunchy-pink-soft">
            {pedidos.map((p) => (
              <Link
                key={p.id}
                href={ROUTES.ADMIN_PEDIDO(p.id)}
                className="grid gap-3 p-4 transition-colors hover:bg-crunchy-cream md:grid-cols-6 md:items-center"
              >
                <div>
                  <p className="font-bold text-crunchy-dark">#{p.numero}</p>
                  <p className="text-xs text-crunchy-muted">
                    {new Date(p.created_at).toLocaleString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="font-semibold text-crunchy-dark">{p.nombre}</p>
                  <p className="text-sm text-crunchy-muted">{p.telefono}</p>
                </div>
                <div>
                  <span className={"inline-block rounded-full px-3 py-1 text-xs font-semibold " + (estadoBadge[p.estado] ?? "bg-gray-100 text-gray-800")}>
                    {p.estado}
                  </span>
                </div>
                <div>
                  <p className="text-sm capitalize text-crunchy-dark">{p.tipo_entrega}</p>
                  <p className="text-xs text-crunchy-muted">{p.metodo_pago}</p>
                </div>
                <p className="text-right text-lg font-bold text-crunchy-accent">{formatCLP(p.total)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
