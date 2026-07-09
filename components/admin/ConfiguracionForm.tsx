"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DIA_LABEL, minutosAHora, type HorariosConfig } from "@/lib/horarios";

const ORDEN_DIAS: (keyof HorariosConfig)[] = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

function horaAMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

type Props = { metaInicial: number; horariosIniciales: HorariosConfig };

export function ConfiguracionForm({ metaInicial, horariosIniciales }: Props) {
  const router = useRouter();
  const [meta, setMeta] = useState(metaInicial);
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
