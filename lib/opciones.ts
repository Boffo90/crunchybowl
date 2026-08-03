// Utilidades para las opciones elegidas de un producto.
//
// Un grupo de seleccion multiple guarda una lista de nombres que PUEDE traer
// repetidos: el cliente pide 2 huevos, o las 2 salsas iguales en el Crunchy
// Date. Cada repeticion ocupa un lugar del cupo y se cobra por separado.

export type SeleccionValor = string | string[];

/** Normaliza a lista conservando los repetidos. */
export function listaSeleccion(valor: SeleccionValor | undefined | null): string[] {
  if (Array.isArray(valor)) return valor;
  return valor ? [valor] : [];
}

/** Cuantas veces esta elegida una opcion dentro del grupo. */
export function cantidadDe(valor: SeleccionValor | undefined | null, nombre: string): number {
  return listaSeleccion(valor).filter((n) => n === nombre).length;
}

/** Agrupa los repetidos conservando el orden en que aparecieron. */
export function agruparSeleccion(
  valor: SeleccionValor | undefined | null
): Array<{ nombre: string; cantidad: number }> {
  const salida: Array<{ nombre: string; cantidad: number }> = [];
  for (const nombre of listaSeleccion(valor)) {
    const existente = salida.find((s) => s.nombre === nombre);
    if (existente) existente.cantidad += 1;
    else salida.push({ nombre, cantidad: 1 });
  }
  return salida;
}

/** Texto legible de un grupo: "Huevo x2, Choclo". */
export function formatearSeleccion(valor: SeleccionValor | undefined | null): string {
  return agruparSeleccion(valor)
    .map(({ nombre, cantidad }) => (cantidad > 1 ? `${nombre} x${cantidad}` : nombre))
    .join(", ");
}
