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
