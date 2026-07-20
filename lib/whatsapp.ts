import type { EstadoPedido } from "@/types";

/**
 * Normaliza un telefono chileno a formato E.164 sin el "+", que es lo que
 * espera wa.me. Acepta lo que la gente escribe de verdad en el checkout:
 * "912345678", "9 1234 5678", "+56 9 1234 5678", "56912345678", "0912345678".
 * Devuelve null si no logra armar un numero movil chileno valido.
 */
export function normalizarTelefonoCL(telefono: string): string | null {
  let d = (telefono ?? "").replace(/\D/g, "");
  if (!d) return null;

  // Prefijo de salida internacional o cero inicial de larga distancia.
  d = d.replace(/^00/, "");
  if (d.startsWith("56")) d = d.slice(2);
  d = d.replace(/^0/, "");

  // Movil chileno: 9 + 8 digitos. Si vino sin el 9 inicial, se agrega.
  if (d.length === 8) d = "9" + d;
  if (d.length !== 9 || !d.startsWith("9")) return null;

  return "56" + d;
}

/** Link wa.me con el mensaje ya escrito. null si el telefono no sirve. */
export function linkWhatsApp(telefono: string, mensaje: string): string | null {
  const numero = normalizarTelefonoCL(telefono);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export type DatosMensaje = {
  numero: number;
  nombre: string;
  tipoEntrega: "retiro" | "delivery";
  /** Motivo opcional del rechazo, se agrega al mensaje de cancelado. */
  motivo?: string | null;
};

/**
 * Texto que se le manda al cliente segun el estado al que paso el pedido.
 * Devuelve null para los estados que no ameritan avisar (ej: "pendiente",
 * que es el estado en que el pedido entra antes de que el local lo mire).
 */
export function mensajeEstado(estado: EstadoPedido, p: DatosMensaje): string | null {
  const saludo = `Hola ${p.nombre.split(" ")[0]}`;
  const pedido = `tu pedido #${p.numero}`;

  switch (estado) {
    case "pagado":
      return `${saludo}! Recibimos el pago de ${pedido} en CrunchyBowl ✅ Ya lo estamos gestionando.`;

    case "preparando":
      return `${saludo}! 🍜 Confirmamos ${pedido} en CrunchyBowl. Ya lo estamos preparando y te avisamos apenas esté listo.`;

    case "listo":
      return p.tipoEntrega === "retiro"
        ? `${saludo}! 🎉 ${cap(pedido)} ya está listo para retirar en el local. ¡Te esperamos!`
        : `${saludo}! 🎉 ${cap(pedido)} ya está listo y sale en unos minutos hacia tu dirección.`;

    case "en_camino":
      return `${saludo}! 🛵 ${cap(pedido)} va en camino. Llega en pocos minutos, mantén el teléfono a mano.`;

    case "entregado":
      return `${saludo}! ${cap(pedido)} fue entregado 💛 ¡Gracias por preferir CrunchyBowl! Si te gustó, nos ayuda un montón que nos recomiendes.`;

    case "cancelado":
      return [
        `${saludo}, lamentamos avisarte que no pudimos tomar ${pedido}.`,
        p.motivo ? `Motivo: ${p.motivo.replace(/[.\s]*$/, "")}.` : null,
        "Si pagaste, te devolvemos el dinero. Cualquier duda escríbenos por aquí 🙏",
      ]
        .filter(Boolean)
        .join(" ");

    case "pendiente":
    default:
      return null;
  }
}

function cap(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
