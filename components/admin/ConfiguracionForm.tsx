"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DIA_LABEL, minutosAHora, type HorariosConfig } from "@/lib/horarios";
import { GRUPOS_TOPPINGS_CRUNCHY_DATE, TOPPING_CON_PRECIO_PROPIO } from "@/lib/extras";
import { AVISOS_SUGERIDOS, AVISO_TEXTO_MAX, type AvisoConfig } from "@/lib/aviso";
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
  avisoInicial: AvisoConfig;
};

export function ConfiguracionForm({
  metaInicial,
  horariosIniciales,
  descuentoInicial,
  toppingsInicial,
  avisoInicial,
}: Props) {
  const router = useRouter();
  const [meta, setMeta] = useState(metaInicial);
  const [aviso, setAviso] = useState(avisoInicial);
  const [loadingAviso, setLoadingAviso] = useState(false);
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

  /** Guarda el aviso. El interruptor manda solo, sin apretar "Guardar". */
  const guardarAviso = async (siguiente: AvisoConfig) => {
    if (siguiente.activo && !siguiente.texto.trim()) {
      toast.error("Escribe el texto del aviso antes de encenderlo");
      return;
    }
    const previo = aviso;
    setAviso(siguiente);
    setLoadingAviso(true);
    try {
      await patch({ aviso: { ...siguiente, texto: siguiente.texto.trim() } });
      toast.success(siguiente.activo ? "Aviso encendido en el sitio" : "Aviso apagado");
      router.refresh();
    } catch (err) {
      setAviso(previo);
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoadingAviso(false);
    }
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
      // El Crunchy Date son 2 bibimbap, cada uno con su propio grupo de
      // toppings: las mismas reglas del bibimbap suelto, aplicadas por bowl.
      await patch({
        extras_grupos: {
          bibimbap: { toppings: reglas },
          "crunchy-date": Object.fromEntries(
            GRUPOS_TOPPINGS_CRUNCHY_DATE.map((grupo) => [grupo, reglas])
          ),
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
      <section className="h-fit space-y-4 rounded-kawaii bg-white p-6 shadow-kawaii md:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-crunchy-dark">Aviso en el sitio</h2>
            <p className="text-sm text-crunchy-muted">
              Una franja arriba de todas las páginas. Úsala para avisar que hoy no hay delivery,
              que se acabó un plato o que cierran antes.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={aviso.activo}
            disabled={loadingAviso}
            onClick={() => guardarAviso({ ...aviso, activo: !aviso.activo })}
            className={
              "relative h-9 w-16 shrink-0 rounded-full transition-colors disabled:opacity-50 " +
              (aviso.activo ? "bg-green-600" : "bg-crunchy-pink-soft")
            }
          >
            <span
              className={
                "absolute top-1 h-7 w-7 rounded-full bg-white shadow-kawaii transition-all " +
                (aviso.activo ? "left-8" : "left-1")
              }
            />
          </button>
        </div>

        <p className={"text-sm font-bold " + (aviso.activo ? "text-green-700" : "text-crunchy-muted")}>
          {aviso.activo ? "Encendido: los clientes lo están viendo ahora" : "Apagado: no se muestra nada"}
        </p>

        <div className="flex flex-wrap gap-2">
          {AVISOS_SUGERIDOS.map((s) => (
            <button
              key={s.etiqueta}
              type="button"
              disabled={loadingAviso}
              onClick={() => guardarAviso({ activo: true, texto: s.texto, tono: s.tono })}
              className="rounded-full border-2 border-crunchy-pink-soft bg-white px-4 py-2 text-sm font-semibold text-crunchy-dark transition-colors hover:bg-crunchy-pink-soft disabled:opacity-50"
            >
              {s.etiqueta}
            </button>
          ))}
        </div>

        <Input
          label="Texto del aviso"
          value={aviso.texto}
          maxLength={AVISO_TEXTO_MAX}
          placeholder="Hoy no tenemos delivery: solo retiro en el local"
          onChange={(e) => setAviso((a) => ({ ...a, texto: e.target.value }))}
        />

        <div>
          <span className="mb-2 block text-sm font-semibold text-crunchy-dark">Color de la franja</span>
          <div className="flex gap-2">
            {([
              { valor: "info", etiqueta: "Normal (oscuro)" },
              { valor: "alerta", etiqueta: "Ojo (naranjo)" },
            ] as const).map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => setAviso((a) => ({ ...a, tono: t.valor }))}
                className={
                  "rounded-full px-4 py-2 text-sm font-semibold transition-all " +
                  (aviso.tono === t.valor
                    ? "bg-crunchy-accent text-white shadow-kawaii"
                    : "border-2 border-crunchy-pink-soft bg-white text-crunchy-dark hover:bg-crunchy-pink-soft")
                }
              >
                {t.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-crunchy-pink-soft p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-crunchy-muted">
            Así se ve en el sitio
          </p>
          <div
            className={
              "rounded-xl px-4 py-2 text-center text-sm font-bold " +
              (aviso.tono === "alerta" ? "bg-orange-500 text-white" : "bg-crunchy-dark text-white")
            }
          >
            {aviso.texto || "(escribe el texto del aviso)"}
          </div>
        </div>

        <Button
          type="button"
          loading={loadingAviso}
          onClick={() => guardarAviso({ ...aviso, activo: true })}
        >
          Guardar y encender
        </Button>
      </section>

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
          Se aplica al Bibimbap y a cada uno de los dos bowls del Crunchy Date.
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
