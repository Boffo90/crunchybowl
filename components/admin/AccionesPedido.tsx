"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, MessageCircle } from "lucide-react";
import { linkWhatsApp, mensajeEstado } from "@/lib/whatsapp";
import type { EstadoPedido } from "@/types";

const ESTADOS: { value: EstadoPedido; label: string }[] = [
  { value: "pendiente", label: "Pendiente de confirmación" },
  { value: "pagado", label: "Pagado" },
  { value: "preparando", label: "En preparación" },
  { value: "listo", label: "Listo" },
  { value: "en_camino", label: "En camino" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

type Props = {
  pedidoId: string;
  numero: number;
  nombre: string;
  telefono: string;
  tipoEntrega: "retiro" | "delivery";
  estadoActual: EstadoPedido;
};

export function AccionesPedido({ pedidoId, numero, nombre, telefono, tipoEntrega, estadoActual }: Props) {
  const router = useRouter();
  const [estado, setEstado] = useState(estadoActual);
  const [loading, setLoading] = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  // Si el navegador bloquea la pestaña emergente, se ofrece el link a mano.
  const [linkBloqueado, setLinkBloqueado] = useState<string | null>(null);

  const sinConfirmar = estado === "pendiente" || estado === "pagado";

  const armarLink = (nuevo: EstadoPedido, motivoRechazo?: string) => {
    const mensaje = mensajeEstado(nuevo, { numero, nombre, tipoEntrega, motivo: motivoRechazo });
    return mensaje ? linkWhatsApp(telefono, mensaje) : null;
  };

  const cambiarEstado = async (nuevo: EstadoPedido, motivoRechazo?: string) => {
    setLinkBloqueado(null);

    // La pestaña se abre AHORA, dentro del gesto del click: si se abriera despues
    // del await, el navegador la bloquearia por ser una emergente sin interaccion.
    const link = armarLink(nuevo, motivoRechazo);
    const ventana = link ? window.open("", "_blank") : null;

    const anterior = estado;
    setEstado(nuevo);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pedidos/${pedidoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevo, motivo: motivoRechazo ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar estado");

      if (link && ventana) {
        ventana.location.href = link;
      } else if (link) {
        setLinkBloqueado(link);
        toast.warning("Estado actualizado. Abre el aviso al cliente con el botón de abajo.");
      } else if (!link && mensajeEstado(nuevo, { numero, nombre, tipoEntrega })) {
        // Habia mensaje pero el telefono no sirve para armar el link.
        toast.warning(`Estado actualizado, pero el teléfono "${telefono}" no es un móvil chileno válido.`);
      } else {
        toast.success("Estado actualizado");
      }

      setRechazando(false);
      setMotivo("");
      router.refresh();
    } catch (err) {
      ventana?.close();
      setEstado(anterior);
      toast.error(err instanceof Error ? err.message : "Error al actualizar estado");
    } finally {
      setLoading(false);
    }
  };

  const linkEstadoActual = armarLink(estado);

  return (
    <div className="space-y-4">
      {sinConfirmar && !rechazando && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            disabled={loading}
            onClick={() => cambiarEstado("preparando")}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-4 text-base font-bold text-white shadow-kawaii transition-all hover:-translate-y-0.5 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <Check className="h-5 w-5" /> Aceptar y avisar
          </button>
          <button
            disabled={loading}
            onClick={() => setRechazando(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-red-300 bg-white px-6 py-4 text-base font-bold text-red-600 transition-all hover:-translate-y-0.5 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <X className="h-5 w-5" /> Rechazar
          </button>
        </div>
      )}

      {rechazando && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
          <label className="mb-2 block text-sm font-semibold text-crunchy-dark">
            ¿Por qué rechazas el pedido? (opcional, se lo mandamos al cliente)
          </label>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={200}
            placeholder="Ej: nos quedamos sin pollo"
            className="mb-3 w-full rounded-2xl border-2 border-red-200 bg-white px-4 py-3 outline-none transition-colors focus:border-red-400"
          />
          <div className="flex gap-3">
            <button
              disabled={loading}
              onClick={() => cambiarEstado("cancelado", motivo.trim() || undefined)}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              Confirmar rechazo
            </button>
            <button
              disabled={loading}
              onClick={() => { setRechazando(false); setMotivo(""); }}
              className="rounded-full px-5 py-3 font-semibold text-crunchy-muted transition-colors hover:bg-white"
            >
              Volver
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold text-crunchy-muted">
          Cambiar estado (avisa al cliente por WhatsApp)
        </label>
        <select
          value={estado}
          disabled={loading}
          onChange={(e) => cambiarEstado(e.target.value as EstadoPedido)}
          className="w-full rounded-2xl border-2 border-crunchy-pink-soft bg-white px-4 py-3 font-semibold outline-none transition-colors focus:border-crunchy-accent disabled:opacity-50"
        >
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      {linkBloqueado && (
        <a
          href={linkBloqueado}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setLinkBloqueado(null)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 font-bold text-white shadow-kawaii transition-all hover:-translate-y-0.5"
        >
          <MessageCircle className="h-5 w-5" /> Abrir WhatsApp para avisar
        </a>
      )}

      {linkEstadoActual && !linkBloqueado && (
        <a
          href={linkEstadoActual}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-crunchy-muted underline-offset-2 hover:text-crunchy-accent hover:underline"
        >
          <MessageCircle className="h-4 w-4" /> Reenviar el aviso de este estado
        </a>
      )}
    </div>
  );
}
