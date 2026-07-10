import Link from "next/link";
import { Wallet, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/routes";
import { formatCLP } from "@/lib/utils";
import { ZONAS_DELIVERY } from "@/lib/zonas";

const pasos = [
  {
    title: "Elige tus productos",
    desc: "Explora la carta y arma tu pedido: Bibimbap, Japchae o Pollo Frito Coreano, cada uno con sus propias opciones y toppings a elección.",
  },
  {
    title: "Retiro o delivery",
    desc: "Retira en Calle Cuatro 905, Pucón, sin costo, o pide delivery: calculamos la tarifa según tu zona o distancia.",
  },
  {
    title: "Paga seguro",
    desc: "Paga en línea con Flow.cl (débito, crédito o transferencia) o al recibir tu pedido, en efectivo o transferencia.",
  },
  {
    title: "Preparamos tu pedido",
    desc: "Cada pedido se cocina al momento en casa, apenas confirmamos tu compra — nada de comida esperando horas.",
  },
  {
    title: "Disfruta",
    desc: "Retiras tu pedido o te lo llevamos hasta la puerta. Te avisamos por WhatsApp para coordinar todo.",
  },
];

export default function ComoFuncionaPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-3 font-display text-4xl font-bold text-crunchy-dark md:text-5xl">Cómo funciona</h1>
        <p className="text-lg text-crunchy-muted">Todo lo que necesitas saber antes de pedir</p>
      </div>

      <div className="mb-16 space-y-6">
        {pasos.map((p, i) => (
          <div key={p.title} className="flex gap-5 rounded-kawaii bg-white p-6 shadow-kawaii">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-crunchy-pink-soft text-xl font-bold text-crunchy-accent">
              {i + 1}
            </div>
            <div>
              <h3 className="mb-1 font-display text-xl font-bold text-crunchy-dark">{p.title}</h3>
              <p className="text-crunchy-muted">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-16">
        <h2 className="mb-6 text-center font-display text-3xl font-bold text-crunchy-dark">Métodos de pago</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-kawaii bg-white p-6 shadow-kawaii">
            <div className="mb-3 flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-crunchy-accent" />
              <h3 className="font-semibold text-crunchy-dark">Flow.cl</h3>
            </div>
            <p className="text-sm text-crunchy-muted">Débito, crédito o transferencia, pagado en línea al confirmar tu pedido.</p>
          </div>
          <div className="rounded-kawaii bg-white p-6 shadow-kawaii">
            <div className="mb-3 flex items-center gap-3">
              <Wallet className="h-6 w-6 text-crunchy-accent" />
              <h3 className="font-semibold text-crunchy-dark">Al entregar o retirar</h3>
            </div>
            <p className="text-sm text-crunchy-muted">Efectivo o transferencia, directo cuando recibes o retiras tu pedido.</p>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="mb-2 text-center font-display text-3xl font-bold text-crunchy-dark">Zonas de delivery</h2>
        <p className="mb-6 text-center text-crunchy-muted">
          Fuera de estas zonas también entregamos hasta 10 km del centro de Pucón — la tarifa se calcula según la distancia exacta al confirmar tu dirección.
        </p>
        <div className="overflow-hidden rounded-kawaii bg-white shadow-kawaii">
          <div className="divide-y divide-crunchy-pink-soft">
            {ZONAS_DELIVERY.map((z) => (
              <div key={z.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold text-crunchy-dark">{z.nombre}</p>
                  <p className="text-sm text-crunchy-muted">{z.descripcion}</p>
                </div>
                <p className="shrink-0 font-bold text-crunchy-accent">{formatCLP(z.tarifa)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link href={ROUTES.CARTA}>
          <Button size="lg">Ver carta</Button>
        </Link>
      </div>
    </div>
  );
}
