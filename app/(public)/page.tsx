import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/public/Hero";
import { ProductCard } from "@/components/public/ProductCard";
import { HowItWorks } from "@/components/public/HowItWorks";
import { InfoStrip } from "@/components/public/InfoStrip";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/routes";
import type { Producto } from "@/types";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();
  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  const favoritos = (productos as Producto[] | null)?.slice(0, 3) ?? [];

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-10 text-center">
          <h2 className="mb-2 font-display text-4xl font-bold text-crunchy-dark">Nuestros favoritos</h2>
          <p className="text-crunchy-muted">Los platos más pedidos por nuestra comunidad</p>
        </div>

        {favoritos.length === 0 ? (
          <div className="py-12 text-center text-crunchy-muted">
            Aún no hay productos cargados. Ve al admin y agrega algunos.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {favoritos.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href={ROUTES.CARTA}>
            <Button size="lg" variant="secondary">Ver carta completa</Button>
          </Link>
        </div>
      </section>

      <HowItWorks />
      <InfoStrip />

      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="mb-4 font-display text-4xl font-bold text-crunchy-dark">¿Lista para tu próximo antojo?</h2>
        <p className="mb-8 text-crunchy-muted">Explora la carta y arma tu pedido en menos de 3 minutos.</p>
        <Link href={ROUTES.CARTA}>
          <Button size="lg">Pedir ahora</Button>
        </Link>
      </section>
    </>
  );
}
