"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/store/cart";
import { formatCLP } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";

export default function CarritoPage() {
  const [mounted, setMounted] = useState(false);
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateCantidad = useCart((s) => s.updateCantidad);
  const subtotal = useCart((s) => s.getSubtotal());

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="mb-4 font-display text-4xl font-bold text-crunchy-dark">Tu carrito está vacío</h1>
        <p className="mb-8 text-crunchy-muted">Explora nuestra carta y arma tu pedido</p>
        <Link href={ROUTES.CARTA}>
          <Button size="lg">Ver carta</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 font-display text-4xl font-bold text-crunchy-dark">Tu carrito</h1>

      <div className="mb-6 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-kawaii bg-white p-5 shadow-kawaii">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold text-crunchy-dark">{item.nombre}</h3>
                {Object.entries(item.opciones).map(([grupo, val]) => (
                  <p key={grupo} className="text-sm text-crunchy-muted">
                    <span className="capitalize">{grupo}:</span>{" "}
                    {Array.isArray(val) ? val.join(", ") : val}
                  </p>
                ))}
                {item.notas && (
                  <p className="mt-1 text-sm italic text-crunchy-muted">Notas: {item.notas}</p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-crunchy-pink-soft p-1">
                  <button
                    type="button"
                    onClick={() => updateCantidad(item.id, item.cantidad - 1)}
                    className="rounded-full bg-white p-1.5 hover:bg-crunchy-pink"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="min-w-[1.5rem] text-center font-bold text-crunchy-dark">{item.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => updateCantidad(item.id, item.cantidad + 1)}
                    className="rounded-full bg-white p-1.5 hover:bg-crunchy-pink"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-bold text-crunchy-accent">{formatCLP(item.subtotal)}</p>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded-full p-2 text-red-400 hover:bg-red-50"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-kawaii bg-crunchy-pink-soft p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-semibold text-crunchy-dark">Subtotal</span>
          <span className="text-2xl font-bold text-crunchy-accent">{formatCLP(subtotal)}</span>
        </div>
        <p className="mb-4 text-sm text-crunchy-muted">
          El costo de delivery se calcula en el checkout según tu dirección.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={ROUTES.CARTA} className="flex-1">
            <Button variant="secondary" size="lg" className="w-full">Seguir comprando</Button>
          </Link>
          <Link href={ROUTES.CHECKOUT} className="flex-1">
            <Button size="lg" className="w-full">Ir al checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
