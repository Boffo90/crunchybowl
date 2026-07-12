// Descuento global por porcentaje sobre el subtotal de la carta,
// configurable desde el panel admin (tabla configuracion, key=descuento).

export type DescuentoConfig = {
  activo: boolean;
  porcentaje: number; // entero 1-99
  motivo: string; // texto del banner, ej: "Promo inauguración"
};

export const DESCUENTO_INACTIVO: DescuentoConfig = { activo: false, porcentaje: 0, motivo: "" };

export function parseDescuento(value: unknown): DescuentoConfig {
  if (!value || typeof value !== "object") return DESCUENTO_INACTIVO;
  const v = value as Record<string, unknown>;
  const porcentaje = typeof v.porcentaje === "number" ? Math.floor(v.porcentaje) : 0;
  const activo = v.activo === true && porcentaje >= 1 && porcentaje <= 99;
  return {
    activo,
    porcentaje: activo ? porcentaje : 0,
    motivo: typeof v.motivo === "string" ? v.motivo.slice(0, 80) : "",
  };
}

export function calcularDescuento(subtotal: number, config: DescuentoConfig): number {
  if (!config.activo) return 0;
  return Math.round((subtotal * config.porcentaje) / 100);
}
