"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DIA_LABEL, minutosAHora, type HorariosConfig } from "@/lib/horarios";
import { TOPPING_CON_PRECIO_PROPIO } from "@/lib/extras";
import { formatCLP } from "@/lib/utils";

const ORDEN_DIAS: (keyof HorariosConfig)[] = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

function horaAMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

type Props = {
  metaInicial: number;
  horariosIniciales: HorariosConfig;
  descuentoInicial: { activo: boolean; porcentaje: number; motivo: string };
  toppingsInicial: { incluidos: number; precio: number; precioHuevo: number };
};

export function ConfiguracionForm({ metaInicial, horariosIniciales, descuentoInicial, toppingsInicial }: Props) {
  const router = useRouter();
  const [meta, setMeta] = useState(metaInicial);
  const [descuento, setDescuento] = useState(descuentoInicial);
  const [loadingDescuento, setLoadingDescuento] = useState(false);
  const [toppings, setToppings] = useState(toppingsInicial);
  const [loadingToppings, setLoadingToppings] = useState(false);
  const [horarios, setHorarios] = useState<Record<keyof HorariosConfig, { abre: string; cierra: string }>>(
    () =>
      Object.fromEntries(
        ORDEN_DIAS.map((d) => [d, { abre: minutosAHora(horariosIniciales[d][0]), cierra: minutosAHora(horariosIniciales[d][1]) }])
      ) as Record<keyof HorariosConfig, { abre: string; cierra: string }>
  );
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  const patch = async (body: object) => {
    const res = await fetch("/api/admin/configuracion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al guardar");
  };

  const guardarMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingMeta(true);
    try {
      await patch({ sellos_meta: meta });
      toast.success("Meta de sellos guardada");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoadingMeta(false);
    }
  };

  const guardarDescuento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (descuento.activo && (descuento.porcentaje < 1 || descuento.porcentaje > 99)) {
      toast.error("El porcentaje debe estar entre 1 y 99");
      return;
    }
    setLoadingDescuento(true);
    try {
      await patch({ descuento });
      toast.success(descuento.activo ? `Descuento del ${descuento.porcentaje}% activado` : "Descuento desactivado");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoadingDescuento(false);
    }
  };

  const guardarToppings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingToppings(true);
    try {
      const reglas = {
        incluidos: toppings.incluidos,
        precio: toppings.precio,
        precios: { [TOPPING_CON_PRECIO_PROPIO]: toppings.precioHuevo },
      };
      // El Crunchy Date son 2 bibimbap: mismos precios, el doble de incluidos.
      await patch({
        extras_grupos: {
          bibimbap: { toppings: reglas },
          "crunchy-date": { toppings: { ...reglas, incluidos: toppings.incluidos * 2 } },
        },
      });
      toast.success(
        toppings.precio > 0
          ? `${toppings.incluidos} toppings incluidos, ${formatCLP(toppings.precio)} c/u adicional`
          : "Toppings adicionales desactivados"
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoadingToppings(false);
    }
  };

  const guardarHorarios = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const d of ORDEN_DIAS) {
      if (horaAMinutos(horarios[d].abre) >= horaAMinutos(horarios[d].cierra)) {
        toast.error(`${DIA_LABEL[d]}: la apertura debe ser antes del cierre`);
        return;
      }
    }
    setLoadingHorarios(true);
    try {
      const payload = Object.fromEntries(
        ORDEN_DIAS.map((d) => [d, [horaAMinutos(horarios[d].abre), horaAMinutos(horarios[d].cierra)]])
      );
      await patch({ horarios: payload });
      toast.success("Horarios guardados");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoadingHorarios(false);
    }
  };

  return (
    <div className="grid max-w-3xl gap-8 md:grid-cols-2">
      <form onSubmit={guardarMeta} className="h-fit space-y-4 rounded-kawaii bg-white p-6 shadow-kawaii">
        <h2 className="font-display text-xl font-bold text-crunchy-dark">Fidelidad</h2>
        <Input
          label="Sellos para plato gratis"
          type="number"
          min={1}
          max={100}
          value={meta}
          onChange={(e) => setMeta(Number(e.target.value))}
          required
        />
        <p className="text-sm text-crunchy-muted">
          Cuantos pedidos confirmados necesita un cliente para ganar un plato gratis.
        </p>
        <Button type="submit" loading={loadingMeta}>Guardar</Button>
      </form>

      <form onSubmit={guardarDescuento} className="h-fit space-y-4 rounded-kawaii bg-white p-6 shadow-kawaii">
        <h2 className="font-display text-xl font-bold text-crunchy-dark">Descuento en toda la carta</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={descuento.activo}
            onChange={(e) => setDescuento((d) => ({ ...d, activo: e.target.checked }))}
            className="h-5 w-5 accent-crunchy-accent"
          />
          <span className="font-semibold text-crunchy-dark">Descuento activo</span>
        </label>
        <Input
          label="Porcentaje de descuento (%)"
          type="number"
          min={1}
          max={99}
          value={descuento.porcentaje}
          onChange={(e) => setDescuento((d) => ({ ...d, porcentaje: Number(e.target.value) }))}
          required
        />
        <Input
          label="Texto del banner"
          value={descuento.motivo}
          onChange={(e) => setDescuento((d) => ({ ...d, motivo: e.target.value }))}
          placeholder="Promo inauguración"
          maxLength={80}
        />
        <p className="text-sm text-crunchy-muted">
          Al activarlo aparece un banner en el sitio y el descuento se aplica automaticamente al subtotal de cada pedido.
        </p>
        <Button type="submit" loading={loadingDescuento}>Guardar descuento</Button>
      </form>

      <form onSubmit={guardarToppings} className="h-fit space-y-4 rounded-kawaii bg-white p-6 shadow-kawaii">
        <h2 className="font-display text-xl font-bold text-crunchy-dark">Toppings del Bibimbap</h2>
        <Input
          label="Toppings incluidos (sin costo)"
          type="number"
          min={0}
          max={50}
          value={toppings.incluidos}
          onChange={(e) => setToppings((t) => ({ ...t, incluidos: Number(e.target.value) }))}
          required
        />
        <Input
          label="Precio por topping adicional (CLP)"
          type="number"
          min={0}
          max={100000}
          step={100}
          value={toppings.precio}
          onChange={(e) => setToppings((t) => ({ ...t, precio: Number(e.target.value) }))}
          required
        />
        <Input
          label={`Precio del ${TOPPING_CON_PRECIO_PROPIO} adicional (CLP)`}
          type="number"
          min={0}
          max={100000}
          step={100}
          value={toppings.precioHuevo}
          onChange={(e) => setToppings((t) => ({ ...t, precioHuevo: Number(e.target.value) }))}
          required
        />
        <p className="text-sm text-crunchy-muted">
          El cliente puede elegir más toppings de los incluidos —incluso repetir el mismo— y se le
          cobra este monto por cada uno. El {TOPPING_CON_PRECIO_PROPIO.toLowerCase()} tiene su propio
          precio. Si mezcla toppings de distinto valor, los incluidos son los más baratos.
          Con precio en 0 se vuelve al tope fijo de {toppings.incluidos} sin poder agregar más.
          Se aplica al Bibimbap y al Crunchy Date (que lleva el doble de incluidos).
        </p>
        <Button type="submit" loading={loadingToppings}>Guardar toppings</Button>
      </form>

      <form onSubmit={guardarHorarios} className="space-y-4 rounded-kawaii bg-white p-6 shadow-kawaii">
        <h2 className="font-display text-xl font-bold text-crunchy-dark">Horario de atención</h2>
        <div className="space-y-2">
          {ORDEN_DIAS.map((d) => (
            <div key={d} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-sm font-semibold text-crunchy-dark">{DIA_LABEL[d]}</span>
              <input
                type="time"
                value={horarios[d].abre}
                onChange={(e) => setHorarios((h) => ({ ...h, [d]: { ...h[d], abre: e.target.value } }))}
                className="w-full rounded-xl border-2 border-crunchy-pink-soft bg-white px-2 py-1.5 text-sm outline-none focus:border-crunchy-accent"
                required
              />
              <span className="text-xs text-crunchy-muted">a</span>
              <input
                type="time"
                value={horarios[d].cierra}
                onChange={(e) => setHorarios((h) => ({ ...h, [d]: { ...h[d], cierra: e.target.value } }))}
                className="w-full rounded-xl border-2 border-crunchy-pink-soft bg-white px-2 py-1.5 text-sm outline-none focus:border-crunchy-accent"
                required
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-crunchy-muted">
          Fuera de este horario los pedidos quedan como reserva. Los cambios se reflejan en el sitio en ~1 minuto.
        </p>
        <Button type="submit" loading={loadingHorarios}>Guardar horarios</Button>
      </form>
    </div>
  );
}
