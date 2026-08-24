// Aviso que el local enciende cuando quiere decirle algo a los clientes en
// todas las paginas: que hoy no hay delivery, que se acabo un plato, que
// cierran antes. Configurable desde el panel admin
// (tabla configuracion, key=aviso).

export type TonoAviso = "info" | "alerta";

export type AvisoConfig = {
  activo: boolean;
  texto: string;
  // "info" para una novedad normal, "alerta" para algo que el cliente tiene
  // que ver si o si antes de pedir (ej: hoy sin delivery).
  tono: TonoAviso;
};

export const AVISO_INACTIVO: AvisoConfig = { activo: false, texto: "", tono: "info" };

export const AVISO_TEXTO_MAX = 120;

/** Textos de un clic para los casos que mas se repiten en el local. */
export const AVISOS_SUGERIDOS: Array<{ etiqueta: string; texto: string; tono: TonoAviso }> = [
  {
    etiqueta: "Hay delivery",
    texto: "🛵 Hoy estamos con delivery disponible en Pucón",
    tono: "info",
  },
  {
    etiqueta: "Sin delivery",
    texto: "🛵 Hoy no tenemos delivery: solo retiro en el local",
    tono: "alerta",
  },
];

export function parseAviso(value: unknown): AvisoConfig {
  if (!value || typeof value !== "object") return AVISO_INACTIVO;
  const v = value as Record<string, unknown>;

  const texto = typeof v.texto === "string" ? v.texto.trim().slice(0, AVISO_TEXTO_MAX) : "";
  // Un aviso encendido pero vacio no se muestra: seria una franja en blanco.
  const activo = v.activo === true && texto.length > 0;

  return {
    activo,
    texto,
    tono: v.tono === "alerta" ? "alerta" : "info",
  };
}
