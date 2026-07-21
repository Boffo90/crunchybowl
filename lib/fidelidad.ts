// Canje de la tarjeta de fidelidad: al completar los sellos, el cliente se
// lleva un plato gratis en su proximo pedido web.
//
// Los sellos los SUMA un trigger de la base (otorgar_sello) cuando el pedido
// pasa a "entregado". La app solo se encarga del canje: descuenta el plato,
// consume los sellos y marca el pedido con sello_otorgado=true para que ese
// mismo pedido no vuelva a otorgar un sello.

/** Categoria cuyos productos NO entran en el canje (traen mas de una cosa). */
export const CATEGORIA_PROMOS_SLUG = "promos";

export const SELLOS_META_DEFAULT = 10;

export function parseMetaSellos(value: unknown): number {
  const meta = (value as { sellos_meta?: unknown } | null)?.sellos_meta;
  if (typeof meta !== "number" || !Number.isFinite(meta)) return SELLOS_META_DEFAULT;
  const entero = Math.floor(meta);
  return entero >= 1 && entero <= 100 ? entero : SELLOS_META_DEFAULT;
}

/** Plato que puede ir gratis: solo se regala el precio base, sin adicionales. */
export type PlatoElegible = {
  id: string;
  precio_base: number;
};

export function tarjetaCompleta(sellos: number, meta: number): boolean {
  return meta > 0 && sellos >= meta;
}
