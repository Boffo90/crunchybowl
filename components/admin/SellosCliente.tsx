"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";

type Props = {
  clienteId: string;
  nombre: string;
  sellosIniciales: number;
  meta: number;
};

/** Suma o resta sellos a mano a la tarjeta de un cliente. */
export function SellosCliente({ clienteId, nombre, sellosIniciales, meta }: Props) {
  const [sellos, setSellos] = useState(sellosIniciales);
  const [loading, setLoading] = useState(false);

  const ajustar = async (delta: number) => {
    if (loading) return;
    if (delta < 0 && sellos === 0) return;

    const previos = sellos;
    // Se pinta al tiro y se revierte si el servidor rechaza.
    setSellos((s) => Math.max(0, s + delta));
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clientes/${clienteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo ajustar");

      setSellos(data.sellos);
      toast.success(
        `${nombre}: ${data.sellos} ${data.sellos === 1 ? "sello" : "sellos"}` +
          (data.sellos >= meta ? " — ¡tarjeta completa!" : "")
      );
    } catch (err) {
      setSellos(previos);
      toast.error(err instanceof Error ? err.message : "No se pudo ajustar");
    } finally {
      setLoading(false);
    }
  };

  const completa = sellos >= meta;

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => ajustar(-1)}
        disabled={loading || sellos === 0}
        aria-label={`Quitar un sello a ${nombre}`}
        className="rounded-full border-2 border-crunchy-pink-soft bg-white p-1.5 text-crunchy-dark transition-colors hover:bg-crunchy-pink-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>

      <span
        className={
          "min-w-[4.5rem] text-center text-sm font-bold " +
          (completa ? "text-crunchy-accent" : "text-crunchy-dark")
        }
      >
        {completa ? "🫰 " : ""}
        {sellos} / {meta}
      </span>

      <button
        type="button"
        onClick={() => ajustar(1)}
        disabled={loading}
        aria-label={`Agregar un sello a ${nombre}`}
        className="rounded-full border-2 border-crunchy-pink-soft bg-white p-1.5 text-crunchy-dark transition-colors hover:bg-crunchy-pink-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
