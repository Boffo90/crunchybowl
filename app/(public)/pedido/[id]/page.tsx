import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, MapPin, Wallet, CreditCard, Landmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROUTES } from "@/lib/routes";
import { formatCLP } from "@/lib/utils";
import { DATOS_TRANSFERENCIA, METODO_PAGO_LABEL, type MetodoPago } from "@/lib/pago";

const estadoLabel: Record<string, string> = {
  pendiente: "Pendiente de confirmacion",
  pagado: "Pagado",
  preparando: "En preparacion",
  listo: "Listo",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default async function PedidoPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Se lee con el admin client para poder mostrar tambien pedidos de invitado (user_id null),
  // pero controlamos el acceso manualmente mas abajo.
  const admin = createAdminClient();
  const { data: pedido } = await admin
    .from("pedidos")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!pedido) notFound();

  // Pedido de un usuario registrado: solo lo ve ese usuario. Pedido de invitado (user_id null):
  // visible por cualquiera con el link unico (UUID no adivinable).
  if (pedido.user_id && pedido.user_id !== user?.id) notFound();

  const { data: items } = await admin
    .from("pedido_items")
    .select("*")
    .eq("pedido_id", pedido.id);

  const metodoPago = pedido.metodo_pago as MetodoPago;

  const opcionesRender = (opts: Record<string, string | string[]>) => {
    return Object.entries(opts).map(([g, v]) => (
      <span key={g} className="mr-2">
        <span className="capitalize">{g}:</span> {Array.isArray(v) ? v.join(", ") : v}
      </span>
    ));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 rounded-kawaii bg-gradient-to-br from-crunchy-pink-soft to-crunchy-lavender p-8 text-center shadow-kawaii">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-kawaii">
            <CheckCircle2 className="h-8 w-8 text-crunchy-accent" />
          </div>
        </div>
        <h1 className="mb-2 font-display text-3xl font-bold text-crunchy-dark">Pedido confirmado</h1>
        <p className="text-crunchy-muted">Pedido #{pedido.numero}</p>
        <p className="mt-2 text-sm text-crunchy-dark">Te contactaremos por WhatsApp para confirmar.</p>
      </div>

      {metodoPago === "transferencia" && pedido.estado === "pendiente" && (
        <div className="mb-6 rounded-kawaii border-2 border-crunchy-pink bg-white p-6 shadow-kawaii">
          <div className="mb-3 flex items-center gap-2">
            <Landmark className="h-5 w-5 text-crunchy-accent" />
            <h2 className="font-display text-xl font-bold text-crunchy-dark">Paga por transferencia</h2>
          </div>
          <ul className="space-y-1 text-sm text-crunchy-muted">
            <li><span className="font-medium text-crunchy-dark">Nombre:</span> {DATOS_TRANSFERENCIA.nombre}</li>
            <li><span className="font-medium text-crunchy-dark">{DATOS_TRANSFERENCIA.tipoCuenta}:</span> {DATOS_TRANSFERENCIA.numero}</li>
            <li><span className="font-medium text-crunchy-dark">Banco:</span> {DATOS_TRANSFERENCIA.banco}</li>
            <li><span className="font-medium text-crunchy-dark">RUT:</span> {DATOS_TRANSFERENCIA.rut}</li>
            <li className="pt-1"><span className="font-medium text-crunchy-dark">Monto:</span> {formatCLP(pedido.total)}</li>
          </ul>
          <p className="mt-3 text-xs text-crunchy-muted">
            Envíanos el comprobante por WhatsApp indicando tu número de pedido #{pedido.numero}.
          </p>
        </div>
      )}

      <div className="mb-6 rounded-kawaii bg-white p-6 shadow-kawaii">
        <h2 className="mb-4 font-display text-xl font-bold text-crunchy-dark">Detalles</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-crunchy-accent" />
            <span className="text-crunchy-muted">Estado:</span>
            <span className="font-semibold text-crunchy-dark">{estadoLabel[pedido.estado] ?? pedido.estado}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-crunchy-accent" />
            <span className="text-crunchy-muted">Entrega:</span>
            <span className="font-semibold text-crunchy-dark">
              {pedido.tipo_entrega === "retiro" ? "Retiro en local" : pedido.direccion}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {metodoPago === "flow" ? (
              <CreditCard className="h-4 w-4 text-crunchy-accent" />
            ) : metodoPago === "transferencia" ? (
              <Landmark className="h-4 w-4 text-crunchy-accent" />
            ) : (
              <Wallet className="h-4 w-4 text-crunchy-accent" />
            )}
            <span className="text-crunchy-muted">Pago:</span>
            <span className="font-semibold text-crunchy-dark">
              {METODO_PAGO_LABEL[metodoPago] ?? pedido.metodo_pago}
            </span>
          </div>
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
                <p className="text-xs text-crunchy-muted">
                  {opcionesRender(i.opciones_seleccionadas)}
                </p>
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
        <div className="mb-4 flex justify-between text-sm">
          <span className="text-crunchy-muted">Delivery</span>
          <span className="font-semibold text-crunchy-dark">{formatCLP(pedido.costo_delivery)}</span>
        </div>
        <div className="flex justify-between border-t border-crunchy-pink pt-3">
          <span className="text-lg font-bold text-crunchy-dark">Total</span>
          <span className="text-2xl font-bold text-crunchy-accent">{formatCLP(pedido.total)}</span>
        </div>
      </div>

      <div className="mt-8 text-center">
        {user ? (
          <Link href={ROUTES.MI_CUENTA} className="text-crunchy-accent hover:underline">Ver mis pedidos</Link>
        ) : (
          <Link href={ROUTES.CARTA} className="text-crunchy-accent hover:underline">Volver a la carta</Link>
        )}
      </div>
    </div>
  );
}
