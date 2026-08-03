import { createAdminClient } from "@/lib/supabase/admin";
import { estadoPagoFlow, estadoPagoFlowPorPedido, flowDisponible } from "@/lib/flow";

// SOLO USO EN SERVIDOR.
//
// El webhook de Flow (urlConfirmation) es la via normal para marcar un pedido
// como pagado, pero puede no llegar nunca: Flow no lo reintenta para siempre y
// en local ni siquiera alcanza al servidor. Sin esto el local no tiene como
// saber si el cliente pago de verdad, y termina preparando pedidos impagos.
// Aca se le pregunta a Flow directamente por el estado del pago.

export type ResultadoVerificacion = {
  pagado: boolean;
  /** Estado del pedido despues de verificar. */
  estado: string;
  /** Texto para mostrarle al local. */
  mensaje: string;
};

// Codigos que devuelve Flow en getStatus.
const FLOW_PENDIENTE = 1;
const FLOW_PAGADA = 2;
const FLOW_RECHAZADA = 3;
const FLOW_ANULADA = 4;

export async function verificarPagoFlow(pedidoId: string): Promise<ResultadoVerificacion> {
  const admin = createAdminClient();

  const { data: pedido } = await admin
    .from("pedidos")
    .select("id, estado, metodo_pago, flow_token")
    .eq("id", pedidoId)
    .maybeSingle();

  if (!pedido) {
    return { pagado: false, estado: "desconocido", mensaje: "No encontramos el pedido." };
  }

  if (pedido.metodo_pago !== "flow") {
    return { pagado: false, estado: pedido.estado, mensaje: "Este pedido no se paga con Flow." };
  }

  // Ojo: NO se asume que un pedido ya aceptado esta pagado. Un pedido de Flow
  // pudo moverse a "preparando" a mano sin que el pago existiera nunca, que es
  // justo el caso que hay que detectar. La verdad la tiene Flow.
  if (!flowDisponible()) {
    return {
      pagado: false,
      estado: pedido.estado,
      mensaje: "Flow no esta configurado en el servidor.",
    };
  }

  let estadoFlow;
  try {
    // Con token se consulta directo; sin el (pedidos anteriores a que se
    // guardara) se busca en Flow por el id del pedido, que es el commerceOrder.
    estadoFlow = pedido.flow_token
      ? await estadoPagoFlow(pedido.flow_token)
      : await estadoPagoFlowPorPedido(pedido.id);
  } catch (err) {
    console.error("Error consultando el pago a Flow:", err);
    return {
      pagado: false,
      estado: pedido.estado,
      mensaje: "No pudimos consultar a Flow. Intenta de nuevo en un momento.",
    };
  }

  if (!estadoFlow) {
    return {
      pagado: false,
      estado: pedido.estado,
      mensaje: "Flow no tiene ningun pago registrado para este pedido: el cliente nunca pago.",
    };
  }

  if (estadoFlow.status === FLOW_PAGADA) {
    // Solo se mueve el pedido si seguia pendiente: el filtro evita pisar un
    // cambio hecho por el webhook o por el local mientras se consultaba a Flow.
    if (pedido.estado === "pendiente") {
      await admin
        .from("pedidos")
        .update({ estado: "pagado" })
        .eq("id", pedido.id)
        .eq("estado", "pendiente");

      return { pagado: true, estado: "pagado", mensaje: "Pago confirmado por Flow." };
    }
    return { pagado: true, estado: pedido.estado, mensaje: "Pago confirmado por Flow." };
  }

  const detalle: Record<number, string> = {
    [FLOW_PENDIENTE]: "El cliente todavia no completa el pago en Flow.",
    [FLOW_RECHAZADA]: "Flow rechazo el pago. El pedido no esta pagado.",
    [FLOW_ANULADA]: "El pago fue anulado en Flow.",
  };

  return {
    pagado: false,
    estado: pedido.estado,
    mensaje: detalle[estadoFlow.status] ?? `Flow respondio un estado desconocido (${estadoFlow.status}).`,
  };
}
