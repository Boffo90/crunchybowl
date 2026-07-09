"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/routes";
import { useCart } from "@/lib/store/cart";
import { formatCLP, PRODUCTO_LABELS } from "@/lib/utils";
import type { Opcion, Producto } from "@/types";

type ProductConfiguratorProps = {
  producto: Producto;
  opciones: Opcion[];
};

type SelectionState = Record<string, string | string[]>;

function groupOptions(opciones: Opcion[]) {
  return opciones.reduce<Record<string, Opcion[]>>((acc, opcion) => {
    const group = opcion.grupo || "general";
    acc[group] = [...(acc[group] ?? []), opcion];
    return acc;
  }, {});
}

export function ProductConfigurator({ producto, opciones }: ProductConfiguratorProps) {
  const router = useRouter();
  const addItem = useCart((state) => state.addItem);
  const [selected, setSelected] = useState<SelectionState>({});

  const grouped = useMemo(() => groupOptions(opciones), [opciones]);
  const basePrice = producto.precio_base;
  const extra = opciones.reduce((sum, opcion) => {
    const value = selected[opcion.grupo];
    if (Array.isArray(value)) {
      return sum + (value.includes(opcion.nombre) ? opcion.precio_extra : 0);
    }
    return sum + (value === opcion.nombre ? opcion.precio_extra : 0);
  }, 0);

  const isSeleccionado = (grupo: string) => {
    const value = selected[grupo];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  };

  // Grupos obligatorios (proteina, arroz): al menos una seleccion.
  const gruposFaltantes = useMemo(
    () =>
      Object.entries(grouped)
        .filter(([grupo, items]) => items.some((i) => i.requerido) && !isSeleccionado(grupo))
        .map(([grupo]) => grupo),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grouped, selected]
  );

  const puedeAgregar = gruposFaltantes.length === 0;

  const toggleOption = (grupo: string, nombre: string, maxSeleccion: number) => {
    setSelected((prev) => {
      const current = prev[grupo];
      const isMultiSelect = maxSeleccion > 1;

      if (isMultiSelect) {
        const currentArray = Array.isArray(current) ? current : [];
        const already = currentArray.includes(nombre);

        if (already) {
          return { ...prev, [grupo]: currentArray.filter((item) => item !== nombre) };
        }

        if (currentArray.length >= maxSeleccion) {
          return prev;
        }

        return { ...prev, [grupo]: [...currentArray, nombre] };
      }

      return { ...prev, [grupo]: current === nombre ? "" : nombre };
    });
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
      precio_unitario: basePrice + extra,
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
        <div className="mb-8 text-3xl font-bold text-crunchy-accent">{formatCLP(basePrice + extra)}</div>

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
        {!puedeAgregar && (
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

              return (
                <div key={grupo} className="rounded-2xl border border-crunchy-pink-soft/60 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-semibold capitalize text-crunchy-dark">
                      {grupo}
                      {requerido && <span className="ml-1 text-crunchy-accent">*</span>}
                    </h3>
                    <span className="text-xs font-medium uppercase tracking-wide text-crunchy-muted">
                      {multi ? `Elige hasta ${maxSeleccion}` : "Elige una"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {items.map((opcion) => {
                      const checked = Array.isArray(currentValue)
                        ? currentValue.includes(opcion.nombre)
                        : currentValue === opcion.nombre;

                      return (
                        <label key={opcion.id} className="flex cursor-pointer items-center justify-between rounded-xl border border-crunchy-pink-soft/50 px-3 py-2 text-sm">
                          <span className="flex items-center gap-2">
                            <input
                              type={multi ? "checkbox" : "radio"}
                              name={grupo}
                              checked={checked}
                              onChange={() => toggleOption(grupo, opcion.nombre, maxSeleccion)}
                              className="h-4 w-4 accent-crunchy-accent"
                            />
                            <span className="text-crunchy-dark">{opcion.nombre}</span>
                          </span>
                          {opcion.precio_extra > 0 ? (
                            <span className="text-sm font-semibold text-crunchy-accent">
                              +{formatCLP(opcion.precio_extra)}
                            </span>
                          ) : null}
                        </label>
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
