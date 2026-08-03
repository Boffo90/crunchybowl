// Recargo por seleccionar mas opciones de las incluidas en un grupo.
// Caso de uso: el Bibimbap trae 4 toppings incluidos; del quinto en adelante
// se cobra un extra por cada uno. Configurable desde el panel admin
// (tabla configuracion, key=extras_grupos).

export type ExtraGrupo = {
  incluidos: number; // cuantas opciones del grupo van sin costo
  precio: number; // CLP por cada opcion adicional sobre las incluidas
  // Opciones que valen distinto al resto, por nombre exacto. El huevo frito
  // cuesta mas que un topping de verdura, por ejemplo.
  precios?: Record<string, number>;
};

// slug del producto -> nombre del grupo -> reglas
export type ExtrasConfig = Record<string, Record<string, ExtraGrupo>>;

/**
 * Topping que cuesta distinto al resto. Es el unico con precio propio hoy, y
 * el panel admin lo edita como un campo aparte. El nombre calza con la opcion
 * cargada en la tabla "opciones".
 */
export const TOPPING_CON_PRECIO_PROPIO = "Huevo";

export const EXTRAS_DEFAULT: ExtrasConfig = {
  bibimbap: {
    toppings: { incluidos: 4, precio: 500, precios: { [TOPPING_CON_PRECIO_PROPIO]: 1000 } },
  },
  // El Crunchy Date son 2 bibimbap: el doble de toppings incluidos.
  "crunchy-date": {
    toppings: { incluidos: 8, precio: 500, precios: { [TOPPING_CON_PRECIO_PROPIO]: 1000 } },
  },
};

function parsePrecios(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const salida: Record<string, number> = {};
  for (const [nombre, precio] of Object.entries(value as Record<string, unknown>)) {
    if (typeof precio !== "number" || !Number.isFinite(precio) || precio <= 0) continue;
    salida[nombre] = Math.floor(precio);
  }
  return Object.keys(salida).length > 0 ? salida : undefined;
}

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

      (salida[slug] ??= {})[grupo] = { incluidos, precio, precios: parsePrecios(r.precios) };
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
 * Cuantas unidades se pueden elegir en total dentro de un grupo.
 *
 * Sin recargo manda el max_seleccion de la opcion (tope duro de siempre). Con
 * recargo hay que dejar espacio para los adicionales y para los repetidos, asi
 * que el tope es el mayor entre la cantidad de opciones distintas y el doble de
 * las incluidas. Cliente y servidor DEBEN usar esta misma cuenta: si no, la
 * pagina deja armar un plato que despues el servidor rechaza.
 */
export function topeSeleccionGrupo(
  reglas: ExtraGrupo | null,
  cantidadOpciones: number,
  maxSeleccion: number
): number {
  if (!reglas) return maxSeleccion;
  return Math.max(cantidadOpciones, reglas.incluidos * 2);
}

/** Lo que cuesta una opcion puntual cuando va como adicional. */
export function precioOpcion(reglas: ExtraGrupo, nombre: string): number {
  return reglas.precios?.[nombre] ?? reglas.precio;
}

/**
 * Recargo por las opciones que superan las incluidas.
 *
 * Cuando hay opciones de distinto precio, las incluidas son las mas baratas y
 * se cobran las mas caras. Asi el resultado no depende del orden en que el
 * cliente fue marcando, y elegir 4 verduras + 1 huevo siempre cuesta el huevo.
 *
 * Los repetidos cuentan como opciones distintas: 2 huevos ocupan 2 lugares.
 */
export function calcularRecargoGrupo(seleccionadas: string[], reglas: ExtraGrupo | null): number {
  if (!reglas) return 0;
  return seleccionadas
    .map((nombre) => precioOpcion(reglas, nombre))
    .sort((a, b) => a - b)
    .slice(reglas.incluidos)
    .reduce((total, precio) => total + precio, 0);
}
