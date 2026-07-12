import { notFound } from "next/navigation";
import { MapPin, Phone, Wallet, CreditCard, Landmark } from "lucide-react";
// Service role: el middleware ya restringe /admin/*; RLS ocultaria pedidos ajenos.
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCLP } from "@/lib/utils";
import { METODO_PAGO_LABEL, type MetodoPago } from "@/lib/pago";
import { EstadoSelector } from "@/components/admin/EstadoSelector";

export const dynamic = "force-dynamic";

export default async function AdminPedidoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!pedido) notFound();

  const { data: items } = await supabase
    .from("pedido_items")
    .select("*")
    .eq("pedido_id", pedido.id);

  const opcionesRender = (opts: Record<string, string | string[]>) =>
    Object.entries(opts).map(([g, v]) => (
      <span key={g} className="mr-2">
        <span className="capitalize">{g}:</span> {Array.isArray(v) ? v.join(", ") : v}
      </span>
    ));

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-10">
      <h1 className="mb-8 font-display text-4xl font-bold text-crunchy-dark">Pedido #{pedido.numero}</h1>

      <div className="mb-6 rounded-kawaii bg-white p-6 shadow-kawaii">
        <h2 className="mb-4 font-display text-xl font-bold text-crunchy-dark">Estado del pedido</h2>
        <EstadoSelector pedidoId={pedido.id} estadoActual={pedido.estado} />
      </div>

      <div className="mb-6 rounded-kawaii bg-white p-6 shadow-kawaii">
        <h2 className="mb-4 font-display text-xl font-bold text-crunchy-dark">Cliente</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-crunchy-accent" />
            <span className="text-crunchy-muted">{pedido.nombre} · {pedido.telefono}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-crunchy-accent" />
            <span className="font-semibold text-crunchy-dark">
              {pedido.tipo_entrega === "retiro" ? "Retiro en local" : pedido.direccion}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {pedido.metodo_pago === "flow" ? (
              <CreditCard className="h-4 w-4 text-crunchy-accent" />
            ) : pedido.metodo_pago === "transferencia" ? (
              <Landmark className="h-4 w-4 text-crunchy-accent" />
            ) : (
              <Wallet className="h-4 w-4 text-crunchy-accent" />
            )}
            <span className="font-semibold text-crunchy-dark">
              {METODO_PAGO_LABEL[pedido.metodo_pago as MetodoPago] ?? pedido.metodo_pago}
            </span>
          </div>
          {pedido.notas_generales && (
            <p className="italic text-crunchy-muted">Notas: {pedido.notas_generales}</p>
          )}
        </div>
      </div>

      <div className="mb-6 rounded-kawaii bg-white p-6 shadow-kawaii">
        <h2 className="mb-4 font-display text-xl font-bold text-crunchy-dark">Productos</h2>
        <div className="space-y-3">
          {items?.map((i) => (
            <div key={i.id} className="border-b border-crunchy-pink-soft pb-3 last:border-0">
              <div className="flex justify-between font-semibold text-crunchy-dark">
                <span>{i.cantidad}x {i.nombre_producto}</span>
                <span>{formatCLP(i.subtotal)}</span>
              </div>
              {i.opciones_seleccionadas && (
                <p className="text-xs text-crunchy-muted">{opcionesRender(i.opciones_seleccionadas)}</p>
              )}
              {i.notas && <p className="mt-1 text-xs italic text-crunchy-muted">Notas: {i.notas}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-kawaii bg-crunchy-pink-soft p-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-crunchy-muted">Subtotal</span>
          <span className="font-semibold text-crunchy-dark">{formatCLP(pedido.subtotal)}</span>
        </div>
        {pedido.descuento > 0 && (
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-semibold text-crunchy-accent">Descuento aplicado</span>
            <span className="font-semibold text-crunchy-accent">-{formatCLP(pedido.descuento)}</span>
          </div>
        )}
        <div className="mb-4 flex justify-between text-sm">
          <span className="text-crunchy-muted">Delivery</span>
          <span className="font-semibold text-crunchy-dark">{formatCLP(pedido.costo_delivery)}</span>
        </div>
        <div className="flex justify-between border-t border-crunchy-pink pt-3">
          <span className="text-lg font-bold text-crunchy-dark">Total</span>
          <span className="text-2xl font-bold text-crunchy-accent">{formatCLP(pedido.total)}</span>
        </div>
      </div>
    </div>
  );
}
