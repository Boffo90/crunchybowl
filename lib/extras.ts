// Recargo por seleccionar mas opciones de las incluidas en un grupo.
// Caso de uso: el Bibimbap trae 4 toppings incluidos; del quinto en adelante
// se cobra un extra por cada uno. Configurable desde el panel admin
// (tabla configuracion, key=extras_grupos).

export type ExtraGrupo = {
  incluidos: number; // cuantas opciones del grupo van sin costo
  precio: number; // CLP por cada opcion adicional sobre las incluidas
};

// slug del producto -> nombre del grupo -> reglas
export type ExtrasConfig = Record<string, Record<string, ExtraGrupo>>;

export const EXTRAS_DEFAULT: ExtrasConfig = {
  bibimbap: { toppings: { incluidos: 4, precio: 500 } },
};

export function parseExtras(value: unknown): ExtrasConfig {
  if (!value || typeof value !== "object") return EXTRAS_DEFAULT;

  const salida: ExtrasConfig = {};
  for (const [slug, grupos] of Object.entries(value as Record<string, unknown>)) {
    if (!grupos || typeof grupos !== "object") continue;

    for (const [grupo, reglas] of Object.entries(grupos as Record<string, unknown>)) {
      if (!reglas || typeof reglas !== "object") continue;
      const r = reglas as Record<string, unknown>;

      const incluidos = typeof r.incluidos === "number" ? Math.floor(r.incluidos) : NaN;
      const precio = typeof r.precio === "number" ? Math.floor(r.precio) : NaN;
      // Un precio de 0 desactiva el cobro: el grupo vuelve a tener tope duro.
      if (!Number.isFinite(incluidos) || incluidos < 0) continue;
      if (!Number.isFinite(precio) || precio <= 0) continue;

      (salida[slug] ??= {})[grupo] = { incluidos, precio };
    }
  }

  // Sin fallback al default: una config guardada pero vacia (o con precio 0)
  // significa "sin recargos", y debe respetarse. El default solo aplica cuando
  // no hay ninguna fila guardada, que es el caso de arriba.
  return salida;
}

/** Reglas de un grupo, o null si ese grupo no admite adicionales pagados. */
export function getExtraGrupo(
  config: ExtrasConfig,
  slugProducto: string,
  grupo: string
): ExtraGrupo | null {
  return config[slugProducto]?.[grupo] ?? null;
}

/**
 * Recargo por las opciones que superan las incluidas.
 * Con 4 incluidas a $500: 4 seleccionadas = $0, 6 seleccionadas = $1.000.
 */
export function calcularRecargoGrupo(seleccionadas: number, reglas: ExtraGrupo | null): number {
  if (!reglas) return 0;
  const adicionales = Math.max(0, seleccionadas - reglas.incluidos);
  return adicionales * reglas.precio;
}
