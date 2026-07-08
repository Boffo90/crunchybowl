"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle, Bike, Home, Wallet, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/lib/store/cart";
import { formatCLP } from "@/lib/utils";
import { estaAbiertoAhora, proximaApertura } from "@/lib/horarios";
import { ZONAS_DELIVERY, getZona } from "@/lib/zonas";
import { ROUTES } from "@/lib/routes";

type Props = { userId: string; nombreInicial: string; telefonoInicial: string };

export function CheckoutForm({ userId, nombreInicial, telefonoInicial }: Props) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [abierto, setAbierto] = useState(true);
  const [proxima, setProxima] = useState("");

  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.getSubtotal());
  const clearCart = useCart((s) => s.clear);

  const [form, setForm] = useState({
    nombre: nombreInicial,
    telefono: telefonoInicial,
    tipo_entrega: "retiro" as "retiro" | "delivery",
    zona_id: "centro",
    direccion: "",
    referencia: "",
    metodo_pago: "flow" as "flow" | "efectivo",
    notas_generales: "",
  });

  useEffect(() => {
    setMounted(true);
    setAbierto(estaAbiertoAhora());
    setProxima(proximaApertura());
  }, []);

  const costoDelivery = useMemo(() => {
    if (form.tipo_entrega === "retiro") return 0;
    return getZona(form.zona_id)?.tarifa ?? 0;
  }, [form.tipo_entrega, form.zona_id]);

  const total = subtotal + costoDelivery;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abierto) {
      toast.error("Estamos cerrados. Abrimos " + proxima);
      return;
    }
    if (items.length === 0) {
      toast.error("Tu carrito esta vacio");
      return;
    }
    if (form.tipo_entrega === "delivery" && !form.direccion.trim()) {
      toast.error("Ingresa tu direccion de entrega");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pedidos/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          nombre: form.nombre,
          telefono: form.telefono,
          tipo_entrega: form.tipo_entrega,
          direccion: form.tipo_entrega === "delivery"
            ? form.direccion + (form.referencia ? " (" + form.referencia + ")" : "")
            : null,
          zona_id: form.tipo_entrega === "delivery" ? form.zona_id : null,
          costo_delivery: costoDelivery,
          subtotal,
          total,
          metodo_pago: form.metodo_pago,
          notas_generales: form.notas_generales || null,
          items: items.map((i) => ({
            producto_id: i.producto_id,
            nombre_producto: i.nombre,
            precio_unitario: i.precio_unitario,
            cantidad: i.cantidad,
            opciones_seleccionadas: i.opciones,
            notas: i.notas,
            subtotal: i.subtotal,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear el pedido");
      clearCart();
      toast.success("Pedido creado");
      window.location.href = ROUTES.PEDIDO(data.pedido_id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear el pedido";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="mb-4 font-display text-3xl font-bold text-crunchy-dark">Tu carrito esta vacio</h1>
        <Link href={ROUTES.CARTA}>
          <Button size="lg">Ver carta</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 font-display text-4xl font-bold text-crunchy-dark">Checkout</h1>

      {!abierto && (
        <div className="mb-6 flex items-start gap-3 rounded-kawaii border-2 border-orange-300 bg-orange-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
          <div>
            <p className="font-semibold text-orange-800">Estamos cerrados en este momento</p>
            <p className="text-sm text-orange-700">Abrimos {proxima}. No puedes confirmar el pedido ahora.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <section className="rounded-kawaii bg-white p-6 shadow-kawaii">
            <h2 className="mb-4 font-display text-xl font-bold text-crunchy-dark">Tus datos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
              <Input label="Telefono" name="telefono" type="tel" value={form.telefono} onChange={handleChange} required />
            </div>
          </section>

          <section className="rounded-kawaii bg-white p-6 shadow-kawaii">
            <h2 className="mb-4 font-display text-xl font-bold text-crunchy-dark">Entrega</h2>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className={
                "cursor-pointer rounded-2xl border-2 p-4 transition-all " +
                (form.tipo_entrega === "retiro"
                  ? "border-crunchy-accent bg-crunchy-pink-soft"
                  : "border-crunchy-pink-soft bg-white hover:border-crunchy-pink")
              }>
                <input type="radio" name="tipo_entrega" value="retiro" checked={form.tipo_entrega === "retiro"} onChange={handleChange} className="sr-only" />
                <div className="flex items-center gap-3">
                  <Home className="h-6 w-6 text-crunchy-accent" />
                  <div>
                    <p className="font-semibold text-crunchy-dark">Retiro en local</p>
                    <p className="text-xs text-crunchy-muted">Calle Cuatro 905, Pucon</p>
                  </div>
                </div>
              </label>

              <label className={
                "cursor-pointer rounded-2xl border-2 p-4 transition-all " +
                (form.tipo_entrega === "delivery"
                  ? "border-crunchy-accent bg-crunchy-pink-soft"
                  : "border-crunchy-pink-soft bg-white hover:border-crunchy-pink")
              }>
                <input type="radio" name="tipo_entrega" value="delivery" checked={form.tipo_entrega === "delivery"} onChange={handleChange} className="sr-only" />
                <div className="flex items-center gap-3">
                  <Bike className="h-6 w-6 text-crunchy-accent" />
                  <div>
                    <p className="font-semibold text-crunchy-dark">Delivery</p>
                    <p className="text-xs text-crunchy-muted">Tarifa segun zona</p>
                  </div>
                </div>
              </label>
            </div>

            {form.tipo_entrega === "delivery" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-crunchy-dark">Zona de entrega</label>
                  <select
                    name="zona_id"
                    value={form.zona_id}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-2 border-crunchy-pink-soft bg-white px-4 py-3 outline-none transition-colors focus:border-crunchy-accent"
                  >
                    {ZONAS_DELIVERY.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.nombre} - {formatCLP(z.tarifa)}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Direccion completa"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  placeholder="Calle, numero, depto"
                  required
                />
                <Input
                  label="Referencia (opcional)"
                  name="referencia"
                  value={form.referencia}
                  onChange={handleChange}
                  placeholder="Cerca de..., porton azul..."
                />
              </div>
            )}
          </section>

          <section className="rounded-kawaii bg-white p-6 shadow-kawaii">
            <h2 className="mb-4 font-display text-xl font-bold text-crunchy-dark">Metodo de pago</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={
                "cursor-pointer rounded-2xl border-2 p-4 transition-all " +
                (form.metodo_pago === "flow"
                  ? "border-crunchy-accent bg-crunchy-pink-soft"
                  : "border-crunchy-pink-soft bg-white hover:border-crunchy-pink")
              }>
                <input type="radio" name="metodo_pago" value="flow" checked={form.metodo_pago === "flow"} onChange={handleChange} className="sr-only" />
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-crunchy-accent" />
                  <div>
                    <p className="font-semibold text-crunchy-dark">Flow.cl</p>
                    <p className="text-xs text-crunchy-muted">Debito, credito o transferencia</p>
                  </div>
                </div>
              </label>

              <label className={
                "cursor-pointer rounded-2xl border-2 p-4 transition-all " +
                (form.metodo_pago === "efectivo"
                  ? "border-crunchy-accent bg-crunchy-pink-soft"
                  : "border-crunchy-pink-soft bg-white hover:border-crunchy-pink")
              }>
                <input type="radio" name="metodo_pago" value="efectivo" checked={form.metodo_pago === "efectivo"} onChange={handleChange} className="sr-only" />
                <div className="flex items-center gap-3">
                  <Wallet className="h-6 w-6 text-crunchy-accent" />
                  <div>
                    <p className="font-semibold text-crunchy-dark">Al entregar / retirar</p>
                    <p className="text-xs text-crunchy-muted">Efectivo o transferencia</p>
                  </div>
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-kawaii bg-white p-6 shadow-kawaii">
            <h2 className="mb-4 font-display text-xl font-bold text-crunchy-dark">Notas para el pedido (opcional)</h2>
            <textarea
              name="notas_generales"
              value={form.notas_generales}
              onChange={handleChange}
              rows={3}
              maxLength={300}
              placeholder="Alguna indicacion general..."
              className="w-full rounded-2xl border-2 border-crunchy-pink-soft bg-white px-4 py-3 outline-none transition-colors focus:border-crunchy-accent"
            />
          </section>
        </div>

        <div className="md:col-span-1">
          <div className="sticky top-24 rounded-kawaii bg-crunchy-pink-soft p-6">
            <h3 className="mb-4 font-display text-lg font-bold text-crunchy-dark">Resumen</h3>

            <div className="mb-4 space-y-2 border-b border-crunchy-pink pb-4">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span className="text-crunchy-dark">
                    {i.cantidad}x {i.nombre}
                  </span>
                  <span className="font-semibold text-crunchy-dark">{formatCLP(i.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="mb-2 flex justify-between text-sm">
              <span className="text-crunchy-muted">Subtotal</span>
              <span className="font-semibold text-crunchy-dark">{formatCLP(subtotal)}</span>
            </div>
            <div className="mb-4 flex justify-between text-sm">
              <span className="text-crunchy-muted">Delivery</span>
              <span className="font-semibold text-crunchy-dark">
                {form.tipo_entrega === "retiro" ? "Gratis" : formatCLP(costoDelivery)}
              </span>
            </div>

            <div className="mb-6 flex items-center justify-between border-t border-crunchy-pink pt-4">
              <span className="text-lg font-bold text-crunchy-dark">Total</span>
              <span className="text-2xl font-bold text-crunchy-accent">{formatCLP(total)}</span>
            </div>

            <Button type="submit" size="lg" loading={loading} disabled={!abierto} className="w-full">
              Confirmar pedido
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
