export type MetodoPago = "efectivo" | "transferencia" | "flow";

export const DATOS_TRANSFERENCIA = {
  nombre: "Camila Figueroa",
  tipoCuenta: "Cuenta Vista",
  numero: "19406361",
  banco: "Banco TAPP Los Andes",
  rut: "19.406.361-K",
};

export const METODO_PAGO_LABEL: Record<MetodoPago, string> = {
  efectivo: "Efectivo o débito (al recibir)",
  transferencia: "Transferencia bancaria",
  flow: "Flow.cl",
};

/**
 * Pedido con Flow que todavia no confirma el pago: se crea en "pendiente" y
 * recien pasa a "pagado" cuando Flow avisa (o cuando el local lo verifica a
 * mano). Mientras este asi NO debe prepararse ni contar como pedido por
 * atender: el cliente pudo cerrar la ventana de Flow sin pagar nunca.
 */
export function esperandoPagoFlow(pedido: { metodo_pago: string; estado: string }): boolean {
  return pedido.metodo_pago === "flow" && pedido.estado === "pendiente";
}
