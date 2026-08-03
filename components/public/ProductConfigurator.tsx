"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/routes";
import { useCart } from "@/lib/store/cart";
import { cn, formatCLP, PRODUCTO_LABELS } from "@/lib/utils";
import { iconoOpcion } from "@/lib/opciones-iconos";
import { cantidadDe, listaSeleccion } from "@/lib/opciones";
import { dentroDeVentana, formatoVentana, type VentanaProducto } from "@/lib/horarios";
import { calcularRecargoGrupo, precioOpcion, topeSeleccionGrupo, type ExtraGrupo } from "@/lib/extras";
import type { Opcion, Producto } from "@/types";

type ProductConfiguratorProps = {
  producto: Producto;
  opciones: Opcion[];
  ventanaHoraria?: VentanaProducto | null;
  // Grupos que admiten mas opciones que las incluidas, cobrando un extra por
  // cada adicional (ej: toppings del bibimbap). Vacio = tope duro, como antes.
  extras?: Record<string, ExtraGrupo>;
};

type SelectionState = Record<string, string | string[]>;

function groupOptions(opciones: Opcion[]) {
  return opciones.reduce<Record<string, Opcion[]>>((acc, opcion) => {
    const group = opcion.grupo || "general";
    acc[group] = [...(acc[group] ?? []), opcion];
    return acc;
  }, {});
}

export function ProductConfigurator({ producto, opciones, ventanaHoraria, extras = {} }: ProductConfiguratorProps) {
  const router = useRouter();
  const addItem = useCart((state) => state.addItem);
  const [selected, setSelected] = useState<SelectionState>({});
  // null = sin restriccion. Se evalua al montar para evitar desfase SSR/cliente.
  const [enVentana, setEnVentana] = useState(true);

  useEffect(() => {
    if (ventanaHoraria) setEnVentana(dentroDeVentana(ventanaHoraria));
  }, [ventanaHoraria]);

  const grouped = useMemo(() => groupOptions(opciones), [opciones]);
  const basePrice = producto.precio_base;

  // Cada repeticion suma: 2 huevos con precio_extra propio se cobran 2 veces.
  const extra = useMemo(
    () =>
      Object.entries(selected).reduce((sum, [grupo, valor]) => {
        const opcionesGrupo = grouped[grupo] ?? [];
        return (
          sum +
          listaSeleccion(valor).reduce((acc, nombre) => {
            const opcion = opcionesGrupo.find((o) => o.nombre === nombre);
            return acc + (opcion?.precio_extra ?? 0);
          }, 0)
        );
      }, 0),
    [grouped, selected]
  );

  // Recargo por elegir mas opciones que las incluidas (ej: del 5to topping).
  const recargoExtras = useMemo(
    () =>
      Object.entries(extras).reduce(
        (sum, [grupo, reglas]) => sum + calcularRecargoGrupo(listaSeleccion(selected[grupo]), reglas),
        0
      ),
    [extras, selected]
  );

  const precioFinal = basePrice + extra + recargoExtras;

  const isSeleccionado = (grupo: string) => listaSeleccion(selected[grupo]).length > 0;

  // Grupos obligatorios (proteina, arroz): al menos una seleccion.
  const gruposFaltantes = useMemo(
    () =>
      Object.entries(grouped)
        .filter(([grupo, items]) => items.some((i) => i.requerido) && !isSeleccionado(grupo))
        .map(([grupo]) => grupo),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grouped, selected]
  );

  const puedeAgregar = gruposFaltantes.length === 0 && enVentana;

  /** Suma una unidad de la opcion mientras quede cupo en el grupo. */
  const sumarOpcion = (grupo: string, nombre: string, topeSeleccion: number) => {
    setSelected((prev) => {
      const actual = listaSeleccion(prev[grupo]);
      if (actual.length >= topeSeleccion) return prev;
      return { ...prev, [grupo]: [...actual, nombre] };
    });
  };

  /** Quita una unidad de la opcion (las demas repeticiones se mantienen). */
  const restarOpcion = (grupo: string, nombre: string) => {
    setSelected((prev) => {
      const actual = listaSeleccion(prev[grupo]);
      const indice = actual.lastIndexOf(nombre);
      if (indice === -1) return prev;
      const copia = [...actual];
      copia.splice(indice, 1);
      return { ...prev, [grupo]: copia };
    });
  };

  const elegirUnica = (grupo: string, nombre: string) => {
    setSelected((prev) => ({ ...prev, [grupo]: prev[grupo] === nombre ? "" : nombre }));
  };

  const handleAddToCart = () => {
    if (!puedeAgregar) return;

    const normalized: Record<string, string | string[]> = {};
    Object.entries(selected).forEach(([grupo, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        normalized[grupo] = value;
      } else if (typeof value === "string" && value) {
        normalized[grupo] = value;
      }
    });

    addItem({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio_unitario: precioFinal,
      cantidad: 1,
      opciones: normalized,
    });

    toast.success(`${producto.nombre} agregado al carrito 🍜`, {
      description: "¿Quieres ir a pagar o seguir mirando la carta?",
      duration: 6000,
      action: {
        label: "Ir al checkout",
        onClick: () => router.push(ROUTES.CHECKOUT),
      },
      cancel: {
        label: "Seguir comprando",
        onClick: () => router.push(ROUTES.CARTA),
      },
    });
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:flex-row">
      <div className="flex-1">
        <div className="relative mb-6 aspect-square max-w-md overflow-hidden rounded-kawaii bg-gradient-to-br from-crunchy-pink-soft to-crunchy-cream shadow-kawaii">
          {producto.imagen_url ? (
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              fill
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl font-bold text-crunchy-accent">
              {PRODUCTO_LABELS[producto.tipo] ?? "MENU"}
            </div>
          )}
        </div>

        <div className="mb-6 inline-flex rounded-full bg-crunchy-pink-soft px-4 py-1 text-sm font-semibold text-crunchy-accent">
          {producto.tipo === "pollo" ? "Pollo" : producto.tipo}
        </div>
        <h1 className="mb-4 font-display text-4xl font-bold text-crunchy-dark">{producto.nombre}</h1>
        <p className="mb-6 text-lg text-crunchy-muted">{producto.descripcion ?? "Disfruta este delicioso plato."}</p>
        <div className="mb-8">
          <span className="text-3xl font-bold text-crunchy-accent">{formatCLP(precioFinal)}</span>
          {recargoExtras > 0 && (
            <span className="ml-2 text-sm font-semibold text-crunchy-muted">
              incluye {formatCLP(recargoExtras)} en adicionales
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={handleAddToCart} disabled={!puedeAgregar}>
            Agregar al carrito
          </Button>
          <Link href={ROUTES.CARTA}>
            <Button size="lg" variant="secondary">
              Volver a la carta
            </Button>
          </Link>
        </div>
        {!enVentana && ventanaHoraria && (
          <p className="mt-3 text-sm font-semibold text-orange-600">
            ⏰ Disponible solo de {formatoVentana(ventanaHoraria)} hrs.
          </p>
        )}
        {enVentana && gruposFaltantes.length > 0 && (
          <p className="mt-3 text-sm font-medium text-crunchy-accent">
            Para continuar, elige: {gruposFaltantes.join(", ")}.
          </p>
        )}
      </div>

      <div className="w-full max-w-md rounded-kawaii border border-crunchy-pink-soft bg-white p-6 shadow-kawaii">
        <h2 className="mb-4 text-xl font-semibold text-crunchy-dark">Personaliza tu pedido</h2>

        {opciones.length === 0 ? (
          <p className="text-sm text-crunchy-muted">Este producto no tiene opciones adicionales disponibles.</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([grupo, items]) => {
              const maxSeleccion = Math.max(...items.map((item) => item.max_seleccion || 1), 1);
              const multi = maxSeleccion > 1;
              const requerido = items.some((item) => item.requerido);
              const currentValue = selected[grupo];

              const reglasExtra = extras[grupo] ?? null;
              const incluidos = reglasExtra ? reglasExtra.incluidos : maxSeleccion;
              // Misma cuenta que el servidor, para no dejar armar un plato que
              // despues sea rechazado al confirmar el pedido.
              const topeSeleccion = topeSeleccionGrupo(reglasExtra, items.length, maxSeleccion);
              const elegidas = listaSeleccion(currentValue);
              const seleccionadas = elegidas.length;
              const adicionales = Math.max(0, seleccionadas - incluidos);
              const recargoGrupo = calcularRecargoGrupo(elegidas, reglasExtra);
              const sinCupo = seleccionadas >= topeSeleccion;

              return (
                <div key={grupo} className="rounded-2xl border border-crunchy-pink-soft/60 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-semibold capitalize text-crunchy-dark">
                      {grupo}
                      {requerido && <span className="ml-1 text-crunchy-accent">*</span>}
                    </h3>
                    <span className="text-xs font-medium uppercase tracking-wide text-crunchy-muted">
                      {reglasExtra
                        ? `${incluidos} incluidos · +${formatCLP(reglasExtra.precio)} c/u`
                        : multi
                          ? `Elige hasta ${maxSeleccion}`
                          : "Elige una"}
                    </span>
                  </div>

                  {reglasExtra && (
                    <p className="mb-3 text-xs">
                      {adicionales > 0 ? (
                        <span className="font-semibold text-crunchy-accent">
                          {seleccionadas} elegidos: {incluidos} incluidos + {adicionales} adicional
                          {adicionales > 1 ? "es" : ""} = +{formatCLP(recargoGrupo)}
                        </span>
                      ) : (
                        <span className="text-crunchy-muted">
                          Llevas {seleccionadas} de {incluidos} incluidos. Puedes repetir el mismo y
                          agregar más por {formatCLP(reglasExtra.precio)} c/u.
                        </span>
                      )}
                    </p>
                  )}

                  {multi && !reglasExtra && seleccionadas > 0 && (
                    <p className="mb-3 text-xs text-crunchy-muted">
                      Llevas {seleccionadas} de {maxSeleccion}. Puedes elegir la misma opción más de una vez.
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {items.map((opcion) => {
                      const cantidad = multi
                        ? cantidadDe(currentValue, opcion.nombre)
                        : currentValue === opcion.nombre
                          ? 1
                          : 0;
                      const marcada = cantidad > 0;
                      // Cuanto costaria esta opcion si entra como adicional.
                      const precioAdicional = reglasExtra ? precioOpcion(reglasExtra, opcion.nombre) : 0;

                      return (
                        <div
                          key={opcion.id}
                          className={cn(
                            "relative flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition-all",
                            marcada
                              ? "border-crunchy-accent bg-crunchy-pink-soft shadow-kawaii"
                              : "border-crunchy-pink-soft/60 bg-white hover:border-crunchy-pink"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              multi
                                ? sumarOpcion(grupo, opcion.nombre, topeSeleccion)
                                : elegirUnica(grupo, opcion.nombre)
                            }
                            disabled={multi && sinCupo}
                            aria-label={
                              multi ? `Agregar ${opcion.nombre}` : `Elegir ${opcion.nombre}`
                            }
                            className="flex w-full cursor-pointer flex-col items-center gap-1 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                          >
                            <span className="text-3xl" aria-hidden>{iconoOpcion(opcion.nombre)}</span>
                            <span className={cn("text-xs font-semibold leading-tight", marcada ? "text-crunchy-accent" : "text-crunchy-dark")}>
                              {opcion.nombre}
                            </span>
                            {opcion.precio_extra > 0 && (
                              <span className="text-[11px] font-semibold text-crunchy-accent">
                                +{formatCLP(opcion.precio_extra)}
                              </span>
                            )}
                            {reglasExtra && precioAdicional !== reglasExtra.precio && (
                              <span className="text-[11px] font-semibold text-crunchy-accent">
                                adicional +{formatCLP(precioAdicional)}
                              </span>
                            )}
                          </button>

                          {multi && marcada && (
                            <div className="mt-1 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => restarOpcion(grupo, opcion.nombre)}
                                aria-label={`Quitar ${opcion.nombre}`}
                                className="rounded-full bg-white p-1 text-crunchy-accent shadow-kawaii transition-transform hover:scale-110"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="min-w-[1.25rem] text-sm font-bold text-crunchy-accent">
                                {cantidad}
                              </span>
                              <button
                                type="button"
                                onClick={() => sumarOpcion(grupo, opcion.nombre, topeSeleccion)}
                                disabled={sinCupo}
                                aria-label={`Agregar otro ${opcion.nombre}`}
                                className="rounded-full bg-white p-1 text-crunchy-accent shadow-kawaii transition-transform hover:scale-110 disabled:opacity-40 disabled:hover:scale-100"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
