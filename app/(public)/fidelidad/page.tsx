import Link from "next/link";
import { Award, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/routes";

export default async function FidelidadPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: config } = await supabase
    .from("configuracion")
    .select("value")
    .eq("key", "fidelidad")
    .maybeSingle();

  const meta = (config?.value as { sellos_meta?: number } | null)?.sellos_meta ?? 10;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-3 font-display text-4xl font-bold text-crunchy-dark md:text-5xl">Tarjeta de fidelidad</h1>
        <p className="text-lg text-crunchy-muted">Cada pedido suma un sello. Al llegar a la meta, tu próximo plato es gratis.</p>
      </div>

      <div className="mb-10 rounded-kawaii bg-gradient-to-br from-crunchy-pink-soft to-crunchy-lavender p-6 shadow-kawaii">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-kawaii">
            <Award className="h-6 w-6 text-crunchy-accent" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-crunchy-dark">Así se ve tu tarjeta</h2>
            <p className="text-sm text-crunchy-muted">Cada compra suma un sello. A {meta} sellos, plato gratis</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
          {Array.from({ length: meta }).map((_, i) => (
            <div
              key={i}
              className="flex aspect-square items-center justify-center rounded-full border-2 border-crunchy-pink-soft bg-white text-lg font-bold text-crunchy-pink-soft"
            >
              {i + 1}
            </div>
          ))}
        </div>

        <p className="mt-4 text-center font-semibold text-crunchy-dark">0 / {meta} sellos</p>
      </div>

      <div className="mb-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-kawaii bg-white p-6 shadow-kawaii">
          <div className="mb-3 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-crunchy-accent" />
            <h3 className="font-semibold text-crunchy-dark">¿Cómo sumo sellos?</h3>
          </div>
          <p className="text-sm text-crunchy-muted">
            Con cada pedido confirmado (retiro o delivery) desde tu cuenta, sumas un sello automáticamente. No necesitas hacer nada más.
          </p>
        </div>
        <div className="rounded-kawaii bg-white p-6 shadow-kawaii">
          <div className="mb-3 flex items-center gap-3">
            <Gift className="h-6 w-6 text-crunchy-accent" />
            <h3 className="font-semibold text-crunchy-dark">¿Qué gano?</h3>
          </div>
          <p className="text-sm text-crunchy-muted">
            Al juntar {meta} sellos, tu próximo plato favorito es gratis. Puedes revisar tu progreso en cualquier momento desde tu cuenta.
          </p>
        </div>
      </div>

      <div className="text-center">
        {user ? (
          <Link href={ROUTES.MI_CUENTA}>
            <Button size="lg">Ver mi tarjeta</Button>
          </Link>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href={ROUTES.REGISTRO}>
              <Button size="lg">Crear cuenta</Button>
            </Link>
            <Link href={ROUTES.LOGIN}>
              <Button size="lg" variant="secondary">Ya tengo cuenta</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
