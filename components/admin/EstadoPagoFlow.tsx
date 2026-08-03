"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

type Props = {
  pedidoId: string;
  /** true cuando Flow ya confirmo el pago. */
  pagado: boolean;
  /** Resultado de la verificacion automatica al abrir el pedido. */
  mensajeInicial?: string | null;
};

/**
 * Cartel del estado real del pago con Flow. Mientras no este confirmado, el
 * pedido NO debe prepararse: el cliente pudo cerrar la ventana de Flow sin
 * pagar. El boton vuelve a preguntarle a Flow en el momento.
 */
export function EstadoPagoFlow({ pedidoId, pagado, mensajeInicial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(mensajeInicial ?? null);

  const verificar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pedidos/${pedidoId}/verificar-pago`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo verificar el pago");

      setMensaje(data.mensaje);
      if (data.pagado) {
        toast.success("Pago confirmado por Flow 🎉");
        router.refresh();
      } else {
        toast.warning(data.mensaje);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo verificar el pago");
    } finally {
      setLoading(false);
    }
  };

  if (pagado) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-kawaii border-2 border-green-200 bg-green-50 p-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
        <p className="text-sm font-semibold text-green-800">
          Pago confirmado por Flow. Puedes preparar el pedido.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-kawaii border-2 border-red-300 bg-red-50 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
        <div className="flex-1">
          <p className="font-display text-lg font-bold text-red-800">
            ⚠️ PAGO NO CONFIRMADO — no prepares este pedido
          </p>
          <p className="mt-1 text-sm text-red-700">
            {mensaje ?? "El cliente eligió pagar con Flow, pero Flow todavía no confirma el pago."}
          </p>
          <button
            type="button"
            onClick={verificar}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 font-bold text-white shadow-kawaii transition-all hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <RefreshCw className={"h-4 w-4" + (loading ? " animate-spin" : "")} />
            {loading ? "Consultando a Flow..." : "Verificar pago con Flow"}
          </button>
        </div>
      </div>
    </div>
  );
}
