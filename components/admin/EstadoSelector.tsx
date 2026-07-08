"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

export function EstadoSelector({ pedidoId, estadoActual }: { pedidoId: string; estadoActual: EstadoPedido }) {
  const router = useRouter();
  const [estado, setEstado] = useState(estadoActual);
  const [loading, setLoading] = useState(false);

  const handleChange = async (nuevo: EstadoPedido) => {
    setEstado(nuevo);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pedidos/${pedidoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar estado");
      toast.success("Estado actualizado");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al actualizar estado";
      toast.error(msg);
      setEstado(estadoActual);
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={estado}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value as EstadoPedido)}
      className="w-full rounded-2xl border-2 border-crunchy-pink-soft bg-white px-4 py-3 font-semibold outline-none transition-colors focus:border-crunchy-accent disabled:opacity-50"
    >
      {ESTADOS.map((e) => (
        <option key={e.value} value={e.value}>
          {e.label}
        </option>
      ))}
    </select>
  );
}
