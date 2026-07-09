export type MetodoPago = "efectivo" | "transferencia" | "flow";

export const DATOS_TRANSFERENCIA = {
  nombre: "Camila Figueroa",
  tipoCuenta: "Cuenta Vista",
  numero: "050102976081",
  banco: "Banco Falabella",
  rut: "19.406.361-K",
};

export const METODO_PAGO_LABEL: Record<MetodoPago, string> = {
  efectivo: "Efectivo o débito (al recibir)",
  transferencia: "Transferencia bancaria",
  flow: "Flow.cl",
};
